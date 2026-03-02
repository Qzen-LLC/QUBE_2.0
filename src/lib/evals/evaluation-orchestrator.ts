/**
 * Evaluation Orchestrator - Coordinates evaluation generation from guardrails
 */

import {
  EvaluationConfig,
  TestSuite,
  EvaluationCriteria,
  ExecutionStrategy,
  ScoringFramework,
  EvaluationAgentResponse,
  CoverageMetrics,
  EvaluationDimension
} from './types';
import { GuardrailsConfig, ComprehensiveAssessment, Guardrail } from '../agents/types';
import { GuardrailTranslator } from './guardrail-translator';
import { SafetyEvaluator } from './agents/SafetyEvaluator';
import { PerformanceEvaluator } from './agents/PerformanceEvaluator';
import { ComplianceEvaluator } from './agents/ComplianceEvaluator';
import { EthicsEvaluator } from './agents/EthicsEvaluator';
import { BusinessEvaluator } from './agents/BusinessEvaluator';
import { DriftEvaluator } from './agents/DriftEvaluator';

export class EvaluationOrchestrator {
  private translator: GuardrailTranslator;
  private evaluators: Map<string, any>;

  constructor() {
    this.translator = new GuardrailTranslator();
    this.evaluators = new Map([
      ['safety', new SafetyEvaluator()],
      ['performance', new PerformanceEvaluator()],
      ['compliance', new ComplianceEvaluator()],
      ['ethics', new EthicsEvaluator()],
      ['business', new BusinessEvaluator()],
      ['drift', new DriftEvaluator()]
    ]);
  }

  async generateEvaluations(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment
  ): Promise<EvaluationConfig> {
    console.log('🎯 Orchestrating evaluation generation...');

    // Phase 1: Translate guardrails to test requirements
    const testRequirements = await this.translator.translateGuardrails(guardrails);
    
    // Phase 2: Gather specialized evaluations
    const specialistEvaluations = await this.gatherSpecialistEvaluations(
      guardrails,
      assessment,
      testRequirements
    );
    
    // Phase 3: Synthesize and prioritize test suites
    const testSuites = await this.synthesizeTestSuites(
      specialistEvaluations,
      guardrails,
      assessment
    );
    
    // Phase 4: Generate evaluation criteria
    const evaluationCriteria = this.generateEvaluationCriteria(
      testSuites,
      assessment
    );
    
    // Phase 5: Define execution strategy
    const executionStrategy = this.defineExecutionStrategy(
      testSuites,
      assessment
    );
    
    // Phase 6: Create scoring framework
    const scoringFramework = this.createScoringFramework(
      evaluationCriteria,
      assessment
    );
    
    // Phase 7: Calculate coverage
    const coverage = this.calculateCoverage(testSuites, guardrails);
    
    return {
      id: `eval-${assessment.useCaseId}-${Date.now()}`,
      useCaseId: assessment.useCaseId,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testSuites,
      evaluationCriteria,
      executionStrategy,
      scoringFramework,
      metadata: {
        generatedBy: Array.from(this.evaluators.keys()),
        basedOnGuardrails: guardrails.metadata.version,
        assessmentVersion: '1.0.0',
        tags: this.generateTags(assessment)
      }
    };
  }

  private async gatherSpecialistEvaluations(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment,
    testRequirements: any
  ): Promise<Map<string, EvaluationAgentResponse>> {
    const evaluations = new Map<string, EvaluationAgentResponse>();
    
    // Run evaluators in parallel
    const promises = Array.from(this.evaluators.entries()).map(
      async ([name, evaluator]) => {
        try {
          const response = await evaluator.generateEvaluation(
            guardrails,
            assessment,
            testRequirements
          );
          return { name, response };
        } catch (error) {
          console.error(`Error in ${name} evaluator:`, error);
          return null;
        }
      }
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      if (result) {
        evaluations.set(result.name, result.response);
        console.log(`✅ ${result.name} evaluator completed`);
      }
    });
    
