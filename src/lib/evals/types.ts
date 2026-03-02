/**
 * Type definitions for the Adaptive Evaluation System
 */

import { Guardrail, GuardrailsConfig, ComprehensiveAssessment } from '../agents/types';

// Core evaluation structures
export interface EvaluationConfig {
  id: string;
  useCaseId: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  testSuites: TestSuite[];
  evaluationCriteria: EvaluationCriteria;
  executionStrategy: ExecutionStrategy;
  scoringFramework: ScoringFramework;
  metadata: EvaluationMetadata;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  type: TestType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  scenarios: TestScenario[];
  coverage: CoverageMetrics;
  dependencies?: string[];
  schedule?: ExecutionSchedule;
}

export type TestType = 
  | 'safety'
  | 'performance'
  | 'accuracy'
  | 'compliance'
  | 'ethical'
  | 'robustness'
  | 'integration'
  | 'user_experience'
  | 'cost_efficiency'
  | 'drift_detection';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  guardrailId: string; // Links to specific guardrail being tested
  
  inputs: TestInput[];
  expectedOutputs: ExpectedOutput[];
  assertions: Assertion[];
  metrics: MetricDefinition[];
  
  tags?: string[];
  weight?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface TestInput {
  type: 'prompt' | 'context' | 'parameter' | 'file' | 'api_call';
  value: any;
  metadata?: Record<string, any>;
}

export interface ExpectedOutput {
  type: 'exact' | 'range' | 'pattern' | 'semantic' | 'threshold';
  value: any;
  tolerance?: number;
  explanation?: string;
}

export interface Assertion {
  type: AssertionType;
  condition: string;
  expected: any;
  severity: 'must_pass' | 'should_pass' | 'nice_to_have';
  message?: string;
}

export type AssertionType = 
  | 'content_safety'
  | 'no_hallucination'
  | 'within_context'
  | 'performance_threshold'
  | 'token_limit'
  | 'rate_limit'
  | 'bias_check'
  | 'privacy_preserved'
  | 'compliance_met'
  | 'cost_within_budget';

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  unit?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'p50' | 'p95' | 'p99';
}

// Evaluation criteria
export interface EvaluationCriteria {
  dimensions: EvaluationDimension[];
  weightingStrategy: 'equal' | 'weighted' | 'adaptive';
  minimumPassThreshold: number;
  criticalFailureConditions: FailureCondition[];
}

export interface EvaluationDimension {
  name: string;
  weight: number;
  metrics: string[];
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  adaptiveAdjustment?: AdaptiveAdjustment;
}

export interface AdaptiveAdjustment {
  enabled: boolean;
  learningRate: number;
  historyWindow: number;
  adjustmentFactors: string[];
}

export interface FailureCondition {
  condition: string;
  severity: 'critical' | 'high' | 'medium';
  action: 'stop' | 'alert' | 'continue_with_warning';
  message: string;
}

// Execution strategy
export interface ExecutionStrategy {
  mode: 'sequential' | 'parallel' | 'adaptive';
  parallelism?: number;
  prioritization: 'critical_first' | 'risk_based' | 'coverage_optimized';
  
  environments: ExecutionEnvironment[];
  progressiveRollout?: ProgressiveRollout;
  failureHandling: FailureHandling;
}

export interface ExecutionEnvironment {
  name: string;
  type: 'development' | 'staging' | 'production' | 'synthetic';
  configuration: Record<string, any>;
  dataSource?: string;
  mockServices?: string[];
}

export interface ProgressiveRollout {
  enabled: boolean;
  stages: Array<{
    percentage: number;
    duration: string;
    successCriteria: string[];
  }>;
  rollbackTriggers: string[];
}

export interface FailureHandling {
  strategy: 'fail_fast' | 'continue_on_error' | 'retry_with_backoff';
  maxRetries?: number;
  backoffMultiplier?: number;
  alertChannels?: string[];
}

// Scoring framework
export interface ScoringFramework {
  algorithm: 'weighted_average' | 'machine_learning' | 'rule_based' | 'hybrid';
  
  scoreRanges: {
    excellent: [number, number];
    good: [number, number];
    acceptable: [number, number];
    poor: [number, number];
    failing: [number, number];
  };
  
  dimensionScores: Record<string, DimensionScore>;
  overallScore: OverallScore;
  confidence: ConfidenceMetrics;
}

export interface DimensionScore {
  dimension: string;
  rawScore: number;
  normalizedScore: number;
  weight: number;
  contributionToOverall: number;
  details: Record<string, any>;
}

export interface OverallScore {
  value: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'stable' | 'degrading';
  recommendation: 'deploy' | 'review' | 'block';
  explanation: string;
}

export interface ConfidenceMetrics {
  overall: number;
  byDimension: Record<string, number>;
  factors: Array<{
    factor: string;
    impact: number;
    explanation: string;
  }>;
}

// Coverage metrics
export interface CoverageMetrics {
  guardrailsCovered: number;
  guardrailsTotal: number;
  percentage: number;
  byType: Record<string, number>;
  gaps: string[];
}

// Execution schedule
export interface ExecutionSchedule {
  frequency: 'continuous' | 'hourly' | 'daily' | 'weekly' | 'on_demand';
  times?: string[];
  timezone?: string;
  conditions?: string[];
}

// Retry policy
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fibonacci';
  initialDelay: number;
  maxDelay: number;
  retryableErrors?: string[];
}

// Evaluation metadata
export interface EvaluationMetadata {
  generatedBy: string[];
  basedOnGuardrails: string;
  assessmentVersion: string;
  lastExecuted?: string;
  totalExecutions?: number;
  averageScore?: number;
  tags?: string[];
}

// Evaluation results
export interface EvaluationResult {
  id: string;
  evaluationConfigId: string;
  executionId: string;
  timestamp: string;
  
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  duration: number;
  
  testResults: TestResult[];
  scores: ScoringFramework;
  issues: Issue[];
  recommendations: Recommendation[];
  
  artifacts?: EvaluationArtifact[];
  metadata: ResultMetadata;
}

export interface TestResult {
  testId: string;
  scenarioId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  
  startTime: string;
  endTime: string;
  duration: number;
  
  assertions: AssertionResult[];
  metrics: MetricResult[];
  
  error?: {
    type: string;
    message: string;
    stackTrace?: string;
  };
  
  artifacts?: string[];
}

export interface AssertionResult {
  assertionId: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export interface MetricResult {
  metricName: string;
  value: number;
  unit?: string;
  threshold?: {
    min?: number;
    max?: number;
  };
  withinThreshold: boolean;
}

export interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  affectedTests: string[];
  suggestedFix?: string;
  documentation?: string;
}

export interface Recommendation {
  type: 'guardrail_adjustment' | 'test_improvement' | 'threshold_change' | 'monitoring_enhancement';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation?: string;
}

export interface EvaluationArtifact {
  type: 'log' | 'screenshot' | 'recording' | 'trace' | 'report';
  name: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface ResultMetadata {
  environment: string;
  gitCommit?: string;
  modelVersion?: string;
  configurationHash: string;
  triggeredBy: string;
  notes?: string;
}

// Agent response for evaluation generation
export interface EvaluationAgentResponse {
  testSuites: TestSuite[];
  insights: string[];
  coverage: CoverageMetrics;
  confidence: number;
  recommendations?: string[];
}

// Drift detection
export interface DriftAnalysis {
  detected: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  
  dimensions: Array<{
    dimension: string;
    baseline: number;
    current: number;
    deviation: number;
    trend: number[];
    significance: number;
  }>;
  
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
    action: string;
  }>;
  
  suggestedActions: string[];
}

// Production monitoring
export interface ProductionMonitor {
  id: string;
  useCaseId: string;
  evaluationConfigId: string;
  
  status: 'active' | 'paused' | 'stopped';
  startedAt: string;
  
  sampling: {
    rate: number;
    strategy: 'random' | 'stratified' | 'adaptive';
    filters?: Record<string, any>;
  };
  
  realTimeMetrics: Record<string, any>;
  alertRules: AlertRule[];
  incidents: Incident[];
}

export interface AlertRule {
  id: string;
  metric: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
}

export interface Incident {
  id: string;
  alertRuleId: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  
  details: {
    metric: string;
    value: number;
    threshold: number;
    duration: string;
  };
  
  actions: Array<{
    type: string;
    timestamp: string;
    actor: string;
    result: string;
  }>;
}