/**
 * Evaluation Generation Orchestrator
 * Coordinates specialist test generation agents to create comprehensive test suites
 * Manages agent collaboration, conflict resolution, and test synthesis
 */

import { EvaluationContext } from './evaluation-context-aggregator';
import { EvaluationConfig, TestSuite, TestScenario } from './types';
import { SafetyTestAgent } from './agents/SafetyTestAgent';
import { PerformanceTestAgent } from './agents/PerformanceTestAgent';
import { ComplianceTestAgent } from './agents/ComplianceTestAgent';
import { EthicsTestAgent } from './agents/EthicsTestAgent';
import { SecurityTestAgent } from './agents/SecurityTestAgent';
import { CostTestAgent } from './agents/CostTestAgent';
import { DriftTestAgent } from './agents/DriftTestAgent';
import { RobustnessTestAgent } from './agents/RobustnessTestAgent';

export interface AgentTestProposal {
  agentId: string;
  agentType: string;
  testSuites: TestSuite[];
  confidence: number;
  reasoning: string;
  recommendations: string[];
}

export interface TestConflict {
  type: 'duplicate' | 'contradiction' | 'overlap' | 'resource';
  severity: 'high' | 'medium' | 'low';
  affectedTests: string[];
  description: string;
  resolution?: string;
}

export interface OrchestrationResult {
  testSuites: TestSuite[];
  totalScenarios: number;
  coverage: {
    overall: number;
    byDomain: Record<string, number>;
    gaps: string[];
  };
  conflicts: TestConflict[];
  resolutions: string[];
  confidence: number;
  metadata: {
    agents: string[];
    duration: number;
    version: string;
  };
}

interface TestAgent {
  generateTests(context: EvaluationContext): Promise<AgentTestProposal>;
  getName(): string;
  getType(): string;
  getPriority(): number;
}

export class EvaluationGenerationOrchestrator {
  private agents: Map<string, TestAgent>;
  private startTime: number = 0;

  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  /**
   * Initialize all specialist test generation agents
   */
  private initializeAgents() {
    // Core testing agents
    this.agents.set('safety', new SafetyTestAgent());
    this.agents.set('performance', new PerformanceTestAgent());
    this.agents.set('compliance', new ComplianceTestAgent());
    this.agents.set('ethics', new EthicsTestAgent());
    this.agents.set('security', new SecurityTestAgent());
    this.agents.set('cost', new CostTestAgent());
    this.agents.set('drift', new DriftTestAgent());
    this.agents.set('robustness', new RobustnessTestAgent());
  }

