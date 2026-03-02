/**
 * Types for autonomous agent reasoning system
 */

export type ReasoningStrategy =
  | 'chain-of-thought'      // Sequential step-by-step reasoning
  | 'reflection'            // Generate → Reflect → Refine
  | 'tree-of-thought'       // Explore multiple reasoning paths
  | 'react';                // Reasoning + Action loop

export type ReasoningPhase =
  | 'planning'              // Understand problem and plan approach
  | 'analysis'              // Analyze context and identify key factors
  | 'generation'            // Generate initial output
  | 'reflection'            // Critique and identify improvements
  | 'refinement'            // Improve based on reflection
  | 'validation';           // Final quality check

export interface ReasoningStep {
  id: string;
  phase: ReasoningPhase;
  timestamp: string;
  input: any;
  thought: string;                // Agent's reasoning/thinking
  decision?: string;              // Decision made
  output: any;                    // Step output
  confidence: number;             // 0-1 confidence score
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
    [key: string]: any;
  };
}

export interface ReasoningChain {
  id: string;
  goal: string;                   // What the agent is trying to achieve
  strategy: ReasoningStrategy;
  steps: ReasoningStep[];
  totalTokens: number;
  totalLatency: number;
  success: boolean;
  finalOutput: any;
}

export interface ThoughtProcess {
  observation: string;            // What the agent observes
  reasoning: string;              // How the agent reasons about it
  conclusion: string;             // What the agent concludes
  nextAction: string;             // What the agent plans to do next
}

export interface Reflection {
  strengths: string[];            // What's good about the output
  weaknesses: string[];           // What needs improvement
  gaps: string[];                 // What's missing
  improvements: string[];         // Specific suggestions
  needsRefinement: boolean;       // Whether to refine
  confidence: number;             // Confidence in quality (0-1)
}

export interface AgentDecision {
  decision: string;               // The decision made
  reasoning: string;              // Why this decision
  alternatives: string[];         // Other options considered
  confidence: number;             // Confidence in decision
  evidence: string[];             // Supporting evidence
}

export interface AgentState {
  goal: string;
  context: any;
  memory: AgentMemoryState;
  currentPhase: ReasoningPhase;
  steps: ReasoningStep[];
  iteration: number;
  maxIterations: number;
  qualityThreshold: number;       // Minimum quality to accept (0-1)
  isComplete: boolean;
}

export interface AgentMemoryState {
  shortTerm: Map<string, any>;   // Current context/working memory
  insights: string[];             // Accumulated insights
  concerns: string[];             // Issues identified
  decisions: AgentDecision[];     // Decisions made
}

export interface ReasoningResult {
  success: boolean;
  output: any;
  reasoning: ReasoningChain;
  confidence: number;
  insights: string[];
  concerns: string[];
  metadata: {
    totalSteps: number;
    totalTokens: number;
    totalLatency: number;
    iterations: number;
    strategy: ReasoningStrategy;
  };
}

export interface ReasoningConfig {
  strategy: ReasoningStrategy;
  maxIterations: number;          // Max reflection/refinement loops
  qualityThreshold: number;       // Minimum acceptable quality
  models: {
    planning: string;             // Model for planning phase
    reasoning: string;            // Model for main reasoning
    reflection: string;           // Model for reflection/critique
  };
  temperature: number;
  enableReflection: boolean;
  enableRefinement: boolean;
  verbose: boolean;               // Detailed logging
}

export const DEFAULT_REASONING_CONFIG: ReasoningConfig = {
  strategy: 'reflection',
  maxIterations: 3,
  qualityThreshold: 0.7,
  models: {
    planning: 'gpt-4o-mini',      // Fast and cheap for planning
    reasoning: 'gpt-4o',          // High quality for main work
    reflection: 'gpt-4o-mini'     // Good enough for critique
  },
  temperature: 0.7,
  enableReflection: true,
  enableRefinement: true,
  verbose: true
};
