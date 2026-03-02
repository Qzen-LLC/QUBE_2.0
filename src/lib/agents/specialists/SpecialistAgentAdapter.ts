import { AgentResponse, GuardrailsContext, AgentProposal } from '../types';
import { SpecialistAgent } from '../specialist-agent';

/**
 * Adapter class to make SpecialistAgent compatible with orchestrator expectations
 * Bridges the gap between the two agent architectures
 */
export class SpecialistAgentAdapter {
  private agent: SpecialistAgent;
  
  constructor(agent: SpecialistAgent) {
    this.agent = agent;
  }
  
  /**
   * Adapt the analyze method to match orchestrator's expected interface
   */
  async analyzeAndPropose(context: any): Promise<AgentResponse> {
    // Convert orchestrator context to GuardrailsContext
    const guardrailsContext: GuardrailsContext = {
      assessment: context.assessment,
      technicalFeasibility: context.assessment?.technicalFeasibility,
      businessFeasibility: context.assessment?.businessFeasibility,
      dataReadiness: context.assessment?.dataReadiness,
      ethicalImpact: context.assessment?.ethicalImpact,
      riskAssessment: context.assessment?.riskAssessment,
      budgetPlanning: context.assessment?.budgetPlanning,
      roadmapPosition: context.assessment?.roadmapPosition,
      complianceRequirements: context.assessment?.complianceRequirements,
      organizationPolicies: context.assessment?.organizationPolicies
    };
    
    // Call the agent's analyze method
    const proposal: AgentProposal = await this.agent.analyze(guardrailsContext);
    
    // Convert AgentProposal to AgentResponse
    return {
      guardrails: proposal.guardrails,
      insights: [
        ...proposal.insights,
        ...proposal.recommendations.map(r => `Recommendation: ${r}`),
        ...proposal.concerns.map(c => `Concern: ${c}`)
      ],
      confidence: proposal.confidence / 100, // Convert percentage to decimal
      reasoning: {
        approach: this.agent.name,
        keyInsights: proposal.insights,
        concerns: proposal.concerns,
        recommendations: proposal.recommendations
      }
    };
  }
  
  /**
   * Get agent name for logging
   */
  getName(): string {
    return this.agent.name;
  }
  
  /**
   * Get agent description
   */
  getDescription(): string {
    return this.agent.description;
  }
}