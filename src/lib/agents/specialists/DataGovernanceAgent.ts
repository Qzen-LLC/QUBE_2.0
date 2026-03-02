import { SpecialistAgent } from '../specialist-agent';
import { GuardrailsContext, AgentProposal, Guardrail } from '../types';

/**
 * Data Governance Specialist Agent
 * Focuses on data minimization, retention, privacy, drift monitoring, and compliance
 */
export class DataGovernanceAgent extends SpecialistAgent {
  name = 'data_governance';
  description = 'Data governance, privacy, and compliance specialist';

  async analyze(context: GuardrailsContext): Promise<AgentProposal> {
    const guardrails: Guardrail[] = [];
    const insights: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze data types and sensitivity
    const dataTypes = context.dataReadiness?.dataTypes || [];
    const sensitiveTypes = ['Health/Medical Records', 'Financial Records', 'Biometric Data', 'Personal Data'];
    const hasSensitiveData = dataTypes.some(type => sensitiveTypes.some(st => type.includes(st)));
    
    if (hasSensitiveData) {
      this.analyzeSensitiveData(dataTypes, context, guardrails, concerns);
    }

    // Analyze data minimization
    const dataMinimization = context.ethicalImpact?.privacySecurity?.dataMinimization;
    if (!dataMinimization) {
      this.analyzeDataMinimization(context, guardrails, recommendations);
    }

    // Analyze data retention
    const dataRetention = context.dataReadiness?.dataRetention;
    if (dataRetention) {
      this.analyzeDataRetention(dataRetention, guardrails, insights);
    }

    // Analyze cross-border data transfer
    const crossBorderTransfer = context.dataReadiness?.crossBorderTransfer;
    if (crossBorderTransfer) {
      this.analyzeCrossBorderTransfer(context, guardrails, concerns);
    }

    // Analyze model drift risk
    const modelDriftRisk = context.riskAssessment?.modelRisks?.['Model Drift/Degradation'];
    if (modelDriftRisk >= 3) {
      this.analyzeModelDrift(modelDriftRisk, guardrails, insights);
    }

    // Analyze compliance requirements
    const compliance = context.complianceRequirements || {};
    this.analyzeCompliance(compliance, guardrails, recommendations);

    // Analyze data quality
    const dataQualityScore = context.dataReadiness?.dataQualityScore;
    if (dataQualityScore < 8) {
      this.analyzeDataQuality(dataQualityScore, guardrails, concerns);
    }

    // Generate LLM-based guardrails
    // TODO: Enable when LLM service is properly initialized
    // if (this.llmService) {
    //   const llmGuardrails = await this.generateLLMGuardrails(context);
    //   guardrails.push(...llmGuardrails);
    // }

    return {
      agentName: this.name,
      guardrails,
      insights,
      concerns,
      recommendations,
      confidence: this.calculateConfidence(guardrails, insights, concerns)
    };
  }

  private analyzeSensitiveData(
    dataTypes: string[],
    context: GuardrailsContext,
    guardrails: Guardrail[],
    concerns: string[]
  ) {
    // Data encryption
    guardrails.push({
      id: `gov-encrypt-${Date.now()}`,
      type: 'data_governance',
      severity: 'critical',
      rule: 'DATA_ENCRYPTION',
      description: 'Encrypt sensitive data at rest and in transit',
      rationale: `Handling sensitive data: ${dataTypes.join(', ')}`,
      implementation: {
        platform: ['all'],
        configuration: {
          encryption_at_rest: {
            algorithm: 'AES-256-GCM',
            key_management: 'HSM',
            key_rotation: 90
          },
          encryption_in_transit: {
            protocol: 'TLS 1.3',
            cipher_suites: ['TLS_AES_256_GCM_SHA384'],
            certificate_validation: true
          }
        },
        monitoring: [{
          metric: 'encryption_failures',
          threshold: '0',
          frequency: 'realtime'
        }]
      }
    });

    // Access control
    guardrails.push({
      id: `gov-access-${Date.now()}`,
      type: 'data_governance',
      severity: 'critical',
      rule: 'DATA_ACCESS_CONTROL',
      description: 'Implement role-based access control for sensitive data',
      rationale: 'Limit access to sensitive information',
      implementation: {
        platform: ['all'],
        configuration: {
          rbac_enabled: true,
          principle_of_least_privilege: true,
          access_review_frequency: 'quarterly',
          mfa_required: true,
          audit_all_access: true
        }
      }
    });

    // PII detection and masking
    guardrails.push({
      id: `gov-pii-mask-${Date.now()}`,
      type: 'data_governance',
      severity: 'high',
      rule: 'PII_DETECTION_MASKING',
      description: 'Automatically detect and mask PII',
      rationale: 'Prevent unintended PII exposure',
      implementation: {
        platform: ['all'],
        configuration: {
          detection_methods: ['regex', 'ml_classifier', 'dictionary'],
          masking_strategy: 'tokenization',
          pii_types: ['ssn', 'email', 'phone', 'address', 'name', 'dob'],
          unmask_permission_required: true
        }
      }
    });

    concerns.push(`Sensitive data types (${dataTypes.join(', ')}) require comprehensive protection`);
  }

