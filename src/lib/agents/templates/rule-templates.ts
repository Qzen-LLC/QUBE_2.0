/**
 * Rule Generation Templates
 * Provides standardized templates for generating specific types of guardrail rules
 */

export interface RuleTemplate {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  description: string;
  rationale: string;
  implementation: {
    platform: string[];
    configuration: Record<string, any>;
    monitoring?: Array<{
      metric: string;
      threshold: string;
      frequency: string;
    }>;
  };
  conditions?: string[];
  exceptions?: string[];
}

/**
 * Security Rule Templates
 */
export const SecurityRuleTemplates = {
  PROMPT_INJECTION_DEFENSE: (risk: number): RuleTemplate => ({
    id: `sec-prompt-injection-${Date.now()}`,
    type: 'security',
    severity: risk >= 4 ? 'critical' : 'high',
    rule: 'PROMPT_INJECTION_DEFENSE',
    description: 'Multi-layer defense against prompt injection attacks',
    rationale: `Prompt injection risk level ${risk}/5 requires comprehensive protection`,
    implementation: {
      platform: ['all'],
      configuration: {
        input_validation: {
          max_length: 4000,
          encoding_validation: true,
          special_char_escape: true
        },
        detection_patterns: [
          '/ignore.*previous.*instructions/i',
          '/disregard.*all.*prior/i',
          '/###SYSTEM/i',
          '/ADMIN_OVERRIDE/i',
          '/DAN mode/i',
          '/developer mode/i'
        ],
        response_validation: {
          check_for_system_commands: true,
          check_for_code_execution: true,
          quarantine_suspicious: true
        },
        rate_limiting: {
          suspicious_patterns_per_hour: 5,
          block_duration_minutes: 60
        }
      },
      monitoring: [
        {
          metric: 'injection_attempts_blocked',
          threshold: '10',
          frequency: '5m'
        },
        {
          metric: 'suspicious_pattern_rate',
          threshold: '5/hour',
          frequency: 'realtime'
        }
      ]
    },
    conditions: ['user_input.length > 100'],
    exceptions: ['trusted_users', 'internal_api_calls']
  }),

  JAILBREAK_PREVENTION: (): RuleTemplate => ({
    id: `sec-jailbreak-${Date.now()}`,
    type: 'security',
    severity: 'critical',
    rule: 'JAILBREAK_PREVENTION',
    description: 'Prevent attempts to bypass AI safety controls',
    rationale: 'Jailbreak attempts can compromise system integrity',
    implementation: {
      platform: ['all'],
      configuration: {
        detection_keywords: [
          'ignore safety',
          'bypass restrictions',
          'pretend you are',
          'act as',
          'roleplay',
          'simulate'
        ],
        behavioral_monitoring: {
          track_request_patterns: true,
          anomaly_detection: true,
          baseline_deviation_threshold: 0.3
        },
        response_actions: {
          block_request: true,
          alert_security_team: true,
          log_full_context: true
        }
      },
      monitoring: [
        {
          metric: 'jailbreak_attempts',
          threshold: '3',
          frequency: '1h'
        }
      ]
    }
  }),

  DATA_ENCRYPTION: (dataTypes: string[]): RuleTemplate => ({
    id: `sec-encryption-${Date.now()}`,
    type: 'security',
    severity: 'critical',
    rule: 'DATA_ENCRYPTION_AT_REST_AND_TRANSIT',
    description: 'Comprehensive encryption for sensitive data',
    rationale: `Protecting sensitive data types: ${dataTypes.join(', ')}`,
    implementation: {
      platform: ['all'],
      configuration: {
        at_rest: {
          algorithm: 'AES-256-GCM',
          key_management: 'AWS_KMS',
          key_rotation_days: 90,
          envelope_encryption: true
        },
        in_transit: {
          protocol: 'TLS_1_3',
          cipher_suites: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256'
          ],
          certificate_pinning: true,
          mutual_tls: false
        },
        field_level_encryption: {
          enabled: true,
          fields: ['ssn', 'credit_card', 'medical_record']
        }
      },
      monitoring: [
        {
          metric: 'encryption_failures',
          threshold: '0',
          frequency: 'realtime'
        }
      ]
    }
  })
};

