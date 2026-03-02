import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const GET = withAuth(async (
  request: Request,
  context: { params: Promise<{ useCaseId: string }>, auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper

    const { useCaseId } = await context.params;

    // Check if use case exists and user has access
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: context.auth.userId! },
      include: { organization: true }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify use case exists and user has access
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
    });

    if (!useCase) {
      return NextResponse.json({ 
        status: 'not_available',
        message: 'Use case not found',
        error: 'USE_CASE_NOT_FOUND'
      }, { status: 404 });
    }

    // Check permission
    const hasPermission = userRecord.role === 'QZEN_ADMIN' || 
                         (userRecord.role === 'ORG_ADMIN' && useCase.organizationId === userRecord.organizationId) ||
                         (userRecord.role === 'ORG_USER' && useCase.organizationId === userRecord.organizationId) ||
                         useCase.userId === userRecord.id;

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find or create UAE AI assessment
    let assessment = await prismaClient.uaeAiAssessment.findUnique({
      where: { useCaseId },
      include: {
        controls: {
          include: {
            control: true
          },
          orderBy: {
            control: {
              orderIndex: 'asc'
            }
          }
        }
      }
    });

    if (!assessment) {
      // Create new assessment
      assessment = await prismaClient.uaeAiAssessment.create({
        data: {
          useCaseId,
          status: 'in_progress',
          progress: 0,
          riskImpactLevel: 'low' // Default to low impact
        },
        include: {
          controls: {
            include: {
              control: true
            },
            orderBy: {
              control: {
                orderIndex: 'asc'
              }
            }
          }
        }
      });
      console.log('[CRUD_LOG] UAE AI Assessment created:', { id: assessment.id, useCaseId, status: assessment.status, progress: assessment.progress, authoredBy: userRecord.id });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching UAE AI assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}, { requireUser: true });