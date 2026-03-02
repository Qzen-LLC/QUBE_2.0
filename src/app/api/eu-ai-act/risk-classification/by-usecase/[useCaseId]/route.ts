import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const GET = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>, auth: any }
) => {
  try {
    const { useCaseId } = await params;

    // Check if use case exists and user has access
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
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

    // Find or create EU AI Act assessment
    let assessment = await prismaClient.euAiActAssessment.findUnique({
      where: { useCaseId },
      include: {
        riskClassificationAnswers: true,
        useCase: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!assessment) {
      // Create new assessment
      assessment = await prismaClient.euAiActAssessment.create({
        data: {
          useCaseId,
          status: 'in_progress',
          progress: 0,
          riskClassificationCompleted: false
        },
        include: {
          riskClassificationAnswers: true,
          useCase: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });
      console.log('[CRUD_LOG] EU AI Act Assessment created for risk classification:', {
        id: assessment.id,
        useCaseId,
        authoredBy: userRecord.id
      });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching risk classification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk classification' },
      { status: 500 }
    );
  }
}, { requireUser: true });