/**
 * Performance Rule Templates
 */
export const PerformanceRuleTemplates = {
  RESPONSE_TIME_SLA: (minTime: number, maxTime: number): RuleTemplate => ({
    id: `perf-sla-${Date.now()}`,
    type: 'performance',
    severity: maxTime <= 5 ? 'critical' : 'high',
    rule: 'RESPONSE_TIME_SLA',
    description: `Enforce response time between ${minTime}-${maxTime} seconds`,
    rationale: 'Meet user experience and business requirements',
    implementation: {
      platform: ['all'],
      configuration: {
        timeout_ms: maxTime * 1000,
        warning_threshold_ms: maxTime * 800,
        optimization: {
          enable_caching: true,
          cache_ttl_seconds: 300,
          enable_compression: true,
          connection_pooling: true,
          pool_size: 50
        },
        circuit_breaker: {
          enabled: true,
          failure_threshold: 5,
          timeout_ms: 30000,
          reset_timeout_ms: 60000
        },
        retry_policy: {
          max_attempts: 3,
          backoff_type: 'exponential',
          initial_delay_ms: 100,
          max_delay_ms: 5000
        }
      },
      monitoring: [
        {
          metric: 'p95_latency',
          threshold: `${maxTime}s`,
          frequency: '1m'
        },
        {
          metric: 'p99_latency',
          threshold: `${maxTime * 1.5}s`,
          frequency: '1m'
        }
      ]
    }
  }),

  HIGH_AVAILABILITY: (availabilityTarget: string): RuleTemplate => ({
    id: `perf-ha-${Date.now()}`,
    type: 'performance',
    severity: 'critical',
    rule: 'HIGH_AVAILABILITY_CONFIGURATION',
    description: `Maintain ${availabilityTarget} availability`,
    rationale: 'Business-critical system requires high availability',
    implementation: {
      platform: ['all'],
      configuration: {
        deployment: {
          multi_region: true,
          min_regions: 2,
          active_active: true,
          auto_failover: true
        },
        load_balancing: {
          algorithm: 'least_connections',
          health_check_interval_ms: 5000,
          unhealthy_threshold: 2,
          healthy_threshold: 3
        },
        redundancy: {
          min_instances_per_region: 3,
          auto_scaling: true,
          scale_up_threshold: 70,
          scale_down_threshold: 30
        },
        backup: {
          automated_backups: true,
          backup_frequency: 'hourly',
          retention_days: 30,
          cross_region_replication: true
        }
      },
      monitoring: [
        {
          metric: 'availability_percentage',
          threshold: availabilityTarget,
          frequency: '1m'
        },
        {
          metric: 'healthy_instances',
          threshold: '>=3',
          frequency: '30s'
        }
      ]
    }
  }),

  THROUGHPUT_OPTIMIZATION: (requestsPerSecond: number): RuleTemplate => ({
    id: `perf-throughput-${Date.now()}`,
    type: 'performance',
    severity: 'high',
    rule: 'THROUGHPUT_OPTIMIZATION',
    description: `Optimize for ${requestsPerSecond} requests per second`,
    rationale: 'Handle expected load with headroom for spikes',
    implementation: {
      platform: ['all'],
      configuration: {
        concurrency: {
          worker_threads: Math.max(4, Math.ceil(requestsPerSecond / 100)),
          connection_pool_size: Math.max(100, requestsPerSecond * 2),
          queue_size: requestsPerSecond * 10
        },
        batching: {
          enabled: true,
          batch_size: Math.min(100, Math.ceil(requestsPerSecond / 10)),
          batch_timeout_ms: 100
        },
        rate_limiting: {
          enabled: true,
          requests_per_second: requestsPerSecond * 1.5,
          burst_size: requestsPerSecond * 2,
          per_user_limit: Math.ceil(requestsPerSecond / 100)
        }
      },
      monitoring: [
        {
          metric: 'requests_per_second',
          threshold: `${requestsPerSecond}`,
          frequency: '10s'
        }
      ]
    }
  })
};

/**
 * Cost Optimization Rule Templates
 */
