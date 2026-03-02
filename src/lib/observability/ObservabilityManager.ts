/**
 * Centralized Observability Manager for multi-agent systems
 */

import { langsmithTracer } from './LangSmithTracer';
import {
  TraceMetadata,
  AgentExecutionMetrics,
  OrchestrationMetrics,
  TraceSummary
} from './types';
import { prismaClient } from '@/utils/db';

export class ObservabilityManager {
  private static instance: ObservabilityManager;
  private activeTraces: Map<string, TraceSummary> = new Map();
  private agentMetrics: Map<string, AgentExecutionMetrics> = new Map();
  private orchestrationMetrics: OrchestrationMetrics | null = null;

  private constructor() {
    console.log('🔍 Observability Manager initialized');
  }

  static getInstance(): ObservabilityManager {
    if (!ObservabilityManager.instance) {
      ObservabilityManager.instance = new ObservabilityManager();
    }
    return ObservabilityManager.instance;
  }

  /**
   * Start a new observability session for a use case
   */
  async startUseCaseSession(
    useCaseId: string,
    useCaseTitle: string,
    sessionType: 'guardrails' | 'evaluation',
    additionalMetadata?: Partial<TraceMetadata>
  ): Promise<string> {
    const sessionId = `${sessionType}-${useCaseId}-${Date.now()}`;
    
    // Start LangSmith session
    await langsmithTracer.startSession({
      useCaseId,
      useCaseTitle,
      phase: sessionType,
      sessionId,
      agentType: sessionType === 'guardrails' ? 'guardrail' : 'evaluation',
      tags: [sessionType, 'use-case'],
      ...additionalMetadata
    });

    // Initialize trace summary with useCaseTitle
    const summary: TraceSummary & { useCaseTitle?: string } = {
      traceId: sessionId,
      startTime: new Date(),
      totalLLMCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      agentsInvolved: [],
      status: 'running',
      errors: [],
      useCaseTitle // Store the title in the summary
    };

    this.activeTraces.set(sessionId, summary);

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`🚀 OBSERVABILITY SESSION STARTED`);
    console.log(`📋 Use Case: ${useCaseTitle}`);
    console.log(`🔍 Session Type: ${sessionType}`);
    console.log(`🆔 Session ID: ${sessionId}`);
    const traceUrl = langsmithTracer.getTraceUrl();
    if (traceUrl) {
      console.log(`📊 LangSmith Trace: ${traceUrl}`);
    }
    console.log('═══════════════════════════════════════════════════════════════════');

