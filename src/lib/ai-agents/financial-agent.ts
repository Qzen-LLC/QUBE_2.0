import { prismaClient } from '@/utils/db';

export interface FinancialInsight {
  type: 'cost_optimization' | 'roi_improvement' | 'risk_alert' | 'opportunity' | 'trend_analysis';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendations: string[];
  metrics: Record<string, number>;
  priority: number;
}

export interface FinancialAnalysis {
  useCaseId: string;
  useCaseTitle?: string;
  insights: FinancialInsight[];
  summary: string;
  riskScore: number;
  opportunityScore: number;
  costOptimizationPotential: number;
  recommendations: string[];
}

export class FinancialAIAgent {
  private static instance: FinancialAIAgent;

  private constructor() {}

  public static getInstance(): FinancialAIAgent {
    if (!FinancialAIAgent.instance) {
      FinancialAIAgent.instance = new FinancialAIAgent();
    }
    return FinancialAIAgent.instance;
  }

  /**
   * Analyze financial data for a specific use case
   */
  async analyzeUseCase(useCaseId: string): Promise<FinancialAnalysis> {
    try {
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
        include: {
          finopsData: true,
          organization: true,
        },
      });

      if (!useCase || !useCase.finopsData) {
        throw new Error('Use case or financial data not found');
      }

      const insights = await this.generateInsights(useCase);
      const riskScore = this.calculateRiskScore(useCase.finopsData);
      const opportunityScore = this.calculateOpportunityScore(useCase.finopsData);
      const costOptimizationPotential = this.calculateCostOptimizationPotential(useCase.finopsData);

