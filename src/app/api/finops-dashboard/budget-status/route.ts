import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { getOrgScope } from "@/lib/org-scope";

export const GET = withAuth(async (request, { auth }) => {
  try {
    const scope = await getOrgScope(auth);

    // Get all use cases in the org
    const useCases = await prismaClient.useCase.findMany({
      where: scope.whereClause,
      select: { id: true },
    });

    const useCaseIds = useCases.map((uc) => uc.id);

    if (useCaseIds.length === 0) {
      return NextResponse.json({ budgetStatus: {} });
    }

    // Get the latest CostReconciliation per use case using a raw query approach
    // Prisma doesn't support DISTINCT ON, so we fetch recent records and deduplicate
    const recentReconciliations = await prismaClient.costReconciliation.findMany({
      where: { useCaseId: { in: useCaseIds } },
      orderBy: { reconciledAt: "desc" },
      select: {
        useCaseId: true,
        totalVariancePercent: true,
        reconciledAt: true,
      },
    });

    // Deduplicate: keep only the latest per useCaseId
    const latestByUseCase = new Map<
      string,
      { variance: number; status: string; lastReconciled: string }
    >();

    for (const rec of recentReconciliations) {
      if (latestByUseCase.has(rec.useCaseId)) continue;

      const absVariance = Math.abs(rec.totalVariancePercent);
      let status: string;
      if (absVariance <= 10) {
        status = "on_budget";
      } else if (absVariance <= 25) {
        status = "over_budget";
      } else {
        status = "alert";
      }

      latestByUseCase.set(rec.useCaseId, {
        variance: rec.totalVariancePercent,
        status,
        lastReconciled: rec.reconciledAt.toISOString(),
      });
    }

    const budgetStatus: Record<string, { variance: number; status: string; lastReconciled: string }> =
      Object.fromEntries(latestByUseCase);

    return NextResponse.json({ budgetStatus });
  } catch (err) {
    console.error("Budget status error:", err);
    return NextResponse.json(
      { error: "Failed to fetch budget status", details: String(err) },
      { status: 500 }
    );
  }
}, { requireUser: true });
