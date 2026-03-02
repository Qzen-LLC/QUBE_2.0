/**
 * LangSmith Tracer for comprehensive LLM observability
 */

import { Client } from 'langsmith';
import { RunTree } from 'langsmith/run_trees';
import OpenAI from 'openai';
import { 
  TraceMetadata, 
  LLMCallMetrics, 
  MODEL_PRICING, 
  ObservabilityConfig 
} from './types';

export class LangSmithTracer {
  private static instance: LangSmithTracer;
  private client: Client | null = null;
  private config: ObservabilityConfig;
  private currentRun: RunTree | null = null;
  private runStack: RunTree[] = [];

  private constructor() {
    this.config = {
      enabled: process.env.ENABLE_OBSERVABILITY === 'true',
      level: (process.env.OBSERVABILITY_LEVEL as any) || 'detailed',
      langsmithApiKey: process.env.LANGSMITH_API_KEY,
      langsmithProject: process.env.LANGSMITH_PROJECT || 'default',
      capturePrompts: true,
      captureResponses: true,
      sanitizeSensitiveData: false, // Temporarily disabled to debug output issue
      enableCostTracking: true,
      enableLatencyTracking: true,
    };

    console.log('🔍 LangSmith Config:', {
      enabled: this.config.enabled,
      hasApiKey: !!this.config.langsmithApiKey,
      project: this.config.langsmithProject,
      level: this.config.level
    });

    if (this.config.enabled && this.config.langsmithApiKey) {
      this.initializeClient();
    } else {
      console.warn('⚠️ LangSmith not initialized:', {
        enabled: this.config.enabled,
        hasApiKey: !!this.config.langsmithApiKey
      });
    }
  }

  static getInstance(): LangSmithTracer {
    if (!LangSmithTracer.instance) {
      LangSmithTracer.instance = new LangSmithTracer();
    }
    return LangSmithTracer.instance;
  }

