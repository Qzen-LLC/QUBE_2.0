import { BaseSpecialistAgent } from './BaseSpecialistAgent';
import { AgentResponse } from '../types';

/**
 * Risk Analyst Agent
 * Generates risk guardrails based on risk assessment data
 */
export class RiskAnalystAgent extends BaseSpecialistAgent {
  constructor() {
    super('RiskAnalystAgent', 'Risk Management');
  }

  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    console.log(`🤖 ${this.agentName}: Starting autonomous analysis...`);

    const assessment = context.assessment;
    const riskAssessment = assessment.riskAssessment || {};

    // Build domain-specific prompt with actual assessment data
    const domainPrompt = this.buildRiskPrompt(riskAssessment);

    // Generate guardrails using AUTONOMOUS REASONING (new method)
    const guardrails = await this.generateGuardrailsWithReasoning(
      riskAssessment,
      {
        useCaseTitle: assessment.useCaseTitle || 'AI System',
        problemStatement: assessment.problemStatement || '',
        proposedSolution: assessment.proposedSolution || '',
        keyBenefits: assessment.keyBenefits || '',
        successCriteria: assessment.successCriteria || '',
        keyAssumptions: assessment.keyAssumptions || '',
        multiDimensionalScoring: {
          confidenceLevel: assessment.confidenceLevel || 0,
          operationalImpact: assessment.operationalImpact || 0,
          productivityImpact: assessment.productivityImpact || 0,
          revenueImpact: assessment.revenueImpact || 0,
          implementationComplexity: assessment.implementationComplexity || 0
        }
      },
      domainPrompt
    );
    
    // Extract insights
    const insights = this.extractInsights(riskAssessment);
    
