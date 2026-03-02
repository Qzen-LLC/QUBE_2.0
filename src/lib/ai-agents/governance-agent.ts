import { prismaClient } from '@/utils/db';

export interface GovernanceInsight {
  type: 'compliance_alert' | 'risk_assessment' | 'framework_gap' | 'best_practice' | 'regulatory_update';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendations: string[];
  metrics: Record<string, any>;
  priority: number;
  framework?: string;
  regulation?: string;
}

export interface GovernanceAnalysis {
  useCaseId: string;
  insights: GovernanceInsight[];
  summary: string;
  complianceScore: number;
  riskScore: number;
  frameworkCoverage: number;
  recommendations: string[];
  nextSteps: string[];
}

export interface ComplianceStatus {
  framework: string;
  overallScore: number;
  requirements: {
    total: number;
    completed: number;
    pending: number;
    critical: number;
  };
  status: 'compliant' | 'partially_compliant' | 'non_compliant';
  gaps: string[];
  lastAssessment: string;
}

export class GovernanceAIAgent {
  private static instance: GovernanceAIAgent;

  private constructor() {}

  public static getInstance(): GovernanceAIAgent {
    if (!GovernanceAIAgent.instance) {
      GovernanceAIAgent.instance = new GovernanceAIAgent();
    }
    return GovernanceAIAgent.instance;
  }

  /**
   * Analyze governance data for a specific use case
   */
  async analyzeUseCase(useCaseId: string): Promise<GovernanceAnalysis> {
    try {
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
        include: {
          assessData: true,
          euAiActAssessments: true,
          iso42001Assessments: true,
          risks: true,
          organization: true,
        },
      });

      if (!useCase) {
        throw new Error('Use case not found');
      }

      const insights = await this.generateInsights(useCase);
      const complianceScore = this.calculateComplianceScore(useCase);
      const riskScore = this.calculateRiskScore(useCase);
      const frameworkCoverage = this.calculateFrameworkCoverage(useCase);

