import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { getOrgScope } from "@/lib/org-scope";

export const GET = withAuth(async (request, { auth }) => {
  try {
    const scope = await getOrgScope(auth);
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity"); // "high" | "medium" | "low"
    const category = searchParams.get("category");

    // Get org-scoped use case IDs
    const useCases = await prismaClient.useCase.findMany({
      where: scope.whereClause,
      select: { id: true, title: true, aiucId: true },
    });

    const useCaseMap = new Map(useCases.map((uc) => [uc.id, uc]));
    const useCaseIds = useCases.map((uc) => uc.id);

    if (useCaseIds.length === 0) {
      return NextResponse.json({ anomalies: [] });
    }

    // Fetch recent reconciliations that have anomalies
    const reconciliations = await prismaClient.costReconciliation.findMany({
      where: {
        useCaseId: { in: useCaseIds },
      },
      orderBy: { reconciledAt: "desc" },
      take: 200,
      select: {
        id: true,
        useCaseId: true,
        totalVariancePercent: true,
        anomalies: true,
        reconciledAt: true,
        totalProjected: true,
        totalActual: true,
      },
    });

    // Flatten anomalies across all reconciliations
    const allAnomalies: Array<{
      useCaseId: string;
      useCaseTitle: string;
      aiucId: number;
      category: string;
      variancePercent: number;
      message: string;
      reconciledAt: string;
      projectedImpact: number;
      severity: string;
    }> = [];

    for (const rec of reconciliations) {
      const anomalies = rec.anomalies as Array<{
        category?: string;
        variance_percent?: number;
        message?: string;
      }> | null;

      if (!anomalies || !Array.isArray(anomalies) || anomalies.length === 0) continue;

      const uc = useCaseMap.get(rec.useCaseId);
      if (!uc) continue;

      for (const anomaly of anomalies) {
        const absVariance = Math.abs(anomaly.variance_percent ?? 0);
        const sev = absVariance > 50 ? "high" : absVariance > 25 ? "medium" : "low";

        if (severity && sev !== severity) continue;
        if (category && anomaly.category !== category) continue;

        allAnomalies.push({
          useCaseId: rec.useCaseId,
          useCaseTitle: uc.title,
          aiucId: uc.aiucId,
          category: anomaly.category ?? "unknown",
          variancePercent: anomaly.variance_percent ?? 0,
          message: anomaly.message ?? "",
          reconciledAt: rec.reconciledAt.toISOString(),
          projectedImpact: Math.abs(rec.totalActual - rec.totalProjected) * 12,
          severity: sev,
        });
      }
    }

    // Sort by severity (high first), then by variance
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    allAnomalies.sort((a, b) => {
      const s = (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
      if (s !== 0) return s;
      return Math.abs(b.variancePercent) - Math.abs(a.variancePercent);
    });

    return NextResponse.json({ anomalies: allAnomalies });
  } catch (err) {
    console.error("Anomalies API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch anomalies", details: String(err) },
      { status: 500 }
    );
  }
}, { requireUser: true });
