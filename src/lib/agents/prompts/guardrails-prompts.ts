import { ComprehensiveAssessment } from '../types';
import { generateComprehensiveGuardrailsPrompt } from './deep-guardrails-prompts';

/**
 * Prompt templates for the Agentic Guardrails System
 * These prompts guide the LLM to generate intelligent, context-aware guardrails
 */

export function generateGuardrailsPrompt(
  assessment: ComprehensiveAssessment,
  orgPolicies: any,
  approach: 'conservative_safety' | 'balanced_practical' | 'innovation_focused'
): string {
  // If we have complete use case context, use the comprehensive prompt
  if (assessment.problemStatement && assessment.successCriteria) {
    return generateComprehensiveGuardrailsPrompt(assessment, orgPolicies, approach);
  }
  
  // Otherwise, use the standard prompt (backwards compatibility)
  const approachInstructions = getApproachInstructions(approach);
  
  return `You are an expert AI Governance Architect tasked with generating comprehensive, nuanced guardrails for an AI use case. Your approach should be ${approach.replace('_', ' ')}.

${approachInstructions}

## Use Case Context:
${formatAssessmentContext(assessment)}

## Organization Policies:
${formatOrgPolicies(orgPolicies)}

## Applicable Regulations:
${identifyRegulations(assessment)}

## Your Analysis Must:
1. Identify subtle risk interactions between different assessment areas
2. Predict emergent risks that aren't immediately obvious  
3. Consider the temporal evolution of the system (current maturity: ${assessment.roadmapPosition?.currentAIMaturity}, target: ${assessment.roadmapPosition?.targetAIMaturity})
4. Balance competing concerns (safety, usability, cost, performance)
5. Provide specific, implementable guardrails (not generic advice)
6. Explain the reasoning behind each guardrail
7. Identify potential blind spots or areas needing human review
8. Consider second and third-order effects of decisions

## Critical Considerations:

### System Criticality: ${assessment.businessFeasibility?.systemCriticality || 'Not specified'}
${assessment.businessFeasibility?.systemCriticality === 'Mission Critical' ? 
  '⚠️ MISSION CRITICAL SYSTEM - Maximum safety measures required' : ''}

### User Population: ${assessment.businessFeasibility?.userCategories?.join(', ') || 'Not specified'}
${assessment.businessFeasibility?.userCategories?.includes('Minors/Children') ? 
  '⚠️ MINORS INVOLVED - Enhanced protections required' : ''}
${assessment.businessFeasibility?.userCategories?.includes('General Public') ? 
  '⚠️ PUBLIC FACING - Robust security and content safety required' : ''}

### Data Sensitivity: ${assessment.dataReadiness?.dataTypes?.join(', ') || 'Not specified'}
${assessment.dataReadiness?.dataTypes?.some(t => ['Health/Medical Records', 'Financial Records', 'Biometric Data'].includes(t)) ?
  '⚠️ HIGHLY SENSITIVE DATA - Maximum data protection required' : ''}

### Gen AI Specific:
${assessment.technicalFeasibility?.modelTypes?.includes('Generative AI') ? `
- Model Provider: ${assessment.technicalFeasibility?.modelProvider || 'Not specified'}
- Token Usage: ${assessment.budgetPlanning?.monthlyTokenVolume || 0} tokens/month
- Hallucination Tolerance: ${assessment.businessFeasibility?.maxHallucinationRate || 'Not specified'}%
- Agent Architecture: ${assessment.technicalFeasibility?.agentArchitecture || 'Not specified'}
- RAG System: ${assessment.technicalFeasibility?.ragArchitecture ? 'Yes' : 'No'}
` : 'Not a Gen AI use case'}

## Generate Guardrails Following This Enhanced Structure:
{
  "critical": {
    "description": "Non-negotiable safety guardrails that must be implemented",
    "guardrails": [
      {
        "id": "unique-id",
        "type": "content_safety|data_protection|human_oversight|compliance",
        "severity": "critical",
        "rule": "SPECIFIC_RULE_NAME",
        "description": "Clear description of what this guardrail does",
        "rationale": "Why this is necessary given the context",
        "implementation": {
          "platform": ["openai", "anthropic", "google", "aws", "azure", "all"],
          "configuration": {
            // Specific configuration details
          },
          "monitoring": [
            {
              "metric": "specific_metric",
              "threshold": "specific_value",
              "frequency": "realtime|1m|5m|hourly|daily",
              "alerting": {
                "channels": ["team-names"],
                "escalation": ["roles"]
              }
            }
          ]
        },
        "conditions": [
          // Trigger conditions if applicable
        ],
        "exceptions": [
          // Any exceptions to this rule
        ]
      }
    ]
  },
  
  "security_vulnerabilities": {
    "description": "Protection against prompt injection, jailbreaking, and adversarial attacks",
    "guardrails": [
      // Focus on: prompt injection, jailbreak prevention, adversarial input detection, output validation
    ]
  },
  
  "performance_sla": {
    "description": "Response time, throughput, and availability requirements",
    "guardrails": [
      // Focus on: latency enforcement, timeout configuration, circuit breakers, load balancing
    ]
  },
  
  "cost_optimization": {
    "description": "Token usage, API costs, and resource efficiency",
    "guardrails": [
      // Focus on: token budgets, context optimization, caching strategies, model selection
    ]
  },
  
  "data_governance": {
    "description": "Data minimization, retention, privacy, and drift monitoring",
    "guardrails": [
      // Focus on: PII protection, retention policies, cross-border transfers, model drift
    ]
  },
  
  "operational": {
    "description": "Performance and reliability guardrails",
    "guardrails": [
      // Similar structure
    ]
  },
  
  "ethical": {
    "description": "Fairness and bias mitigation guardrails",
    "guardrails": [
      // Similar structure
    ]
  },
  
  "economic": {
    "description": "Cost and resource management guardrails",
    "guardrails": [
      // Similar structure - can be merged with cost_optimization
    ]
  },
  
  "evolutionary": {
    "description": "How guardrails should adapt as system matures",
    "maturity_gates": [
      {
        "phase": "current_phase",
        "guardrails": [],
        "progression_criteria": [],
        "next_phase_adjustments": []
      }
    ],
    "rollback_triggers": [
      "specific conditions that trigger rollback"
    ]
  },
  
  "monitoring": {
    "description": "What to watch for",
    "key_metrics": [
      {
        "metric": "name",
        "description": "what it measures",
        "threshold": "alert threshold",
        "calculation": "how to calculate"
      }
    ],
    "audit_requirements": [
      {
        "audit_type": "type",
        "frequency": "frequency",
        "scope": "what to audit"
      }
    ]
  },
  
  "reasoning": {
    "key_insights": [
      "Major insights from your analysis"
    ],
    "tradeoffs": [
      {
        "decision": "what decision was made",
        "alternatives": ["what alternatives were considered"],
        "rationale": "why this was chosen"
      }
    ],
    "assumptions": [
      "Key assumptions made"
    ],
    "uncertainties": [
      "Areas of uncertainty that need monitoring"
    ],
    "blind_spots": [
      "Potential blind spots to be aware of"
    ]
  }
}

## Important Reasoning Guidelines:

1. **For Hallucination Risk**: If Max Hallucination Rate ≤ 1%, implement dual-model verification. If ≤ 5%, implement confidence thresholding. Always require source attribution for factual claims.

2. **For Prompt Injection**: Public-facing systems need multi-layer defense (input sanitization + prompt isolation + output validation + behavioral monitoring).

3. **For Cascading Failures**: If technical complexity > 7 OR integration points > 5, implement circuit breakers and graceful degradation.

4. **For Vulnerable Populations**: Minors require parental consent, age-appropriate content, no dark patterns, no behavioral manipulation. Elderly require simplified UI, scam protection.

5. **For Cross-Border Data**: Each jurisdiction pair needs specific transfer mechanism (SCCs for EU-US, localization for China/Russia).

6. **For Agent Systems**: Autonomy level must match human oversight. Fully autonomous requires kill switches, audit trails, and escalation paths.

7. **For Cost Optimization**: If monthly tokens > 10M, implement semantic caching. If > 50M, also add prompt compression and response optimization.

8. **For Evolution**: Systems moving from Basic ML to Agentic AI need progressive autonomy gates with validation criteria at each stage.

Remember: You're not just applying rules - you're reasoning about a complex socio-technical system with multiple stakeholders, evolving requirements, and uncertain futures. Think deeply about second and third-order effects.

Your response should be valid JSON that can be parsed directly.`;
}

