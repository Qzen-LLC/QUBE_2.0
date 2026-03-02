import { FinancialAIAgent, FinancialAnalysis, FinancialInsight } from './financial-agent';
import { GovernanceAIAgent, GovernanceAnalysis, GovernanceInsight } from './governance-agent';

export interface CrossDomainInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  financialImpact: string;
  governanceImpact: string;
  recommendations: string[];
  priority: number;
  category: 'cost_governance' | 'risk_financial' | 'compliance_efficiency' | 'opportunity_optimization';
}

export interface UnifiedAnalysis {
  useCaseId: string;
  financialAnalysis: FinancialAnalysis;
  governanceAnalysis: GovernanceAnalysis;
  crossDomainInsights: CrossDomainInsight[];
  overallRiskScore: number;
  overallOpportunityScore: number;
  priorityActions: string[];
  summary: string;
}

export interface PortfolioInsights {
  financialInsights: FinancialInsight[];
  governanceInsights: GovernanceInsight[];
  crossDomainInsights: CrossDomainInsight[];
  topPerformers: string[];
  highRiskUseCases: string[];
  complianceGaps: string[];
  costOptimizationOpportunities: string[];
  recommendations: string[];
}

export class AIAgentManager {
  private static instance: AIAgentManager;
  private financialAgent: FinancialAIAgent;
  private governanceAgent: GovernanceAIAgent;

  private constructor() {
    this.financialAgent = FinancialAIAgent.getInstance();
    this.governanceAgent = GovernanceAIAgent.getInstance();
  }

  public static getInstance(): AIAgentManager {
    if (!AIAgentManager.instance) {
      AIAgentManager.instance = new AIAgentManager();
    }
    return AIAgentManager.instance;
  }

