/**
 * Risk Recommendation Engine
 * Orchestrates IBM, MIT, OWASP, MITRE, AIID, and QUBE AI Risk Data services
 * to provide intelligent risk recommendations based on use case assessment
 *
 * QUBE AI Risk Data integration provides:
 * - 1170+ risks from 13 taxonomies (including merged legacy IBM and MIT data)
 * - 254 mitigations/actions (NIST AI RMF, Credo UCF)
 * - 17 risk controls (Granite Guardian, ShieldGemma)
 * - 24 evaluations/benchmarks
 */

import type {
  RiskRecommendationInput,
  RiskRecommendations,
  ExternalRisk,
  OwaspRisk,
  MitreTechniqueData,
  AiidIncident,
} from './types';
import { ibmRiskAtlasService } from './ibm-risk-atlas.service';
import { mitRiskRepoService } from './mit-risk-repo.service';
import { owaspLLMService } from './owasp-llm.service';
import { mitreAtlasService } from './mitre-atlas.service';
import { aiidService } from './aiid.service';
import { getAtlasNexusService } from '../qube-ai-nexus';
import type { AtlasRiskRecommendation, Action, RiskControl, Evaluation } from '../qube-ai-nexus/types';

// Lazy import AI agent to avoid bundling OpenAI on client side
async function findRelevantIncidents(
  input: RiskRecommendationInput,
  topN: number = 10
) {
  // Only import on server side when actually needed
  if (typeof window === 'undefined') {
    const { findRelevantIncidents: findIncidents } = await import('../ai-agent/incident-matcher');
    return findIncidents(input, topN);
  }
  // Return empty array if called on client (should never happen)
  return [];
}

/**
 * Detect if the use case involves Generative AI
 */
function detectGenAI(assessmentData: RiskRecommendationInput['assessmentData']): boolean {
  const tech = assessmentData.technicalFeasibility;
  if (!tech) return false;

  // Check model types
  if (tech.modelTypes) {
    const genAIKeywords = [
      'llm',
      'large language',
      'generative',
      'gpt',
      'claude',
      'gemini',
      'multimodal',
      'text generation',
      'chat',
    ];
    const hasGenAI = tech.modelTypes.some((mt) =>
      genAIKeywords.some((keyword) => mt.toLowerCase().includes(keyword))
    );
    if (hasGenAI) return true;
  }

  // Check model provider
  if (tech.modelProvider) {
    const genAIProviders = ['openai', 'anthropic', 'google', 'meta', 'huggingface', 'cohere'];
    if (genAIProviders.some((p) => tech.modelProvider?.toLowerCase().includes(p))) {
      return true;
    }
  }

  // Check business use case
  const business = assessmentData.businessFeasibility;
  if (business?.genAIUseCase) {
    return true;
  }

  return false;
}

/**
 * Detect if the use case involves Agentic AI
 */
function detectAgenticAI(assessmentData: RiskRecommendationInput['assessmentData']): boolean {
  const tech = assessmentData.technicalFeasibility;
  if (!tech) return false;

  // Check agent architecture
  if (tech.agentArchitecture && tech.agentArchitecture.trim().length > 0) {
    return true;
  }

  // Check agent capabilities
  if (tech.agentCapabilities && tech.agentCapabilities.length > 0) {
    return true;
  }

  // Check ethical impact agent behavior
  const ethical = assessmentData.ethicalImpact;
  if (ethical?.agentBehavior?.boundaries && ethical.agentBehavior.boundaries.length > 0) {
    return true;
  }

  return false;
}

/**
 * Detect if RAG architecture is used
 */
