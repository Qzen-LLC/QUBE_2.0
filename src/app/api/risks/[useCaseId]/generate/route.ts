import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { getRiskIdentificationEngine } from '@/lib/qube-ai-nexus/risk-identification-engine';
import { buildAssessmentContext, formatContextForPrompt } from '@/lib/assessment/assessment-context-builder';

/**
 * POST /api/risks/[useCaseId]/generate
 *
 * Generate and score risks using the LLM-powered risk engine with
 * full assessment context (real + inferred answers).
 *
 * Body: { dryRun?: boolean }
 *   - dryRun=true: returns scored risks without persisting
 *   - dryRun=false: persists scored risks to the Risk model
 */
export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }
) => {
  const { useCaseId } = await params;
  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: 'LLM_CONFIGURATION_REQUIRED',
      message: 'Risk generation requires OpenAI API key.',
    }, { status: 503 });
  }

  // Load use case
  const useCase = await prismaClient.useCase.findUnique({
    where: { id: useCaseId },
    select: {
      id: true,
      title: true,
      problemStatement: true,
      proposedAISolution: true,
      currentState: true,
      desiredState: true,
      successCriteria: true,
      aiType: true,
    },
  });

  if (!useCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  // Build assessment context
  let assessmentContextText: string | undefined;
  try {
    const context = await buildAssessmentContext(useCaseId);
    assessmentContextText = formatContextForPrompt(context);
  } catch (err) {
    console.warn('Could not build assessment context for risk generation:', err);
  }

  // Run risk identification + scoring
  const engine = getRiskIdentificationEngine();
  const result = await engine.identifyAndScoreRisks(
    {
      useCaseTitle: useCase.title,
      useCaseDescription: `${useCase.problemStatement}\n\n${useCase.proposedAISolution}`,
      problemStatement: useCase.problemStatement,
      proposedAISolution: useCase.proposedAISolution,
    },
    assessmentContextText
  );

  if (dryRun) {
    return NextResponse.json({
      risks: result.risks,
      count: result.risks.length,
      dryRun: true,
    });
  }

  // Persist risks
  const currentUser = await prismaClient.user.findFirst({
    where: { clerkId: auth.userId! },
  });

  const created = [];
  for (const risk of result.risks) {
    const record = await prismaClient.risk.create({
      data: {
        useCaseId,
        title: risk.riskName,
        description: risk.description,
        category: risk.category,
        riskLevel: risk.severityLabel,
        riskScore: risk.severity,
        impact: risk.impact,
        likelihood: risk.likelihood,
        mitigationPlan: risk.suggestedMitigations.join('\n'),
        notes: risk.justification,
        sourceType: 'llm-assessment',
        createdBy: currentUser?.id || 'system',
        createdByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
        createdByEmail: currentUser?.email || 'system@qube.ai',
      },
    });
    created.push(record);
  }

  return NextResponse.json({
    risks: created,
    count: created.length,
    dryRun: false,
  });
}, { requireUser: true });
