/**
 * Types for the Assessment Expansion Agent.
 *
 * The expansion agent takes ~25 core answers and uses LLM to infer
 * answers for the remaining ~370 questions across all 7 pillars.
 */

export type PillarKey =
  | 'requirements'
  | 'technical'
  | 'business'
  | 'responsibleEthical'
  | 'legalRegulatory'
  | 'dataReadiness'
  | 'finops';

export interface InferredField {
  value: any;
  confidence: number; // 0.0 - 1.0
  source: 'user' | 'inferred';
  reasoning?: string;
  inferredFrom?: string[]; // which core answers drove this
}

export interface PillarProfile {
  fields: Record<string, InferredField>;
  pillarConfidence: number; // average confidence across fields
}

export interface CoreAnswer {
  questionText: string;
  questionNumber: number;
  pillar: PillarKey;
  value: any;
  type: string; // QuestionType enum value
}

export interface QuestionSpec {
  id: string;
  text: string;
  questionNumber: number;
  type: string;
  options?: Array<{ id: string; text: string }>;
}

export interface ExpansionInput {
  useCaseId: string;
  useCase: {
    title: string;
    problemStatement: string;
    proposedAISolution: string;
    currentState: string;
    desiredState: string;
    primaryStakeholders: string[];
    secondaryStakeholders: string[];
    successCriteria: string;
    confidenceLevel: number;
    operationalImpactScore: number;
    productivityImpactScore: number;
    revenueImpactScore: number;
    implementationComplexity: number;
    aiType?: string | null;
  };
  coreAnswers: CoreAnswer[];
  questionCatalog: Record<PillarKey, QuestionSpec[]>;
}

export interface ExpansionResult {
  profiles: Record<PillarKey, PillarProfile>;
  overallConfidence: number;
  tokenUsage: { input: number; output: number };
  duration: number; // milliseconds
}

export const STAGE_TO_PILLAR: Record<string, PillarKey> = {
  REQUIREMENTS: 'requirements',
  TECHNICAL: 'technical',
  BUSINESS: 'business',
  RESPONSIBLE_ETHICAL: 'responsibleEthical',
  LEGAL_REGULATORY: 'legalRegulatory',
  DATA_READINESS: 'dataReadiness',
  FINOPS: 'finops',
};

export const PILLAR_TO_STAGE: Record<PillarKey, string> = {
  requirements: 'REQUIREMENTS',
  technical: 'TECHNICAL',
  business: 'BUSINESS',
  responsibleEthical: 'RESPONSIBLE_ETHICAL',
  legalRegulatory: 'LEGAL_REGULATORY',
  dataReadiness: 'DATA_READINESS',
  finops: 'FINOPS',
};

export const PILLAR_LABELS: Record<PillarKey, string> = {
  requirements: 'Requirements',
  technical: 'Technical Feasibility',
  business: 'Business Feasibility',
  responsibleEthical: 'Responsible & Ethical AI',
  legalRegulatory: 'Legal & Regulatory',
  dataReadiness: 'Data Readiness',
  finops: 'FinOps & Cost Management',
};