  private analyzeDataMinimization(
    context: GuardrailsContext,
    guardrails: Guardrail[],
    recommendations: string[]
  ) {
    guardrails.push({
      id: `gov-minimize-${Date.now()}`,
      type: 'data_governance',
      severity: 'high',
      rule: 'DATA_MINIMIZATION_POLICY',
      description: 'Collect only necessary data for stated purpose',
      rationale: 'Reduce privacy risk and compliance burden',
      implementation: {
        platform: ['all'],
        configuration: {
          field_justification_required: true,
          purpose_limitation: true,
          collection_review_frequency: 'monthly',
          automatic_field_removal: true,
          unused_data_detection: true
        }
      }
    });

    // Field-level access control
    guardrails.push({
      id: `gov-field-access-${Date.now()}`,
      type: 'data_governance',
      severity: 'medium',
      rule: 'FIELD_LEVEL_ACCESS_CONTROL',
      description: 'Control access at field level',
      rationale: 'Implement granular data minimization',
      implementation: {
        platform: ['all'],
        configuration: {
          sensitive_fields: ['ssn', 'dob', 'medical_history'],
          access_levels: ['full', 'partial', 'masked', 'none'],
          default_access: 'masked'
        }
      }
    });

    recommendations.push('Implement data minimization to reduce privacy risks and storage costs');
  }

  private analyzeDataRetention(
    dataRetention: string,
    guardrails: Guardrail[],
    insights: string[]
  ) {
    // Parse retention period
    const retentionYears = parseInt(dataRetention.match(/\d+/)?.[0] || '7');

    guardrails.push({
      id: `gov-retention-${Date.now()}`,
      type: 'data_governance',
      severity: 'high',
      rule: 'DATA_RETENTION_POLICY',
      description: `Enforce ${dataRetention} retention policy`,
      rationale: 'Comply with data retention requirements',
      implementation: {
        platform: ['all'],
        configuration: {
          retention_period_days: retentionYears * 365,
          auto_deletion: true,
          deletion_verification: true,
          legal_hold_support: true,
          backup_retention: retentionYears * 365 + 90
        },
        monitoring: [{
          metric: 'data_age_violations',
          threshold: '0',
          frequency: 'weekly'
        }]
      }
    });

    // Data lifecycle management
    guardrails.push({
      id: `gov-lifecycle-${Date.now()}`,
      type: 'data_governance',
      severity: 'medium',
      rule: 'DATA_LIFECYCLE_MANAGEMENT',
      description: 'Manage data through its lifecycle',
      rationale: 'Ensure proper data handling at each stage',
      implementation: {
        platform: ['all'],
        configuration: {
          lifecycle_stages: ['collection', 'processing', 'storage', 'archival', 'deletion'],
          stage_transitions_logged: true,
          automated_archival: true,
          archival_after_days: 180
        }
      }
    });

    insights.push(`Data retention period of ${dataRetention} requires automated lifecycle management`);
  }

  private analyzeCrossBorderTransfer(
    context: GuardrailsContext,
    guardrails: Guardrail[],
    concerns: string[]
  ) {
    guardrails.push({
      id: `gov-cross-border-${Date.now()}`,
      type: 'data_governance',
      severity: 'critical',
      rule: 'CROSS_BORDER_DATA_CONTROL',
      description: 'Control cross-border data transfers',
      rationale: 'Comply with data localization requirements',
      implementation: {
        platform: ['all'],
        configuration: {
          transfer_mechanisms: ['SCCs', 'BCRs', 'adequacy_decisions'],
          data_localization_required: true,
          transfer_impact_assessment: true,
          approved_countries: [],
          blocked_countries: ['sanctioned_countries']
        }
      }
    });

    // Data residency
    guardrails.push({
      id: `gov-residency-${Date.now()}`,
      type: 'data_governance',
      severity: 'high',
      rule: 'DATA_RESIDENCY',
      description: 'Ensure data residency compliance',
      rationale: 'Meet jurisdictional requirements',
      implementation: {
        platform: ['all'],
        configuration: {
          primary_region: context.dataReadiness?.dataStorageLocations || 'us-east-1',
          allowed_regions: ['us', 'eu'],
          geo_fencing: true,
          residency_verification: true
        }
      }
    });

    concerns.push('Cross-border data transfers require careful compliance management');
  }