  /**
   * Orchestrate test generation across all agents
   */
  async orchestrateTestGeneration(context: EvaluationContext): Promise<OrchestrationResult> {
    console.log('🤖 Orchestrator: Starting test generation coordination...');
    this.startTime = Date.now();

    try {
      // Phase 1: Determine which agents to activate
      const activeAgents = this.selectActiveAgents(context);
      console.log(`   Active agents: ${activeAgents.join(', ')}`);

      // Phase 2: Gather test proposals from all agents in parallel
      const proposals = await this.gatherAgentProposals(activeAgents, context);

      // Phase 3: Identify conflicts and overlaps
      const conflicts = this.identifyConflicts(proposals);
      console.log(`   Identified ${conflicts.length} conflicts`);

      // Phase 4: Resolve conflicts and optimize
      const resolutions = this.resolveConflicts(conflicts, proposals);

      // Phase 5: Synthesize final test suites
      const synthesizedSuites = this.synthesizeTestSuites(proposals, resolutions);

      // Phase 6: Calculate coverage and identify gaps
      const coverage = this.calculateCoverage(synthesizedSuites, context);

      // Phase 7: Optimize test execution order
      const optimizedSuites = this.optimizeExecutionOrder(synthesizedSuites, context);

      const duration = Date.now() - this.startTime;
      console.log(`✅ Orchestration completed in ${duration}ms`);

      return {
        testSuites: optimizedSuites,
        totalScenarios: optimizedSuites.reduce((sum, suite) => sum + suite.scenarios.length, 0),
        coverage,
        conflicts,
        resolutions,
        confidence: this.calculateOverallConfidence(proposals),
        metadata: {
          agents: activeAgents,
          duration,
          version: '2.0.0'
        }
      };
    } catch (error) {
      console.error('Orchestration failed:', error);
      throw new Error(`Test orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Select which agents to activate based on context
   */
  private selectActiveAgents(context: EvaluationContext): string[] {
    const activeAgents: string[] = [];

    // Always include safety and robustness
    activeAgents.push('safety', 'robustness');

    // Add performance if high load or strict requirements
    if (context.performance.expectedRequestsPerDay > 1000 ||
        context.performance.concurrentUsers > 50 ||
        context.performance.latencyThreshold < 500) {
      activeAgents.push('performance');
    }

    // Add compliance if frameworks present
    if (context.compliance.frameworks.length > 0) {
      activeAgents.push('compliance');
    }

    // Add ethics if ethical concerns identified
    if (context.risks.identified.some(r => r.category === 'Ethical') ||
        context.guardrails.rulesByType['bias_mitigation'] > 0) {
      activeAgents.push('ethics');
    }

    // Add security for public-facing or agent systems
    if (context.useCase.primaryStakeholders.includes('General Public') ||
        context.guardrails.rulesByType['agent_behavior'] > 0 ||
        context.useCase.systemCriticality === 'Mission Critical') {
      activeAgents.push('security');
    }

    // Add cost optimization if budget constraints
    if (context.organizational.testingBudget ||
        context.guardrails.rulesByType['cost_control'] > 0) {
      activeAgents.push('cost');
    }

    // Add drift detection for production systems
    if (context.testingContext.previousEvaluations > 0) {
      activeAgents.push('drift');
    }

    return [...new Set(activeAgents)]; // Remove duplicates
  }

  /**
   * Gather test proposals from all active agents
   */
  private async gatherAgentProposals(
    activeAgents: string[],
    context: EvaluationContext
  ): Promise<AgentTestProposal[]> {
    console.log('📊 Gathering proposals from agents...');

    const proposalPromises = activeAgents.map(async (agentId) => {
      const agent = this.agents.get(agentId);
      if (!agent) {
        console.warn(`Agent ${agentId} not found`);
        return null;
      }

      try {
        console.log(`   Requesting proposal from ${agentId} agent...`);
        const proposal = await agent.generateTests(context);
        console.log(`   ✅ ${agentId} agent generated ${proposal.testSuites.length} test suites`);
        return proposal;
      } catch (error) {
        console.error(`   ❌ ${agentId} agent failed:`, error);
        return null;
      }
    });

    const proposals = await Promise.all(proposalPromises);
    return proposals.filter((p): p is AgentTestProposal => p !== null);
  }

  /**
   * Identify conflicts between test proposals
   */
  private identifyConflicts(proposals: AgentTestProposal[]): TestConflict[] {
    const conflicts: TestConflict[] = [];
    const scenarioFingerprints = new Map<string, string[]>();

    // Build fingerprint map
    proposals.forEach(proposal => {
      proposal.testSuites.forEach(suite => {
        suite.scenarios.forEach(scenario => {
          const fingerprint = this.generateScenarioFingerprint(scenario);
          const agents = scenarioFingerprints.get(fingerprint) || [];
          agents.push(proposal.agentId);
          scenarioFingerprints.set(fingerprint, agents);
        });
      });
    });

    // Identify duplicates
    scenarioFingerprints.forEach((agents, fingerprint) => {
      if (agents.length > 1) {
        conflicts.push({
          type: 'duplicate',
          severity: 'low',
          affectedTests: agents,
          description: `Duplicate test scenario detected across ${agents.join(', ')} agents`
        });
      }
    });

    // Identify contradictions
    this.identifyContradictions(proposals, conflicts);

    // Identify resource conflicts
    this.identifyResourceConflicts(proposals, conflicts);

    return conflicts;
  }

  /**
   * Identify contradictory test approaches
   */
  private identifyContradictions(proposals: AgentTestProposal[], conflicts: TestConflict[]): void {
    // Check for contradictory test expectations
    const testExpectations = new Map<string, Set<string>>();

    proposals.forEach(proposal => {
      proposal.testSuites.forEach(suite => {
        suite.scenarios.forEach(scenario => {
          const inputKey = scenario.inputs[0]?.value?.substring(0, 50) || '';
          const expectation = scenario.expectedOutputs[0]?.type || '';
          
          if (!testExpectations.has(inputKey)) {
            testExpectations.set(inputKey, new Set());
          }
          testExpectations.get(inputKey)!.add(expectation);
        });
      });
    });

    // Find contradictions
    testExpectations.forEach((expectations, input) => {
      if (expectations.size > 1 && expectations.has('pass') && expectations.has('block')) {
        conflicts.push({
          type: 'contradiction',
          severity: 'high',
          affectedTests: Array.from(expectations),
          description: `Contradictory expectations for similar input: some expect pass, others expect block`
        });
      }
    });
  }

  /**
   * Identify resource conflicts (e.g., tests that can't run in parallel)
   */
  private identifyResourceConflicts(proposals: AgentTestProposal[], conflicts: TestConflict[]): void {
    const highLoadTests: string[] = [];
    const exclusiveTests: string[] = [];

    proposals.forEach(proposal => {
      if (proposal.agentType === 'performance') {
        proposal.testSuites.forEach(suite => {
          if (suite.type === 'performance') {
            highLoadTests.push(`${proposal.agentId}-${suite.id}`);
          }
        });
      }
      if (proposal.agentType === 'security') {
        proposal.testSuites.forEach(suite => {
          if (suite.scenarios.some(s => s.tags?.includes('destructive'))) {
            exclusiveTests.push(`${proposal.agentId}-${suite.id}`);
          }
        });
      }
    });

    if (highLoadTests.length > 1) {
      conflicts.push({
        type: 'resource',
        severity: 'medium',
        affectedTests: highLoadTests,
        description: 'Multiple high-load performance tests should not run in parallel'
      });
    }

    if (exclusiveTests.length > 0) {
      conflicts.push({
        type: 'resource',
        severity: 'high',
        affectedTests: exclusiveTests,
        description: 'Destructive security tests require exclusive execution'
      });
    }
  }

  /**
   * Resolve identified conflicts
   */
  private resolveConflicts(conflicts: TestConflict[], proposals: AgentTestProposal[]): string[] {
    const resolutions: string[] = [];

    conflicts.forEach(conflict => {
      switch (conflict.type) {
        case 'duplicate':
          conflict.resolution = 'Keep test from highest priority agent, discard others';
          resolutions.push(`Resolved duplicate: ${conflict.resolution}`);
          break;
          
        case 'contradiction':
          conflict.resolution = 'Use more conservative expectation (prefer block over pass)';
          resolutions.push(`Resolved contradiction: ${conflict.resolution}`);
          break;
          
        case 'overlap':
          conflict.resolution = 'Merge overlapping tests into comprehensive scenario';
          resolutions.push(`Resolved overlap: ${conflict.resolution}`);
          break;
          
        case 'resource':
          conflict.resolution = 'Schedule resource-intensive tests sequentially';
          resolutions.push(`Resolved resource conflict: ${conflict.resolution}`);
          break;
      }
    });

    return resolutions;
  }

  /**
   * Synthesize final test suites from proposals
   */
  private synthesizeTestSuites(
    proposals: AgentTestProposal[],
    resolutions: string[]
  ): TestSuite[] {
    const synthesized: TestSuite[] = [];
    const processedScenarios = new Set<string>();

    // Sort proposals by agent priority
    const sortedProposals = proposals.sort((a, b) => {
      const priorityA = this.getAgentPriority(a.agentType);
      const priorityB = this.getAgentPriority(b.agentType);
      return priorityB - priorityA;
    });

    // Process each proposal
    sortedProposals.forEach(proposal => {
      proposal.testSuites.forEach(suite => {
        const uniqueScenarios: TestScenario[] = [];

        suite.scenarios.forEach(scenario => {
          const fingerprint = this.generateScenarioFingerprint(scenario);
          
          // Skip if already processed (deduplication)
          if (!processedScenarios.has(fingerprint)) {
            processedScenarios.add(fingerprint);
            uniqueScenarios.push(this.enrichScenario(scenario, proposal.agentType));
          }
        });

        if (uniqueScenarios.length > 0) {
          synthesized.push({
            ...suite,
            scenarios: uniqueScenarios,
            metadata: {
              ...suite.metadata,
              generatedBy: proposal.agentId,
              synthesized: true
            }
          });
        }
      });
    });

    return synthesized;
  }

  /**
   * Enrich scenario with agent-specific metadata
   */
  private enrichScenario(scenario: TestScenario, agentType: string): TestScenario {
    return {
      ...scenario,
      metadata: {
        ...scenario.metadata,
        generatedBy: agentType,
        enriched: true
      },
      tags: [...(scenario.tags || []), agentType]
    };
  }

  /**
   * Calculate test coverage
   */
  private calculateCoverage(suites: TestSuite[], context: EvaluationContext): any {
    const coveredGuardrails = new Set<string>();
    const domainCoverage: Record<string, number> = {};
    const gaps: string[] = [];

    // Calculate guardrail coverage
    suites.forEach(suite => {
      suite.scenarios.forEach(scenario => {
        if (scenario.guardrailId) {
          coveredGuardrails.add(scenario.guardrailId);
        }
      });

      // Track domain coverage
      const domain = suite.type;
      domainCoverage[domain] = (domainCoverage[domain] || 0) + suite.scenarios.length;
    });

    const overallCoverage = context.guardrails.totalRules > 0
      ? (coveredGuardrails.size / context.guardrails.totalRules) * 100
      : 0;

    // Identify gaps
    if (overallCoverage < 80) {
      gaps.push(`Low overall coverage: ${overallCoverage.toFixed(1)}%`);
    }

    // Check for missing critical guardrails
    if (context.guardrails.criticalRules > 0) {
      const criticalCovered = Array.from(coveredGuardrails).filter(id => 
        id.includes('critical')
      ).length;
      if (criticalCovered < context.guardrails.criticalRules) {
        gaps.push(`Missing ${context.guardrails.criticalRules - criticalCovered} critical guardrail tests`);
      }
    }

    // Check for missing domains
    const expectedDomains = ['safety', 'performance', 'security'];
    expectedDomains.forEach(domain => {
      if (!domainCoverage[domain]) {
        gaps.push(`No tests for ${domain} domain`);
      }
    });

    return {
      overall: overallCoverage,
      byDomain: domainCoverage,
      gaps
    };
  }

  /**
   * Optimize test execution order
   */
  private optimizeExecutionOrder(suites: TestSuite[], context: EvaluationContext): TestSuite[] {
    return suites.sort((a, b) => {
      // Priority order
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Type order (safety first, then security, etc.)
      const typeOrder: Record<string, number> = {
        safety: 0,
        security: 1,
        compliance: 2,
        performance: 3,
        ethics: 4,
        cost: 5,
        drift: 6,
        robustness: 7
      };
      const typeDiff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      if (typeDiff !== 0) return typeDiff;

      // Scenario count (smaller suites first for quick feedback)
      return a.scenarios.length - b.scenarios.length;
    });
  }

  /**
   * Calculate overall confidence from all proposals
   */
  private calculateOverallConfidence(proposals: AgentTestProposal[]): number {
    if (proposals.length === 0) return 0;

    const totalConfidence = proposals.reduce((sum, p) => sum + p.confidence, 0);
    const avgConfidence = totalConfidence / proposals.length;

    // Adjust based on number of agents
    const agentBonus = Math.min(proposals.length * 0.02, 0.1); // Max 10% bonus

    return Math.min(avgConfidence + agentBonus, 0.95);
  }

  /**
   * Generate fingerprint for scenario deduplication
   */
  private generateScenarioFingerprint(scenario: TestScenario): string {
    const input = scenario.inputs[0]?.value || '';
    const type = scenario.expectedOutputs[0]?.type || '';
    const guardrail = scenario.guardrailId || '';
    
    // Create a simple hash
    const combined = `${input.substring(0, 100)}-${type}-${guardrail}`;
    return Buffer.from(combined).toString('base64').substring(0, 20);
  }

  /**
   * Get agent priority for conflict resolution
   */
  private getAgentPriority(agentType: string): number {
    const priorities: Record<string, number> = {
      safety: 10,
      security: 9,
      compliance: 8,
      ethics: 7,
      performance: 6,
      robustness: 5,
      cost: 4,
      drift: 3
    };
    return priorities[agentType] || 0;
  }

  /**
   * Create evaluation config from orchestration result
   */
  createEvaluationConfig(
    result: OrchestrationResult,
    context: EvaluationContext
  ): EvaluationConfig {
    return {
      id: `eval-${context.useCase.id}-${Date.now()}`,
      useCaseId: context.useCase.id,
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testSuites: result.testSuites,
      evaluationCriteria: this.generateEvaluationCriteria(result, context),
      executionStrategy: this.generateExecutionStrategy(result, context),
      scoringFramework: this.generateScoringFramework(result),
      metadata: {
        ...result.metadata,
        orchestrated: true,
        totalScenarios: result.totalScenarios,
        coverage: result.coverage.overall,
        conflicts: result.conflicts.length,
        resolutions: result.resolutions.length
      }
    };
  }

  private generateEvaluationCriteria(result: OrchestrationResult, context: EvaluationContext): any {
    return {
      dimensions: [
        {
          name: 'Safety',
          weight: 0.3,
          metrics: ['toxicity_score', 'bias_score', 'hallucination_rate'],
          thresholds: { excellent: 95, good: 85, acceptable: 70, poor: 50 }
        },
        {
          name: 'Performance',
          weight: 0.2,
          metrics: ['latency_p95', 'throughput', 'error_rate'],
          thresholds: { excellent: 90, good: 80, acceptable: 65, poor: 40 }
        },
        {
          name: 'Compliance',
          weight: 0.25,
          metrics: ['regulation_adherence', 'audit_readiness'],
          thresholds: { excellent: 100, good: 95, acceptable: 85, poor: 70 }
        },
        {
          name: 'Cost Efficiency',
          weight: 0.15,
          metrics: ['token_usage', 'compute_cost'],
          thresholds: { excellent: 85, good: 70, acceptable: 55, poor: 30 }
        },
        {
          name: 'Ethics',
          weight: 0.1,
          metrics: ['fairness_score', 'transparency_score'],
          thresholds: { excellent: 90, good: 80, acceptable: 70, poor: 50 }
        }
      ],
      weightingStrategy: 'adaptive',
      minimumPassThreshold: 70,
      criticalFailureConditions: []
    };
  }

  private generateExecutionStrategy(result: OrchestrationResult, context: EvaluationContext): any {
    const hasResourceConflicts = result.conflicts.some(c => c.type === 'resource');
    
    return {
      mode: hasResourceConflicts ? 'sequential' : 'parallel',
      parallelism: hasResourceConflicts ? 1 : 5,
      prioritization: 'critical_first',
      environments: [
        {
          name: 'production',
          type: 'production',
          configuration: {
            mockResponses: false,
            deterministicMode: false,
            realData: true,
            aiAgentsEnabled: true
          }
        }
      ],
      failureHandling: {
        strategy: 'retry_with_backoff',
        maxRetries: 3,
        backoffMultiplier: 2,
        alertChannels: ['console']
      }
    };
  }

  private generateScoringFramework(result: OrchestrationResult): any {
    return {
      algorithm: 'weighted_average',
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
        overall: result.confidence,
        byDimension: {},
        factors: [
          {
            factor: 'Multi-Agent Generation',
            impact: 0.5,
            explanation: `Generated by ${result.metadata.agents.length} specialized agents`
          }
        ]
      }
    };
  }
}