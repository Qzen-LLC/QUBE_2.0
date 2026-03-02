// Simplified Enhanced Compliance Framework - Focused on Actionable Compliance Areas

export interface SimpleComplianceResult {
  applicableRequirements: any[];
  implementationPhases: any[];
  prioritizedGaps: any[];
  quickWins: any[];
  industryGuidance: any[];
  monitoringAlerts: any[];
  regulatoryChanges: any[];
  focusAreas?: string[];
  complianceReadiness?: string;
  totalImplementationCost: number;
  estimatedTimeline: number;
  riskReductionProjection: number;
}

export function calculateSimpleEnhancedCompliance(stepsData: any): SimpleComplianceResult {
  try {
    console.log('🔍 DEBUG: Full stepsData structure:', JSON.stringify(stepsData, null, 2));
    
    // Debug specific sections
    console.log('📊 Data types:', stepsData?.dataReadiness?.dataTypes);
    console.log('🏛️ Jurisdictions:', stepsData?.riskAssessment?.dataProtection?.jurisdictions);
    console.log('🤖 Decision automation:', stepsData?.ethicalImpact?.decisionMaking?.automationLevel);
    console.log('🧠 Model types:', stepsData?.technicalFeasibility?.modelTypes);
    console.log('⚖️ Bias testing:', stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting);
    console.log('🔍 Explainability:', stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel);
    
    // 1. Generate applicable requirements based on your actual data
    const applicableRequirements = generateRequirements(stepsData);
    console.log('📋 Generated requirements:', applicableRequirements);
    
    // 2. Create implementation phases (focus on actions, not budget)
    const implementationPhases = generateActionPhases(stepsData);
    console.log('📅 Generated phases:', implementationPhases);
    
    // 3. Generate compliance gaps with urgency levels
    const prioritizedGaps = generateUrgentGaps(stepsData);
    console.log('🚨 Generated gaps:', prioritizedGaps);
    
    // 4. Identify quick wins (immediate actions)
    const quickWins = generateImmediateActions(stepsData);
    console.log('⚡ Generated quick wins:', quickWins);
    
    // 5. Industry guidance with specific recommendations
    const industryGuidance = generateSpecificGuidance(stepsData);
    console.log('🏢 Generated industry guidance:', industryGuidance);
    
    // 6. Monitoring alerts with severity levels
    const monitoringAlerts = generateComplianceAlerts(stepsData);
    console.log('🚨 Generated alerts:', monitoringAlerts);
    
    // 7. Calculate focus areas and priorities
    const focusAreas = identifyFocusAreas(stepsData);
    const complianceReadiness = assessComplianceReadiness(stepsData);
    
    console.log('🎯 Focus areas:', focusAreas);
    console.log('📊 Compliance readiness:', complianceReadiness);

    return {
      applicableRequirements,
      implementationPhases,
      prioritizedGaps,
      quickWins,
      industryGuidance,
      monitoringAlerts,
      regulatoryChanges: [],
      focusAreas,
      complianceReadiness,
      totalImplementationCost: 0,
      estimatedTimeline: calculateTimelineOnly(implementationPhases),
      riskReductionProjection: calculateRiskReduction(prioritizedGaps)
    };
  } catch (error) {
    console.error('❌ Error in enhanced compliance calculation:', error);
    return getEmptyResult();
  }
}