    // Identify concerns
    const concerns = this.identifyConcerns(riskAssessment);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskAssessment);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(riskAssessment);
    
    return {
      guardrails,
      insights,
      confidence,
      concerns,
      recommendations
    };
  }
  
  private buildRiskPrompt(riskAssessment: any): string {
    const sections = [];
    
    // Risk Categories
    if (riskAssessment.riskCategories?.length > 0) {
      sections.push(`Risk Categories Identified: ${riskAssessment.riskCategories.join(', ')}`);
    }
    
    // Technical Risk Factors
    if (riskAssessment.technicalRisks) {
      const techRisk = riskAssessment.technicalRisks;
      sections.push(`Technical Risk Assessment:`);
      if (techRisk.complexityLevel) sections.push(`- System Complexity: ${techRisk.complexityLevel}`);
      if (techRisk.scalabilityRisks?.length > 0) {
        sections.push(`- Scalability Risks: ${techRisk.scalabilityRisks.join(', ')}`);
      }
      if (techRisk.integrationRisks?.length > 0) {
        sections.push(`- Integration Risks: ${techRisk.integrationRisks.join(', ')}`);
      }
      if (techRisk.dependencyRisks?.length > 0) {
        sections.push(`- Dependency Risks: ${techRisk.dependencyRisks.join(', ')}`);
      }
    }
    
    // Operational Risk Factors
    if (riskAssessment.operationalRisks) {
      const opRisk = riskAssessment.operationalRisks;
      sections.push(`Operational Risk Assessment:`);
      if (opRisk.performanceRisks?.length > 0) {
        sections.push(`- Performance Risks: ${opRisk.performanceRisks.join(', ')}`);
      }
      if (opRisk.availabilityRisks?.length > 0) {
        sections.push(`- Availability Risks: ${opRisk.availabilityRisks.join(', ')}`);
      }
      if (opRisk.maintenanceRisks?.length > 0) {
        sections.push(`- Maintenance Risks: ${opRisk.maintenanceRisks.join(', ')}`);
      }
    }
    
    // Business Risk Factors
    if (riskAssessment.businessRisks) {
      const bizRisk = riskAssessment.businessRisks;
      sections.push(`Business Risk Assessment:`);
      if (bizRisk.strategicRisks?.length > 0) {
        sections.push(`- Strategic Risks: ${bizRisk.strategicRisks.join(', ')}`);
      }
      if (bizRisk.financialRisks?.length > 0) {
        sections.push(`- Financial Risks: ${bizRisk.financialRisks.join(', ')}`);
      }
      if (bizRisk.reputationalRisks?.length > 0) {
        sections.push(`- Reputational Risks: ${bizRisk.reputationalRisks.join(', ')}`);
      }
    }
    
    // Risk Mitigation Strategies
    if (riskAssessment.mitigationStrategies?.length > 0) {
      sections.push(`Current Mitigation Strategies: ${riskAssessment.mitigationStrategies.join(', ')}`);
    }
    
    // Risk Monitoring Plans
    if (riskAssessment.monitoringPlans?.length > 0) {
      sections.push(`Risk Monitoring Plans: ${riskAssessment.monitoringPlans.join(', ')}`);
    }
    
    // Overall Risk Level
    if (riskAssessment.overallRiskLevel) {
      sections.push(`Overall Risk Level: ${riskAssessment.overallRiskLevel}`);
    }
    
    return sections.join('\n');
  }

  protected extractInsights(riskAssessment: any): string[] {
    const insights = [];
    
    if (riskAssessment.overallRiskLevel === 'High' || riskAssessment.overallRiskLevel === 'Critical') {
      insights.push(`High overall risk level (${riskAssessment.overallRiskLevel}) requires comprehensive risk mitigation`);
    }
    
    if (riskAssessment.technicalRisks?.scalabilityRisks?.length > 0) {
      insights.push(`Scalability risks identified: ${riskAssessment.technicalRisks.scalabilityRisks.join(', ')}`);
    }
    
    if (riskAssessment.operationalRisks?.performanceRisks?.length > 0) {
      insights.push(`Performance risks detected - implement comprehensive monitoring`);
    }
    
    if (riskAssessment.businessRisks?.reputationalRisks?.length > 0) {
      insights.push(`Reputational risks require stakeholder communication strategy`);
    }
    
    if (riskAssessment.technicalRisks?.dependencyRisks?.length > 0) {
      insights.push(`External dependency risks require fallback strategies`);
    }
    
    return insights;
  }

  protected identifyConcerns(riskAssessment: any): string[] {
    const concerns = [];

    if (!riskAssessment.mitigationStrategies || riskAssessment.mitigationStrategies.length === 0) {
      concerns.push('No risk mitigation strategies defined');
    }

    if (riskAssessment.overallRiskLevel === 'Critical' && 
        (!riskAssessment.monitoringPlans || riskAssessment.monitoringPlans.length === 0)) {
      concerns.push('Critical risk level without monitoring plans');
    }

    if (riskAssessment.technicalRisks?.dependencyRisks?.includes('Third-party service failures') &&
        !riskAssessment.technicalRisks?.fallbackStrategies) {
      concerns.push('Third-party dependency risks without fallback strategies');
    }

    if (riskAssessment.businessRisks?.financialRisks?.includes('Cost overruns') &&
        !riskAssessment.businessRisks?.budgetControls) {
      concerns.push('Financial risk exposure without budget controls');
    }

    if (riskAssessment.technicalRisks?.complexityLevel === 'Very High' &&
        !riskAssessment.technicalRisks?.complexityMitigation) {
      concerns.push('Very high complexity without specific mitigation measures');
    }

    return concerns;
  }

  protected generateRecommendations(riskAssessment: any): string[] {
    const recommendations = [];

    if (riskAssessment.overallRiskLevel === 'High' || riskAssessment.overallRiskLevel === 'Critical') {
      recommendations.push('Implement comprehensive risk monitoring dashboard');
    }

    if (riskAssessment.technicalRisks?.scalabilityRisks?.length > 0) {
      recommendations.push('Develop scalability testing and capacity planning strategy');
    }

    if (!riskAssessment.mitigationStrategies || riskAssessment.mitigationStrategies.length === 0) {
      recommendations.push('Develop specific risk mitigation strategies for identified risks');
    }

    if (riskAssessment.operationalRisks?.availabilityRisks?.length > 0) {
      recommendations.push('Implement high availability architecture with redundancy');
    }

    if (riskAssessment.businessRisks?.strategicRisks?.length > 0) {
      recommendations.push('Conduct regular strategic risk review with stakeholders');
    }

    if (riskAssessment.technicalRisks?.integrationRisks?.length > 0) {
      recommendations.push('Design robust integration patterns with circuit breakers');
    }

    return recommendations;
  }

  private calculateConfidence(riskAssessment: any): number {
    let confidence = 0.5;

    // Increase confidence for well-defined risk assessments
    if (riskAssessment.riskCategories?.length > 0) confidence += 0.1;
    if (riskAssessment.overallRiskLevel) confidence += 0.1;
    if (riskAssessment.mitigationStrategies?.length > 0) confidence += 0.1;
    if (riskAssessment.monitoringPlans?.length > 0) confidence += 0.1;
    if (riskAssessment.technicalRisks && riskAssessment.operationalRisks && riskAssessment.businessRisks) confidence += 0.1;

    // Decrease confidence for high-risk scenarios without mitigation
    if (riskAssessment.overallRiskLevel === 'Critical' && !riskAssessment.mitigationStrategies?.length) confidence -= 0.2;
    if (riskAssessment.technicalRisks?.dependencyRisks?.length > 3) confidence -= 0.1;

    return Math.max(0, Math.min(1, confidence));
  }
}