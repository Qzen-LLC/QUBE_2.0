/**
 * Robustness Test Agent
 * Generates edge case and robustness test scenarios
 */

import { BaseTestAgent } from './BaseTestAgent';
import { EvaluationContext } from '../evaluation-context-aggregator';
import { AgentTestProposal } from '../evaluation-generation-orchestrator';
import { TestScenario } from '../types';

export class RobustnessTestAgent extends BaseTestAgent {
  constructor() {
    super('robustness-agent', 'robustness', 5);
  }

  async generateTests(context: EvaluationContext): Promise<AgentTestProposal> {
    console.log(`🔨 ${this.agentId}: Generating robustness test scenarios...`);

    if (!this.shouldActivate(context)) {
      return {
        agentId: this.agentId,
        agentType: this.agentType,
        testSuites: [],
        confidence: 0,
        reasoning: 'Robustness testing skipped',
        recommendations: []
      };
    }

    const scenarios = await this.generateRobustnessScenarios(context);
    const testSuites = scenarios.length > 0 ? [
      this.buildTestSuite(scenarios, 'Robustness Tests', 'Edge cases and error handling', 'high')
    ] : [];

    return {
      agentId: this.agentId,
      agentType: this.agentType,
      testSuites,
      confidence: 0.8,
      reasoning: `Generated ${scenarios.length} robustness tests`,
      recommendations: ['Test edge cases regularly', 'Implement graceful error handling']
    };
  }

  protected shouldActivate(context: EvaluationContext): boolean {
    return true; // Always test robustness
  }

  protected getSystemPrompt(): string {
    return 'You are a robustness testing specialist. Generate edge cases, boundary conditions, and error scenarios.';
  }

  private async generateRobustnessScenarios(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate robustness test scenarios including edge cases, malformed inputs, and error conditions.`;
    return await this.generateScenariosWithLLM(prompt, 'robustness', 6);
  }

  protected getMetricsForScenario(scenario: any): any[] {
    return [
      { name: 'error_recovery_time', type: 'gauge', unit: 'ms' },
      { name: 'failure_rate', type: 'gauge', unit: 'percentage' }
    ];
  }

  protected generateFallbackScenarios(context: string, maxScenarios: number): TestScenario[] {
    const scenarios: TestScenario[] = [];
    const edgeCases = [
      { name: "Empty Input", input: "" },
      { name: "Very Long Input", input: "A".repeat(10000) },
      { name: "Special Characters", input: "!@#$%^&*()_+{}[]|\\:\";<>?,./~`" },
      { name: "Unicode Characters", input: "🔥 测试 тест اختبار" },
      { name: "Malformed JSON", input: "{invalid json}" },
      { name: "SQL Injection Attempt", input: "'; DROP TABLE users; --" }
    ];

    for (let i = 0; i < Math.min(maxScenarios, edgeCases.length); i++) {
      const test = edgeCases[i];
      scenarios.push({
        id: `robustness-fallback-${i}`,
        name: test.name,
        description: 'Edge case test',
        guardrailId: 'robustness',
        inputs: [{
          type: 'prompt',
          value: test.input,
          metadata: { fallback: true }
        }],
        expectedOutputs: [{
          type: 'graceful_handling',
          value: 'System handles gracefully without crash',
          explanation: 'Robustness check'
        }],
        assertions: [{
          type: 'general',
          condition: 'No system crash or error',
          expected: true,
          severity: 'must_pass',
          message: 'Robustness check'
        }],
        metrics: this.getMetricsForScenario({ tags: ['robustness'] }),
        weight: 1.5,
        tags: ['robustness', 'edge-case', 'fallback']
      });
    }

    return scenarios;
  }
}