    return sessionId;
  }

  /**
   * Track an agent's execution
   */
  async startAgentExecution(
    agentName: string,
    agentType: TraceMetadata['agentType'],
    inputs: any,
    sessionId?: string
  ): Promise<void> {
    // Start agent trace in LangSmith with full context
    await langsmithTracer.startAgentTrace(agentName, agentType, {
      agentName: agentName,
      agentType: agentType,
      domain: inputs.domain,
      goal: inputs.goal,
      input: inputs.input || inputs,
      timestamp: inputs.timestamp || new Date().toISOString()
    });

    // Initialize agent metrics
    const metrics: AgentExecutionMetrics = {
      agentName,
      startTime: new Date(),
      status: 'running',
      inputSize: JSON.stringify(inputs).length,
      outputSize: 0,
      childAgents: [],
      errors: []
    };

    this.agentMetrics.set(agentName, metrics);

    // Update session summary
    if (sessionId) {
      const summary = this.activeTraces.get(sessionId);
      if (summary && !summary.agentsInvolved.includes(agentName)) {
        summary.agentsInvolved.push(agentName);
      }
    }

    console.log(`\n🤖 AGENT STARTED: ${agentName}`);
    console.log(`   Type: ${agentType}`);
    if (inputs.domain) console.log(`   Domain: ${inputs.domain}`);
    if (inputs.goal) console.log(`   Goal: ${inputs.goal.substring(0, 80)}...`);
    console.log(`   Input Size: ${metrics.inputSize} bytes`);
  }

  /**
   * Complete an agent's execution
   */
  async endAgentExecution(
    agentName: string,
    outputs: any,
    error?: any,
    sessionId?: string
  ): Promise<void> {
    const metrics = this.agentMetrics.get(agentName);
    if (!metrics) return;

    // Update metrics
    metrics.endTime = new Date();
    metrics.durationMs = metrics.endTime.getTime() - metrics.startTime.getTime();
    metrics.status = error ? 'failed' : 'completed';
    metrics.outputSize = outputs ? JSON.stringify(outputs).length : 0;

    if (error) {
      metrics.errors?.push(String(error));
    }

    // End agent trace in LangSmith with structured output
    const structuredOutputs = {
      outputs: outputs.outputs || outputs,
      reasoning: outputs.reasoning,
      metrics: outputs.metrics || {
        duration: metrics.durationMs,
        inputSize: metrics.inputSize,
        outputSize: metrics.outputSize
      },
      success: outputs.success !== undefined ? outputs.success : !error,
      agentName: agentName,
      timestamp: new Date().toISOString()
    };

    await langsmithTracer.endAgentTrace(structuredOutputs, error);

    // Log completion (brief, detailed logging is in AgentTracer)
    console.log(`\n✅ AGENT COMPLETED: ${agentName}`);
    console.log(`   Duration: ${metrics.durationMs}ms`);
    console.log(`   Output Size: ${metrics.outputSize} bytes`);
    console.log(`   Status: ${metrics.status}`);

    if (error) {
      console.error(`   Error: ${error}`);
    }

    // Update session errors if needed
    if (error && sessionId) {
      const summary = this.activeTraces.get(sessionId);
      if (summary) {
        summary.errors.push(`${agentName}: ${String(error)}`);
      }
    }
  }

  /**
   * Track orchestrator decisions and coordination
   */
  async trackOrchestration(
    action: string,
    details: any,
    sessionId?: string
  ): Promise<void> {
    console.log(`\n🎭 ORCHESTRATOR: ${action}`);
    if (details) {
      console.log(`   Details:`, JSON.stringify(details, null, 2).substring(0, 200));
    }

    // Update orchestration metrics
    if (!this.orchestrationMetrics) {
      this.orchestrationMetrics = {
        totalAgents: 0,
        parallelExecutions: 0,
        sequentialExecutions: 0,
        conflictsDetected: 0,
        conflictsResolved: 0,
        totalDurationMs: 0,
        agentMetrics: {}
      };
    }

    // Track specific orchestration events
    switch (action) {
      case 'IDENTIFY_CONFLICTS':
        this.orchestrationMetrics.conflictsDetected = details.conflictsFound || 0;
        break;
      case 'RESOLVE_CONFLICTS':
        this.orchestrationMetrics.conflictsResolved = details.resolutionsCount || 0;
        break;
      case 'PARALLEL_EXECUTION':
        this.orchestrationMetrics.parallelExecutions++;
        break;
      case 'SEQUENTIAL_EXECUTION':
        this.orchestrationMetrics.sequentialExecutions++;
        break;
    }
  }

  /**
   * Track LLM call metrics
   */
  async trackLLMCall(
    metrics: {
      tokens: number;
      cost: number;
      latency: number;
    },
    sessionId?: string
  ): Promise<void> {
    if (!sessionId) return;

    const summary = this.activeTraces.get(sessionId);
    if (summary) {
      summary.totalLLMCalls++;
      summary.totalTokens += metrics.tokens;
      summary.totalCost += metrics.cost;
    }
  }

  /**
   * End an observability session
   */
  async endSession(
    sessionId: string,
    outputs?: any,
    error?: any
  ): Promise<TraceSummary | null> {
    const summary = this.activeTraces.get(sessionId);
    if (!summary) return null;

    // Update summary
    summary.endTime = new Date();
    summary.totalDurationMs = summary.endTime.getTime() - summary.startTime.getTime();
    summary.status = error ? 'failed' : 'completed';

    if (error) {
      summary.errors.push(String(error));
    }

    // Capture LangSmith identifiers before ending the session
    const traceUrlBeforeEnd = langsmithTracer.getTraceUrl();
    const runIdBeforeEnd = langsmithTracer.getCurrentRunId();

    // End LangSmith session
    await langsmithTracer.endSession(outputs, error);
    // Use captured identifiers (current run is cleared after end)
    const traceUrl = traceUrlBeforeEnd;

    // Save session to database directly
    try {
      // Parse sessionId to extract components
      const parts = sessionId.split('-');
      const sessionType = parts[0] || 'evaluation';
      // Extract useCaseId (UUID format)
      const useCaseId = parts.slice(1, 6).join('-'); // Reconstruct UUID

      const sessionData = {
        sessionId,
        useCaseId: useCaseId || undefined,
        useCaseTitle: (summary as any).useCaseTitle || undefined,
        sessionType: sessionType || 'evaluation',
        status: summary.status,
        startTime: summary.startTime,
        endTime: summary.endTime,
        duration: summary.totalDurationMs,
        totalLLMCalls: summary.totalLLMCalls,
        totalTokens: summary.totalTokens,
        totalCost: summary.totalCost,
        agentsInvolved: summary.agentsInvolved,
        langsmithUrl: traceUrl || undefined,
        langsmithRunId: runIdBeforeEnd || undefined,
        metadata: outputs ? { outputs } : undefined,
        errors: summary.errors.length > 0 ? summary.errors : undefined,
      };

      // Save directly to database using Prisma
      await prismaClient.observabilitySession.upsert({
        where: { sessionId },
        update: {
          status: sessionData.status,
          endTime: sessionData.endTime,
          duration: sessionData.duration,
          totalLLMCalls: sessionData.totalLLMCalls,
          totalTokens: sessionData.totalTokens,
          totalCost: sessionData.totalCost,
          agentsInvolved: sessionData.agentsInvolved,
          langsmithUrl: sessionData.langsmithUrl,
          langsmithRunId: sessionData.langsmithRunId,
          metadata: sessionData.metadata || {},
          errors: sessionData.errors || null,
        },
        create: {
          sessionId: sessionData.sessionId,
          useCaseId: sessionData.useCaseId,
          useCaseTitle: sessionData.useCaseTitle,
          sessionType: sessionData.sessionType,
          status: sessionData.status,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          duration: sessionData.duration,
          totalLLMCalls: sessionData.totalLLMCalls,
          totalTokens: sessionData.totalTokens,
          totalCost: sessionData.totalCost,
          agentsInvolved: sessionData.agentsInvolved,
          langsmithUrl: sessionData.langsmithUrl,
          langsmithRunId: sessionData.langsmithRunId,
          metadata: sessionData.metadata || {},
          errors: sessionData.errors || null,
        },
      });
      console.log(`💾 Observability session saved to database: ${sessionId}`);
    } catch (saveError) {
      console.error('Error saving observability session:', saveError);
    }

    // Log final summary
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('📊 SESSION SUMMARY');
    console.log(`🆔 Session ID: ${sessionId}`);
    console.log(`⏱️ Duration: ${summary.totalDurationMs}ms`);
    console.log(`🤖 Agents Involved: ${summary.agentsInvolved.length}`);
    console.log(`   • ${summary.agentsInvolved.join('\n   • ')}`);
    console.log(`📞 Total LLM Calls: ${summary.totalLLMCalls}`);
    console.log(`🎯 Total Tokens: ${summary.totalTokens}`);
    console.log(`💰 Total Cost: $${summary.totalCost.toFixed(4)}`);
    console.log(`📈 Status: ${summary.status}`);

    if (summary.errors.length > 0) {
      console.log(`❌ Errors: ${summary.errors.length}`);
      summary.errors.forEach(err => console.error(`   • ${err}`));
    }

    if (traceUrl) {
      console.log(`\n📊 View Full Trace: ${traceUrl}`);
    }
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // Clean up
    this.activeTraces.delete(sessionId);
    this.agentMetrics.clear();
    this.orchestrationMetrics = null;

    return summary;
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(sessionId: string): TraceSummary | null {
    return this.activeTraces.get(sessionId) || null;
  }

  /**
   * Get all agent metrics
   */
  getAgentMetrics(): AgentExecutionMetrics[] {
    return Array.from(this.agentMetrics.values());
  }

  /**
   * Get orchestration metrics
   */
  getOrchestrationMetrics(): OrchestrationMetrics | null {
    return this.orchestrationMetrics;
  }

  /**
   * Export session data
   */
  exportSessionData(sessionId: string): any {
    const summary = this.activeTraces.get(sessionId);
    if (!summary) return null;

    return {
      summary,
      agentMetrics: Array.from(this.agentMetrics.entries()),
      orchestrationMetrics: this.orchestrationMetrics,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const observabilityManager = ObservabilityManager.getInstance();
