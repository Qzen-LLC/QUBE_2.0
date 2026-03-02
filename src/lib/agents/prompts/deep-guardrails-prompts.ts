import { ComprehensiveAssessment } from '../types';

/**
 * Deep, comprehensive prompt generation for guardrails
 * Includes ALL context for intelligent, all-inclusive guardrail generation
 */

export function generateDeepGuardrailsPrompt(
  assessment: ComprehensiveAssessment,
  orgPolicies: any,
  approach: 'conservative_safety' | 'balanced_practical' | 'innovation_focused'
): string {
  const approachInstructions = getApproachInstructions(approach);
  
  return `You are an expert AI Governance Architect tasked with generating COMPREHENSIVE, ALL-INCLUSIVE guardrails for an AI use case. 
Your approach should be ${approach.replace('_', ' ')}.

${approachInstructions}

## COMPLETE USE CASE CONTEXT

### Core Business Problem & Solution
- **Problem Statement**: ${assessment.problemStatement || 'Not specified'}
- **Current State**: ${assessment.currentState || 'Not specified'}
- **Desired State**: ${assessment.desiredState || 'Not specified'}
- **Proposed AI Solution**: ${assessment.proposedSolution || 'Not specified'}
- **Success Criteria**: ${assessment.successCriteria || 'Not specified'}
- **Key Assumptions**: ${assessment.keyAssumptions || 'Not specified'}
- **Key Benefits**: ${assessment.keyBenefits || 'Not specified'}
- **Required Resources**: ${assessment.requiredResources || 'Not specified'}

### Stakeholder Context
- **Primary Stakeholders**: ${assessment.primaryStakeholders?.join(', ') || 'Not specified'}
- **Secondary Stakeholders**: ${assessment.secondaryStakeholders?.join(', ') || 'Not specified'}
- **Each stakeholder group has specific concerns that MUST be addressed through guardrails**

### Impact Analysis
- **Confidence Level**: ${assessment.confidenceLevel || 0}/10
- **Operational Impact**: ${assessment.operationalImpact || 0}/10
- **Productivity Impact**: ${assessment.productivityImpact || 0}/10
- **Revenue Impact**: ${assessment.revenueImpact || 0}/10
- **Implementation Complexity**: ${assessment.implementationComplexity || 0}/10

### Timeline & Financial Context
- **Timeline**: ${assessment.timeline || 'Not specified'}
- **Initial Cost**: ${assessment.initialCost || 'Not specified'}
- **Initial ROI**: ${assessment.initialROI || 'Not specified'}
${assessment.financialConstraints ? `
- **Budget Constraint**: ${assessment.financialConstraints.budget}
- **ROI Target**: ${assessment.financialConstraints.roi}
- **Total Investment**: ${assessment.financialConstraints.totalInvestment}` : ''}

### Governance & Approval Context
${assessment.approvalStatus ? `
- **Approval Status**: ${assessment.approvalStatus}
- **Approval Conditions**: ${assessment.approvalConditions?.join('; ') || 'None'}
These conditions MUST be enforced through guardrails.` : ''}

### Risk Context
${assessment.identifiedRisks && assessment.identifiedRisks.length > 0 ? `
- **Identified Risks**: ${assessment.identifiedRisks.length} risks identified
- **Residual Risk Level**: ${assessment.residualRiskLevel || 'Unknown'}
Each identified risk MUST have corresponding guardrails.` : ''}

### Compliance Requirements
${assessment.complianceRequirements ? formatComplianceRequirements(assessment.complianceRequirements) : 'No specific compliance frameworks identified'}

### Technical Architecture
${formatTechnicalContext(assessment.technicalFeasibility)}

### Business Requirements
${formatBusinessContext(assessment.businessFeasibility)}

### Ethical Considerations
${formatEthicalContext(assessment.ethicalImpact)}

### Risk Assessment
${formatRiskContext(assessment.riskAssessment)}

### Data Readiness
${formatDataContext(assessment.dataReadiness)}

### Roadmap Position
${formatRoadmapContext(assessment.roadmapPosition)}

### Budget Planning
${formatBudgetContext(assessment.budgetPlanning)}

### Organization Policies
${formatOrgPolicies(orgPolicies)}

## CRITICAL GENERATION INSTRUCTIONS

You MUST generate ALL-INCLUSIVE guardrails that address:

1. **Every Risk Identified** - No risk should be left without a corresponding guardrail
2. **Every Compliance Requirement** - All regulatory requirements must be enforced
3. **Every Stakeholder Concern** - Each stakeholder group's needs must be protected
4. **Every Approval Condition** - All conditions from approvers must be implemented
5. **Every Technical Constraint** - All technical limitations must be respected
6. **Every Ethical Consideration** - All bias and fairness concerns must be mitigated
7. **Every Data Protection Need** - All data types must be appropriately protected
8. **Every Financial Constraint** - Cost controls must align with budget
9. **Every Operational Requirement** - SLAs and availability must be ensured
10. **Every Security Concern** - All attack vectors must be defended

## GUARDRAIL CATEGORIES TO GENERATE

### 1. CRITICAL GUARDRAILS (Non-negotiable safety measures)
- Content safety and moderation
- Data protection and privacy
- Compliance requirements
- Human oversight mechanisms
- Security controls
- Emergency stops and kill switches

### 2. OPERATIONAL GUARDRAILS (Performance and reliability)
- Latency and response time limits
- Availability and uptime requirements
- Scalability controls
- Resource utilization limits
- Error handling and recovery
- Monitoring and alerting

### 3. ETHICAL GUARDRAILS (Fairness and responsibility)
- Bias detection and mitigation
- Fairness metrics and thresholds
- Transparency requirements
- Explainability mechanisms
- User consent and control
- Inclusivity measures

### 4. ECONOMIC GUARDRAILS (Cost and resource management)
- Token usage limits and optimization
- API cost controls
- Infrastructure cost management
- ROI tracking and optimization
- Budget alerts and controls
- Resource allocation limits

### 5. QUALITY GUARDRAILS (Output quality and accuracy)
- Accuracy thresholds
- Hallucination detection and prevention
- Consistency checks
- Validation mechanisms
- Quality scoring
- Feedback loops

### 6. GOVERNANCE GUARDRAILS (Policy and compliance)
- Audit trail requirements
- Documentation standards
- Change management controls
- Access controls and permissions
- Approval workflows
- Reporting requirements

### 7. EVOLUTIONARY GUARDRAILS (Adaptation over time)
- Model drift detection
- Performance degradation alerts
- Continuous improvement mechanisms
- A/B testing controls
- Rollback procedures
- Version control

### 8. INTEGRATION GUARDRAILS (System interactions)
- API rate limiting
- Data format validation
- Protocol compliance
- Error propagation prevention
- Dependency management
- Circuit breakers

### 9. USER EXPERIENCE GUARDRAILS (User safety and satisfaction)
- User safety measures
- Consent mechanisms
- Opt-out procedures
- Feedback channels
- Support escalation
- Accessibility requirements

### 10. SPECIALIZED GUARDRAILS (Use case specific)
${generateSpecializedGuardrails(assessment)}

## OUTPUT FORMAT

Generate a comprehensive JSON response with the following structure:

{
  "guardrails": {
    "critical": [...],
    "operational": [...],
    "ethical": [...],
    "economic": [...],
    "quality": [...],
    "governance": [...],
    "evolutionary": [...],
    "integration": [...],
    "user_experience": [...],
    "specialized": [...]
  },
  "reasoning": {
    "key_insights": [...],
    "tradeoffs": [...],
    "assumptions": [...],
    "recommendations": [...]
  },
  "confidence": 0.0-1.0,
  "coverage": {
    "risks_addressed": "percentage",
    "compliance_met": "percentage",
    "stakeholders_protected": "percentage"
  }
}

Each guardrail must include:
- id: unique identifier
- type: guardrail category
- severity: critical/high/medium/low
- rule: specific rule name
- description: what this guardrail does
- rationale: why this is necessary given the context
- implementation: detailed configuration
- monitoring: metrics and thresholds
- conditions: when this applies
- exceptions: when this doesn't apply

REMEMBER: Generate ALL possible guardrails. Users will filter later if needed. It's better to be over-inclusive than to miss critical protections.`;
}

