import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { hasActiveExclusiveGovernanceLock } from '@/utils/locks';


export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: { assessmentId: string }, auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { assessmentId } = params;
    const { questionId, answer, evidenceFiles } = await request.json();

    // Get the assessment to check ownership
    const assessment = await prismaClient.euAiActAssessment.findUnique({
      where: { id: assessmentId },
      include: { useCase: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      if (userRecord.role === 'USER') {
        // USER can only update their own assessments
        if (assessment.useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        // ORG_ADMIN and ORG_USER can only update assessments in their organization
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
        { error: 'Framework lock required to edit EU AI Act assessment answers' },
        { status: 423 }
      );
    }

    // Upsert the answer
    const savedAnswer = await prismaClient.euAiActAnswer.upsert({
      where: {
        questionId_assessmentId: {
          questionId,
          assessmentId
        }
      },
      update: {
        answer,
        evidenceFiles,
        status: answer.trim() ? 'completed' : 'pending',
        updatedAt: new Date()
      },
      create: {
        questionId,
        assessmentId,
        answer,
        evidenceFiles,
        status: answer.trim() ? 'completed' : 'pending'
      }
    });

    return NextResponse.json(savedAnswer);
  } catch (error) {
    console.error('Error saving EU AI ACT answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}, { requireUser: true });