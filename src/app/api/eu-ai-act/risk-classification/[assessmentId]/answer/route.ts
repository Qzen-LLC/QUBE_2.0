import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { hasActiveExclusiveGovernanceLock } from '@/utils/locks';

export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ assessmentId: string }>, auth: any }
) => {
  try {
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { assessmentId } = await params;
    const { questionId, answer } = await request.json();

    // Get the assessment to check ownership
    const assessment = await prismaClient.euAiActAssessment.findUnique({
      where: { id: assessmentId },
      include: { useCase: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions
    if (userRecord.role !== 'QZEN_ADMIN') {
      if (userRecord.role === 'USER') {
        if (assessment.useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        if (assessment.useCase.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const hasLock = await hasActiveExclusiveGovernanceLock({
      useCaseId: assessment.useCaseId,
      userId: userRecord.id,
      scope: 'GOVERNANCE_EU_AI_ACT'
    });

    if (!hasLock) {
      return NextResponse.json(
        { error: 'Framework lock required to edit EU AI Act risk classification' },
        { status: 423 }
      );
    }

    // Upsert the risk classification answer
    const savedAnswer = await prismaClient.euAiActRiskClassificationAnswer.upsert({
      where: {
        assessmentId_questionId: {
          questionId,
          assessmentId
        }
      },
      update: {
        answer: JSON.stringify(answer),
        updatedAt: new Date()
      },
      create: {
        questionId,
        assessmentId,
        answer: JSON.stringify(answer)
      }
    });

    console.log('[CRUD_LOG] Risk classification answer saved:', {
      assessmentId,
      questionId,
      authoredBy: userRecord.id
    });

    return NextResponse.json(savedAnswer);
  } catch (error) {
    console.error('Error saving risk classification answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}, { requireUser: true });
