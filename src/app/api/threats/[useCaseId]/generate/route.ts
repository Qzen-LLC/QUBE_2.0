import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { ThreatIdentificationEngine } from '@/lib/threat-modeling/threat-identification-engine';
import { buildAssessmentContext, formatContextForPrompt } from '@/lib/assessment/assessment-context-builder';

/**
 * POST /api/threats/[useCaseId]/generate
 *
 * Generate threats using STRIDE framework + MITRE ATLAS with
 * full assessment context.
 *
 * Body: { dryRun?: boolean }
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
      message: 'Threat generation requires OpenAI API key.',
    }, { status: 503 });
  }

  const useCase = await prismaClient.useCase.findUnique({
    where: { id: useCaseId },
    select: {
      id: true,
      title: true,
      problemStatement: true,
      proposedAISolution: true,
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
    console.warn('Could not build assessment context for threat generation:', err);
  }

  const engine = new ThreatIdentificationEngine();
  const result = await engine.identifyThreats(
    useCase.title,
    `${useCase.problemStatement}\n\n${useCase.proposedAISolution}`,
    assessmentContextText
  );

  if (dryRun) {
    return NextResponse.json({
      threats: result.threats,
      count: result.threats.length,
      duration: result.duration,
      dryRun: true,
    });
  }

  // Delete previous LLM-generated threats (preserve manual ones)
  await prismaClient.threat.deleteMany({
    where: {
      useCaseId,
      sourceType: 'llm-assessment',
    },
  });

  // Persist threats
  const currentUser = await prismaClient.user.findFirst({
    where: { clerkId: auth.userId! },
  });

  const created = [];
  for (const threat of result.threats) {
    const record = await prismaClient.threat.create({
      data: {
        useCaseId,
        title: threat.title,
        description: threat.description,
        category: threat.category,
        framework: threat.framework,
        severity: threat.severity,
        severityScore: threat.severityScore,
        likelihood: threat.likelihood,
        attackVector: threat.attackVector,
        affectedAsset: threat.affectedAsset,
        mitigationPlan: threat.mitigationPlan,
        mitreTechniqueIds: threat.mitreTechniqueIds,
        justification: threat.justification,
        sourceType: 'llm-assessment',
        createdBy: currentUser?.id || 'system',
        createdByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
        createdByEmail: currentUser?.email || 'system@qube.ai',
      },
    });
    created.push(record);
  }

  return NextResponse.json({
    threats: created,
    count: created.length,
    duration: result.duration,
    dryRun: false,
  });
}, { requireUser: true });