  private analyzeModelDrift(
    driftRisk: number,
    guardrails: Guardrail[],
    insights: string[]
  ) {
    guardrails.push({
      id: `gov-drift-monitor-${Date.now()}`,
      type: 'data_governance',
      severity: driftRisk >= 4 ? 'critical' : 'high',
      rule: 'MODEL_DRIFT_MONITORING',
      description: 'Monitor model performance for drift',
      rationale: `Model drift risk: ${driftRisk}/5`,
      implementation: {
        platform: ['all'],
        configuration: {
          metrics: ['accuracy', 'precision', 'recall', 'f1_score'],
          baseline_comparison: true,
          drift_detection_methods: ['PSI', 'KS_test', 'chi_square'],
          threshold_degradation: 0.05,
          monitoring_frequency: 'daily'
        },
        monitoring: [{
          metric: 'model_accuracy',
          threshold: '-5%',
          frequency: 'daily'
        }]
      }
    });

    // Data drift monitoring
    guardrails.push({
      id: `gov-data-drift-${Date.now()}`,
      type: 'data_governance',
      severity: 'medium',
      rule: 'DATA_DRIFT_DETECTION',
      description: 'Detect drift in input data distribution',
      rationale: 'Identify when model inputs change significantly',
      implementation: {
        platform: ['all'],
        configuration: {
          feature_monitoring: true,
          distribution_tracking: true,
          anomaly_detection: true,
          alert_threshold: 0.1
        }
      }
    });

    insights.push('Model drift monitoring essential for maintaining performance over time');
  }

  private analyzeCompliance(
    compliance: any,
    guardrails: Guardrail[],
    recommendations: string[]
  ) {
    // GDPR compliance
    if (compliance.gdpr) {
      guardrails.push({
        id: `gov-gdpr-${Date.now()}`,
        type: 'data_governance',
        severity: 'critical',
        rule: 'GDPR_COMPLIANCE',
        description: 'Ensure GDPR compliance',
        rationale: 'Legal requirement for EU data',
        implementation: {
          platform: ['all'],
          configuration: {
            consent_management: true,
            right_to_erasure: true,
            data_portability: true,
            privacy_by_design: true,
            dpia_required: true
          }
        }
      });
    }

    // HIPAA compliance
    if (compliance.hipaa) {
      guardrails.push({
        id: `gov-hipaa-${Date.now()}`,
        type: 'data_governance',
        severity: 'critical',
        rule: 'HIPAA_COMPLIANCE',
        description: 'Ensure HIPAA compliance for health data',
        rationale: 'Legal requirement for health information',
        implementation: {
          platform: ['all'],
          configuration: {
            phi_encryption: true,
            access_controls: 'role_based',
            audit_logs: true,
            business_associate_agreements: true,
            minimum_necessary_standard: true
          }
        }
      });
    }

    const activeCompliance = Object.keys(compliance).filter(k => compliance[k]);
    if (activeCompliance.length > 0) {
      recommendations.push(`Implement compliance framework for: ${activeCompliance.join(', ')}`);
    }
  }

  private analyzeDataQuality(
    qualityScore: number | undefined,
    guardrails: Guardrail[],
    concerns: string[]
  ) {
    if (!qualityScore || qualityScore < 8) {
      guardrails.push({
        id: `gov-quality-${Date.now()}`,
        type: 'data_governance',
        severity: 'medium',
        rule: 'DATA_QUALITY_MONITORING',
        description: 'Monitor and improve data quality',
        rationale: `Current quality score: ${qualityScore || 'Unknown'}/10`,
        implementation: {
          platform: ['all'],
          configuration: {
            quality_metrics: ['completeness', 'accuracy', 'consistency', 'timeliness'],
            validation_rules: true,
            anomaly_detection: true,
            quality_threshold: 0.8,
            automated_cleansing: true
          }
        }
      });
      concerns.push(`Data quality score (${qualityScore}/10) needs improvement`);
    }
  }

  private async generateLLMGuardrails(context: GuardrailsContext): Promise<Guardrail[]> {
    const prompt = `Generate data governance guardrails for an AI system with:
    - Data Types: ${context.dataReadiness?.dataTypes?.join(', ') || 'Not specified'}
    - Data Volume: ${context.dataReadiness?.dataVolume || 'Not specified'}
    - Data Retention: ${context.dataReadiness?.dataRetention || 'Not specified'}
    - Cross-Border Transfer: ${context.dataReadiness?.crossBorderTransfer ? 'Yes' : 'No'}
    - Compliance: ${Object.keys(context.complianceRequirements || {}).filter(k => context.complianceRequirements[k]).join(', ') || 'None'}
    
    Focus on:
    1. Data minimization and purpose limitation
    2. PII detection and protection
    3. Retention and lifecycle management
    4. Model and data drift monitoring
    5. Compliance requirements
    
    Return specific, implementable data governance guardrails.`;

    try {
      // const response = await this.llmService.generateGuardrails(prompt, 'governance');
      // return this.parseGuardrails(response);
      console.warn('LLM service not available for DataGovernanceAgent');
      return [];
    } catch (error) {
      console.error('DataGovernanceAgent LLM generation failed:', error);
      return [];
    }
  }
}