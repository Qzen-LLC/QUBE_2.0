import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { reconcileFinOps } from "@/lib/architect";
import type { FinOpsOutput } from "@/lib/architect";
import { prismaClient } from "@/utils/db";

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const {
      useCaseId,
      finopsOutput,
      periodDays = 30,
      awsRegion,
      awsCostExplorerEnabled,
      mcpEnabled,
    } = body as {
      useCaseId: string;
      finopsOutput: FinOpsOutput;
      periodDays?: number;
      awsRegion?: string;
      awsCostExplorerEnabled?: boolean;
      mcpEnabled?: boolean;
    };

    if (!useCaseId || !finopsOutput) {
      return NextResponse.json(
        { error: "Missing useCaseId or finopsOutput" },
        { status: 400 }
      );
    }

    // Look up cost allocation tag from production config
    const prodConfig = await prismaClient.productionConfiguration.findUnique({
      where: { useCaseId },
      select: { costAllocationTagKey: true, costAllocationTagValue: true },
    });
    const costAllocationTag =
      prodConfig?.costAllocationTagKey && prodConfig?.costAllocationTagValue
        ? { key: prodConfig.costAllocationTagKey, value: prodConfig.costAllocationTagValue }
        : undefined;

    // Fetch last 12 historical records for trend data
    const historicalRecords = await prismaClient.costReconciliation.findMany({
      where: { useCaseId },
      orderBy: { reconciledAt: "desc" },
      take: 12,
      select: {
        totalProjected: true,
        totalActual: true,
        reconciledAt: true,
      },
    });

    const result = await reconcileFinOps({
      finopsOutput,
      useCaseId,
      periodDays,
      awsRegion,
      awsCostExplorerEnabled,
      mcpEnabled,
      costAllocationTag,
      historicalRecords: historicalRecords.map((r) => ({
        totalProjected: r.totalProjected,
        totalActual: r.totalActual,
        reconciledAt: r.reconciledAt.toISOString(),
      })),
    });

    // Persist reconciliation snapshot
    await prismaClient.costReconciliation.create({
      data: {
        useCaseId,
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

    console.log("[Reconcile API] source:", result.source, "totalActual:", result.totalActual, "totalProjected:", result.totalProjected);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FinOps reconciliation error:", message, error);
    return NextResponse.json(
      { error: "Reconciliation failed", detail: message },
      { status: 500 }
    );
  }
});