function generateRequirements(stepsData: any): any[] {
  const requirements = [];
  if (stepsData?.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)')) {
    requirements.push({
      articleSection: 'GDPR Article 6',
      title: 'Lawful basis for processing',
      description: 'Establish lawful basis for personal data processing',
      penaltyForNonCompliance: {
        maxFine: '4% of annual global turnover or €20 million',
        enforcementLikelihood: 'high'
      }
    });
    if (stepsData?.ethicalImpact?.decisionMaking?.automationLevel === 'Fully Automated') {
      requirements.push({
        articleSection: 'GDPR Article 22',
        title: 'Automated individual decision-making',
        description: 'Implement safeguards for automated decision-making',
        penaltyForNonCompliance: {
          maxFine: '4% of annual global turnover or €20 million',
          enforcementLikelihood: 'high'
        }
      });
    }
  }
  if (stepsData?.riskAssessment?.sectorSpecific === 'HIPAA (Healthcare)') {
    requirements.push({
      articleSection: 'HIPAA Security Rule',
      title: 'Administrative Safeguards',
      description: 'Implement administrative safeguards for PHI',
      penaltyForNonCompliance: {
        maxFine: '$1.5 million per incident',
        enforcementLikelihood: 'medium'
      }
    });
  }
  if (stepsData?.businessFeasibility?.decisionTypes?.includes('Credit Decisions')) {
    requirements.push({
      articleSection: 'ECOA/Reg B',
      title: 'Fair Lending Compliance',
      description: 'Implement fair lending practices and bias testing',
      penaltyForNonCompliance: {
        maxFine: '$1 million+ in fines and restitution',
        enforcementLikelihood: 'high'
      }
    });
  }
  return requirements;
}

function generateActionPhases(stepsData: any): any[] {
  const phases = [];
  
  // Phase 1: Immediate Compliance Assessment
  phases.push({
    phaseNumber: 1,
    phaseName: 'Immediate Compliance Assessment',
    priority: 'Critical',
    timeframe: '2-4 weeks',
    keyActions: [
      'Conduct regulatory compliance audit',
      'Identify immediate compliance gaps',
      'Document current AI governance practices',
      'Assess data protection measures'
    ],
    deliverables: [
      'Compliance gap assessment report',
      'Risk priority matrix',
      'Regulatory requirement checklist'
    ]
  });

  // Phase 2: Technical Controls Implementation (if AI models exist)
  if (stepsData?.technicalFeasibility?.modelTypes?.length > 0) {
    phases.push({
      phaseNumber: 2,
      phaseName: 'Technical Safeguards Implementation',
      priority: 'High',
      timeframe: '6-12 weeks',
      keyActions: [
        'Implement bias testing framework',
        'Deploy model monitoring systems',
        'Establish data lineage tracking',
        'Create audit logging mechanisms'
      ],
      deliverables: [
        'Bias testing results',
        'Model monitoring dashboard',
        'Data governance documentation'
      ]
    });
  }

  // Phase 3: Process and Governance (always needed)
  phases.push({
    phaseNumber: 3,
    phaseName: 'Governance and Process Integration',
    priority: 'Medium',
    timeframe: '4-8 weeks',
    keyActions: [
      'Establish AI governance committee',
      'Create compliance review processes',
      'Implement staff training programs',
      'Develop incident response procedures'
    ],
    deliverables: [
      'AI governance framework',
      'Standard operating procedures',
      'Training completion records'
    ]
  });

  return phases;
}

