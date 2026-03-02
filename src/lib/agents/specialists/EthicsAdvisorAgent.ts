import { BaseSpecialistAgent } from './BaseSpecialistAgent';
import { AgentResponse } from '../types';

/**
 * Ethics Analyst Agent
 * Generates ethical guardrails based on ethical impact assessment data
 */
export class EthicsAnalystAgent extends BaseSpecialistAgent {
  constructor() {
    super('EthicsAnalystAgent', 'Ethics');
  }

  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    console.log('[Agent]: Analyzing (insights only - no template guardrails)...');
    
    const assessment = context.assessment;
    const ethicsAssessment = assessment.ethicalImpact || {};
    
    // Build domain-specific prompt with actual assessment data
    const domainPrompt = this.buildEthicsPrompt(ethicsAssessment);
    
    // Generate guardrails using LLM
    const guardrails = await this.generateGuardrailsWithReasoning(
      ethicsAssessment,
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
    const insights = this.extractInsights(ethicsAssessment);
    
    // Identify concerns
    const concerns = this.identifyConcerns(ethicsAssessment);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(ethicsAssessment);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(ethicsAssessment);
    
    return {
      guardrails,
      insights,
      confidence,
      concerns,
      recommendations
    };
  }
  
  private buildEthicsPrompt(ethicsAssessment: any): string {
    const sections = [];
    
    // Bias and Fairness
    if (ethicsAssessment.biasFairness) {
      const bias = ethicsAssessment.biasFairness;
      sections.push(`Bias & Fairness Analysis:`);
      if (bias.historicalBias) sections.push(`- Historical bias identified: Yes`);
      if (bias.demographicGaps) sections.push(`- Demographic gaps present: Yes`);
      if (bias.selectionBias) sections.push(`- Selection bias detected: Yes`);
      if (bias.mitigationStrategies?.length > 0) {
        sections.push(`- Mitigation strategies: ${bias.mitigationStrategies.join(', ')}`);
      }
    }
    
    // Model Characteristics
    if (ethicsAssessment.modelCharacteristics) {
      const model = ethicsAssessment.modelCharacteristics;
      sections.push(`Model Ethics Characteristics:`);
      if (model.explainabilityLevel) sections.push(`- Explainability Level: ${model.explainabilityLevel}`);
      if (model.biasTesting) sections.push(`- Bias Testing: ${model.biasTesting}`);
      if (model.fairnessMetrics?.length > 0) {
        sections.push(`- Fairness Metrics: ${model.fairnessMetrics.join(', ')}`);
      }
    }
    
    // Decision Making Impact
    if (ethicsAssessment.decisionMaking) {
      const decision = ethicsAssessment.decisionMaking;
      sections.push(`Decision Making Impact:`);
      if (decision.automationLevel) sections.push(`- Automation Level: ${decision.automationLevel}`);
      if (decision.decisionTypes?.length > 0) {
        sections.push(`- Decision Types: ${decision.decisionTypes.join(', ')}`);
      }
      if (decision.impactLevel) sections.push(`- Impact Level: ${decision.impactLevel}`);
    }
    
    // Ethical Considerations
    if (ethicsAssessment.ethicalConsiderations) {
      const ethical = ethicsAssessment.ethicalConsiderations;
      sections.push(`Ethical Considerations:`);
      if (ethical.vulnerablePopulations?.length > 0) {
        sections.push(`- Vulnerable Populations: ${ethical.vulnerablePopulations.join(', ')}`);
      }
      if (ethical.ethicalFramework) sections.push(`- Ethical Framework: ${ethical.ethicalFramework}`);
      if (ethical.stakeholderEngagement) sections.push(`- Stakeholder Engagement: ${ethical.stakeholderEngagement}`);
    }
    
    // AI Governance
    if (ethicsAssessment.aiGovernance) {
      const governance = ethicsAssessment.aiGovernance;
      sections.push(`AI Governance:`);
      if (governance.humanOversightLevel) sections.push(`- Human Oversight Level: ${governance.humanOversightLevel}`);
      if (governance.performanceMonitoring?.length > 0) {
        sections.push(`- Performance Monitoring: ${governance.performanceMonitoring.join(', ')}`);
      }
      if (governance.auditFrequency) sections.push(`- Audit Frequency: ${governance.auditFrequency}`);
    }
    
    return sections.join('\\n');
  }