      return {
        useCaseId,
        insights,
        summary: this.generateSummary(insights, complianceScore, riskScore),
        complianceScore,
        riskScore,
        frameworkCoverage,
        recommendations: this.generateRecommendations(insights),
        nextSteps: this.generateNextSteps(insights, complianceScore, riskScore),
      };
    } catch (error) {
      console.error('Error analyzing use case governance:', error);
      throw error;
    }
  }

  /**
   * Analyze portfolio governance across all use cases
   */
  async analyzePortfolio(organizationId?: string): Promise<{
    portfolioInsights: GovernanceInsight[];
    complianceOverview: Record<string, number>;
    riskDistribution: Record<string, number>;
    criticalGaps: string[];
    topRisks: string[];
  }> {
    try {
      const whereClause = organizationId ? { organizationId } : {};
      
      const useCases = await prismaClient.useCase.findMany({
        where: whereClause,
        include: {
          assessData: true,
          euAiActAssessments: true,
          iso42001Assessments: true,
          risks: true,
        },
      });

      const portfolioInsights: GovernanceInsight[] = [];
      const complianceScores: Record<string, number[]> = {};
      const riskScores: Record<string, number[]> = {};

      for (const useCase of useCases) {
        const insights = await this.generateInsights(useCase);
        portfolioInsights.push(...insights);

        // Aggregate compliance scores by framework
        const complianceScore = this.calculateComplianceScore(useCase);
        if (complianceScore > 0) {
          if (!complianceScores['overall']) complianceScores['overall'] = [];
          complianceScores['overall'].push(complianceScore);
        }

        // Aggregate risk scores by category
        const riskScore = this.calculateRiskScore(useCase);
        if (riskScore > 0) {
          if (!riskScores['overall']) riskScores['overall'] = [];
          riskScores['overall'].push(riskScore);
        }
      }

      // Calculate averages
      const complianceOverview: Record<string, number> = {};
      Object.entries(complianceScores).forEach(([framework, scores]) => {
        complianceOverview[framework] = scores.reduce((a, b) => a + b, 0) / scores.length;
      });

      const riskDistribution: Record<string, number> = {};
      Object.entries(riskScores).forEach(([category, scores]) => {
        riskDistribution[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
      });

      // Identify critical gaps and top risks
      const criticalGaps = portfolioInsights
        .filter(insight => insight.type === 'framework_gap' && insight.impact === 'high')
        .map(insight => insight.title);

      const topRisks = portfolioInsights
        .filter(insight => insight.type === 'risk_assessment' && insight.impact === 'high')
        .map(insight => insight.title);

      return {
        portfolioInsights,
        complianceOverview,
        riskDistribution,
        criticalGaps,
        topRisks,
      };
    } catch (error) {
      console.error('Error analyzing portfolio governance:', error);
      throw error;
    }
  }

  /**
   * Get compliance status for specific frameworks
   */
  async getComplianceStatus(useCaseId: string): Promise<ComplianceStatus[]> {
    try {
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
        include: {
          euAiActAssessments: true,
          iso42001Assessments: true,
        },
      });

      if (!useCase) {
        throw new Error('Use case not found');
      }

      const complianceStatuses: ComplianceStatus[] = [];

      // EU AI Act Compliance
      if (useCase.euAiActAssessments) {
        const euAiActStatus = this.assessFrameworkCompliance(
          'EU AI Act',
          useCase.euAiActAssessments,
          'eu-ai-act'
        );
        complianceStatuses.push(euAiActStatus);
      }

      // ISO 42001 Compliance
      if (useCase.iso42001Assessments) {
        const iso42001Status = this.assessFrameworkCompliance(
          'ISO 42001',
          useCase.iso42001Assessments,
          'iso-42001'
        );
        complianceStatuses.push(iso42001Status);
      }

      return complianceStatuses;
    } catch (error) {
      console.error('Error getting compliance status:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent insights based on governance data
   */
  private async generateInsights(useCase: any): Promise<GovernanceInsight[]> {
    const insights: GovernanceInsight[] = [];

    // Compliance Analysis
    const complianceScore = this.calculateComplianceScore(useCase);
    if (complianceScore < 0.7) {
      insights.push({
        type: 'compliance_alert',
        title: 'Low Compliance Score',
        description: `Overall compliance score of ${(complianceScore * 100).toFixed(1)}% indicates significant gaps requiring immediate attention.`,
        impact: 'high',
        confidence: 0.88,
        recommendations: [
          'Conduct comprehensive framework assessment',
          'Prioritize critical compliance gaps',
          'Develop remediation timeline',
        ],
        metrics: { complianceScore, targetScore: 0.8 },
        priority: 1,
      });
    }

    // Risk Assessment
    if (useCase.risks && useCase.risks.length > 0) {
      const highRiskCount = useCase.risks.filter((risk: any) => 
        risk.riskLevel === 'high' || risk.riskLevel === 'critical'
      ).length;

      if (highRiskCount > 0) {
        insights.push({
          type: 'risk_assessment',
          title: 'High Risk Alert',
          description: `${highRiskCount} high/critical risks identified requiring immediate mitigation.`,
          impact: 'high',
          confidence: 0.85,
          recommendations: [
            'Implement risk mitigation strategies',
            'Establish risk monitoring dashboard',
            'Develop contingency plans',
          ],
          metrics: { highRiskCount, totalRisks: useCase.risks.length },
          priority: 1,
        });
      }
    }

    // Framework Gap Analysis
    const frameworkCoverage = this.calculateFrameworkCoverage(useCase);
    if (frameworkCoverage < 0.6) {
      insights.push({
        type: 'framework_gap',
        title: 'Incomplete Framework Coverage',
        description: `Framework coverage of ${(frameworkCoverage * 100).toFixed(1)}% indicates missing assessments or incomplete data.`,
        impact: 'medium',
        confidence: 0.78,
        recommendations: [
          'Complete missing framework assessments',
          'Validate assessment data quality',
          'Establish assessment completion tracking',
        ],
        metrics: { coverage: frameworkCoverage, targetCoverage: 0.8 },
        priority: 2,
      });
    }

    // Best Practice Recommendations
    if (complianceScore > 0.8 && frameworkCoverage > 0.8) {
      insights.push({
        type: 'best_practice',
        title: 'Excellence in Governance',
        description: 'Strong governance practices identified. Consider sharing best practices across organization.',
        impact: 'low',
        confidence: 0.92,
        recommendations: [
          'Document best practices',
          'Share governance insights',
          'Consider advanced compliance certifications',
        ],
        metrics: { complianceScore, frameworkCoverage },
        priority: 4,
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(useCase: any): number {
    let totalScore = 0;
    let frameworkCount = 0;

    // EU AI Act Score
    if (useCase.euAiActAssessments) {
      const euAiActScore = this.calculateFrameworkScore(useCase.euAiActAssessments, 'eu-ai-act');
      totalScore += euAiActScore;
      frameworkCount++;
    }

    // ISO 42001 Score
    if (useCase.iso42001Assessments) {
      const iso42001Score = this.calculateFrameworkScore(useCase.iso42001Assessments, 'iso-42001');
      totalScore += iso42001Score;
      frameworkCount++;
    }

    return frameworkCount > 0 ? totalScore / frameworkCount : 0;
  }

  /**
   * Calculate framework-specific compliance score
   */
  private calculateFrameworkScore(assessments: any, framework: string): number {
    if (!assessments) return 0;

    try {
      if (framework === 'eu-ai-act') {
        // Calculate EU AI Act compliance based on assessment data
        const totalRequirements = assessments.totalRequirements || 0;
        const completedRequirements = assessments.completedRequirements || 0;
        
        return totalRequirements > 0 ? completedRequirements / totalRequirements : 0;
      } else if (framework === 'iso-42001') {
        // Calculate ISO 42001 compliance based on assessment data
        const totalClauses = assessments.totalClauses || 0;
        const compliantClauses = assessments.compliantClauses || 0;
        
        return totalClauses > 0 ? compliantClauses / totalClauses : 0;
      }
    } catch (error) {
      console.error(`Error calculating ${framework} score:`, error);
    }

    return 0;
  }

  /**
   * Calculate risk score based on identified risks
   */
  private calculateRiskScore(useCase: any): number {
    if (!useCase.risks || useCase.risks.length === 0) {
      return 0;
    }

    let riskScore = 0;
    const riskWeights = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.2,
    };

    useCase.risks.forEach((risk: any) => {
      const weight = riskWeights[risk.riskLevel] || 0;
      riskScore += weight;
    });

    // Normalize to 0-100 scale
    return Math.min((riskScore / useCase.risks.length) * 100, 100);
  }

  /**
   * Calculate framework coverage percentage
   */
  private calculateFrameworkCoverage(useCase: any): number {
    let coveredFrameworks = 0;
    const totalFrameworks = 2; // EU AI Act + ISO 42001

    if (useCase.euAiActAssessments) coveredFrameworks++;
    if (useCase.iso42001Assessments) coveredFrameworks++;

    return coveredFrameworks / totalFrameworks;
  }

  /**
   * Assess framework compliance status
   */
  private assessFrameworkCompliance(
    frameworkName: string,
    assessments: any,
    frameworkType: string
  ): ComplianceStatus {
    let total = 0;
    let completed = 0;
    let critical = 0;

    if (frameworkType === 'eu-ai-act') {
      total = assessments.totalRequirements || 0;
      completed = assessments.completedRequirements || 0;
      critical = assessments.criticalRequirements || 0;
    } else if (frameworkType === 'iso-42001') {
      total = assessments.totalClauses || 0;
      completed = assessments.compliantClauses || 0;
      critical = assessments.criticalClauses || 0;
    }

    const overallScore = total > 0 ? completed / total : 0;
    
    let status: 'compliant' | 'partially_compliant' | 'non_compliant';
    if (overallScore >= 0.8) status = 'compliant';
    else if (overallScore >= 0.6) status = 'partially_compliant';
    else status = 'non_compliant';

    const gaps = this.identifyFrameworkGaps(assessments, frameworkType);

    return {
      framework: frameworkName,
      overallScore,
      requirements: { total, completed, pending: total - completed, critical },
      status,
      gaps,
      lastAssessment: assessments.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Identify specific gaps in framework compliance
   */
  private identifyFrameworkGaps(assessments: any, frameworkType: string): string[] {
    const gaps: string[] = [];

    try {
      if (frameworkType === 'eu-ai-act') {
        // Identify EU AI Act specific gaps
        if (assessments.missingRequirements) {
          gaps.push(...assessments.missingRequirements);
        }
      } else if (frameworkType === 'iso-42001') {
        // Identify ISO 42001 specific gaps
        if (assessments.nonCompliantClauses) {
          gaps.push(...assessments.nonCompliantClauses);
        }
      }
    } catch (error) {
      console.error(`Error identifying gaps for ${frameworkType}:`, error);
    }

    return gaps.slice(0, 5); // Limit to top 5 gaps
  }

  /**
   * Generate summary based on insights and scores
   */
  private generateSummary(
    insights: GovernanceInsight[],
    complianceScore: number,
    riskScore: number
  ): string {
    const highPriorityInsights = insights.filter(i => i.priority <= 2);
    const complianceLevel = complianceScore > 0.8 ? 'high' : complianceScore > 0.6 ? 'medium' : 'low';
    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    
    return `Governance analysis shows ${complianceLevel} compliance level and ${riskLevel} risk level. ${highPriorityInsights.length} critical insights identified requiring immediate attention.`;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(insights: GovernanceInsight[]): string[] {
    const recommendations = new Set<string>();
    
    insights.forEach(insight => {
      insight.recommendations.forEach(rec => recommendations.add(rec));
    });
    
    return Array.from(recommendations).slice(0, 5); // Top 5 unique recommendations
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(
    insights: GovernanceInsight[],
    complianceScore: number,
    riskScore: number
  ): string[] {
    const nextSteps: string[] = [];

    if (complianceScore < 0.7) {
      nextSteps.push('Schedule comprehensive compliance review');
      nextSteps.push('Prioritize critical framework gaps');
    }

    if (riskScore > 60) {
      nextSteps.push('Implement immediate risk mitigation measures');
      nextSteps.push('Establish risk monitoring dashboard');
    }

    if (insights.some(i => i.type === 'framework_gap')) {
      nextSteps.push('Complete missing framework assessments');
      nextSteps.push('Validate assessment data quality');
    }

    if (nextSteps.length === 0) {
      nextSteps.push('Continue monitoring governance metrics');
      nextSteps.push('Schedule next quarterly review');
    }

    return nextSteps.slice(0, 4); // Top 4 next steps
  }

  /**
   * Monitor regulatory updates and compliance changes
   */
  async monitorRegulatoryUpdates(): Promise<GovernanceInsight[]> {
    // This would integrate with external regulatory monitoring services
    // For now, return mock insights
    return [
      {
        type: 'regulatory_update',
        title: 'EU AI Act Implementation Update',
        description: 'New guidance on high-risk AI system classification released.',
        impact: 'medium',
        confidence: 0.9,
        recommendations: [
          'Review AI system classification',
          'Update risk assessment procedures',
          'Monitor implementation timeline',
        ],
        metrics: { updateType: 'guidance', urgency: 'medium' },
        priority: 2,
        regulation: 'EU AI Act',
      },
    ];
  }
}