function generateUrgentGaps(stepsData: any): any[] {
  const gaps = [];

  // GDPR compliance gaps
  if (stepsData?.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)')) {
    // Automated decision-making gap
    if (stepsData?.ethicalImpact?.decisionMaking?.automationLevel === 'Fully Automated') {
      gaps.push({
        requirement: 'GDPR Article 22 Compliance',
        description: 'Automated decision-making requires human oversight and explanation rights',
        urgency: 'Critical',
        regulatoryRisk: 'High - Up to 4% of global revenue',
        immediateActions: [
          'Implement human review process',
          'Create explanation mechanisms',
          'Document decision logic'
        ],
        timeToAddress: '4-6 weeks',
        riskIfIgnored: 'Regulatory enforcement action, significant fines'
      });
    }

    // Data protection impact assessment
    if (stepsData?.dataReadiness?.dataTypes?.some((type: string) => 
         ['Personal Identifiable Information (PII)', 'Health/Medical Records', 'Biometric Data'].includes(type))) {
      gaps.push({
        requirement: 'Data Protection Impact Assessment (DPIA)',
        description: 'High-risk processing requires formal impact assessment',
        urgency: 'High',
        regulatoryRisk: 'Medium - Compliance requirement',
        immediateActions: [
          'Complete DPIA template',
          'Assess necessity and proportionality',
          'Implement privacy by design'
        ],
        timeToAddress: '2-3 weeks',
        riskIfIgnored: 'Non-compliance with GDPR requirements'
      });
    }
  }

  // Bias testing gaps
  if (stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting === 'No Testing Planned' &&
      stepsData?.businessFeasibility?.decisionTypes?.some((type: string) => 
      ['Credit Decisions', 'Employment Decisions', 'Insurance Underwriting'].includes(type))) {
    gaps.push({
      requirement: 'Algorithmic Bias Testing',
      description: 'Decision-making AI requires fairness and bias monitoring',
      urgency: 'High',
      regulatoryRisk: 'High - Fair lending/employment violations',
      immediateActions: [
        'Implement statistical bias tests',
        'Monitor for disparate impact',
        'Document fairness metrics'
      ],
      timeToAddress: '3-4 weeks',
      riskIfIgnored: 'Discrimination lawsuits, regulatory penalties'
    });
  }

  // Explainability gaps
  if (stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel === 'black-box' &&
      stepsData?.ethicalImpact?.decisionMaking?.automationLevel !== 'Information Only') {
    gaps.push({
      requirement: 'Model Explainability',
      description: 'Decisions affecting individuals require explanation capability',
      urgency: 'Medium',
      regulatoryRisk: 'Medium - Transparency requirements',
      immediateActions: [
        'Implement explanation features',
        'Create user-friendly summaries',
        'Document model logic'
      ],
      timeToAddress: '6-8 weeks',
      riskIfIgnored: 'Reduced user trust, potential compliance issues'
    });
  }

  return gaps.sort((a, b) => {
    const urgencyOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
    return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
  });
}

function generateImmediateActions(stepsData: any): any[] {
  const actions = [];

  // Privacy policy update (almost always needed)
  if (stepsData?.dataReadiness?.dataTypes?.length > 0) {
    actions.push({
      action: 'Update Privacy Policy for AI Processing',
      description: 'Inform users about AI data processing activities',
      effort: 'Low (4-8 hours)',
      impact: 'Medium - Transparency compliance',
      owner: 'Legal/Privacy Team'
    });
  }

  // Data inventory (if processing personal data)
  if (stepsData?.dataReadiness?.dataTypes?.includes('Personal Identifiable Information (PII)')) {
    actions.push({
      action: 'Complete Data Processing Inventory',
      description: 'Document all personal data processing activities',
      effort: 'Medium (1-2 days)',
      impact: 'High - Foundation for compliance',
      owner: 'Data Protection Officer'
    });
  }

  // Model documentation (if AI models exist)
  if (stepsData?.technicalFeasibility?.modelTypes?.length > 0) {
    actions.push({
      action: 'Document AI Model Specifications',
      description: 'Create technical documentation for regulatory review',
      effort: 'Medium (2-3 days)',
      impact: 'High - Regulatory transparency',
      owner: 'AI/ML Team'
    });
  }

  // Access controls review
  actions.push({
    action: 'Review Data Access Controls',
    description: 'Ensure principle of least privilege for data access',
    effort: 'Low (1 day)',
    impact: 'Medium - Security compliance',
    owner: 'IT Security Team'
  });

  return actions;
}

