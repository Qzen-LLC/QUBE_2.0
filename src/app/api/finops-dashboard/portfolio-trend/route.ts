import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { getOrgScope } from "@/lib/org-scope";

export const GET = withAuth(async (request, { auth }) => {
  try {
    const scope = await getOrgScope(auth);

    // Get org-scoped use case IDs with titles
    const useCases = await prismaClient.useCase.findMany({
      where: scope.whereClause,
      select: { id: true, title: true, aiucId: true },
    });

    const useCaseIds = useCases.map((uc) => uc.id);
    const useCaseMap = new Map(useCases.map((uc) => [uc.id, uc]));

    if (useCaseIds.length === 0) {
      return NextResponse.json({ trend: [], useCases: [] });
    }

    // Fetch all reconciliation history
    const reconciliations = await prismaClient.costReconciliation.findMany({
      where: { useCaseId: { in: useCaseIds } },
      orderBy: { reconciledAt: "asc" },
      select: {
        useCaseId: true,
        totalActual: true,
        totalProjected: true,
        reconciledAt: true,
      },
    });

    // Group by month (YYYY-MM), then by use case
    const monthlyData = new Map<
      string,
      Map<string, { actual: number; projected: number }>
    >();

    for (const rec of reconciliations) {
      const d = new Date(rec.reconciledAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map());
      }
      const monthMap = monthlyData.get(monthKey)!;

      // Keep the latest reconciliation per use case per month
      monthMap.set(rec.useCaseId, {
        actual: rec.totalActual,
        projected: rec.totalProjected,
      });
    }

    // Build trend array sorted by month
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    const trend = sortedMonths.map((month) => {
      const monthMap = monthlyData.get(month)!;
      const breakdown: Record<string, number> = {};
      let totalActual = 0;
      let totalProjected = 0;

      for (const [ucId, data] of monthMap) {
        const uc = useCaseMap.get(ucId);
        const label = uc ? `AIUC-${uc.aiucId}` : ucId;
        breakdown[label] = data.actual;
        totalActual += data.actual;
        totalProjected += data.projected;
      }

      return {
        month,
        totalActual,
        totalProjected,
        breakdown,
      };
    });

    return NextResponse.json({
      trend,
      useCases: useCases.map((uc) => ({
        id: uc.id,
        title: uc.title,
        label: `AIUC-${uc.aiucId}`,
      })),
    });
  } catch (err) {
    console.error("Portfolio trend error:", err);
    return NextResponse.json(
      { error: "Failed to fetch portfolio trend", details: String(err) },
      { status: 500 }
    );
  }
}, { requireUser: true });