function getApproachInstructions(approach: string): string {
  const instructions = {
    'conservative_safety': `
CONSERVATIVE SAFETY APPROACH:
- Prioritize safety and risk mitigation above all else
- Apply defense-in-depth strategies
- Require human oversight for any significant decisions
- Implement redundant safety mechanisms
- Choose more restrictive options when uncertain
- Add extra monitoring and validation layers
- Prefer fail-safe over fail-operational designs`,
    
    'balanced_practical': `
BALANCED PRACTICAL APPROACH:
- Balance safety with usability and efficiency
- Apply risk-proportionate controls
- Use automation where safe and beneficial
- Implement practical monitoring without overwhelming operators
- Choose pragmatic solutions that can be realistically implemented
- Focus on high-impact risks while accepting manageable low risks
- Design for gradual improvement over time`,
    
    'innovation_focused': `
INNOVATION FOCUSED APPROACH:
- Enable innovation while maintaining essential safety
- Minimize friction for legitimate use cases
- Leverage advanced techniques for efficiency
- Implement smart, adaptive controls
- Choose solutions that scale with growth
- Focus on outcome-based rather than prescriptive controls
- Design for rapid iteration and learning`
  };

  return instructions[approach] || instructions['balanced_practical'];
}

function formatAssessmentContext(assessment: ComprehensiveAssessment): string {
  // Format key assessment data for the prompt
  const context = {
    title: assessment.useCaseTitle,
    department: assessment.department,
    technical: {
      complexity: assessment.technicalFeasibility?.technicalComplexity,
      modelTypes: assessment.technicalFeasibility?.modelTypes,
      deployment: assessment.technicalFeasibility?.deploymentModels,
      integrations: assessment.technicalFeasibility?.integrationPoints?.length
    },
    business: {
      criticality: assessment.businessFeasibility?.systemCriticality,
      users: assessment.businessFeasibility?.userCategories,
      failureImpact: assessment.businessFeasibility?.failureImpact,
      concurrentUsers: assessment.businessFeasibility?.concurrentUsers
    },
    data: {
      types: assessment.dataReadiness?.dataTypes,
      volume: assessment.dataReadiness?.dataVolume,
      crossBorder: assessment.dataReadiness?.crossBorderTransfer,
      retention: assessment.dataReadiness?.dataRetention
    },
    ethical: {
      automationLevel: assessment.ethicalImpact?.decisionMaking?.automationLevel,
      humanOversight: assessment.ethicalImpact?.aiGovernance?.humanOversightLevel,
      biasRisk: assessment.ethicalImpact?.biasFairness
    },
    risk: {
      technical: assessment.riskAssessment?.technicalRisks,
      business: assessment.riskAssessment?.businessRisks,
      jurisdictions: assessment.riskAssessment?.dataProtection?.jurisdictions
    }
  };

  return JSON.stringify(context, null, 2);
}

