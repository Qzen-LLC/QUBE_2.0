import { BaseSpecialistAgent } from './BaseSpecialistAgent';
import { 
  AgentResponse, 
  ComprehensiveAssessment, 
  Guardrail,
  RegulatoryMapping 
} from '../types';

/**
 * Compliance Expert Agent
 * Specializes in regulatory compliance, legal requirements, and governance frameworks
 * Deep knowledge of EU AI Act, ISO 42001, GDPR, and sector-specific regulations
 */
export class ComplianceExpertAgent extends BaseSpecialistAgent {
  private readonly agentId = 'compliance-expert';
  private readonly expertise = ['EU-AI-Act', 'ISO-42001', 'GDPR', 'sector-regulations'];

  constructor() {
    super('ComplianceExpertAgent', 'Compliance');
  }

  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    console.log('[Agent]: Analyzing (insights only - no template guardrails)...');

    const assessment = context.assessment;
    const regulatoryContext = context.regulatoryContext;

    // Perform regulatory analysis
    const euAIActAnalysis = this.analyzeEUAIActCompliance(assessment);
    const gdprAnalysis = this.analyzeGDPRCompliance(assessment);
    const iso42001Analysis = this.analyzeISO42001Compliance(assessment);
    const sectorSpecificAnalysis = this.analyzeSectorSpecificCompliance(assessment);
    const jurisdictionalAnalysis = this.analyzeJurisdictionalRequirements(assessment);

    // Build domain-specific prompt with actual assessment data
    const domainPrompt = this.buildCompliancePrompt(
      assessment,
      euAIActAnalysis,
      gdprAnalysis,
      iso42001Analysis,
      sectorSpecificAnalysis,
      jurisdictionalAnalysis
    );
    
