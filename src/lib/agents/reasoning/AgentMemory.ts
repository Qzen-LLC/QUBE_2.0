/**
 * Agent Memory System
 * Maintains state and memory across reasoning steps
 */

import { AgentMemoryState, AgentDecision } from './types';

export class AgentMemory {
  private shortTerm: Map<string, any>;
  private insights: string[];
  private concerns: string[];
  private decisions: AgentDecision[];

  constructor() {
    this.shortTerm = new Map();
    this.insights = [];
    this.concerns = [];
    this.decisions = [];
  }

  /**
   * Store value in short-term (working) memory
   */
  store(key: string, value: any): void {
    this.shortTerm.set(key, value);
  }

  /**
   * Retrieve value from short-term memory
   */
  retrieve(key: string): any {
    return this.shortTerm.get(key);
  }

  /**
   * Check if key exists in memory
   */
  has(key: string): boolean {
    return this.shortTerm.has(key);
  }

  /**
   * Add insight to accumulated insights
   */
  addInsight(insight: string): void {
    if (!this.insights.includes(insight)) {
      this.insights.push(insight);
    }
  }

  /**
   * Add multiple insights
   */
  addInsights(insights: string[]): void {
    insights.forEach(insight => this.addInsight(insight));
  }

  /**
   * Get all insights
   */
  getInsights(): string[] {
    return [...this.insights];
  }

  /**
   * Add concern
   */
  addConcern(concern: string): void {
    if (!this.concerns.includes(concern)) {
      this.concerns.push(concern);
    }
  }

  /**
   * Add multiple concerns
   */
  addConcerns(concerns: string[]): void {
    concerns.forEach(concern => this.addConcern(concern));
  }

  /**
   * Get all concerns
   */
  getConcerns(): string[] {
    return [...this.concerns];
  }

  /**
   * Record a decision
   */
  recordDecision(decision: AgentDecision): void {
    this.decisions.push(decision);
  }

  /**
   * Get all decisions
   */
  getDecisions(): AgentDecision[] {
    return [...this.decisions];
  }

  /**
   * Get last decision
   */
  getLastDecision(): AgentDecision | undefined {
    return this.decisions[this.decisions.length - 1];
  }

  /**
   * Get current memory state
   */
  getState(): AgentMemoryState {
    return {
      shortTerm: new Map(this.shortTerm),
      insights: [...this.insights],
      concerns: [...this.concerns],
      decisions: [...this.decisions]
    };
  }

  /**
   * Restore memory state
   */
  setState(state: AgentMemoryState): void {
    this.shortTerm = new Map(state.shortTerm);
    this.insights = [...state.insights];
    this.concerns = [...state.concerns];
    this.decisions = [...state.decisions];
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.shortTerm.clear();
    this.insights = [];
    this.concerns = [];
    this.decisions = [];
  }

  /**
   * Clear short-term memory only
   */
  clearShortTerm(): void {
    this.shortTerm.clear();
  }

  /**
   * Get summary of memory for context
   */
  getSummary(): string {
    const parts: string[] = [];

    if (this.insights.length > 0) {
      parts.push(`Insights: ${this.insights.join('; ')}`);
    }

    if (this.concerns.length > 0) {
      parts.push(`Concerns: ${this.concerns.join('; ')}`);
    }

    if (this.decisions.length > 0) {
      const recentDecisions = this.decisions.slice(-3).map(d => d.decision);
      parts.push(`Recent Decisions: ${recentDecisions.join('; ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Check if memory is empty
   */
  isEmpty(): boolean {
    return this.shortTerm.size === 0 &&
           this.insights.length === 0 &&
           this.concerns.length === 0 &&
           this.decisions.length === 0;
  }

  /**
   * Get memory size (approximate)
   */
  getSize(): number {
    return this.shortTerm.size +
           this.insights.length +
           this.concerns.length +
           this.decisions.length;
  }
}
