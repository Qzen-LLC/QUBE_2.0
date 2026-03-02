/**
 * LLM-Based Risk Identification Engine
 * Uses OpenAI to semantically match AI risks to use cases
 * Powered by QUBE AI Risk Data (1100+ risks from 13 taxonomies)
 */

import OpenAI from 'openai';
import { getAtlasNexusService } from './qube-ai-nexus.service';
import type {
  Risk,
  Action,
  RiskControl,
  Evaluation,
  EnrichedRisk,
  AtlasRiskRecommendation,
} from './types';

// Few-shot examples for risk identification
const FEW_SHOT_EXAMPLES = [
  {
    usecase: "Medical chatbot for patient triage that asks symptoms and recommends whether to see a doctor",
    risks: [
      "Generating inaccurate content",
      "Hallucination",
      "Over-or-under-reliance",
      "Harmful output",
      "Data privacy rights",
      "Legal accountability",
      "Lack of explainability"
    ],
    reasoning: "Medical triage involves health decisions where accuracy is critical. Hallucinations could lead to wrong diagnoses. Users might over-rely on AI recommendations. Privacy concerns with health data."
  },
  {
    usecase: "AI-powered recruitment tool that screens resumes and ranks candidates",
    risks: [
      "Decision bias",
      "Unfair discrimination",
      "Lack of explainability",
      "Data privacy rights",
      "Legal accountability",
      "Output bias",
      "Unrepresentative data"
    ],
    reasoning: "Recruitment decisions affect people's livelihoods. Risk of bias against protected groups. Legal requirements for fair hiring. Need to explain why candidates were ranked."
  },
  {
    usecase: "Customer service chatbot for handling complaints and issuing refunds",
    risks: [
      "Toxic output",
      "Inappropriate reliance on output",
      "Confidential data in prompt",
      "Exposing personal information",
      "Hallucination",
      "Prompt injection"
    ],
    reasoning: "Customer-facing system that handles sensitive data. Risk of toxic responses to frustrated customers. May process payment/personal info. Could be exploited via prompt injection."
  },
  {
    usecase: "Internal knowledge assistant that answers employee questions about company policies",
    risks: [
      "Confidential information in data",
      "Confidential data in prompt",
      "Hallucination",
      "Generating inaccurate content",
      "Lack of data transparency",
      "Groundedness"
    ],
    reasoning: "Internal tool with access to confidential policies. Risk of hallucinating policy details. Employees may rely on incorrect information for compliance decisions."
  },
  {
    usecase: "AI writing assistant that generates marketing copy and product descriptions",
    risks: [
      "Intellectual property infringement",
      "Generating misleading content",
      "Plagiarism",
      "Toxic output",
      "Generating inaccurate content"
    ],
    reasoning: "Content generation that could inadvertently copy existing work. Marketing claims must be accurate. Risk of generating inappropriate or misleading promotional content."
  }
];

// Prompt template for risk identification
const RISK_IDENTIFICATION_PROMPT = `You are an expert AI risk analyst specializing in identifying potential risks for AI systems.

Your task is to analyze a given AI use case and identify the most relevant risks from the provided risk catalog.

## Risk Catalog
The following is a comprehensive catalog of AI risks. Study each risk carefully:

{risks}

## Examples
Here are some examples of how to identify risks for different use cases:

{examples}

## Instructions
1. Carefully read the use case description
2. Consider what type of AI system is being built (GenAI, agentic, ML, etc.)
3. Think about the data being processed (personal, confidential, public)
4. Consider the stakeholders and potential impacts
5. Identify 5-15 of the MOST relevant risks from the catalog above
6. Only return risk names that EXACTLY match the catalog

## Use Case to Analyze
{usecase}

## Your Response
Return a JSON array of risk names that are most relevant to this use case.
Only include risks from the catalog above. Be specific and selective - choose the risks that are most applicable.

Return ONLY a JSON array of strings, like: ["Risk name 1", "Risk name 2", ...]`;