function detectRAG(assessmentData: RiskRecommendationInput['assessmentData']): boolean {
  const tech = assessmentData.technicalFeasibility;
  if (!tech) return false;

  // Check if RAG architecture is configured
  if ((tech as any).ragArchitecture) {
    const rag = (tech as any).ragArchitecture;
    if (rag.vectorDatabase || rag.embeddingModel) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if system has plugins/tool integrations
 */
function detectPlugins(assessmentData: RiskRecommendationInput['assessmentData']): boolean {
  const tech = assessmentData.technicalFeasibility;
  if (!tech) return false;

  // Check tool integrations
  if ((tech as any).toolIntegrations && (tech as any).toolIntegrations.length > 0) {
    return true;
  }

  // Check function calling
  if ((tech as any).functionCalling === true) {
    return true;
  }

  return false;
}

/**
 * Determine if system is public-facing
 */
function detectPublicFacing(assessmentData: RiskRecommendationInput['assessmentData']): boolean {
  const business = assessmentData.businessFeasibility;
  if (!business) return false;

  // Check interaction patterns
  if (business.interactionPattern) {
    const publicKeywords = ['public', 'customer', 'external', 'user-facing'];
    if (publicKeywords.some((k) => business.interactionPattern?.toLowerCase().includes(k))) {
      return true;
    }
  }

  // Check user interaction modes
  if (business.userInteractionModes && business.userInteractionModes.length > 0) {
    return true;
  }

  return false;
}

/**
 * Extract data types from assessment
 */
function extractDataTypes(assessmentData: RiskRecommendationInput['assessmentData']): string[] {
  const dataReadiness = assessmentData.dataReadiness;
  if (!dataReadiness) return [];

  const types: string[] = [];
  if (dataReadiness.dataTypes) types.push(...dataReadiness.dataTypes);
  if (dataReadiness.trainingDataTypes) types.push(...dataReadiness.trainingDataTypes);

  return types;
}

/**
 * Extract ethical concerns
 */
function extractEthicalConcerns(
  assessmentData: RiskRecommendationInput['assessmentData']
): string[] {
  const ethical = assessmentData.ethicalImpact;
  if (!ethical) return [];

  const concerns: string[] = [];

  if (ethical.contentGeneration?.risks) {
    concerns.push(...ethical.contentGeneration.risks);
  }

  if (ethical.ethicalConsiderations?.potentialHarmAreas) {
    concerns.push(...ethical.ethicalConsiderations.potentialHarmAreas);
  }

  return concerns;
}

/**
 * Main recommendation function
 * @param input - Use case and assessment data
 * @param source - Which source to fetch: 'risks' (IBM, MIT, OWASP), 'security' (MITRE), 'incidents' (AIID)
 */
export async function recommendRisksFromExternalSources(
  input: RiskRecommendationInput,
  source: 'risks' | 'security' | 'incidents' = 'risks'
): Promise<RiskRecommendations> {
  const { assessmentData } = input;

  // Analyze use case characteristics
  const isGenAI = detectGenAI(assessmentData);
  const isAgenticAI = detectAgenticAI(assessmentData);
  const hasRAG = detectRAG(assessmentData);
  const hasPlugins = detectPlugins(assessmentData);
  const publicFacing = detectPublicFacing(assessmentData);
  const dataTypes = extractDataTypes(assessmentData);
  const ethicalConcerns = extractEthicalConcerns(assessmentData);

  console.log('[Risk Recommender] Analysis:', {
    isGenAI,
    isAgenticAI,
    hasRAG,
    hasPlugins,
    publicFacing,
    dataTypesCount: dataTypes.length,
    ethicalConcernsCount: ethicalConcerns.length,
    source,
  });

  // Initialize empty arrays for all sources
  let ibmRecommendations: any[] = [];
  let mitRecommendations: any[] = [];
  let owaspRecommendations: any[] = [];
  let mitreRecommendations: any[] = [];
  let aiidIncidents: any[] = [];

  // Fetch recommendations based on source
  if (source === 'risks') {
    // Step 12: AI Risk Intelligence - IBM, MIT, OWASP only
    console.log('[Risk Recommender] Fetching AI Risk Intelligence (IBM, MIT, OWASP)...');

    ibmRecommendations = ibmRiskAtlasService.recommendForUseCase({
      isGenAI,
      isAgenticAI,
      dataTypes,
      modelTypes: assessmentData.technicalFeasibility?.modelTypes,
      agentCapabilities: assessmentData.technicalFeasibility?.agentCapabilities,
    });

    mitRecommendations = mitRiskRepoService.recommendForUseCase({
      isGenAI,
      isAgenticAI,
      dataTypes,
      ethicalConcerns,
      useCaseCategory: assessmentData.businessFeasibility?.genAIUseCase,
    });

    // OWASP recommendations (only if GenAI)
    owaspRecommendations = isGenAI
      ? owaspLLMService.assessApplicableRisks({
          isGenAI,
          isAgenticAI,
          hasRAG,
          hasPlugins,
          publicFacing,
          dataTypes,
        })
      : [];
  } else if (source === 'security') {
    // Step 11: Security Assessment - MITRE ATLAS only
    console.log('[Risk Recommender] Fetching Security Assessment (MITRE ATLAS)...');

    mitreRecommendations = mitreAtlasService.recommendForUseCase({
      isGenAI,
      isAgenticAI,
      hasRAG,
      hasPlugins,
      publicFacing,
      hasTrainingPipeline: Boolean(assessmentData.dataReadiness?.trainingDataTypes?.length),
      storesModelWeights: Boolean(assessmentData.technicalFeasibility?.deploymentModels),
      allowsUserQueries: publicFacing || Boolean(assessmentData.businessFeasibility?.userInteractionModes?.length),
      hasExternalAPIs: hasPlugins,
    });
  } else if (source === 'incidents') {
    // Step 15: Incident Learning - AIID only
    console.log('[Risk Recommender] Fetching Incident Learning (AIID)...');

    const aiidMatches = await findRelevantIncidents(input, 10);
    aiidIncidents = aiidMatches.map((match) => match.incident);
    console.log(`[Risk Recommender] Found ${aiidIncidents.length} relevant AIID incidents`);
  }

  // Limit recommendations to reasonable numbers
  const limitedIBM = ibmRecommendations.slice(0, 15);
  const limitedMIT = mitRecommendations.slice(0, 20);

  return {
    ibm: limitedIBM,
    mit: limitedMIT,
    owasp: owaspRecommendations,
    mitre: mitreRecommendations,
    aiid: aiidIncidents,
    totalRecommendations:
      limitedIBM.length +
      limitedMIT.length +
      owaspRecommendations.length +
      mitreRecommendations.length +
      aiidIncidents.length,
    analysis: {
      isGenAI,
      isAgenticAI,
      primaryUseCase: assessmentData.businessFeasibility?.genAIUseCase,
      riskCategories: Array.from(
        new Set([
          ...limitedIBM.map((r) => r.RiskCategory),
          ...limitedMIT.map((r) => r.RiskCategory),
          ...(mitreRecommendations.map((m) => m.metadata?.riskCategory || 'Security').filter(Boolean)),
        ])
      ),
    },
  };
}

/**
 * Get a specific external risk by source and ID
 */
export async function getExternalRisk(
  source: 'ibm' | 'mit' | 'owasp' | 'mitre' | 'aiid',
  sourceId: string
): Promise<ExternalRisk | OwaspRisk | MitreTechniqueData | AiidIncident | undefined> {
  switch (source) {
    case 'ibm':
      return ibmRiskAtlasService.getRisk(sourceId);
    case 'mit':
      return mitRiskRepoService.getRisk(sourceId);
    case 'owasp':
      return owaspLLMService.getRisk(sourceId);
    case 'mitre':
      return mitreAtlasService.getTechnique(sourceId);
    case 'aiid':
      return await aiidService.getIncidentById(parseInt(sourceId));
    default:
      return undefined;
  }
}

/**
 * Get all risks from a specific source for manual browsing
 */
export async function getAllRisksFromSource(
  source: 'ibm' | 'mit' | 'owasp' | 'mitre' | 'aiid'
): Promise<ExternalRisk[] | OwaspRisk[] | MitreTechniqueData[] | AiidIncident[]> {
  switch (source) {
    case 'ibm':
      return ibmRiskAtlasService.getAllRisks();
    case 'mit':
      return mitRiskRepoService.getAllRisks();
    case 'owasp':
      return owaspLLMService.getAllRisks();
    case 'mitre':
      return mitreAtlasService.getAllTechniques();
    case 'aiid':
      return await aiidService.getIncidents(100, 0);
    default:
      return [];
  }
}

// ==================== AI ATLAS NEXUS INTEGRATION ====================

/**
 * Extended recommendations with QUBE AI Risk Data
 * Includes mitigations, evaluations, and controls alongside risks
 */
export interface AtlasNexusRecommendations {
  risks: AtlasRiskRecommendation[];
  mitigations: Action[];
  controls: RiskControl[];
  evaluations: Evaluation[];
  statistics: {
    totalRisks: number;
    totalMitigations: number;
    totalControls: number;
    totalEvaluations: number;
    risksByTaxonomy: Record<string, number>;
  };
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

/**
 * Get comprehensive recommendations from QUBE AI Risk Data
 * Includes risks + mitigations + evaluations + controls
 */
export function getAtlasNexusRecommendations(
  input: RiskRecommendationInput
): AtlasNexusRecommendations {
  const { assessmentData } = input;

  // Analyze use case characteristics
  const isGenAI = detectGenAI(assessmentData);
  const isAgenticAI = detectAgenticAI(assessmentData);
  const hasRAG = detectRAG(assessmentData);
  const hasPlugins = detectPlugins(assessmentData);
  const publicFacing = detectPublicFacing(assessmentData);
  const dataTypes = extractDataTypes(assessmentData);
  const ethicalConcerns = extractEthicalConcerns(assessmentData);

  console.log('[QUBE AI Risk Data] Generating comprehensive recommendations...');

  const atlasService = getAtlasNexusService();

  // Get risk recommendations with relevance scoring
  const riskRecommendations = atlasService.recommendRisksForUseCase({
    isGenAI,
    isAgenticAI,
    hasRAG,
    hasPlugins,
    publicFacing,
    dataTypes,
    keywords: ethicalConcerns,
  });

  // Collect unique mitigations, controls, and evaluations from all recommended risks
  const mitigationsMap = new Map<string, Action>();
  const controlsMap = new Map<string, RiskControl>();
  const evaluationsMap = new Map<string, Evaluation>();
  const matchedTaxonomies = new Set<string>();
  const risksByTaxonomy: Record<string, number> = {};

  for (const rec of riskRecommendations) {
    // Track taxonomies
    matchedTaxonomies.add(rec.risk.isDefinedByTaxonomy);
    risksByTaxonomy[rec.risk.isDefinedByTaxonomy] =
      (risksByTaxonomy[rec.risk.isDefinedByTaxonomy] || 0) + 1;

    // Collect mitigations
    for (const action of rec.mitigations) {
      if (!mitigationsMap.has(action.id)) {
        mitigationsMap.set(action.id, action);
      }
    }

    // Collect controls
    for (const control of rec.controls) {
      if (!controlsMap.has(control.id)) {
        controlsMap.set(control.id, control);
      }
    }

    // Collect evaluations
    for (const evaluation of rec.evaluations) {
      if (!evaluationsMap.has(evaluation.id)) {
        evaluationsMap.set(evaluation.id, evaluation);
      }
    }
  }

  const mitigations = Array.from(mitigationsMap.values());
  const controls = Array.from(controlsMap.values());
  const evaluations = Array.from(evaluationsMap.values());

  console.log(
    `[QUBE AI Risk Data] Found: ${riskRecommendations.length} risks, ${mitigations.length} mitigations, ${controls.length} controls, ${evaluations.length} evaluations`
  );

  return {
    risks: riskRecommendations,
    mitigations,
    controls,
    evaluations,
    statistics: {
      totalRisks: riskRecommendations.length,
      totalMitigations: mitigations.length,
      totalControls: controls.length,
      totalEvaluations: evaluations.length,
      risksByTaxonomy,
    },
    analysis: {
      isGenAI,
      isAgenticAI,
      hasRAG,
      hasPlugins,
      publicFacing,
      dataTypes,
      matchedTaxonomies: Array.from(matchedTaxonomies),
    },
  };
}

/**
 * Get QUBE AI Risk Data statistics
 */
export function getAtlasNexusStatistics() {
  const atlasService = getAtlasNexusService();
  return atlasService.getStatistics();
}

/**
 * Get all taxonomies from QUBE AI Risk Data
 */
export function getAtlasNexusTaxonomies() {
  const atlasService = getAtlasNexusService();
  return atlasService.getAllTaxonomies();
}

/**
 * Get all risks from QUBE AI Risk Data with optional filtering
 */
export function getAtlasNexusRisks(filter?: {
  taxonomy?: string;
  riskGroup?: string;
  tag?: string;
  search?: string;
}) {
  const atlasService = getAtlasNexusService();
  return atlasService.getAllRisks(filter);
}

/**
 * Get all mitigations/actions from QUBE AI Risk Data
 */
export function getAtlasNexusMitigations(filter?: {
  taxonomy?: string;
  relatedRisk?: string;
  search?: string;
}) {
  const atlasService = getAtlasNexusService();
  return atlasService.getAllActions(filter);
}

/**
 * Get all risk controls from QUBE AI Risk Data
 */
export function getAtlasNexusControls(filter?: {
  taxonomy?: string;
  detectsRisk?: string;
  search?: string;
}) {
  const atlasService = getAtlasNexusService();
  return atlasService.getAllControls(filter);
}

/**
 * Get all evaluations/benchmarks from QUBE AI Risk Data
 */
export function getAtlasNexusEvaluations(filter?: {
  assessesRisk?: string;
  search?: string;
}) {
  const atlasService = getAtlasNexusService();
  return atlasService.getAllEvaluations(filter);
}

/**
 * Get a specific risk with enriched data (mitigations, evaluations, controls)
 */
export function getEnrichedAtlasRisk(riskId: string) {
  const atlasService = getAtlasNexusService();
  const risk = atlasService.getRiskById(riskId);
  if (!risk) return undefined;
  return atlasService.getEnrichedRisk(risk);
}
