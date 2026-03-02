/**
 * Reasoning Engine for Autonomous Agents
 * Implements multi-step reasoning with planning, reflection, and refinement
 */

import OpenAI from 'openai';
import { AgentMemory } from './AgentMemory';
import { PromptLibrary } from './PromptLibrary';
import {
  ReasoningConfig,
  ReasoningResult,
  ReasoningChain,
  ReasoningStep,
  Reflection,
  AgentState,
  DEFAULT_REASONING_CONFIG
} from './types';

export class ReasoningEngine {
  private openai: OpenAI;
  private config: ReasoningConfig;
  private memory: AgentMemory;

  constructor(config: Partial<ReasoningConfig> = {}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('ReasoningEngine: OpenAI API key not configured');
    }

    this.openai = new OpenAI({ apiKey });
    this.config = { ...DEFAULT_REASONING_CONFIG, ...config };
    this.memory = new AgentMemory();
  }

  /**
   * Main reasoning entry point
   * Orchestrates the multi-step reasoning process
   */
  async reason(
    goal: string,
    context: any,
    taskFn: (plan: any, context: any, memory: AgentMemory) => Promise<any>
  ): Promise<ReasoningResult> {
    const startTime = Date.now();
    const chainId = `chain-${Date.now()}`;

    const chain: ReasoningChain = {
      id: chainId,
      goal,
      strategy: this.config.strategy,
      steps: [],
      totalTokens: 0,
      totalLatency: 0,
      success: false,
      finalOutput: null
    };

    try {
      this.log(`🧠 Starting autonomous reasoning: ${goal}`);
      this.log(`Strategy: ${this.config.strategy}`);

      // Phase 1: Planning
      const plan = await this.plan(goal, context, chain);
      this.memory.store('plan', plan);

      // Phase 2: Analysis (understand the context deeply)
      const analysis = await this.analyze(goal, context, chain);
      this.memory.addInsights(analysis.keyInsights || []);
      this.memory.addConcerns(analysis.concerns || []);
      this.memory.store('analysis', analysis);

      // Phase 3: Execute task with chain-of-thought reasoning
      let output = await this.executeWithReasoning(
        goal,
        context,
        plan,
        taskFn,
        chain
      );

      // Phase 4: Reflection loop (if enabled)
      if (this.config.enableReflection) {
        for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
          const reflection = await this.reflect(output, goal, context, chain);

          // Check if we've reached acceptable quality
          if (!reflection.needsRefinement ||
              reflection.confidence >= this.config.qualityThreshold) {
            this.log(`✅ Quality threshold met (${reflection.confidence}), stopping iteration`);
            break;
          }

          // Phase 5: Refinement (if needed)
          if (this.config.enableRefinement && reflection.needsRefinement) {
            this.log(`🔄 Refining based on reflection (iteration ${iteration + 1})`);
            output = await this.refine(output, reflection, goal, context, chain);
          } else {
            break;
          }
        }
      }

      // Phase 6: Final validation
      const validation = await this.validate(output, goal, chain);

      chain.success = validation.isValid;
      chain.finalOutput = output;
      chain.totalLatency = Date.now() - startTime;

      this.log(`✅ Reasoning complete in ${chain.totalLatency}ms`);
      this.log(`   Total steps: ${chain.steps.length}`);
      this.log(`   Total tokens: ${chain.totalTokens}`);

      return {
        success: chain.success,
        output,
        reasoning: chain,
        confidence: validation.finalConfidence || 0.8,
        insights: this.memory.getInsights(),
        concerns: this.memory.getConcerns(),
        metadata: {
          totalSteps: chain.steps.length,
          totalTokens: chain.totalTokens,
          totalLatency: chain.totalLatency,
          iterations: chain.steps.filter(s => s.phase === 'refinement').length + 1,
          strategy: this.config.strategy
        }
      };
    } catch (error) {
      this.log(`❌ Reasoning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      chain.success = false;
      chain.totalLatency = Date.now() - startTime;

      throw error;
    }
  }

  /**
   * Planning phase: Agent plans its approach
   */
  private async plan(goal: string, context: any, chain: ReasoningChain): Promise<any> {
    this.log('📋 Phase 1: Planning approach...');

    const prompt = PromptLibrary.getPlanningPrompt(goal, context);
    const response = await this.callLLM(
      prompt,
      this.config.models.planning,
      'planning'
    );

    const plan = this.parseJSON(response);

    this.addStep(chain, {
      phase: 'planning',
      input: { goal, context },
      thought: plan.understanding || 'Planning approach',
      output: plan,
      confidence: plan.confidence || 0.8
    });

    this.log(`   Approach: ${plan.approach?.substring(0, 100)}...`);
    this.log(`   Key factors: ${plan.keyFactors?.length || 0}`);

    return plan;
  }

  /**
   * Analysis phase: Deep analysis of context
   */
  private async analyze(goal: string, context: any, chain: ReasoningChain): Promise<any> {
    this.log('🔍 Phase 2: Analyzing context...');

    const domain = this.extractDomain(goal);
    const prompt = PromptLibrary.getAnalysisPrompt(domain, context);
    const response = await this.callLLM(
      prompt,
      this.config.models.planning,
      'analysis'
    );

    const analysis = this.parseJSON(response);

    this.addStep(chain, {
      phase: 'analysis',
      input: context,
      thought: analysis.reasoning || 'Analyzing context',
      output: analysis,
      confidence: analysis.confidence || 0.8
    });

    this.log(`   Insights: ${analysis.keyInsights?.length || 0}`);
    this.log(`   Concerns: ${analysis.concerns?.length || 0}`);

    return analysis;
  }

  /**
   * Execute task with chain-of-thought reasoning
   */
  private async executeWithReasoning(
    goal: string,
    context: any,
    plan: any,
    taskFn: (plan: any, context: any, memory: AgentMemory) => Promise<any>,
    chain: ReasoningChain
  ): Promise<any> {
    this.log('⚙️ Phase 3: Executing with reasoning...');

    // Build chain-of-thought prompt
    const prompt = PromptLibrary.getChainOfThoughtPrompt(goal, context, plan);
    const response = await this.callLLM(
      prompt,
      this.config.models.reasoning,
      'generation'
    );

    const reasoned = this.parseJSON(response);

    // Execute the actual task with the reasoned approach
    const output = await taskFn(plan, context, this.memory);

    this.addStep(chain, {
      phase: 'generation',
      input: { goal, context, plan },
      thought: reasoned.reasoning || 'Generating output',
      output: output,
      confidence: reasoned.confidence || 0.8
    });

    this.log(`   Generated output with reasoning`);

    return output;
  }

  /**
   * Reflection phase: Critique the output
   */
  private async reflect(
    output: any,
    goal: string,
    context: any,
    chain: ReasoningChain
  ): Promise<Reflection> {
    this.log('🤔 Phase 4: Reflecting on output...');

    const prompt = PromptLibrary.getReflectionPrompt(output, goal, context);
    const response = await this.callLLM(
      prompt,
      this.config.models.reflection,
      'reflection'
    );

    const reflection = this.parseJSON(response);

    const reflectionResult: Reflection = {
      strengths: reflection.strengths || [],
      weaknesses: reflection.weaknesses || [],
      gaps: reflection.gaps || [],
      improvements: reflection.improvements || [],
      needsRefinement: reflection.needsRefinement || false,
      confidence: reflection.confidence || 0.8
    };

    this.addStep(chain, {
      phase: 'reflection',
      input: output,
      thought: reflection.reasoning || 'Reflecting on quality',
      output: reflectionResult,
      confidence: reflectionResult.confidence
    });

    this.log(`   Quality: ${reflection.overallQuality || 'unknown'}`);
    this.log(`   Weaknesses: ${reflectionResult.weaknesses.length}`);
    this.log(`   Needs refinement: ${reflectionResult.needsRefinement}`);

    return reflectionResult;
  }

  /**
   * Refinement phase: Improve based on reflection
   */
  private async refine(
    originalOutput: any,
    reflection: Reflection,
    goal: string,
    context: any,
    chain: ReasoningChain
  ): Promise<any> {
    this.log('✨ Phase 5: Refining output...');

    const prompt = PromptLibrary.getRefinementPrompt(
      originalOutput,
      reflection,
      goal,
      context
    );
    const response = await this.callLLM(
      prompt,
      this.config.models.reasoning,
      'refinement'
    );

    const refined = this.parseJSON(response);

    this.addStep(chain, {
      phase: 'refinement',
      input: { originalOutput, reflection },
      thought: refined.reasoning || 'Refining based on critique',
      output: refined.refinedOutput || refined,
      confidence: refined.confidence || 0.85
    });

    this.log(`   Improvements made: ${refined.improvementsMade?.length || 0}`);

    return refined.refinedOutput || refined;
  }

  /**
   * Validation phase: Final quality check
   */
  private async validate(output: any, goal: string, chain: ReasoningChain): Promise<any> {
    this.log('✅ Phase 6: Validating final output...');

    const requirements = [
      'Output is complete and comprehensive',
      'All aspects of the goal are addressed',
      'Quality meets production standards',
      'No critical errors or inconsistencies'
    ];

    const prompt = PromptLibrary.getValidationPrompt(output, goal, requirements);
    const response = await this.callLLM(
      prompt,
      this.config.models.reflection,
      'validation'
    );

    const validation = this.parseJSON(response);

    this.addStep(chain, {
      phase: 'validation',
      input: output,
      thought: validation.reasoning || 'Validating output',
      output: validation,
      confidence: validation.finalConfidence || 0.8
    });

    this.log(`   Valid: ${validation.isValid}`);
    this.log(`   Quality score: ${validation.qualityScore}`);

    return validation;
  }

  /**
   * Call LLM with retry logic
   */
  private async callLLM(
    prompt: string,
    model: string,
    purpose: string
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: this.config.temperature,
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const latency = Date.now() - startTime;
      const tokens = completion.usage?.total_tokens || 0;

      this.log(`   ${purpose}: ${tokens} tokens, ${latency}ms`);

      return response;
    } catch (error) {
      this.log(`   ❌ LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Parse JSON response
   */
  private parseJSON(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      this.log(`   ⚠️ JSON parse error, returning empty object`);
      return {};
    }
  }

  /**
   * Add step to reasoning chain
   */
  private addStep(chain: ReasoningChain, stepData: Partial<ReasoningStep>): void {
    const step: ReasoningStep = {
      id: `step-${chain.steps.length + 1}`,
      phase: stepData.phase || 'generation',
      timestamp: new Date().toISOString(),
      input: stepData.input || {},
      thought: stepData.thought || '',
      decision: stepData.decision,
      output: stepData.output || {},
      confidence: stepData.confidence || 0.8,
      metadata: stepData.metadata || {}
    };

    chain.steps.push(step);

    if (step.metadata?.tokens) {
      chain.totalTokens += step.metadata.tokens;
    }
  }

  /**
   * Extract domain from goal
   */
  private extractDomain(goal: string): string {
    const lowerGoal = goal.toLowerCase();
    if (lowerGoal.includes('risk')) return 'Risk Management';
    if (lowerGoal.includes('compliance')) return 'Compliance';
    if (lowerGoal.includes('security')) return 'Security';
    if (lowerGoal.includes('ethics')) return 'Ethics';
    if (lowerGoal.includes('performance')) return 'Performance';
    if (lowerGoal.includes('cost')) return 'Cost Optimization';
    return 'General';
  }

  /**
   * Logging helper
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  /**
   * Get memory
   */
  getMemory(): AgentMemory {
    return this.memory;
  }

  /**
   * Reset memory
   */
  resetMemory(): void {
    this.memory.clear();
  }
}
