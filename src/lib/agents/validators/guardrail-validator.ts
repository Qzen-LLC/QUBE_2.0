import { Guardrail, ComprehensiveAssessment } from '../types';

/**
 * Guardrail Validator
 * Validates guardrails for completeness, conflicts, and implementation feasibility
 */

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'conflict' | 'missing' | 'redundant' | 'infeasible' | 'incomplete' | 'optimization';
  guardrailId?: string;
  message: string;
  suggestion?: string;
  relatedGuardrails?: string[];
}

export interface ValidationReport {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  coverage: {
    critical: number;
    security: number;
    performance: number;
    cost: number;
    governance: number;
    ethical: number;
  };
  recommendations: string[];
  summary: string;
}

export class GuardrailValidator {
  private readonly requiredCategories = [
    'critical',
    'security_vulnerabilities',
    'performance_sla',
    'cost_optimization',
    'data_governance'
  ];

  private readonly criticalRules = [
    'HUMAN_IN_LOOP',
    'PROMPT_INJECTION_DEFENSE',
    'DATA_ENCRYPTION',
    'RATE_LIMITING',
    'ERROR_HANDLING'
  ];

  /**
   * Main validation method
   */
  async validate(
    guardrails: Record<string, any>,
    assessment: ComprehensiveAssessment
  ): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    // Structural validation
    this.validateStructure(guardrails, issues);

    // Completeness validation
    const coverage = this.validateCompleteness(guardrails, assessment, issues);

    // Conflict detection
    this.detectConflicts(guardrails, issues);

    // Redundancy detection
    this.detectRedundancy(guardrails, issues);

    // Feasibility check
    this.checkFeasibility(guardrails, assessment, issues);

    // Generate recommendations
    this.generateRecommendations(guardrails, assessment, issues, recommendations);

    // Calculate validation score
    const score = this.calculateScore(issues, coverage);

