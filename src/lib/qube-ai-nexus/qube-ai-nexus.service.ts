/**
 * QUBE AI Risk Data Service
 * Provides access to 1100+ risks, 254 mitigations, 17 controls, and 24 evaluations
 * Merged from: IBM Risk Atlas, MIT AI Risk Repository, OWASP, NIST, Credo, AILuminate, and other authoritative sources
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type {
  Risk,
  Action,
  RiskControl,
  Evaluation,
  RiskTaxonomy,
  RiskGroup,
  BenchmarkMetadataCard,
  Incident,
  RiskAtlasData,
  NistActionsData,
  EvalData,
  EnrichedRisk,
  EnrichedAction,
  EnrichedRiskControl,
  EnrichedEvaluation,
  RiskFilter,
  ActionFilter,
  ControlFilter,
  EvaluationFilter,
  AtlasStatistics,
  AtlasRiskRecommendation,
} from './types';

// Path to data files
const DATA_DIR = path.join(process.cwd(), 'src/lib/qube-ai-nexus/data');

// Cache for loaded data
let cachedData: {
  taxonomies: RiskTaxonomy[];
  riskGroups: RiskGroup[];
  risks: Risk[];
  actions: Action[];
  controls: RiskControl[];
  evaluations: Evaluation[];
  benchmarkCards: BenchmarkMetadataCard[];
  incidents: Incident[];
} | null = null;

/**
 * Load and parse a YAML file
 */
function loadYamlFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content) as T;
}

/**
 * Load all data from YAML files
 */
