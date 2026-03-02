import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

import { calculateMaturityScore } from '@/lib/framework-data/uae-ai-scoring';

export const PATCH = withAuth(async (
  request: Request,
  { params, auth }: { params: { assessmentId: string }, auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper

    const { assessmentId } = params;
    const body = await request.json();
    const { riskImpactLevel } = body;

    // Verify assessment exists and user has access
    const assessment = await prismaClient.uaeAiAssessment.findUnique({
      where: { id: assessmentId },
      include: { useCase: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check user permission
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasPermission = userRecord.role === 'QZEN_ADMIN' || 
                         (userRecord.role === 'ORG_ADMIN' && assessment.useCase.organizationId === userRecord.organizationId) ||
                         (userRecord.role === 'ORG_USER' && assessment.useCase.organizationId === userRecord.organizationId) ||
                         assessment.useCase.userId === userRecord.id;

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update risk impact level
    await prismaClient.uaeAiAssessment.update({
      where: { id: assessmentId },
      data: { riskImpactLevel }
    });
    console.log('[CRUD_LOG] UAE AI Assessment risk impact updated:', { id: assessmentId, riskImpactLevel, updatedAt: new Date(), authoredBy: userRecord.id });

    // Recalculate scores with new risk impact level
    await recalculateAssessmentScores(assessmentId, riskImpactLevel);

    // Return updated assessment
    const updatedAssessment = await prismaClient.uaeAiAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        controls: {
          include: { control: true },
          orderBy: { control: { orderIndex: 'asc' } }
        }
      }
    });

    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error('Error updating UAE AI assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}, { requireUser: true });

async function recalculateAssessmentScores(assessmentId: string, riskImpactLevel: string) {
  try {
    // No auth required here; called from authenticated handler

    // Get all control instances for this assessment
    const controlInstances = await prismaClient.uaeAiControlInstance.findMany({
      where: { assessmentId }
    });

    // Calculate progress
    const implementedControls = controlInstances.filter(ci => ci.implementation?.trim()).length;
    const totalControls = 14;
    const progress = totalControls > 0 ? (implementedControls / totalControls) * 100 : 0;

    // Calculate maturity score with new risk impact level
    const controlScores = controlInstances.map(ci => ({
      controlId: ci.controlId,
      score: ci.score
    }));

    const maturityData = calculateMaturityScore(
      controlScores,
      riskImpactLevel as 'low' | 'significant' | 'critical'
    );

    // Update assessment
    await prismaClient.uaeAiAssessment.update({
      where: { id: assessmentId },
      data: {
        progress,
        totalScore: maturityData.totalScore,
        weightedScore: maturityData.weightedScore,
        maturityLevel: maturityData.maturityLevel,
        riskImpactLevel
      }
    });
    console.log('[CRUD_LOG] UAE AI Assessment scores updated:', { id: assessmentId, totalScore: maturityData.totalScore, weightedScore: maturityData.weightedScore, maturityLevel: maturityData.maturityLevel, updatedAt: new Date() });
  } catch (error) {
    console.error('Error recalculating assessment scores:', error);
  }
}