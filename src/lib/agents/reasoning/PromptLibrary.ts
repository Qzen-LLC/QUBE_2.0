/**
 * Prompt Library for Autonomous Agent Reasoning
 * Contains prompts for different reasoning phases
 */

export class PromptLibrary {
  /**
   * Planning phase: Agent plans its approach
   */
  static getPlanningPrompt(goal: string, context: any): string {
    return `You are an AI agent planning your approach to achieve a goal.

GOAL: ${goal}

CONTEXT:
${JSON.stringify(context, null, 2)}

Your task is to create a thoughtful plan for achieving this goal.

Think through:
1. What are the key factors to consider?
2. What are the most critical aspects to address?
3. What approach will be most effective?
4. What potential challenges might arise?
5. What order of operations makes sense?

Respond with a JSON object:
{
  "understanding": "What you understand about the problem",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "criticalPriorities": ["priority1", "priority2"],
  "approach": "Your planned approach in detail",
  "potentialChallenges": ["challenge1", "challenge2"],
  "confidence": 0.85
}`;
  }

  /**
   * Chain-of-thought reasoning prompt
   */
  static getChainOfThoughtPrompt(task: string, context: any, plan: any): string {
    return `You are an AI agent using step-by-step reasoning to complete a task.

TASK: ${task}

CONTEXT: ${JSON.stringify(context, null, 2)}

YOUR PLAN: ${JSON.stringify(plan, null, 2)}

Now execute your plan using careful step-by-step reasoning.

For each step, think through:
- What am I analyzing?
- What patterns or issues do I observe?
- What does this mean for the output?
- What should I include/exclude?

Think out loud, showing your reasoning process. Then provide your output.

Respond with JSON:
{
  "thoughtProcess": {
    "step1": "First, I observe that...",
    "step2": "This means that...",
    "step3": "Therefore, I should...",
    "step4": "Finally, I conclude..."
  },
  "reasoning": "Detailed explanation of your reasoning",
  "output": <your actual output>,
  "confidence": 0.85,
  "uncertainties": ["Any areas where you're uncertain"]
}`;
  }

  /**
   * Reflection/critique prompt
   */
  static getReflectionPrompt(output: any, goal: string, context: any): string {
    return `You are an AI agent reflecting on and critiquing your own work.

ORIGINAL GOAL: ${goal}

CONTEXT: ${JSON.stringify(context, null, 2)}

YOUR OUTPUT:
${JSON.stringify(output, null, 2)}

Now critically evaluate your work. Be honest about weaknesses and gaps.

Ask yourself:
1. Does this fully address the goal?
2. What's missing or incomplete?
3. Are there any errors or weak points?
4. How could this be improved?
5. What edge cases or scenarios weren't considered?
6. Is the quality sufficient, or should I refine it?

Be constructively critical - identify real issues that need fixing.

Respond with JSON:
{
  "overallQuality": "excellent|good|acceptable|needs_improvement",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "gaps": ["What's missing entirely"],
  "improvements": ["Specific suggestion 1", "Specific suggestion 2"],
  "coverage": 0.75,
  "needsRefinement": true,
  "confidence": 0.80,
  "reasoning": "Why you rate it this way"
}`;
  }

  /**
   * Refinement prompt
   */
  static getRefinementPrompt(
    originalOutput: any,
    reflection: any,
    goal: string,
    context: any
  ): string {
    return `You are an AI agent refining your previous work based on self-critique.

ORIGINAL GOAL: ${goal}

CONTEXT: ${JSON.stringify(context, null, 2)}

YOUR PREVIOUS OUTPUT:
${JSON.stringify(originalOutput, null, 2)}

YOUR SELF-CRITIQUE:
${JSON.stringify(reflection, null, 2)}

Now improve your output by addressing the weaknesses and gaps you identified.

Focus on:
1. Filling the gaps you identified
2. Strengthening weak areas
3. Implementing the improvements you suggested
4. Ensuring comprehensive coverage

Be thorough - this is your chance to make your work excellent.

Respond with JSON:
{
  "refinedOutput": <your improved output>,
  "improvements Made": ["Improvement 1", "Improvement 2"],
  "reasoning": "How you addressed the critique",
  "remainingConcerns": ["Any issues that couldn't be fully resolved"],
  "confidence": 0.90
}`;
  }