export interface RiskIdentificationInput {
  useCaseTitle: string;
  useCaseDescription: string;
  problemStatement?: string;
  proposedAISolution?: string;
  assessmentData?: {
    technicalFeasibility?: {
      modelTypes?: string[];
      modelProvider?: string;
      agentArchitecture?: string;
      agentCapabilities?: string[];
    };
    businessFeasibility?: {
      genAIUseCase?: string;
      interactionPattern?: string;
      userInteractionModes?: string[];
    };
    dataReadiness?: {
      dataTypes?: string[];
      trainingDataTypes?: string[];
    };
    ethicalImpact?: {
      contentGeneration?: { risks?: string[] };
      ethicalConsiderations?: { potentialHarmAreas?: string[] };
      agentBehavior?: { boundaries?: string[] };
    };
  };
}

export interface LLMRiskIdentificationResult {
  identifiedRisks: EnrichedRisk[];
  mitigations: Action[];
  controls: RiskControl[];
  evaluations: Evaluation[];
  analysis: {
    useCaseType: string;
    isGenAI: boolean;
    isAgenticAI: boolean;
    matchedTaxonomies: string[];
    totalRisksAnalyzed: number;
    llmConfidence: number;
  };
  rawLLMResponse?: string[];
}

export interface ScoredRisk {
  riskName: string;
  category: string;
  description: string;
  likelihood: string;
  impact: string;
  severity: number;
  severityLabel: string;
  justification: string;
  suggestedMitigations: string[];
  sourceType: 'llm-assessment';
}

export interface ScoredRiskResult {
  risks: ScoredRisk[];
  tokenUsage: { input: number; output: number };
}