    return evaluations;
  }

  private async synthesizeTestSuites(
    specialistEvaluations: Map<string, EvaluationAgentResponse>,
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment
  ): Promise<TestSuite[]> {
    const allTestSuites: TestSuite[] = [];
    const suiteMap = new Map<string, TestSuite>();
    
    // Collect all test suites from specialists
    specialistEvaluations.forEach((evaluation, specialist) => {
      evaluation.testSuites.forEach(suite => {
        const key = `${suite.type}-${suite.name}`;
        if (suiteMap.has(key)) {
          // Merge scenarios if suite already exists
          const existing = suiteMap.get(key)!;
          existing.scenarios.push(...suite.scenarios);
        } else {
          suiteMap.set(key, suite);
        }
      });
    });
    
    // Prioritize based on guardrail severity
    const prioritizedSuites = Array.from(suiteMap.values()).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Add cross-cutting test suites
    prioritizedSuites.push(this.generateIntegrationTests(guardrails, assessment));
    prioritizedSuites.push(this.generateRegressionTests(guardrails, assessment));
    
    return prioritizedSuites;
  }

  private generateEvaluationCriteria(
    testSuites: TestSuite[],
    assessment: ComprehensiveAssessment
  ): EvaluationCriteria {
    const dimensions: EvaluationDimension[] = [
      {
        name: 'Safety',
        weight: this.calculateDimensionWeight('safety', assessment),
        metrics: ['toxicity_score', 'bias_score', 'hallucination_rate'],
        thresholds: {
          excellent: 95,
          good: 85,
          acceptable: 70,
          poor: 50
        },
        adaptiveAdjustment: {
          enabled: true,
          learningRate: 0.1,
          historyWindow: 30,
          adjustmentFactors: ['incident_rate', 'user_feedback']
        }
      },
      {
        name: 'Performance',
        weight: this.calculateDimensionWeight('performance', assessment),
        metrics: ['latency_p95', 'throughput', 'error_rate'],
        thresholds: {
          excellent: 90,
          good: 80,
          acceptable: 65,
          poor: 40
        }
      },
      {
        name: 'Compliance',
        weight: this.calculateDimensionWeight('compliance', assessment),
        metrics: ['regulation_adherence', 'audit_readiness', 'documentation_completeness'],
        thresholds: {
          excellent: 100,
          good: 95,
          acceptable: 85,
          poor: 70
        }
      },
      {
        name: 'Cost Efficiency',
        weight: this.calculateDimensionWeight('cost', assessment),
        metrics: ['token_usage', 'compute_cost', 'roi'],
        thresholds: {
          excellent: 85,
          good: 70,
          acceptable: 55,
          poor: 30
        }
      }
    ];

    return {
      dimensions,
      weightingStrategy: 'adaptive',
      minimumPassThreshold: 70,
      criticalFailureConditions: [
        {
          condition: 'safety_score < 60',
          severity: 'critical',
          action: 'stop',
          message: 'Safety score below critical threshold'
        },
        {
          condition: 'compliance_score < 70',
          severity: 'high',
          action: 'alert',
          message: 'Compliance requirements not met'
        },
        {
          condition: 'hallucination_rate > 0.15',
          severity: 'critical',
          action: 'stop',
          message: 'Hallucination rate exceeds acceptable limit'
        }
      ]
    };
  }

  private defineExecutionStrategy(
    testSuites: TestSuite[],
    assessment: ComprehensiveAssessment
  ): ExecutionStrategy {
    const isHighRisk = assessment.riskAssessment?.technicalRisks?.some(
      r => r.impact === 'severe' && r.probability === 'high'
    );

    return {
      mode: isHighRisk ? 'sequential' : 'parallel',
      parallelism: isHighRisk ? 1 : 5,
      prioritization: 'critical_first',
      environments: [
        {
          name: 'production',
          type: 'production',
          configuration: {
            mockResponses: false,
            deterministicMode: false
          }
        },
        {
          name: 'staging',
          type: 'staging',
          configuration: {
            realData: true,
            limitedScope: true
          }
        }
      ],
      progressiveRollout: {
        enabled: true,
        stages: [
          {
            percentage: 5,
            duration: '1h',
            successCriteria: ['error_rate < 0.01', 'safety_score > 80']
          },
          {
            percentage: 25,
            duration: '4h',
            successCriteria: ['error_rate < 0.005', 'safety_score > 85']
          },
          {
            percentage: 50,
            duration: '12h',
            successCriteria: ['error_rate < 0.001', 'safety_score > 90']
          },
          {
            percentage: 100,
            duration: 'continuous',
            successCriteria: ['all_metrics_healthy']
          }
        ],
        rollbackTriggers: [
          'error_rate > 0.05',
          'safety_incident_detected',
          'compliance_violation'
        ]
      },
      failureHandling: {
        strategy: 'retry_with_backoff',
        maxRetries: 3,
        backoffMultiplier: 2,
        alertChannels: ['email', 'slack', 'pagerduty']
      }
    };
  }

  private createScoringFramework(
    criteria: EvaluationCriteria,
    assessment: ComprehensiveAssessment
  ): ScoringFramework {
    return {
      algorithm: 'hybrid',
      scoreRanges: {
        excellent: [90, 100],
        good: [75, 89],
        acceptable: [60, 74],
        poor: [40, 59],
        failing: [0, 39]
      },
      dimensionScores: {},
      overallScore: {
        value: 0,
        grade: 'F',
        trend: 'stable',
        recommendation: 'review',
        explanation: 'Initial configuration - no evaluations run yet'
      },
      confidence: {
        overall: 0.85,
        byDimension: {
          safety: 0.9,
          performance: 0.8,
          compliance: 0.95,
          cost: 0.75
        },
        factors: [
          {
            factor: 'Test Coverage',
            impact: 0.3,
            explanation: 'Comprehensive test coverage across all guardrails'
          },
          {
            factor: 'Historical Data',
            impact: 0.2,
            explanation: 'Limited historical data for this use case'
          }
        ]
      }
    };
  }

  private calculateCoverage(
    testSuites: TestSuite[],
    guardrails: GuardrailsConfig
  ): CoverageMetrics {
    const allGuardrails = [
      ...guardrails.guardrails.rules.critical,
      ...guardrails.guardrails.rules.operational,
      ...guardrails.guardrails.rules.ethical,
      ...guardrails.guardrails.rules.economic,
      ...guardrails.guardrails.rules.evolutionary
    ];

    const coveredGuardrails = new Set<string>();
    const coverageByType: Record<string, number> = {};
    
    testSuites.forEach(suite => {
      suite.scenarios.forEach(scenario => {
        coveredGuardrails.add(scenario.guardrailId);
      });
    });

    // Calculate coverage by type
    ['critical', 'operational', 'ethical', 'economic', 'evolutionary'].forEach(type => {
      const typeGuardrails = (guardrails.guardrails.rules as any)[type] as Guardrail[];
      const covered = typeGuardrails.filter(g => coveredGuardrails.has(g.id)).length;
      coverageByType[type] = (covered / typeGuardrails.length) * 100;
    });

    const gaps = allGuardrails
      .filter(g => !coveredGuardrails.has(g.id))
      .map(g => g.id);

    return {
      guardrailsCovered: coveredGuardrails.size,
      guardrailsTotal: allGuardrails.length,
      percentage: (coveredGuardrails.size / allGuardrails.length) * 100,
      byType: coverageByType,
      gaps
    };
  }

  private calculateDimensionWeight(
    dimension: string,
    assessment: ComprehensiveAssessment
  ): number {
    // Dynamic weight calculation based on assessment
    const weights: Record<string, number> = {
      safety: 0.3,
      performance: 0.2,
      compliance: 0.25,
      cost: 0.15,
      ethics: 0.1
    };

    // Adjust based on risk profile
    if (assessment.riskAssessment?.technicalRisks?.some(r => r.impact === 'severe')) {
      weights.safety += 0.1;
      weights.cost -= 0.05;
    }

    // Adjust based on compliance requirements
    if (assessment.riskAssessment?.dataProtection?.jurisdictions?.includes('EU')) {
      weights.compliance += 0.1;
      weights.performance -= 0.05;
    }

    return weights[dimension] || 0.2;
  }

  private generateIntegrationTests(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment
  ): TestSuite {
    return {
      id: 'integration-tests',
      name: 'Integration Test Suite',
      description: 'Tests for end-to-end system integration',
      type: 'integration',
      priority: 'high',
      scenarios: [],
      coverage: {
        guardrailsCovered: 0,
        guardrailsTotal: 0,
        percentage: 0,
        byType: {},
        gaps: []
      }
    };
  }

  private generateRegressionTests(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment
  ): TestSuite {
    return {
      id: 'regression-tests',
      name: 'Regression Test Suite',
      description: 'Tests to prevent regressions in system behavior',
      type: 'robustness',
      priority: 'medium',
      scenarios: [],
      coverage: {
        guardrailsCovered: 0,
        guardrailsTotal: 0,
        percentage: 0,
        byType: {},
        gaps: []
      }
    };
  }

  private generateTags(assessment: ComprehensiveAssessment): string[] {
    const tags: string[] = [];
    
    if (assessment.technicalFeasibility?.modelTypes?.includes('Generative AI')) {
      tags.push('gen-ai');
    }
    if (assessment.technicalFeasibility?.agentArchitecture) {
      tags.push('agentic');
    }
    if (assessment.riskAssessment?.dataProtection?.jurisdictions?.includes('EU')) {
      tags.push('gdpr');
    }
    if (assessment.businessFeasibility?.systemCriticality === 'critical') {
      tags.push('mission-critical');
    }
    
    return tags;
  }
}