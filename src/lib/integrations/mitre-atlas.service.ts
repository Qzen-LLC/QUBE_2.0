/**
 * MITRE ATLAS Integration Service
 * Loads and filters adversarial techniques from MITRE's 140+ techniques across 14 tactics
 */

import type { MitreTechniqueData } from './types';
import mitreTechniques from '../../../docs/MITREATLAS.json';

export interface MitreTechniqueFilter {
  tactic?: string;
  severity?: string;
  search?: string;
  hasCaseStudies?: boolean;
}

export interface UseCaseSecurityCharacteristics {
  isGenAI: boolean;
  isAgenticAI: boolean;
  hasRAG?: boolean;
  hasPlugins?: boolean;
  publicFacing?: boolean;
  hasTrainingPipeline?: boolean;
  storesModelWeights?: boolean;
  allowsUserQueries?: boolean;
  hasExternalAPIs?: boolean;
}

export class MitreAtlasService {
  private techniques: MitreTechniqueData[];

  constructor() {
    // Load MITRE ATLAS techniques
    this.techniques = (mitreTechniques as any[]).map((technique) => ({
      techniqueId: technique.TechniqueId,
      tactic: technique.Tactic,
      tacticId: technique.TacticId,
      technique: technique.Summary,
      description: technique.Description,
      severity: technique.RiskSeverity,
      mitigation: technique.Mitigation,
      detection: technique.Detection,
      caseStudies: technique.CaseStudies || [],
      metadata: {
        ...technique.Metadata,
        riskCategory: technique.RiskCategory,
        likelihood: technique.Likelihood,
        internalId: technique.Id,
      },
    }));
  }

  /**
   * Get all MITRE ATLAS techniques
   */
  getAllTechniques(): MitreTechniqueData[] {
    return this.techniques;
  }

  /**
   * Get a specific technique by ID
   */
  getTechnique(id: string): MitreTechniqueData | undefined {
    return this.techniques.find((t) => t.techniqueId === id);
  }

  /**
   * Get techniques by tactic
   */
  getByTactic(tactic: string): MitreTechniqueData[] {
    return this.techniques.filter(
      (t) => t.tactic && t.tactic.toLowerCase().includes(tactic.toLowerCase())
    );
  }

  /**
   * Get all unique tactics
   */
  getAllTactics(): string[] {
    const tactics = new Set(this.techniques.map((t) => t.tactic).filter(Boolean));
    return Array.from(tactics).sort();
  }