export class RiskIdentificationEngine {
  private openai: OpenAI;
  private atlasService: ReturnType<typeof getAtlasNexusService>;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY must be set for risk identification');
    }

    this.openai = new OpenAI({ apiKey });
    this.atlasService = getAtlasNexusService();
  }

  /**
   * Build a comprehensive use case description for the LLM
   */
  private buildUseCaseDescription(input: RiskIdentificationInput): string {
    const parts: string[] = [];

    parts.push(`Use Case: ${input.useCaseTitle}`);

    if (input.useCaseDescription) {
      parts.push(`\nDescription: ${input.useCaseDescription}`);
    }

    if (input.problemStatement) {
      parts.push(`\nProblem Statement: ${input.problemStatement}`);
    }

    if (input.proposedAISolution) {
      parts.push(`\nProposed AI Solution: ${input.proposedAISolution}`);
    }

    // Add technical details if available
    const tech = input.assessmentData?.technicalFeasibility;
    if (tech) {
      const techDetails: string[] = [];
      if (tech.modelTypes?.length) {
        techDetails.push(`Model Types: ${tech.modelTypes.join(', ')}`);
      }
      if (tech.modelProvider) {
        techDetails.push(`Provider: ${tech.modelProvider}`);
      }
      if (tech.agentCapabilities?.length) {
        techDetails.push(`Agent Capabilities: ${tech.agentCapabilities.join(', ')}`);
      }
      if (techDetails.length > 0) {
        parts.push(`\nTechnical Details: ${techDetails.join('; ')}`);
      }
    }

    // Add business context if available
    const business = input.assessmentData?.businessFeasibility;
    if (business) {
      const businessDetails: string[] = [];
      if (business.genAIUseCase) {
        businessDetails.push(`Use Case Type: ${business.genAIUseCase}`);
      }
      if (business.interactionPattern) {
        businessDetails.push(`Interaction: ${business.interactionPattern}`);
      }
      if (businessDetails.length > 0) {
        parts.push(`\nBusiness Context: ${businessDetails.join('; ')}`);
      }
    }

    // Add data types if available
    const data = input.assessmentData?.dataReadiness;
    if (data?.dataTypes?.length) {
      parts.push(`\nData Types: ${data.dataTypes.join(', ')}`);
    }

    return parts.join('');
  }

  /**
   * Build the risk catalog for the prompt
   */
  private buildRiskCatalog(taxonomyId?: string): { catalog: string; riskNames: string[] } {
    // Get risks from IBM Risk Atlas (primary) or all taxonomies
    const risks = taxonomyId
      ? this.atlasService.getAllRisks({ taxonomy: taxonomyId })
      : this.atlasService.getAllRisks({ taxonomy: 'ibm-risk-atlas' });

    const catalog = risks
      .map((r, i) => `${i + 1}. ${r.name}: ${r.description.substring(0, 200)}...`)
      .join('\n');

    const riskNames = risks.map((r) => r.name);

    return { catalog, riskNames };
  }

  /**
   * Build few-shot examples for the prompt
   */
  private buildExamples(): string {
    return FEW_SHOT_EXAMPLES.map(
      (ex, i) =>
        `Example ${i + 1}:
Use Case: ${ex.usecase}
Identified Risks: ${JSON.stringify(ex.risks)}
Reasoning: ${ex.reasoning}
`
    ).join('\n');
  }

  /**
   * Identify risks using LLM semantic matching
   */
  async identifyRisks(input: RiskIdentificationInput): Promise<LLMRiskIdentificationResult> {
    console.log('[QUBE Risk Engine] Starting LLM-based risk identification...');

    const useCaseDescription = this.buildUseCaseDescription(input);
    const { catalog, riskNames } = this.buildRiskCatalog('ibm-risk-atlas');
    const examples = this.buildExamples();

    // Build the prompt
    const prompt = RISK_IDENTIFICATION_PROMPT
      .replace('{risks}', catalog)
      .replace('{examples}', examples)
      .replace('{usecase}', useCaseDescription);

    console.log('[QUBE Risk Engine] Calling OpenAI...');

    try {
      // Call OpenAI with structured output
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI risk expert. Return ONLY a valid JSON array of risk names. No explanations, no markdown, just the JSON array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const llmOutput = response.choices[0]?.message?.content || '{"risks": []}';
      console.log('[QUBE Risk Engine] LLM Response:', llmOutput);

      // Parse the response
      let identifiedRiskNames: string[] = [];
      try {
        const parsed = JSON.parse(llmOutput);

        // Handle different response formats:
        // 1. {"risks": ["risk1", "risk2"]} - expected format
        // 2. ["risk1", "risk2"] - array directly
        // 3. {"Risk Name": "description", ...} - object with risk names as keys
        if (Array.isArray(parsed)) {
          identifiedRiskNames = parsed;
        } else if (parsed.risks && Array.isArray(parsed.risks)) {
          identifiedRiskNames = parsed.risks;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Handle format where keys are risk names (common LLM response)
          identifiedRiskNames = Object.keys(parsed);
        }
      } catch (parseError) {
        console.error('[QUBE Risk Engine] Failed to parse LLM response:', parseError);
        // Try to extract array from response
        const match = llmOutput.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            identifiedRiskNames = JSON.parse(match[0]);
          } catch {
            identifiedRiskNames = [];
          }
        }
      }

      console.log('[QUBE Risk Engine] Parsed risk names:', identifiedRiskNames);

      // Filter to only valid risk names
      const validRiskNames = identifiedRiskNames.filter((name) =>
        riskNames.some(
          (catalogName) =>
            catalogName.toLowerCase() === name.toLowerCase() ||
            catalogName.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(catalogName.toLowerCase())
        )
      );

      console.log('[QUBE Risk Engine] Valid risks found:', validRiskNames.length);

      // Get full risk objects
      const allRisks = this.atlasService.getAllRisks({ taxonomy: 'ibm-risk-atlas' });
      const identifiedRisks: EnrichedRisk[] = [];
      const mitigationsMap = new Map<string, Action>();
      const controlsMap = new Map<string, RiskControl>();
      const evaluationsMap = new Map<string, Evaluation>();
      const matchedTaxonomies = new Set<string>();

      for (const riskName of validRiskNames) {
        const risk = allRisks.find(
          (r) =>
            r.name.toLowerCase() === riskName.toLowerCase() ||
            r.name.toLowerCase().includes(riskName.toLowerCase()) ||
            riskName.toLowerCase().includes(r.name.toLowerCase())
        );

        if (risk) {
          const enrichedRisk = this.atlasService.getEnrichedRisk(risk);
          identifiedRisks.push(enrichedRisk);
          matchedTaxonomies.add(risk.isDefinedByTaxonomy);

          // Collect related mitigations
          const relatedActions = this.atlasService.getRelatedActions(risk);
          for (const action of relatedActions) {
            if (!mitigationsMap.has(action.id)) {
              mitigationsMap.set(action.id, action);
            }
          }

          // Collect related controls
          const relatedControls = this.atlasService.getRelatedControls(risk);
          for (const control of relatedControls) {
            if (!controlsMap.has(control.id)) {
              controlsMap.set(control.id, control);
            }
          }

          // Collect related evaluations
          const relatedEvals = this.atlasService.getRelatedEvaluations(risk);
          for (const evaluation of relatedEvals) {
            if (!evaluationsMap.has(evaluation.id)) {
              evaluationsMap.set(evaluation.id, evaluation);
            }
          }
        }
      }

      // Also add top mitigations from NIST based on risk types
      const additionalMitigations = this.getRelevantMitigations(identifiedRisks);
      for (const action of additionalMitigations) {
        if (!mitigationsMap.has(action.id)) {
          mitigationsMap.set(action.id, action);
        }
      }

      // Add relevant controls
      const additionalControls = this.getRelevantControls(identifiedRisks);
      for (const control of additionalControls) {
        if (!controlsMap.has(control.id)) {
          controlsMap.set(control.id, control);
        }
      }

      // Add relevant evaluations
      const additionalEvaluations = this.getRelevantEvaluations(identifiedRisks);
      for (const evaluation of additionalEvaluations) {
        if (!evaluationsMap.has(evaluation.id)) {
          evaluationsMap.set(evaluation.id, evaluation);
        }
      }

      // Detect use case characteristics
      const tech = input.assessmentData?.technicalFeasibility;
      const isGenAI = this.detectGenAI(input);
      const isAgenticAI = this.detectAgenticAI(input);

      return {
        identifiedRisks,
        mitigations: Array.from(mitigationsMap.values()).slice(0, 20),
        controls: Array.from(controlsMap.values()),
        evaluations: Array.from(evaluationsMap.values()).slice(0, 10),
        analysis: {
          useCaseType: input.assessmentData?.businessFeasibility?.genAIUseCase || 'General AI',
          isGenAI,
          isAgenticAI,
          matchedTaxonomies: Array.from(matchedTaxonomies),
          totalRisksAnalyzed: allRisks.length,
          llmConfidence: validRiskNames.length / Math.max(identifiedRiskNames.length, 1),
        },
        rawLLMResponse: identifiedRiskNames,
      };
    } catch (error) {
      console.error('[QUBE Risk Engine] OpenAI error:', error);
      throw error;
    }
  }

  /**
   * Get relevant mitigations based on identified risks
   */
  private getRelevantMitigations(risks: EnrichedRisk[]): Action[] {
    const allActions = this.atlasService.getAllActions();
    const relevantActions: Action[] = [];

    // Keywords to match based on risk types
    const riskKeywords = new Set<string>();
    for (const risk of risks) {
      const words = risk.name.toLowerCase().split(/\s+/);
      words.forEach((w) => riskKeywords.add(w));
      if (risk.tag) {
        risk.tag.split('-').forEach((w) => riskKeywords.add(w));
      }
    }

    // Find matching actions
    for (const action of allActions) {
      // Skip actions without name or description
      if (!action || !action.name) {
        continue;
      }

      const actionText = `${action.name} ${action.description || ''}`.toLowerCase();
      const matchScore = Array.from(riskKeywords).filter((kw) =>
        actionText.includes(kw)
      ).length;

      if (matchScore >= 2) {
        relevantActions.push(action);
      }
    }

    // Sort by relevance and return top results
    return relevantActions.slice(0, 15);
  }

  /**
   * Get relevant controls based on identified risks
   * For GenAI systems, we return core safety controls as a baseline
   */
  private getRelevantControls(risks: EnrichedRisk[]): RiskControl[] {
    const allControls = this.atlasService.getAllControls();
    const relevantControls: RiskControl[] = [];
    const addedIds = new Set<string>();

    // Build a set of all risk-related keywords for matching
    const riskKeywords = new Set<string>();
    for (const risk of risks) {
      const words = risk.name.toLowerCase().split(/\s+/);
      words.forEach((w) => {
        if (w.length > 3) riskKeywords.add(w); // Only meaningful words
      });
      if (risk.tag) {
        risk.tag.split(/[-_]/).forEach((w) => riskKeywords.add(w.toLowerCase()));
      }
      if (risk.description) {
        // Extract key terms from description
        const descWords = risk.description.toLowerCase().match(/\b(harm|bias|toxic|privacy|hallucin|inaccurate|misleading|security|safety|content|output|data)\b/g);
        if (descWords) descWords.forEach((w) => riskKeywords.add(w));
      }
    }

    // Core safety keywords that should always include controls
    const safetyKeywords = ['harm', 'bias', 'toxic', 'safety', 'content', 'output', 'security',
                           'hallucin', 'ground', 'relevance', 'privacy', 'pii', 'sensitive',
                           'jailbreak', 'profanity', 'violence', 'unethical'];

    // Check if any risk relates to these safety categories
    const hasSafetyRelatedRisks = risks.length > 0; // If we have any AI risks, include safety controls

    for (const control of allControls) {
      if (!control || !control.name) continue;
      if (addedIds.has(control.id)) continue;

      const controlName = control.name.toLowerCase();
      const controlDesc = (control.description || '').toLowerCase();
      const controlText = `${controlName} ${controlDesc}`;

      // Check if control matches any risk keywords
      const matchesRiskKeyword = Array.from(riskKeywords).some((kw) => controlText.includes(kw));

      // Check if control is a core safety control
      const isSafetyControl = safetyKeywords.some((kw) => controlText.includes(kw));

      if (matchesRiskKeyword || (hasSafetyRelatedRisks && isSafetyControl)) {
        relevantControls.push(control);
        addedIds.add(control.id);
      }
    }

    // If still no controls and we have risks, add all available controls (they're all safety-related)
    if (relevantControls.length === 0 && risks.length > 0) {
      for (const control of allControls) {
        if (!control || !control.name) continue;
        if (!addedIds.has(control.id)) {
          relevantControls.push(control);
          addedIds.add(control.id);
        }
      }
    }

    return relevantControls;
  }

  /**
   * Get relevant evaluations/benchmarks based on identified risks
   * Returns benchmarks that can help measure the identified risk categories
   */
  private getRelevantEvaluations(risks: EnrichedRisk[]): Evaluation[] {
    const allEvaluations = this.atlasService.getAllEvaluations();
    const relevantEvaluations: Evaluation[] = [];
    const addedIds = new Set<string>();

    // Build risk keywords for matching
    const riskKeywords = new Set<string>();
    for (const risk of risks) {
      const words = risk.name.toLowerCase().split(/\s+/);
      words.forEach((w) => {
        if (w.length > 3) riskKeywords.add(w);
      });
      if (risk.tag) {
        risk.tag.split(/[-_]/).forEach((w) => riskKeywords.add(w.toLowerCase()));
      }
    }

    // Map of evaluation keywords to common risk types
    const evalKeywordMap: Record<string, string[]> = {
      'truthful': ['hallucin', 'inaccurate', 'misleading', 'false', 'accuracy'],
      'bias': ['bias', 'fairness', 'discriminat', 'unfair'],
      'toxic': ['toxic', 'harm', 'offensive', 'profan'],
      'stereotype': ['bias', 'stereotype', 'discriminat'],
      'sentiment': ['bias', 'output'],
      'factual': ['hallucin', 'inaccurate', 'ground', 'accuracy'],
      'safety': ['harm', 'safety', 'security', 'risk'],
      'benchmark': ['quality', 'performance', 'accuracy'],
    };

    // Check if we have any AI risks (should include relevant evaluations)
    const hasAIRisks = risks.length > 0;

    for (const evaluation of allEvaluations) {
      if (!evaluation || !evaluation.name) continue;
      if (addedIds.has(evaluation.id)) continue;

      const evalName = evaluation.name.toLowerCase();
      const evalDesc = (evaluation.description || '').toLowerCase();
      const evalText = `${evalName} ${evalDesc}`;

      // Check direct keyword match with risks
      const matchesRiskKeyword = Array.from(riskKeywords).some((kw) => evalText.includes(kw));

      // Check if evaluation relates to common AI risk categories
      let matchesRiskCategory = false;
      for (const [evalKw, riskKws] of Object.entries(evalKeywordMap)) {
        if (evalText.includes(evalKw)) {
          // This evaluation is about this category
          const riskHasCategory = risks.some((r) => {
            const rText = `${r.name} ${r.description || ''} ${r.tag || ''}`.toLowerCase();
            return riskKws.some((rkw) => rText.includes(rkw));
          });
          if (riskHasCategory) {
            matchesRiskCategory = true;
            break;
          }
        }
      }

      // For GenAI use cases, include core evaluation benchmarks
      const isCoreEvaluation = ['truthful', 'bias', 'toxic', 'stereotype', 'bbq', 'bold', 'winobias', 'crows']
        .some((kw) => evalText.includes(kw));

      if (matchesRiskKeyword || matchesRiskCategory || (hasAIRisks && isCoreEvaluation)) {
        relevantEvaluations.push(evaluation);
        addedIds.add(evaluation.id);
      }
    }

    // If still no evaluations and we have risks, add common benchmarks
    if (relevantEvaluations.length === 0 && risks.length > 0) {
      // Add at least some core evaluations for any AI system
      for (const evaluation of allEvaluations) {
        if (!evaluation || !evaluation.name) continue;
        if (addedIds.has(evaluation.id)) continue;
        if (relevantEvaluations.length >= 10) break; // Limit to 10

        relevantEvaluations.push(evaluation);
        addedIds.add(evaluation.id);
      }
    }

    return relevantEvaluations;
  }

  /**
   * Detect if use case involves Generative AI
   */
  private detectGenAI(input: RiskIdentificationInput): boolean {
    const tech = input.assessmentData?.technicalFeasibility;
    if (!tech) return true; // Default to true for modern AI systems

    const genAIKeywords = ['llm', 'large language', 'generative', 'gpt', 'claude', 'gemini', 'multimodal', 'chat'];

    if (tech.modelTypes?.some((mt) => genAIKeywords.some((kw) => mt.toLowerCase().includes(kw)))) {
      return true;
    }

    if (tech.modelProvider) {
      const providers = ['openai', 'anthropic', 'google', 'meta', 'huggingface', 'cohere'];
      if (providers.some((p) => tech.modelProvider?.toLowerCase().includes(p))) {
        return true;
      }
    }

    return !!input.assessmentData?.businessFeasibility?.genAIUseCase;
  }

  /**
   * Detect if use case involves Agentic AI
   */
  private detectAgenticAI(input: RiskIdentificationInput): boolean {
    const tech = input.assessmentData?.technicalFeasibility;
    if (!tech) return false;

    if (tech.agentArchitecture && tech.agentArchitecture.trim().length > 0) {
      return true;
    }

    if (tech.agentCapabilities && tech.agentCapabilities.length > 0) {
      return true;
    }

    const ethical = input.assessmentData?.ethicalImpact;
    if (ethical?.agentBehavior?.boundaries && ethical.agentBehavior.boundaries.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Semantic Search - Use OpenAI to find risks that semantically match a search query
   * Returns risks ranked by relevance score
   */
  async semanticSearch(
    query: string,
    options?: {
      taxonomies?: string[];
      limit?: number;
    }
  ): Promise<{
    risks: EnrichedRisk[];
    relevanceScores: Record<string, number>;
    totalMatched: number;
  }> {
    console.log('[QUBE Risk Engine] Starting semantic search for:', query);

    const limit = options?.limit || 20;

    // Get all risks, optionally filtered by taxonomy
    let allRisks = this.atlasService.getAllRisks();
    if (options?.taxonomies && options.taxonomies.length > 0) {
      allRisks = allRisks.filter(r => options.taxonomies!.includes(r.isDefinedByTaxonomy));
    }

    // Build a compact risk catalog for the prompt (limit to prevent token overflow)
    const riskCatalog = allRisks
      .slice(0, 500) // Limit for context window
      .map((r, i) => `${i + 1}. [${r.id}] ${r.name}: ${r.description?.substring(0, 150) || ''}`)
      .join('\n');

    const prompt = `You are an AI risk expert. Given the following search query, find the most relevant AI risks from the catalog below.

## Search Query
"${query}"

## Risk Catalog
${riskCatalog}

## Instructions
1. Analyze the search query to understand what the user is looking for
2. Find risks that are semantically related to the query (not just keyword matching)
3. Consider synonyms, related concepts, and broader/narrower terms
4. Return the TOP ${limit} most relevant risks

## Response Format
Return a JSON array of objects with risk ID and relevance score (0-100):
[{"id": "risk-id-here", "score": 95}, ...]

Only return the JSON array, nothing else.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI risk expert. Return ONLY valid JSON arrays. No explanations, no markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content?.trim() || '[]';
      console.log('[QUBE Risk Engine] Semantic search raw response length:', content.length);

      // Parse the response
      let results: Array<{ id: string; score: number }> = [];
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanContent = content;
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }
        results = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('[QUBE Risk Engine] Failed to parse semantic search response:', parseError);
        // Fallback to keyword matching
        return this.fallbackKeywordSearch(query, allRisks, limit);
      }

      // Map results to enriched risks
      const relevanceScores: Record<string, number> = {};
      const matchedRisks: EnrichedRisk[] = [];

      for (const result of results) {
        const risk = allRisks.find(r => r.id === result.id);
        if (risk) {
          const enrichedRisk = this.atlasService.getEnrichedRisk(risk);
          matchedRisks.push(enrichedRisk);
          relevanceScores[risk.id] = result.score / 100; // Normalize to 0-1
        }
      }

      // Sort by relevance score
      matchedRisks.sort((a, b) => (relevanceScores[b.id] || 0) - (relevanceScores[a.id] || 0));

      console.log('[QUBE Risk Engine] Semantic search found', matchedRisks.length, 'relevant risks');

      return {
        risks: matchedRisks.slice(0, limit),
        relevanceScores,
        totalMatched: matchedRisks.length,
      };
    } catch (error) {
      console.error('[QUBE Risk Engine] Semantic search error:', error);
      // Fallback to keyword search
      return this.fallbackKeywordSearch(query, allRisks, limit);
    }
  }

  /**
   * Fallback keyword search when AI search fails
   */
  private fallbackKeywordSearch(
    query: string,
    risks: Risk[],
    limit: number
  ): { risks: EnrichedRisk[]; relevanceScores: Record<string, number>; totalMatched: number } {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const relevanceScores: Record<string, number> = {};
    const matchedRisks: Array<{ risk: Risk; score: number }> = [];

    for (const risk of risks) {
      const riskText = `${risk.name} ${risk.description || ''} ${risk.tags?.join(' ') || ''}`.toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (riskText.includes(word)) {
          score += 1;
          // Bonus for name match
          if (risk.name?.toLowerCase().includes(word)) {
            score += 0.5;
          }
        }
      }

      if (score > 0) {
        const normalizedScore = Math.min(1, score / queryWords.length);
        relevanceScores[risk.id] = normalizedScore;
        matchedRisks.push({ risk, score: normalizedScore });
      }
    }

    // Sort by score and take top results
    matchedRisks.sort((a, b) => b.score - a.score);
    const topRisks = matchedRisks.slice(0, limit).map(m => this.atlasService.getEnrichedRisk(m.risk));

    return {
      risks: topRisks,
      relevanceScores,
      totalMatched: matchedRisks.length,
    };
  }

  /**
   * Phase 2: Score identified risks with full assessment context.
   * Uses gpt-4o for nuanced severity scoring with justification.
   */
  async identifyAndScoreRisks(
    input: RiskIdentificationInput,
    assessmentContextText?: string
  ): Promise<ScoredRiskResult> {
    // Phase 1: Identify risks using existing method
    const identified = await this.identifyRisks(input);

    if (identified.identifiedRisks.length === 0) {
      return { risks: [], tokenUsage: { input: 0, output: 0 } };
    }

    // Phase 2: Score risks with full context
    const riskList = identified.identifiedRisks
      .slice(0, 25) // limit to top 25
      .map(r => `- ${r.name}: ${r.description || ''}`)
      .join('\n');

    const contextSection = assessmentContextText
      ? `\n## FULL ASSESSMENT CONTEXT\n${assessmentContextText.substring(0, 30000)}`
      : '';

    const scoringPrompt = `You are a risk scoring expert for AI systems. Given the identified risks and use case context, score each risk.

## USE CASE
Title: ${input.useCaseTitle}
Description: ${input.useCaseDescription}
${contextSection}

## IDENTIFIED RISKS
${riskList}

For each risk, provide a JSON object in this format:
{
  "scoredRisks": [
    {
      "riskName": "<risk name>",
      "category": "<risk category: Technical, Ethical, Legal, Operational, Business, Security>",
      "description": "<1-2 sentence description specific to this use case>",
      "likelihood": "<Very High|High|Medium|Low>",
      "impact": "<Critical|High|Medium|Low>",
      "severity": <1-10 integer>,
      "justification": "<why this severity for this specific use case>",
      "suggestedMitigations": ["<mitigation 1>", "<mitigation 2>"]
    }
  ]
}

Scoring guidance:
- severity 8-10: Critical — could cause significant harm, regulatory violation, or system failure
- severity 6-7: High — material impact on operations, users, or compliance
- severity 4-5: Medium — notable risk requiring monitoring and planning
- severity 1-3: Low — minor risk with limited impact`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an AI risk assessment specialist. Respond with valid JSON only.' },
          { role: 'user', content: scoringPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { risks: [], tokenUsage: { input: 0, output: 0 } };
      }

      const parsed = JSON.parse(content);
      const scoredRisks: ScoredRisk[] = (parsed.scoredRisks || []).map((r: any) => ({
        riskName: r.riskName || '',
        category: r.category || 'Technical',
        description: r.description || '',
        likelihood: r.likelihood || 'Medium',
        impact: r.impact || 'Medium',
        severity: Math.max(1, Math.min(10, Math.round(r.severity || 5))),
        severityLabel: r.severity >= 8 ? 'Critical' : r.severity >= 6 ? 'High' : r.severity >= 4 ? 'Medium' : 'Low',
        justification: r.justification || '',
        suggestedMitigations: r.suggestedMitigations || [],
        sourceType: 'llm-assessment' as const,
      }));

      return {
        risks: scoredRisks,
        tokenUsage: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      console.error('[QUBE Risk Engine] Error scoring risks:', error);
      // Fall back to unscored risks
      return {
        risks: identified.identifiedRisks.slice(0, 25).map(r => ({
          riskName: r.name,
          category: r.taxonomy || 'Technical',
          description: r.description || '',
          likelihood: 'Medium',
          impact: 'Medium',
          severity: 5,
          severityLabel: 'Medium',
          justification: 'Auto-identified by risk engine, not yet scored.',
          suggestedMitigations: [],
          sourceType: 'llm-assessment' as const,
        })),
        tokenUsage: { input: 0, output: 0 },
      };
    }
  }
}

// Singleton instance
let engineInstance: RiskIdentificationEngine | null = null;

export function getRiskIdentificationEngine(): RiskIdentificationEngine {
  if (!engineInstance) {
    engineInstance = new RiskIdentificationEngine();
  }
  return engineInstance;
}

// Clear the engine cache (useful for testing/reloading)
export function clearRiskIdentificationEngineCache(): void {
  engineInstance = null;
}