    // Generate guardrails using LLM
    const guardrails = await this.generateGuardrailsWithReasoning(
      {
        riskAssessment: assessment.riskAssessment,
        euAIActAnalysis,
        gdprAnalysis,
        iso42001Analysis,
        sectorSpecificAnalysis,
        jurisdictionalAnalysis
      },
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








    // Generate insights
    const insights = this.generateComplianceInsights(
      euAIActAnalysis,
      gdprAnalysis,
      iso42001Analysis,
      sectorSpecificAnalysis,
      jurisdictionalAnalysis
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(assessment, guardrails);

    return {
      guardrails,
      insights,
      confidence,
      concerns: this.identifyComplianceConcerns(assessment, regulatoryContext),
      recommendations: this.generateComplianceRecommendations(assessment, guardrails)
    };
  }

  private analyzeEUAIActCompliance(assessment: ComprehensiveAssessment) {
    let classification: 'prohibited' | 'high-risk' | 'limited-risk' | 'minimal-risk' = 'minimal-risk';
    const reasons = [];
    let conformityAssessmentType = 'self-assessment';

    // Check for prohibited uses
    if (this.isProhibitedSystem(assessment)) {
      classification = 'prohibited';
      reasons.push('System falls under prohibited AI practices');
    }
    // Check for high-risk uses
    else if (this.isHighRiskSystem(assessment)) {
      classification = 'high-risk';
      reasons.push(...this.getHighRiskReasons(assessment));
      conformityAssessmentType = this.determineConformityAssessment(assessment);
    }
    // Check for limited-risk uses
    else if (this.isLimitedRiskSystem(assessment)) {
      classification = 'limited-risk';
      reasons.push('System involves direct interaction with individuals');
    }

    return {
      applicable: true,
      classification,
      reasons,
      conformityAssessmentType,
      requirements: this.getEUAIActRequirements(classification)
    };
  }

  private isProhibitedSystem(assessment: ComprehensiveAssessment): boolean {
    // Check for prohibited AI practices under EU AI Act Article 5
    const prohibitedPractices = [
      'subliminal manipulation',
      'exploitation of vulnerabilities',
      'social scoring',
      'real-time biometric identification in public spaces'
    ];

    // Simplified check - would need more sophisticated analysis in production
    return false; // Assuming no prohibited uses for now
  }

  private isHighRiskSystem(assessment: ComprehensiveAssessment): boolean {
    // EU AI Act Annex III high-risk categories
    const highRiskCategories = {
      biometric: assessment.dataReadiness?.dataTypes?.includes('Biometric Data'),
      criticalInfrastructure: assessment.businessFeasibility?.systemCriticality === 'Mission Critical',
      education: assessment.businessFeasibility?.userCategories?.includes('Students'),
      employment: assessment.businessFeasibility?.stakeholderGroups?.includes('HR'),
      essentialServices: ['Healthcare', 'Finance', 'Legal'].some(s => 
        assessment.riskAssessment?.sectorSpecific?.toString().includes(s)
      ),
      lawEnforcement: false, // Would need specific check
      migration: false, // Would need specific check
      justice: assessment.riskAssessment?.sectorSpecific?.toString().includes('Legal')
    };

    return Object.values(highRiskCategories).some(v => v === true);
  }

  private getHighRiskReasons(assessment: ComprehensiveAssessment): string[] {
    const reasons = [];

    if (assessment.dataReadiness?.dataTypes?.includes('Biometric Data')) {
      reasons.push('Biometric identification system');
    }
    if (assessment.businessFeasibility?.systemCriticality === 'Mission Critical') {
      reasons.push('Critical infrastructure management');
    }
    if (assessment.businessFeasibility?.userCategories?.includes('Students')) {
      reasons.push('Education and vocational training');
    }
    if (assessment.businessFeasibility?.stakeholderGroups?.includes('HR')) {
      reasons.push('Employment and worker management');
    }

    return reasons;
  }

  private isLimitedRiskSystem(assessment: ComprehensiveAssessment): boolean {
    return assessment.technicalFeasibility?.modelTypes?.includes('Generative AI') ||
           assessment.technicalFeasibility?.modelTypes?.includes('Large Language Model (LLM)');
  }

  private determineConformityAssessment(assessment: ComprehensiveAssessment): string {
    // Simplified logic - in reality would depend on specific use case
    if (assessment.dataReadiness?.dataTypes?.includes('Biometric Data')) {
      return 'third-party-assessment';
    }
    return 'self-assessment-with-standards';
  }

  private getEUAIActRequirements(classification: string): string[] {
    const requirementsMap = {
      'prohibited': ['System must not be deployed'],
      'high-risk': [
        'Risk management system',
        'Data governance',
        'Technical documentation',
        'Record-keeping',
        'Transparency and user information',
        'Human oversight',
        'Accuracy, robustness, and cybersecurity'
      ],
      'limited-risk': [
        'Transparency obligations',
        'Inform users they are interacting with AI'
      ],
      'minimal-risk': [
        'Voluntary codes of conduct recommended'
      ]
    };

    return requirementsMap[classification] || [];
  }

  private analyzeGDPRCompliance(assessment: ComprehensiveAssessment) {
    const hasPersonalData = assessment.dataReadiness?.dataTypes?.some(type => 
      type.includes('Personal') || type.includes('PII') || type.includes('Medical') || type.includes('Financial')
    );

    const hasEUData = assessment.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)') ||
                      assessment.dataReadiness?.dataSubjectLocations?.includes('EU');

    return {
      applicable: hasPersonalData && hasEUData,
      dataCategories: assessment.dataReadiness?.dataTypes || [],
      lawfulBasis: this.determineLawfulBasis(assessment),
      purposes: this.identifyProcessingPurposes(assessment),
      requiresPseudonymization: this.requiresPseudonymization(assessment)
    };
  }

  private determineLawfulBasis(assessment: ComprehensiveAssessment): string {
    // Simplified determination - would need more context in production
    if (assessment.businessFeasibility?.userCategories?.includes('Employees')) {
      return 'legitimate_interest';
    }
    if (assessment.businessFeasibility?.userCategories?.includes('Customers')) {
      return 'contract';
    }
    return 'consent';
  }

  private identifyProcessingPurposes(assessment: ComprehensiveAssessment): string[] {
    const purposes = [];
    
    if (assessment.businessFeasibility?.genAIUseCase) {
      purposes.push(assessment.businessFeasibility.genAIUseCase);
    }
    if (assessment.businessFeasibility?.revenueImpactType?.length > 0) {
      purposes.push(...assessment.businessFeasibility.revenueImpactType);
    }

    return purposes;
  }

