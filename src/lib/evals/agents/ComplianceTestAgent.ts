/**
 * Compliance Test Agent
 * Generates compliance and regulatory test scenarios
 */

import { BaseTestAgent } from './BaseTestAgent';
import { EvaluationContext } from '../evaluation-context-aggregator';
import { AgentTestProposal } from '../evaluation-generation-orchestrator';
import { TestScenario } from '../types';

export class ComplianceTestAgent extends BaseTestAgent {
  constructor() {
    super('compliance-agent', 'compliance', 8);
  }

  async generateTests(context: EvaluationContext): Promise<AgentTestProposal> {
    console.log(`📋 ${this.agentId}: Generating compliance test scenarios...`);

    if (!this.shouldActivate(context)) {
      return {
        agentId: this.agentId,
        agentType: this.agentType,
        testSuites: [],
        confidence: 0,
        reasoning: 'No compliance requirements identified',
        recommendations: []
      };
    }

    const scenarios = await this.generateComplianceScenarios(context);
    const testSuites = scenarios.length > 0 ? [
      this.buildTestSuite(
        scenarios,
        'Compliance Tests',
        'Regulatory compliance validation',
        'high'
      )
    ] : [];

    return {
      agentId: this.agentId,
      agentType: this.agentType,
      testSuites,
      confidence: 0.85,
      reasoning: `Generated ${scenarios.length} compliance tests for ${context.compliance.frameworks.join(', ')}`,
      recommendations: this.generateRecommendations(context)
    };
  }

  protected shouldActivate(context: EvaluationContext): boolean {
    return context.compliance.frameworks.length > 0;
  }

  protected getSystemPrompt(): string {
    return 'You are a compliance testing specialist. Generate tests for regulatory requirements.';
  }

  private async generateComplianceScenarios(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate compliance test scenarios for ${context.compliance.frameworks.join(', ')}.\n` +
                  `Focus on data protection, consent, audit trails, and regulatory requirements.`;
    return await this.generateScenariosWithLLM(prompt, 'compliance', 8);
  }

  protected getMetricsForScenario(scenario: any): any[] {
    return [
      { name: 'compliance_violations', type: 'counter' },
      { name: 'audit_score', type: 'gauge', unit: 'score' }
    ];
  }

  protected generateFallbackScenarios(context: string, maxScenarios: number): TestScenario[] {
    return [];
  }

  private generateRecommendations(context: EvaluationContext): string[] {
    const recommendations = [];
    if (context.compliance.frameworks.includes('GDPR')) {
      recommendations.push('Ensure data minimization and consent management');
    }
    if (context.compliance.frameworks.includes('HIPAA')) {
      recommendations.push('Implement PHI detection and protection');
    }
    return recommendations;
  }
}