import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { verifyUseCaseAccess } from '@/lib/org-scope';
import { FinOpsInsightsEngine } from '@/lib/finops/finops-insights-engine';
import { buildAssessmentContext, formatContextForPrompt } from '@/lib/assessment/assessment-context-builder';

/**
 * POST /api/finops-dashboard/[useCaseId]/generate-insights
 *
 * Generate LLM-powered FinOps insights including cost optimization
 * recommendations, hidden cost warnings, and growth rate suggestions.
 */
export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }
) => {
  const { useCaseId } = await params;

  if (!(await verifyUseCaseAccess(auth, useCaseId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: 'LLM_CONFIGURATION_REQUIRED',
      message: 'FinOps insights require OpenAI API key.',
    }, { status: 503 });
  }

  const useCase = await prismaClient.useCase.findUnique({
    where: { id: useCaseId },
    select: { title: true },
  });

  if (!useCase) {
    return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
  }

  // Load current FinOps data
  const finops = await prismaClient.finOps.findUnique({
    where: { useCaseId },
  });

  // Build assessment context
  let assessmentContextText: string | undefined;
  try {
    const context = await buildAssessmentContext(useCaseId);
    assessmentContextText = formatContextForPrompt(context);
  } catch (err) {
    console.warn('Could not build assessment context for FinOps insights:', err);
  }

  const engine = new FinOpsInsightsEngine();
  const result = await engine.generateInsights(
    useCase.title,
    {
      devCostBase: finops?.devCostBase,
      apiCostBase: finops?.apiCostBase,
      infraCostBase: finops?.infraCostBase,
      opCostBase: finops?.opCostBase,
      valueBase: finops?.valueBase,
      valueGrowthRate: finops?.valueGrowthRate,
      budgetRange: finops?.budgetRange || undefined,
    },
    assessmentContextText
  );

  return NextResponse.json({
    insights: result.insights,
    growthRateOverrides: result.growthRateOverrides,
  });
}, { requireUser: true });