function getApproachInstructions(approach: string): string {
  const instructions = {
    'conservative_safety': `
CONSERVATIVE SAFETY APPROACH:
- Prioritize safety and risk mitigation above all else
- Apply defense-in-depth strategies with multiple layers
- Require human oversight for any significant decisions
- Implement redundant safety mechanisms
- Choose more restrictive options when uncertain
- Add extra monitoring and validation layers
- Prefer fail-safe over fail-operational designs
- Zero tolerance for safety violations`,
    
    'balanced_practical': `
BALANCED PRACTICAL APPROACH:
- Balance safety with usability and efficiency
- Apply risk-proportionate controls
- Use automation where safe and beneficial
- Implement practical monitoring without overwhelming operators
- Choose pragmatic solutions that can be realistically implemented
- Focus on high-impact risks while accepting manageable low risks
- Design for gradual improvement over time
- Allow controlled experimentation`,
    
    'innovation_focused': `
INNOVATION FOCUSED APPROACH:
- Enable innovation while maintaining essential safety
- Minimize friction for legitimate use cases
- Leverage advanced techniques for efficiency
- Implement smart, adaptive controls
- Choose solutions that scale with growth
- Focus on outcome-based rather than prescriptive controls
- Design for rapid iteration and learning
- Embrace calculated risks for innovation`
  };

  return instructions[approach] || instructions['balanced_practical'];
}