      return {
        useCaseId,
        useCaseTitle: useCase.title,
        insights,
        summary: this.generateSummary(insights, riskScore, opportunityScore),
        riskScore,
        opportunityScore,
        costOptimizationPotential,
        recommendations: this.generateRecommendations(insights),
      };
    } catch (error) {
      console.error('Error analyzing use case:', error);
      throw error;
    }
  }

  /**
   * Analyze all use cases for portfolio insights
   */
  async analyzePortfolio(organizationId?: string): Promise<{
    portfolioInsights: FinancialInsight[];
    topPerformers: string[];
    riskAlerts: string[];
    costOptimizationOpportunities: string[];
  }> {
    try {
      const whereClause = organizationId ? { organizationId } : {};
      
      const useCases = await prismaClient.useCase.findMany({
        where: whereClause,
        include: {
          finopsData: true,
        },
      });

      const portfolioInsights: FinancialInsight[] = [];
      const performanceMetrics: Array<{ useCaseId: string; roi: number; costEfficiency: number }> = [];

      for (const useCase of useCases) {
        if (useCase.finopsData) {
          const insights = await this.generateInsights(useCase);
          portfolioInsights.push(...insights);

          performanceMetrics.push({
            useCaseId: useCase.id,
            roi: useCase.finopsData.ROI,
            costEfficiency: useCase.finopsData.netValue / useCase.finopsData.totalInvestment,
          });
        }
      }

      // Sort by performance
      performanceMetrics.sort((a, b) => b.roi - a.roi);
      const topPerformers = performanceMetrics.slice(0, 5).map(p => p.useCaseId);

      // Identify risk alerts
      const riskAlerts = portfolioInsights
        .filter(insight => insight.type === 'risk_alert' && insight.impact === 'high')
        .map(insight => insight.title);

      // Identify cost optimization opportunities
      const costOptimizationOpportunities = portfolioInsights
        .filter(insight => insight.type === 'cost_optimization' && insight.impact === 'high')
        .map(insight => insight.title);

      return {
        portfolioInsights,
        topPerformers,
        riskAlerts,
        costOptimizationOpportunities,
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent insights based on financial data
   */
  private async generateInsights(useCase: any): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const finops = useCase.finopsData;

    // ROI Analysis
    if (finops.ROI < 1.5) {
      insights.push({
        type: 'roi_improvement',
        title: 'Low ROI Alert',
        description: `Current ROI of ${finops.ROI.toFixed(2)}x is below optimal threshold. Consider cost optimization or value enhancement strategies.`,
        impact: 'high',
        confidence: 0.85,
        recommendations: [
          'Review cost structure for optimization opportunities',
          'Assess value delivery mechanisms',
          'Consider scaling strategies to improve unit economics',
        ],
        metrics: { currentROI: finops.ROI, targetROI: 2.0 },
        priority: 1,
      });
    }

    // Cost Optimization Analysis
    const costStructure = {
      dev: finops.devCostBase / finops.totalInvestment,
      infra: finops.infraCostBase / finops.totalInvestment,
      op: finops.opCostBase / finops.totalInvestment,
      api: finops.apiCostBase / finops.totalInvestment,
    };

    const highCostAreas = Object.entries(costStructure)
      .filter(([_, percentage]) => percentage > 0.3)
      .map(([area, _]) => area);

    if (highCostAreas.length > 0) {
      insights.push({
        type: 'cost_optimization',
        title: 'High Cost Concentration',
        description: `High cost concentration in ${highCostAreas.join(', ')} areas. Consider optimization strategies.`,
        impact: 'medium',
        confidence: 0.78,
        recommendations: [
          'Implement cost monitoring and alerting',
          'Explore alternative solutions for high-cost areas',
          'Consider automation to reduce operational costs',
        ],
        metrics: costStructure,
        priority: 2,
      });
    }

    // Growth Rate Analysis
    if (finops.valueGrowthRate < 0.1) {
      insights.push({
        type: 'trend_analysis',
        title: 'Slow Value Growth',
        description: `Value growth rate of ${(finops.valueGrowthRate * 100).toFixed(1)}% indicates slow adoption or market penetration.`,
        impact: 'medium',
        confidence: 0.72,
        recommendations: [
          'Review go-to-market strategy',
          'Assess customer adoption barriers',
          'Consider partnership or expansion opportunities',
        ],
        metrics: { growthRate: finops.valueGrowthRate, targetRate: 0.15 },
        priority: 3,
      });
    }

    // Investment Efficiency
    const investmentEfficiency = finops.netValue / finops.totalInvestment;
    if (investmentEfficiency < 1.2) {
      insights.push({
        type: 'risk_alert',
        title: 'Investment Efficiency Risk',
        description: `Investment efficiency ratio of ${investmentEfficiency.toFixed(2)} indicates potential over-investment or under-delivery.`,
        impact: 'high',
        confidence: 0.81,
        recommendations: [
          'Review investment allocation strategy',
          'Assess delivery timeline and milestones',
          'Consider phasing investments based on value delivery',
        ],
        metrics: { efficiency: investmentEfficiency, target: 1.5 },
        priority: 1,
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Calculate risk score based on financial metrics
   */
  private calculateRiskScore(finops: any): number {
    let riskScore = 0;
    
    // ROI risk
    if (finops.ROI < 1.2) riskScore += 30;
    else if (finops.ROI < 1.5) riskScore += 15;
    
    // Investment efficiency risk
    const efficiency = finops.netValue / finops.totalInvestment;
    if (efficiency < 1.0) riskScore += 25;
    else if (efficiency < 1.2) riskScore += 10;
    
    // Cost structure risk
    const costConcentration = Math.max(
      finops.devCostBase / finops.totalInvestment,
      finops.infraCostBase / finops.totalInvestment,
      finops.opCostBase / finops.totalInvestment
    );
    if (costConcentration > 0.4) riskScore += 20;
    
    // Growth risk
    if (finops.valueGrowthRate < 0.05) riskScore += 15;
    
    return Math.min(riskScore, 100);
  }

  /**
   * Calculate opportunity score based on financial metrics
   */
  private calculateOpportunityScore(finops: any): number {
    let opportunityScore = 0;
    
    // ROI opportunity
    if (finops.ROI > 2.0) opportunityScore += 25;
    else if (finops.ROI > 1.5) opportunityScore += 15;
    
    // Growth opportunity
    if (finops.valueGrowthRate > 0.2) opportunityScore += 25;
    else if (finops.valueGrowthRate > 0.1) opportunityScore += 15;
    
    // Market opportunity (based on net value)
    if (finops.netValue > 1000000) opportunityScore += 25;
    else if (finops.netValue > 500000) opportunityScore += 15;
    
    // Cost optimization opportunity
    const costEfficiency = finops.netValue / finops.totalInvestment;
    if (costEfficiency > 2.0) opportunityScore += 25;
    else if (costEfficiency > 1.5) opportunityScore += 15;
    
    return Math.min(opportunityScore, 100);
  }

  /**
   * Calculate cost optimization potential
   */
  private calculateCostOptimizationPotential(finops: any): number {
    let potential = 0;
    
    // High cost areas
    const costAreas = [
      { cost: finops.devCostBase, name: 'Development' },
      { cost: finops.infraCostBase, name: 'Infrastructure' },
      { cost: finops.opCostBase, name: 'Operations' },
      { cost: finops.apiCostBase, name: 'API' },
    ];
    
    costAreas.forEach(area => {
      const percentage = area.cost / finops.totalInvestment;
      if (percentage > 0.3) potential += 25;
      else if (percentage > 0.2) potential += 15;
    });
    
    return Math.min(potential, 100);
  }

  /**
   * Generate summary based on insights and scores
   */
  private generateSummary(
    insights: FinancialInsight[],
    riskScore: number,
    opportunityScore: number
  ): string {
    const highPriorityInsights = insights.filter(i => i.priority <= 2);
    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    const opportunityLevel = opportunityScore > 70 ? 'high' : opportunityScore > 40 ? 'medium' : 'low';
    
    return `Financial analysis shows ${riskLevel} risk level and ${opportunityLevel} opportunity potential. ${highPriorityInsights.length} critical insights identified requiring immediate attention.`;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(insights: FinancialInsight[]): string[] {
    const recommendations = new Set<string>();
    
    insights.forEach(insight => {
      insight.recommendations.forEach(rec => recommendations.add(rec));
    });
    
    return Array.from(recommendations).slice(0, 5); // Top 5 unique recommendations
  }

  /**
   * Predict future financial performance
   */
  async predictPerformance(useCaseId: string, months: number = 12): Promise<{
    predictedROI: number;
    predictedNetValue: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
        include: { finopsData: true },
      });

      if (!useCase?.finopsData) {
        throw new Error('Financial data not found');
      }

      const finops = useCase.finopsData;
      
      // Simple linear projection based on current growth rate
      const growthFactor = Math.pow(1 + finops.valueGrowthRate, months / 12);
      const predictedNetValue = finops.netValue * growthFactor;
      const predictedROI = predictedNetValue / finops.totalInvestment;
      
      // Confidence based on data quality and growth consistency
      const confidence = Math.min(0.9, 0.5 + (finops.valueGrowthRate * 2));
      
      const factors = [
        `Current growth rate: ${(finops.valueGrowthRate * 100).toFixed(1)}%`,
        `Investment efficiency: ${(finops.netValue / finops.totalInvestment).toFixed(2)}`,
        `Market conditions: ${finops.valueGrowthRate > 0.15 ? 'Favorable' : 'Challenging'}`,
      ];

      return {
        predictedROI,
        predictedNetValue,
        confidence,
        factors,
      };
    } catch (error) {
      console.error('Error predicting performance:', error);
      throw error;
    }
  }
}