  /**
   * Validation prompt
   */
  static getValidationPrompt(output: any, goal: string, requirements: string[]): string {
    return `You are an AI agent performing final validation of your work.

GOAL: ${goal}

REQUIREMENTS:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

YOUR FINAL OUTPUT:
${JSON.stringify(output, null, 2)}

Perform a thorough quality check:
1. Are all requirements met?
2. Is the output complete and comprehensive?
3. Are there any errors or inconsistencies?
4. Is this production-ready?
5. What's the overall quality level?

Be rigorous - this is the final check before delivery.

Respond with JSON:
{
  "isValid": true,
  "qualityScore": 0.88,
  "requirementsCovered": ["req1", "req2"],
  "requirementsMissing": [],
  "errors": [],
  "warnings": ["warning1"],
  "readyForProduction": true,
  "finalConfidence": 0.90,
  "reasoning": "Why this passes/fails validation"
}`;
  }

  /**
   * Analysis prompt for understanding context
   */
  static getAnalysisPrompt(domain: string, data: any): string {
    return `You are an AI agent analyzing ${domain} data to identify key insights and concerns.

DATA TO ANALYZE:
${JSON.stringify(data, null, 2)}

Deep dive into this data:
1. What are the most important patterns or signals?
2. What risks or concerns stand out?
3. What requirements or constraints are implied?
4. What edge cases or special situations exist?
5. What domain-specific considerations apply?

Think like an expert in ${domain}.

Respond with JSON:
{
  "keyInsights": ["insight1", "insight2", "insight3"],
  "concerns": ["concern1", "concern2"],
  "requirements": ["requirement1", "requirement2"],
  "edgeCases": ["edge case 1", "edge case 2"],
  "domainConsiderations": ["consideration1", "consideration2"],
  "confidence": 0.85,
  "reasoning": "Your analytical reasoning"
}`;
  }

  /**
   * Decision-making prompt
   */
  static getDecisionPrompt(
    decision: string,
    options: string[],
    context: any
  ): string {
    return `You are an AI agent making an important decision.

DECISION TO MAKE: ${decision}

OPTIONS:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

CONTEXT:
${JSON.stringify(context, null, 2)}

Carefully consider each option:
1. What are the pros and cons?
2. What are the implications of each?
3. Which best serves the goal?
4. What are the risks of each option?
5. What evidence supports each option?

Make a well-reasoned decision.

Respond with JSON:
{
  "decision": "The option you choose",
  "reasoning": "Detailed explanation of why",
  "alternatives": ["Other options considered"],
  "prosAndCons": {
    "pros": ["pro1", "pro2"],
    "cons": ["con1", "con2"]
  },
  "confidence": 0.85,
  "evidence": ["evidence1", "evidence2"],
  "risks": ["risk1", "risk2"]
}`;
  }

  /**
   * Problem decomposition prompt
   */
  static getDecompositionPrompt(problem: string, context: any): string {
    return `You are an AI agent breaking down a complex problem into manageable pieces.

PROBLEM: ${problem}

CONTEXT:
${JSON.stringify(context, null, 2)}

Decompose this problem:
1. What are the distinct sub-problems?
2. What's the logical dependency order?
3. What's the priority of each sub-problem?
4. How do the pieces relate to each other?

Think systematically about the structure.

Respond with JSON:
{
  "subProblems": [
    {
      "name": "Sub-problem 1",
      "description": "What it involves",
      "priority": "high|medium|low",
      "dependencies": ["depends on X"],
      "complexity": "high|medium|low"
    }
  ],
  "executionOrder": ["subproblem1", "subproblem2"],
  "relationships": "How the pieces connect",
  "confidence": 0.85
}`;
  }

  /**
   * Synthesis prompt for combining multiple inputs
   */
  static getSynthesisPrompt(
    inputs: any[],
    goal: string,
    context: any
  ): string {
    return `You are an AI agent synthesizing multiple inputs into a coherent whole.

GOAL: ${goal}

CONTEXT:
${JSON.stringify(context, null, 2)}

INPUTS TO SYNTHESIZE:
${JSON.stringify(inputs, null, 2)}

Synthesize these inputs:
1. What are the common themes?
2. What conflicts or contradictions exist?
3. How can these be harmonized?
4. What's the best way to combine them?
5. What should be prioritized?

Create a unified, coherent result.

Respond with JSON:
{
  "synthesizedOutput": <your combined output>,
  "commonThemes": ["theme1", "theme2"],
  "conflictsResolved": ["How you resolved conflict 1"],
  "prioritization": "How you prioritized elements",
  "reasoning": "Your synthesis approach",
  "confidence": 0.85
}`;
  }
}