function generateSpecificGuidance(stepsData: any): any[] {
  const guidance = [];

  // Financial services specific guidance
  if (stepsData?.businessFeasibility?.decisionTypes?.includes('Credit Decisions')) {
    guidance.push({
      scenario: 'AI-driven Credit Decision-Making',
      regulations: ['ECOA', 'FCRA', 'Fair Lending Guidelines'],
      keyRequirements: [
        'Implement disparate impact testing (4/5ths rule)',
        'Provide adverse action notices with specific reasons',
        'Maintain model documentation for examiner review',
        'Monitor for proxy discrimination'
      ],
      bestPractices: [
        'Regular bias testing across protected classes',
        'Documentation of model development process',
        'Clear escalation procedures for bias detection'
      ]
    });
  }

  // Healthcare specific guidance
  if (stepsData?.riskAssessment?.sectorSpecific === 'HIPAA (Healthcare)') {
    guidance.push({
      scenario: 'AI Processing of Health Information',
      regulations: ['HIPAA Security Rule', 'HIPAA Privacy Rule'],
      keyRequirements: [
        'Implement administrative safeguards',
        'Ensure minimum necessary access',
        'Establish business associate agreements',
        'Maintain audit logs of PHI access'
      ],
      bestPractices: [
        'Regular security risk assessments',
        'Staff training on HIPAA requirements',
        'Incident response procedures for breaches'
      ]
    });
  }

  // EU AI Act guidance
  if (stepsData?.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)')) {
    guidance.push({
      scenario: 'EU AI Act Compliance Preparation',
      regulations: ['EU AI Act', 'GDPR'],
      keyRequirements: [
        'Assess AI system risk classification',
        'Implement quality management system',
        'Ensure human oversight mechanisms',
        'Maintain conformity assessment documentation'
      ],
      bestPractices: [
        'Early preparation for high-risk system requirements',
        'Regular review of AI Act implementing regulations',
        'Integration with existing GDPR compliance'
      ]
    });
  }

  return guidance;
}

function generateComplianceAlerts(stepsData: any): any[] {
  const alerts = [];

  // High-risk automated decisions without safeguards
  if (stepsData?.ethicalImpact?.decisionMaking?.automationLevel === 'Fully Automated' &&
      stepsData?.ethicalImpact?.aiGovernance?.humanOversightLevel === 'fully-autonomous') {
    alerts.push({
      alertType: 'Compliance Risk',
      title: 'Fully Automated Decisions Without Human Oversight',
      severity: 'Critical',
      description: 'GDPR Article 22 requires human oversight for automated decision-making',
      action: 'Implement human review process immediately'
    });
  }

  // Bias testing not implemented for high-risk decisions
  if (stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting === 'No Testing Planned' &&
      stepsData?.businessFeasibility?.userCategories?.includes('Customers')) {
    alerts.push({
      alertType: 'Fairness Risk',
      title: 'No Bias Testing for Customer-Facing AI',
      severity: 'High',
      description: 'Customer decisions require fairness monitoring',
      action: 'Implement bias testing framework'
    });
  }

  // Cross-border data transfer without safeguards
  if (stepsData?.dataReadiness?.crossBorderTransfer &&
      !stepsData?.riskAssessment?.dataProtection?.adequacyDecisions) {
    alerts.push({
      alertType: 'Data Transfer Risk',
      title: 'Cross-Border Transfer Without Adequate Safeguards',
      severity: 'Medium',
      description: 'International data transfers require appropriate safeguards',
      action: 'Implement Standard Contractual Clauses or adequacy mechanisms'
    });
  }

  return alerts;
}