function loadAllData() {
  if (cachedData) return cachedData;

  console.log('[QUBE AI Risk Data] Loading data files...');

  const taxonomies: RiskTaxonomy[] = [];
  const riskGroups: RiskGroup[] = [];
  const risks: Risk[] = [];
  const actions: Action[] = [];
  const controls: RiskControl[] = [];
  const evaluations: Evaluation[] = [];
  const benchmarkCards: BenchmarkMetadataCard[] = [];
  const incidents: Incident[] = [];

  // Load IBM Risk Atlas (99 risks)
  try {
    const ibmData = loadYamlFile<RiskAtlasData>('risk_atlas_data.yaml');
    if (ibmData.taxonomies) taxonomies.push(...ibmData.taxonomies);
    if (ibmData.riskgroups) riskGroups.push(...ibmData.riskgroups);
    if (ibmData.risks) risks.push(...ibmData.risks);
    console.log(`  - IBM Risk Atlas: ${ibmData.risks?.length || 0} risks`);
  } catch (e) {
    console.error('Failed to load risk_atlas_data.yaml:', e);
  }

  // Load AIR 2024 (314 risks)
  try {
    const airData = loadYamlFile<RiskAtlasData>('air_2024_data.yaml');
    if (airData.taxonomies) taxonomies.push(...airData.taxonomies);
    if (airData.riskgroups) riskGroups.push(...airData.riskgroups);
    if (airData.risks) risks.push(...airData.risks);
    console.log(`  - AIR 2024: ${airData.risks?.length || 0} risks`);
  } catch (e) {
    console.error('Failed to load air_2024_data.yaml:', e);
  }

  // Load Credo UCF (49 risks, 42 actions)
  try {
    const credoData = loadYamlFile<RiskAtlasData>('credo.yaml');
    if (credoData.taxonomies) taxonomies.push(...credoData.taxonomies);
    if (credoData.riskgroups) riskGroups.push(...credoData.riskgroups);
    if (credoData.risks) risks.push(...credoData.risks);
    if (credoData.actions) actions.push(...credoData.actions);
    console.log(`  - Credo UCF: ${credoData.risks?.length || 0} risks, ${credoData.actions?.length || 0} actions`);
  } catch (e) {
    console.error('Failed to load credo.yaml:', e);
  }

  // Load MIT AI Risk Repository (33 risks)
  try {
    const mitData = loadYamlFile<RiskAtlasData>('mit_ai_risk_repository_data.yaml');
    if (mitData.taxonomies) taxonomies.push(...mitData.taxonomies);
    if (mitData.riskgroups) riskGroups.push(...mitData.riskgroups);
    if (mitData.risks) risks.push(...mitData.risks);
    console.log(`  - MIT AI Risk Repository: ${mitData.risks?.length || 0} risks`);
  } catch (e) {
    console.error('Failed to load mit_ai_risk_repository_data.yaml:', e);
  }

  // Load NIST AI RMF (12 risks)
  try {
    const nistData = loadYamlFile<RiskAtlasData>('nist_ai_rmf_data.yaml');
    if (nistData.taxonomies) taxonomies.push(...nistData.taxonomies);
    if (nistData.riskgroups) riskGroups.push(...nistData.riskgroups);
    if (nistData.risks) risks.push(...nistData.risks);
    console.log(`  - NIST AI RMF: ${nistData.risks?.length || 0} risks`);
  } catch (e) {
    console.error('Failed to load nist_ai_rmf_data.yaml:', e);
  }

  // Load NIST AI RMF Actions (212 actions)
  try {
    const nistActionsData = loadYamlFile<NistActionsData>('nist_ai_rmf_actions_data.yaml');
    if (nistActionsData.actions) actions.push(...nistActionsData.actions);
    console.log(`  - NIST AI RMF Actions: ${nistActionsData.actions?.length || 0} actions`);
  } catch (e) {
    console.error('Failed to load nist_ai_rmf_actions_data.yaml:', e);
  }

  // Load OWASP LLM Top 10 (10 risks)
  try {
    const owaspData = loadYamlFile<RiskAtlasData>('owasp_llm_2.0_data.yaml');
    if (owaspData.taxonomies) taxonomies.push(...owaspData.taxonomies);
    if (owaspData.riskgroups) riskGroups.push(...owaspData.riskgroups);
    if (owaspData.risks) risks.push(...owaspData.risks);
    console.log(`  - OWASP LLM Top 10: ${owaspData.risks?.length || 0} risks`);
  } catch (e) {
    console.error('Failed to load owasp_llm_2.0_data.yaml:', e);
  }

  // Load AILuminate (12 risks)
  try {
    const ailuminateData = loadYamlFile<RiskAtlasData>('ailuminate.yaml');
    if (ailuminateData.taxonomies) taxonomies.push(...ailuminateData.taxonomies);
    if (ailuminateData.riskgroups) riskGroups.push(...ailuminateData.riskgroups);
    if (ailuminateData.risks) risks.push(...ailuminateData.risks);
    console.log(`  - AILuminate: ${ailuminateData.risks?.length || 0} risks`);
  } catch (e) {
    console.error('Failed to load ailuminate.yaml:', e);
  }

  // Load Granite Guardian (13 controls/risks)
  try {
    const graniteData = loadYamlFile<any>('granite_guardian_dimensions.yaml');
    if (graniteData.taxonomies) taxonomies.push(...graniteData.taxonomies);
    if (graniteData.riskgroups) riskGroups.push(...graniteData.riskgroups);

    // Load risks (only those with proper name field, skip reference entries)
    if (graniteData.risks) {
      const validRisks = graniteData.risks.filter((r: any) => r && r.name && r.description);
      risks.push(...validRisks);
    }

    // Load actual riskControls from the dedicated array
    if (graniteData.riskcontrols) {
      graniteData.riskcontrols.forEach((c: any) => {
        if (!c || !c.id || !c.name) return;
        controls.push({
          id: c.id,
          name: c.name,
          description: c.description || `Detection control for ${c.name}`,
          isDefinedByTaxonomy: c.isDefinedByTaxonomy || 'granite-guardian',
          detectsRisk: c.detectsRiskConcept || c.detectsRisk,
        });
      });
      console.log(`  - Granite Guardian: ${graniteData.riskcontrols.length} controls`);
    } else {
      console.log(`  - Granite Guardian: ${graniteData.risks?.filter((r: any) => r && r.name && r.description).length || 0} risks (no riskcontrols found)`);
    }
  } catch (e) {
    console.error('Failed to load granite_guardian_dimensions.yaml:', e);
  }

  // Load ShieldGemma (4 controls)
  try {
    const shieldgemmaData = loadYamlFile<any>('shieldgemma_dimensions.yaml');
    if (shieldgemmaData.taxonomies) taxonomies.push(...shieldgemmaData.taxonomies);
    if (shieldgemmaData.riskgroups) riskGroups.push(...shieldgemmaData.riskgroups);

    // Load risks (only those with proper name field, skip reference entries)
    if (shieldgemmaData.risks) {
      const validRisks = shieldgemmaData.risks.filter((r: any) => r && r.name && r.description);
      risks.push(...validRisks);
    }

    // Load actual riskControls from the dedicated array
    if (shieldgemmaData.riskcontrols) {
      shieldgemmaData.riskcontrols.forEach((c: any) => {
        if (!c || !c.id || !c.name) return;
        controls.push({
          id: c.id,
          name: c.name,
          description: c.description || `Detection control for ${c.name}`,
          isDefinedByTaxonomy: c.isDefinedByTaxonomy || 'shieldgemma',
          detectsRisk: c.detectsRiskConcept || c.detectsRisk,
        });
      });
      console.log(`  - ShieldGemma: ${shieldgemmaData.riskcontrols.length} controls`);
    } else {
      console.log(`  - ShieldGemma: ${shieldgemmaData.risks?.filter((r: any) => r && r.name && r.description).length || 0} risks (no riskcontrols found)`);
    }
  } catch (e) {
    console.error('Failed to load shieldgemma_dimensions.yaml:', e);
  }

  // Load Evaluations and Benchmarks (24 evaluations)
  try {
    const evalData = loadYamlFile<EvalData>('ai_eval_data.yaml');
    if (evalData.evaluations) evaluations.push(...evalData.evaluations);
    if (evalData.benchmarkMetadataCards) benchmarkCards.push(...evalData.benchmarkMetadataCards);
    console.log(`  - Evaluations: ${evalData.evaluations?.length || 0} benchmarks`);
  } catch (e) {
    console.error('Failed to load ai_eval_data.yaml:', e);
  }

  // Load Incidents
  try {
    const incidentData = loadYamlFile<RiskAtlasData>('risk_atlas_data_incidents.yaml');
    if (incidentData.incidents) incidents.push(...incidentData.incidents);
    console.log(`  - Incidents: ${incidentData.incidents?.length || 0} incidents`);
  } catch (e) {
    console.error('Failed to load risk_atlas_data_incidents.yaml:', e);
  }

  // Load QUBE Legacy IBM Risks (merged from original 113 IBM risks)
  try {
    const legacyIbmData = loadYamlFile<any>('qube_legacy_ibm_risks.yaml');
    if (legacyIbmData.taxonomies) taxonomies.push(...legacyIbmData.taxonomies);
    if (legacyIbmData.risks) {
      const validRisks = legacyIbmData.risks.filter((r: any) => r && r.name);
      risks.push(...validRisks);
      console.log(`  - QUBE Legacy IBM: ${validRisks.length} risks`);
    }
  } catch (e) {
    console.error('Failed to load qube_legacy_ibm_risks.yaml:', e);
  }

  // Load QUBE Legacy MIT Risks (merged from original 611 MIT risks)
  try {
    const legacyMitData = loadYamlFile<any>('qube_legacy_mit_risks.yaml');
    if (legacyMitData.taxonomies) taxonomies.push(...legacyMitData.taxonomies);
    if (legacyMitData.risks) {
      const validRisks = legacyMitData.risks.filter((r: any) => r && r.name);
      risks.push(...validRisks);
      console.log(`  - QUBE Legacy MIT: ${validRisks.length} risks`);
    }
  } catch (e) {
    console.error('Failed to load qube_legacy_mit_risks.yaml:', e);
  }

  cachedData = {
    taxonomies,
    riskGroups,
    risks,
    actions,
    controls,
    evaluations,
    benchmarkCards,
    incidents,
  };

  console.log(`[QUBE AI Risk Data] Loaded: ${risks.length} risks, ${actions.length} actions, ${controls.length} controls, ${evaluations.length} evaluations`);

  return cachedData;
}