  private requiresPseudonymization(assessment: ComprehensiveAssessment): boolean {
    const sensitiveData = ['Health/Medical Records', 'Financial Records', 'Biometric Data'];
    return assessment.dataReadiness?.dataTypes?.some(type => 
      sensitiveData.includes(type)
    ) || false;
  }

  private analyzeISO42001Compliance(assessment: ComprehensiveAssessment) {
    // Check if organization has indicated need for ISO 42001
    const needsISO = assessment.organizationPolicies?.complianceFrameworks?.includes('ISO 42001');

    return {
      applicable: needsISO || assessment.technicalFeasibility?.modelTypes?.length > 0,
      maturityLevel: this.assessAIMaturity(assessment),
      gaps: this.identifyISO42001Gaps(assessment)
    };
  }

  private assessAIMaturity(assessment: ComprehensiveAssessment): string {
    if (assessment.roadmapPosition?.currentAIMaturity) {
      return assessment.roadmapPosition.currentAIMaturity;
    }
    return 'Basic ML Models'; // Default
  }

  private identifyISO42001Gaps(assessment: ComprehensiveAssessment): string[] {
    const gaps = [];

    if (!assessment.ethicalImpact?.aiGovernance?.performanceMonitoring) {
      gaps.push('Performance monitoring not defined');
    }
    if (!assessment.riskAssessment?.technicalRisks || assessment.riskAssessment.technicalRisks.length === 0) {
      gaps.push('Risk assessment incomplete');
    }

    return gaps;
  }

  private analyzeSectorSpecificCompliance(assessment: ComprehensiveAssessment) {
    return {
      healthcare: assessment.dataReadiness?.dataTypes?.includes('Health/Medical Records'),
      financial: assessment.dataReadiness?.dataTypes?.includes('Financial Records'),
      sox: assessment.riskAssessment?.sectorSpecific?.toString().includes('SOX'),
      pciDss: assessment.riskAssessment?.sectorSpecific?.toString().includes('PCI'),
      hipaa: assessment.riskAssessment?.sectorSpecific?.toString().includes('HIPAA')
    };
  }

  private analyzeJurisdictionalRequirements(assessment: ComprehensiveAssessment) {
    const jurisdictions = assessment.riskAssessment?.dataProtection?.jurisdictions || [];
    const crossBorder = assessment.dataReadiness?.crossBorderTransfer || false;

    return {
      jurisdictions,
      crossBorderTransfers: crossBorder,
      transferMechanisms: this.determineTransferMechanisms(jurisdictions, crossBorder),
      localizationRequirements: this.determineLocalizationRequirements(jurisdictions),
      consentNeeded: crossBorder,
      notificationNeeded: jurisdictions.length > 2
    };
  }

  private determineTransferMechanisms(jurisdictions: string[], crossBorder: boolean): string[] {
    if (!crossBorder) return [];

    const mechanisms = [];
    if (jurisdictions.includes('GDPR (EU)')) {
      mechanisms.push('Standard Contractual Clauses', 'Adequacy Decision');
    }
    return mechanisms;
  }

  private determineLocalizationRequirements(jurisdictions: string[]): Record<string, string> {
    const requirements: Record<string, string> = {};

    if (jurisdictions.includes('China')) {
      requirements['China'] = 'Critical data must be stored locally';
    }
    if (jurisdictions.includes('Russia')) {
      requirements['Russia'] = 'Personal data of Russian citizens must be stored locally';
    }

    return requirements;
  }