  /**
   * Filter techniques based on criteria
   */
  filterTechniques(filter: MitreTechniqueFilter): MitreTechniqueData[] {
    return this.techniques.filter((technique) => {
      if (filter.tactic) {
        if (!technique.tactic || !technique.tactic.toLowerCase().includes(filter.tactic.toLowerCase())) {
          return false;
        }
      }

      if (filter.severity) {
        if (technique.severity?.toLowerCase() !== filter.severity.toLowerCase()) {
          return false;
        }
      }

      if (filter.hasCaseStudies) {
        if (!technique.caseStudies || technique.caseStudies.length === 0) {
          return false;
        }
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          technique.technique.toLowerCase().includes(searchLower) ||
          technique.description.toLowerCase().includes(searchLower) ||
          (technique.tactic && technique.tactic.toLowerCase().includes(searchLower)) ||
          technique.techniqueId.toLowerCase().includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Recommend techniques based on use case security characteristics
   */
  recommendForUseCase(characteristics: UseCaseSecurityCharacteristics): MitreTechniqueData[] {
    const recommendations: MitreTechniqueData[] = [];

    // Map characteristics to tactics
    const relevantTactics: Set<string> = new Set();

    // Always include reconnaissance for any AI system
    relevantTactics.add('Reconnaissance');
    relevantTactics.add('AI Model Access');

    if (characteristics.publicFacing) {
      relevantTactics.add('Initial Access');
      relevantTactics.add('Exfiltration');
      relevantTactics.add('Impact');
    }

    if (characteristics.isGenAI) {
      relevantTactics.add('ML Attack Staging');
      relevantTactics.add('Exfiltration');
      // Prompt injection and related attacks
      recommendations.push(...this.filterTechniques({ search: 'prompt' }));
      recommendations.push(...this.filterTechniques({ search: 'injection' }));
    }

    if (characteristics.isAgenticAI || characteristics.hasPlugins) {
      relevantTactics.add('Impact');
      relevantTactics.add('Execution');
      // Agent-specific attacks
      recommendations.push(...this.filterTechniques({ search: 'agent' }));
      recommendations.push(...this.filterTechniques({ search: 'tool' }));
    }

    if (characteristics.hasRAG) {
      relevantTactics.add('ML Attack Staging');
      relevantTactics.add('Collection');
      // RAG and vector database attacks
      recommendations.push(...this.filterTechniques({ search: 'retrieval' }));
      recommendations.push(...this.filterTechniques({ search: 'embedding' }));
      recommendations.push(...this.filterTechniques({ search: 'vector' }));
    }

    if (characteristics.hasTrainingPipeline) {
      relevantTactics.add('ML Attack Staging');
      relevantTactics.add('Resource Development');
      // Data poisoning and model manipulation
      recommendations.push(...this.filterTechniques({ search: 'poisoning' }));
      recommendations.push(...this.filterTechniques({ search: 'training' }));
    }

    if (characteristics.storesModelWeights) {
      relevantTactics.add('Exfiltration');
      relevantTactics.add('Collection');
      // Model extraction attacks
      recommendations.push(...this.filterTechniques({ search: 'extraction' }));
      recommendations.push(...this.filterTechniques({ search: 'model stealing' }));
      recommendations.push(...this.filterTechniques({ search: 'inversion' }));
    }

    if (characteristics.allowsUserQueries || characteristics.publicFacing) {
      // Query-based attacks
      recommendations.push(...this.filterTechniques({ search: 'query' }));
      recommendations.push(...this.filterTechniques({ search: 'inference' }));
    }

    if (characteristics.hasExternalAPIs) {
      relevantTactics.add('Initial Access');
      relevantTactics.add('Defense Evasion');
      // API-related attacks
      recommendations.push(...this.filterTechniques({ search: 'api' }));
    }

    // Add techniques from relevant tactics
    relevantTactics.forEach((tactic) => {
      const tacticTechniques = this.getByTactic(tactic);
      recommendations.push(...tacticTechniques);
    });

    // Remove duplicates and limit
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map((r) => [r.techniqueId, r])).values()
    );

    // Prioritize techniques with case studies and higher severity
    return uniqueRecommendations
      .sort((a, b) => {
        // Prioritize Critical > High > Medium > Low
        const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const severityDiff =
          (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
          (severityOrder[a.severity as keyof typeof severityOrder] || 0);

        if (severityDiff !== 0) return severityDiff;

        // Then prioritize techniques with case studies
        const aCaseStudies = a.caseStudies?.length || 0;
        const bCaseStudies = b.caseStudies?.length || 0;
        return bCaseStudies - aCaseStudies;
      })
      .slice(0, 25); // Limit to top 25 recommendations
  }

  /**
   * Get statistics about MITRE ATLAS data
   */
  getStatistics() {
    const tactics = this.getAllTactics();
    const withCaseStudies = this.techniques.filter(
      (t) => t.caseStudies && t.caseStudies.length > 0
    ).length;
    const withMitigations = this.techniques.filter(
      (t) => t.mitigation && t.mitigation.trim().length > 0
    ).length;

    const bySeverity = {
      Critical: this.techniques.filter((t) => t.severity === 'Critical').length,
      High: this.techniques.filter((t) => t.severity === 'High').length,
      Medium: this.techniques.filter((t) => t.severity === 'Medium').length,
      Low: this.techniques.filter((t) => t.severity === 'Low').length,
    };

    return {
      total: this.techniques.length,
      tactics: tactics.length,
      tacticsList: tactics,
      withCaseStudies,
      withMitigations,
      bySeverity,
    };
  }
}

// Export singleton instance
export const mitreAtlasService = new MitreAtlasService();
