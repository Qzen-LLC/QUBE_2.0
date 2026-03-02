/**
 * MIT AI Risk Repository Integration Service
 * Loads and filters risks from MIT's 611 curated AI risks
 */

import type { ExternalRisk } from './types';
import mitRisks from '../../../docs/MITAIRISKDB.json';

export interface MITRiskFilter {
  category?: string;
  severity?: string;
  likelihood?: string;
  search?: string;
  domain?: string;
}

export class MITRiskRepoService {
  private risks: ExternalRisk[];

  constructor() {
    // Transform MIT risks to standard format
    this.risks = (mitRisks as any[]).map((risk) => ({
      Id: risk.Id,
      Summary: risk.Summary,
      Description: risk.Description,
      RiskCategory: risk['Risk Category'],
      RiskSeverity: risk['Risk Severity'] as any,
      Likelihood: risk.Likelihood as any,
      source: 'mit' as const,
      metadata: {
        originalCategory: risk['Risk Category'],
        fullDescription: risk.Description,
      },
    }));
  }

  /**
   * Get all MIT risks
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
  filterRisks(filter: MITRiskFilter): ExternalRisk[] {
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
    ethicalConcerns?: string[];
    useCaseCategory?: string;
  }): ExternalRisk[] {
    const recommendations: ExternalRisk[] = [];

    // Societal-Scale Harm Scenarios (IDs 1-6)
    if (characteristics.ethicalConcerns && characteristics.ethicalConcerns.length > 0) {
      recommendations.push(...this.risks.filter((r) => r.Id >= 1 && r.Id <= 6));
    }

    // Misinformation Harms (IDs 7-58) - relevant for GenAI
    if (characteristics.isGenAI) {
      const misinfoRisks = this.risks.filter((r) => r.Id >= 7 && r.Id <= 58);
      // Select top risks by severity
      recommendations.push(
        ...misinfoRisks
          .filter((r) => r.RiskSeverity === 'Major' || r.RiskSeverity === 'Catastrophic')
          .slice(0, 10)
      );
    }

    // Malicious Use (IDs 59-188)
    const maliciousUseRisks = this.risks.filter((r) => r.Id >= 59 && r.Id <= 188);
    recommendations.push(...maliciousUseRisks.slice(0, 8));

    // Privacy Harms (IDs 189-246)
    if (characteristics.dataTypes && characteristics.dataTypes.length > 0) {
      const hasSensitiveData = characteristics.dataTypes.some((dt) =>
        ['PII', 'personal', 'sensitive', 'health', 'financial'].some((keyword) =>
          dt.toLowerCase().includes(keyword)
        )
      );

      if (hasSensitiveData) {
        recommendations.push(...this.risks.filter((r) => r.Id >= 189 && r.Id <= 246).slice(0, 10));
      }
    }

    // Discrimination & Toxicity (IDs 247-311) - important for all AI
    recommendations.push(...this.risks.filter((r) => r.Id >= 247 && r.Id <= 311).slice(0, 8));

    // Multi-Agent Risks (IDs 500-530) - for Agentic AI
    if (characteristics.isAgenticAI) {
      recommendations.push(...this.risks.filter((r) => r.Id >= 500 && r.Id <= 530));
    }

    // Hallucination Risks (IDs 531-572) - for GenAI
    if (characteristics.isGenAI) {
      recommendations.push(...this.risks.filter((r) => r.Id >= 531 && r.Id <= 572).slice(0, 8));
    }

    // Remove duplicates
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map((r) => [r.Id, r])).values()
    );

    // Sort by severity
    return uniqueRecommendations.sort((a, b) => {
      const severityOrder = {
        Catastrophic: 5,
        Major: 4,
        Moderate: 3,
        Minor: 2,
        Negligible: 1,
      };
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

  /**
   * Search risks by keywords with relevance scoring
   */
  searchRisks(query: string, limit: number = 20): ExternalRisk[] {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter((k) => k.length > 2);

    const scoredRisks = this.risks.map((risk) => {
      let score = 0;
      const summaryLower = risk.Summary.toLowerCase();
      const descLower = risk.Description.toLowerCase();

      keywords.forEach((keyword) => {
        if (summaryLower.includes(keyword)) score += 3;
        if (descLower.includes(keyword)) score += 1;
        if (risk.RiskCategory.toLowerCase().includes(keyword)) score += 2;
      });

      return { risk, score };
    });

    return scoredRisks
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.risk);
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
export const mitRiskRepoService = new MITRiskRepoService();
