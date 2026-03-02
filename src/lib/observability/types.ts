/**
 * TypeScript types for LangSmith observability integration
 */

export interface TraceMetadata {
  agentName?: string;
  agentType?: 'orchestrator' | 'specialist' | 'evaluation' | 'guardrail';
  useCaseId?: string;
  useCaseTitle?: string;
  phase?: string;
  parentTraceId?: string;
  tags?: string[];
  sessionId?: string;
}

export interface LLMCallMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentExecutionMetrics {
  agentName: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputSize: number;
  outputSize: number;
  childAgents?: string[];
  errors?: string[];
}

export interface OrchestrationMetrics {
  totalAgents: number;
  parallelExecutions: number;
  sequentialExecutions: number;
  conflictsDetected: number;
  conflictsResolved: number;
  totalDurationMs: number;
  agentMetrics: Record<string, AgentExecutionMetrics>;
}

export interface ObservabilityConfig {
  enabled: boolean;
  level: 'basic' | 'detailed' | 'debug';
  langsmithApiKey?: string;
  langsmithProject?: string;
  capturePrompts: boolean;
  captureResponses: boolean;
  sanitizeSensitiveData: boolean;
  enableCostTracking: boolean;
  enableLatencyTracking: boolean;
  customTags?: string[];
}

export interface TraceEvent {
  id: string;
  timestamp: Date;
  type: 'llm_call' | 'agent_start' | 'agent_end' | 'orchestrator_decision' | 'error';
  metadata: TraceMetadata;
  data: any;
  metrics?: LLMCallMetrics | AgentExecutionMetrics | OrchestrationMetrics;
}

export interface TraceSummary {
  traceId: string;
  startTime: Date;
  endTime?: Date;
  totalDurationMs?: number;
  totalLLMCalls: number;
  totalTokens: number;
  totalCost: number;
  agentsInvolved: string[];
  status: 'running' | 'completed' | 'failed';
  errors: string[];
}

// Model pricing for cost calculation (per 1K tokens)
export const MODEL_PRICING = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 }
};