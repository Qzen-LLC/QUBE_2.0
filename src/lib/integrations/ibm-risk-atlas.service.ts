/**
 * IBM AI Risk Atlas Integration Service
 * Loads and filters risks from IBM's 113 curated AI risks
 */

import type { ExternalRisk } from './types';
import ibmRisks from '../../../docs/IBMAIRISKDB.json';

export interface IBMRiskFilter {
  category?: string;
  severity?: string;
  likelihood?: string;
  search?: string;
}

export class IBMRiskAtlasService {
  private risks: ExternalRisk[];

  constructor() {
    // Transform IBM risks to standard format
    this.risks = (ibmRisks as any[]).map((risk) => ({
      Id: risk.Id,
      Summary: risk.Summary,
      Description: risk.Description,
      RiskCategory: risk['Risk Category'],
      RiskSeverity: risk['Risk Severity'] as any,
      Likelihood: risk.Likelihood as any,
      source: 'ibm' as const,
      metadata: {
        originalCategory: risk['Risk Category'],
        fullDescription: risk.Description,
      },
    }));
  }

  /**
   * Get all IBM risks
   */
  getAllRisks(): ExternalRisk[] {
    return this.risks;
  }

  /**
   * Get a specific risk by ID
   */
  getRisk(id: string | number): ExternalRisk | undefined {
    return this.risks.find((r) => r.Id === Number(id));
  }

  /**
   * Filter risks based on criteria
   */
  filterRisks(filter: IBMRiskFilter): ExternalRisk[] {
    return this.risks.filter((risk) => {
      if (filter.category) {
        const categories = risk.RiskCategory.toLowerCase();
        if (!categories.includes(filter.category.toLowerCase())) {
          return false;
        }
      }

      if (filter.severity) {
        if (risk.RiskSeverity.toLowerCase() !== filter.severity.toLowerCase()) {
          return false;
        }
      }

      if (filter.likelihood) {
        if (risk.Likelihood.toLowerCase() !== filter.likelihood.toLowerCase()) {
          return false;
        }
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          risk.Summary.toLowerCase().includes(searchLower) ||
          risk.Description.toLowerCase().includes(searchLower) ||
          risk.RiskCategory.toLowerCase().includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Recommend risks based on use case characteristics
   */
  recommendForUseCase(characteristics: {
    isGenAI?: boolean;
    isAgenticAI?: boolean;
    dataTypes?: string[];
    modelTypes?: string[];
    agentCapabilities?: string[];
  }): ExternalRisk[] {
    const recommendations: ExternalRisk[] = [];

    // Agentic AI risks (IDs 1-22)
    if (characteristics.isAgenticAI) {
      recommendations.push(...this.risks.filter((r) => r.Id >= 1 && r.Id <= 22));
    }

    // Data Privacy risks (IDs 23-39)
    if (characteristics.dataTypes && characteristics.dataTypes.length > 0) {
      const hasSensitiveData = characteristics.dataTypes.some((dt) =>
        ['PII', 'personal', 'sensitive', 'health', 'financial', 'biometric'].some((keyword) =>
          dt.toLowerCase().includes(keyword)
        )
      );

      if (hasSensitiveData) {
        recommendations.push(...this.risks.filter((r) => r.Id >= 23 && r.Id <= 39));
      }
    }

    // Generative AI risks (IDs 77-97)
    if (characteristics.isGenAI) {
      recommendations.push(...this.risks.filter((r) => r.Id >= 77 && r.Id <= 97));
    }

    // Inference & Attack risks (IDs 40-56) - relevant for all AI
    recommendations.push(...this.risks.filter((r) => r.Id >= 40 && r.Id <= 56).slice(0, 5));

    // Remove duplicates
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map((r) => [r.Id, r])).values()
    );

    // Sort by severity (Major > Moderate > Minor)
    return uniqueRecommendations.sort((a, b) => {
      const severityOrder = { Major: 3, Moderate: 2, Minor: 1 };
      return (
        severityOrder[b.RiskSeverity as keyof typeof severityOrder] -
        severityOrder[a.RiskSeverity as keyof typeof severityOrder]
      );
    });
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.risks.forEach((risk) => {
      risk.RiskCategory.split(';').forEach((cat) => {
        categories.add(cat.trim());
      });
    });
    return Array.from(categories).sort();
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      total: this.risks.length,
      byCategory: this.groupByCategory(),
      bySeverity: this.groupBySeverity(),
      byLikelihood: this.groupByLikelihood(),
    };
  }

  private groupByCategory() {
    const groups: Record<string, number> = {};
    this.risks.forEach((risk) => {
      risk.RiskCategory.split(';').forEach((cat) => {
        const category = cat.trim();
        groups[category] = (groups[category] || 0) + 1;
      });
    });
    return groups;
  }

  private groupBySeverity() {
    const groups: Record<string, number> = {};
    this.risks.forEach((risk) => {
      groups[risk.RiskSeverity] = (groups[risk.RiskSeverity] || 0) + 1;
    });
    return groups;
  }

  private groupByLikelihood() {
    const groups: Record<string, number> = {};
    this.risks.forEach((risk) => {
      groups[risk.Likelihood] = (groups[risk.Likelihood] || 0) + 1;
    });
    return groups;
  }
}

// Singleton instance
export const ibmRiskAtlasService = new IBMRiskAtlasService();