export const CostRuleTemplates = {
  TOKEN_BUDGET_MANAGEMENT: (monthlyTokens: number, costPerToken: number = 0.00002): RuleTemplate => ({
    id: `cost-token-budget-${Date.now()}`,
    type: 'cost_optimization',
    severity: monthlyTokens > 1000000 ? 'critical' : 'high',
    rule: 'TOKEN_BUDGET_MANAGEMENT',
    description: `Manage monthly token budget of ${monthlyTokens.toLocaleString()}`,
    rationale: `Control costs with budget of $${(monthlyTokens * costPerToken).toFixed(2)}/month`,
    implementation: {
      platform: ['all'],
      configuration: {
        budget: {
          monthly_tokens: monthlyTokens,
          daily_tokens: Math.ceil(monthlyTokens / 30),
          hourly_tokens: Math.ceil(monthlyTokens / 720)
        },
        alerts: {
          warning_threshold: 0.7,
          critical_threshold: 0.9,
          hard_limit: 1.0
        },
        optimization: {
          context_compression: true,
          compression_ratio: 0.6,
          cache_common_queries: true,
          cache_ttl: 3600,
          batch_similar_requests: true
        },
        enforcement: {
          soft_limit_action: 'alert',
          hard_limit_action: 'block',
          rate_limit_on_budget_exceed: true
        }
      },
      monitoring: [
        {
          metric: 'token_usage_percentage',
          threshold: '80%',
          frequency: 'hourly'
        },
        {
          metric: 'daily_token_consumption',
          threshold: `${Math.ceil(monthlyTokens / 30)}`,
          frequency: 'daily'
        }
      ]
    }
  }),

  CONTEXT_OPTIMIZATION: (avgInputTokens: number): RuleTemplate => ({
    id: `cost-context-opt-${Date.now()}`,
    type: 'cost_optimization',
    severity: avgInputTokens > 3000 ? 'high' : 'medium',
    rule: 'CONTEXT_WINDOW_OPTIMIZATION',
    description: `Optimize context from ${avgInputTokens} tokens`,
    rationale: `Reduce token usage by ${Math.min(40, avgInputTokens / 100)}%`,
    implementation: {
      platform: ['all'],
      configuration: {
        strategies: {
          sliding_window: {
            enabled: true,
            window_size: Math.min(2000, avgInputTokens * 0.5),
            overlap: 100
          },
          summarization: {
            enabled: avgInputTokens > 2000,
            summarize_after: 1000,
            summary_ratio: 0.3
          },
          selective_history: {
            enabled: true,
            keep_recent: 5,
            importance_scoring: true
          },
          compression: {
            enabled: true,
            algorithm: 'semantic',
            target_ratio: 0.6
          }
        },
        limits: {
          max_context_tokens: Math.min(4000, avgInputTokens),
          max_history_messages: 20
        }
      },
      monitoring: [
        {
          metric: 'avg_context_size',
          threshold: `${avgInputTokens * 0.7}`,
          frequency: 'hourly'
        }
      ]
    }
  }),

  MODEL_SELECTION_OPTIMIZATION: (): RuleTemplate => ({
    id: `cost-model-select-${Date.now()}`,
    type: 'cost_optimization',
    severity: 'medium',
    rule: 'INTELLIGENT_MODEL_SELECTION',
    description: 'Select optimal model based on task complexity',
    rationale: 'Reduce costs by 50-90% using appropriate models',
    implementation: {
      platform: ['all'],
      configuration: {
        model_tiers: {
          simple: {
            model: 'gpt-3.5-turbo',
            max_tokens: 500,
            use_for: ['classification', 'extraction', 'simple_qa']
          },
          moderate: {
            model: 'gpt-4',
            max_tokens: 1000,
            use_for: ['summarization', 'analysis', 'complex_qa']
          },
          complex: {
            model: 'gpt-4-turbo',
            max_tokens: 2000,
            use_for: ['generation', 'reasoning', 'code']
          }
        },
        routing_logic: {
          complexity_detection: true,
          confidence_threshold: 0.8,
          fallback_enabled: true
        },
        cost_optimization: {
          prefer_cheaper_models: true,
          quality_threshold: 0.85,
          cost_weight: 0.6
        }
      },
      monitoring: [
        {
          metric: 'model_cost_savings',
          threshold: '30%',
          frequency: 'daily'
        }
      ]
    }
  })
};

