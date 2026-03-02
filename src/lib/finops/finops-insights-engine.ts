/**
 * FinOps Insights Engine
 *
 * LLM-powered analysis of AI use case costs, producing:
 * - Cost optimization recommendations
 * - Hidden cost warnings (compliance, monitoring, retraining)
 * - Adjusted growth rate suggestions
 * - ROI validation
 */

import OpenAI from 'openai';

export interface FinOpsInsight {
  category: 'optimization' | 'hidden_cost' | 'growth_adjustment' | 'roi_validation' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings?: string;
  suggestedAction?: string;
}

export interface GrowthRateOverride {
  apiGrowthRate?: number;     // override default 12%
  infraGrowthRate?: number;   // override default 5%
  opsGrowthRate?: number;     // override default 8%
  reasoning: string;
}

export interface FinOpsInsightsResult {
  insights: FinOpsInsight[];
  growthRateOverrides?: GrowthRateOverride;
  tokenUsage: { input: number; output: number };
}

export class FinOpsInsightsEngine {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for FinOps Insights');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateInsights(
    useCaseTitle: string,
    currentFinOps: {
      devCostBase?: number;
      apiCostBase?: number;
      infraCostBase?: number;
      opCostBase?: number;
      valueBase?: number;
      valueGrowthRate?: number;
      budgetRange?: string;
    },
    assessmentContextText?: string
  ): Promise<FinOpsInsightsResult> {
    const contextSection = assessmentContextText
      ? `\n## FULL ASSESSMENT CONTEXT\n${assessmentContextText.substring(0, 20000)}`
      : '';

    const prompt = `You are an AI FinOps expert. Analyze the following AI use case and its cost structure, then provide actionable insights.

## USE CASE
Title: ${useCaseTitle}

## CURRENT COST STRUCTURE
- Initial Development Cost: $${currentFinOps.devCostBase?.toLocaleString() || 'N/A'}
- Monthly API Cost: $${currentFinOps.apiCostBase?.toLocaleString() || 'N/A'}
- Monthly Infrastructure Cost: $${currentFinOps.infraCostBase?.toLocaleString() || 'N/A'}
- Monthly Operations Cost: $${currentFinOps.opCostBase?.toLocaleString() || 'N/A'}
- Monthly Value Generated: $${currentFinOps.valueBase?.toLocaleString() || 'N/A'}
- Value Growth Rate: ${((currentFinOps.valueGrowthRate || 0) * 100).toFixed(1)}%/yr
- Budget Range: ${currentFinOps.budgetRange || 'N/A'}

## DEFAULT GROWTH ASSUMPTIONS
- API costs grow at 12%/yr (as AI usage scales)
- Infrastructure costs grow at 5%/yr
- Operations costs grow at 8%/yr
${contextSection}

Respond with a JSON object:
{
  "insights": [
    {
      "category": "<optimization|hidden_cost|growth_adjustment|roi_validation|risk>",
      "title": "<brief title>",
      "description": "<detailed insight>",
      "impact": "<high|medium|low>",
      "estimatedSavings": "<estimated monthly savings if applicable>",
      "suggestedAction": "<what to do>"
    }
  ],
  "growthRateOverrides": {
    "apiGrowthRate": <suggested API cost growth rate as decimal, e.g. 0.15 for 15%, or null to keep default>,
    "infraGrowthRate": <suggested infrastructure growth rate, or null>,
    "opsGrowthRate": <suggested operations growth rate, or null>,
    "reasoning": "<why these growth rates are more appropriate>"
  }
}

Provide 4-8 insights covering:
1. At least 1 cost optimization opportunity
2. At least 1 hidden cost warning (compliance overhead, monitoring, retraining, etc.)
3. Growth rate assessment — should the defaults be adjusted based on the use case type?
4. ROI validation — is the projected value realistic?`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an AI FinOps specialist. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { insights: [], tokenUsage: { input: 0, output: 0 } };
      }

      const parsed = JSON.parse(content);

      return {
        insights: (parsed.insights || []).map((i: any) => ({
          category: i.category || 'optimization',
          title: i.title || '',
          description: i.description || '',
          impact: i.impact || 'medium',
          estimatedSavings: i.estimatedSavings,
          suggestedAction: i.suggestedAction,
        })),
        growthRateOverrides: parsed.growthRateOverrides ? {
          apiGrowthRate: parsed.growthRateOverrides.apiGrowthRate ?? undefined,
          infraGrowthRate: parsed.growthRateOverrides.infraGrowthRate ?? undefined,
          opsGrowthRate: parsed.growthRateOverrides.opsGrowthRate ?? undefined,
          reasoning: parsed.growthRateOverrides.reasoning || '',
        } : undefined,
        tokenUsage: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      console.error('[FinOps Insights Engine] Error:', error);
      return { insights: [], tokenUsage: { input: 0, output: 0 } };
    }
  }
}
