import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { AssessmentExpansionAgent } from '@/lib/expansion/assessment-expansion-agent';
import {
  ExpansionInput,
  CoreAnswer,
  QuestionSpec,
  PillarKey,
  STAGE_TO_PILLAR,
} from '@/lib/expansion/types';

/**
 * GET /api/assessment-expansion?useCaseId=xxx
 */
export const GET = withAuth(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const useCaseId = searchParams.get('useCaseId');

  if (!useCaseId) {
    return NextResponse.json({ error: 'useCaseId is required' }, { status: 400 });
  }

  const expansion = await prismaClient.assessmentExpansion.findUnique({
    where: { useCaseId },
  });

  if (!expansion) {
    return NextResponse.json({ expansion: null, status: 'not_started' });
  }

  return NextResponse.json({ expansion, status: expansion.status });
}, { requireUser: true });

/**
 * POST /api/assessment-expansion
 * Body: { useCaseId: string }
 */
export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { useCaseId } = body;

    if (!useCaseId) {
      return NextResponse.json({ error: 'useCaseId is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'LLM_CONFIGURATION_REQUIRED',
        message: 'Assessment expansion requires OpenAI API key.',
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
        primaryStakeholders: true,
        secondaryStakeholders: true,
        successCriteria: true,
        confidenceLevel: true,
        operationalImpactScore: true,
        productivityImpactScore: true,
        revenueImpactScore: true,
        implementationComplexity: true,
        aiType: true,
      },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    // Load ALL answers for this use case — we'll match them to core templates
    const allAnswers = await prismaClient.answer.findMany({
      where: { useCaseId },
      select: { id: true, questionId: true, templateId: true, value: true },
    });

    // Build lookup maps
    const answerByTemplateId = new Map<string, typeof allAnswers[0]>();
    const answerByQuestionId = new Map<string, typeof allAnswers[0]>();
    for (const a of allAnswers) {
      if (a.templateId) answerByTemplateId.set(a.templateId, a);
      if (a.questionId) answerByQuestionId.set(a.questionId, a);
    }

    // Load core templates with their linked questions (to resolve questionId -> templateId)
    const coreTemplates = await prismaClient.questionTemplate.findMany({
      where: { coreQuestion: true, isInactive: false },
      include: {
        optionTemplates: true,
        questions: { select: { id: true } },
      },
    });

    // Build core answers
    const coreAnswers: CoreAnswer[] = [];

    for (const tmpl of coreTemplates) {
      const pillar = STAGE_TO_PILLAR[tmpl.stage];
      if (!pillar) continue;

      // Check answer by templateId first, then by any linked questionId
      let answer = answerByTemplateId.get(tmpl.id);
      if (!answer) {
        for (const q of tmpl.questions) {
          answer = answerByQuestionId.get(q.id);
          if (answer) break;
        }
      }
      if (!answer) continue;

      coreAnswers.push({
        questionText: tmpl.text,
        questionNumber: tmpl.questionNumber || 0,
        pillar,
        value: answer.value,
        type: tmpl.type,
      });
    }

    if (coreAnswers.length === 0) {
      return NextResponse.json({
        error: 'No core answers found. Please answer and save core questions first.',
      }, { status: 400 });
    }

    // Load non-core templates as the question catalog for expansion
    const nonCoreTemplates = await prismaClient.questionTemplate.findMany({
      where: { coreQuestion: false, isInactive: false },
      include: { optionTemplates: true },
      orderBy: [{ stage: 'asc' }, { orderIndex: 'asc' }],
    });

    const questionCatalog: Record<PillarKey, QuestionSpec[]> = {
      requirements: [], technical: [], business: [],
      responsibleEthical: [], legalRegulatory: [], dataReadiness: [], finops: [],
    };

    for (const t of nonCoreTemplates) {
      const pillar = STAGE_TO_PILLAR[t.stage];
      if (!pillar) continue;
      questionCatalog[pillar].push({
        id: t.id,
        text: t.text,
        questionNumber: t.questionNumber || 0,
        type: t.type,
        options: t.optionTemplates.map((o) => ({ id: o.id, text: o.text })),
      });
    }

    // Create or reset expansion record
    const expansion = await prismaClient.assessmentExpansion.upsert({
      where: { useCaseId },
      create: {
        useCaseId,
        status: 'expanding',
        coreAnswerCount: coreAnswers.length,
      },
      update: {
        status: 'expanding',
        coreAnswerCount: coreAnswers.length,
        requirementsProfile: Prisma.JsonNull,
        technicalProfile: Prisma.JsonNull,
        businessProfile: Prisma.JsonNull,
        responsibleEthicalProfile: Prisma.JsonNull,
        legalRegulatoryProfile: Prisma.JsonNull,
        dataReadinessProfile: Prisma.JsonNull,
        finopsProfile: Prisma.JsonNull,
        overallConfidence: 0,
        expandedFieldCount: 0,
        modelUsed: null,
        tokenUsage: Prisma.JsonNull,
        expansionDuration: null,
        userReviewed: false,
        userOverrides: Prisma.JsonNull,
      },
    });

    // Run expansion
    const agent = new AssessmentExpansionAgent();
    const result = await agent.expand({
      useCaseId,
      useCase,
      coreAnswers,
      questionCatalog,
    });

    // Save results
    const expandedFieldCount = Object.values(result.profiles).reduce(
      (sum, p) => sum + Object.keys(p.fields).length, 0
    );

    const updated = await prismaClient.assessmentExpansion.update({
      where: { id: expansion.id },
      data: {
        status: 'completed',
        requirementsProfile: result.profiles.requirements as any,
        technicalProfile: result.profiles.technical as any,
        businessProfile: result.profiles.business as any,
        responsibleEthicalProfile: result.profiles.responsibleEthical as any,
        legalRegulatoryProfile: result.profiles.legalRegulatory as any,
        dataReadinessProfile: result.profiles.dataReadiness as any,
        finopsProfile: result.profiles.finops as any,
        overallConfidence: result.overallConfidence,
        expandedFieldCount,
        modelUsed: 'gpt-4o',
        tokenUsage: result.tokenUsage as any,
        expansionDuration: result.duration,
      },
    });

    return NextResponse.json({
      expansion: updated,
      profiles: result.profiles,
      overallConfidence: result.overallConfidence,
      coreAnswerCount: coreAnswers.length,
      expandedFieldCount,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Error in assessment expansion:', error);

    try {
      const body = await (request.clone() as Request).json().catch(() => ({}));
      if (body.useCaseId) {
        await prismaClient.assessmentExpansion.updateMany({
          where: { useCaseId: body.useCaseId, status: 'expanding' },
          data: { status: 'failed' },
        });
      }
    } catch { /* ignore cleanup errors */ }

    return NextResponse.json({
      error: 'Failed to expand assessment',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}, { requireUser: true });