    return {
      isValid: !issues.some(i => i.type === 'error'),
      score,
      issues,
      coverage,
      recommendations,
      summary: this.generateSummary(score, issues, coverage)
    };
  }

  /**
   * Validate guardrail structure
   */
  private validateStructure(guardrails: Record<string, any>, issues: ValidationIssue[]): void {
    // Check for required categories
    for (const category of this.requiredCategories) {
      if (!guardrails[category]) {
        issues.push({
          type: 'error',
          category: 'missing',
          message: `Missing required category: ${category}`,
          suggestion: `Add ${category} guardrails to ensure comprehensive coverage`
        });
      }
    }

    // Validate each guardrail's structure
    Object.entries(guardrails).forEach(([category, categoryData]) => {
      if (typeof categoryData === 'object' && categoryData.guardrails) {
        const categoryGuardrails = categoryData.guardrails as Guardrail[];
        
        categoryGuardrails.forEach((guardrail, index) => {
          // Check required fields
          if (!guardrail.id) {
            issues.push({
              type: 'error',
              category: 'incomplete',
              message: `Guardrail at ${category}[${index}] missing ID`,
              suggestion: 'Add unique identifier to guardrail'
            });
          }

          if (!guardrail.rule) {
            issues.push({
              type: 'warning',
              category: 'incomplete',
              guardrailId: guardrail.id,
              message: `Guardrail ${guardrail.id} missing rule name`,
              suggestion: 'Add standardized rule name for tracking'
            });
          }

          if (!guardrail.implementation?.platform || guardrail.implementation.platform.length === 0) {
            issues.push({
              type: 'warning',
              category: 'incomplete',
              guardrailId: guardrail.id,
              message: `Guardrail ${guardrail.id} missing platform specification`,
              suggestion: 'Specify target platforms (openai, anthropic, aws, etc.)'
            });
          }

          // Check monitoring configuration
          if (guardrail.severity === 'critical' && !guardrail.implementation?.monitoring) {
            issues.push({
              type: 'warning',
              category: 'incomplete',
              guardrailId: guardrail.id,
              message: `Critical guardrail ${guardrail.id} lacks monitoring configuration`,
              suggestion: 'Add monitoring metrics and thresholds for critical guardrails'
            });
          }
        });
      }
    });
  }

  /**
   * Validate completeness based on assessment
   */
  private validateCompleteness(
    guardrails: Record<string, any>,
    assessment: ComprehensiveAssessment,
    issues: ValidationIssue[]
  ): ValidationReport['coverage'] {
    const coverage = {
      critical: 0,
      security: 0,
      performance: 0,
      cost: 0,
      governance: 0,
      ethical: 0
    };

    // Check for critical rules based on assessment
    const requiredRules = this.getRequiredRules(assessment);
    const implementedRules = this.extractImplementedRules(guardrails);

    requiredRules.forEach(rule => {
      if (!implementedRules.has(rule)) {
        issues.push({
          type: 'error',
          category: 'missing',
          message: `Missing critical rule: ${rule}`,
          suggestion: `Implement ${rule} based on assessment requirements`
        });
      }
    });

    // Calculate coverage scores
    coverage.critical = this.calculateCategoryCoverage(guardrails.critical, this.criticalRules);
    coverage.security = this.calculateSecurityCoverage(guardrails.security_vulnerabilities, assessment);
    coverage.performance = this.calculatePerformanceCoverage(guardrails.performance_sla, assessment);
    coverage.cost = this.calculateCostCoverage(guardrails.cost_optimization, assessment);
    coverage.governance = this.calculateGovernanceCoverage(guardrails.data_governance, assessment);
    coverage.ethical = this.calculateEthicalCoverage(guardrails.ethical, assessment);

    // Check for gaps
    Object.entries(coverage).forEach(([category, score]) => {
      if (score < 60) {
        issues.push({
          type: 'warning',
          category: 'missing',
          message: `Low coverage for ${category}: ${score}%`,
          suggestion: `Add more ${category} guardrails to improve coverage`
        });
      }
    });

    return coverage;
  }

  /**
   * Detect conflicts between guardrails
   */
  private detectConflicts(guardrails: Record<string, any>, issues: ValidationIssue[]): void {
    const allGuardrails = this.flattenGuardrails(guardrails);

    // Check for performance vs security conflicts
    const strictSecurity = allGuardrails.filter(g => 
      g.rule?.includes('INJECTION') || g.rule?.includes('SANITIZATION')
    );
    const performanceCritical = allGuardrails.filter(g => 
      g.rule?.includes('LATENCY') || g.rule?.includes('RESPONSE_TIME')
    );

    if (strictSecurity.length > 0 && performanceCritical.length > 0) {
      const securityLatency = this.extractLatency(strictSecurity);
      const performanceLatency = this.extractLatency(performanceCritical);

      if (securityLatency && performanceLatency && securityLatency > performanceLatency) {
        issues.push({
          type: 'warning',
          category: 'conflict',
          message: 'Security measures may conflict with performance requirements',
          suggestion: 'Consider async security validation or optimized security checks',
          relatedGuardrails: [...strictSecurity.map(g => g.id), ...performanceCritical.map(g => g.id)]
        });
      }
    }

    // Check for cost vs redundancy conflicts
    const highAvailability = allGuardrails.filter(g => 
      g.implementation?.configuration?.multi_region === true
    );
    const costOptimization = allGuardrails.filter(g => 
      g.rule?.includes('COST') || g.rule?.includes('BUDGET')
    );

    if (highAvailability.length > 0 && costOptimization.length > 0) {
      issues.push({
        type: 'info',
        category: 'conflict',
        message: 'High availability configuration may increase costs',
        suggestion: 'Balance availability requirements with cost constraints',
        relatedGuardrails: [...highAvailability.map(g => g.id), ...costOptimization.map(g => g.id)]
      });
    }

    // Check for data retention conflicts
    const retentionPolicies = allGuardrails.filter(g => g.rule?.includes('RETENTION'));
    if (retentionPolicies.length > 1) {
      const retentionPeriods = retentionPolicies.map(g => 
        g.implementation?.configuration?.retention_period_days
      ).filter(Boolean);

      if (new Set(retentionPeriods).size > 1) {
        issues.push({
          type: 'error',
          category: 'conflict',
          message: 'Conflicting data retention periods detected',
          suggestion: 'Unify retention periods across all data types',
          relatedGuardrails: retentionPolicies.map(g => g.id)
        });
      }
    }
  }

  /**
   * Detect redundant guardrails
   */
  private detectRedundancy(guardrails: Record<string, any>, issues: ValidationIssue[]): void {
    const allGuardrails = this.flattenGuardrails(guardrails);
    const ruleGroups = new Map<string, Guardrail[]>();

    // Group by rule
    allGuardrails.forEach(g => {
      if (g.rule) {
        if (!ruleGroups.has(g.rule)) {
          ruleGroups.set(g.rule, []);
        }
        ruleGroups.get(g.rule)!.push(g);
      }
    });

    // Check for duplicates
    ruleGroups.forEach((group, rule) => {
      if (group.length > 1) {
        // Check if configurations are identical
        const configs = group.map(g => JSON.stringify(g.implementation?.configuration));
        const uniqueConfigs = new Set(configs);

        if (uniqueConfigs.size === 1) {
          issues.push({
            type: 'warning',
            category: 'redundant',
            message: `Duplicate guardrails for rule: ${rule}`,
            suggestion: 'Remove duplicate guardrails or differentiate their configurations',
            relatedGuardrails: group.map(g => g.id)
          });
        }
      }
    });

    // Check for overlapping monitoring
    const monitoringMetrics = new Map<string, string[]>();
    allGuardrails.forEach(g => {
      g.implementation?.monitoring?.forEach(m => {
        if (!monitoringMetrics.has(m.metric)) {
          monitoringMetrics.set(m.metric, []);
        }
        monitoringMetrics.get(m.metric)!.push(g.id);
      });
    });

    monitoringMetrics.forEach((guardrailIds, metric) => {
      if (guardrailIds.length > 2) {
        issues.push({
          type: 'info',
          category: 'redundant',
          message: `Metric "${metric}" monitored by multiple guardrails`,
          suggestion: 'Consider consolidating monitoring to reduce overhead',
          relatedGuardrails: guardrailIds
        });
      }
    });
  }

  /**
   * Check implementation feasibility
   */
  private checkFeasibility(
    guardrails: Record<string, any>,
    assessment: ComprehensiveAssessment,
    issues: ValidationIssue[]
  ): void {
    const allGuardrails = this.flattenGuardrails(guardrails);

    // Check token budget feasibility
    const tokenBudgets = allGuardrails
      .filter(g => g.implementation?.configuration?.max_tokens_per_request)
      .map(g => g.implementation.configuration.max_tokens_per_request);

    const monthlyVolume = assessment.budgetPlanning?.monthlyTokenVolume || 0;
    if (monthlyVolume > 10000000 && Math.max(...tokenBudgets) < 1000) {
      issues.push({
        type: 'warning',
        category: 'infeasible',
        message: 'Token limits may be too restrictive for expected volume',
        suggestion: 'Consider higher token limits or implement token optimization strategies'
      });
    }

    // Check latency feasibility
    const latencyRequirements = allGuardrails
      .filter(g => g.implementation?.configuration?.max_latency_ms)
      .map(g => g.implementation.configuration.max_latency_ms);

    const minLatency = Math.min(...latencyRequirements);
    if (minLatency < 100 && assessment.technicalFeasibility?.modelTypes?.includes('Large Language Model')) {
      issues.push({
        type: 'warning',
        category: 'infeasible',
        message: `${minLatency}ms latency may not be achievable with LLMs`,
        suggestion: 'Consider caching, smaller models, or adjusting latency requirements'
      });
    }

    // Check monitoring frequency feasibility
    const realtimeMonitoring = allGuardrails.filter(g => 
      g.implementation?.monitoring?.some(m => m.frequency === 'realtime')
    );

    if (realtimeMonitoring.length > 10) {
      issues.push({
        type: 'warning',
        category: 'infeasible',
        message: 'Too many realtime monitoring requirements may impact performance',
        suggestion: 'Prioritize critical metrics for realtime monitoring, use sampling for others'
      });
    }

    // Check platform compatibility
    const platforms = new Set<string>();
    allGuardrails.forEach(g => {
      g.implementation?.platform?.forEach(p => platforms.add(p));
    });

    if (platforms.has('all') && platforms.size > 1) {
      issues.push({
        type: 'info',
        category: 'optimization',
        message: 'Mixed use of "all" and specific platforms',
        suggestion: 'Standardize platform specifications for clarity'
      });
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    guardrails: Record<string, any>,
    assessment: ComprehensiveAssessment,
    issues: ValidationIssue[],
    recommendations: string[]
  ): void {
    // Based on issues
    if (issues.filter(i => i.type === 'error').length > 0) {
      recommendations.push('Address all critical errors before deployment');
    }

    // Based on assessment
    if (assessment.businessFeasibility?.systemCriticality === 'Mission Critical') {
      if (!guardrails.operational?.guardrails?.some((g: Guardrail) => g.rule?.includes('FAILOVER'))) {
        recommendations.push('Add automatic failover for mission-critical system');
      }
      if (!guardrails.operational?.guardrails?.some((g: Guardrail) => g.rule?.includes('BACKUP'))) {
        recommendations.push('Implement backup and disaster recovery procedures');
      }
    }

    if (assessment.dataReadiness?.crossBorderTransfer) {
      recommendations.push('Review data residency requirements for each jurisdiction');
      recommendations.push('Implement geo-fencing to prevent unauthorized data movement');
    }

    if (assessment.technicalFeasibility?.modelTypes?.includes('Generative AI')) {
      if (!guardrails.security_vulnerabilities?.guardrails?.some((g: Guardrail) => 
        g.rule?.includes('HALLUCINATION'))) {
        recommendations.push('Add hallucination detection and mitigation for Gen AI');
      }
    }

    // Performance recommendations
    const avgCoverage = Object.values(this.validateCompleteness(guardrails, assessment, [])).reduce((a, b) => a + b, 0) / 6;
    if (avgCoverage < 70) {
      recommendations.push('Increase overall guardrail coverage to at least 70%');
    }

    // Monitoring recommendations
    const criticalWithoutMonitoring = this.flattenGuardrails(guardrails).filter(g => 
      g.severity === 'critical' && !g.implementation?.monitoring
    );
    if (criticalWithoutMonitoring.length > 0) {
      recommendations.push(`Add monitoring for ${criticalWithoutMonitoring.length} critical guardrails`);
    }
  }

  /**
   * Helper methods
   */
  private getRequiredRules(assessment: ComprehensiveAssessment): string[] {
    const rules = [...this.criticalRules];

    // Add based on assessment
    if (assessment.businessFeasibility?.userCategories?.includes('Minors/Children')) {
      rules.push('CONTENT_FILTERING', 'AGE_VERIFICATION', 'PARENTAL_CONSENT');
    }

    if (assessment.dataReadiness?.dataTypes?.includes('Health/Medical Records')) {
      rules.push('HIPAA_COMPLIANCE', 'PHI_PROTECTION');
    }

    if (assessment.technicalFeasibility?.modelTypes?.includes('Generative AI')) {
      rules.push('PROMPT_INJECTION_DEFENSE', 'HALLUCINATION_DETECTION');
    }

    if (assessment.businessFeasibility?.systemCriticality === 'Mission Critical') {
      rules.push('FAILOVER', 'CIRCUIT_BREAKER', 'HEALTH_CHECK');
    }

    return rules;
  }

  private extractImplementedRules(guardrails: Record<string, any>): Set<string> {
    const rules = new Set<string>();
    this.flattenGuardrails(guardrails).forEach(g => {
      if (g.rule) {
        rules.add(g.rule);
      }
    });
    return rules;
  }

  private flattenGuardrails(guardrails: Record<string, any>): Guardrail[] {
    const flat: Guardrail[] = [];
    Object.values(guardrails).forEach(category => {
      if (typeof category === 'object' && category.guardrails) {
        flat.push(...(category.guardrails as Guardrail[]));
      }
    });
    return flat;
  }

  private calculateCategoryCoverage(category: any, requiredRules: string[]): number {
    if (!category?.guardrails) return 0;
    const implemented = category.guardrails.filter((g: Guardrail) => 
      requiredRules.some(rule => g.rule?.includes(rule))
    ).length;
    return Math.round((implemented / requiredRules.length) * 100);
  }

  private calculateSecurityCoverage(category: any, assessment: ComprehensiveAssessment): number {
    if (!category?.guardrails) return 0;
    const requiredSecurityRules = ['PROMPT_INJECTION', 'JAILBREAK', 'ADVERSARIAL', 'OUTPUT_VALIDATION'];
    const implemented = category.guardrails.filter((g: Guardrail) => 
      requiredSecurityRules.some(rule => g.rule?.includes(rule))
    ).length;
    return Math.round((implemented / requiredSecurityRules.length) * 100);
  }

  private calculatePerformanceCoverage(category: any, assessment: ComprehensiveAssessment): number {
    if (!category?.guardrails) return 0;
    const requiredPerformanceRules = ['RESPONSE_TIME', 'THROUGHPUT', 'AVAILABILITY'];
    const implemented = category.guardrails.filter((g: Guardrail) => 
      requiredPerformanceRules.some(rule => g.rule?.includes(rule))
    ).length;
    return Math.round((implemented / requiredPerformanceRules.length) * 100);
  }

  private calculateCostCoverage(category: any, assessment: ComprehensiveAssessment): number {
    if (!category?.guardrails) return 0;
    const monthlyVolume = assessment.budgetPlanning?.monthlyTokenVolume || 0;
    const requiredRules = ['TOKEN_BUDGET'];
    if (monthlyVolume > 10000000) {
      requiredRules.push('CACHING', 'OPTIMIZATION');
    }
    const implemented = category.guardrails.filter((g: Guardrail) => 
      requiredRules.some(rule => g.rule?.includes(rule))
    ).length;
    return Math.round((implemented / requiredRules.length) * 100);
  }

  private calculateGovernanceCoverage(category: any, assessment: ComprehensiveAssessment): number {
    if (!category?.guardrails) return 0;
    const requiredRules = ['DATA_MINIMIZATION', 'RETENTION', 'DRIFT_MONITORING'];
    if (assessment.dataReadiness?.crossBorderTransfer) {
      requiredRules.push('CROSS_BORDER');
    }
    const implemented = category.guardrails.filter((g: Guardrail) => 
      requiredRules.some(rule => g.rule?.includes(rule))
    ).length;
    return Math.round((implemented / requiredRules.length) * 100);
  }

  private calculateEthicalCoverage(category: any, assessment: ComprehensiveAssessment): number {
    if (!category?.guardrails) return 0;
    const requiredRules = ['BIAS_DETECTION', 'FAIRNESS'];
    if (assessment.ethicalImpact?.decisionMaking?.automationLevel === 'Fully Automated') {
      requiredRules.push('HUMAN_OVERSIGHT', 'EXPLAINABILITY');
    }
    const implemented = category.guardrails.filter((g: Guardrail) => 
      requiredRules.some(rule => g.rule?.includes(rule))
    ).length;
    return Math.round((implemented / requiredRules.length) * 100);
  }

  private extractLatency(guardrails: Guardrail[]): number | null {
    for (const g of guardrails) {
      if (g.implementation?.configuration?.max_latency_ms) {
        return g.implementation.configuration.max_latency_ms;
      }
      if (g.implementation?.configuration?.processing_time_ms) {
        return g.implementation.configuration.processing_time_ms;
      }
    }
    return null;
  }

  private calculateScore(issues: ValidationIssue[], coverage: ValidationReport['coverage']): number {
    let score = 100;

    // Deduct for issues
    issues.forEach(issue => {
      if (issue.type === 'error') score -= 10;
      else if (issue.type === 'warning') score -= 5;
      else if (issue.type === 'info') score -= 2;
    });

    // Factor in coverage
    const avgCoverage = Object.values(coverage).reduce((a, b) => a + b, 0) / 6;
    score = Math.round((score * 0.6) + (avgCoverage * 0.4));

    return Math.max(0, Math.min(100, score));
  }

  private generateSummary(score: number, issues: ValidationIssue[], coverage: ValidationReport['coverage']): string {
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const avgCoverage = Math.round(Object.values(coverage).reduce((a, b) => a + b, 0) / 6);

    let summary = `Validation Score: ${score}/100. `;
    
    if (score >= 80) {
      summary += 'Guardrails are well-configured and ready for deployment. ';
    } else if (score >= 60) {
      summary += 'Guardrails need improvements before production deployment. ';
    } else {
      summary += 'Significant gaps in guardrail configuration detected. ';
    }

    summary += `Found ${errorCount} errors and ${warningCount} warnings. `;
    summary += `Average coverage: ${avgCoverage}%. `;

    if (errorCount > 0) {
      summary += 'Address critical errors immediately.';
    } else if (warningCount > 5) {
      summary += 'Review warnings to improve robustness.';
    } else {
      summary += 'System is production-ready.';
    }

    return summary;
  }
}

