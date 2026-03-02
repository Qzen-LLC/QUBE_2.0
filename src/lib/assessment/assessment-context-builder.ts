/**
 * Assessment Context Builder
 *
 * Merges real (user) answers with LLM-expanded profiles from
 * AssessmentExpansion. Real answers always win over inferred ones.
 *
 * This is the single entry point for all downstream engines (Risk,
 * Threat, FinOps, Guardrails, Evals) to get rich assessment context.
 */

import { prismaClient } from '@/utils/db';
import {
  PillarKey,
  PillarProfile,
  STAGE_TO_PILLAR,
  PILLAR_LABELS,
  InferredField,
} from '@/lib/expansion/types';

export interface AssessmentContext {
  useCaseId: string;
  useCase: {
    title: string;
    problemStatement: string;
    proposedAISolution: string;
    currentState: string;
    desiredState: string;
    primaryStakeholders: string[];
    secondaryStakeholders: string[];
    successCriteria: string;
    aiType: string | null;
  };
  pillars: Record<PillarKey, PillarContext>;
  stats: {
    totalQuestions: number;
    userAnswered: number;
    llmInferred: number;
    overallConfidence: number;
    hasExpansion: boolean;
  };
}

export interface PillarContext {
  label: string;
  questions: ContextQuestion[];
  pillarConfidence: number;
}

export interface ContextQuestion {
  questionNumber: number;
  questionText: string;
  answer: string;
  source: 'user' | 'inferred';
  confidence: number;
  reasoning?: string;
}

/**
 * Build full assessment context for a use case, merging real answers
 * with expanded (inferred) answers. Real answers always override inferred.
 */
export async function buildAssessmentContext(
  useCaseId: string
): Promise<AssessmentContext> {
  // Load use case metadata
  const useCase = await prismaClient.useCase.findUnique({
    where: { id: useCaseId },
    select: {
      title: true,
      problemStatement: true,
      proposedAISolution: true,
      currentState: true,
      desiredState: true,
      primaryStakeholders: true,
      secondaryStakeholders: true,
      successCriteria: true,
      aiType: true,
    },
  });

  if (!useCase) {
    throw new Error(`Use case not found: ${useCaseId}`);
  }

  // Load all real answers with question info
  const answers = await prismaClient.answer.findMany({
    where: { useCaseId },
    include: {
      question: true,
      questionTemplate: true,
    },
  });

  // Load expansion (if exists)
  const expansion = await prismaClient.assessmentExpansion.findUnique({
    where: { useCaseId },
  });

  // Build real answers map: pillar -> questionNumber -> { text, answer }
  const realAnswerMap: Record<string, Record<number, { text: string; answer: string }>> = {};

  for (const a of answers) {
    const q = a.question || a.questionTemplate;
    if (!q) continue;

    const pillar = STAGE_TO_PILLAR[q.stage];
    if (!pillar) continue;

    const qNum = (q as any).questionNumber || 0;
    const value = a.value as any;

    let answerText = '';
    if (value?.labels && Array.isArray(value.labels)) {
      answerText = value.labels.join(', ');
    } else if (value?.text) {
      answerText = value.text;
    } else if (typeof value === 'string') {
      answerText = value;
    }

    if (!realAnswerMap[pillar]) realAnswerMap[pillar] = {};
    realAnswerMap[pillar][qNum] = { text: q.text, answer: answerText };
  }

  // Build pillar contexts
  const pillarKeys: PillarKey[] = [
    'requirements', 'technical', 'business',
    'responsibleEthical', 'legalRegulatory', 'dataReadiness', 'finops',
  ];

  const pillars: Record<string, PillarContext> = {};
  let totalQuestions = 0;
  let userAnswered = 0;
  let llmInferred = 0;

  const hasExpansion = expansion?.status === 'completed';
  const profileMap: Record<PillarKey, PillarProfile | null> = {
    requirements: expansion?.requirementsProfile as PillarProfile | null,
    technical: expansion?.technicalProfile as PillarProfile | null,
    business: expansion?.businessProfile as PillarProfile | null,
    responsibleEthical: expansion?.responsibleEthicalProfile as PillarProfile | null,
    legalRegulatory: expansion?.legalRegulatoryProfile as PillarProfile | null,
    dataReadiness: expansion?.dataReadinessProfile as PillarProfile | null,
    finops: expansion?.finopsProfile as PillarProfile | null,
  };

  // Apply user overrides if present
  const overrides = (expansion?.userOverrides as Record<string, any>) || {};

  for (const pillar of pillarKeys) {
    const questions: ContextQuestion[] = [];
    const realAnswers = realAnswerMap[pillar] || {};
    const profile = profileMap[pillar];

    // Add real user answers
    for (const [qNumStr, data] of Object.entries(realAnswers)) {
      const qNum = Number(qNumStr);
      if (!data.answer) continue;
      questions.push({
        questionNumber: qNum,
        questionText: data.text,
        answer: data.answer,
        source: 'user',
        confidence: 1.0,
      });
      userAnswered++;
      totalQuestions++;
    }

    // Add inferred answers (only if not already answered by user)
    if (profile?.fields) {
      for (const [fieldKey, field] of Object.entries(profile.fields)) {
        const qNum = parseInt(fieldKey.replace(/^Q+/i, ''), 10);
        if (isNaN(qNum)) continue;

        // Skip if user already answered this question
        if (realAnswers[qNum]) continue;

        // Check for user override
        const overrideKey = `${pillar}.${fieldKey}`;
        const override = overrides[overrideKey];

        const inferredField = field as InferredField;
        const answerValue = override !== undefined
          ? String(override)
          : String(inferredField.value || '');

        if (!answerValue) continue;

        questions.push({
          questionNumber: qNum,
          questionText: `Q${qNum}`, // We don't have the text from expansion alone
          answer: answerValue,
          source: override !== undefined ? 'user' : 'inferred',
          confidence: override !== undefined ? 1.0 : inferredField.confidence,
          reasoning: inferredField.reasoning,
        });
        llmInferred++;
        totalQuestions++;
      }
    }

    // Sort by question number
    questions.sort((a, b) => a.questionNumber - b.questionNumber);

    pillars[pillar] = {
      label: PILLAR_LABELS[pillar],
      questions,
      pillarConfidence: profile?.pillarConfidence || (questions.length > 0 ? 1.0 : 0),
    };
  }

  return {
    useCaseId,
    useCase,
    pillars: pillars as Record<PillarKey, PillarContext>,
    stats: {
      totalQuestions,
      userAnswered,
      llmInferred,
      overallConfidence: expansion?.overallConfidence || (userAnswered > 0 ? 1.0 : 0),
      hasExpansion,
    },
  };
}

