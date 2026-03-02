/**
 * Type definitions for the Golden Dataset Collection System
 */

// Core golden dataset structure
export interface GoldenDataset {
  id: string;
  useCaseId: string;
  version: string;
  name: string;
  description: string;
  
  metadata: DatasetMetadata;
  entries: GoldenEntry[];
  statistics: DatasetStatistics;
  qualityMetrics: QualityMetrics;
  validationStatus: ValidationStatus;
  
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DatasetMetadata {
  domain: string;
  useCase: string;
  modelType: 'classification' | 'generation' | 'extraction' | 'conversation' | 'reasoning' | 'multi-modal';
  
  createdBy: string;
  owners: string[];
  contributors: string[];
  
  tags: string[];
  labels: Record<string, string>;
  
  usageRestrictions?: string[];
  dataProtection?: {
    containsPII: boolean;
    containsPHI: boolean;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  };
  
  targetModels?: string[];
  targetEnvironments?: string[];
}

// Individual golden entry
export interface GoldenEntry {
  id: string;
  datasetId: string;
  category: EntryCategory;
  
  // Input specification
  input: InputSpecification;
  
  // Expected output(s) - can have multiple valid responses
  expectedOutputs: ExpectedResponse[];
  
  // Metadata
  metadata: EntryMetadata;
  
  // Quality tracking
  quality: QualityTracking;
  
  // Versioning
  version: number;
  previousVersions?: EntryVersion[];
  
  createdAt: string;
  updatedAt: string;
}

export interface InputSpecification {
  prompt: string;
  context?: string;
  systemPrompt?: string;
  parameters?: Record<string, any>;
  
  // For conversational AI
  conversationHistory?: Message[];
  
  // For multi-modal
  images?: ImageInput[];
  files?: FileInput[];
  
  // For RAG systems
  documents?: Document[];
  retrievalContext?: RetrievalContext;
  
  // For agents
  tools?: ToolSpecification[];
  environment?: EnvironmentContext;
}

export interface ExpectedResponse {
  id: string;
  content: string;
  
  type: ResponseType;
  format?: 'text' | 'json' | 'markdown' | 'code' | 'structured';
  
  // For multiple valid answers
  isPreferred: boolean;
  acceptabilityScore: number; // 0-1, where 1 is perfect
  
  // Validation criteria
  validationCriteria?: ValidationCriteria;
  
  // Explanation
  explanation?: string;
  annotatorNotes?: string;
  
  // For structured outputs
  schema?: any;
  constraints?: ResponseConstraints;
}

export type ResponseType = 
  | 'exact'           // Must match exactly
  | 'semantic'        // Semantically equivalent
  | 'pattern'         // Matches a pattern
  | 'range'           // Within a range
  | 'contains'        // Must contain certain elements
  | 'excludes'        // Must not contain certain elements
  | 'structured'      // Follows a structure/schema
  | 'creative';       // Creative response with guidelines

export interface ValidationCriteria {
  mustInclude?: string[];
  mustExclude?: string[];
  minLength?: number;
  maxLength?: number;
  format?: string; // regex pattern
  semanticSimilarityThreshold?: number;
  customValidators?: string[]; // function names
}

export interface ResponseConstraints {
  tone?: 'formal' | 'casual' | 'technical' | 'friendly' | 'neutral';
  style?: string[];
  language?: string;
  complexity?: 'simple' | 'moderate' | 'complex' | 'expert';
  audience?: string;
}

export interface EntryMetadata {
  source: DataSource;
  sourceDetails?: {
    originalId?: string;
    timestamp?: string;
    user?: string;
    session?: string;
    confidence?: number;
  };
  
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  testTypes: TestType[];
  evaluationDimensions: string[];
  
  isEdgeCase: boolean;
  isAdversarial: boolean;
  isRealWorld: boolean;
  isSynthetic: boolean;
  
  domain?: string;
  subdomain?: string;
  intent?: string;
  
  createdBy: string;
  validatedBy: string[];
  approvedBy?: string;
  
  explanation?: string;
  usageNotes?: string;
  
  tags: string[];
  customMetadata?: Record<string, any>;
}

export type DataSource = 
  | 'manual'          // Manually created by expert
  | 'production'      // Extracted from production logs
  | 'synthetic'       // Generated synthetically
  | 'crowdsourced'    // From crowdsourcing
  | 'imported'        // Imported from external dataset
  | 'augmented'       // Augmented from existing entry
  | 'user_feedback'   // From user feedback
  | 'a_b_testing';    // From A/B test results

export type EntryCategory = 
  | 'functional'      // Core functionality test
  | 'edge_case'       // Edge/corner cases
  | 'adversarial'     // Adversarial examples
  | 'safety'          // Safety and security
  | 'performance'     // Performance benchmarks
  | 'quality'         // Output quality
  | 'robustness'      // Robustness testing
  | 'fairness'        // Bias and fairness
  | 'compliance'      // Regulatory compliance
  | 'user_experience';// UX validation

export type TestType = 
  | 'accuracy'
  | 'consistency'
  | 'robustness'
  | 'safety'
  | 'fairness'
  | 'performance'
  | 'compliance'
  | 'hallucination'
  | 'toxicity'
  | 'bias'
  | 'privacy'
  | 'security';

export interface QualityTracking {
  validationScore: number; // 0-1
  consensusScore?: number; // Agreement among reviewers
  clarityScore: number;    // How clear/unambiguous
  completenessScore: number; // Has all necessary info
  relevanceScore: number;   // Relevance to use case
  
  expertReviewed: boolean;
  communityVotes?: {
    upvotes: number;
    downvotes: number;
  };
  
