import { NextResponse } from "next/server";
import { prismaClient } from "@/utils/db";
import { reconcileFinOps } from "@/lib/architect";
import { checkAndNotifyFinOpsAnomalies } from "@/lib/notifications/finops-alerts";

/**
 * Cron-triggered auto-reconciliation for use cases with autoReconcile enabled.
 * Secured by CRON_SECRET header check (for Cloud Run / Vercel cron).
 */
export async function POST(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all production configs with autoReconcile enabled
    const configs = await prismaClient.productionConfiguration.findMany({
      where: { autoReconcile: true },
      select: {
        useCaseId: true,
        awsRegion: true,
        awsCostExplorerEnabled: true,
        costAllocationTagKey: true,
        costAllocationTagValue: true,
        reconcileFrequency: true,
      },
    });

    if (configs.length === 0) {
      return NextResponse.json({ message: "No use cases with auto-reconcile enabled", reconciled: 0 });
    }

    // Check frequency — only run if it's time
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const dayOfMonth = now.getDate();

    const results: Array<{ useCaseId: string; status: string; error?: string }> = [];

    for (const config of configs) {
      if (!config.useCaseId) continue;

      // Frequency check
      const freq = config.reconcileFrequency || "weekly";
      if (freq === "weekly" && dayOfWeek !== 1) continue; // Monday only
      if (freq === "monthly" && dayOfMonth !== 1) continue; // 1st of month only

      try {
        // Fetch finops data for this use case
        const finopsData = await prismaClient.finOps.findUnique({
          where: { useCaseId: config.useCaseId },
          select: {
            apiCostBase: true,
            infraCostBase: true,
            opCostBase: true,
          },
        });

        if (!finopsData) {
          results.push({ useCaseId: config.useCaseId, status: "skipped", error: "No FinOps data" });
          continue;
        }

        // Build a minimal FinOpsOutput-compatible object for reconciliation
        const totalMonthlyCost = finopsData.apiCostBase + finopsData.infraCostBase + finopsData.opCostBase;
        const finopsOutput = {
          summaryMonthlyLow: totalMonthlyCost * 0.8,
          summaryMonthlyMid: totalMonthlyCost,
          summaryMonthlyHigh: totalMonthlyCost * 1.2,
          lineItems: [
            { category: "api_costs", description: "API costs", monthlyCostLow: finopsData.apiCostBase * 0.8, monthlyCostMid: finopsData.apiCostBase, monthlyCostHigh: finopsData.apiCostBase * 1.2, unit: "USD/month", calculationBasis: "aggregated", sourcePillar: "finops" },
            { category: "infrastructure", description: "Infrastructure", monthlyCostLow: finopsData.infraCostBase * 0.8, monthlyCostMid: finopsData.infraCostBase, monthlyCostHigh: finopsData.infraCostBase * 1.2, unit: "USD/month", calculationBasis: "aggregated", sourcePillar: "finops" },
            { category: "operations", description: "Operations", monthlyCostLow: finopsData.opCostBase * 0.8, monthlyCostMid: finopsData.opCostBase, monthlyCostHigh: finopsData.opCostBase * 1.2, unit: "USD/month", calculationBasis: "aggregated", sourcePillar: "finops" },
          ],
          projections12m: [],
          oneTimeCosts: [],
          assumptions: [],
          narrative: "",
        } as const;

        const costAllocationTag =
          config.costAllocationTagKey && config.costAllocationTagValue
            ? { key: config.costAllocationTagKey, value: config.costAllocationTagValue }
            : undefined;

        // Fetch historical records for trend
        const historicalRecords = await prismaClient.costReconciliation.findMany({
          where: { useCaseId: config.useCaseId },
          orderBy: { reconciledAt: "desc" },
          take: 12,
          select: { totalProjected: true, totalActual: true, reconciledAt: true },
        });

        const result = await reconcileFinOps({
          finopsOutput,
          useCaseId: config.useCaseId,
          periodDays: 30,
          awsRegion: config.awsRegion || undefined,
          awsCostExplorerEnabled: config.awsCostExplorerEnabled,
          costAllocationTag,
          historicalRecords: historicalRecords.map((r) => ({
            totalProjected: r.totalProjected,
            totalActual: r.totalActual,
            reconciledAt: r.reconciledAt.toISOString(),
          })),
        });

        // Persist
        await prismaClient.costReconciliation.create({
          data: {
            useCaseId: config.useCaseId,
            periodStart: result.periodStart,
            periodEnd: result.periodEnd,
            totalProjected: result.totalProjected,
            totalActual: result.totalActual,
            totalVarianceAmount: result.totalVarianceAmount,
            totalVariancePercent: result.totalVariancePercent,
            varianceLines: result.varianceLines as unknown as Record<string, unknown>[],
            anomalies: result.anomalies as unknown as Record<string, unknown>[],
            trendData: result.trendData as unknown as Record<string, unknown>[],
            narrative: result.narrative,
            source: result.source,
          },
        });

        // Check for anomalies and notify
        await checkAndNotifyFinOpsAnomalies({
          useCaseId: config.useCaseId,
          totalVariancePercent: result.totalVariancePercent,
          anomalies: result.anomalies,
        });

        results.push({ useCaseId: config.useCaseId, status: "reconciled" });
      } catch (err) {
        results.push({
          useCaseId: config.useCaseId,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      message: `Auto-reconciliation complete`,
      reconciled: results.filter((r) => r.status === "reconciled").length,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron finops-reconcile error:", error);
    return NextResponse.json(
      { error: "Auto-reconciliation failed", detail: String(error) },
      { status: 500 }
    );
  }
}
