/**
 * Performance Test Agent
 * Specializes in generating performance and scalability test scenarios
 */

import { BaseTestAgent } from './BaseTestAgent';
import { EvaluationContext } from '../evaluation-context-aggregator';
import { AgentTestProposal } from '../evaluation-generation-orchestrator';
import { TestScenario } from '../types';

export class PerformanceTestAgent extends BaseTestAgent {
  constructor() {
    super('performance-agent', 'performance', 6);
  }

  async generateTests(context: EvaluationContext): Promise<AgentTestProposal> {
    console.log(`⚡ ${this.agentId}: Generating performance test scenarios...`);

    if (!this.shouldActivate(context)) {
      return {
        agentId: this.agentId,
        agentType: this.agentType,
        testSuites: [],
        confidence: 0,
        reasoning: 'Performance testing not required for low-traffic system',
        recommendations: []
      };
    }

    const testSuites = [];
    
    // Generate latency tests
    const latencyScenarios = await this.generateLatencyTests(context);
    if (latencyScenarios.length > 0) {
      testSuites.push(this.buildTestSuite(
        latencyScenarios,
        'Latency Tests',
        'Response time and latency validation',
        this.determinePriority(context)
      ));
    }

    // Generate throughput tests
    const throughputScenarios = await this.generateThroughputTests(context);
    if (throughputScenarios.length > 0) {
      testSuites.push(this.buildTestSuite(
        throughputScenarios,
        'Throughput Tests',
        'System throughput and capacity testing',
        'high'
      ));
    }

    // Generate load tests
    if (context.performance.concurrentUsers > 50) {
      const loadScenarios = await this.generateLoadTests(context);
      if (loadScenarios.length > 0) {
        testSuites.push(this.buildTestSuite(
          loadScenarios,
          'Load Tests',
          'Concurrent user and load handling',
          'high'
        ));
      }
    }

    // Generate resource usage tests
    const resourceScenarios = await this.generateResourceTests(context);
    if (resourceScenarios.length > 0) {
      testSuites.push(this.buildTestSuite(
        resourceScenarios,
        'Resource Usage Tests',
        'Token usage and compute resource optimization',
        'medium'
      ));
    }

    return {
      agentId: this.agentId,
      agentType: this.agentType,
      testSuites,
      confidence: this.calculateConfidence(context, testSuites),
      reasoning: this.generateReasoning(context, testSuites),
      recommendations: this.generateRecommendations(context, testSuites)
    };
  }

  protected shouldActivate(context: EvaluationContext): boolean {
    // Activate if significant traffic expected or strict performance requirements
    return context.performance.expectedRequestsPerDay > 1000 ||
           context.performance.concurrentUsers > 10 ||
           context.performance.latencyThreshold < 2000 ||
           context.useCase.systemCriticality === 'Mission Critical';
  }

  protected getSystemPrompt(): string {
    return `You are a performance testing specialist for AI systems.
    Generate performance test scenarios that validate latency, throughput, scalability, and resource usage.
    Focus on realistic load patterns, edge cases, and performance bottlenecks.
    Include specific metrics and thresholds.`;
  }

  private async generateLatencyTests(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate latency test scenarios for this AI system.

PERFORMANCE REQUIREMENTS:
- Response Time: ${context.performance.responseTimeRequirement}
- Latency Threshold: ${context.performance.latencyThreshold}ms
- System Criticality: ${context.useCase.systemCriticality}

Generate 6 test scenarios for:
- Simple prompt latency
- Complex prompt latency
- Multi-turn conversation latency
- Cold start latency
- Peak load latency
- Streaming response latency

Response format:
{
  "scenarios": [
    {
      "name": "Latency test name",
      "description": "What aspect of latency is tested",
      "testInput": "Specific prompt to test latency",
      "expectedBehavior": "Response within X ms",
      "assertions": ["Latency < threshold", "Response complete"],
      "priority": "high",
      "tags": ["performance", "latency"]
    }
  ]
}`;

    return await this.generateScenariosWithLLM(prompt, 'latency', 6);
  }

  private async generateThroughputTests(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate throughput test scenarios.

EXPECTED LOAD:
- Daily Requests: ${context.performance.expectedRequestsPerDay}
- Concurrent Users: ${context.performance.concurrentUsers}
- Availability: ${context.performance.availabilityRequirement}

Generate 5 test scenarios for:
- Sustained throughput
- Burst traffic handling
- Request queuing
- Rate limiting behavior
- Throughput under different prompt sizes

Response format:
{
  "scenarios": [
    {
      "name": "Throughput test name",
      "description": "Throughput aspect tested",
      "testInput": "Load pattern description",
      "expectedBehavior": "System handles X requests/second",
      "assertions": ["Throughput >= target", "No dropped requests"],
      "priority": "high",
      "tags": ["performance", "throughput"]
    }
  ]
}`;

    return await this.generateScenariosWithLLM(prompt, 'throughput', 5);
  }