function identifyFocusAreas(stepsData: any): string[] {
  const areas = [];
  console.log('🎯 Identifying focus areas...');

  // Check for GDPR
  const jurisdictions = stepsData?.riskAssessment?.dataProtection?.jurisdictions;
  if (Array.isArray(jurisdictions) && jurisdictions.some((j: any) => typeof j === 'string' && (j.includes('GDPR (EU)') || j.includes('EU')))) {
    areas.push('GDPR Compliance');
    console.log('✅ Added GDPR focus area');
  }
  
  // Check for bias testing needs
  if (stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting === 'No Testing Planned' ||
      !stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting) {
    areas.push('Algorithmic Fairness');
    console.log('✅ Added Algorithmic Fairness focus area');
  }
  
  // Check for explainability needs
  if (stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel === 'black-box' ||
      stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel === 'Black Box (No explanation)') {
    areas.push('AI Transparency');
    console.log('✅ Added AI Transparency focus area');
  }
  
  // Check for healthcare
  const sectorSpecific = stepsData?.riskAssessment?.sectorSpecific;
  let isHealthcare = false;
  if (typeof sectorSpecific === 'string' && sectorSpecific.includes('HIPAA')) {
    isHealthcare = true;
  } else if (Array.isArray(sectorSpecific) && sectorSpecific.some((s: any) => typeof s === 'string' && s.includes('HIPAA'))) {
    isHealthcare = true;
  }
  if (!isHealthcare && Array.isArray(stepsData?.dataReadiness?.dataTypes)) {
    isHealthcare = stepsData.dataReadiness.dataTypes.some((type: string) => type && (type.includes('Health') || type.includes('Medical')));
  }
  if (isHealthcare) {
    areas.push('Healthcare Privacy');
    console.log('✅ Added Healthcare Privacy focus area');
  }
  
  // Check for financial services
  const decisionTypes = stepsData?.businessFeasibility?.decisionTypes;
  let isFinancial = false;
  if (typeof decisionTypes === 'string' && decisionTypes.includes('Credit')) {
    isFinancial = true;
  } else if (Array.isArray(decisionTypes) && decisionTypes.some((t: any) => typeof t === 'string' && (t.includes('Credit') || t.includes('Financial')))) {
    isFinancial = true;
  }
  if (isFinancial) {
    areas.push('Fair Lending');
    console.log('✅ Added Fair Lending focus area');
  }

  // Add general AI governance if no specific areas found
  if (areas.length === 0 && Array.isArray(stepsData?.technicalFeasibility?.modelTypes) && stepsData.technicalFeasibility.modelTypes.length > 0) {
    areas.push('AI Governance');
    console.log('✅ Added general AI Governance focus area');
  }

  console.log(`📊 Total focus areas: ${areas.length}`, areas);
  return areas;
}

function assessComplianceReadiness(stepsData: any): string {
  let score = 0;
  let total = 0;

  // Check GDPR readiness
  if (stepsData?.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)')) {
    total += 3;
    if (stepsData?.ethicalImpact?.decisionMaking?.automationLevel !== 'Fully Automated') score += 1;
    if (stepsData?.dataReadiness?.dataTypes?.length <= 2) score += 1;
    if (stepsData?.ethicalImpact?.aiGovernance?.humanOversightLevel !== 'fully-autonomous') score += 1;
  }

  // Check bias testing readiness
  total += 2;
  if (stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting !== 'No Testing Planned') score += 1;
  if (stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel !== 'black-box') score += 1;

  // Check data governance
  total += 2;
  if (stepsData?.dataReadiness?.dataQuality >= 7) score += 1;
  if (stepsData?.dataReadiness?.dataDeletionCapabilities !== 'Cannot delete') score += 1;

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  if (percentage >= 80) return 'High Readiness';
  if (percentage >= 60) return 'Medium Readiness';
  if (percentage >= 40) return 'Low Readiness';
  return 'Requires Immediate Attention';
}

function calculateTimelineOnly(phases: any[]): number {
  return phases.reduce((total, phase) => {
    // Extract weeks from timeframe like "2-4 weeks" or "6-12 weeks"
    const match = phase.timeframe?.match(/(\d+)-?(\d+)?\s*weeks?/);
    if (match) {
      const minWeeks = parseInt(match[1]);
      const maxWeeks = match[2] ? parseInt(match[2]) : minWeeks;
      return total + maxWeeks; // Use max for conservative estimate
    }
    return total + 4; // Default fallback
  }, 0);
}

function calculateRiskReduction(gaps: any[]): number {
  return gaps.reduce((total, gap) => total + (gap.riskOfNonCompliance || 0), 0);
}

function getEmptyResult(): SimpleComplianceResult {
  return {
    applicableRequirements: [],
    implementationPhases: [],
    prioritizedGaps: [],
    quickWins: [],
    industryGuidance: [],
    monitoringAlerts: [],
    regulatoryChanges: [],
    focusAreas: [],
    complianceReadiness: 'Requires Immediate Attention',
    totalImplementationCost: 0,
    estimatedTimeline: 0,
    riskReductionProjection: 0
  };
} 