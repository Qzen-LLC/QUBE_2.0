import OpenAI from 'openai';
import { AgentResponse, Guardrail } from '../types';
import { guardrailLogger } from '../utils/guardrail-logger';
import { AgentTracer } from '../../observability/AgentTracer';
import { ReasoningEngine } from '../reasoning/ReasoningEngine';
import { ReasoningConfig } from '../reasoning/types';

/**
 * Base class for specialist agents that generate guardrails using autonomous reasoning
 */
export abstract class BaseSpecialistAgent {
  protected openai: OpenAI;
  protected agentName: string;
  protected domain: string;
  protected tracer: AgentTracer | null = null;
  protected reasoningEngine: ReasoningEngine;
  protected useReasoning: boolean = true; // Can be disabled for backward compatibility

  constructor(agentName: string, domain: string, tracer?: AgentTracer, reasoningConfig?: Partial<ReasoningConfig>) {
    this.agentName = agentName;
    this.domain = domain;
    this.tracer = tracer || null;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(`${agentName}: OpenAI API key not configured`);
    }

    this.openai = new OpenAI({ apiKey });

    // Initialize reasoning engine
    this.reasoningEngine = new ReasoningEngine(reasoningConfig);
  }

  /**
   * Set the tracer for this agent
   */
  public setTracer(tracer: AgentTracer): void {
    this.tracer = tracer;
  }

  /**
   * Generate guardrails using autonomous reasoning
   * NEW: Multi-step reasoning with planning, reflection, and refinement
   */
  protected async generateGuardrailsWithReasoning(
    assessmentData: any,
    useCaseContext: any,
    domainPrompt: string
  ): Promise<Guardrail[]> {
    console.log(`🧠 ${this.agentName}: Using autonomous reasoning...`);

    const goal = `Generate comprehensive ${this.domain} guardrails for: ${useCaseContext.useCaseTitle}`;
    const context = {
      domain: this.domain,
      useCaseContext,
      assessmentData,
      domainPrompt
    };

    // Start agent execution with full input context
    if (this.tracer) {
      await this.tracer.startExecution({
        agentName: this.agentName,
        domain: this.domain,
        goal: goal,
        input: {
          useCaseTitle: useCaseContext.useCaseTitle,
          useCaseContext: useCaseContext,
          assessmentData: assessmentData,
          domainPrompt: domainPrompt
        }
      });
    }

    try {
      // Use reasoning engine to autonomously generate guardrails
      const result = await this.reasoningEngine.reason(
        goal,
        context,
        async (plan, ctx, memory) => {
          // This is the actual generation task
          // The reasoning engine will call this after planning and analysis
          return await this.executeGeneration(ctx, plan, memory);
        }
      );

      // Track insights and concerns (backward compatible)
      if (this.tracer) {
        await this.tracer.trackInsights(result.insights);
        await this.tracer.trackConcerns(result.concerns);
      }

      // Log to guardrail logger
      guardrailLogger.logAgentLLMResponse(
        this.agentName,
        JSON.stringify(result.reasoning),
        result.output,
        result.success
      );

      console.log(`✅ ${this.agentName}: Generated ${result.output?.length || 0} guardrails via reasoning`);
      console.log(`   Reasoning steps: ${result.reasoning.steps.length}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      // End agent execution with complete output and reasoning
      if (this.tracer) {
        await this.tracer.endExecution(
          result.output,
          {
            reasoning: result.reasoning,
            metrics: result.metadata
          }
        );
      }

      return result.output || [];
    } catch (error) {
      console.error(`${this.agentName}: Reasoning failed:`, error);

      // End agent execution with error
      if (this.tracer) {
        await this.tracer.endExecution(null, { error: String(error) });
      }

      // Fallback to legacy method
      return await this.generateGuardrailsWithLLM(assessmentData, useCaseContext, domainPrompt);
    }
  }

  /**
   * Execute the actual guardrail generation
   * Called by reasoning engine after planning and analysis
   */
  private async executeGeneration(context: any, plan: any, memory: any): Promise<Guardrail[]> {
    const { useCaseContext, assessmentData, domainPrompt } = context;

    const systemPrompt = `You are a ${this.domain} specialist generating specific guardrails for an AI system.
    Focus ONLY on ${this.domain.toLowerCase()} aspects.

    PLAN: ${JSON.stringify(plan)}
    ANALYSIS INSIGHTS: ${memory.getInsights().join('; ')}
    CONCERNS IDENTIFIED: ${memory.getConcerns().join('; ')}

    Generate 3-7 highly specific, implementable guardrails based on the assessment data and your analysis.

    Each guardrail must be:
    - Specific to the use case: "${useCaseContext.useCaseTitle}"
    - Based on actual assessment selections and values
    - Implementable with clear configuration
    - Include monitoring metrics

    Respond with a JSON array of guardrails. Each guardrail must have:
    {
      "id": "unique-id",
      "type": "guardrail-type",
      "severity": "critical|high|medium|low",
      "rule": "SPECIFIC_RULE_NAME",
      "description": "What this guardrail does (max 100 chars)",
      "rationale": "Why needed based on assessment (max 150 chars)",
      "implementation": {
        "platform": ["applicable-platforms"],
        "configuration": { ... },
        "monitoring": [{ "metric": "...", "threshold": "...", "frequency": "..." }]
      }
    }`;

    const userPrompt = `
    ## Use Case Context
    Title: ${useCaseContext.useCaseTitle}
    Problem: ${useCaseContext.problemStatement || 'Not specified'}
    Proposed Solution: ${useCaseContext.proposedSolution || 'Not specified'}
    Key Benefits: ${useCaseContext.keyBenefits || 'Not specified'}
    Success Criteria: ${useCaseContext.successCriteria || 'Not specified'}
    Key Assumptions: ${useCaseContext.keyAssumptions || 'Not specified'}

    ## Multi-Dimensional Scoring
    ${useCaseContext.multiDimensionalScoring ? `
    - Confidence Level: ${useCaseContext.multiDimensionalScoring.confidenceLevel || 0}/10
    - Operational Impact: ${useCaseContext.multiDimensionalScoring.operationalImpact || 0}/10
    - Productivity Impact: ${useCaseContext.multiDimensionalScoring.productivityImpact || 0}/10
    - Revenue Impact: ${useCaseContext.multiDimensionalScoring.revenueImpact || 0}/10
    - Implementation Complexity: ${useCaseContext.multiDimensionalScoring.implementationComplexity || 0}/10
    ` : 'Not available'}

    ## ${this.domain} Assessment Data
    ${domainPrompt}

    ## Instructions
    Generate specific ${this.domain.toLowerCase()} guardrails based on the above assessment data and your analysis.
    Focus on the actual selections, values, and configurations from the assessment.
    Make guardrails specific to "${useCaseContext.useCaseTitle}".
    Consider the multi-dimensional scoring and key assumptions in your guardrail generation.
    `;

    const model = process.env.DEFAULT_LLM_MODEL || 'gpt-4o-mini';

    const completion = this.tracer
      ? await this.tracer.traceOpenAICall(
          this.openai,
          {
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000
          },
          `${this.domain}_guardrails_generation`
        )
      : await this.openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000
        });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return [];
    }

    try {
      const parsed = JSON.parse(response);
      const guardrails = Array.isArray(parsed) ? parsed : (parsed.guardrails || []);

      // Validate and clean guardrails
      const validGuardrails = guardrails.filter((g: any) =>
        g.id && g.type && g.severity && g.rule && g.description
      );

      return validGuardrails;
    } catch (parseError) {
      console.error(`${this.agentName}: Failed to parse LLM response:`, parseError);
      return [];
    }
  }

  /**
   * Generate guardrails using LLM based on domain-specific assessment
   * LEGACY METHOD: Kept for backward compatibility
   */
  protected async generateGuardrailsWithLLM(
    assessmentData: any,
    useCaseContext: any,
    domainPrompt: string
  ): Promise<Guardrail[]> {
    try {
      const systemPrompt = `You are a ${this.domain} specialist generating specific guardrails for an AI system.
      Focus ONLY on ${this.domain.toLowerCase()} aspects.
      Generate 3-7 highly specific, implementable guardrails based on the assessment data provided.
      
      Each guardrail must be:
      - Specific to the use case: "${useCaseContext.useCaseTitle}"
      - Based on actual assessment selections and values
      - Implementable with clear configuration
      - Include monitoring metrics
      
      Respond with a JSON array of guardrails. Each guardrail must have:
      {
        "id": "unique-id",
        "type": "guardrail-type",
        "severity": "critical|high|medium|low",
        "rule": "SPECIFIC_RULE_NAME",
        "description": "What this guardrail does (max 100 chars)",
        "rationale": "Why needed based on assessment (max 150 chars)",
        "implementation": {
          "platform": ["applicable-platforms"],
          "configuration": { ... },
          "monitoring": [{ "metric": "...", "threshold": "...", "frequency": "..." }]
        }
      }`;
      
      const userPrompt = `
      ## Use Case Context
      Title: ${useCaseContext.useCaseTitle}
      Problem: ${useCaseContext.problemStatement || 'Not specified'}
      Proposed Solution: ${useCaseContext.proposedSolution || 'Not specified'}
      Key Benefits: ${useCaseContext.keyBenefits || 'Not specified'}
      Success Criteria: ${useCaseContext.successCriteria || 'Not specified'}
      Key Assumptions: ${useCaseContext.keyAssumptions || 'Not specified'}

      ## Multi-Dimensional Scoring
      ${useCaseContext.multiDimensionalScoring ? `
      - Confidence Level: ${useCaseContext.multiDimensionalScoring.confidenceLevel || 0}/10
      - Operational Impact: ${useCaseContext.multiDimensionalScoring.operationalImpact || 0}/10
      - Productivity Impact: ${useCaseContext.multiDimensionalScoring.productivityImpact || 0}/10
      - Revenue Impact: ${useCaseContext.multiDimensionalScoring.revenueImpact || 0}/10
      - Implementation Complexity: ${useCaseContext.multiDimensionalScoring.implementationComplexity || 0}/10
      ` : 'Not available'}

      ## ${this.domain} Assessment Data
      ${domainPrompt}

      ## Instructions
      Generate specific ${this.domain.toLowerCase()} guardrails based on the above assessment data.
      Focus on the actual selections, values, and configurations from the assessment.
      Make guardrails specific to "${useCaseContext.useCaseTitle}".
      Consider the multi-dimensional scoring and key assumptions in your guardrail generation.
      `;
      
      console.log(`🤖 ${this.agentName}: Generating guardrails via LLM...`);

      const model = process.env.DEFAULT_LLM_MODEL || 'gpt-4o-mini';

      // Log the full prompts being sent to LLM
      guardrailLogger.logAgentLLMCall(this.agentName, systemPrompt, userPrompt, model);

      // Use tracer if available for observability
      const completion = this.tracer
        ? await this.tracer.traceOpenAICall(
            this.openai,
            {
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.7,
              max_tokens: 2000
            },
            `${this.domain}_guardrails_generation`
          )
        : await this.openai.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000
          });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        console.warn(`${this.agentName}: No response from LLM`);
        guardrailLogger.logAgentLLMResponse(this.agentName, null, [], false, new Error('No response from LLM'));
        return [];
      }

      try {
        const parsed = JSON.parse(response);
        const guardrails = Array.isArray(parsed) ? parsed : (parsed.guardrails || []);

        // Validate and clean guardrails
        const validGuardrails = guardrails.filter((g: any) =>
          g.id && g.type && g.severity && g.rule && g.description
        );

        // Log the full response and parsed guardrails
        guardrailLogger.logAgentLLMResponse(this.agentName, response, validGuardrails, true);

        console.log(`✅ ${this.agentName}: Generated ${validGuardrails.length} guardrails`);
        return validGuardrails;

      } catch (parseError) {
        console.error(`${this.agentName}: Failed to parse LLM response:`, parseError);
        guardrailLogger.logAgentLLMResponse(this.agentName, response, [], false, parseError);
        return [];
      }
      
    } catch (error) {
      console.error(`${this.agentName}: Error generating guardrails:`, error);
      return [];
    }
  }
  
  /**
   * Extract insights from assessment data
   */
  protected abstract extractInsights(assessmentData: any): string[];
  
  /**
   * Identify concerns based on assessment
   */
  protected abstract identifyConcerns(assessmentData: any): string[];
  
  /**
   * Generate recommendations
   */
  protected abstract generateRecommendations(assessmentData: any): string[];
  
  /**
   * Main method to analyze and propose guardrails
   */
  abstract analyzeAndPropose(context: any): Promise<AgentResponse>;
}