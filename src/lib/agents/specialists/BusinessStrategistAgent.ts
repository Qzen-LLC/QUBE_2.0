import { BaseSpecialistAgent } from './BaseSpecialistAgent';
import { AgentResponse } from '../types';

/**
 * Business Strategist Agent
 * Generates business guardrails based on business feasibility assessment data
 */
export class BusinessStrategistAgent extends BaseSpecialistAgent {
  constructor() {
    super('BusinessStrategistAgent', 'Business Strategy');
  }

  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    console.log('[Agent]: Analyzing (insights only - no template guardrails)...');
    
    const assessment = context.assessment;
    const businessAssessment = assessment.businessFeasibility || {};
    
    // Build domain-specific prompt with actual assessment data
    const domainPrompt = this.buildBusinessPrompt(businessAssessment);
    
    // Generate guardrails using LLM
    const guardrails = await this.generateGuardrailsWithReasoning(
      businessAssessment,
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
    const insights = this.extractInsights(businessAssessment);
    
    // Identify concerns
    const concerns = this.identifyConcerns(businessAssessment);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(businessAssessment);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(businessAssessment);
    
    return {
      guardrails,
      insights,
      confidence,
      concerns,
      recommendations
    };
  }
  
  private buildBusinessPrompt(businessAssessment: any): string {
    const sections = [];
    
    // System Criticality and Impact
    if (businessAssessment.systemCriticality) {
      sections.push(`System Criticality: ${businessAssessment.systemCriticality}`);
    }
    
    if (businessAssessment.failureImpact) {
      sections.push(`Failure Impact: ${businessAssessment.failureImpact}`);
    }
    
    // User Demographics and Scale
    if (businessAssessment.userCategories?.length > 0) {
      sections.push(`User Categories: ${businessAssessment.userCategories.join(', ')}`);
    }
    
    if (businessAssessment.userVolumeSize) {
      sections.push(`Expected User Volume: ${businessAssessment.userVolumeSize}`);
    }
    
    if (businessAssessment.geographicScope?.length > 0) {
      sections.push(`Geographic Scope: ${businessAssessment.geographicScope.join(', ')}`);
    }
    
    // Business Value and ROI
    if (businessAssessment.expectedBusinessValue) {
      sections.push(`Expected Business Value: ${businessAssessment.expectedBusinessValue}`);
    }
    
    if (businessAssessment.roiTimeframe) {
      sections.push(`ROI Timeframe: ${businessAssessment.roiTimeframe}`);
    }
    
    if (businessAssessment.businessDrivers?.length > 0) {
      sections.push(`Business Drivers: ${businessAssessment.businessDrivers.join(', ')}`);
    }
    
    // Performance and Quality Requirements
    if (businessAssessment.performanceExpectations) {
      sections.push(`Performance Expectations: ${businessAssessment.performanceExpectations}`);
    }
    
    if (businessAssessment.qualityThresholds) {
      sections.push(`Quality Thresholds: ${businessAssessment.qualityThresholds}`);
    }
    
    if (businessAssessment.maxHallucinationRate !== undefined) {
      sections.push(`Maximum Acceptable Hallucination Rate: ${businessAssessment.maxHallucinationRate}%`);
    }
    
    // Regulatory and Compliance
    if (businessAssessment.regulatoryRequirements?.length > 0) {
      sections.push(`Regulatory Requirements: ${businessAssessment.regulatoryRequirements.join(', ')}`);
    }
    
    if (businessAssessment.complianceStandards?.length > 0) {
      sections.push(`Compliance Standards: ${businessAssessment.complianceStandards.join(', ')}`);
    }
    
    // Stakeholder Management
    if (businessAssessment.keyStakeholders?.length > 0) {
      sections.push(`Key Stakeholders: ${businessAssessment.keyStakeholders.join(', ')}`);
    }
    
    if (businessAssessment.stakeholderConcerns?.length > 0) {
      sections.push(`Stakeholder Concerns: ${businessAssessment.stakeholderConcerns.join(', ')}`);
    }
    
    // Change Management
    if (businessAssessment.changeManagementPlan) {
      sections.push(`Change Management Plan: ${businessAssessment.changeManagementPlan}`);
    }
    
    if (businessAssessment.userTrainingRequirements) {
      sections.push(`User Training Requirements: ${businessAssessment.userTrainingRequirements}`);
    }
    
    return sections.join('\n');
  }

