import { ComprehensiveAssessment } from '../types';

export interface RiskPriority {
  riskName: string;
  score: number;
  category: string;
  requiredGuardrails: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Risk Analyzer Utility
 * Analyzes assessment data to identify high-risk areas that require critical guardrails
 */
export class RiskAnalyzer {
  private readonly CRITICAL_THRESHOLD = 4; // Risks scored ≥4 are critical
  private readonly HIGH_THRESHOLD = 3;     // Risks scored ≥3 are high priority

  /**
   * Analyze all risks in the assessment and prioritize them
   */
  analyzeRisks(assessment: ComprehensiveAssessment): RiskPriority[] {
    const risks: RiskPriority[] = [];

    // Analyze model risks
    if (assessment.riskAssessment?.modelRisks) {
      this.analyzeModelRisks(assessment.riskAssessment.modelRisks, risks);
    }

    // Analyze agent risks
    if (assessment.riskAssessment?.agentRisks) {
      this.analyzeAgentRisks(assessment.riskAssessment.agentRisks, risks);
    }

    // Analyze technical risks
    if (assessment.riskAssessment?.technicalRisks) {
      this.analyzeTechnicalRisks(assessment.riskAssessment.technicalRisks, risks);
    }

    // Analyze business risks
    if (assessment.riskAssessment?.businessRisks) {
      this.analyzeBusinessRisks(assessment.riskAssessment.businessRisks, risks);
    }

    // Analyze performance requirements as risks
    this.analyzePerformanceRisks(assessment, risks);

    // Analyze cost risks
    this.analyzeCostRisks(assessment, risks);

    // Analyze data risks
    this.analyzeDataRisks(assessment, risks);

    // Sort by severity and score
    return risks.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.score - a.score;
    });
  }

  private analyzeModelRisks(modelRisks: any, risks: RiskPriority[]) {
    const riskMappings: Record<string, string[]> = {
      'Prompt Injection Vulnerability': [
        'INPUT_SANITIZATION',
        'JAILBREAK_DETECTION',
        'OUTPUT_VALIDATION'
      ],
      'Model Hallucination Impact': [
        'FACT_VERIFICATION',
        'CONFIDENCE_THRESHOLDING',
        'SOURCE_ATTRIBUTION'
      ],
      'Model Drift/Degradation': [
        'DRIFT_MONITORING',
        'ACCURACY_TRACKING',
        'ROLLBACK_MECHANISM'
      ],
      'Adversarial Inputs': [
        'ADVERSARIAL_DETECTION',
        'INPUT_VALIDATION',
        'ANOMALY_DETECTION'
      ],
      'Data Poisoning Risk': [
        'DATA_VALIDATION',
        'TRAINING_DATA_AUDIT',
        'MODEL_VERSIONING'
      ]
    };

    Object.entries(modelRisks).forEach(([riskName, score]) => {
      if (typeof score === 'number' && score >= this.HIGH_THRESHOLD) {
        risks.push({
          riskName,
          score,
          category: 'model',
          requiredGuardrails: riskMappings[riskName] || ['GENERAL_MODEL_PROTECTION'],
          severity: score >= this.CRITICAL_THRESHOLD ? 'critical' : 'high'
        });
      }
    });
  }

  private analyzeAgentRisks(agentRisks: any, risks: RiskPriority[]) {
    const riskMappings: Record<string, string[]> = {
      'Cascading Failures': [
        'CIRCUIT_BREAKERS',
        'GRACEFUL_DEGRADATION',
        'FAILURE_ISOLATION'
      ],
      'Resource Exhaustion': [
        'RESOURCE_LIMITS',
        'RATE_LIMITING',
        'QUOTA_MANAGEMENT'
      ],
      'Unauthorized Actions': [
        'ACTION_VALIDATION',
        'PERMISSION_CHECKS',
        'AUDIT_LOGGING'
      ],
      'Infinite Loops/Recursion': [
        'LOOP_DETECTION',
        'TIMEOUT_CONTROLS',
        'RECURSION_LIMITS'
      ]
    };

    Object.entries(agentRisks).forEach(([riskName, score]) => {
      if (typeof score === 'number' && score >= this.HIGH_THRESHOLD) {
        risks.push({
          riskName,
          score,
          category: 'agent',
          requiredGuardrails: riskMappings[riskName] || ['AGENT_CONTROL'],
          severity: score >= this.CRITICAL_THRESHOLD ? 'critical' : 'high'
        });
      }
    });
  }

  private analyzeTechnicalRisks(technicalRisks: any[], risks: RiskPriority[]) {
    technicalRisks.forEach(risk => {
      const impactScore = this.getImpactScore(risk.impact);
      const probabilityScore = this.getProbabilityScore(risk.probability);
      const combinedScore = (impactScore + probabilityScore) / 2;

      if (combinedScore >= this.HIGH_THRESHOLD) {
        risks.push({
          riskName: risk.risk,
          score: combinedScore,
          category: 'technical',
          requiredGuardrails: this.mapTechnicalRiskToGuardrails(risk.risk),
          severity: combinedScore >= this.CRITICAL_THRESHOLD ? 'critical' : 'high'
        });
      }
    });
  }

  private analyzeBusinessRisks(businessRisks: any[], risks: RiskPriority[]) {
    businessRisks.forEach(risk => {
      const impactScore = this.getImpactScore(risk.impact);
      const probabilityScore = this.getProbabilityScore(risk.probability);
      const combinedScore = (impactScore + probabilityScore) / 2;

      if (combinedScore >= this.HIGH_THRESHOLD) {
        risks.push({
          riskName: risk.risk,
          score: combinedScore,
          category: 'business',
          requiredGuardrails: this.mapBusinessRiskToGuardrails(risk.risk),
          severity: combinedScore >= this.CRITICAL_THRESHOLD ? 'critical' : 'high'
        });
      }
    });
  }

  private analyzePerformanceRisks(assessment: ComprehensiveAssessment, risks: RiskPriority[]) {
    // Check response time requirement
    const responseTime = assessment.businessFeasibility?.responseTimeRequirement;
    if (responseTime && responseTime.includes('s')) {
      const seconds = parseInt(responseTime.split('-')[1] || responseTime);
      if (seconds <= 30) {
        risks.push({
          riskName: 'Strict Response Time Requirement',
          score: seconds <= 5 ? 5 : 4,
          category: 'performance',
          requiredGuardrails: [
            'RESPONSE_TIME_ENFORCEMENT',
            'TIMEOUT_CONFIGURATION',
            'CACHING_STRATEGY'
          ],
          severity: seconds <= 5 ? 'critical' : 'high'
        });
      }
    }

    // Check availability requirement
    const availability = assessment.businessFeasibility?.availabilityRequirement;
    if (availability && availability.includes('99')) {
      const nines = (availability.match(/9/g) || []).length;
      if (nines >= 2) {
        risks.push({
          riskName: 'High Availability Requirement',
          score: nines >= 3 ? 5 : 4,
          category: 'performance',
          requiredGuardrails: [
            'AVAILABILITY_MONITORING',
            'FAILOVER_MECHANISM',
            'LOAD_BALANCING'
          ],
          severity: nines >= 3 ? 'critical' : 'high'
        });
      }
    }
  }

  private analyzeCostRisks(assessment: ComprehensiveAssessment, risks: RiskPriority[]) {
    const monthlyTokens = assessment.budgetPlanning?.monthlyTokenVolume || 0;
    const totalInvestment = assessment.financialConstraints?.totalInvestment || 0;

    // High token volume risk
    if (monthlyTokens > 100000) {
      risks.push({
        riskName: 'High Token Usage Volume',
        score: monthlyTokens > 1000000 ? 5 : 4,
        category: 'cost',
        requiredGuardrails: [
          'TOKEN_BUDGET_ALERTS',
          'TOKEN_OPTIMIZATION',
          'CONTEXT_COMPRESSION'
        ],
        severity: monthlyTokens > 1000000 ? 'critical' : 'high'
      });
    }

    // High investment risk
    if (totalInvestment > 100000) {
      risks.push({
        riskName: 'Significant Financial Investment',
        score: totalInvestment > 500000 ? 5 : 4,
        category: 'cost',
        requiredGuardrails: [
          'COST_MONITORING',
          'BUDGET_ENFORCEMENT',
          'ROI_TRACKING'
        ],
        severity: totalInvestment > 500000 ? 'critical' : 'high'
      });
    }
  }

  private analyzeDataRisks(assessment: ComprehensiveAssessment, risks: RiskPriority[]) {
    const dataTypes = assessment.dataReadiness?.dataTypes || [];
    const sensitiveTypes = ['Health/Medical Records', 'Financial Records', 'Biometric Data'];
    
    const hasSensitiveData = dataTypes.some(type => sensitiveTypes.includes(type));
    if (hasSensitiveData) {
      risks.push({
        riskName: 'Sensitive Data Handling',
        score: 5,
        category: 'data',
        requiredGuardrails: [
          'DATA_ENCRYPTION',
          'ACCESS_CONTROL',
          'AUDIT_LOGGING',
          'DATA_MINIMIZATION'
        ],
        severity: 'critical'
      });
    }

    // Cross-border data transfer
    if (assessment.dataReadiness?.crossBorderTransfer) {
      risks.push({
        riskName: 'Cross-Border Data Transfer',
        score: 4,
        category: 'data',
        requiredGuardrails: [
          'DATA_LOCALIZATION',
          'TRANSFER_AGREEMENTS',
          'JURISDICTION_COMPLIANCE'
        ],
        severity: 'high'
      });
    }

    // Data minimization not enabled
    if (!assessment.ethicalImpact?.privacySecurity?.dataMinimization) {
      risks.push({
        riskName: 'Data Minimization Not Enabled',
        score: 3,
        category: 'data',
        requiredGuardrails: [
          'DATA_MINIMIZATION_POLICY',
          'FIELD_LEVEL_ACCESS',
          'PURPOSE_LIMITATION'
        ],
        severity: 'high'
      });
    }
  }

  private getImpactScore(impact: string): number {
    const scores: Record<string, number> = {
      'Critical': 5,
      'High': 4,
      'Medium': 3,
      'Low': 2,
      'None': 1
    };
    return scores[impact] || 1;
  }

  private getProbabilityScore(probability: string): number {
    const scores: Record<string, number> = {
      'Critical': 5,
      'High': 4,
      'Medium': 3,
      'Low': 2,
      'None': 1
    };
    return scores[probability] || 1;
  }

  private mapTechnicalRiskToGuardrails(risk: string): string[] {
    const mappings: Record<string, string[]> = {
      'Model accuracy degradation': ['ACCURACY_MONITORING', 'DRIFT_DETECTION', 'MODEL_RETRAINING'],
      'Data quality issues': ['DATA_VALIDATION', 'QUALITY_METRICS', 'DATA_CLEANSING'],
      'Integration failures': ['INTEGRATION_TESTING', 'FALLBACK_SYSTEMS', 'ERROR_HANDLING']
    };
    return mappings[risk] || ['TECHNICAL_MONITORING'];
  }

  private mapBusinessRiskToGuardrails(risk: string): string[] {
    const mappings: Record<string, string[]> = {
      'User adoption resistance': ['USER_TRAINING', 'CHANGE_MANAGEMENT', 'FEEDBACK_LOOPS'],
      'Regulatory changes': ['COMPLIANCE_MONITORING', 'REGULATORY_UPDATES', 'AUDIT_READINESS'],
      'Competitive response': ['MARKET_MONITORING', 'FEATURE_PROTECTION', 'INNOVATION_TRACKING']
    };
    return mappings[risk] || ['BUSINESS_MONITORING'];
  }

  /**
   * Get critical guardrails that must be implemented
   */
  getCriticalGuardrails(risks: RiskPriority[]): string[] {
    const criticalGuardrails = new Set<string>();
    
    risks
      .filter(risk => risk.severity === 'critical')
      .forEach(risk => {
        risk.requiredGuardrails.forEach(guardrail => {
          criticalGuardrails.add(guardrail);
        });
      });

    return Array.from(criticalGuardrails);
  }
}