  private initializeClient() {
    try {
      // LangSmith client also checks process.env directly
      process.env.LANGSMITH_API_KEY = this.config.langsmithApiKey;
      process.env.LANGSMITH_PROJECT = this.config.langsmithProject;

      this.client = new Client({
        apiKey: this.config.langsmithApiKey,
        apiUrl: 'https://api.smith.langchain.com',
      });
      console.log('✅ LangSmith client initialized successfully');
      console.log('📊 LangSmith project:', this.config.langsmithProject);
    } catch (error) {
      console.error('❌ Failed to initialize LangSmith client:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Start a new trace session
   */
  async startSession(metadata: TraceMetadata): Promise<RunTree | null> {
    console.log('📌 LangSmith startSession called:', {
      enabled: this.config.enabled,
      hasClient: !!this.client,
      metadata
    });

    if (!this.config.enabled || !this.client) {
      console.warn('⚠️ LangSmith session not started - disabled or no client');
      return null;
    }

    try {
      const run = new RunTree({
        name: metadata.agentName || 'LLM Session',
        run_type: 'chain',
        inputs: {
          useCaseId: metadata.useCaseId,
          useCaseTitle: metadata.useCaseTitle,
          phase: metadata.phase,
          sessionId: metadata.sessionId || `session-${Date.now()}`,
        },
        tags: metadata.tags || [],
        project_name: this.config.langsmithProject,
      });

      await run.postRun();
      this.currentRun = run;
      this.runStack = [run];

      console.log(`🎯 Started LangSmith session: ${run.id}`);
      console.log(`📊 View at: https://smith.langchain.com/public/${this.config.langsmithProject}/r/${run.id}`);
      return run;
    } catch (error) {
      console.error('Failed to start LangSmith session:', error);
      return null;
    }
  }

  /**
   * Trace an LLM call with full metrics
   */
  async traceLLMCall<T>(
    operation: () => Promise<T>,
    metadata: TraceMetadata & {
      prompt: string;
      systemPrompt?: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const parentRun = this.runStack[this.runStack.length - 1] || this.currentRun;

    // Create child run for this LLM call
    let childRun: RunTree | null = null;

    if (this.config.enabled && parentRun) {
      // Prepare standardized chat messages for better LangSmith rendering
      const messages = this.config.capturePrompts
        ? [
            ...(metadata.systemPrompt
              ? [{ role: 'system', content: this.sanitize(metadata.systemPrompt) } as any]
              : []),
            { role: 'user', content: this.sanitize(metadata.prompt) } as any,
          ]
        : undefined;

      childRun = parentRun.createChild({
        name: `LLM Call: ${metadata.agentName || 'Direct'}`,
        run_type: 'llm',
        inputs: this.config.capturePrompts
          ? {
              messages,
              model: metadata.model,
              temperature: metadata.temperature,
              max_tokens: metadata.maxTokens,
            }
          : { model: metadata.model },
        tags: [...(metadata.tags || []), metadata.model, 'llm-call'],
      });

      console.log(`🔄 Creating LLM run: ${childRun.id} for ${metadata.agentName || 'Direct'}`);

      try {
        await childRun.postRun();
        console.log(`✅ Posted LLM run: ${childRun.id}`);
      } catch (postError) {
        console.error(`❌ Failed to post LLM run: ${childRun.id}`, postError);
        childRun = null; // Don't track if we can't post
      }

      if (childRun) {
        this.runStack.push(childRun);
      }
    }

    try {
      // Execute the actual LLM call
      const result = await operation();
      const endTime = Date.now();
      const latencyMs = endTime - startTime;

      // Calculate metrics if result is from OpenAI
      let metrics: LLMCallMetrics | undefined;
      if (result && typeof result === 'object' && 'usage' in result) {
        const usage = (result as any).usage;
        metrics = {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          estimatedCost: this.calculateCost(
            metadata.model,
            usage?.prompt_tokens || 0,
            usage?.completion_tokens || 0
          ),
          latencyMs,
          model: metadata.model,
          temperature: metadata.temperature,
          maxTokens: metadata.maxTokens,
        };
      }

      // Update run with outputs and metrics
      if (childRun) {
        // Get the raw content string from OpenAI response
        let rawContent = '';
        if (result && typeof result === 'object' && 'choices' in result) {
          rawContent = (result as any).choices?.[0]?.message?.content || '';
        }

        // Fallback: extract response from other result shapes
        if (!rawContent) {
          const extracted = this.extractResponse(result);
          if (typeof extracted === 'string') {
            rawContent = extracted;
          } else if (extracted != null) {
            try {
              rawContent = JSON.stringify(extracted);
            } catch {
              rawContent = String(extracted);
            }
          }
        }

        // Final fallback: ensure we always have some content
        if (!rawContent) {
          console.warn(`⚠️ Could not extract response content for ${metadata.agentName}`);
          rawContent = 'No response content';
        }

        // Apply sanitization to the raw string if enabled
        const outputToSend = this.config.sanitizeSensitiveData ? this.sanitize(rawContent) : rawContent;

        console.log(`📝 Ending LLM run: ${childRun.id} with ${outputToSend.length} chars`);

        try {
          // Simplified format for LLM runs - matching LangSmith's expected structure
          const endPayload = {
            outputs: this.config.captureResponses
              ? {
                  // LangSmith expects generations for LLM runs
                  generations: [[{
                    text: outputToSend,
                    message: {
                      role: 'assistant',
                      content: outputToSend
                    }
                  }]],
                  llm_output: {
                    token_usage: {
                      prompt_tokens: metrics?.promptTokens || 0,
                      completion_tokens: metrics?.completionTokens || 0,
                      total_tokens: metrics?.totalTokens || 0,
                    },
                    model_name: metadata.model,
                  },
                }
              : {
                  llm_output: {
                    token_usage: {
                      total_tokens: metrics?.totalTokens || 0
                    }
                  }
                },
          };

          await childRun.end(endPayload);
          console.log(`✅ Ended LLM run: ${childRun.id}`);

          // CRITICAL: Must call patchRun to send the update to LangSmith
          try {
            await childRun.patchRun();
            console.log(`✅ Patched LLM run to LangSmith: ${childRun.id}`);
          } catch (patchError) {
            console.error(`❌ Failed to patch LLM run ${childRun.id}:`, patchError);
          }
        } catch (endError) {
          console.error(`❌ Failed to end LLM run ${childRun.id}:`, endError);
          // Try minimal end format as fallback
          try {
            await childRun.end({});
            console.log(`⚠️ Ended LLM run with empty output: ${childRun.id}`);

            // Still try to patch even with empty output
            try {
              await childRun.patchRun();
              console.log(`⚠️ Patched empty LLM run: ${childRun.id}`);
            } catch (patchError) {
              console.error(`❌ Failed to patch empty run ${childRun.id}:`, patchError);
            }
          } catch (fallbackError) {
            console.error(`❌ Complete failure to end run ${childRun.id}:`, fallbackError);
          }
        }

        this.runStack.pop();

        // Log to console if in detailed mode
        if (this.config.level === 'detailed' || this.config.level === 'debug') {
          console.log(`📊 LLM Call Metrics [${metadata.agentName}]:`);
          if (metrics) {
            console.log(`   • Tokens: ${metrics.totalTokens} (prompt: ${metrics.promptTokens}, completion: ${metrics.completionTokens})`);
            console.log(`   • Cost: $${metrics.estimatedCost.toFixed(4)}`);
            console.log(`   • Latency: ${metrics.latencyMs}ms`);
          }
        }
      }

      return result;
    } catch (error) {
      // Log error to run
      if (childRun) {
        console.log(`❌ Ending LLM run with error: ${childRun.id}`);
        try {
          await childRun.end({
            error: String(error),
            outputs: { error: String(error) },
          });
          console.log(`✅ Ended errored LLM run: ${childRun.id}`);

          // Patch the error state to LangSmith
          try {
            await childRun.patchRun();
            console.log(`✅ Patched errored run to LangSmith: ${childRun.id}`);
          } catch (patchError) {
            console.error(`❌ Failed to patch errored run ${childRun.id}:`, patchError);
          }
        } catch (endError) {
          console.error(`❌ Failed to end errored run ${childRun.id}:`, endError);
        }
        this.runStack.pop();
      }
      
      console.error(`❌ LLM call failed [${metadata.agentName}]:`, error);
      throw error;
    }
  }

  /**
   * Create a child trace for agent execution
   */
  async startAgentTrace(
    agentName: string,
    agentType: TraceMetadata['agentType'],
    inputs?: any
  ): Promise<RunTree | null> {
    if (!this.config.enabled) return null;

    const parentRun = this.runStack[this.runStack.length - 1] || this.currentRun;
    if (!parentRun) return null;

    try {
      const childRun = parentRun.createChild({
        name: `Agent: ${agentName}`,
        run_type: 'chain',
        inputs: this.config.capturePrompts ? this.sanitize(inputs) : { agentName },
        tags: [agentType || 'agent', agentName],
      });

      // Post the agent run to LangSmith
      await childRun.postRun();
      this.runStack.push(childRun);

      console.log(`🤖 Started agent trace: ${agentName} (run: ${childRun.id})`);
      return childRun;
    } catch (error) {
      console.error(`Failed to start agent trace for ${agentName}:`, error);
      return null;
    }
  }

  /**
   * End an agent trace with outputs and structured metadata
   */
  async endAgentTrace(outputs?: any, error?: any) {
    if (!this.config.enabled || this.runStack.length === 0) return;

    const run = this.runStack.pop();
    if (!run) return;

    try {
      let preparedOutputs: any = undefined;
      if (this.config.captureResponses && outputs !== undefined) {
        const sanitized = this.sanitize(outputs);

        // Structure outputs with reasoning and metrics as first-class fields
        preparedOutputs = {
          // Main outputs
          outputs: sanitized.outputs || sanitized,

          // Reasoning chain (visible in LangSmith)
          reasoning: sanitized.reasoning ? {
            strategy: sanitized.reasoning.strategy,
            steps: sanitized.reasoning.steps?.map((step: any) => ({
              phase: step.phase,
              thought: typeof step.thought === 'string' ? step.thought.substring(0, 200) : step.thought,
              confidence: step.confidence
            })),
            totalSteps: sanitized.reasoning.steps?.length || 0,
            totalTokens: sanitized.reasoning.totalTokens,
            totalLatency: sanitized.reasoning.totalLatency
          } : undefined,

          // Metrics (visible in LangSmith)
          metrics: sanitized.metrics,

          // Metadata
          success: sanitized.success,
          agentName: sanitized.agentName,
          timestamp: sanitized.timestamp,

          // Convert to text for LangSmith messages format
          summary: this.createOutputSummary(sanitized)
        };

        // Add messages format for better LangSmith UI rendering
        const outputText = this.createOutputSummary(sanitized);
        preparedOutputs.messages = [{ role: 'assistant', content: outputText }];
      }

      await run.end({
        outputs: preparedOutputs,
        error: error ? String(error) : undefined,
      });

      // CRITICAL: Must patch to send update to LangSmith
      try {
        await run.patchRun();
        console.log(`✅ Ended and patched agent trace: ${run.name}`);
      } catch (patchError) {
        console.error(`❌ Failed to patch agent trace ${run.name}:`, patchError);
      }
    } catch (err) {
      console.error('Failed to end agent trace:', err);
    }
  }

  /**
   * Create a human-readable summary of agent outputs
   */
  private createOutputSummary(outputs: any): string {
    const lines: string[] = [];

    // Add main output summary
    if (outputs.outputs) {
      if (Array.isArray(outputs.outputs)) {
        lines.push(`Generated ${outputs.outputs.length} items`);
      } else if (outputs.outputs.guardrails) {
        lines.push(`Generated ${outputs.outputs.guardrails.length} guardrails`);
        if (outputs.outputs.insights?.length > 0) {
          lines.push(`Insights: ${outputs.outputs.insights.length}`);
        }
        if (outputs.outputs.concerns?.length > 0) {
          lines.push(`Concerns: ${outputs.outputs.concerns.length}`);
        }
        if (outputs.outputs.confidence) {
          lines.push(`Confidence: ${(outputs.outputs.confidence * 100).toFixed(1)}%`);
        }
      }
    }

    // Add reasoning summary
    if (outputs.reasoning) {
      lines.push(`\nReasoning: ${outputs.reasoning.strategy || 'N/A'}`);
      lines.push(`Steps: ${outputs.reasoning.steps?.length || 0}`);
      lines.push(`Tokens: ${outputs.reasoning.totalTokens || 0}`);
      lines.push(`Duration: ${outputs.reasoning.totalLatency || 0}ms`);
    }

    // Add success status
    if (outputs.success !== undefined) {
      lines.push(`\nSuccess: ${outputs.success ? '✅' : '❌'}`);
    }

    return lines.join('\n');
  }

  /**
   * End the current session
   */
  async endSession(outputs?: any, error?: any) {
    if (!this.config.enabled || !this.currentRun) return;

    try {
      // End all remaining runs in stack
      while (this.runStack.length > 1) {
        const run = this.runStack.pop();
        if (run) {
          await run.end({ outputs: { status: 'parent-ended' } });
          // Patch each remaining run
          try {
            await run.patchRun();
          } catch (patchError) {
            console.error(`Failed to patch remaining run:`, patchError);
          }
        }
      }

      // Prepare outputs for session (chain) run
      let preparedOutputs: any = undefined;
      if (this.config.captureResponses && outputs !== undefined) {
        const sanitized = this.sanitize(outputs);
        const outputText =
          typeof sanitized === 'string'
            ? sanitized
            : (() => { try { return JSON.stringify(sanitized); } catch { return String(sanitized); } })();

        preparedOutputs = {
          output: outputText,
          data: sanitized,
          messages: [ { role: 'assistant', content: outputText } ],
        };
      }

      // End the main session
      await this.currentRun.end({
        outputs: preparedOutputs,
        error: error ? String(error) : undefined,
      });

      // CRITICAL: Patch the main session to finalize in LangSmith
      try {
        await this.currentRun.patchRun();
        console.log(`🏁 Ended and patched LangSmith session: ${this.currentRun.id}`);
        console.log(`📊 View trace at: https://smith.langchain.com/public/${this.config.langsmithProject}/r/${this.currentRun.id}`);
      } catch (patchError) {
        console.error(`❌ Failed to patch main session:`, patchError);
        console.log(`📊 Trace may be incomplete at: https://smith.langchain.com/public/${this.config.langsmithProject}/r/${this.currentRun.id}`);
      }
      
      this.currentRun = null;
      this.runStack = [];
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    if (!pricing) return 0;

    const promptCost = (promptTokens / 1000) * pricing.input;
    const completionCost = (completionTokens / 1000) * pricing.output;
    
    return promptCost + completionCost;
  }

  /**
   * Extract response content from various result formats
   */
  private extractResponse(result: any): any {
    if (!result) return '';

    // OpenAI chat completion
    if (result.choices && result.choices[0]?.message?.content) {
      const content = result.choices[0].message.content;
      // Try to parse JSON if it looks like JSON
      if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
        try {
          return JSON.parse(content);
        } catch {
          // If parsing fails, return as string
          return content;
        }
      }
      return content;
    }

    // Direct string response
    if (typeof result === 'string') {
      return result;
    }

    // Already an object - return as is
    if (typeof result === 'object') {
      return result;
    }

    return String(result);
  }

  /**
   * Sanitize sensitive data from inputs/outputs
   */
  private sanitize(data: any): any {
    if (!this.config.sanitizeSensitiveData) return data;

    // If data is already an object/array, work with it directly
    if (typeof data === 'object' && data !== null) {
      // For arrays and objects, return as-is for LangSmith
      // We'll only sanitize strings that contain sensitive patterns
      return this.sanitizeObject(data);
    }

    // For string data, apply sanitization
    if (typeof data === 'string') {
      let sanitized = data;

      // Only sanitize actual API keys and sensitive data patterns
      // Don't sanitize JSON structure or normal content
      sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{48,}/g, 'sk-***');
      sanitized = sanitized.replace(/Bearer [a-zA-Z0-9\-._~+\/]{20,}/g, 'Bearer ***');

      // Only replace emails that are clearly personal (not in JSON keys)
      sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.[a-zA-Z]{2,}/gi, '***@***.com');

      return sanitized;
    }

    return data;
  }

  /**
   * Recursively sanitize an object while preserving structure
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        // Skip sanitizing the key itself
        const value = obj[key];
        if (typeof value === 'string') {
          // Only sanitize string values that look like sensitive data
          if (value.match(/^sk-[a-zA-Z0-9]{48,}/) || value.match(/^Bearer /)) {
            sanitized[key] = '***REDACTED***';
          } else {
            sanitized[key] = value;
          }
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Get trace URL for current session
   */
  getTraceUrl(): string | null {
    if (!this.currentRun) return null;
    return `https://smith.langchain.com/public/${this.config.langsmithProject}/r/${this.currentRun.id}`;
  }

  /**
   * Get current run ID
   */
  getCurrentRunId(): string | null {
    return this.currentRun?.id || null;
  }

  /**
   * Check if tracing is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Export singleton instance
export const langsmithTracer = LangSmithTracer.getInstance();
