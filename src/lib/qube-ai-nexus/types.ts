/**
 * QUBE AI Risk Data TypeScript Types
 * Based on LinkML schema
 */

// ==================== Core Types ====================

export interface RiskTaxonomy {
  id: string;
  name: string;
  description?: string;
  url?: string;
  dateCreated?: string;
  dateModified?: string;
  hasDocumentation?: string[];
}

export interface RiskGroup {
  id: string;
  name: string;
  isDefinedByTaxonomy: string;
  description?: string;
}

export interface Risk {
  id: string;
  name: string;
  description: string;
  url?: string;
  dateCreated?: string;
  dateModified?: string;
  isDefinedByTaxonomy: string;
  isPartOf?: string;
  tag?: string;
  type?: string;
  descriptor?: string[];
  concern?: string;
  relatedRisk?: string[];
  relatedMatch?: string[];
  narrowMatch?: string[];
  broadMatch?: string[];
  closeMatch?: string[];
  exactMatch?: string[];
}

export interface Action {
  id: string;
  name: string;
  description: string;
  hasRelatedRisk?: string[];
  hasDocumentation?: string[];
  isDefinedByTaxonomy: string;
  hasAiActorTask?: string[];
  aiLifecyclePhase?: string[];
}

export interface RiskControl {
  id: string;
  name: string;
  description: string;
  url?: string;
  dateCreated?: string;
  dateModified?: string;
  isDefinedByTaxonomy: string;
  isPartOf?: string;
  tag?: string;
  detectsRisk?: string[];
  relatedMatch?: string[];
  broadMatch?: string[];
  narrowMatch?: string[];
}

export interface Evaluation {
  id: string;
  name: string;
  description?: string;
  url?: string;
  dateCreated?: string;
  dateModified?: string;
  assessesRisk?: string[];
  hasLicense?: string;
  hasBenchmarkMetadataCard?: string;
}

export interface BenchmarkMetadataCard {
  id: string;
  name: string;
  description?: string;
  url?: string;
  tasks?: string[];
  languages?: string[];
  domains?: string[];
  metrics?: string[];
  modalities?: string[];
  limitations?: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  url?: string;
  dateCreated?: string;
  dateModified?: string;
  hasLicense?: string;
}

export interface Incident {
  id: string;
  name: string;
  description?: string;
  dateOccurred?: string;
  url?: string;
  hasRealizingRisks?: string[];
  aiActors?: string[];
}

// ==================== Data Container Types ====================

export interface RiskAtlasData {
  documents?: Document[];
  taxonomies?: RiskTaxonomy[];
  riskgroups?: RiskGroup[];
  risks?: Risk[];
  actions?: Action[];
  riskControls?: RiskControl[];
  evaluations?: Evaluation[];
  incidents?: Incident[];
}

export interface NistActionsData {
  actions: Action[];
}

export interface EvalData {
  documents?: Document[];
  evaluations?: Evaluation[];
  benchmarkMetadataCards?: BenchmarkMetadataCard[];
}

// ==================== Enriched Types for UI ====================

export interface EnrichedRisk extends Risk {
  source: 'ibm-risk-atlas' | 'air-2024' | 'credo-ucf' | 'mit-ai-risk' | 'nist-ai-rmf' | 'owasp-llm' | 'ailuminate' | 'granite-guardian' | 'shieldgemma';
  taxonomyName?: string;
  riskGroupName?: string;
  relatedActions?: Action[];
  relatedEvaluations?: Evaluation[];
  relatedControls?: RiskControl[];
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood?: 'Almost certain' | 'Likely' | 'Possible' | 'Unlikely' | 'Rare';
}

export interface EnrichedAction extends Action {
  source: 'nist-ai-rmf' | 'credo-ucf';
  relatedRisks?: Risk[];
}

export interface EnrichedRiskControl extends RiskControl {
  source: 'granite-guardian' | 'shieldgemma';
  detectedRisks?: Risk[];
}

export interface EnrichedEvaluation extends Evaluation {
  assessedRisks?: Risk[];
  benchmarkCard?: BenchmarkMetadataCard;
}

// ==================== Query Types ====================

export interface RiskFilter {
  taxonomy?: string;
  riskGroup?: string;
  tag?: string;
  search?: string;
  type?: string;
}

export interface ActionFilter {
  taxonomy?: string;
  relatedRisk?: string;
  aiActorTask?: string;
  search?: string;
}

export interface ControlFilter {
  taxonomy?: string;
  detectsRisk?: string;
  search?: string;
}

export interface EvaluationFilter {
  assessesRisk?: string;
  search?: string;
}

// ==================== Recommendation Types ====================

export interface AtlasRiskRecommendation {
  risk: EnrichedRisk;
  relevanceScore: number;
  matchedKeywords?: string[];
  mitigations: Action[];
  evaluations: Evaluation[];
  controls: RiskControl[];
}

export interface AtlasRecommendations {
  risks: AtlasRiskRecommendation[];
  totalRisks: number;
  totalMitigations: number;
  totalEvaluations: number;
  totalControls: number;
  analysis: {
    isGenAI: boolean;
    isAgenticAI: boolean;
    hasRAG: boolean;
    hasPlugins: boolean;
    publicFacing: boolean;
    dataTypes: string[];
    matchedTaxonomies: string[];
  };
}

// ==================== Statistics Types ====================

export interface AtlasStatistics {
  totalRisks: number;
  totalActions: number;
  totalControls: number;
  totalEvaluations: number;
  risksByTaxonomy: Record<string, number>;
  actionsByTaxonomy: Record<string, number>;
  controlsByTaxonomy: Record<string, number>;
  risksByGroup: Record<string, number>;
}
