import { BaseSpecialistAgent } from './BaseSpecialistAgent';
import { AgentResponse } from '../types';

/**
 * Technical Optimizer Agent
 * Generates technical guardrails based on technical feasibility assessment
 */
export class TechnicalOptimizerAgent extends BaseSpecialistAgent {
  constructor() {
    super('TechnicalOptimizerAgent', 'Technical');
  }

  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    console.log('[Agent]: Analyzing (insights only - no template guardrails)...');
    
    const assessment = context.assessment;
    const techAssessment = assessment.technicalFeasibility || {};
    
    // Build domain-specific prompt with actual assessment data
    const domainPrompt = this.buildTechnicalPrompt(techAssessment);
    
    // Generate guardrails using LLM
    const guardrails = await this.generateGuardrailsWithReasoning(
      techAssessment,
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
    const insights = this.extractInsights(techAssessment);
    
    // Identify concerns
    const concerns = this.identifyConcerns(techAssessment);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(techAssessment);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(techAssessment);
    
    return {
      guardrails,
      insights,
      confidence,
      concerns,
      recommendations
    };
  }
  
  private buildTechnicalPrompt(techAssessment: any): string {
    const sections = [];
    
    // Model Configuration
    if (techAssessment.modelTypes?.length > 0) {
      sections.push(`Model Types: ${techAssessment.modelTypes.join(', ')}`);
    }
    if (techAssessment.modelProvider) {
      sections.push(`Model Provider: ${techAssessment.modelProvider}`);
    }
    if (techAssessment.modelSize) {
      sections.push(`Model Size: ${techAssessment.modelSize}`);
    }
    
    // Deployment Architecture
    if (techAssessment.deploymentModels?.length > 0) {
      sections.push(`Deployment Models: ${techAssessment.deploymentModels.join(', ')}`);
    }
    if (techAssessment.scalingRequirements) {
      sections.push(`Scaling Requirements: ${techAssessment.scalingRequirements}`);
    }
    
    // Technical Complexity
    if (techAssessment.technicalComplexity) {
      sections.push(`Technical Complexity: ${techAssessment.technicalComplexity}/10`);
    }
    
    // Integration Points
    if (techAssessment.integrationPoints?.length > 0) {
      sections.push(`Integration Points: ${techAssessment.integrationPoints.join(', ')}`);
    }
    
    // Performance Requirements
    if (techAssessment.latencyRequirements) {
      sections.push(`Latency Requirements: ${techAssessment.latencyRequirements}`);
    }
    if (techAssessment.throughputRequirements) {
      sections.push(`Throughput Requirements: ${techAssessment.throughputRequirements}`);
    }
    
    // RAG Configuration
    if (techAssessment.ragArchitecture) {
      sections.push(`RAG Architecture: ${techAssessment.ragArchitecture}`);
      if (techAssessment.vectorDatabase) {
        sections.push(`Vector Database: ${techAssessment.vectorDatabase}`);
      }
      if (techAssessment.embeddingModel) {
        sections.push(`Embedding Model: ${techAssessment.embeddingModel}`);
      }
    }
    
    // Agent Architecture
    if (techAssessment.agentArchitecture) {
      sections.push(`Agent Architecture: ${techAssessment.agentArchitecture}`);
      if (techAssessment.agentTools?.length > 0) {
        sections.push(`Agent Tools: ${techAssessment.agentTools.join(', ')}`);
      }
    }
    
    // Fallback and Redundancy
    if (techAssessment.fallbackModels?.length > 0) {
      sections.push(`Fallback Models: ${techAssessment.fallbackModels.join(', ')}`);
    }
    if (techAssessment.redundancyStrategy) {
      sections.push(`Redundancy Strategy: ${techAssessment.redundancyStrategy}`);
    }
    
    // Monitoring and Observability
    if (techAssessment.monitoringTools?.length > 0) {
      sections.push(`Monitoring Tools: ${techAssessment.monitoringTools.join(', ')}`);
    }
    if (techAssessment.loggingStrategy) {
      sections.push(`Logging Strategy: ${techAssessment.loggingStrategy}`);
    }
    
    return sections.join('\\n');
  }
  
