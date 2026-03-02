import { Guardrail, GuardrailsContext, AgentProposal } from './types';

/**
 * Base class for non-LLM specialist agents
 * Provides structure for hard-coded guardrail generation logic
 */
export abstract class SpecialistAgent {
  abstract name: string;
  abstract description: string;
  
  /**
   * Analyze context and propose guardrails
   * This is the internal method used by non-LLM agents
   */
  abstract analyze(context: GuardrailsContext): Promise<AgentProposal>;
  
  /**
   * Parse guardrails from various sources
   */
  protected parseGuardrails(data: any): Guardrail[] {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data.filter(g => this.isValidGuardrail(g));
    }
    
    if (typeof data === 'object' && data.guardrails) {
      return this.parseGuardrails(data.guardrails);
    }
    
    return [];
  }
  
  /**
   * Validate guardrail structure
   */
  protected isValidGuardrail(guardrail: any): boolean {
    return !!(
      guardrail &&
      guardrail.id &&
      guardrail.type &&
      guardrail.severity &&
      guardrail.rule &&
      guardrail.description &&
      guardrail.implementation
    );
  }
  
  /**
   * Calculate confidence score based on analysis
   */
  protected calculateConfidence(
    guardrails: Guardrail[],
    insights: string[],
    concerns: string[]
  ): number {
    const guardrailScore = Math.min(guardrails.length * 10, 40);
    const insightScore = Math.min(insights.length * 5, 20);
    const concernPenalty = Math.min(concerns.length * 5, 20);
    const baseScore = 60;
    
    return Math.max(0, Math.min(100, baseScore + guardrailScore + insightScore - concernPenalty));
  }
}