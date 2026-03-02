/**
 * Type definitions for the Agentic Guardrails System
 */

// Core assessment data structure
export interface ComprehensiveAssessment {
  useCaseId: string;
  useCaseTitle: string;
  department: string;
  owner: string;
  
  // Core use case data - NEW!
  problemStatement?: string;
  proposedSolution?: string;
  currentState?: string;
  desiredState?: string;
  successCriteria?: string;
  keyAssumptions?: string;
  keyBenefits?: string;
  requiredResources?: string;
  
  // Stakeholders - NEW!
  primaryStakeholders?: string[];
  secondaryStakeholders?: string[];
  
  // Impact analysis - NEW!
  confidenceLevel?: number;
  operationalImpact?: number;
  productivityImpact?: number;
  revenueImpact?: number;
  implementationComplexity?: number;
  
  // Timeline and costs - NEW!
  timeline?: string;
  initialCost?: string;
  initialROI?: string;
  
  // Governance and approval context - NEW!
  approvalStatus?: string | null;
  approvalConditions?: string[];
  
  // Risk context - NEW!
  identifiedRisks?: any[];
  residualRiskLevel?: string;
  
  // Financial constraints - NEW!
  financialConstraints?: {
    budget: string | null;
    roi: number;
    totalInvestment: number;
  };
  
  // Compliance requirements - NEW!
  complianceRequirements?: {
    euAiAct?: any;
    iso42001?: any;
    uaeAi?: any;
    hipaa?: any;
    gdpr?: any;
  };
  
  technicalFeasibility: {
    modelTypes: string[];
    modelSizes: string[];
    deploymentModels: string[];
    cloudProviders: string[];
    computeRequirements: string[];
    integrationPoints: string[];
    apiSpecs: string[];
    authMethods: string[];
    encryptionStandards: string[];
    technicalComplexity: number;
    outputTypes: string[];
    confidenceScore: string;
    modelUpdateFrequency: string;
    // Gen AI specific
    modelProvider?: string;
    contextWindowSize?: number;
    tokenUsage?: {
      estimatedDaily: number;
      estimatedMonthly: number;
      peakHourly: number;
    };
    ragArchitecture?: {
      vectorDatabase: string;
      embeddingModel: string;
      chunkSize: number;
      overlapSize: number;
      retrievalTopK: number;
    };
    agentArchitecture?: string;
    agentCapabilities?: string[];
    orchestrationPattern?: string;
    memoryManagement?: string;
    toolIntegrations?: string[];
    functionCalling?: boolean;
    streamingEnabled?: boolean;
    batchProcessing?: boolean;
    cacheStrategy?: string;
    fallbackModels?: string[];
    monitoringTools?: string[];
  };
  
  businessFeasibility: {
    strategicAlignment: number;
    marketOpportunity: string;
    stakeholder: Record<string, boolean>;
    annualSavings: string;
    efficiencyGain: number;
    paybackPeriod: number;
    availabilityRequirement: string;
    responseTimeRequirement: string;
    concurrentUsers: string;
    revenueImpactType: string[];
    estimatedFinancialImpact: string;
    userCategories: string[];
    systemCriticality: string;
    failureImpact: string;
    executiveSponsorLevel: string;
    stakeholderGroups: string[];
    // Gen AI specific
    genAIUseCase?: string;
    interactionPattern?: string;
    userInteractionModes?: string[];
    successMetrics?: string[];
    minAcceptableAccuracy?: number;
    maxHallucinationRate?: number;
    minResponseRelevance?: number;
    maxLatency?: number;
    contentQualityThreshold?: number;
    userSatisfactionTarget?: number;
  };
  
  ethicalImpact: {
    biasFairness: Record<string, boolean>;
    privacySecurity: Record<string, boolean>;
    decisionMaking: {
      automationLevel: string;
      decisionTypes: string[];
    };
    modelCharacteristics: {
      explainabilityLevel: string;
      biasTesting: string;
    };
    aiGovernance: {
      humanOversightLevel: string;
      performanceMonitoring: string[];
    };
    ethicalConsiderations: {
      potentialHarmAreas: string[];
      vulnerablePopulations: string[];
    };
    // Gen AI specific
    contentGeneration?: {
      risks: string[];
      hallucinationTolerance: string;
      attributionRequirements: string[];
      promptSafety: string[];
      contentFiltering: string[];
      outputMonitoring: string[];
    };
    agentBehavior?: {
      boundaries: string[];
      overrideCapability: boolean;
      auditTrail: boolean;
      decisionExplanation: boolean;
    };
  };
  
  riskAssessment: {
    technicalRisks: Array<{ risk: string; probability: string; impact: string }>;
    businessRisks: Array<{ risk: string; probability: string; impact: string }>;
    dataProtection?: {
      jurisdictions: string[];
    };
    sectorSpecific?: string | Record<string, boolean>;
    // Gen AI specific
    modelRisks?: Record<string, number>;
    agentRisks?: Record<string, number>;
    dependencyRisks?: string[];
    vendorLockIn?: string;
    apiStability?: string;
    costOverrun?: string;
  };
  
  dataReadiness: {
    dataTypes: string[];
    dataVolume: string;
    growthRate: string;
    numRecords: string;
    primarySources: string[];
    dataQualityScore: number;
    dataCompleteness: number;
    dataAccuracyConfidence: number;
    dataFreshness: string;
    dataSubjectLocations: string;
    dataStorageLocations: string;
    dataProcessingLocations: string;
    crossBorderTransfer: boolean;
    dataLocalization: string;
    dataRetention: string;
    // Gen AI specific
    trainingDataTypes?: string[];
    instructionClarityScore?: number;
    responseQualityScore?: number;
    diversityScore?: number;
    biasScore?: number;
    trainingDataSize?: string;
    finetuningRequired?: boolean;
    syntheticDataUsage?: number;
    promptEngineering?: string[];
    knowledgeSources?: string[];
    knowledgeUpdateFrequency?: string;
    contextSources?: string[];
  };
  
  roadmapPosition: {
    priority: string;
    projectStage: string;
    timelineConstraints: string[];
    timeline: string;
    dependencies: Record<string, boolean>;
    metrics: string;
    // Gen AI specific
    currentAIMaturity?: string;
    targetAIMaturity?: string;
    evolutionPath?: string[];
    milestoneCriteria?: string[];
    successIndicators?: string[];
  };
  
  budgetPlanning: {
    initialDevCost: number;
    baseApiCost: number;
    baseInfraCost: number;
    baseOpCost: number;
    baseMonthlyValue: number;
    valueGrowthRate: number;
    budgetRange: string;
    // Gen AI specific
    inputTokenPrice?: number;
    outputTokenPrice?: number;
    embeddingTokenPrice?: number;
    finetuningTokenPrice?: number;
    monthlyTokenVolume?: number;
    peakTokenVolume?: number;
    tokenOptimizationTarget?: number;
    optimizationStrategies?: string[];
    vectorDbCost?: number;
    gpuInferenceCost?: number;
    monitoringToolsCost?: number;
    safetyApiCost?: number;
    backupModelCost?: number;
  };

  // Rich assessment context text (real + LLM-inferred answers merged)
  assessmentContextText?: string;

  // Organization context
  organizationPolicies?: {
    responsibleAI: string[];
    prohibitedUses: string[];
    requiredSafeguards: string[];
    complianceFrameworks: string[];
  };
}

// Guardrails configuration output
export interface GuardrailsConfig {
  guardrails: ImplementationConfig;
  reasoning: ReasoningDocument;
  confidence: ConfidenceScore;
  metadata: {
    generatedAt: string;
    version: string;
    agents: string[];
    contextComplexity: number;
  };
}

// Individual guardrail definition
export interface Guardrail {
  id: string;
  type: GuardrailType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  description: string;
  rationale: string;
  implementation: {
    platform: string[];
    configuration: Record<string, any>;
    monitoring: MonitoringRequirement[];
  };
  conditions?: TriggerCondition[];
  exceptions?: string[];
  evolutionStrategy?: EvolutionStrategy;
}

export type GuardrailType =
  | 'content_safety'
  | 'data_protection'
  | 'token_limit'
  | 'rate_limit'
  | 'human_oversight'
  | 'bias_mitigation'
  | 'hallucination_control'
  | 'agent_behavior'
  | 'cost_control'
  | 'performance'
  | 'compliance'
  | 'ethical'
  // Additional types from agents/LLMs
  | 'security'
  | 'data_governance'
  | 'accuracy'
  | 'quality'
  | 'governance'
  | 'safety'
  | 'integration'
  | 'evolutionary'
  | 'user_experience'
  | 'operational'
  | 'economic'
  | 'critical'
  // Specific validation types
  | 'input_validation'
  | 'input-validation'
  | 'data_privacy'
  | 'data-privacy'
  | 'data_access_control'
  | 'data-access-control'
  | 'content_validation'
  | 'content-validation'
  | 'response_accuracy'
  | 'bias_testing'
  | 'bias-testing'
  | 'data_encryption'
  | 'data-encryption'
  | 'network_security'
  // Allow any string as fallback
  | string;

// Agent response structure
export interface AgentResponse {
  guardrails: Guardrail[];
  insights: string[];
  confidence: number;
  concerns?: string[];
  recommendations?: string[];
}

// Context graph for relationship mapping
export interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'assessment_area' | 'risk' | 'requirement' | 'stakeholder';
  data: any;
  importance: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'requires' | 'conflicts_with' | 'increases_risk' | 'mitigates' | 'amplifies';
  weight: number;
  rationale: string;
}

// Conflict resolution
export interface ConflictResolution {
  conflictId: string;
  description: string;
  approach: 'prioritize' | 'compromise' | 'synthesize' | 'defer';
  resolution: Guardrail[];
  tradeoffs: string[];
  rationale: string;
}

// Requirements structures
export interface ExplicitRequirements {
  dataProtection: {
    required: boolean;
    level: string;
    specific: string[];
  };
  humanOversight: {
    required: boolean;
    level: string;
    criticalDecisions: boolean;
  };
  performance: {
    maxLatency?: string;
    availability?: string;
    concurrentUsers?: string;
  };
  compliance: {
    jurisdictions: string[];
    sectorSpecific?: any;
    certifications: string[];
  };
}

export interface ImplicitRequirements {
  crossCuttingConcerns: Array<{
    concern: string;
    mitigation: string;
    severity: number;
  }>;
  hiddenDependencies: Array<{
    source: string;
    target: string;
    impact: string;
  }>;
  secondOrderEffects: Array<{
    cause: string;
    effect: string;
    timeframe: string;
  }>;
}

export interface EmergentRisk {
  type: string;
  description: string;
  likelihood: 'high' | 'medium' | 'low';
  impact: 'severe' | 'moderate' | 'minor';
  mitigation: string;
}

// Context used by specialist agents for analysis
export interface GuardrailsContext {
  assessment: ComprehensiveAssessment;
  technicalFeasibility?: any;
  businessFeasibility?: any;
  dataReadiness?: any;
  ethicalImpact?: any;
  riskAssessment?: any;
  budgetPlanning?: any;
  roadmapPosition?: any;
  complianceRequirements?: any;
  organizationPolicies?: any;
}

// Proposal returned by specialist agents
export interface AgentProposal {
  agentName: string;
  guardrails: Guardrail[];
  insights: string[];
  concerns: string[];
  recommendations: string[];
  confidence: number;
}

// Temporal analysis
export interface TemporalAnalysis {
  currentPhase: string;
  evolutionPath: string[];
  maturityProgression: {
    current: string;
    target: string;
    milestones: Array<{
      phase: string;
      criteria: string[];
      guardrailAdjustments: string[];
    }>;
  };
  timeHorizon: string;
}

// Risk profile
export interface RiskProfile {
  overall: 'critical' | 'high' | 'medium' | 'low';
  dimensions: {
    technical: number;
    regulatory: number;
    ethical: number;
    operational: number;
    reputational: number;
    financial: number;
  };
  topRisks: Array<{
    risk: string;
    score: number;
    mitigation: string;
  }>;
}

// Regulatory mapping
export interface RegulatoryMapping {
  applicable: string[];
  euAIActClassification?: 'prohibited' | 'high-risk' | 'limited-risk' | 'minimal-risk';
  specificRequirements: Array<{
    regulation: string;
    requirements: string[];
    deadlines?: string[];
  }>;
}

// Monitoring requirements
export interface MonitoringRequirement {
  metric: string;
  threshold: number | string;
  frequency: string;
  alerting: {
    channels: string[];
    escalation: string[];
  };
}

// Trigger conditions
export interface TriggerCondition {
  condition: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches';
  value: any;
  action: string;
}

// Evolution strategy
export interface EvolutionStrategy {
  triggers: string[];
  adjustments: Array<{
    condition: string;
    modification: string;
    approval: 'automatic' | 'human_required';
  }>;
  rollback: {
    conditions: string[];
    strategy: string;
  };
}

// Confidence scoring
export interface ConfidenceScore {
  overall: number;
  breakdown: {
    dataCompleteness: number;
    regulatoryAlignment: number;
    technicalFeasibility: number;
    businessViability: number;
  };
  uncertainties: string[];
}

// Reasoning documentation
export interface ReasoningDocument {
  timestamp: string;
  agentContributions: Array<{
    agent: string;
    keyInsights: string[];
    proposedRules: number;
  }>;
  conflictsResolved: Array<{
    description: string;
    approach: string;
    tradeoffs: string[];
  }>;
  assumptions: string[];
}

// Implementation configuration
export interface ImplementationConfig {
  version: string;
  platform: 'openai' | 'anthropic' | 'google' | 'aws' | 'azure' | 'multi-platform';
  rules: {
    critical: Guardrail[];
    operational: Guardrail[];
    ethical: Guardrail[];
    economic: Guardrail[];
    evolutionary: Guardrail[];
  };
  deployment: {
    stages: string[];
    rollback: {
      triggers: string[];
      strategy: string;
    };
  };
  monitoring: MonitoringRequirement[];
  documentation: {
    rationale: string;
    tradeoffs: string[];
    assumptions: string[];
  };
}