/**
 * QUBE AI Risk Data Service Class
 */
export class AIAtlasNexusService {
  private data: ReturnType<typeof loadAllData>;

  constructor() {
    this.data = loadAllData();
  }

  // ==================== Taxonomies ====================

  getAllTaxonomies(): RiskTaxonomy[] {
    return this.data.taxonomies;
  }

  getTaxonomyById(id: string): RiskTaxonomy | undefined {
    return this.data.taxonomies.find((t) => t.id === id);
  }

  // ==================== Risk Groups ====================

  getAllRiskGroups(): RiskGroup[] {
    return this.data.riskGroups;
  }

  getRiskGroupsByTaxonomy(taxonomyId: string): RiskGroup[] {
    return this.data.riskGroups.filter((g) => g.isDefinedByTaxonomy === taxonomyId);
  }

  // ==================== Risks ====================

  getAllRisks(filter?: RiskFilter): Risk[] {
    let risks = this.data.risks;

    if (filter?.taxonomy) {
      risks = risks.filter((r) => r.isDefinedByTaxonomy === filter.taxonomy);
    }

    if (filter?.riskGroup) {
      risks = risks.filter((r) => r.isPartOf === filter.riskGroup);
    }

    if (filter?.tag) {
      risks = risks.filter((r) => r.tag === filter.tag);
    }

    if (filter?.type) {
      risks = risks.filter((r) => r.type === filter.type);
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      risks = risks.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          r.tag?.toLowerCase().includes(searchLower)
      );
    }