  private buildCompliancePrompt(
    assessment: ComprehensiveAssessment,
    euAIActAnalysis: any,
    gdprAnalysis: any,
    iso42001Analysis: any,
    sectorSpecificAnalysis: any,
    jurisdictionalAnalysis: any
  ): string {
    const sections = [];
    
    // Risk Assessment
    if (assessment.riskAssessment) {
      const risk = assessment.riskAssessment;
      if (risk.technicalRisks?.length > 0) {
        const techRisks = risk.technicalRisks.map((r: any) => r.risk).filter(Boolean);
        if (techRisks.length > 0) {
          sections.push(`Technical Risks: ${techRisks.join(', ')}`);
        }
      }
      if (risk.businessRisks?.length > 0) {
        const bizRisks = risk.businessRisks.map((r: any) => r.risk).filter(Boolean);
        if (bizRisks.length > 0) {
          sections.push(`Business Risks: ${bizRisks.join(', ')}`);
        }
      }
      if (risk.dataProtection) {
        sections.push(`Data Protection Requirements: ${JSON.stringify(risk.dataProtection)}`);
      }
      if (risk.sectorSpecific) {
        sections.push(`Sector-Specific Requirements: ${risk.sectorSpecific}`);
      }
    }
    
    // EU AI Act Analysis
    sections.push(`\nEU AI Act Classification: ${euAIActAnalysis.classification}`);
    if (euAIActAnalysis.reasons.length > 0) {
      sections.push(`Classification Reasons: ${euAIActAnalysis.reasons.join(', ')}`);
    }
    sections.push(`Conformity Assessment Type: ${euAIActAnalysis.conformityAssessmentType}`);
    
    // GDPR Analysis
    if (gdprAnalysis.applicable) {
      sections.push(`\nGDPR Applicable: Yes`);
      sections.push(`Data Categories: ${gdprAnalysis.dataCategories.join(', ')}`);
      sections.push(`Lawful Basis: ${gdprAnalysis.lawfulBasis}`);
      sections.push(`Processing Purposes: ${gdprAnalysis.purposes.join(', ')}`);
      sections.push(`Requires Pseudonymization: ${gdprAnalysis.requiresPseudonymization ? 'Yes' : 'No'}`);
    }
    
    // ISO 42001 Analysis
    if (iso42001Analysis.applicable) {
      sections.push(`\nISO 42001 Applicable: Yes`);
      sections.push(`AI Maturity Level: ${iso42001Analysis.maturityLevel}`);
      if (iso42001Analysis.gaps.length > 0) {
        sections.push(`Compliance Gaps: ${iso42001Analysis.gaps.join(', ')}`);
      }
    }
    
    // Sector-Specific Analysis
    if (sectorSpecificAnalysis.healthcare || sectorSpecificAnalysis.financial) {
      sections.push(`\nSector-Specific Requirements:`);
      if (sectorSpecificAnalysis.healthcare) {
        sections.push(`- Healthcare: HIPAA compliance required`);
      }
      if (sectorSpecificAnalysis.financial) {
        sections.push(`- Financial: ${[sectorSpecificAnalysis.sox && 'SOX', sectorSpecificAnalysis.pciDss && 'PCI-DSS'].filter(Boolean).join(', ')} compliance required`);
      }
    }
    
    // Jurisdictional Analysis
    if (jurisdictionalAnalysis.crossBorderTransfers) {
      sections.push(`\nCross-Border Data Transfers: Yes`);
      sections.push(`Jurisdictions: ${jurisdictionalAnalysis.jurisdictions.join(', ')}`);
      if (jurisdictionalAnalysis.transferMechanisms.length > 0) {
        sections.push(`Transfer Mechanisms: ${jurisdictionalAnalysis.transferMechanisms.join(', ')}`);
      }
    }
    
    // Compliance Frameworks
    if (assessment.organizationPolicies?.complianceFrameworks?.length > 0) {
      sections.push(`\nOrganization Compliance Frameworks: ${assessment.organizationPolicies.complianceFrameworks.join(', ')}`);
    }
    
    // Human Oversight
    if (assessment.ethicalImpact?.aiGovernance?.humanOversightLevel) {
      sections.push(`\nHuman Oversight Level: ${assessment.ethicalImpact.aiGovernance.humanOversightLevel}`);
    }
    
    // Automation Level
    if (assessment.ethicalImpact?.decisionMaking?.automationLevel) {
      sections.push(`Automation Level: ${assessment.ethicalImpact.decisionMaking.automationLevel}`);
    }
    
    return sections.join('\n');
  }
  
  protected extractInsights(
    assessmentData: any
  ): string[] {
    // This method is now required by BaseSpecialistAgent
    // Using the existing generateInsights logic
    return this.generateComplianceInsights(
      assessmentData.euAIActAnalysis || {},
      assessmentData.gdprAnalysis || {},
      assessmentData.iso42001Analysis || {},
      assessmentData.sectorSpecificAnalysis || {},
      assessmentData.jurisdictionalAnalysis || {}
    );
  }
  