  /**
   * Perform comprehensive analysis across both financial and governance domains
   */
  async performUnifiedAnalysis(useCaseId: string): Promise<UnifiedAnalysis> {
    try {
      // Run both analyses in parallel
      const [financialAnalysis, governanceAnalysis] = await Promise.all([
        this.financialAgent.analyzeUseCase(useCaseId),
        this.governanceAgent.analyzeUseCase(useCaseId),
      ]);

      // Generate cross-domain insights
      const crossDomainInsights = this.generateCrossDomainInsights(
        financialAnalysis,
        governanceAnalysis
      );

      // Calculate unified scores
      const overallRiskScore = this.calculateUnifiedRiskScore(
        financialAnalysis.riskScore,
        governanceAnalysis.riskScore
      );

      const overallOpportunityScore = this.calculateUnifiedOpportunityScore(
        financialAnalysis.opportunityScore,
        governanceAnalysis.complianceScore
      );

      // Generate priority actions
      const priorityActions = this.generatePriorityActions(
        financialAnalysis,
        governanceAnalysis,
        crossDomainInsights
      );

      // Generate unified summary
      const summary = this.generateUnifiedSummary(
        financialAnalysis,
        governanceAnalysis,
        crossDomainInsights
      );

      return {
        useCaseId,
        financialAnalysis,
        governanceAnalysis,
        crossDomainInsights,
        overallRiskScore,
        overallOpportunityScore,
        priorityActions,
        summary,
      };
    } catch (error) {
      console.error('Error performing unified analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze portfolio across both domains
   */
  async analyzePortfolio(organizationId?: string): Promise<PortfolioInsights> {
    try {
      // Run both portfolio analyses in parallel
      const [financialPortfolio, governancePortfolio] = await Promise.all([
        this.financialAgent.analyzePortfolio(organizationId),
        this.governanceAgent.analyzePortfolio(organizationId),
      ]);

      // Generate cross-domain portfolio insights
      const crossDomainInsights = this.generatePortfolioCrossDomainInsights(
        financialPortfolio,
        governancePortfolio
      );

      // Identify high-risk use cases
      const highRiskUseCases = this.identifyHighRiskUseCases(
        financialPortfolio,
        governancePortfolio
      );

      // Generate unified recommendations
      const recommendations = this.generatePortfolioRecommendations(
        financialPortfolio,
        governancePortfolio,
        crossDomainInsights
      );

      return {
        financialInsights: financialPortfolio.portfolioInsights,
        governanceInsights: governancePortfolio.portfolioInsights,
        crossDomainInsights,
        topPerformers: financialPortfolio.topPerformers,
        highRiskUseCases,
        complianceGaps: governancePortfolio.criticalGaps,
        costOptimizationOpportunities: financialPortfolio.costOptimizationOpportunities,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  /**
   * Generate insights that span both financial and governance domains
   */
  private generateCrossDomainInsights(
    financialAnalysis: FinancialAnalysis,
    governanceAnalysis: GovernanceAnalysis
  ): CrossDomainInsight[] {
    const insights: CrossDomainInsight[] = [];

    // Cost-Governance Alignment
    if (financialAnalysis.costOptimizationPotential > 70 && governanceAnalysis.complianceScore < 0.7) {
      insights.push({
        id: `cross-${Date.now()}-1`,
        title: 'Cost Optimization vs Compliance Trade-off',
        description: 'High cost optimization potential exists but may impact compliance requirements. Need balanced approach.',
        impact: 'high',
        confidence: 0.82,
        financialImpact: 'High cost savings potential',
        governanceImpact: 'Risk of compliance gaps',
        recommendations: [
          'Assess compliance impact of cost optimization',
          'Develop balanced optimization strategy',
          'Monitor compliance metrics during optimization',
        ],
        priority: 1,
        category: 'cost_governance',
      });
    }

    // Risk-Financial Correlation
    if (financialAnalysis.riskScore > 60 && governanceAnalysis.riskScore > 60) {
      insights.push({
        id: `cross-${Date.now()}-2`,
        title: 'Dual Risk Exposure',
        description: 'Both financial and governance risks are elevated, indicating systemic issues requiring immediate attention.',
        impact: 'high',
        confidence: 0.88,
        financialImpact: 'High financial risk exposure',
        governanceImpact: 'High governance risk exposure',
        recommendations: [
          'Implement comprehensive risk mitigation strategy',
          'Establish cross-functional risk monitoring',
          'Develop emergency response procedures',
        ],
        priority: 1,
        category: 'risk_financial',
      });
    }

    // Compliance-Efficiency Balance
    if (governanceAnalysis.complianceScore > 0.8 && financialAnalysis.ROI < 1.5) {
      insights.push({
        id: `cross-${Date.now()}-3`,
        title: 'Over-Compliance Impact on ROI',
        description: 'High compliance achieved but at the cost of financial performance. Consider efficiency optimization.',
        impact: 'medium',
        confidence: 0.75,
        financialImpact: 'Suboptimal ROI due to compliance overhead',
        governanceImpact: 'Excellent compliance status',
        recommendations: [
          'Optimize compliance processes for efficiency',
          'Identify compliance cost reduction opportunities',
          'Balance compliance requirements with cost effectiveness',
        ],
        priority: 2,
        category: 'compliance_efficiency',
      });
    }

    // Opportunity-Optimization Synergy
    if (financialAnalysis.opportunityScore > 70 && governanceAnalysis.frameworkCoverage > 0.8) {
      insights.push({
        id: `cross-${Date.now()}-4`,
        title: 'High Opportunity with Strong Governance',
        description: 'Excellent opportunity for growth with solid governance foundation. Ready for expansion.',
        impact: 'low',
        confidence: 0.90,
        financialImpact: 'High growth opportunity',
        governanceImpact: 'Strong governance foundation',
        recommendations: [
          'Proceed with growth initiatives',
          'Leverage governance excellence for market advantage',
          'Consider governance certification for competitive edge',
        ],
        priority: 3,
        category: 'opportunity_optimization',
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate cross-domain insights for portfolio analysis
   */
  private generatePortfolioCrossDomainInsights(
    financialPortfolio: any,
    governancePortfolio: any
  ): CrossDomainInsight[] {
    const insights: CrossDomainInsight[] = [];

    // Portfolio-level insights
    if (financialPortfolio.riskAlerts.length > 0 && governancePortfolio.topRisks.length > 0) {
      insights.push({
        id: `portfolio-${Date.now()}-1`,
        title: 'Portfolio Risk Concentration',
        description: 'Multiple high-risk areas identified across financial and governance domains.',
        impact: 'high',
        confidence: 0.85,
        financialImpact: 'Financial risk alerts detected',
        governanceImpact: 'Governance risk alerts detected',
        recommendations: [
          'Implement portfolio-wide risk management',
          'Establish cross-domain risk monitoring',
          'Develop portfolio risk mitigation strategy',
        ],
        priority: 1,
        category: 'risk_financial',
      });
    }

    return insights;
  }

  /**
   * Calculate unified risk score combining both domains
   */
  private calculateUnifiedRiskScore(financialRisk: number, governanceRisk: number): number {
    // Weight financial and governance risks (can be adjusted based on business priorities)
    const financialWeight = 0.6;
    const governanceWeight = 0.4;
    
    return (financialRisk * financialWeight) + (governanceRisk * governanceWeight);
  }

  /**
   * Calculate unified opportunity score
   */
  private calculateUnifiedOpportunityScore(financialOpportunity: number, governanceCompliance: number): number {
    // Convert governance compliance to opportunity score (higher compliance = higher opportunity)
    const governanceOpportunity = governanceCompliance * 100;
    
    // Weight financial and governance opportunities
    const financialWeight = 0.7;
    const governanceWeight = 0.3;
    
    return (financialOpportunity * financialWeight) + (governanceOpportunity * governanceWeight);
  }

  /**
   * Generate priority actions based on unified analysis
   */
  private generatePriorityActions(
    financialAnalysis: FinancialAnalysis,
    governanceAnalysis: GovernanceAnalysis,
    crossDomainInsights: CrossDomainInsight[]
  ): string[] {
    const actions: string[] = [];

    // High priority actions based on risk scores
    if (financialAnalysis.riskScore > 70 || governanceAnalysis.riskScore > 70) {
      actions.push('Immediate risk mitigation required');
    }

    // Compliance actions
    if (governanceAnalysis.complianceScore < 0.7) {
      actions.push('Address critical compliance gaps');
    }

    // Financial optimization actions
    if (financialAnalysis.costOptimizationPotential > 70) {
      actions.push('Implement cost optimization strategies');
    }

    // Cross-domain actions
    const highPriorityCrossInsights = crossDomainInsights.filter(i => i.priority <= 2);
    highPriorityCrossInsights.forEach(insight => {
      insight.recommendations.slice(0, 2).forEach(rec => actions.push(rec));
    });

    return actions.slice(0, 5); // Top 5 priority actions
  }

  /**
   * Generate unified summary
   */
  private generateUnifiedSummary(
    financialAnalysis: FinancialAnalysis,
    governanceAnalysis: GovernanceAnalysis,
    crossDomainInsights: CrossDomainInsight[]
  ): string {
    const riskLevel = this.getRiskLevel(financialAnalysis.riskScore, governanceAnalysis.riskScore);
    const opportunityLevel = this.getOpportunityLevel(financialAnalysis.opportunityScore, governanceAnalysis.complianceScore);
    const crossDomainCount = crossDomainInsights.filter(i => i.priority <= 2).length;

    return `Unified analysis shows ${riskLevel} risk level and ${opportunityLevel} opportunity potential. ${crossDomainCount} cross-domain insights identified requiring coordinated action across financial and governance teams.`;
  }

  /**
   * Identify high-risk use cases across both domains
   */
  private identifyHighRiskUseCases(financialPortfolio: any, governancePortfolio: any): string[] {
    // This would require more detailed analysis of individual use cases
    // For now, return empty array
    return [];
  }

  /**
   * Generate portfolio recommendations
   */
  private generatePortfolioRecommendations(
    financialPortfolio: any,
    governancePortfolio: any,
    crossDomainInsights: CrossDomainInsight[]
  ): string[] {
    const recommendations: string[] = [];

    // Financial recommendations
    if (financialPortfolio.riskAlerts.length > 0) {
      recommendations.push('Implement portfolio-wide financial risk monitoring');
    }

    if (financialPortfolio.costOptimizationOpportunities.length > 0) {
      recommendations.push('Develop cost optimization program across portfolio');
    }

    // Governance recommendations
    if (governancePortfolio.criticalGaps.length > 0) {
      recommendations.push('Establish portfolio compliance improvement program');
    }

    // Cross-domain recommendations
    crossDomainInsights.forEach(insight => {
      insight.recommendations.slice(0, 1).forEach(rec => recommendations.push(rec));
    });

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Helper method to get risk level description
   */
  private getRiskLevel(financialRisk: number, governanceRisk: number): string {
    const avgRisk = (financialRisk + governanceRisk) / 2;
    if (avgRisk > 70) return 'high';
    if (avgRisk > 40) return 'medium';
    return 'low';
  }

  /**
   * Helper method to get opportunity level description
   */
  private getOpportunityLevel(financialOpportunity: number, governanceCompliance: number): string {
    const avgOpportunity = (financialOpportunity + (governanceCompliance * 100)) / 2;
    if (avgOpportunity > 70) return 'high';
    if (avgOpportunity > 40) return 'medium';
    return 'low';
  }

  /**
   * Get real-time alerts and notifications
   */
  async getRealTimeAlerts(organizationId?: string): Promise<{
    financialAlerts: FinancialInsight[];
    governanceAlerts: GovernanceInsight[];
    crossDomainAlerts: CrossDomainInsight[];
  }> {
    try {
      // This would integrate with real-time monitoring systems
      // For now, return empty arrays
      return {
        financialAlerts: [],
        governanceAlerts: [],
        crossDomainAlerts: [],
      };
    } catch (error) {
      console.error('Error getting real-time alerts:', error);
      throw error;
    }
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveReport(organizationId?: string): Promise<{
    summary: string;
    keyMetrics: Record<string, number>;
    topRisks: string[];
    topOpportunities: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    try {
      const portfolioInsights = await this.analyzePortfolio(organizationId);
      
      // Calculate key metrics
      const keyMetrics = {
        totalUseCases: portfolioInsights.financialInsights.length,
        highRiskCount: portfolioInsights.highRiskUseCases.length,
        complianceGaps: portfolioInsights.complianceGaps.length,
        costOptimizationPotential: portfolioInsights.costOptimizationOpportunities.length,
      };

      // Generate executive summary
      const summary = `Portfolio analysis reveals ${keyMetrics.highRiskCount} high-risk areas and ${keyMetrics.costOptimizationPotential} cost optimization opportunities. ${portfolioInsights.recommendations.length} strategic recommendations identified.`;

      return {
        summary,
        keyMetrics,
        topRisks: portfolioInsights.highRiskUseCases.slice(0, 3),
        topOpportunities: portfolioInsights.topPerformers.slice(0, 3),
        recommendations: portfolioInsights.recommendations.slice(0, 5),
        nextSteps: [
          'Review high-risk use cases',
          'Implement cost optimization program',
          'Address compliance gaps',
          'Establish portfolio monitoring dashboard',
        ],
      };
    } catch (error) {
      console.error('Error generating executive report:', error);
      throw error;
    }
  }
}