function formatOrgPolicies(policies: any): string {
  if (!policies) {
    return `{
  "responsibleAI": ["Transparency", "Accountability", "Fairness"],
  "prohibitedUses": ["No automated decisions without oversight", "No biometric ID without consent"],
  "requiredSafeguards": ["Bias detection", "Incident response", "Performance monitoring"],
  "complianceFrameworks": ["ISO 42001", "Internal AI Ethics Framework"]
}`;
  }
  return JSON.stringify(policies, null, 2);
}

function identifyRegulations(assessment: ComprehensiveAssessment): string {
  const regulations = [];

  // Check for EU AI Act
  if (assessment.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)')) {
    regulations.push('EU AI Act - Determine risk classification');
  }

  // Check for GDPR
  if (assessment.dataReadiness?.dataTypes?.some(t => t.includes('Personal'))) {
    regulations.push('GDPR - Data protection and privacy');
  }

  // Check for HIPAA
  if (assessment.dataReadiness?.dataTypes?.includes('Health/Medical Records')) {
    regulations.push('HIPAA - Healthcare data protection');
  }

  // Check for financial regulations
  if (assessment.dataReadiness?.dataTypes?.includes('Financial Records')) {
    regulations.push('PCI-DSS - Payment card data');
    regulations.push('SOX - Financial reporting (if applicable)');
  }

  // Check for sector-specific
  if (assessment.riskAssessment?.sectorSpecific) {
    regulations.push(`Sector-specific: ${assessment.riskAssessment.sectorSpecific}`);
  }

  return regulations.length > 0 ? regulations.join('\n') : 'No specific regulations identified';
}

/**
 * Generate a prompt for validating guardrails
 */
export function generateValidationPrompt(
  guardrails: any,
  assessment: ComprehensiveAssessment
): string {
  return `As an AI Safety Expert, validate these guardrails for completeness and effectiveness:

## Proposed Guardrails:
${JSON.stringify(guardrails, null, 2)}

## Use Case Context:
${formatAssessmentContext(assessment)}

## Validation Criteria:
1. Are all critical risks addressed?
2. Are there any conflicting guardrails?
3. Are the guardrails implementable with current technology?
4. Do the guardrails allow the system to achieve its business objectives?
5. Are there any gaps in coverage?

## Identify:
- Missing guardrails
- Overly restrictive guardrails
- Implementation challenges
- Optimization opportunities

Provide a structured validation report.`;
}

/**
 * Generate a prompt for creating monitoring strategies
 */
export function generateMonitoringPrompt(
  guardrails: any,
  assessment: ComprehensiveAssessment
): string {
  return `Design a comprehensive monitoring strategy for these guardrails:

## Guardrails to Monitor:
${JSON.stringify(guardrails, null, 2)}

## System Characteristics:
- Criticality: ${assessment.businessFeasibility?.systemCriticality}
- Scale: ${assessment.businessFeasibility?.concurrentUsers} concurrent users
- Data Sensitivity: ${assessment.dataReadiness?.dataTypes?.join(', ')}

## Create Monitoring Strategy Including:
1. Key Performance Indicators (KPIs)
2. Key Risk Indicators (KRIs)
3. Alert thresholds and escalation paths
4. Dashboard design recommendations
5. Audit and reporting requirements

Format as actionable monitoring configuration.`;
}