function formatComplianceRequirements(compliance: any): string {
  const requirements = [];
  
  if (compliance.euAiAct) {
    requirements.push(`
**EU AI Act Compliance**
- Classification: ${compliance.euAiAct.classification || 'To be determined'}
- Requirements: ${compliance.euAiAct.requirements?.join(', ') || 'Full assessment needed'}
- Gaps: ${compliance.euAiAct.gaps?.join(', ') || 'None identified'}`);
  }
  
  if (compliance.iso42001) {
    requirements.push(`
**ISO 42001 Compliance**
- Maturity Level: ${compliance.iso42001.maturityLevel || 'Initial'}
- Gaps: ${compliance.iso42001.gaps?.join(', ') || 'None identified'}`);
  }
  
  if (compliance.uaeAi) {
    requirements.push(`
**UAE AI Regulations**
- Local Requirements: ${compliance.uaeAi.localRequirements?.join(', ') || 'Standard'}
- Arabic Support: ${compliance.uaeAi.arabicLanguageSupport ? 'Required' : 'Not required'}`);
  }
  
  if (compliance.hipaa) {
    requirements.push(`
**HIPAA Compliance**
- PHI Types: ${compliance.hipaa.phiTypes?.join(', ') || 'None'}
- Required Safeguards: Administrative, Physical, Technical`);
  }
  
  if (compliance.gdpr) {
    requirements.push(`
**GDPR Compliance**
- Data Categories: ${compliance.gdpr.dataCategories?.join(', ') || 'None'}
- Lawful Basis: ${compliance.gdpr.lawfulBasis || 'To be determined'}
- DPIA Required: ${compliance.gdpr.dpia ? 'Yes' : 'No'}`);
  }
  
  return requirements.length > 0 ? requirements.join('\n') : 'No specific compliance requirements';
}

function formatTechnicalContext(tech: any): string {
  if (!tech) return 'Technical feasibility not assessed';
  
  return `
- **Model Types**: ${tech.modelTypes?.join(', ') || 'Not specified'}
- **Model Provider**: ${tech.modelProvider || 'Not specified'}
- **Deployment Models**: ${tech.deploymentModels?.join(', ') || 'Not specified'}
- **Integration Points**: ${tech.integrationPoints?.length || 0} systems
- **Technical Complexity**: ${tech.technicalComplexity || 0}/10
- **RAG Architecture**: ${tech.ragArchitecture ? 'Yes' : 'No'}
- **Agent Architecture**: ${tech.agentArchitecture || 'None'}
- **Fallback Models**: ${tech.fallbackModels?.join(', ') || 'None'}`;
}

function formatBusinessContext(business: any): string {
  if (!business) return 'Business feasibility not assessed';
  
  return `
- **System Criticality**: ${business.systemCriticality || 'Not specified'}
- **Failure Impact**: ${business.failureImpact || 'Not specified'}
- **User Categories**: ${business.userCategories?.join(', ') || 'Not specified'}
- **Concurrent Users**: ${business.concurrentUsers || 'Not specified'}
- **Max Hallucination Rate**: ${business.maxHallucinationRate || 'Not specified'}%
- **Min Acceptable Accuracy**: ${business.minAcceptableAccuracy || 'Not specified'}%
- **Success Metrics**: ${business.successMetrics?.join(', ') || 'Not specified'}`;
}

function formatEthicalContext(ethical: any): string {
  if (!ethical) return 'Ethical impact not assessed';
  
  return `
- **Automation Level**: ${ethical.decisionMaking?.automationLevel || 'Not specified'}
- **Decision Types**: ${ethical.decisionMaking?.decisionTypes?.join(', ') || 'Not specified'}
- **Human Oversight Level**: ${ethical.aiGovernance?.humanOversightLevel || 'Not specified'}
- **Explainability Level**: ${ethical.modelCharacteristics?.explainabilityLevel || 'Not specified'}
- **Bias Testing**: ${ethical.modelCharacteristics?.biasTesting || 'Not specified'}
- **Potential Harm Areas**: ${ethical.ethicalConsiderations?.potentialHarmAreas?.join(', ') || 'None identified'}`;
}

function formatRiskContext(risk: any): string {
  if (!risk) return 'Risk assessment not completed';
  
  return `
- **Technical Risks**: ${risk.technicalRisks?.length || 0} identified
- **Business Risks**: ${risk.businessRisks?.length || 0} identified
- **Compliance Risks**: ${risk.complianceRisks?.length || 0} identified
- **Data Protection Jurisdictions**: ${risk.dataProtection?.jurisdictions?.join(', ') || 'Not specified'}
- **Cross-border Transfer**: ${risk.dataProtection?.crossBorderTransfer ? 'Yes' : 'No'}
- **Third-party Risks**: ${risk.thirdPartyRisks?.length || 0} identified`;
}

