/**
 * Performance Evaluator Agent - Generates performance-focused test scenarios
 */

import { GuardrailsConfig, ComprehensiveAssessment } from '../../agents/types';
import { EvaluationAgentResponse, TestSuite, TestScenario } from '../types';

export class PerformanceEvaluator {
  
  async generateEvaluation(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment,
    testRequirements: any
  ): Promise<EvaluationAgentResponse> {
    const testSuites: TestSuite[] = [];
    const insights: string[] = [];
    
    // Analyze performance requirements
    const perfRequirements = this.analyzePerformanceRequirements(assessment);
    
    // Generate latency tests
    testSuites.push(this.generateLatencyTests(assessment, guardrails, perfRequirements));
    insights.push(`Latency target: ${perfRequirements.maxLatency}ms`);
    
    // Generate throughput tests
    testSuites.push(this.generateThroughputTests(assessment, guardrails, perfRequirements));
    insights.push(`Expected throughput: ${perfRequirements.expectedThroughput} req/s`);
    
    // Generate token optimization tests for Gen AI
    if (assessment.technicalFeasibility.modelTypes?.includes('Generative AI')) {
      testSuites.push(this.generateTokenOptimizationTests(assessment, guardrails));
      insights.push('Token optimization tests added for cost efficiency');
    }
    
    // Generate scalability tests
    if (perfRequirements.concurrentUsers > 100) {
      testSuites.push(this.generateScalabilityTests(assessment, guardrails, perfRequirements));
      insights.push('High concurrency requires scalability testing');
    }
    
    const coverage = this.calculateCoverage(testSuites, guardrails);
    
    return {
      testSuites,
      insights,
      coverage,
      confidence: this.calculateConfidence(assessment, perfRequirements),
      recommendations: this.generateRecommendations(perfRequirements)
    };
  }
  
  private analyzePerformanceRequirements(assessment: ComprehensiveAssessment): any {
    return {
      maxLatency: assessment.businessFeasibility.maxLatency || 1000,
      expectedThroughput: this.calculateExpectedThroughput(assessment),
      concurrentUsers: parseInt(assessment.businessFeasibility.concurrentUsers || '100'),
      availability: assessment.businessFeasibility.availabilityRequirement || '99.9%',
      responseTime: assessment.businessFeasibility.responseTimeRequirement || '1s'
    };
  }
  
  private calculateExpectedThroughput(assessment: ComprehensiveAssessment): number {
    const concurrentUsers = parseInt(assessment.businessFeasibility.concurrentUsers || '100');
    return Math.ceil(concurrentUsers / 10); // Rough estimate
  }
  
  private generateLatencyTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig,
    perfRequirements: any
  ): TestSuite {
    const scenarios: TestScenario[] = [
      {
        id: 'perf-latency-p50',
        name: 'Median Latency Test',
        description: 'Test p50 latency under normal load',
        guardrailId: 'performance-latency',
        inputs: [
          {
            type: 'prompt',
            value: 'Standard test query',
            metadata: { load: 'normal', requests: 100 }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: perfRequirements.maxLatency * 0.5,
            tolerance: 50,
            explanation: `P50 latency should be under ${perfRequirements.maxLatency * 0.5}ms`
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: `latency_p50 < ${perfRequirements.maxLatency * 0.5}`,
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'latency_p50',
            type: 'gauge',
            unit: 'ms',
            aggregation: 'p50'
          }
        ]
      },
      {
        id: 'perf-latency-p95',
        name: 'P95 Latency Test',
        description: 'Test p95 latency under normal load',
        guardrailId: 'performance-latency',
        inputs: [
          {
            type: 'prompt',
            value: 'Standard test query',
            metadata: { load: 'normal', requests: 100 }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: perfRequirements.maxLatency,
            tolerance: 100,
            explanation: `P95 latency should be under ${perfRequirements.maxLatency}ms`
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: `latency_p95 < ${perfRequirements.maxLatency}`,
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'latency_p95',
            type: 'gauge',
            unit: 'ms',
            aggregation: 'p95'
          }
        ],
        weight: 1.5
      },
      {
        id: 'perf-latency-p99',
        name: 'P99 Latency Test',
        description: 'Test p99 latency under stress',
        guardrailId: 'performance-latency',
        inputs: [
          {
            type: 'prompt',
            value: 'Complex test query requiring more processing',
            metadata: { load: 'stress', requests: 100 }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: perfRequirements.maxLatency * 2,
            tolerance: 200,
            explanation: `P99 latency should be under ${perfRequirements.maxLatency * 2}ms`
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: `latency_p99 < ${perfRequirements.maxLatency * 2}`,
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'latency_p99',
            type: 'gauge',
            unit: 'ms',
            aggregation: 'p99'
          }
        ]
      }
    ];
    
    return {
      id: 'perf-latency-tests',
      name: 'Latency Performance Suite',
      description: 'Response time validation under various loads',
      type: 'performance',
      priority: 'high',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 5,
        percentage: (scenarios.length / 5) * 100,
        byType: { performance: 60 },
        gaps: []
      }
    };
  }
  
  private generateThroughputTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig,
    perfRequirements: any
  ): TestSuite {
    const scenarios: TestScenario[] = [
      {
        id: 'perf-throughput-sustained',
        name: 'Sustained Throughput Test',
        description: 'Test sustained request handling',
        guardrailId: 'performance-throughput',
        inputs: [
          {
            type: 'api_call',
            value: {
              requests: perfRequirements.expectedThroughput * 60,
              duration: '1m',
              pattern: 'constant'
            },
            metadata: { load_type: 'sustained' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: perfRequirements.expectedThroughput * 0.95,
            explanation: 'Should maintain 95% of expected throughput'
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: `throughput >= ${perfRequirements.expectedThroughput * 0.95}`,
            expected: true,
            severity: 'must_pass'
          },
          {
            type: 'performance_threshold',
            condition: 'error_rate < 0.01',
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'throughput',
            type: 'gauge',
            unit: 'req/s'
          },
          {
            name: 'error_rate',
            type: 'gauge',
            unit: 'percentage'
          }
        ],
        weight: 1.5
      },
      {
        id: 'perf-throughput-burst',
        name: 'Burst Traffic Test',
        description: 'Test handling of traffic bursts',
        guardrailId: 'performance-throughput',
        inputs: [
          {
            type: 'api_call',
            value: {
              requests: perfRequirements.expectedThroughput * 2 * 10,
              duration: '10s',
              pattern: 'burst'
            },
            metadata: { load_type: 'burst' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: perfRequirements.expectedThroughput,
            explanation: 'Should handle burst without degradation'
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: `throughput >= ${perfRequirements.expectedThroughput}`,
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'burst_throughput',
            type: 'gauge',
            unit: 'req/s'
          },
          {
            name: 'queue_depth',
            type: 'gauge'
          }
        ]
      }
    ];
    
    return {
      id: 'perf-throughput-tests',
      name: 'Throughput Performance Suite',
      description: 'Request handling capacity validation',
      type: 'performance',
      priority: 'high',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 3,
        percentage: (scenarios.length / 3) * 100,
        byType: { performance: 67 },
        gaps: []
      }
    };
  }
  
  private generateTokenOptimizationTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig
  ): TestSuite {
    const targetOptimization = assessment.budgetPlanning.tokenOptimizationTarget || 0.8;
    
    const scenarios: TestScenario[] = [
      {
        id: 'perf-token-efficiency',
        name: 'Token Usage Efficiency',
        description: 'Test token usage optimization',
        guardrailId: 'cost-token-optimization',
        inputs: [
          {
            type: 'prompt',
            value: 'Standard business query requiring detailed response',
            metadata: { expected_tokens: 500 }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 500 * targetOptimization,
            explanation: `Token usage should be optimized to ${targetOptimization * 100}% efficiency`
          }
        ],
        assertions: [
          {
            type: 'cost_within_budget',
            condition: `token_usage <= ${500 * targetOptimization}`,
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'token_usage',
            type: 'gauge',
            unit: 'tokens'
          },
          {
            name: 'token_efficiency',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      },
      {
        id: 'perf-context-window',
        name: 'Context Window Management',
        description: 'Test efficient context window usage',
        guardrailId: 'performance-context',
        inputs: [
          {
            type: 'context',
            value: '[LARGE_CONTEXT_DOCUMENT]',
            metadata: { size: 'large', tokens: 8000 }
          },
          {
            type: 'prompt',
            value: 'Summarize the key points',
            metadata: {}
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: assessment.technicalFeasibility.contextWindowSize || 8192,
            explanation: 'Should manage context within window limits'
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: 'context_usage < context_limit',
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'context_usage',
            type: 'gauge',
            unit: 'tokens'
          },
          {
            name: 'context_efficiency',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      }
    ];
    
    return {
      id: 'perf-token-tests',
      name: 'Token Optimization Suite',
      description: 'Token usage and efficiency validation',
      type: 'cost_efficiency',
      priority: 'medium',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 2,
        percentage: 100,
        byType: { cost_control: 100 },
        gaps: []
      }
    };
  }
  
  private generateScalabilityTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig,
    perfRequirements: any
  ): TestSuite {
    const scenarios: TestScenario[] = [
      {
        id: 'perf-scale-rampup',
        name: 'Load Ramp-up Test',
        description: 'Test system behavior during load increase',
        guardrailId: 'performance-scalability',
        inputs: [
          {
            type: 'api_call',
            value: {
              startRate: 10,
              endRate: perfRequirements.expectedThroughput * 2,
              duration: '5m',
              pattern: 'ramp'
            },
            metadata: { test_type: 'ramp_up' }
          }
        ],
        expectedOutputs: [
          {
            type: 'pattern',
            value: 'GRACEFUL_SCALING',
            explanation: 'System should scale gracefully with load'
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: 'scaling_efficiency > 0.8',
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'scaling_efficiency',
            type: 'gauge',
            unit: 'ratio'
          },
          {
            name: 'resource_utilization',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      },
      {
        id: 'perf-scale-concurrent',
        name: 'Concurrent Users Test',
        description: 'Test with expected concurrent users',
        guardrailId: 'performance-concurrency',
        inputs: [
          {
            type: 'api_call',
            value: {
              concurrentUsers: perfRequirements.concurrentUsers,
              duration: '10m',
              pattern: 'constant'
            },
            metadata: { test_type: 'concurrency' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 0.99,
            explanation: 'Should handle all concurrent users'
          }
        ],
        assertions: [
          {
            type: 'performance_threshold',
            condition: 'success_rate > 0.99',
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'concurrent_users',
            type: 'gauge'
          },
          {
            name: 'success_rate',
            type: 'gauge',
            unit: 'percentage'
          }
        ],
        weight: 2.0
      }
    ];
    
    return {
      id: 'perf-scalability-tests',
      name: 'Scalability Test Suite',
      description: 'System scaling and concurrency validation',
      type: 'performance',
      priority: 'high',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 3,
        percentage: (scenarios.length / 3) * 100,
        byType: { performance: 67 },
        gaps: ['Auto-scaling tests']
      }
    };
  }
  
  private calculateCoverage(
    testSuites: TestSuite[],
    guardrails: GuardrailsConfig
  ): any {
    const totalScenarios = testSuites.reduce((sum, suite) => sum + suite.scenarios.length, 0);
    const perfGuardrails = guardrails.guardrails.rules.operational
      .filter(g => g.type === 'performance' || g.type === 'cost_control');
    
    return {
      guardrailsCovered: totalScenarios,
      guardrailsTotal: perfGuardrails.length,
      percentage: (totalScenarios / Math.max(perfGuardrails.length, 1)) * 100,
      byType: {
        performance: 85,
        cost_control: 70
      },
      gaps: ['Cache performance', 'Database query optimization']
    };
  }
  
  private calculateConfidence(
    assessment: ComprehensiveAssessment,
    perfRequirements: any
  ): number {
    let confidence = 0.75;
    
    // Higher confidence if performance requirements are well-defined
    if (perfRequirements.maxLatency && perfRequirements.expectedThroughput) {
      confidence += 0.1;
    }
    
    // Lower confidence for very high concurrency
    if (perfRequirements.concurrentUsers > 1000) {
      confidence -= 0.1;
    }
    
    return Math.min(confidence, 0.9);
  }
  
  private generateRecommendations(perfRequirements: any): string[] {
    const recommendations: string[] = [];
    
    if (perfRequirements.maxLatency < 100) {
      recommendations.push('Consider edge caching for ultra-low latency requirements');
      recommendations.push('Implement request coalescing to reduce backend load');
    }
    
    if (perfRequirements.concurrentUsers > 500) {
      recommendations.push('Implement connection pooling and request queuing');
      recommendations.push('Consider horizontal scaling with load balancing');
    }
    
    if (perfRequirements.expectedThroughput > 100) {
      recommendations.push('Implement response caching for common queries');
      recommendations.push('Use async processing for non-critical operations');
    }
    
    recommendations.push('Set up performance monitoring and alerting');
    recommendations.push('Implement gradual rollout to detect performance regressions');
    
    return recommendations;
  }
}