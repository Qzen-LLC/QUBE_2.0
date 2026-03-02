import { BaseSpecialistAgent } from './BaseSpecialistAgent';
import { AgentResponse } from '../types';

/**
 * Security Expert Agent
 * Generates security guardrails based on data protection and security assessment data
 */
export class SecurityExpertAgent extends BaseSpecialistAgent {
  constructor() {
    super('SecurityExpertAgent', 'Security');
  }

  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    console.log('[Agent]: Analyzing (insights only - no template guardrails)...');
    
    const assessment = context.assessment;
    const securityAssessment = {
      ...assessment.dataReadiness,
      ...assessment.technicalFeasibility,
      governance: assessment.governance
    };
    
    // Build domain-specific prompt with actual assessment data
    const domainPrompt = this.buildSecurityPrompt(securityAssessment);
    
    // Generate guardrails using LLM
    const guardrails = await this.generateGuardrailsWithReasoning(
      securityAssessment,
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
    const insights = this.extractInsights(securityAssessment);
    
    // Identify concerns
    const concerns = this.identifyConcerns(securityAssessment);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(securityAssessment);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(securityAssessment);
    
    return {
      guardrails,
      insights,
      confidence,
      concerns,
      recommendations
    };
  }
  
  private buildSecurityPrompt(securityAssessment: any): string {
    const sections = [];
    
    // Data Types and Sensitivity
    if (securityAssessment.dataTypes?.length > 0) {
      sections.push(`Data Types: ${securityAssessment.dataTypes.join(', ')}`);
      
      const sensitiveTypes = securityAssessment.dataTypes.filter((type: string) => 
        ['PII/Personal Information', 'Financial Records', 'Health/Medical Records', 'Legal Documents'].includes(type)
      );
      if (sensitiveTypes.length > 0) {
        sections.push(`Sensitive Data Types: ${sensitiveTypes.join(', ')}`);
      }
    }
    
    // Data Storage and Security
    if (securityAssessment.dataStorage) {
      const storage = securityAssessment.dataStorage;
      sections.push(`Data Storage Security:`);
      if (storage.encryptionAtRest) sections.push(`- Encryption at Rest: ${storage.encryptionAtRest}`);
      if (storage.encryptionInTransit) sections.push(`- Encryption in Transit: ${storage.encryptionInTransit}`);
      if (storage.accessControls?.length > 0) {
        sections.push(`- Access Controls: ${storage.accessControls.join(', ')}`);
      }
      if (storage.backupSecurity) sections.push(`- Backup Security: ${storage.backupSecurity}`);
    }
    
    // Data Access and Privacy
    if (securityAssessment.dataAccess) {
      const access = securityAssessment.dataAccess;
      sections.push(`Data Access Controls:`);
      if (access.authenticationMethod) sections.push(`- Authentication: ${access.authenticationMethod}`);
      if (access.authorizationLevel) sections.push(`- Authorization Level: ${access.authorizationLevel}`);
      if (access.dataMinimization) sections.push(`- Data Minimization: ${access.dataMinimization}`);
      if (access.auditLogging) sections.push(`- Audit Logging: ${access.auditLogging}`);
    }
    
    // Deployment Security
    if (securityAssessment.deploymentModels?.length > 0) {
      sections.push(`Deployment Models: ${securityAssessment.deploymentModels.join(', ')}`);
      
      const secureDeployments = securityAssessment.deploymentModels.filter((model: string) =>
        ['On-premises', 'Private Cloud', 'Hybrid'].includes(model)
      );
      if (secureDeployments.length > 0) {
        sections.push(`Secure Deployment Options: ${secureDeployments.join(', ')}`);
      }
    }
    
    // Security Monitoring
    if (securityAssessment.monitoringTools?.length > 0) {
      const securityTools = securityAssessment.monitoringTools.filter((tool: string) =>
        tool.toLowerCase().includes('security') || tool.toLowerCase().includes('siem')
      );
      if (securityTools.length > 0) {
        sections.push(`Security Monitoring Tools: ${securityTools.join(', ')}`);
      }
    }
    
    // Governance and Compliance
    if (securityAssessment.governance) {
      const gov = securityAssessment.governance;
      sections.push(`Security Governance:`);
      if (gov.complianceFrameworks?.length > 0) {
        sections.push(`- Compliance Frameworks: ${gov.complianceFrameworks.join(', ')}`);
      }
      if (gov.dataRetentionPolicy) sections.push(`- Data Retention Policy: ${gov.dataRetentionPolicy}`);
      if (gov.incidentResponsePlan) sections.push(`- Incident Response Plan: ${gov.incidentResponsePlan}`);
    }
    
    return sections.join('\n');
  }