function formatDataContext(data: any): string {
  if (!data) return 'Data readiness not assessed';
  
  return `
- **Data Types**: ${data.dataTypes?.join(', ') || 'Not specified'}
- **Data Volume**: ${data.dataVolume || 'Not specified'}
- **Data Quality Score**: ${data.dataQualityScore || 0}/10
- **Cross-border Transfer**: ${data.crossBorderTransfer || 'No'}
- **Data Retention**: ${data.dataRetention || 'Not specified'}
- **Update Frequency**: ${data.updateFrequency || 'Not specified'}`;
}

function formatRoadmapContext(roadmap: any): string {
  if (!roadmap) return 'Roadmap position not defined';
  
  return `
- **Current AI Maturity**: ${roadmap.currentAIMaturity || 'Not specified'}
- **Target AI Maturity**: ${roadmap.targetAIMaturity || 'Not specified'}
- **Timeline to Target**: ${roadmap.timelineToTarget || 'Not specified'}
- **Evolution Path**: ${roadmap.evolutionPath?.join(' → ') || 'Not specified'}
- **Key Milestones**: ${roadmap.keyMilestones?.length || 0} defined`;
}

function formatBudgetContext(budget: any): string {
  if (!budget) return 'Budget planning not completed';
  
  return `
- **Budget Range**: ${budget.budgetRange || 'Not specified'}
- **Monthly Token Volume**: ${budget.monthlyTokenVolume || 0} tokens
- **Token Optimization Target**: ${budget.tokenOptimizationTarget || 'Not specified'}%
- **Optimization Strategies**: ${budget.optimizationStrategies?.join(', ') || 'None'}
- **Initial Dev Cost**: $${budget.initialDevCost || 0}
- **Monthly API Cost**: $${budget.baseApiCost || 0}
- **Monthly Infra Cost**: $${budget.baseInfraCost || 0}`;
}

function formatOrgPolicies(policies: any): string {
  if (!policies) {
    return 'Organization policies not defined - using defaults';
  }
  
  return `
- **AI Ethics Principles**: ${policies.aiEthics?.join(', ') || 'Standard'}
- **Data Governance**: ${policies.dataGovernance?.join(', ') || 'Standard'}
- **Risk Appetite**: ${policies.riskAppetite || 'Moderate'}
- **Prohibited Uses**: ${policies.prohibitedUses?.join('; ') || 'None'}
- **Required Safeguards**: ${policies.requiredSafeguards?.join('; ') || 'Standard'}`;
}

function generateSpecializedGuardrails(assessment: ComprehensiveAssessment): string {
  const specialized = [];
  
  // Healthcare specific
  if (assessment.dataReadiness?.dataTypes?.includes('Health/Medical Records')) {
    specialized.push('- HIPAA compliance controls');
    specialized.push('- Medical data anonymization');
    specialized.push('- Clinical decision support safeguards');
  }
  
  // Financial specific
  if (assessment.dataReadiness?.dataTypes?.includes('Financial Records')) {
    specialized.push('- Financial fraud detection');
    specialized.push('- Transaction monitoring');
    specialized.push('- PCI compliance controls');
  }
  
  // Public facing specific
  if (assessment.businessFeasibility?.userCategories?.includes('General Public')) {
    specialized.push('- Public safety measures');
    specialized.push('- Content moderation at scale');
    specialized.push('- Abuse prevention');
  }
  
  // Minors/Children specific
  if (assessment.businessFeasibility?.userCategories?.includes('Minors/Children')) {
    specialized.push('- COPPA compliance');
    specialized.push('- Age-appropriate content filtering');
    specialized.push('- Parental consent mechanisms');
  }
  
  // High complexity specific
  if ((assessment.implementationComplexity || 0) > 8) {
    specialized.push('- Chaos engineering controls');
    specialized.push('- Advanced monitoring and observability');
    specialized.push('- Automated rollback mechanisms');
  }
  
  // Mission critical specific
  if (assessment.businessFeasibility?.systemCriticality === 'Mission Critical') {
    specialized.push('- Zero-downtime deployment');
    specialized.push('- Disaster recovery procedures');
    specialized.push('- Multi-region failover');
  }
  
  return specialized.length > 0 ? specialized.join('\n') : '- No specialized guardrails required';
}

/**
 * Enhanced version of the standard prompt that includes ALL context
 */
export function generateComprehensiveGuardrailsPrompt(
  assessment: ComprehensiveAssessment,
  orgPolicies: any,
  approach: 'conservative_safety' | 'balanced_practical' | 'innovation_focused'
): string {
  // Use the deep prompt for comprehensive generation
  return generateDeepGuardrailsPrompt(assessment, orgPolicies, approach);
}