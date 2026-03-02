/**
 * Cost Test Agent
 * Generates cost optimization test scenarios
 */

import { BaseTestAgent } from './BaseTestAgent';
import { EvaluationContext } from '../evaluation-context-aggregator';
import { AgentTestProposal } from '../evaluation-generation-orchestrator';
import { TestScenario } from '../types';

export class CostTestAgent extends BaseTestAgent {
  constructor() {
    super('cost-agent', 'cost', 4);
  }

  async generateTests(context: EvaluationContext): Promise<AgentTestProposal> {
    console.log(`💰 ${this.agentId}: Generating cost optimization test scenarios...`);

    if (!this.shouldActivate(context)) {
      return {
        agentId: this.agentId,
        agentType: this.agentType,
        testSuites: [],
        confidence: 0,
        reasoning: 'Cost testing not required',
        recommendations: []
      };
    }

    const scenarios = await this.generateCostScenarios(context);
    const testSuites = scenarios.length > 0 ? [
      this.buildTestSuite(scenarios, 'Cost Tests', 'Cost and resource optimization', 'medium')
    ] : [];

    return {
      agentId: this.agentId,
      agentType: this.agentType,
      testSuites,
      confidence: 0.75,
      reasoning: `Generated ${scenarios.length} cost optimization tests`,
      recommendations: ['Monitor token usage', 'Implement caching strategies']
    };
  }

  protected shouldActivate(context: EvaluationContext): boolean {
    return context.organizational.testingBudget !== undefined ||
           context.guardrails.rulesByType['cost_control'] > 0;
  }

  protected getSystemPrompt(): string {
    return 'You are a cost optimization specialist. Generate tests for token usage and resource efficiency.';
  }

  private async generateCostScenarios(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate cost optimization test scenarios for token usage and API costs.`;
    return await this.generateScenariosWithLLM(prompt, 'cost', 5);
  }

  protected getMetricsForScenario(scenario: any): any[] {
    return [
      { name: 'token_usage', type: 'gauge', unit: 'tokens' },
      { name: 'api_cost', type: 'gauge', unit: 'USD' }
    ];
  }

  protected generateFallbackScenarios(context: string, maxScenarios: number): TestScenario[] {
    return [];
  }
}