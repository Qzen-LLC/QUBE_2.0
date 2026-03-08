import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { getOrgScope } from '@/lib/org-scope';

export const GET = withAuth(async (request, { auth }) => {
  try {
    // Get org-scoped filtering based on user role
    const scope = await getOrgScope(auth);

    // Include all use cases that have FinOps data, regardless of stage
    const whereClause: any = {
      ...scope.whereClause,
      finopsData: { isNot: null },
    };

    // Fetch all use cases with their FinOps data and relevant fields
    const useCases = await prismaClient.useCase.findMany({
      where: whereClause,
      select: {
        id: true,
        aiucId: true,
        title: true,
        stage: true,
        primaryStakeholders: true,
        organization: { select: { name: true } },
        finopsData: {
          select: {
            ROI: true,
            netValue: true,
            apiCostBase: true,
            cumOpCost: true,
            cumValue: true,
            devCostBase: true,
            infraCostBase: true,
            opCostBase: true,
            totalInvestment: true,
            valueBase: true,
            valueGrowthRate: true,
            breakEvenMonth: true,
            budgetRange: true,
            source: true,
            lastAggregatedAt: true,
          },
        },
      },
    });

    // Map to FinOpsData[]
    const finops = useCases.map(uc => ({
      useCaseId: uc.id,
      ROI: uc.finopsData?.ROI ?? 0,
      netValue: uc.finopsData?.netValue ?? 0,
      apiCostBase: uc.finopsData?.apiCostBase ?? 0,
      cumOpCost: uc.finopsData?.cumOpCost ?? 0,
      cumValue: uc.finopsData?.cumValue ?? 0,
      devCostBase: uc.finopsData?.devCostBase ?? 0,
      infraCostBase: uc.finopsData?.infraCostBase ?? 0,
      opCostBase: uc.finopsData?.opCostBase ?? 0,
      totalInvestment: uc.finopsData?.totalInvestment ?? 0,
      valueBase: uc.finopsData?.valueBase ?? 0,
      valueGrowthRate: uc.finopsData?.valueGrowthRate ?? 0,
      breakEvenMonth: uc.finopsData?.breakEvenMonth ?? null,
      budgetRange: uc.finopsData?.budgetRange ?? '',
      source: uc.finopsData?.source ?? 'manual',
      lastAggregatedAt: uc.finopsData?.lastAggregatedAt ?? null,
      useCase: {
        title: uc.title,
        owner: uc.primaryStakeholders?.[0] || '',
        stage: uc.stage,
        aiucId: uc.aiucId,
      },
      organizationName: uc.organization?.name || '',
    }));

    // Fetch latest reconciliation per use case for actual spend KPIs
    const useCaseIds = useCases.map(uc => uc.id);
    let actualSpendKPIs = {
      totalActualSpend: 0,
      portfolioVariance: 0,
      useCasesOverBudget: 0,
      reconciled: 0,
    };

    if (useCaseIds.length > 0) {
      const recentReconciliations = await prismaClient.costReconciliation.findMany({
        where: { useCaseId: { in: useCaseIds } },
        orderBy: { reconciledAt: 'desc' },
        select: {
          useCaseId: true,
          totalActual: true,
          totalProjected: true,
          totalVariancePercent: true,
        },
      });

      // Deduplicate: keep latest per use case
      const latestByUseCase = new Map<string, typeof recentReconciliations[0]>();
      for (const rec of recentReconciliations) {
        if (!latestByUseCase.has(rec.useCaseId)) {
          latestByUseCase.set(rec.useCaseId, rec);
        }
      }

      let totalActual = 0;
      let weightedVarianceSum = 0;
      let totalProjectedSum = 0;
      let overBudgetCount = 0;

      for (const rec of latestByUseCase.values()) {
        totalActual += rec.totalActual;
        weightedVarianceSum += rec.totalVariancePercent * rec.totalProjected;
        totalProjectedSum += rec.totalProjected;
        if (Math.abs(rec.totalVariancePercent) > 10) overBudgetCount++;
      }

      actualSpendKPIs = {
        totalActualSpend: totalActual,
        portfolioVariance: totalProjectedSum > 0
          ? Math.round((weightedVarianceSum / totalProjectedSum) * 100) / 100
          : 0,
        useCasesOverBudget: overBudgetCount,
        reconciled: latestByUseCase.size,
      };
    }

    return NextResponse.json({ finops, actualSpendKPIs });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch FinOps dashboard data', details: String(err) }, { status: 500 });
  }
}, { requireUser: true });