    return risks;
  }

  getRiskById(id: string): Risk | undefined {
    return this.data.risks.find((r) => r.id === id);
  }

  getRiskByTag(tag: string): Risk | undefined {
    return this.data.risks.find((r) => r.tag === tag);
  }

  getRisksByTaxonomy(taxonomyId: string): Risk[] {
    return this.data.risks.filter((r) => r.isDefinedByTaxonomy === taxonomyId);
  }

  // ==================== Actions/Mitigations ====================

  getAllActions(filter?: ActionFilter): Action[] {
    let actions = this.data.actions;

    if (filter?.taxonomy) {
      actions = actions.filter((a) => a.isDefinedByTaxonomy === filter.taxonomy);
    }

    if (filter?.relatedRisk) {
      actions = actions.filter((a) => a.hasRelatedRisk?.includes(filter.relatedRisk!));
    }

    if (filter?.aiActorTask) {
      actions = actions.filter((a) => a.hasAiActorTask?.includes(filter.aiActorTask!));
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      actions = actions.filter(
        (a) =>
          a.name.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower)
      );
    }

    return actions;
  }

  getActionById(id: string): Action | undefined {
    return this.data.actions.find((a) => a.id === id);
  }

  getRelatedActions(risk: Risk): Action[] {
    const riskId = risk.id;
    const riskTag = risk.tag;

    return this.data.actions.filter((a) => {
      if (!a.hasRelatedRisk) return false;
      return a.hasRelatedRisk.some(
        (relatedId) =>
          relatedId === riskId ||
          relatedId === riskTag ||
          relatedId.includes(riskTag || '') ||
          (riskId && relatedId.includes(riskId))
      );
    });
  }

  // ==================== Risk Controls ====================

  getAllControls(filter?: ControlFilter): RiskControl[] {
    // Filter out any controls without required fields
    let controls = this.data.controls.filter((c) => c && c.name && c.id);

    if (filter?.taxonomy) {
      controls = controls.filter((c) => c.isDefinedByTaxonomy === filter.taxonomy);
    }

    if (filter?.detectsRisk) {
      controls = controls.filter((c) => c.detectsRisk?.includes(filter.detectsRisk!));
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      controls = controls.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }

    return controls;
  }

  getControlById(id: string): RiskControl | undefined {
    return this.data.controls.find((c) => c.id === id);
  }

  getRelatedControls(risk: Risk): RiskControl[] {
    const riskId = risk.id;
    const riskTag = risk.tag;

    return this.data.controls.filter((c) => {
      if (!c.detectsRisk) return false;
      return c.detectsRisk.some(
        (detectedId) =>
          detectedId === riskId ||
          detectedId === riskTag ||
          detectedId.includes(riskTag || '') ||
          (riskId && detectedId.includes(riskId))
      );
    });
  }

  // ==================== Evaluations ====================

  getAllEvaluations(filter?: EvaluationFilter): Evaluation[] {
    let evaluations = this.data.evaluations;

    if (filter?.assessesRisk) {
      evaluations = evaluations.filter((e) => e.assessesRisk?.includes(filter.assessesRisk!));
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      evaluations = evaluations.filter(
        (e) =>
          e.name.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower)
      );
    }

    return evaluations;
  }

  getEvaluationById(id: string): Evaluation | undefined {
    return this.data.evaluations.find((e) => e.id === id);
  }

  getRelatedEvaluations(risk: Risk): Evaluation[] {
    const riskId = risk.id;
    const riskTag = risk.tag;

    return this.data.evaluations.filter((e) => {
      if (!e.assessesRisk) return false;
      return e.assessesRisk.some(
        (assessedId) =>
          assessedId === riskId ||
          assessedId === riskTag ||
          assessedId.includes(riskTag || '') ||
          (riskId && assessedId.includes(riskId))
      );
    });
  }

  getBenchmarkCards(): BenchmarkMetadataCard[] {
    return this.data.benchmarkCards;
  }

  // ==================== Incidents ====================

  getAllIncidents(): Incident[] {
    return this.data.incidents;
  }

  getIncidentById(id: string): Incident | undefined {
    return this.data.incidents.find((i) => i.id === id);
  }

  // ==================== Statistics ====================

  getStatistics(): AtlasStatistics {
    const risksByTaxonomy: Record<string, number> = {};
    const actionsByTaxonomy: Record<string, number> = {};
    const controlsByTaxonomy: Record<string, number> = {};
    const risksByGroup: Record<string, number> = {};

    this.data.risks.forEach((r) => {
      risksByTaxonomy[r.isDefinedByTaxonomy] = (risksByTaxonomy[r.isDefinedByTaxonomy] || 0) + 1;
      if (r.isPartOf) {
        risksByGroup[r.isPartOf] = (risksByGroup[r.isPartOf] || 0) + 1;
      }
    });

    this.data.actions.forEach((a) => {
      actionsByTaxonomy[a.isDefinedByTaxonomy] = (actionsByTaxonomy[a.isDefinedByTaxonomy] || 0) + 1;
    });

    this.data.controls.forEach((c) => {
      controlsByTaxonomy[c.isDefinedByTaxonomy] = (controlsByTaxonomy[c.isDefinedByTaxonomy] || 0) + 1;
    });

    return {
      totalRisks: this.data.risks.length,
      totalActions: this.data.actions.length,
      totalControls: this.data.controls.length,
      totalEvaluations: this.data.evaluations.length,
      risksByTaxonomy,
      actionsByTaxonomy,
      controlsByTaxonomy,
      risksByGroup,
    };
  }

  // ==================== Enriched Data ====================

  getEnrichedRisk(risk: Risk): EnrichedRisk {
    const taxonomy = this.getTaxonomyById(risk.isDefinedByTaxonomy);
    const riskGroup = risk.isPartOf
      ? this.data.riskGroups.find((g) => g.id === risk.isPartOf)
      : undefined;

    return {
      ...risk,
      source: this.mapTaxonomyToSource(risk.isDefinedByTaxonomy),
      taxonomyName: taxonomy?.name,
      riskGroupName: riskGroup?.name,
      relatedActions: this.getRelatedActions(risk),
      relatedEvaluations: this.getRelatedEvaluations(risk),
      relatedControls: this.getRelatedControls(risk),
    };
  }

  private mapTaxonomyToSource(taxonomyId: string): EnrichedRisk['source'] {
    const mapping: Record<string, EnrichedRisk['source']> = {
      'ibm-risk-atlas': 'ibm-risk-atlas',
      'ai-risk-taxonomy': 'air-2024',
      'credo-ucf': 'credo-ucf',
      'mit-ai-risk-repository': 'mit-ai-risk',
      'mit-ai-risk-repository-causal': 'mit-ai-risk',
      'nist-ai-rmf': 'nist-ai-rmf',
      'owasp-llm-2.0': 'owasp-llm',
      'ailuminate-v1.0': 'ailuminate',
      'ibm-granite-guardian': 'granite-guardian',
      'shieldgemma-taxonomy': 'shieldgemma',
    };
    return mapping[taxonomyId] || 'ibm-risk-atlas';
  }

  // ==================== Recommendations ====================

  recommendRisksForUseCase(characteristics: {
    isGenAI?: boolean;
    isAgenticAI?: boolean;
    hasRAG?: boolean;
    hasPlugins?: boolean;
    publicFacing?: boolean;
    dataTypes?: string[];
    keywords?: string[];
  }): AtlasRiskRecommendation[] {
    const recommendations: AtlasRiskRecommendation[] = [];
    const allRisks = this.data.risks;

    // Define relevance scoring
    const scoreRisk = (risk: Risk): number => {
      let score = 0;
      const descLower = risk.description.toLowerCase();
      const nameLower = risk.name.toLowerCase();
      const text = descLower + ' ' + nameLower;

      // GenAI relevance
      if (characteristics.isGenAI) {
        if (
          text.includes('generat') ||
          text.includes('llm') ||
          text.includes('language model') ||
          text.includes('hallucin') ||
          text.includes('prompt')
        ) {
          score += 30;
        }
      }

      // Agentic AI relevance
      if (characteristics.isAgenticAI) {
        if (
          text.includes('agent') ||
          text.includes('autonom') ||
          text.includes('decision') ||
          text.includes('action')
        ) {
          score += 30;
        }
      }

      // RAG relevance
      if (characteristics.hasRAG) {
        if (
          text.includes('retriev') ||
          text.includes('ground') ||
          text.includes('context') ||
          text.includes('embed')
        ) {
          score += 20;
        }
      }

      // Plugin/Tool relevance
      if (characteristics.hasPlugins) {
        if (
          text.includes('tool') ||
          text.includes('plugin') ||
          text.includes('integrat') ||
          text.includes('api')
        ) {
          score += 20;
        }
      }

      // Public facing relevance
      if (characteristics.publicFacing) {
        if (
          text.includes('user') ||
          text.includes('public') ||
          text.includes('attack') ||
          text.includes('inject')
        ) {
          score += 15;
        }
      }

      // Data type relevance
      if (characteristics.dataTypes?.length) {
        const hasSensitive = characteristics.dataTypes.some(
          (dt) =>
            dt.toLowerCase().includes('pii') ||
            dt.toLowerCase().includes('personal') ||
            dt.toLowerCase().includes('sensitive') ||
            dt.toLowerCase().includes('health') ||
            dt.toLowerCase().includes('financial')
        );
        if (hasSensitive && (text.includes('privacy') || text.includes('data') || text.includes('confidential'))) {
          score += 25;
        }
      }

      // Keyword matching
      if (characteristics.keywords?.length) {
        for (const keyword of characteristics.keywords) {
          if (text.includes(keyword.toLowerCase())) {
            score += 10;
          }
        }
      }

      // Boost high-priority taxonomies
      if (risk.isDefinedByTaxonomy === 'ibm-risk-atlas') score += 5;
      if (risk.isDefinedByTaxonomy === 'owasp-llm-2.0') score += 5;
      if (risk.isDefinedByTaxonomy === 'nist-ai-rmf') score += 3;

      return score;
    };

    // Score all risks
    for (const risk of allRisks) {
      const score = scoreRisk(risk);
      if (score > 10) {
        recommendations.push({
          risk: this.getEnrichedRisk(risk),
          relevanceScore: score,
          mitigations: this.getRelatedActions(risk),
          evaluations: this.getRelatedEvaluations(risk),
          controls: this.getRelatedControls(risk),
        });
      }
    }

    // Sort by relevance score
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendations.slice(0, 50); // Return top 50
  }
}

// Singleton instance
let serviceInstance: AIAtlasNexusService | null = null;

export function getAtlasNexusService(): AIAtlasNexusService {
  if (!serviceInstance) {
    serviceInstance = new AIAtlasNexusService();
  }
  return serviceInstance;
}

// Clear all caches (useful for testing/reloading data)
export function clearAtlasNexusCache(): void {
  cachedData = null;
  serviceInstance = null;
}

export const atlasNexusService = {
  get instance() {
    return getAtlasNexusService();
  },
};