  protected identifyConcerns(
    assessmentData: any
  ): string[] {
    // Override with existing method logic for base class
    const assessment = assessmentData as ComprehensiveAssessment;
    const concerns = [];

    if (!assessment.riskAssessment?.dataProtection?.jurisdictions || 
        assessment.riskAssessment.dataProtection.jurisdictions.length === 0) {
      concerns.push('No jurisdictions specified - unable to determine full compliance requirements');
    }

    if (assessment.roadmapPosition?.evolutionPath?.includes('Increase Autonomy Gradually') &&
        !assessment.ethicalImpact?.aiGovernance?.humanOversightLevel) {
      concerns.push('Increasing autonomy planned but human oversight not defined');
    }

    return concerns;
  }
  
  protected generateRecommendations(
    assessmentData: any
  ): string[] {
    // Override with existing method logic for base class
    const assessment = assessmentData as ComprehensiveAssessment;
    const recommendations = [];

    if (assessment.dataReadiness?.crossBorderTransfer) {
      recommendations.push('Conduct detailed data transfer impact assessment');
    }

    if (assessment.technicalFeasibility?.modelTypes?.includes('Generative AI')) {
      recommendations.push('Implement content moderation and transparency measures for Gen AI');
    }
    
    recommendations.push('Implement comprehensive documentation practices for regulatory compliance');

    return recommendations;
  }
  
  private generateComplianceInsights(
    euAIActAnalysis: any,
    gdprAnalysis: any,
    iso42001Analysis: any,
    sectorSpecificAnalysis: any,
    jurisdictionalAnalysis: any
  ): string[] {
    const insights = [];

    if (euAIActAnalysis.classification === 'high-risk') {
      insights.push(`System classified as high-risk under EU AI Act - comprehensive compliance program required`);
    }

    if (gdprAnalysis.applicable) {
      insights.push(`GDPR compliance required - implement data subject rights and protection measures`);
    }

    if (sectorSpecificAnalysis.healthcare) {
      insights.push(`Healthcare data detected - HIPAA compliance and enhanced privacy measures critical`);
    }

    if (jurisdictionalAnalysis.crossBorderTransfers) {
      insights.push(`Cross-border data transfers across ${jurisdictionalAnalysis.jurisdictions.length} jurisdictions require careful legal review`);
    }

    return insights;
  }

  private calculateConfidence(assessment: ComprehensiveAssessment, guardrails: Guardrail[]): number {
    let confidence = 0.6; // Base confidence for compliance

    if (assessment.riskAssessment?.dataProtection?.jurisdictions?.length > 0) confidence += 0.1;
    if (assessment.organizationPolicies?.complianceFrameworks) confidence += 0.1;
    if (guardrails.length > 2) confidence += 0.1;
    if (assessment.ethicalImpact?.aiGovernance?.humanOversightLevel) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  private identifyComplianceConcerns(assessment: ComprehensiveAssessment, regulatoryContext: any): string[] {
    const concerns = [];

    if (!assessment.riskAssessment?.dataProtection?.jurisdictions || 
        assessment.riskAssessment.dataProtection.jurisdictions.length === 0) {
      concerns.push('No jurisdictions specified - unable to determine full compliance requirements');
    }

    if (assessment.roadmapPosition?.evolutionPath?.includes('Increase Autonomy Gradually') &&
        !assessment.ethicalImpact?.aiGovernance?.humanOversightLevel) {
      concerns.push('Increasing autonomy planned but human oversight not defined');
    }

    return concerns;
  }

  private generateComplianceRecommendations(assessment: ComprehensiveAssessment, guardrails: Guardrail[]): string[] {
    const recommendations = [];

    if (!guardrails.some(g => g.id.includes('documentation'))) {
      recommendations.push('Implement comprehensive documentation practices for regulatory compliance');
    }

    if (assessment.dataReadiness?.crossBorderTransfer) {
      recommendations.push('Conduct detailed data transfer impact assessment');
    }

    if (assessment.technicalFeasibility?.modelTypes?.includes('Generative AI')) {
      recommendations.push('Implement content moderation and transparency measures for Gen AI');
    }

    return recommendations;
  }
}