/**
 * Data Governance Rule Templates
 */
export const DataGovernanceRuleTemplates = {
  DATA_MINIMIZATION: (): RuleTemplate => ({
    id: `gov-minimize-${Date.now()}`,
    type: 'data_governance',
    severity: 'high',
    rule: 'DATA_MINIMIZATION_ENFORCEMENT',
    description: 'Collect and process only necessary data',
    rationale: 'Reduce privacy risks and compliance burden',
    implementation: {
      platform: ['all'],
      configuration: {
        collection: {
          require_purpose_justification: true,
          auto_remove_unused_fields: true,
          review_frequency: 'monthly'
        },
        processing: {
          field_level_access_control: true,
          purpose_limitation: true,
          data_masking_by_default: true
        },
        storage: {
          compress_old_data: true,
          archive_after_days: 90,
          delete_after_days: 2555  // 7 years
        },
        pii_handling: {
          auto_detect_pii: true,
          mask_pii_in_logs: true,
          require_consent_for_pii: true
        }
      },
      monitoring: [
        {
          metric: 'unused_fields_count',
          threshold: '0',
          frequency: 'weekly'
        },
        {
          metric: 'data_collection_volume',
          threshold: 'baseline',
          frequency: 'daily'
        }
      ]
    }
  }),

  MODEL_DRIFT_MONITORING: (driftThreshold: number = 0.05): RuleTemplate => ({
    id: `gov-drift-${Date.now()}`,
    type: 'data_governance',
    severity: 'high',
    rule: 'MODEL_DRIFT_DETECTION',
    description: 'Monitor and alert on model performance degradation',
    rationale: 'Maintain model accuracy and reliability over time',
    implementation: {
      platform: ['all'],
      configuration: {
        metrics: {
          accuracy: { baseline: 'initial', threshold: driftThreshold },
          precision: { baseline: 'initial', threshold: driftThreshold },
          recall: { baseline: 'initial', threshold: driftThreshold },
          f1_score: { baseline: 'initial', threshold: driftThreshold }
        },
        drift_detection: {
          methods: ['PSI', 'KS_test', 'chi_square', 'jensen_shannon'],
          window_size: 1000,
          comparison_frequency: 'daily'
        },
        data_drift: {
          monitor_features: true,
          distribution_tracking: true,
          anomaly_detection: true
        },
        actions: {
          alert_on_drift: true,
          auto_retrain_trigger: driftThreshold * 2,
          rollback_on_severe_drift: driftThreshold * 3
        }
      },
      monitoring: [
        {
          metric: 'model_accuracy',
          threshold: `-${driftThreshold * 100}%`,
          frequency: 'daily'
        },
        {
          metric: 'prediction_drift',
          threshold: `${driftThreshold}`,
          frequency: 'hourly'
        }
      ]
    }
  }),

  RETENTION_POLICY: (retentionDays: number): RuleTemplate => ({
    id: `gov-retention-${Date.now()}`,
    type: 'data_governance',
    severity: 'high',
    rule: 'DATA_RETENTION_LIFECYCLE',
    description: `Enforce ${retentionDays} day retention policy`,
    rationale: 'Comply with legal and regulatory requirements',
    implementation: {
      platform: ['all'],
      configuration: {
        retention: {
          default_retention_days: retentionDays,
          auto_delete: true,
          delete_verification: true,
          secure_deletion: true  // Overwrite before delete
        },
        lifecycle_stages: {
          active: { days: 30, storage: 'hot' },
          warm: { days: 90, storage: 'warm', compression: true },
          cold: { days: 365, storage: 'cold', compression: true, encryption: true },
          archive: { days: retentionDays - 365, storage: 'glacier' },
          deletion: { after_days: retentionDays }
        },
        legal_hold: {
          supported: true,
          override_deletion: true,
          audit_trail: true
        }
      },
      monitoring: [
        {
          metric: 'data_age_violations',
          threshold: '0',
          frequency: 'daily'
        }
      ]
    }
  }),

  CROSS_BORDER_COMPLIANCE: (regions: string[]): RuleTemplate => ({
    id: `gov-cross-border-${Date.now()}`,
    type: 'data_governance',
    severity: 'critical',
    rule: 'CROSS_BORDER_DATA_CONTROL',
    description: 'Control data transfers across jurisdictions',
    rationale: 'Ensure compliance with data localization laws',
    implementation: {
      platform: ['all'],
      configuration: {
        data_residency: {
          primary_regions: regions,
          enforce_localization: true,
          block_unauthorized_regions: true
        },
        transfer_mechanisms: {
          sccs: regions.includes('EU'),
          bcrs: false,
          adequacy_decisions: true,
          consent_required: true
        },
        compliance_mapping: {
          EU: { framework: 'GDPR', requirements: ['SCCs', 'DPIA'] },
          US: { framework: 'CCPA', requirements: ['opt-out', 'disclosure'] },
          CN: { framework: 'PIPL', requirements: ['localization', 'assessment'] }
        },
        audit: {
          log_all_transfers: true,
          transfer_impact_assessment: true,
          quarterly_review: true
        }
      },
      monitoring: [
        {
          metric: 'unauthorized_transfers',
          threshold: '0',
          frequency: 'realtime'
        }
      ]
    }
  })
};