  protected extractInsights(techAssessment: any): string[] {
    const insights = [];
    
    if (techAssessment.modelTypes?.includes('Large Language Model (LLM)')) {
      insights.push('LLM deployment requires token optimization and response caching strategies');
    }
    
    if (techAssessment.technicalComplexity > 7) {
      insights.push(`High technical complexity (${techAssessment.technicalComplexity}/10) requires comprehensive monitoring`);
    }
    
    if (techAssessment.ragArchitecture) {
      insights.push('RAG architecture requires vector database optimization and retrieval quality monitoring');
    }
    
    if (techAssessment.agentArchitecture === 'Multi-agent collaborative') {
      insights.push('Multi-agent system requires inter-agent communication protocols and orchestration');
    }
    
    if (!techAssessment.fallbackModels || techAssessment.fallbackModels.length === 0) {
      insights.push('No fallback models configured - single point of failure risk');
    }
    
    if (techAssessment.deploymentModels?.includes('Edge')) {
      insights.push('Edge deployment requires model optimization and size constraints');
    }
    
    return insights;
  }
  
  protected identifyConcerns(techAssessment: any): string[] {
    const concerns = [];
    
    if (!techAssessment.fallbackModels || techAssessment.fallbackModels.length === 0) {
      concerns.push('No fallback models specified - system vulnerable to model failures');
    }
    
    if (techAssessment.technicalComplexity > 8) {
      concerns.push('Very high complexity may lead to maintenance and debugging challenges');
    }
    
    if (!techAssessment.monitoringTools || techAssessment.monitoringTools.length === 0) {
      concerns.push('No monitoring tools specified - difficult to track system health');
    }
    
    if (techAssessment.integrationPoints?.length > 5) {
      concerns.push(`${techAssessment.integrationPoints.length} integration points create multiple failure risks`);
    }
    
    if (!techAssessment.redundancyStrategy) {
      concerns.push('No redundancy strategy defined for high availability');
    }
    
    return concerns;
  }
  
  protected generateRecommendations(techAssessment: any): string[] {
    const recommendations = [];
    
    if (!techAssessment.fallbackModels || techAssessment.fallbackModels.length === 0) {
      recommendations.push('Implement fallback models for resilience');
    }
    
    if (techAssessment.modelTypes?.includes('Large Language Model (LLM)') && !techAssessment.cachingStrategy) {
      recommendations.push('Implement semantic caching to reduce API costs');
    }
    
    if (techAssessment.technicalComplexity > 7) {
      recommendations.push('Implement comprehensive observability with distributed tracing');
    }
    
    if (techAssessment.ragArchitecture && !techAssessment.retrievalOptimization) {
      recommendations.push('Optimize retrieval with hybrid search and re-ranking');
    }
    
    if (techAssessment.deploymentModels?.includes('Multi-region')) {
      recommendations.push('Implement geo-distributed load balancing and data replication');
    }
    
    return recommendations;
  }
  
  private calculateConfidence(techAssessment: any): number {
    let confidence = 0.5;
    
    // Increase confidence for well-defined technical specs
    if (techAssessment.modelTypes?.length > 0) confidence += 0.1;
    if (techAssessment.modelProvider) confidence += 0.1;
    if (techAssessment.deploymentModels?.length > 0) confidence += 0.1;
    if (techAssessment.fallbackModels?.length > 0) confidence += 0.1;
    if (techAssessment.monitoringTools?.length > 0) confidence += 0.1;
    
    // Decrease confidence for high complexity
    if (techAssessment.technicalComplexity > 8) confidence -= 0.1;
    if (techAssessment.integrationPoints?.length > 5) confidence -= 0.05;
    
    return Math.max(0, Math.min(1, confidence));
  }
}