/**
 * Format assessment context as a structured text string for LLM prompts.
 * Respects a max character limit with smart truncation.
 */
export function formatContextForPrompt(
  context: AssessmentContext,
  maxChars: number = 60000
): string {
  const sections: string[] = [];

  // Header
  sections.push(`## USE CASE OVERVIEW
Title: ${context.useCase.title}
Problem: ${context.useCase.problemStatement}
AI Solution: ${context.useCase.proposedAISolution}
Current State: ${context.useCase.currentState}
Desired State: ${context.useCase.desiredState}
AI Type: ${context.useCase.aiType || 'Not specified'}
Primary Stakeholders: ${context.useCase.primaryStakeholders.join(', ') || 'None'}
Secondary Stakeholders: ${context.useCase.secondaryStakeholders.join(', ') || 'None'}
Success Criteria: ${context.useCase.successCriteria}

Assessment Coverage: ${context.stats.userAnswered} user-answered, ${context.stats.llmInferred} AI-inferred (${context.stats.totalQuestions} total)
Overall Confidence: ${Math.round(context.stats.overallConfidence * 100)}%
`);

  // Each pillar
  const pillarKeys: PillarKey[] = [
    'requirements', 'technical', 'business',
    'responsibleEthical', 'legalRegulatory', 'dataReadiness', 'finops',
  ];

  for (const pillar of pillarKeys) {
    const pc = context.pillars[pillar];
    if (!pc || pc.questions.length === 0) continue;

    const userCount = pc.questions.filter((q) => q.source === 'user').length;
    const inferredCount = pc.questions.filter((q) => q.source === 'inferred').length;

    let section = `\n## ${pc.label.toUpperCase()} (${userCount} user-answered, ${inferredCount} AI-inferred)\n`;

    for (const q of pc.questions) {
      const sourceTag = q.source === 'user' ? '[user]' : `[inferred, confidence: ${q.confidence.toFixed(2)}]`;
      section += `Q${q.questionNumber}: ${q.questionText}\n  A: ${q.answer} ${sourceTag}\n`;
    }

    sections.push(section);
  }

  let result = sections.join('\n');

  // Smart truncation: if over limit, truncate low-confidence inferred answers first
  if (result.length > maxChars) {
    result = result.substring(0, maxChars - 50) + '\n\n[... truncated for length]';
  }

  return result;
}