/**
 * Validate guardrails against best practices
 */
export async function validateGuardrails(
  guardrails: Record<string, any>,
  assessment: ComprehensiveAssessment
): Promise<ValidationReport> {
  const validator = new GuardrailValidator();
  return validator.validate(guardrails, assessment);
}

/**
 * Quick validation for specific category
 */
export function validateCategory(
  category: string,
  guardrails: Guardrail[],
  assessment: ComprehensiveAssessment
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Category-specific validation
  switch (category) {
    case 'critical':
      if (guardrails.length < 3) {
        issues.push({
          type: 'warning',
          category: 'missing',
          message: 'Critical category should have at least 3 guardrails',
          suggestion: 'Add more critical safety guardrails'
        });
      }
      break;

    case 'security_vulnerabilities':
      const hasPromptInjection = guardrails.some(g => g.rule?.includes('PROMPT_INJECTION'));
      if (!hasPromptInjection && assessment.technicalFeasibility?.modelTypes?.includes('Generative AI')) {
        issues.push({
          type: 'error',
          category: 'missing',
          message: 'Missing prompt injection defense for Gen AI system',
          suggestion: 'Add PROMPT_INJECTION_DEFENSE guardrail'
        });
      }
      break;

    case 'performance_sla':
      const hasLatency = guardrails.some(g => g.rule?.includes('LATENCY') || g.rule?.includes('RESPONSE_TIME'));
      if (!hasLatency) {
        issues.push({
          type: 'warning',
          category: 'missing',
          message: 'No response time requirements specified',
          suggestion: 'Define maximum acceptable latency'
        });
      }
      break;

    case 'cost_optimization':
      const monthlyVolume = assessment.budgetPlanning?.monthlyTokenVolume || 0;
      const hasBudget = guardrails.some(g => g.rule?.includes('BUDGET') || g.rule?.includes('TOKEN'));
      if (monthlyVolume > 1000000 && !hasBudget) {
        issues.push({
          type: 'warning',
          category: 'missing',
          message: 'High token volume without budget controls',
          suggestion: 'Add token budget monitoring and alerts'
        });
      }
      break;

    case 'data_governance':
      const hasSensitiveData = assessment.dataReadiness?.dataTypes?.some(t => 
        ['Health/Medical Records', 'Financial Records', 'Personal Data'].some(st => t.includes(st))
      );
      const hasEncryption = guardrails.some(g => g.rule?.includes('ENCRYPTION'));
      if (hasSensitiveData && !hasEncryption) {
        issues.push({
          type: 'error',
          category: 'missing',
          message: 'Sensitive data without encryption guardrails',
          suggestion: 'Add DATA_ENCRYPTION guardrail for sensitive data protection'
        });
      }
      break;
  }

  return issues;
}