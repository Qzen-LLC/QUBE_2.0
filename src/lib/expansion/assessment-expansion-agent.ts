/**
 * Assessment Expansion Agent
 *
 * Takes ~25 core answers + use case metadata and uses LLM (gpt-4o)
 * to infer answers for all remaining questions across 7 pillars.
 * Runs 7 parallel LLM calls — one per pillar.
 */

import OpenAI from 'openai';
import {
  ExpansionInput,
  ExpansionResult,
  PillarKey,
  PillarProfile,
  InferredField,
  QuestionSpec,
  CoreAnswer,
  PILLAR_LABELS,
} from './types';

const MODEL = 'gpt-4o';

const PILLAR_SYSTEM_PROMPTS: Record<PillarKey, string> = {
  requirements: `You are an AI requirements engineering expert. Given context about an AI use case and its core answers, infer what a domain expert would answer for each remaining question in the Requirements pillar. Consider functional requirements, system capabilities, autonomy levels, input/output specifications, and user interaction patterns.`,

  technical: `You are an AI systems architect and technical expert. Given context about an AI use case and its core answers, infer what a technical expert would answer for each remaining question in the Technical Feasibility pillar. Consider model architecture, deployment infrastructure, security posture, performance requirements, and integration patterns.`,

  business: `You are a business strategy and AI value expert. Given context about an AI use case and its core answers, infer what a business analyst would answer for each remaining question in the Business Feasibility pillar. Consider strategic alignment, ROI, stakeholder management, market opportunity, and organizational readiness.`,

  responsibleEthical: `You are an AI ethics and responsible AI expert. Given context about an AI use case and its core answers, infer what a responsible AI specialist would answer for each remaining question in the Responsible & Ethical AI pillar. Consider bias and fairness, transparency, human oversight, safety implications, and societal impact.`,

  legalRegulatory: `You are a legal and regulatory compliance expert specializing in AI governance. Given context about an AI use case and its core answers, infer what a legal expert would answer for each remaining question in the Legal & Regulatory pillar. Consider EU AI Act classification, GDPR requirements, jurisdiction-specific regulations, and compliance obligations.`,

  dataReadiness: `You are a data engineering and data governance expert. Given context about an AI use case and its core answers, infer what a data expert would answer for each remaining question in the Data Readiness pillar. Consider data sources, data quality, data classification, privacy requirements, and data lifecycle management.`,

  finops: `You are a FinOps and AI cost optimization expert. Given context about an AI use case and its core answers, infer what a financial analyst would answer for each remaining question in the FinOps pillar. Consider total cost of ownership, infrastructure costs, API costs, hidden costs, and ROI projections.`,
};

function buildSharedContext(input: ExpansionInput): string {
  const { useCase, coreAnswers } = input;

  const coreAnswersByPillar: Record<string, CoreAnswer[]> = {};
  for (const answer of coreAnswers) {
    if (!coreAnswersByPillar[answer.pillar]) {
      coreAnswersByPillar[answer.pillar] = [];
    }
    coreAnswersByPillar[answer.pillar].push(answer);
  }

  let context = `## USE CASE OVERVIEW
Title: ${useCase.title}
Problem Statement: ${useCase.problemStatement}
Proposed AI Solution: ${useCase.proposedAISolution}
Current State: ${useCase.currentState}
Desired State: ${useCase.desiredState}
AI Type: ${useCase.aiType || 'Not specified'}
Primary Stakeholders: ${useCase.primaryStakeholders.join(', ') || 'Not specified'}
Secondary Stakeholders: ${useCase.secondaryStakeholders.join(', ') || 'Not specified'}
Success Criteria: ${useCase.successCriteria}
Confidence Level: ${useCase.confidenceLevel}/10
Operational Impact: ${useCase.operationalImpactScore}/10
Productivity Impact: ${useCase.productivityImpactScore}/10
Revenue Impact: ${useCase.revenueImpactScore}/10
Implementation Complexity: ${useCase.implementationComplexity}/10

## CORE ANSWERS (User-Provided)
`;

  for (const [pillar, answers] of Object.entries(coreAnswersByPillar)) {
    context += `\n### ${PILLAR_LABELS[pillar as PillarKey] || pillar}\n`;
    for (const answer of answers) {
      const displayValue = typeof answer.value === 'object'
        ? JSON.stringify(answer.value)
        : String(answer.value);
      context += `Q${answer.questionNumber}: ${answer.questionText}\n  A: ${displayValue}\n`;
    }
  }

  return context;
}