/**
 * Helper function to generate rules from templates
 */
export function generateRuleFromTemplate(
  templateType: string,
  templateName: string,
  ...params: any[]
): RuleTemplate {
  const templates: Record<string, any> = {
    security: SecurityRuleTemplates,
    performance: PerformanceRuleTemplates,
    cost: CostRuleTemplates,
    governance: DataGovernanceRuleTemplates
  };

  const templateSet = templates[templateType];
  if (!templateSet) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  const templateFunction = templateSet[templateName];
  if (!templateFunction) {
    throw new Error(`Unknown template: ${templateName} in ${templateType}`);
  }

  return templateFunction(...params);
}

/**
 * Generate a complete set of rules for common scenarios
 */
export function generateRuleSet(scenario: string, context: any): RuleTemplate[] {
  const rules: RuleTemplate[] = [];

  switch (scenario) {
    case 'high_security':
      rules.push(SecurityRuleTemplates.PROMPT_INJECTION_DEFENSE(5));
      rules.push(SecurityRuleTemplates.JAILBREAK_PREVENTION());
      rules.push(SecurityRuleTemplates.DATA_ENCRYPTION(['PII', 'Financial', 'Health']));
      break;

    case 'high_performance':
      rules.push(PerformanceRuleTemplates.RESPONSE_TIME_SLA(1, 5));
      rules.push(PerformanceRuleTemplates.HIGH_AVAILABILITY('99.99%'));
      rules.push(PerformanceRuleTemplates.THROUGHPUT_OPTIMIZATION(100));
      break;

    case 'cost_conscious':
      rules.push(CostRuleTemplates.TOKEN_BUDGET_MANAGEMENT(100000));
      rules.push(CostRuleTemplates.CONTEXT_OPTIMIZATION(2000));
      rules.push(CostRuleTemplates.MODEL_SELECTION_OPTIMIZATION());
      break;

    case 'strict_compliance':
      rules.push(DataGovernanceRuleTemplates.DATA_MINIMIZATION());
      rules.push(DataGovernanceRuleTemplates.MODEL_DRIFT_MONITORING(0.03));
      rules.push(DataGovernanceRuleTemplates.RETENTION_POLICY(2555));
      rules.push(DataGovernanceRuleTemplates.CROSS_BORDER_COMPLIANCE(['EU', 'US']));
      break;

    case 'production_ready':
      // Combine essential rules from all categories
      rules.push(SecurityRuleTemplates.PROMPT_INJECTION_DEFENSE(4));
      rules.push(PerformanceRuleTemplates.RESPONSE_TIME_SLA(2, 10));
      rules.push(CostRuleTemplates.TOKEN_BUDGET_MANAGEMENT(500000));
      rules.push(DataGovernanceRuleTemplates.MODEL_DRIFT_MONITORING());
      break;

    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }

  return rules;
}