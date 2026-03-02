import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { calculateRiskLevel } from '@/lib/framework-data/eu-ai-act-risk-classification';
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

    // Get the assessment with all answers
    const assessment = await prismaClient.euAiActAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        useCase: true,
        riskClassificationAnswers: true
      }
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
        { error: 'Framework lock required to complete EU AI Act risk classification' },
        { status: 423 }
      );
    }

    // Parse all answers
    const answers: Record<string, any> = {};
    assessment.riskClassificationAnswers.forEach(ans => {
      try {
        answers[ans.questionId] = JSON.parse(ans.answer);
      } catch (e) {
        answers[ans.questionId] = ans.answer;
      }
    });

    // Calculate risk level
    const classification = calculateRiskLevel(answers);

    // Update assessment with classification results
    const updatedAssessment = await prismaClient.euAiActAssessment.update({
      where: { id: assessmentId },
      data: {
        riskClassificationCompleted: true,
        riskLevel: classification.riskLevel,
        riskLevelRationale: classification.rationale,
        applicableAnnexCategories: classification.applicableCategories,
        hasProhibitedPractices: classification.prohibitedPractices.length > 0,
        prohibitedPracticesList: classification.prohibitedPractices,
        isSubjectToAct: classification.riskLevel === 'high' || classification.riskLevel === 'prohibited',
        classificationDate: new Date()
      },
      include: {
        riskClassificationAnswers: true
      }
    });

    console.log('[CRUD_LOG] Risk classification completed:', {
      assessmentId,
      riskLevel: classification.riskLevel,
      categories: classification.applicableCategories.length,
      authoredBy: userRecord.id
    });

    return NextResponse.json({
      assessment: updatedAssessment,
      classification
    });
  } catch (error) {
    console.error('Error completing risk classification:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to complete classification',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}, { requireUser: true });
