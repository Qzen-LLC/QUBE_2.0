import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { buildStepsDataFromAnswers } from '@/lib/mappers/answers-to-steps';
import { getOrgScope } from '@/lib/org-scope';

export const GET = withAuth(async (request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get org-scoped filtering based on user role
    const scope = await getOrgScope(auth);

    // Build where clause from scope, with optional organizationId filter for admins
    const whereClause: any = { ...scope.whereClause };

    if (organizationId) {
      if (scope.isAdmin) {
        // QZEN_ADMIN can filter by any organization
        whereClause.organizationId = organizationId;
      } else if (scope.organizationId && organizationId !== scope.organizationId) {
        // Non-admin trying to access a different org
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
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
    if (scope.isAdmin) {
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
      userRole: scope.isAdmin ? 'QZEN_ADMIN' : (scope.organizationId ? 'ORG_USER' : 'USER'),
      userOrganizationId: scope.organizationId
    });
  } catch (error) {
    console.error('Error fetching use cases with risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch use cases with risks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });

