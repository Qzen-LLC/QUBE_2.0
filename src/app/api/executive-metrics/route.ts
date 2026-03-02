import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';



export const GET = withAuth(async (_req: Request, { auth }) => {
  const startTime = Date.now();


  try {
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });


    if (!userRecord) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });





    // Build base query based on role
    const baseWhere =
      userRecord.role === 'QZEN_ADMIN'
        ? {}
        : userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER'
        ? { organizationId: userRecord.organizationId }
        : { userId: userRecord.id };


    const dbStart = Date.now();


    const [totalUseCases, stageDistribution, priorityDistribution, avgScores, complexityAvg, confidenceAvg] =
      await Promise.all([
        prismaClient.useCase.count({ where: baseWhere }),
        prismaClient.useCase.groupBy({
          by: ['stage'],
          where: baseWhere,
          _count: { _all: true }
        }),
        prismaClient.useCase.groupBy({
          by: ['priority'],
          where: baseWhere,
          _count: { _all: true }
        }),
        prismaClient.useCase.aggregate({
          where: baseWhere,
          _avg: {
            operationalImpactScore: true,
            productivityImpactScore: true,
            revenueImpactScore: true
          },
          _sum: {
            operationalImpactScore: true,
            productivityImpactScore: true,
            revenueImpactScore: true
          }
        }),
        prismaClient.useCase.aggregate({
          where: baseWhere,
          _avg: { implementationComplexity: true }
        }),
        prismaClient.useCase.aggregate({
          where: baseWhere,
          _avg: { confidenceLevel: true }
        })
      ]);


    // We still need full use cases only for remaining business logic (risk, approvals, etc.)
    const fullUseCases = await prismaClient.useCase.findMany({
      where: baseWhere,
      select: {
        implementationComplexity: true,
        confidenceLevel: true,
        businessFunction: true,
        operationalImpactScore: true,
        productivityImpactScore: true,
        revenueImpactScore: true,
        priority: true,
        finopsData: true,
        Approval: true
      }
    });


    const dbEnd = Date.now();


    const riskDistribution = { Low: 0, Medium: 0, High: 0 };
    const approvalStatus = {
      governance: { approved: 0, pending: 0, rejected: 0 },
      risk: { approved: 0, pending: 0, rejected: 0 },
      legal: { approved: 0, pending: 0, rejected: 0 },
      business: { approved: 0, pending: 0, rejected: 0 }
    };
    const functionPerformance: Record<string, any> = {};
    let totalInvestment = 0, cumValue = 0, roiSum = 0, finopsCount = 0;
    let devCost = 0, infraCost = 0, opCost = 0, apiCost = 0;
    let quickWins = 0, highImpactLowComplexity = 0;


    for (const uc of fullUseCases) {
      const { implementationComplexity, confidenceLevel, businessFunction, operationalImpactScore, productivityImpactScore, revenueImpactScore, finopsData, Approval } = uc;


      // Risk Calculation
      if (implementationComplexity >= 7 && confidenceLevel <= 40) riskDistribution.High++;
      else if (implementationComplexity >= 4 || confidenceLevel <= 60) riskDistribution.Medium++;
      else riskDistribution.Low++;


      // Approval Status
     type ApprovalCategory = 'governance' | 'risk' | 'legal' | 'business';
type ApprovalStatus = 'approved' | 'rejected' | 'pending';


const approvalStatus: Record<ApprovalCategory, Record<ApprovalStatus, number>> = {
  governance: { approved: 0, rejected: 0, pending: 0 },
  risk: { approved: 0, rejected: 0, pending: 0 },
  legal: { approved: 0, rejected: 0, pending: 0 },
  business: { approved: 0, rejected: 0, pending: 0 },
};


const approvalFields = ['governanceStatus', 'riskStatus', 'legalStatus', 'businessStatus'] as const;


const fieldMap: Record<(typeof approvalFields)[number], ApprovalCategory> = {
  governanceStatus: 'governance',
  riskStatus: 'risk',
  legalStatus: 'legal',
  businessStatus: 'business',
};


approvalFields.forEach((field) => {
  const category = fieldMap[field];
  const status = (Approval?.[field] || 'pending') as ApprovalStatus;


  if (status in approvalStatus[category]) {
    approvalStatus[category][status]++;
  }
});




      // FinOps
      if (finopsData) {
        totalInvestment += finopsData.totalInvestment || 0;
        cumValue += finopsData.cumValue || 0;
        roiSum += finopsData.ROI || 0;
        finopsCount++;
        devCost += finopsData.devCostBase || 0;
        infraCost += finopsData.infraCostBase || 0;
        opCost += finopsData.opCostBase || 0;
        apiCost += finopsData.apiCostBase || 0;
      }


      // Business Function Aggregation
      const func = businessFunction || 'Other';
      if (!functionPerformance[func]) {
        functionPerformance[func] = {
          function: func,
          count: 0,
          totalOperational: 0,
          totalProductivity: 0,
          totalRevenue: 0,
          totalInvestment: 0,
          totalROI: 0
        };
      }
      const entry = functionPerformance[func];
      entry.count++;
      entry.totalOperational += operationalImpactScore || 0;
      entry.totalProductivity += productivityImpactScore || 0;
      entry.totalRevenue += revenueImpactScore || 0;
      if (finopsData) {
        entry.totalInvestment += finopsData.totalInvestment || 0;
        entry.totalROI += finopsData.ROI || 0;
      }


      const avgImpact = ((operationalImpactScore || 0) + (productivityImpactScore || 0) + (revenueImpactScore || 0)) / 3;
      if (implementationComplexity <= 3 && avgImpact >= 7) quickWins++;
      if (implementationComplexity <= 5 && avgImpact >= 8) highImpactLowComplexity++;
    }


    const response = {
      portfolio: {
        totalUseCases,
        stageDistribution: Object.fromEntries(stageDistribution.map(s => [s.stage, s._count._all])),
        priorityDistribution: Object.fromEntries(priorityDistribution.map(p => [p.priority || 'medium', p._count._all])),
        impactScores: {
          operational: {
            average: avgScores._avg.operationalImpactScore || 0,
            total: avgScores._sum.operationalImpactScore || 0
          },
          productivity: {
            average: avgScores._avg.productivityImpactScore || 0,
            total: avgScores._sum.productivityImpactScore || 0
          },
          revenue: {
            average: avgScores._avg.revenueImpactScore || 0,
            total: avgScores._sum.revenueImpactScore || 0
          }
        },
        overallScore:
          ((avgScores._avg.operationalImpactScore || 0) +
            (avgScores._avg.productivityImpactScore || 0) +
            (avgScores._avg.revenueImpactScore || 0)) / 3,
        complexityAnalysis: {
          average: complexityAvg._avg.implementationComplexity || 0
        },
        confidenceAnalysis: {
          average: confidenceAvg._avg.confidenceLevel || 0
        }
      },
      financial: {
        totalInvestment,
        projectedValue: cumValue,
        netValue: cumValue - totalInvestment,
        averageROI: finopsCount > 0 ? roiSum / finopsCount : 0,
        costBreakdown: {
          development: devCost,
          infrastructure: infraCost,
          operations: opCost,
          api: apiCost
        }
      },
      risk: {
        totalAssessed: fullUseCases.length,
        riskDistribution,
        approvalStatus
      },
      strategic: {
        businessFunctionPerformance: Object.values(functionPerformance).map(entry => ({
          ...entry,
          avgOperationalScore: entry.totalOperational / entry.count,
          avgProductivityScore: entry.totalProductivity / entry.count,
          avgRevenueScore: entry.totalRevenue / entry.count,
          averageROI: entry.totalROI / entry.count
        })),
        portfolioBalance: {
          quickWins,
          highImpactLowComplexity
        }
      }
    };





    const end = Date.now();


    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-API-RTT': (end - startTime).toString(),
        'X-Server-Response-Time': (end - startTime).toString(),
        'X-DB-Query-Time': (dbEnd - dbStart).toString()
      }
    });
  } catch (error) {
    console.error('Error in executive-metrics:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });