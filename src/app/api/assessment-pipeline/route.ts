import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { buildAssessmentContext, formatContextForPrompt } from '@/lib/assessment/assessment-context-builder';
import { getRiskIdentificationEngine } from '@/lib/qube-ai-nexus/risk-identification-engine';
import { ThreatIdentificationEngine } from '@/lib/threat-modeling/threat-identification-engine';
import { FinOpsInsightsEngine } from '@/lib/finops/finops-insights-engine';
import { ContextAggregator } from '@/lib/guardrails/context-aggregator';
import { GuardrailsOrchestrator } from '@/lib/agents/guardrails-orchestrator';
import { ComprehensiveAssessment } from '@/lib/agents/types';
import { EvaluationContextAggregator } from '@/lib/evals/evaluation-context-aggregator';
import { EvaluationGenerationEngine } from '@/lib/evals/evaluation-generation-engine';
import { STAGE_TO_PILLAR } from '@/lib/expansion/types';
import type { PillarKey } from '@/lib/expansion/types';

export interface PipelineStageResult {
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  duration?: number;
  error?: string;
  counts?: Record<string, number>;
}

export interface PipelineResult {
  stages: PipelineStageResult[];
  totalDuration: number;
  completedStages: number;
  failedStages: number;
}

/**
 * POST /api/assessment-pipeline
 *
 * Orchestrates the full assessment pipeline:
 *   1. Expansion (7 LLM calls)
 *   2. Risks + Threats + FinOps in parallel
 *   3. Guardrails (needs full context)
 *   4. Evaluations (needs guardrails)
 *
 * Each stage is independent in error handling - one failure
 * does not block the others.
 */
export const POST = withAuth(async (request: Request, { auth }) => {
  const pipelineStart = Date.now();

  try {
    const body = await request.json();
    const { useCaseId, skipExpansion } = body;

    if (!useCaseId) {
      return NextResponse.json({ error: 'useCaseId is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'LLM_CONFIGURATION_REQUIRED',
        message: 'Assessment pipeline requires OpenAI API key.',
      }, { status: 503 });
    }

    // Verify use case exists
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
        primaryStakeholders: true,
        secondaryStakeholders: true,
      },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    const stages: PipelineStageResult[] = [];

    // Get current user for attribution
    const currentUser = await prismaClient.user.findFirst({
      where: { clerkId: auth.userId! },
    });

    // ─── STAGE 1: EXPANSION ─────────────────────────────────────
    if (!skipExpansion) {
      const expansionResult = await runExpansionStage(useCaseId);
      stages.push(expansionResult);
    } else {
      stages.push({ stage: 'expansion', status: 'skipped' });
    }

    // ─── STAGE 2: PARALLEL - RISKS, THREATS, FINOPS ─────────────
    const [risksResult, threatsResult, finopsResult] = await Promise.all([
      runRisksStage(useCaseId, useCase, currentUser),
      runThreatsStage(useCaseId, useCase, currentUser),
      runFinOpsStage(useCaseId, useCase),
    ]);

    stages.push(risksResult, threatsResult, finopsResult);

    // ─── STAGE 3: GUARDRAILS (needs full context) ────────────────
    const guardrailsResult = await runGuardrailsStage(useCaseId, currentUser);
    stages.push(guardrailsResult);

    // ─── STAGE 4: EVALUATIONS (needs guardrails) ─────────────────
    const evalsResult = await runEvalsStage(
      useCaseId,
      guardrailsResult.status === 'completed' ? guardrailsResult.guardrailsId : undefined
    );
    stages.push(evalsResult);

    const totalDuration = Date.now() - pipelineStart;
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const failedStages = stages.filter(s => s.status === 'error').length;

    return NextResponse.json({
      success: true,
      stages,
      totalDuration,
      completedStages,
      failedStages,
      totalStages: stages.filter(s => s.status !== 'skipped').length,
    });
  } catch (error) {
    console.error('Pipeline orchestration error:', error);
    return NextResponse.json({
      error: 'Pipeline failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stages: [],
      totalDuration: Date.now() - pipelineStart,
    }, { status: 500 });
  }
}, { requireUser: true });


// ─── Stage Runners ───────────────────────────────────────────────

async function runExpansionStage(useCaseId: string): Promise<PipelineStageResult> {
  const start = Date.now();
  try {
    const { AssessmentExpansionAgent } = await import('@/lib/expansion/assessment-expansion-agent');

    // Load use case for expansion input
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
      select: {
        id: true, title: true, problemStatement: true, proposedAISolution: true,
        currentState: true, desiredState: true, primaryStakeholders: true,
        secondaryStakeholders: true, successCriteria: true, confidenceLevel: true,
        operationalImpactScore: true, productivityImpactScore: true,
        revenueImpactScore: true, implementationComplexity: true, aiType: true,
      },
    });

    if (!useCase) throw new Error('Use case not found');

    // Load answers and build core answers (same as assessment-expansion route)
    const allAnswers = await prismaClient.answer.findMany({
      where: { useCaseId },
      select: { id: true, questionId: true, templateId: true, value: true },
    });

    const answerByTemplateId = new Map<string, typeof allAnswers[0]>();
    const answerByQuestionId = new Map<string, typeof allAnswers[0]>();
    for (const a of allAnswers) {
      if (a.templateId) answerByTemplateId.set(a.templateId, a);
      if (a.questionId) answerByQuestionId.set(a.questionId, a);
    }

    const coreTemplates = await prismaClient.questionTemplate.findMany({
      where: { coreQuestion: true, isInactive: false },
      include: { optionTemplates: true, questions: { select: { id: true } } },
    });

    const coreAnswers: any[] = [];
    for (const tmpl of coreTemplates) {
      const pillar = STAGE_TO_PILLAR[tmpl.stage];
      if (!pillar) continue;
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
      return { stage: 'expansion', status: 'error', duration: Date.now() - start, error: 'No core answers found' };
    }

    // Load non-core templates as question catalog
    const nonCoreTemplates = await prismaClient.questionTemplate.findMany({
      where: { coreQuestion: false, isInactive: false },
      include: { optionTemplates: true },
      orderBy: [{ stage: 'asc' }, { orderIndex: 'asc' }],
    });

    const questionCatalog: Record<string, any[]> = {
      requirements: [], technical: [], business: [],
      responsibleEthical: [], legalRegulatory: [], dataReadiness: [], finops: [],
    };

    for (const t of nonCoreTemplates) {
      const pillar = STAGE_TO_PILLAR[t.stage];
      if (!pillar) continue;
      questionCatalog[pillar].push({
        id: t.id, text: t.text, questionNumber: t.questionNumber || 0,
        type: t.type, options: t.optionTemplates.map(o => ({ id: o.id, text: o.text })),
      });
    }

    // Create/reset expansion record
    const { Prisma } = await import('@/generated/prisma');
    const expansion = await prismaClient.assessmentExpansion.upsert({
      where: { useCaseId },
      create: { useCaseId, status: 'expanding', coreAnswerCount: coreAnswers.length },
      update: {
        status: 'expanding', coreAnswerCount: coreAnswers.length,
        requirementsProfile: Prisma.JsonNull, technicalProfile: Prisma.JsonNull,
        businessProfile: Prisma.JsonNull, responsibleEthicalProfile: Prisma.JsonNull,
        legalRegulatoryProfile: Prisma.JsonNull, dataReadinessProfile: Prisma.JsonNull,
        finopsProfile: Prisma.JsonNull, overallConfidence: 0, expandedFieldCount: 0,
        modelUsed: null, tokenUsage: Prisma.JsonNull, expansionDuration: null,
        userReviewed: false, userOverrides: Prisma.JsonNull,
      },
    });

    const agent = new AssessmentExpansionAgent();
    const result = await agent.expand({ useCaseId, useCase, coreAnswers, questionCatalog });

    const expandedFieldCount = Object.values(result.profiles).reduce(
      (sum: number, p: any) => sum + Object.keys(p.fields).length, 0
    );

    await prismaClient.assessmentExpansion.update({
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

    return {
      stage: 'expansion',
      status: 'completed',
      duration: Date.now() - start,
      counts: { expandedFields: expandedFieldCount, coreAnswers: coreAnswers.length },
    };
  } catch (error) {
    console.error('[Pipeline] Expansion error:', error);
    // Mark expansion as failed
    try {
      await prismaClient.assessmentExpansion.updateMany({
        where: { useCaseId, status: 'expanding' },
        data: { status: 'failed' },
      });
    } catch { /* ignore cleanup */ }
    return {
      stage: 'expansion',
      status: 'error',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runRisksStage(
  useCaseId: string,
  useCase: { title: string; problemStatement: string; proposedAISolution: string },
  currentUser: any
): Promise<PipelineStageResult> {
  const start = Date.now();
  try {
    let assessmentContextText: string | undefined;
    try {
      const context = await buildAssessmentContext(useCaseId);
      assessmentContextText = formatContextForPrompt(context);
    } catch { /* continue without context */ }

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

    // Persist risks
    let created = 0;
    for (const risk of result.risks) {
      await prismaClient.risk.create({
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
      created++;
    }

    return {
      stage: 'risks',
      status: 'completed',
      duration: Date.now() - start,
      counts: { risksGenerated: created },
    };
  } catch (error) {
    console.error('[Pipeline] Risks error:', error);
    return {
      stage: 'risks',
      status: 'error',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runThreatsStage(
  useCaseId: string,
  useCase: { title: string; problemStatement: string; proposedAISolution: string },
  currentUser: any
): Promise<PipelineStageResult> {
  const start = Date.now();
  try {
    let assessmentContextText: string | undefined;
    try {
      const context = await buildAssessmentContext(useCaseId);
      assessmentContextText = formatContextForPrompt(context);
    } catch { /* continue without context */ }

    const engine = new ThreatIdentificationEngine();
    const result = await engine.identifyThreats(
      useCase.title,
      `${useCase.problemStatement}\n\n${useCase.proposedAISolution}`,
      assessmentContextText
    );

    // Persist threats
    let created = 0;
    for (const threat of result.threats) {
      await prismaClient.threat.create({
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
      created++;
    }

    return {
      stage: 'threats',
      status: 'completed',
      duration: Date.now() - start,
      counts: { threatsGenerated: created },
    };
  } catch (error) {
    console.error('[Pipeline] Threats error:', error);
    return {
      stage: 'threats',
      status: 'error',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runFinOpsStage(
  useCaseId: string,
  useCase: { title: string }
): Promise<PipelineStageResult> {
  const start = Date.now();
  try {
    const finops = await prismaClient.finOps.findUnique({ where: { useCaseId } });

    let assessmentContextText: string | undefined;
    try {
      const context = await buildAssessmentContext(useCaseId);
      assessmentContextText = formatContextForPrompt(context);
    } catch { /* continue without context */ }

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

    return {
      stage: 'finops',
      status: 'completed',
      duration: Date.now() - start,
      counts: { insightsGenerated: result.insights.length },
    };
  } catch (error) {
    console.error('[Pipeline] FinOps error:', error);
    return {
      stage: 'finops',
      status: 'error',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface GuardrailsStageResult extends PipelineStageResult {
  guardrailsId?: string;
}

async function runGuardrailsStage(
  useCaseId: string,
  currentUser: any
): Promise<GuardrailsStageResult> {
  const start = Date.now();
  try {
    const aggregator = new ContextAggregator();
    const currentEmail = currentUser?.email || 'system';
    const completeContext = await aggregator.buildCompleteContext(useCaseId, undefined, currentEmail);

    const comprehensiveAssessment: ComprehensiveAssessment = {
      useCaseId,
      useCaseTitle: completeContext.useCase.title,
      department: completeContext.useCase.businessFunction || 'Unknown',
      owner: currentEmail,
      problemStatement: completeContext.useCase.problemStatement,
      proposedSolution: completeContext.useCase.proposedAISolution,
      currentState: completeContext.useCase.currentState,
      desiredState: completeContext.useCase.desiredState,
      successCriteria: completeContext.useCase.successCriteria,
      keyAssumptions: completeContext.useCase.keyAssumptions,
      keyBenefits: completeContext.useCase.keyBenefits || '',
      requiredResources: completeContext.useCase.requiredResources,
      primaryStakeholders: completeContext.useCase.primaryStakeholders,
      secondaryStakeholders: completeContext.useCase.secondaryStakeholders,
      confidenceLevel: completeContext.useCase.confidenceLevel,
      operationalImpact: completeContext.useCase.operationalImpactScore,
      productivityImpact: completeContext.useCase.productivityImpactScore,
      revenueImpact: completeContext.useCase.revenueImpactScore,
      implementationComplexity: completeContext.useCase.implementationComplexity,
      timeline: completeContext.useCase.estimatedTimeline,
      initialCost: completeContext.useCase.initialCost || '',
      initialROI: completeContext.useCase.initialROI,
      technicalFeasibility: completeContext.assessments.technical || {},
      businessFeasibility: completeContext.assessments.business || {},
      ethicalImpact: completeContext.assessments.ethical || {},
      riskAssessment: completeContext.assessments.risk || {},
      dataReadiness: completeContext.assessments.data || {},
      roadmapPosition: completeContext.assessments.roadmap || {},
      budgetPlanning: completeContext.assessments.budget || {},
      organizationPolicies: completeContext.organization?.policies || {
        responsibleAI: ['Transparency', 'Accountability', 'Fairness', 'Privacy'],
        prohibitedUses: ['No automated decisions without human oversight'],
        requiredSafeguards: ['Bias detection', 'Performance monitoring'],
        complianceFrameworks: ['GDPR', 'ISO 42001'],
      } as any,
      approvalStatus: completeContext.governance.finalQualification,
      approvalConditions: [
        completeContext.governance.approvals?.governance?.comment,
        completeContext.governance.approvals?.risk?.comment,
        completeContext.governance.approvals?.legal?.comment,
        completeContext.governance.approvals?.business?.comment,
      ].filter((x): x is string => !!x),
      identifiedRisks: completeContext.risks.identified,
      residualRiskLevel: completeContext.risks.residualRiskLevel,
      financialConstraints: completeContext.financial ? {
        budget: completeContext.financial.budgetRange,
        roi: completeContext.financial.roi,
        totalInvestment: completeContext.financial.totalInvestment,
      } : undefined,
      complianceRequirements: {
        euAiAct: completeContext.compliance.euAiAct,
        iso42001: completeContext.compliance.iso42001,
        uaeAi: completeContext.compliance.uaeAi,
        hipaa: completeContext.compliance.hipaa,
        gdpr: completeContext.compliance.gdpr,
      },
      assessmentContextText: completeContext.assessmentContextText,
    };

    const orchestrator = new GuardrailsOrchestrator();
    const guardrails = await orchestrator.generateGuardrails(comprehensiveAssessment);

    // Save guardrails to database
    const guardrailRecord = await prismaClient.guardrail.upsert({
      where: { id: ((guardrails as any).id as string) || `${useCaseId}-pipeline-${Date.now()}` },
      create: {
        useCaseId,
        name: 'AI Guardrails Configuration',
        description: `Generated guardrails for ${completeContext.useCase.title}`,
        approach: 'multi-agent',
        configuration: JSON.parse(JSON.stringify(guardrails)) as any,
        reasoning: JSON.parse(JSON.stringify((guardrails as any).reasoning || {})) as any,
        confidence: guardrails.confidence?.overall || 0.8,
        status: 'draft',
      },
      update: {
        configuration: JSON.parse(JSON.stringify(guardrails)) as any,
        reasoning: JSON.parse(JSON.stringify((guardrails as any).reasoning || {})) as any,
        confidence: guardrails.confidence?.overall || 0.8,
        status: 'draft',
        updatedAt: new Date(),
      },
    });

    // Save individual rules
    if (guardrails.guardrails?.rules) {
      await prismaClient.guardrailRule.deleteMany({ where: { guardrailId: guardrailRecord.id } });

      const allRules: any[] = [];
      Object.entries(guardrails.guardrails.rules).forEach(([category, rules]: [string, any]) => {
        if (Array.isArray(rules)) {
          rules.forEach((rule: any) => {
            allRules.push({
              guardrailId: guardrailRecord.id,
              type: rule.type || category,
              severity: rule.severity || 'medium',
              rule: rule.rule || rule.name || 'Rule',
              description: rule.description || '',
              rationale: rule.rationale,
              implementation: rule.implementation || {},
              conditions: rule.conditions,
              exceptions: rule.exceptions,
            });
          });
        }
      });

      if (allRules.length > 0) {
        await prismaClient.guardrailRule.createMany({ data: allRules });
      }
    }

    const ruleCount = guardrails.guardrails?.rules
      ? Object.values(guardrails.guardrails.rules).flat().length
      : 0;

    return {
      stage: 'guardrails',
      status: 'completed',
      duration: Date.now() - start,
      counts: { rulesGenerated: ruleCount },
      guardrailsId: guardrailRecord.id,
    };
  } catch (error) {
    console.error('[Pipeline] Guardrails error:', error);
    return {
      stage: 'guardrails',
      status: 'error',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runEvalsStage(
  useCaseId: string,
  guardrailsId?: string
): Promise<PipelineStageResult> {
  const start = Date.now();
  try {
    // If guardrails failed, try to find the latest existing guardrails
    let effectiveGuardrailsId = guardrailsId;
    if (!effectiveGuardrailsId) {
      const latest = await prismaClient.guardrail.findFirst({
        where: { useCaseId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      effectiveGuardrailsId = latest?.id;
    }

    if (!effectiveGuardrailsId) {
      return {
        stage: 'evaluations',
        status: 'skipped',
        duration: Date.now() - start,
        error: 'Skipped: no guardrails available',
      };
    }

    const contextAggregator = new EvaluationContextAggregator();
    const context = await contextAggregator.buildEvaluationContext(useCaseId, effectiveGuardrailsId);

    const engine = new EvaluationGenerationEngine();
    const evaluationConfig = await engine.generateEvaluations(context, {
      type: 'comprehensive',
      intensity: 'standard',
      maxTestsPerSuite: 10,
      timeLimit: 60,
    });

    // Save evaluation — sanitize via JSON round-trip to strip undefined values
    const sanitizedConfig = JSON.parse(JSON.stringify(evaluationConfig));
    const evaluation = await prismaClient.evaluation.create({
      data: {
        useCaseId,
        name: `Pipeline-Generated Evaluation ${new Date().toLocaleDateString()}`,
        description: `LLM-powered evaluation with ${evaluationConfig.testSuites.length} test suites`,
        configuration: sanitizedConfig,
        status: 'pending',
        createdAt: new Date(),
      },
    });

    const totalScenarios = evaluationConfig.testSuites.reduce(
      (sum: number, suite: any) => sum + (suite.scenarios?.length || 0), 0
    );

    return {
      stage: 'evaluations',
      status: 'completed',
      duration: Date.now() - start,
      counts: { testSuites: evaluationConfig.testSuites.length, scenarios: totalScenarios },
    };
  } catch (error) {
    console.error('[Pipeline] Evaluations error:', error);
    return {
      stage: 'evaluations',
      status: 'error',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