  protected extractInsights(securityAssessment: any): string[] {
    const insights = [];
    
    const sensitiveDataTypes = securityAssessment.dataTypes?.filter((type: string) => 
      ['PII/Personal Information', 'Financial Records', 'Health/Medical Records', 'Legal Documents'].includes(type)
    ) || [];
    
    if (sensitiveDataTypes.length > 0) {
      insights.push(`Sensitive data types detected (${sensitiveDataTypes.join(', ')}) - enhanced security controls required`);
    }
    
    if (securityAssessment.deploymentModels?.includes('Public Cloud')) {
      insights.push('Public cloud deployment requires additional security hardening and monitoring');
    }
    
    if (!securityAssessment.dataStorage?.encryptionAtRest || securityAssessment.dataStorage?.encryptionAtRest === 'No') {
      insights.push('Missing encryption at rest - critical security vulnerability');
    }
    
    if (!securityAssessment.dataAccess?.auditLogging || securityAssessment.dataAccess?.auditLogging === 'No') {
      insights.push('No audit logging - compliance and security monitoring gaps');
    }
    
    if (securityAssessment.governance?.complianceFrameworks?.length > 0) {
      insights.push(`Compliance requirements (${securityAssessment.governance.complianceFrameworks.join(', ')}) drive security architecture`);
    }
    
    return insights;
  }

  protected identifyConcerns(securityAssessment: any): string[] {
    const concerns = [];
    
    const sensitiveDataTypes = securityAssessment.dataTypes?.filter((type: string) => 
      ['PII/Personal Information', 'Financial Records', 'Health/Medical Records', 'Legal Documents'].includes(type)
    ) || [];
    
    if (sensitiveDataTypes.length > 0 && 
        (!securityAssessment.dataStorage?.encryptionAtRest || securityAssessment.dataStorage?.encryptionAtRest === 'No')) {
      concerns.push('Sensitive data without encryption at rest - regulatory violation risk');
    }
    
    if (securityAssessment.deploymentModels?.includes('Public Cloud') &&
        (!securityAssessment.dataStorage?.accessControls?.includes('Role-based access control'))) {
      concerns.push('Public cloud deployment without proper access controls');
    }
    
    if (!securityAssessment.governance?.incidentResponsePlan) {
      concerns.push('No incident response plan - delayed breach response risk');
    }
    
    if (securityAssessment.dataAccess?.authenticationMethod === 'Basic' && sensitiveDataTypes.length > 0) {
      concerns.push('Basic authentication with sensitive data - insufficient security');
    }
    
    if (!securityAssessment.monitoringTools?.some((tool: string) =>
        tool.toLowerCase().includes('security') || tool.toLowerCase().includes('siem'))) {
      concerns.push('No security monitoring tools - blind spots in threat detection');
    }
    
    return concerns;
  }

  protected generateRecommendations(securityAssessment: any): string[] {
    const recommendations = [];
    
    const sensitiveDataTypes = securityAssessment.dataTypes?.filter((type: string) => 
      ['PII/Personal Information', 'Financial Records', 'Health/Medical Records', 'Legal Documents'].includes(type)
    ) || [];
    
    if (sensitiveDataTypes.length > 0) {
      recommendations.push('Implement comprehensive data protection strategy with encryption and tokenization');
    }
    
    if (!securityAssessment.dataStorage?.encryptionAtRest || securityAssessment.dataStorage?.encryptionAtRest === 'No') {
      recommendations.push('Enable encryption at rest for all data storage systems');
    }
    
    if (!securityAssessment.dataAccess?.auditLogging || securityAssessment.dataAccess?.auditLogging === 'No') {
      recommendations.push('Implement comprehensive audit logging and SIEM integration');
    }
    
    if (securityAssessment.deploymentModels?.includes('Public Cloud')) {
      recommendations.push('Implement cloud security best practices and continuous compliance monitoring');
    }
    
    if (securityAssessment.dataAccess?.authenticationMethod === 'Basic') {
      recommendations.push('Upgrade to multi-factor authentication and modern identity management');
    }
    
    if (!securityAssessment.governance?.incidentResponsePlan) {
      recommendations.push('Develop and test incident response procedures for security breaches');
    }
    
    return recommendations;
  }

  private calculateConfidence(securityAssessment: any): number {
    let confidence = 0.5;
    
    // Increase confidence for well-defined security measures
    if (securityAssessment.dataStorage?.encryptionAtRest === 'Yes') confidence += 0.1;
    if (securityAssessment.dataStorage?.encryptionInTransit === 'Yes') confidence += 0.1;
    if (securityAssessment.dataAccess?.auditLogging === 'Yes') confidence += 0.1;
    if (securityAssessment.governance?.incidentResponsePlan) confidence += 0.1;
    if (securityAssessment.governance?.complianceFrameworks?.length > 0) confidence += 0.1;
    
    // Decrease confidence for security gaps
    const sensitiveDataTypes = securityAssessment.dataTypes?.filter((type: string) => 
      ['PII/Personal Information', 'Financial Records', 'Health/Medical Records', 'Legal Documents'].includes(type)
    ) || [];
    
    if (sensitiveDataTypes.length > 0 && !securityAssessment.dataStorage?.encryptionAtRest) confidence -= 0.2;
    if (securityAssessment.dataAccess?.authenticationMethod === 'Basic') confidence -= 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }
}