  protected extractInsights(businessAssessment: any): string[] {
    const insights = [];
    
    if (businessAssessment.systemCriticality === 'Mission Critical') {
      insights.push('Mission-critical system requires comprehensive business continuity planning');
    }
    
    if (businessAssessment.failureImpact === 'Catastrophic/Life Safety') {
      insights.push('Life safety implications demand highest level of reliability and human oversight');
    }
    
    if (businessAssessment.userCategories?.includes('General Public')) {
      insights.push('Public-facing system requires enhanced transparency and accountability measures');
    }
    
    if (businessAssessment.userVolumeSize === 'Very Large (>1M users)') {
      insights.push('Massive scale deployment requires robust scalability and performance monitoring');
    }
    
    if (businessAssessment.geographicScope?.includes('Global')) {
      insights.push('Global deployment requires multi-regional compliance and cultural considerations');
    }
    
    if (businessAssessment.maxHallucinationRate !== undefined && businessAssessment.maxHallucinationRate < 1) {
      insights.push(`Ultra-low hallucination tolerance (${businessAssessment.maxHallucinationRate}%) requires advanced validation mechanisms`);
    }
    
    return insights;
  }

  protected identifyConcerns(businessAssessment: any): string[] {
    const concerns = [];
    
    if (businessAssessment.systemCriticality === 'Mission Critical' && 
        (!businessAssessment.businessDrivers || businessAssessment.businessDrivers.length === 0)) {
      concerns.push('Mission-critical system without clearly defined business drivers');
    }
    
    if (businessAssessment.failureImpact === 'Catastrophic/Life Safety' &&
        (!businessAssessment.qualityThresholds || businessAssessment.qualityThresholds === 'Standard')) {
      concerns.push('Life safety system with insufficient quality thresholds');
    }
    
    if (businessAssessment.userVolumeSize === 'Very Large (>1M users)' &&
        businessAssessment.performanceExpectations === 'Standard') {
      concerns.push('Large-scale system with standard performance expectations may cause user dissatisfaction');
    }
    
    if (businessAssessment.regulatoryRequirements?.length > 0 &&
        !businessAssessment.complianceStandards?.length) {
      concerns.push('Regulatory requirements identified without corresponding compliance standards');
    }
    
    if (businessAssessment.userCategories?.includes('Minors/Children') &&
        !businessAssessment.regulatoryRequirements?.some(req => req.includes('Child') || req.includes('COPPA'))) {
      concerns.push('System serving minors without child protection regulatory compliance');
    }
    
    if (!businessAssessment.changeManagementPlan && businessAssessment.userVolumeSize !== 'Small') {
      concerns.push('No change management plan for significant user base');
    }
    
    return concerns;
  }

  protected generateRecommendations(businessAssessment: any): string[] {
    const recommendations = [];
    
    if (businessAssessment.systemCriticality === 'Mission Critical') {
      recommendations.push('Implement comprehensive business continuity and disaster recovery planning');
    }
    
    if (businessAssessment.userVolumeSize === 'Very Large (>1M users)') {
      recommendations.push('Design for massive scale with auto-scaling and performance optimization');
    }
    
    if (businessAssessment.geographicScope?.includes('Global')) {
      recommendations.push('Develop region-specific compliance and localization strategies');
    }
    
    if (!businessAssessment.changeManagementPlan) {
      recommendations.push('Create comprehensive change management and user adoption strategy');
    }
    
    if (businessAssessment.roiTimeframe === 'Long-term (>2 years)') {
      recommendations.push('Establish interim milestones and value demonstration points');
    }
    
    if (businessAssessment.stakeholderConcerns?.length > 0) {
      recommendations.push('Develop targeted stakeholder communication and concern mitigation plans');
    }
    
    if (businessAssessment.maxHallucinationRate !== undefined && businessAssessment.maxHallucinationRate < 5) {
      recommendations.push('Implement multi-layer validation and human verification processes');
    }
    
    return recommendations;
  }

  private calculateConfidence(businessAssessment: any): number {
    let confidence = 0.5;
    
    // Increase confidence for well-defined business requirements
    if (businessAssessment.systemCriticality) confidence += 0.1;
    if (businessAssessment.businessDrivers?.length > 0) confidence += 0.1;
    if (businessAssessment.expectedBusinessValue) confidence += 0.1;
    if (businessAssessment.performanceExpectations) confidence += 0.1;
    if (businessAssessment.stakeholderConcerns !== undefined) confidence += 0.1;
    
    // Decrease confidence for high-risk scenarios
    if (businessAssessment.failureImpact === 'Catastrophic/Life Safety') confidence -= 0.1;
    if (businessAssessment.userVolumeSize === 'Very Large (>1M users)' && !businessAssessment.changeManagementPlan) confidence -= 0.1;
    if (businessAssessment.regulatoryRequirements?.length > 0 && !businessAssessment.complianceStandards?.length) confidence -= 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }
}