  productionTested: boolean;
  productionMetrics?: {
    usageCount: number;
    successRate: number;
    avgConfidence: number;
    lastUsed: string;
  };
  
  issuesFound?: string[];
  improvementSuggestions?: string[];
}

// Dataset-level statistics
export interface DatasetStatistics {
  totalEntries: number;
  
  byCategory: Record<EntryCategory, number>;
  byDifficulty: Record<string, number>;
  bySource: Record<DataSource, number>;
  byTestType: Record<TestType, number>;
  
  avgQualityScore: number;
  avgConsensusScore: number;
  
  coverage: {
    domainCoverage: number;
    featureCoverage: number;
    edgeCaseCoverage: number;
  };
  
  diversity: {
    inputDiversity: number;
    outputDiversity: number;
    semanticDiversity: number;
  };
  
  lastUpdated: string;
  lastValidated: string;
}

// Quality metrics for the entire dataset
export interface QualityMetrics {
  overallScore: number;
  
  dimensions: {
    completeness: number;    // Coverage of use case
    correctness: number;     // Accuracy of examples
    consistency: number;     // Internal consistency
    clarity: number;         // Clarity of examples
    diversity: number;       // Variety of scenarios
    relevance: number;       // Relevance to use case
  };
  
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type: 'duplicate' | 'contradiction' | 'ambiguity' | 'gap' | 'bias' | 'imbalance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedEntries: string[];
  suggestedFix?: string;
}

// Validation status
export interface ValidationStatus {
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'deprecated';
  
  validationProgress: {
    totalEntries: number;
    validated: number;
    pending: number;
    rejected: number;
  };
  
  approvals: Approval[];
  
  readyForProduction: boolean;
  productionChecklist: ChecklistItem[];
  
  lastValidated: string;
  nextReviewDate?: string;
}

export interface Approval {
  approver: string;
  role: 'domain_expert' | 'ml_engineer' | 'product_owner' | 'compliance';
  timestamp: string;
  comments?: string;
  conditions?: string[];
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

// Supporting types
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ImageInput {
  url?: string;
  base64?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface FileInput {
  name: string;
  type: string;
  content: string;
  encoding: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface RetrievalContext {
  query: string;
  topK: number;
  similarityThreshold: number;
  filters?: Record<string, any>;
}

export interface ToolSpecification {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required: string[];
}

export interface EnvironmentContext {
  variables: Record<string, any>;
  state: Record<string, any>;
  constraints: string[];
}

export interface EntryVersion {
  version: number;
  changes: string;
  changedBy: string;
  changedAt: string;
  previousContent: any;
}

// Review and workflow types
export interface Review {
  id: string;
  entryId: string;
  reviewer: string;
  
  scores: {
    accuracy: number;
    clarity: number;
    completeness: number;
    relevance: number;
  };
  
  decision: 'approve' | 'reject' | 'needs_revision';
  comments: string;
  suggestions?: string[];
  
  timestamp: string;
}

export interface WorkflowState {
  entryId: string;
  currentStage: 'collection' | 'review' | 'validation' | 'approval' | 'published';
  
  stages: {
    collection: StageStatus;
    review: StageStatus;
    validation: StageStatus;
    approval: StageStatus;
  };
  
  assignedTo?: string;
  priority: string;
  dueDate?: string;
  blockers?: string[];
}

export interface StageStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

// Import/Export formats
export interface ImportRequest {
  format: 'csv' | 'json' | 'jsonl' | 'parquet' | 'excel';
  file: File | string;
  mapping?: FieldMapping;
  options?: ImportOptions;
}

export interface FieldMapping {
  prompt: string;
  response: string;
  context?: string;
  metadata?: Record<string, string>;
}

export interface ImportOptions {
  validateEntries: boolean;
  skipDuplicates: boolean;
  mergeStrategy?: 'overwrite' | 'skip' | 'version';
  dryRun: boolean;
}

export interface ExportRequest {
  format: 'csv' | 'json' | 'jsonl' | 'parquet' | 'huggingface';
  filters?: ExportFilters;
  options?: ExportOptions;
}

export interface ExportFilters {
  categories?: EntryCategory[];
  difficulties?: string[];
  sources?: DataSource[];
  minQuality?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeVersionHistory: boolean;
  anonymize: boolean;
  compress: boolean;
}

// Analytics types
export interface DatasetAnalytics {
  usage: {
    totalUses: number;
    uniqueUsers: number;
    avgUsesPerDay: number;
    topUsers: Array<{ user: string; count: number }>;
  };
  
  performance: {
    avgAccuracy: number;
    avgLatency: number;
    successRate: number;
    failurePatterns: Array<{ pattern: string; count: number }>;
  };
  
  coverage: {
    featureCoverage: Record<string, number>;
    domainCoverage: Record<string, number>;
    gapAnalysis: string[];
  };
  
  quality: {
    trend: Array<{ date: string; score: number }>;
    topIssues: QualityIssue[];
    improvementRate: number;
  };
}

// Active learning types
export interface ActiveLearningRequest {
  strategy: 'uncertainty' | 'diversity' | 'density' | 'expected_error';
  budget: number; // Number of examples to suggest
  constraints?: {
    categories?: EntryCategory[];
    difficulties?: string[];
    excludeExisting: boolean;
  };
}

export interface ActiveLearningSuggestion {
  input: InputSpecification;
  reason: string;
  expectedValue: number; // Expected improvement to dataset
  category: EntryCategory;
  difficulty: string;
}

// Drift detection
export interface DriftAnalysis {
  detected: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  
  driftTypes: Array<{
    type: 'input' | 'output' | 'performance' | 'quality';
    score: number;
    description: string;
    examples: string[];
  }>;
  
  recommendations: string[];
  suggestedUpdates: GoldenEntry[];
}