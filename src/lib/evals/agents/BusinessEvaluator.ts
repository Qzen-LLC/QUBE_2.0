/**
 * Business Evaluator Agent - Generates business-focused test scenarios
 */

import { GuardrailsConfig, ComprehensiveAssessment } from '../../agents/types';
import { EvaluationAgentResponse, TestSuite, TestScenario } from '../types';

export class BusinessEvaluator {
  
  async generateEvaluation(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment,
    testRequirements: any
  ): Promise<EvaluationAgentResponse> {
    const testSuites: TestSuite[] = [];
    const insights: string[] = [];
    
    // Analyze business requirements
    const businessMetrics = this.analyzeBusinessMetrics(assessment);
    
    // Generate ROI validation tests
    testSuites.push(this.generateROITests(assessment, guardrails, businessMetrics));
    insights.push(`Target ROI: ${businessMetrics.expectedROI}x in ${businessMetrics.paybackPeriod} months`);
    
    // Generate user experience tests
    testSuites.push(this.generateUserExperienceTests(assessment, guardrails));
    
    // Generate business continuity tests
    if (assessment.businessFeasibility.systemCriticality === 'critical') {
      testSuites.push(this.generateBusinessContinuityTests(assessment, guardrails));
      insights.push('Business continuity testing required for critical system');
    }
    
    // Generate cost efficiency tests
    testSuites.push(this.generateCostEfficiencyTests(assessment, guardrails, businessMetrics));
    
    const coverage = this.calculateCoverage(testSuites, guardrails);
    
    return {
      testSuites,
      insights,
      coverage,
      confidence: this.calculateConfidence(businessMetrics),
      recommendations: this.generateRecommendations(businessMetrics, assessment)
    };
  }
  
  private analyzeBusinessMetrics(assessment: ComprehensiveAssessment): any {
    const annualSavings = parseFloat(assessment.businessFeasibility.annualSavings?.replace(/[^0-9.]/g, '') || '0');
    const initialCost = assessment.budgetPlanning.initialDevCost || 100000;
    
    return {
      expectedROI: (annualSavings / initialCost).toFixed(2),
      paybackPeriod: assessment.businessFeasibility.paybackPeriod || 12,
      efficiencyGain: assessment.businessFeasibility.efficiencyGain || 20,
      monthlyBudget: assessment.budgetPlanning.baseApiCost + 
                     assessment.budgetPlanning.baseInfraCost + 
                     assessment.budgetPlanning.baseOpCost,
      userSatisfactionTarget: assessment.businessFeasibility.userSatisfactionTarget || 80,
      criticalityLevel: assessment.businessFeasibility.systemCriticality
    };
  }
  
  private generateROITests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig,
    businessMetrics: any
  ): TestSuite {
    const scenarios: TestScenario[] = [
      {
        id: 'business-roi-efficiency',
        name: 'Efficiency Gain Validation',
        description: 'Verify expected efficiency improvements',
        guardrailId: 'business-efficiency',
        inputs: [
          {
            type: 'parameter',
            value: { 
              baseline_time: 100,
              automated_time: 100 - businessMetrics.efficiencyGain
            },
            metadata: { metric: 'time_savings' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: businessMetrics.efficiencyGain,
            tolerance: 5,
            explanation: `Should achieve ${businessMetrics.efficiencyGain}% efficiency gain`
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: `efficiency_gain >= ${businessMetrics.efficiencyGain * 0.8}`,
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'efficiency_gain',
            type: 'gauge',
            unit: 'percentage'
          },
          {
            name: 'time_saved',
            type: 'gauge',
            unit: 'hours'
          }
        ],
        weight: 1.5
      },
      {
        id: 'business-roi-cost-savings',
        name: 'Cost Savings Verification',
        description: 'Validate projected cost savings',
        guardrailId: 'business-cost-savings',
        inputs: [
          {
            type: 'parameter',
            value: { 
              period: 'monthly',
              expected_savings: businessMetrics.expectedROI * businessMetrics.monthlyBudget
            },
            metadata: { validation_period: 30 }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: businessMetrics.expectedROI * businessMetrics.monthlyBudget * 0.8,
            explanation: 'Should achieve at least 80% of projected savings'
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: 'actual_savings > projected_savings * 0.8',
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'actual_savings',
            type: 'gauge',
            unit: 'USD'
          },
          {
            name: 'roi_percentage',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      },
      {
        id: 'business-roi-payback',
        name: 'Payback Period Tracking',
        description: 'Track progress toward payback period',
        guardrailId: 'business-payback',
        inputs: [
          {
            type: 'parameter',
            value: { 
              months_deployed: 6,
              target_payback: businessMetrics.paybackPeriod
            },
            metadata: { tracking: 'payback_progress' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 50,
            explanation: 'Should be on track for payback period'
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: 'payback_on_track === true',
            expected: true,
            severity: 'nice_to_have'
          }
        ],
        metrics: [
          {
            name: 'payback_progress',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      }
    ];
    
    return {
      id: 'business-roi-tests',
      name: 'ROI and Value Realization Suite',
      description: 'Business value and ROI validation',
      type: 'cost_efficiency',
      priority: 'high',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 4,
        percentage: 75,
        byType: { cost_efficiency: 75 },
        gaps: ['Indirect benefits']
      }
    };
  }
  
  private generateUserExperienceTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig
  ): TestSuite {
    const targetSatisfaction = assessment.businessFeasibility.userSatisfactionTarget || 80;
    
    const scenarios: TestScenario[] = [
      {
        id: 'business-ux-satisfaction',
        name: 'User Satisfaction Score',
        description: 'Measure user satisfaction levels',
        guardrailId: 'business-user-satisfaction',
        inputs: [
          {
            type: 'parameter',
            value: { 
              survey_responses: 100,
              satisfaction_questions: 10
            },
            metadata: { survey_type: 'CSAT' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: targetSatisfaction,
            tolerance: 5,
            explanation: `User satisfaction should meet ${targetSatisfaction}% target`
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: `satisfaction_score >= ${targetSatisfaction}`,
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'user_satisfaction_score',
            type: 'gauge',
            unit: 'percentage'
          },
          {
            name: 'nps_score',
            type: 'gauge'
          }
        ],
        weight: 1.5
      },
      {
        id: 'business-ux-usability',
        name: 'System Usability Test',
        description: 'Validate system ease of use',
        guardrailId: 'business-usability',
        inputs: [
          {
            type: 'parameter',
            value: { 
              task_completion_rate: 90,
              average_time_to_complete: 120
            },
            metadata: { usability_metric: 'SUS' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 68, // Average SUS score
            explanation: 'System Usability Scale should be above average'
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: 'sus_score > 68',
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'sus_score',
            type: 'gauge',
            unit: 'score'
          },
          {
            name: 'task_completion_rate',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      },
      {
        id: 'business-ux-adoption',
        name: 'User Adoption Rate',
        description: 'Measure system adoption metrics',
        guardrailId: 'business-adoption',
        inputs: [
          {
            type: 'parameter',
            value: { 
              eligible_users: 1000,
              active_users: 750
            },
            metadata: { period: '30_days' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 70,
            explanation: 'Adoption rate should exceed 70%'
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: 'adoption_rate >= 70',
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'adoption_rate',
            type: 'gauge',
            unit: 'percentage'
          },
          {
            name: 'daily_active_users',
            type: 'gauge'
          }
        ]
      }
    ];
    
    return {
      id: 'business-ux-tests',
      name: 'User Experience and Adoption Suite',
      description: 'User satisfaction and adoption validation',
      type: 'user_experience',
      priority: 'high',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 4,
        percentage: 75,
        byType: { user_experience: 75 },
        gaps: ['Accessibility testing']
      }
    };
  }
  
  private generateBusinessContinuityTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig
  ): TestSuite {
    const availabilityTarget = parseFloat(
      assessment.businessFeasibility.availabilityRequirement?.replace('%', '') || '99.9'
    );
    
    const scenarios: TestScenario[] = [
      {
        id: 'business-continuity-availability',
        name: 'Service Availability Test',
        description: 'Verify uptime meets requirements',
        guardrailId: 'business-availability',
        inputs: [
          {
            type: 'parameter',
            value: { 
              monitoring_period: '30_days',
              expected_availability: availabilityTarget
            },
            metadata: { test_type: 'availability' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: availabilityTarget,
            explanation: `Availability should meet ${availabilityTarget}% target`
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: `availability >= ${availabilityTarget}`,
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'availability_percentage',
            type: 'gauge',
            unit: 'percentage'
          },
          {
            name: 'mtbf',
            type: 'gauge',
            unit: 'hours'
          }
        ],
        weight: 2.0
      },
      {
        id: 'business-continuity-recovery',
        name: 'Disaster Recovery Test',
        description: 'Validate recovery time objectives',
        guardrailId: 'business-recovery',
        inputs: [
          {
            type: 'api_call',
            value: { 
              action: 'simulate_failure',
              component: 'primary_system'
            },
            metadata: { disaster_type: 'system_failure' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 3600, // 1 hour RTO
            explanation: 'Recovery should complete within RTO'
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: 'recovery_time < 3600',
            expected: true,
            severity: 'must_pass'
          },
          {
            type: 'compliance_met',
            condition: 'data_loss === 0',
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'recovery_time',
            type: 'gauge',
            unit: 'seconds'
          },
          {
            name: 'rpo_compliance',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      },
      {
        id: 'business-continuity-failover',
        name: 'Failover Mechanism Test',
        description: 'Test automatic failover capabilities',
        guardrailId: 'business-failover',
        inputs: [
          {
            type: 'api_call',
            value: { 
              action: 'trigger_failover',
              automatic: true
            },
            metadata: { failover_type: 'automatic' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 30, // 30 seconds failover
            explanation: 'Failover should complete quickly'
          }
        ],
        assertions: [
          {
            type: 'compliance_met',
            condition: 'failover_time < 30',
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'failover_time',
            type: 'gauge',
            unit: 'seconds'
          },
          {
            name: 'session_preservation',
            type: 'gauge',
            unit: 'percentage'
          }
        ]
      }
    ];
    
    return {
      id: 'business-continuity-tests',
      name: 'Business Continuity Suite',
      description: 'Service availability and recovery validation',
      type: 'robustness',
      priority: 'critical',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 4,
        percentage: 75,
        byType: { robustness: 75 },
        gaps: ['Geographic redundancy']
      }
    };
  }
  
  private generateCostEfficiencyTests(
    assessment: ComprehensiveAssessment,
    guardrails: GuardrailsConfig,
    businessMetrics: any
  ): TestSuite {
    const monthlyBudget = businessMetrics.monthlyBudget;
    
    const scenarios: TestScenario[] = [
      {
        id: 'business-cost-budget-compliance',
        name: 'Budget Compliance Test',
        description: 'Verify costs stay within budget',
        guardrailId: 'business-budget',
        inputs: [
          {
            type: 'parameter',
            value: { 
              current_month_spend: monthlyBudget * 0.9,
              budget_limit: monthlyBudget
            },
            metadata: { monitoring_type: 'budget' }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: monthlyBudget,
            explanation: 'Spending should not exceed budget'
          }
        ],
        assertions: [
          {
            type: 'cost_within_budget',
            condition: `monthly_spend <= ${monthlyBudget}`,
            expected: true,
            severity: 'must_pass'
          }
        ],
        metrics: [
          {
            name: 'budget_utilization',
            type: 'gauge',
            unit: 'percentage'
          },
          {
            name: 'cost_variance',
            type: 'gauge',
            unit: 'USD'
          }
        ]
      },
      {
        id: 'business-cost-optimization',
        name: 'Cost Optimization Effectiveness',
        description: 'Validate cost optimization strategies',
        guardrailId: 'business-cost-optimization',
        inputs: [
          {
            type: 'parameter',
            value: { 
              optimization_strategies: ['caching', 'batching', 'compression'],
              baseline_cost: 1000
            },
            metadata: { optimization_enabled: true }
          }
        ],
        expectedOutputs: [
          {
            type: 'threshold',
            value: 0.2, // 20% cost reduction
            explanation: 'Optimizations should reduce costs by 20%'
          }
        ],
        assertions: [
          {
            type: 'cost_within_budget',
            condition: 'cost_reduction >= 0.2',
            expected: true,
            severity: 'should_pass'
          }
        ],
        metrics: [
          {
            name: 'cost_reduction_percentage',
            type: 'gauge',
            unit: 'percentage'
          },
          {
            name: 'optimization_effectiveness',
            type: 'gauge',
            unit: 'score'
          }
        ]
      }
    ];
    
    return {
      id: 'business-cost-tests',
      name: 'Cost Efficiency Suite',
      description: 'Cost management and optimization validation',
      type: 'cost_efficiency',
      priority: 'medium',
      scenarios,
      coverage: {
        guardrailsCovered: scenarios.length,
        guardrailsTotal: 3,
        percentage: 67,
        byType: { cost_efficiency: 67 },
        gaps: ['Resource utilization']
      }
    };
  }
  
  private calculateCoverage(
    testSuites: TestSuite[],
    guardrails: GuardrailsConfig
  ): any {
    const totalScenarios = testSuites.reduce((sum, suite) => sum + suite.scenarios.length, 0);
    const businessGuardrails = guardrails.guardrails.rules.economic;
    
    return {
      guardrailsCovered: totalScenarios,
      guardrailsTotal: businessGuardrails.length,
      percentage: (totalScenarios / Math.max(businessGuardrails.length, 1)) * 100,
      byType: {
        cost_efficiency: 75,
        user_experience: 80,
        robustness: 70
      },
      gaps: ['Market competitiveness', 'Scalability economics']
    };
  }
  
  private calculateConfidence(businessMetrics: any): number {
    let confidence = 0.75;
    
    // Higher confidence if ROI is well-defined
    if (parseFloat(businessMetrics.expectedROI) > 2) {
      confidence += 0.1;
    }
    
    // Lower confidence for critical systems
    if (businessMetrics.criticalityLevel === 'critical') {
      confidence -= 0.05;
    }
    
    return Math.min(confidence, 0.9);
  }
  
  private generateRecommendations(
    businessMetrics: any,
    assessment: ComprehensiveAssessment
  ): string[] {
    const recommendations: string[] = [];
    
    if (parseFloat(businessMetrics.expectedROI) < 1) {
      recommendations.push('Consider additional value streams to improve ROI');
      recommendations.push('Explore cost optimization opportunities');
    }
    
    if (businessMetrics.paybackPeriod > 18) {
      recommendations.push('Implement phased rollout to show early value');
      recommendations.push('Identify quick wins for immediate impact');
    }
    
    if (businessMetrics.criticalityLevel === 'critical') {
      recommendations.push('Implement comprehensive monitoring and alerting');
      recommendations.push('Establish 24/7 support procedures');
      recommendations.push('Create detailed runbooks for common issues');
    }
    
    if (businessMetrics.userSatisfactionTarget > 85) {
      recommendations.push('Conduct regular user feedback sessions');
      recommendations.push('Implement A/B testing for improvements');
      recommendations.push('Create user training and documentation');
    }
    
    recommendations.push('Track business KPIs continuously');
    recommendations.push('Regular business value reviews with stakeholders');
    recommendations.push('Maintain cost-benefit analysis documentation');
    
    return recommendations;
  }
}