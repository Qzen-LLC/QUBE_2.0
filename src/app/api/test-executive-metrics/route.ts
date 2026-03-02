import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

export const GET = withAuth(async (request, { auth }) => {
  try {
    // Get current user
    // auth context is provided by withAuth wrapper
    
    // Get user data from database
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Test data structure
    const testMetrics = {
      portfolio: {
        totalUseCases: 5,
        stageDistribution: {
          'discovery': 2,
          'in-progress': 2,
          'deployment': 1
        },
        impactScores: {
          operational: { average: 7.5, total: 37.5 },
          productivity: { average: 6.8, total: 34 },
          revenue: { average: 8.2, total: 41 }
        },
        overallScore: 7.5,
        complexityAnalysis: {
          average: 5.2,
          distribution: { low: 2, medium: 2, high: 1 }
        },
        confidenceAnalysis: {
          average: 75,
          distribution: { low: 1, medium: 2, high: 2 }
        }
      },
      financial: {
        totalInvestment: 150000,
        averageROI: 25.5,
        projectedValue: 200000,
        netValue: 50000,
        costBreakdown: {
          development: 80000,
          infrastructure: 30000,
          operations: 25000,
          api: 15000
        }
      },
      risk: {
        totalAssessed: 5,
        riskDistribution: {
          Low: 2,
          Medium: 2,
          High: 1
        },
        approvalStatus: {
          governance: { approved: 3, pending: 1, rejected: 1 },
          risk: { approved: 2, pending: 2, rejected: 1 },
          legal: { approved: 4, pending: 1, rejected: 0 },
          business: { approved: 3, pending: 2, rejected: 0 }
        }
      },
      strategic: {
        businessFunctionPerformance: [
          {
            function: 'Operations',
            count: 2,
            avgOperationalScore: 8.5,
            avgProductivityScore: 7.0,
            avgRevenueScore: 6.5,
            totalInvestment: 60000,
            averageROI: 30.0
          },
          {
            function: 'Marketing',
            count: 3,
            avgOperationalScore: 6.8,
            avgProductivityScore: 7.5,
            avgRevenueScore: 8.8,
            totalInvestment: 90000,
            averageROI: 22.5
          }
        ],
        portfolioBalance: {
          quickWins: 2,
          highImpactLowComplexity: 1
        }
      }
    };

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        organizationId: userRecord.organizationId
      },
      testMetrics,
      message: 'Executive metrics test endpoint working correctly'
    });

  } catch (error) {
    console.error('Error in test executive metrics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });