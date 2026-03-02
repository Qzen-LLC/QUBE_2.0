/**
 * Shared types for external risk intelligence integrations
 * Supports IBM Risk Atlas, MIT Risk Repository, OWASP Top 10, MITRE ATLAS, and AIID
 */

// External Risk from IBM or MIT
export interface ExternalRisk {
  Id: number | string;
  Summary: string;
  Description: string;
  RiskCategory: string;
  RiskSeverity: 'Minor' | 'Moderate' | 'Major' | 'Negligible' | 'Catastrophic';
  Likelihood: 'Unlikely' | 'Possible' | 'Likely' | 'Rare' | 'Almost certain';
  source: 'ibm' | 'mit';
  metadata?: Record<string, any>;
}

// OWASP Top 10 for LLMs Risk
export interface OwaspRisk {
  id: string; // 'LLM01', 'LLM02', etc.
  rank: number;
  title: string;
  description: string;
  examples: string[];
  mitigation: string[];
  realWorldIncidents?: string[];
  severity: 'Critical' | 'High' | 'Medium';
}

// MITRE ATLAS Technique
export interface MitreTechniqueData {
  techniqueId: string; // 'AML.T0043', 'AML.T0048', etc.
  tactic: string; // 'ML Attack Staging', 'Exfiltration', etc.
  tacticId?: string; // 'AML.TA0001', etc.
  technique: string; // Full technique name
  description: string;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  mitigation?: string;
  detection?: string;
  caseStudies?: Array<{
    id?: string;
    name?: string;
    url?: string;
    description?: string;
  }>;
  metadata?: {
    platforms?: string[];
    'data-sources'?: string[];
    subtechniques?: string[];
    riskCategory?: string;
    likelihood?: string;
    internalId?: number;
    [key: string]: any;
  };
}

// AI Incident Database (AIID) Incident
export interface AiidIncident {
  incidentId: number;
  title: string;
  description: string;
  date?: string;

  // Reports associated with this incident
  reports: AiidReport[];

  // Entities involved
  deployers?: AiidEntity[];
  developers?: AiidEntity[];
  harmedParties?: AiidEntity[];

  // Editor notes and metadata
  editorNotes?: string;
  editorDissimilarIncidents?: number[];
  editorSimilarIncidents?: number[];

  // Classifications
  classifications?: AiidClassification[];

  // Computed fields for UI
  harmSeverity?: number; // 0-5 scale from CSET
  harmType?: string[];
  sector?: string[];
  technology?: string[];
  failureCause?: string[];
  lessonsLearned?: string;
  relevanceScore?: number; // Computed by AI Agent
}

// AIID Report (news article, blog post, etc.)
export interface AiidReport {
  report_number: number;
  title: string;
  url: string;
  date_published?: string;
  date_downloaded?: string;
  authors?: string[];
  submitters?: string[];
  text?: string; // Full text content
  plain_text?: string;
  language?: string;
  tags?: string[];
}

// AIID Entity (company, organization, individual)
export interface AiidEntity {
  entity_id: string;
  name: string;
}

// AIID Classification (CSET, GMF, MIT)
export interface AiidClassification {
  namespace: string; // 'CSET', 'GMF', 'MIT'
  attributes: AiidClassificationAttribute[];
}

export interface AiidClassificationAttribute {
  short_name: string;
  value_json?: string;

  // CSET Harm Severity (0-5 scale)
  harm_severity?: number;

  // CSET Harm Type
  harm_type?: string[];

  // GMF Failure Cause
  failure_cause?: string[];

  // MIT Risk Domains
  risk_domain?: string[];

  // Sector/Industry
  sector?: string[];

  // Technology involved
  technology?: string[];

  // Other classification fields
  [key: string]: any;
}

// Risk Recommendation Input (from assessment)
export interface RiskRecommendationInput {
  useCaseId: string;
  assessmentData: {
    technicalFeasibility?: {
      modelTypes?: string[];
      deploymentModels?: string[];
      modelProvider?: string;
      agentArchitecture?: string;
      agentCapabilities?: string[];
    };
    businessFeasibility?: {
      genAIUseCase?: string;
      interactionPattern?: string;
      userInteractionModes?: string[];
    };
    ethicalImpact?: {
      contentGeneration?: {
        risks?: string[];
      };
      agentBehavior?: {
        boundaries?: string[];
      };
      ethicalConsiderations?: {
        potentialHarmAreas?: string[];
      };
    };
    riskAssessment?: {
      modelRisks?: Record<string, number>;
      agentRisks?: Record<string, number>;
    };
    dataReadiness?: {
      dataTypes?: string[];
      trainingDataTypes?: string[];
    };
  };
  // Rich use case metadata for better AI System Goals inference
  useCaseMetadata?: {
    title?: string;
    problemStatement?: string;
    proposedAISolution?: string;
    keyBenefits?: string;
    successCriteria?: string;
    currentState?: string;
    desiredState?: string;
    keyAssumptions?: string;
    businessFunction?: string;
    primaryStakeholders?: string[];
    operationalImpactScore?: number;
  };
}

// Recommendation Result
export interface RiskRecommendations {
  ibm: ExternalRisk[];
  mit: ExternalRisk[];
  owasp: OwaspRisk[];
  mitre: MitreTechniqueData[];
  aiid: AiidIncident[];
  totalRecommendations: number;
  analysis: {
    isGenAI: boolean;
    isAgenticAI: boolean;
    primaryUseCase?: string;
    riskCategories: string[];
    // Atlas Nexus LLM-based analysis
    matchedTaxonomies?: string[];
    totalRisksAnalyzed?: number;
    llmConfidence?: number;
    totalMitigations?: number;
    totalControls?: number;
    totalEvaluations?: number;
  };
  // Atlas Nexus enriched data (when source=atlas)
  atlas?: {
    risks: AtlasEnrichedRisk[];
    mitigations: AtlasAction[];
    controls: AtlasRiskControl[];
    evaluations: AtlasEvaluation[];
  };
}

// Atlas Nexus Risk (from LLM-based identification)
export interface AtlasEnrichedRisk {
  id: string;
  name: string;
  description: string;
  isDefinedByTaxonomy: string;
  taxonomyName?: string;
  riskGroupName?: string;
  tag?: string;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood?: 'Almost certain' | 'Likely' | 'Possible' | 'Unlikely' | 'Rare';
  relatedActions?: string[];
  relatedEvaluations?: string[];
  relatedControls?: string[];
}

// Atlas Nexus Action/Mitigation
export interface AtlasAction {
  id: string;
  name: string;
  description: string;
  isDefinedByTaxonomy: string;
  hasRelatedRisk?: string[];
  hasAiActorTask?: string[];
  aiLifecyclePhase?: string[];
}

// Atlas Nexus Risk Control
export interface AtlasRiskControl {
  id: string;
  name: string;
  description: string;
  isDefinedByTaxonomy: string;
  tag?: string;
  detectsRisk?: string[];
}

// Atlas Nexus Evaluation
export interface AtlasEvaluation {
  id: string;
  name: string;
  description?: string;
  url?: string;
  assessesRisk?: string[];
  hasLicense?: string;
}