  protected extractInsights(ethicsAssessment: any): string[] {
    const insights = [];
    
    if (ethicsAssessment.biasFairness?.historicalBias) {
      insights.push('Historical bias detected - implement comprehensive bias monitoring');
    }
    
    if (ethicsAssessment.modelCharacteristics?.explainabilityLevel === 'black-box') {
      insights.push('Black-box model requires additional interpretability measures');
    }
    
    if (ethicsAssessment.decisionMaking?.automationLevel === 'Fully Automated') {
      insights.push('Fully automated decisions require human oversight protocols');
    }
    
    if (ethicsAssessment.ethicalConsiderations?.vulnerablePopulations?.length > 0) {
      insights.push(`Vulnerable populations identified: ${ethicsAssessment.ethicalConsiderations.vulnerablePopulations.join(', ')}`);
    }
    
    if (ethicsAssessment.aiGovernance?.humanOversightLevel === 'fully-autonomous') {
      insights.push('Autonomous operation requires enhanced ethical safeguards');
    }
    
    return insights;
  }

  protected identifyConcerns(ethicsAssessment: any): string[] {
    const concerns = [];

    if (!ethicsAssessment.modelCharacteristics?.biasTesting ||
        ethicsAssessment.modelCharacteristics.biasTesting === 'No Testing Planned') {
      concerns.push('No bias testing planned - ethical risks unmitigated');
    }

    if (ethicsAssessment.modelCharacteristics?.explainabilityLevel === 'black-box') {
      concerns.push('Black-box model lacks transparency for ethical decision-making');
    }

    if (ethicsAssessment.decisionMaking?.automationLevel === 'Fully Automated' &&
        !ethicsAssessment.aiGovernance?.humanOversightLevel) {
      concerns.push('Fully automated decisions without human oversight');
    }

    if (ethicsAssessment.ethicalConsiderations?.vulnerablePopulations?.length > 0 &&
        !ethicsAssessment.ethicalConsiderations?.stakeholderEngagement) {
      concerns.push('Vulnerable populations affected without stakeholder engagement');
    }

    return concerns;
  }

  protected generateRecommendations(ethicsAssessment: any): string[] {
    const recommendations = [];

    if (!ethicsAssessment.aiGovernance?.performanceMonitoring?.includes('fairness')) {
      recommendations.push('Add fairness metrics to performance monitoring');
    }

    if (ethicsAssessment.modelCharacteristics?.explainabilityLevel === 'black-box') {
      recommendations.push('Implement interpretability tools and model explanations');
    }

    if (ethicsAssessment.biasFairness?.historicalBias && 
        !ethicsAssessment.biasFairness?.mitigationStrategies?.length) {
      recommendations.push('Develop comprehensive bias mitigation strategy');
    }

    if (ethicsAssessment.ethicalConsiderations?.vulnerablePopulations?.length > 0) {
      recommendations.push('Establish specialized review board for vulnerable population impact');
    }

    if (!ethicsAssessment.aiGovernance?.auditFrequency) {
      recommendations.push('Implement regular ethical auditing schedule');
    }

    return recommendations;
  }

  private calculateConfidence(ethicsAssessment: any): number {
    let confidence = 0.5;

    // Increase confidence for well-defined ethical specs
    if (ethicsAssessment.modelCharacteristics?.biasTesting) confidence += 0.1;
    if (ethicsAssessment.aiGovernance?.humanOversightLevel) confidence += 0.1;
    if (ethicsAssessment.ethicalConsiderations) confidence += 0.1;
    if (ethicsAssessment.biasFairness?.mitigationStrategies?.length > 0) confidence += 0.1;
    if (ethicsAssessment.aiGovernance?.auditFrequency) confidence += 0.1;

    // Decrease confidence for high-risk scenarios
    if (ethicsAssessment.decisionMaking?.automationLevel === 'Fully Automated') confidence -= 0.1;
    if (ethicsAssessment.modelCharacteristics?.explainabilityLevel === 'black-box') confidence -= 0.1;

    return Math.max(0, Math.min(1, confidence));
  }
}