function buildPillarPrompt(
  pillar: PillarKey,
  questions: QuestionSpec[],
  sharedContext: string
): string {
  let prompt = `${sharedContext}\n\n## QUESTIONS TO INFER (${PILLAR_LABELS[pillar]})\n\nFor each question below, infer the most likely answer based on the use case context and core answers provided above.\n\n`;

  for (const q of questions) {
    prompt += `Q${q.questionNumber} [${q.type}]: ${q.text}\n`;
    if (q.options && q.options.length > 0) {
      prompt += `  Options: ${q.options.map((o) => o.text).join(' | ')}\n`;
    }
    prompt += '\n';
  }

  prompt += `\nRespond with a JSON object in this exact format:
{
  "answers": {
    "<questionNumber>": {
      "value": "<answer text, or for multi-select: comma-separated selected options>",
      "confidence": <0.0 to 1.0>,
      "reasoning": "<brief explanation of why this answer was inferred>",
      "inferredFrom": ["<list of core question numbers that informed this>"]
    }
  },
  "pillarConfidence": <overall confidence for this pillar, 0.0 to 1.0>
}

Guidelines:
- For SELECT/MULTI_SELECT questions, choose from the provided options only
- For TEXT/TEXTAREA questions, provide a concise but complete answer
- For NUMBER questions, provide a numeric value
- For RISK questions, provide probability and impact labels (e.g., "pro:Medium, imp:High")
- Set confidence lower (< 0.5) when the core answers provide insufficient context
- Set confidence higher (> 0.8) when the answer can be directly derived from core answers
- Be conservative — it's better to have low confidence than to guess wildly`;

  return prompt;
}

export class AssessmentExpansionAgent {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for Assessment Expansion');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async expand(input: ExpansionInput): Promise<ExpansionResult> {
    const startTime = Date.now();
    const sharedContext = buildSharedContext(input);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Run 7 parallel LLM calls — one per pillar
    const pillarKeys = Object.keys(input.questionCatalog) as PillarKey[];
    const results = await Promise.allSettled(
      pillarKeys.map(async (pillar) => {
        const questions = input.questionCatalog[pillar];
        if (!questions || questions.length === 0) {
          return { pillar, profile: { fields: {}, pillarConfidence: 0 } as PillarProfile };
        }

        const profile = await this.expandPillar(pillar, questions, sharedContext, input.coreAnswers);
        return { pillar, profile };
      })
    );

    const profiles: Record<string, PillarProfile> = {};
    let totalConfidence = 0;
    let pillarCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { pillar, profile } = result.value;
        profiles[pillar] = profile;
        if (profile.pillarConfidence > 0) {
          totalConfidence += profile.pillarConfidence;
          pillarCount++;
        }
      } else {
        console.error('Pillar expansion failed:', result.reason);
      }
    }

    // Collect token usage from all calls
    // (approximation — actual tokens tracked per call in expandPillar)
    const expandedFieldCount = Object.values(profiles).reduce(
      (sum, p) => sum + Object.keys(p.fields).length,
      0
    );

    const duration = Date.now() - startTime;

    return {
      profiles: profiles as Record<PillarKey, PillarProfile>,
      overallConfidence: pillarCount > 0 ? totalConfidence / pillarCount : 0,
      tokenUsage: { input: totalInputTokens, output: totalOutputTokens },
      duration,
    };
  }

  private async expandPillar(
    pillar: PillarKey,
    questions: QuestionSpec[],
    sharedContext: string,
    coreAnswers: CoreAnswer[]
  ): Promise<PillarProfile> {
    const userPrompt = buildPillarPrompt(pillar, questions, sharedContext);

    try {
      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: PILLAR_SYSTEM_PROMPTS[pillar] },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: questions.length > 50 ? 16384 : 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error(`Empty response for pillar: ${pillar}`);
        return { fields: {}, pillarConfidence: 0 };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Attempt to repair truncated JSON by closing open braces
        let repaired = content.replace(/,\s*$/, '');
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
        try {
          parsed = JSON.parse(repaired);
        } catch {
          console.error(`Failed to parse JSON for pillar ${pillar} even after repair`);
          return { fields: {}, pillarConfidence: 0 };
        }
      }
      const fields: Record<string, InferredField> = {};

      if (parsed.answers) {
        for (const [rawKey, data] of Object.entries(parsed.answers as Record<string, any>)) {
          // Normalize key: LLM may return "Q5", "5", or "QQ5" — always store as "Q5"
          const qNum = String(rawKey).replace(/^Q*/i, '');
          fields[`Q${qNum}`] = {
            value: data.value,
            confidence: Math.max(0, Math.min(1, data.confidence || 0.5)),
            source: 'inferred',
            reasoning: data.reasoning,
            inferredFrom: data.inferredFrom?.map((n: any) => `Q${n}`),
          };
        }
      }

      return {
        fields,
        pillarConfidence: Math.max(0, Math.min(1, parsed.pillarConfidence || 0.5)),
      };
    } catch (error) {
      console.error(`Error expanding pillar ${pillar}:`, error);
      return { fields: {}, pillarConfidence: 0 };
    }
  }
}