  private async generateLoadTests(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate load test scenarios.

LOAD PROFILE:
- Concurrent Users: ${context.performance.concurrentUsers}
- Daily Requests: ${context.performance.expectedRequestsPerDay}
- Peak Hours: Assumed 20% of traffic in 2 hours

Generate 4 test scenarios for:
- Gradual load increase
- Spike testing
- Sustained peak load
- Load with varied request types

Response format:
{
  "scenarios": [
    {
      "name": "Load test name",
      "description": "Load pattern being tested",
      "testInput": "Load simulation details",
      "expectedBehavior": "System remains stable under load",
      "assertions": ["Error rate < 1%", "Latency p95 < threshold"],
      "priority": "high",
      "tags": ["performance", "load", "scalability"]
    }
  ]
}`;

    return await this.generateScenariosWithLLM(prompt, 'load', 4);
  }

  private async generateResourceTests(context: EvaluationContext): Promise<TestScenario[]> {
    const prompt = `Generate resource usage test scenarios.

CONTEXT:
- Use Case: ${context.useCase.title}
- Budget Constraints: ${context.organizational.testingBudget ? 'Yes' : 'No'}

Generate 4 test scenarios for:
- Token usage optimization
- Memory consumption
- API quota management
- Cost per request

Response format:
{
  "scenarios": [
    {
      "name": "Resource test name",
      "description": "Resource aspect tested",
      "testInput": "Scenario that tests resource usage",
      "expectedBehavior": "Efficient resource utilization",
      "assertions": ["Token usage < limit", "Cost within budget"],
      "priority": "medium",
      "tags": ["performance", "resources", "cost"]
    }
  ]
}`;

    return await this.generateScenariosWithLLM(prompt, 'resources', 4);
  }

  protected getMetricsForScenario(scenario: any): any[] {
    const metrics = [
      { name: 'response_latency', type: 'gauge', unit: 'ms' },
      { name: 'request_duration', type: 'histogram', unit: 'ms' }
    ];

    if (scenario.tags?.includes('throughput')) {
      metrics.push(
        { name: 'requests_per_second', type: 'gauge', unit: 'req/s' },
        { name: 'concurrent_requests', type: 'gauge', unit: 'count' }
      );
    }

    if (scenario.tags?.includes('resources')) {
      metrics.push(
        { name: 'token_usage', type: 'gauge', unit: 'tokens' },
        { name: 'memory_usage', type: 'gauge', unit: 'MB' },
        { name: 'api_cost', type: 'gauge', unit: 'USD' }
      );
    }

    if (scenario.tags?.includes('load')) {
      metrics.push(
        { name: 'error_rate', type: 'gauge', unit: 'percentage' },
        { name: 'queue_length', type: 'gauge', unit: 'count' }
      );
    }

    return metrics;
  }

  protected generateFallbackScenarios(context: string, maxScenarios: number): TestScenario[] {
    const scenarios: TestScenario[] = [];
    
    const performanceTests = [
      { name: "Simple Prompt Latency", input: "What is 2+2?", threshold: 500 },
      { name: "Complex Prompt Latency", input: "Analyze this 500-word document and provide insights...", threshold: 2000 },
      { name: "Burst Traffic", input: "10 concurrent simple requests", threshold: 1000 },
      { name: "Token Optimization", input: "Generate a concise summary", threshold: 100 }
    ];

    for (let i = 0; i < Math.min(maxScenarios, performanceTests.length); i++) {
      const test = performanceTests[i];
      scenarios.push({
        id: `performance-fallback-${i}`,
        name: test.name,
        description: 'Fallback performance test',
        guardrailId: 'performance',
        inputs: [{
          type: 'prompt',
          value: test.input,
          metadata: { fallback: true }
        }],
        expectedOutputs: [{
          type: 'threshold',
          value: `Response within ${test.threshold}ms`,
          explanation: 'Performance requirement'
        }],
        assertions: [{
          type: 'performance_threshold',
          condition: `latency < ${test.threshold}`,
          expected: true,
          severity: 'should_pass',
          message: 'Latency check'
        }],
        metrics: this.getMetricsForScenario({ tags: ['performance'] }),
        weight: 1.0,
        tags: ['performance', 'fallback']
      });
    }

    return scenarios;
  }

  private calculateConfidence(context: EvaluationContext, testSuites: any[]): number {
    let confidence = 0.75;
    
    // Adjust based on performance requirements
    if (context.performance.latencyThreshold < 500) confidence += 0.05;
    if (context.performance.concurrentUsers > 100) confidence += 0.05;
    if (context.performance.expectedRequestsPerDay > 10000) confidence += 0.05;
    
    // Adjust based on test coverage
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.scenarios.length, 0);
    if (totalTests > 15) confidence += 0.05;
    
    return Math.min(confidence, 0.9);
  }

  private generateReasoning(context: EvaluationContext, testSuites: any[]): string {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.scenarios.length, 0);
    
    return `Generated ${totalTests} performance test scenarios covering ` +
           `latency (threshold: ${context.performance.latencyThreshold}ms), ` +
           `throughput (${context.performance.expectedRequestsPerDay} requests/day), ` +
           `${context.performance.concurrentUsers > 50 ? 'load testing, ' : ''}` +
           `and resource optimization. ` +
           `System must maintain ${context.performance.availabilityRequirement} availability.`;
  }

  private generateRecommendations(context: EvaluationContext, testSuites: any[]): string[] {
    const recommendations: string[] = [];
    
    if (context.performance.latencyThreshold < 500) {
      recommendations.push('Implement response caching for frequently requested prompts');
    }
    
    if (context.performance.concurrentUsers > 100) {
      recommendations.push('Set up auto-scaling for high concurrent load');
    }
    
    if (context.performance.expectedRequestsPerDay > 50000) {
      recommendations.push('Consider load balancing across multiple AI model instances');
    }
    
    if (context.organizational.testingBudget) {
      recommendations.push('Monitor token usage closely to stay within budget');
    }
    
    recommendations.push('Run performance tests during expected peak hours');
    
    return recommendations;
  }
}