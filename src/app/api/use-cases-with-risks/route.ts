import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { buildStepsDataFromAnswers } from '@/lib/mappers/answers-to-steps';

export const GET = withAuth(async (request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get user data from database
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: {
        organization: true
      }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause based on role
    let whereClause: any = {};

    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can see all use cases
      // If organizationId is provided, filter by it
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
    } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
      // ORG_ADMIN and ORG_USER can only see use cases in their organization
      whereClause.organizationId = userRecord.organizationId;
      
      // If organizationId query param is provided and different, they can't access it
      if (organizationId && organizationId !== userRecord.organizationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // USER role can only see their own use cases
      whereClause.userId = userRecord.id;
    }

    // Fetch use cases with their risks
    const useCases = await prismaClient.useCase.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        risks: {
          orderBy: [
            { status: 'asc' },
            { riskScore: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        answers: {
          include: {
            question: true,
            questionTemplate: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Fetch all organizations for QZEN_ADMIN
    let organizations = [];
    if (userRecord.role === 'QZEN_ADMIN') {
      organizations = await prismaClient.organization.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      });
    }

    // Build stepsData from answers for each use case (replacing assessData)
    const useCasesWithStepsData = await Promise.all(
      useCases.map(async (useCase) => {
        const stepsData = await buildStepsDataFromAnswers(useCase.id);
        return {
          ...useCase,
          assessData: {
            stepsData,
            updatedAt: useCase.updatedAt,
            createdAt: useCase.createdAt,
          }
        };
      })
    );

    return NextResponse.json({
      useCases: useCasesWithStepsData,
      organizations,
      userRole: userRecord.role,
      userOrganizationId: userRecord.organizationId
    });
  } catch (error) {
    console.error('Error fetching use cases with risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch use cases with risks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });

