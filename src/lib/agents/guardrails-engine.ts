import {
  ComprehensiveAssessment,
  GuardrailsConfig,
  Guardrail,
  ImplementationConfig
} from './types';
import { GuardrailsOrchestrator } from './guardrails-orchestrator';
import { generateGuardrailsPrompt } from './prompts/guardrails-prompts';
import OpenAI from 'openai';
import { guardrailLogger } from './utils/guardrail-logger';
import { RiskAnalyzer } from './utils/risk-analyzer';
import { validateGuardrails, ValidationReport } from './validators/guardrail-validator';
import { withRetry, withTimeout, CircuitBreaker, LLMError } from './utils/error-handler';
import { guardrailsCache, promptCache, withCache } from './utils/cache-manager';
import { CONFIG } from './config/guardrails-config';
import { observabilityManager } from '../observability/ObservabilityManager';
import { createAgentTracer, AgentTracer } from '../observability/AgentTracer';

/**
 * Guardrails Generation Engine
 * Uses LLM to generate intelligent, context-aware guardrails
 * Combines agent recommendations with deep reasoning
 */
export class GuardrailsEngine {
  private orchestrator: GuardrailsOrchestrator;
  private openai: OpenAI;
  private riskAnalyzer: RiskAnalyzer;
  private circuitBreaker: CircuitBreaker;
  private tracer: AgentTracer | null = null;

  constructor() {
    this.orchestrator = new GuardrailsOrchestrator();
    this.riskAnalyzer = new RiskAnalyzer();
    this.circuitBreaker = new CircuitBreaker(
      CONFIG.circuitBreaker.threshold,
      CONFIG.circuitBreaker.timeout
    );

    // Initialize OpenAI client - require API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('LLM Configuration Required: OPENAI_API_KEY must be set in environment variables for guardrail generation');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Generate guardrails using the agentic system
   */
  async generateGuardrails(
    assessment: ComprehensiveAssessment,
    orgPolicies?: any
  ): Promise<GuardrailsConfig> {
    console.log('🚀 Starting Agentic Guardrails Generation...');

    // Check cache first
    const cacheKey = guardrailsCache.generateKey({ assessment, orgPolicies });
    const cached = guardrailsCache.get(cacheKey);
    if (cached) {
      console.log('✨ Using cached guardrails');
      return cached as GuardrailsConfig;
    }

    // Start observability session
    const sessionId = await observabilityManager.startUseCaseSession(
      assessment.useCaseId || 'unknown',
      assessment.useCaseTitle || 'Unknown Use Case',
      'guardrails',
      { tags: ['guardrails-generation', 'engine'] }
    );

    // Create tracer for this session
    this.tracer = createAgentTracer('GuardrailsEngine', 'orchestrator', sessionId);
    await this.tracer.startExecution({ assessment, orgPolicies });

    // Start logging session
    guardrailLogger.startSession(
      assessment.useCaseId || 'unknown',
      assessment.useCaseTitle || 'Unknown Use Case'
    );

    try {
      // Step 1: Analyze risks to identify critical guardrails
      guardrailLogger.logOrchestratorAction('ANALYZE_RISKS', {
        assessment: assessment.useCaseId
      });
      const riskPriorities = this.riskAnalyzer.analyzeRisks(assessment);
      const criticalGuardrails = this.riskAnalyzer.getCriticalGuardrails(riskPriorities);
      
      console.log(`⚠️ Identified ${riskPriorities.length} risks, ${criticalGuardrails.length} critical guardrails required`);
      
      // Step 2: Generate multiple perspectives using LLM with risk context
      guardrailLogger.logOrchestratorAction('GENERATE_PERSPECTIVES', {
        approaches: ['conservative_safety', 'balanced_practical', 'innovation_focused'],
        criticalRisks: riskPriorities.filter(r => r.severity === 'critical').length
      });
      let perspectives;
      try {
        perspectives = await this.generatePerspectives(assessment, orgPolicies, riskPriorities);
      } catch (llmError) {
        console.error('LLM generation failed, using fallback agent-only approach:', llmError);
        // Fallback: Use empty perspectives and rely on agent guardrails
        perspectives = [];
        console.log('Using fallback strategy: agent-only');
      }

      // Step 2: Let orchestrator coordinate specialist agents
      const agentGuardrails = await this.orchestrator.generateGuardrails(assessment);

      // Step 3: Synthesize LLM and agent recommendations
      // Count actual agent guardrails properly
      let agentGuardrailCount = 0;
      if (agentGuardrails.guardrails?.rules) {
        Object.values(agentGuardrails.guardrails.rules).forEach((ruleSet: any) => {
          if (Array.isArray(ruleSet)) {
            agentGuardrailCount += ruleSet.length;
          }
        });
      }

      guardrailLogger.logOrchestratorAction('SYNTHESIZE_RECOMMENDATIONS', {
        llmPerspectives: perspectives.length,
        agentGuardrails: agentGuardrailCount
      });
      const synthesized = await this.synthesizeRecommendations(
        perspectives,
        agentGuardrails,
        assessment
      );
      // Extract all agent guardrails for logging
      const agentGuardrailsList: any[] = [];
      if (agentGuardrails.guardrails?.rules) {
        Object.values(agentGuardrails.guardrails.rules).forEach((ruleSet: any) => {
          if (Array.isArray(ruleSet)) {
            agentGuardrailsList.push(...ruleSet);
          }
        });
      }

      guardrailLogger.logSynthesis(
        { perspectives, agentGuardrails: agentGuardrailsList },
        synthesized
      );

      // Step 4: Validate and optimize
      const validated = await this.validateGuardrails(synthesized);

      // Step 5: Generate implementation configurations
      const implementation = await this.generateImplementationConfigs(validated, assessment);

      const finalResult = {
        guardrails: implementation,
        reasoning: this.combineReasoning(perspectives, agentGuardrails.reasoning),
        confidence: this.calculateOverallConfidence(perspectives, agentGuardrails.confidence),
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '2.0.0',
          agents: ['orchestrator', 'llm-reasoning'],
          contextComplexity: this.assessComplexity(assessment)
        }
      };
      
      // Step 6: Run comprehensive validation
      const validationReport = await this.runValidation(finalResult.guardrails, assessment);
      
      // Add validation report to final result
      (finalResult as any).validation = {
        score: validationReport.score,
        isValid: validationReport.isValid,
        coverage: validationReport.coverage,
        summary: validationReport.summary,
        issueCount: {
          errors: validationReport.issues.filter(i => i.type === 'error').length,
          warnings: validationReport.issues.filter(i => i.type === 'warning').length,
          info: validationReport.issues.filter(i => i.type === 'info').length
        },
        recommendations: validationReport.recommendations
      };
      
      // Log final output and save
      guardrailLogger.logFinalOutput(finalResult);
      guardrailLogger.saveToFile();
      
      // Cache the result
      guardrailsCache.set(cacheKey, finalResult);

      // End tracer execution
      if (this.tracer) {
        await this.tracer.endExecution(finalResult);
      }

      // End observability session successfully
      await observabilityManager.endSession(sessionId, finalResult);

      return finalResult;
    } catch (error) {
      console.error('Error generating guardrails:', error);

      // End tracer execution with error
      if (this.tracer) {
        await this.tracer.endExecution(null, error);
      }

      // End observability session with error
      await observabilityManager.endSession(sessionId, null, error);

      throw error;
    }
  }

  /**
   * Generate multiple perspectives using LLM with domain-specific calls
   */
  private async generatePerspectives(
    assessment: ComprehensiveAssessment,
    orgPolicies: any,
    riskPriorities?: any[]
  ): Promise<any[]> {
    console.log('🧠 Generating comprehensive LLM perspectives...');

    // Generate base perspectives
    const basePerspectives = await Promise.all([
      this.generatePerspective(assessment, orgPolicies, 'conservative_safety'),
      this.generatePerspective(assessment, orgPolicies, 'balanced_practical'),
      this.generatePerspective(assessment, orgPolicies, 'innovation_focused')
    ]);

    // Generate domain-specific guardrails in parallel
    console.log('🔍 Generating domain-specific guardrails...');
    const domainGuardrails = await this.generateDomainSpecificGuardrails(assessment, orgPolicies);

    // Merge domain-specific guardrails into perspectives
    return [...basePerspectives, ...domainGuardrails];
  }

  /**
   * Generate domain-specific guardrails using focused LLM calls
   */
  private async generateDomainSpecificGuardrails(
    assessment: ComprehensiveAssessment,
    orgPolicies: any
  ): Promise<any[]> {
    const domains = [
      'security_vulnerabilities',
      'performance_sla', 
      'cost_optimization',
      'data_governance'
    ];

    const domainGuardrails = await Promise.all(
      domains.map(domain => this.generateDomainGuardrails(assessment, orgPolicies, domain))
    );

    return domainGuardrails;
  }

  /**
   * Generate guardrails for a specific domain
   */
  private async generateDomainGuardrails(
    assessment: ComprehensiveAssessment,
    orgPolicies: any,
    domain: string
  ): Promise<any> {
    const prompt = this.generateDomainPrompt(assessment, orgPolicies, domain);
    
    guardrailLogger.logLLMInput(domain, prompt);

    const response = await this.callLLM(prompt, 'domain_specific', domain);

    return {
      approach: domain,
      guardrails: this.parseLLMResponse(response),
      reasoning: response.reasoning,
      confidence: response.confidence
    };
  }

  /**
   * Generate a single perspective using LLM
   */
  private async generatePerspective(
    assessment: ComprehensiveAssessment,
    orgPolicies: any,
    approach: 'conservative_safety' | 'balanced_practical' | 'innovation_focused'
  ): Promise<any> {
    const prompt = generateGuardrailsPrompt(assessment, orgPolicies, approach);
    
    // Log LLM input
    guardrailLogger.logLLMInput(approach, prompt);

    // Call the actual LLM API
    const response = await this.callLLM(prompt, approach);

    return {
      approach,
      guardrails: this.parseLLMResponse(response),
      reasoning: response.reasoning,
      confidence: response.confidence
    };
  }

  /**
   * Optimize prompt size if too large
   */
  private optimizePrompt(prompt: string, maxLength: number = 8000): string {
    if (prompt.length <= maxLength) return prompt;
    
    console.log(`⚠️ Prompt too large (${prompt.length} chars), optimizing...`);
    
    // Remove excessive whitespace and formatting
    let optimized = prompt
      .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
      .replace(/\s{2,}/g, ' ')      // Reduce multiple spaces
      .trim();
    
    // If still too large, truncate less critical sections
    if (optimized.length > maxLength) {
      // Keep the beginning (instructions) and end (output format)
      const keepStart = Math.floor(maxLength * 0.6);
      const keepEnd = Math.floor(maxLength * 0.3);
      
      const start = optimized.substring(0, keepStart);
      const end = optimized.substring(optimized.length - keepEnd);
      
      optimized = start + '\n\n[... context truncated for length ...]\n\n' + end;
    }
    
    console.log(`✅ Prompt optimized to ${optimized.length} chars`);
    return optimized;
  }

  /**
   * Call OpenAI API to generate guardrails
   */
  private async callLLM(prompt: string, approach?: string, domain?: string): Promise<any> {
    // Optimize prompt if too large
    const optimizedPrompt = CONFIG.llm.promptOptimization.enabled 
      ? this.optimizePrompt(prompt, CONFIG.llm.promptOptimization.maxLength)
      : prompt;
    console.log(`📝 Calling OpenAI API for ${domain || 'general'} guardrails with prompt length:`, optimizedPrompt.length);

    // Check prompt cache
    const promptKey = promptCache.generateKey({ prompt: optimizedPrompt, approach, domain });
    const cachedResponse = promptCache.get(promptKey);
    if (cachedResponse) {
      console.log('✨ Using cached LLM response');
      return cachedResponse;
    }

    try {
      // Prepare domain-specific system prompts
      const systemPrompt = this.getDomainSystemPrompt(domain);

      // Adjust token allocation based on domain
      const maxTokens = domain 
        ? CONFIG.llm.maxTokens.domain 
        : CONFIG.llm.maxTokens.comprehensive;

      // Call OpenAI API with retry, timeout, and observability
      const completion = await withRetry(
        () => withTimeout(
          () => this.circuitBreaker.execute(
            async () => {
              // Use tracer if available, otherwise fallback to direct call
              if (this.tracer) {
                return await this.tracer.traceOpenAICall(
                  this.openai,
                  {
                    model: CONFIG.llm.model,
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: optimizedPrompt }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: CONFIG.llm.temperature,
                    max_tokens: maxTokens
                  },
                  `${domain || approach || 'guardrails'}_generation`
                );
              } else {
                return await this.openai.chat.completions.create({
                  model: CONFIG.llm.model,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: optimizedPrompt }
                  ],
                  response_format: { type: 'json_object' },
                  temperature: CONFIG.llm.temperature,
                  max_tokens: maxTokens
                });
              }
            }
          ),
          CONFIG.llm.timeout,
          'OpenAI API call timed out'
        ),
        {
          maxAttempts: CONFIG.llm.maxRetries,
          delayMs: CONFIG.llm.retryDelay,
          backoff: true,
          onRetry: (attempt, error) => {
            console.warn(`LLM call attempt ${attempt} failed:`, error.message);
          }
        }
      );

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI API');
      }

      console.log('✅ OpenAI API call successful');
      
      // Parse and validate the response with improved error handling
      let parsedResponse;
      try {
        // Try to clean the response first
        let cleanedResponse = response
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/\n\s*\n/g, '\n'); // Remove excessive newlines
        
        // Check if response might be truncated (ends without proper closing)
        if (!cleanedResponse.endsWith('}')) {
          console.warn('Response appears truncated, attempting to fix...');
          // Count opening and closing braces
          const openBraces = (cleanedResponse.match(/{/g) || []).length;
          const closeBraces = (cleanedResponse.match(/}/g) || []).length;
          const openBrackets = (cleanedResponse.match(/\[/g) || []).length;
          const closeBrackets = (cleanedResponse.match(/\]/g) || []).length;
          
          // Add missing closing brackets/braces
          cleanedResponse += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
          cleanedResponse += '}'.repeat(Math.max(0, openBraces - closeBraces));
        }
        
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError);
        console.log('Response length:', response.length);
        
        // Try to extract JSON from the response if it's wrapped in text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error('Failed to extract valid JSON from response');
            // Return a minimal valid structure
            parsedResponse = {
              critical: [],
              operational: [],
              ethical: [],
              economic: [],
              reasoning: {
                key_insights: ['LLM response was malformed, using fallback structure'],
                assumptions: []
              }
            };
          }
        } else {
          // Return a minimal valid structure
          parsedResponse = {
            critical: [],
            operational: [],
            ethical: [],
            economic: [],
            reasoning: {
              key_insights: ['LLM response was not valid JSON, using fallback structure'],
              assumptions: []
            }
          };
        }
      }
      
      // Ensure the response has the expected structure
      const validatedResponse = {
        guardrails: {
          critical: parsedResponse.critical || parsedResponse.guardrails?.critical || [],
          operational: parsedResponse.operational || parsedResponse.guardrails?.operational || [],
          ethical: parsedResponse.ethical || parsedResponse.guardrails?.ethical || [],
          economic: parsedResponse.economic || parsedResponse.guardrails?.economic || []
        },
        reasoning: parsedResponse.reasoning || 'Generated based on comprehensive analysis',
        confidence: parsedResponse.confidence || 0.75
      };
      
      // Log the LLM output after parsing
      if (approach) {
        guardrailLogger.logLLMOutput(approach, validatedResponse, true);
      }
      
      // Cache the successful response
      promptCache.set(promptKey, validatedResponse);

      return validatedResponse;

    } catch (error) {
      console.error('❌ Error calling OpenAI API:', error);
      if (approach) {
        guardrailLogger.logLLMOutput(approach, null, false, error);
      }
      throw new Error(`Failed to generate guardrails via LLM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Parse LLM response into structured guardrails
   */
  private parseLLMResponse(response: any): Guardrail[] {
    const guardrails: Guardrail[] = [];

    // Parse critical guardrails
    if (response.guardrails?.critical) {
      guardrails.push(...response.guardrails.critical);
    }

    // Parse operational guardrails
    if (response.guardrails?.operational) {
      guardrails.push(...response.guardrails.operational);
    }

    // Parse ethical guardrails
    if (response.guardrails?.ethical) {
      guardrails.push(...response.guardrails.ethical);
    }

    // Parse economic guardrails
    if (response.guardrails?.economic) {
      guardrails.push(...response.guardrails.economic);
    }

    return guardrails;
  }

  /**
   * Synthesize LLM and agent recommendations
   */
  private async synthesizeRecommendations(
    perspectives: any[],
    agentGuardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment
  ): Promise<Guardrail[]> {
    console.log('🔄 Synthesizing recommendations...');

    const allGuardrails: Guardrail[] = [];

    // Add agent-generated guardrails
    if (agentGuardrails.guardrails.rules) {
      Object.values(agentGuardrails.guardrails.rules).forEach((ruleSet: any) => {
        if (Array.isArray(ruleSet)) {
          allGuardrails.push(...ruleSet);
        }
      });
    }

    // Add LLM-generated guardrails from each perspective
    if (perspectives && perspectives.length > 0) {
      perspectives.forEach(perspective => {
        if (perspective.guardrails && Array.isArray(perspective.guardrails)) {
          allGuardrails.push(...perspective.guardrails);
        }
      });
    } else {
      console.log('⚠️ No LLM perspectives available, using agent guardrails only');
    }

    // Apply smart deduplication - remove only true duplicates
    const synthesized = this.smartDeduplication(allGuardrails);

    // Prioritize based on severity and consensus
    return this.prioritizeGuardrails(synthesized);
  }

  /**
   * Smart deduplication - removes duplicates based on similar titles/rules
   */
  private smartDeduplication(guardrails: Guardrail[]): Guardrail[] {
    const seen = new Map<string, Guardrail>();
    const ruleMap = new Map<string, Guardrail>();
    const duplicateLog: { [key: string]: number } = {};

    guardrails.forEach(guardrail => {
      // Normalize the rule name for comparison
      const normalizedRule = this.normalizeString(guardrail.rule || '');

      // Check if we've seen this exact rule before
      if (normalizedRule && ruleMap.has(normalizedRule)) {
        // Found duplicate by rule name
        const existing = ruleMap.get(normalizedRule)!;
        duplicateLog[normalizedRule] = (duplicateLog[normalizedRule] || 1) + 1;

        // Keep the one with more complete information
        const existingScore = this.getCompletenessScore(existing);
        const newScore = this.getCompletenessScore(guardrail);

        if (newScore > existingScore) {
          // Replace with better version
          const existingKey = this.getGuardrailKey(existing);
          seen.delete(existingKey);
          ruleMap.set(normalizedRule, guardrail);
          seen.set(this.getGuardrailKey(guardrail), guardrail);
        }
      } else {
        // Check for near-duplicates using a composite key
        const key = this.getGuardrailKey(guardrail);

        if (!seen.has(key)) {
          seen.set(key, guardrail);
          if (normalizedRule) {
            ruleMap.set(normalizedRule, guardrail);
          }
        } else {
          // Track duplicates for logging
          duplicateLog[key] = (duplicateLog[key] || 1) + 1;

          // Keep the one with more complete information
          const existing = seen.get(key)!;
          const existingScore = this.getCompletenessScore(existing);
          const newScore = this.getCompletenessScore(guardrail);

          if (newScore > existingScore) {
            seen.set(key, guardrail);
            if (normalizedRule) {
              ruleMap.set(normalizedRule, guardrail);
            }
          }
        }
      }
    });

    const deduped = Array.from(seen.values());
    console.log(`🔄 Deduplication: ${guardrails.length} → ${deduped.length} guardrails`);
    if (Object.keys(duplicateLog).length > 0) {
      console.log(`   Removed ${guardrails.length - deduped.length} duplicates (by rule or description)`);
    }

    return deduped;
  }

  /**
   * Normalize string for comparison (removes spaces, special chars, makes lowercase)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\s\-_]/g, '') // Remove spaces, hyphens, underscores
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Get a unique key for a guardrail based on type and normalized description
   */
  private getGuardrailKey(guardrail: Guardrail): string {
    // Use normalized description as primary differentiator
    const normalizedDesc = this.normalizeString(guardrail.description || guardrail.rule || '');
    return [
      guardrail.type || 'unknown',
      normalizedDesc,
      guardrail.severity || 'medium'
    ].join('|');
  }

  /**
   * Calculate completeness score for a guardrail
   */
  private getCompletenessScore(guardrail: Guardrail): number {
    let score = 0;
    if (guardrail.id) score += 1;
    if (guardrail.type) score += 2;
    if (guardrail.severity) score += 2;
    if (guardrail.rule) score += 2;
    if (guardrail.description) score += 2;
    if (guardrail.rationale) score += 1;
    if (guardrail.implementation) score += 3;
    if (guardrail.implementation?.monitoring?.length) score += 2;
    if (guardrail.conditions?.length) score += 1;
    if (guardrail.exceptions?.length) score += 1;
    return score;
  }

  /**
   * Remove duplicate guardrails and resolve conflicts (legacy method)
   */
  private deduplicateAndResolve(guardrails: Guardrail[]): Guardrail[] {
    const seen = new Map<string, Guardrail>();

    guardrails.forEach(guardrail => {
      const key = `${guardrail.type}-${guardrail.rule}`;

      if (!seen.has(key)) {
        seen.set(key, guardrail);
      } else {
        // Resolve conflict by taking the more conservative option
        const existing = seen.get(key)!;
        if (this.getSeverityScore(guardrail.severity) > this.getSeverityScore(existing.severity)) {
          seen.set(key, guardrail);
        }
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Get numeric score for severity level
   */
  private getSeverityScore(severity: string): number {
    const scores: Record<string, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return scores[severity] || 0;
  }

  /**
   * Prioritize guardrails based on importance
   */
  private prioritizeGuardrails(guardrails: Guardrail[]): Guardrail[] {
    return guardrails.sort((a, b) => {
      // Sort by severity first
      const severityDiff = this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity);
      if (severityDiff !== 0) return severityDiff;

      // Then by type priority
      const typePriority: Record<string, number> = {
        'content_safety': 10,
        'data_protection': 9,
        'human_oversight': 8,
        'compliance': 7,
        'ethical': 6,
        'hallucination_control': 5,
        'bias_mitigation': 4,
        'performance': 3,
        'cost_control': 2,
        'agent_behavior': 1
      };

      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;
      
      return bPriority - aPriority;
    });
  }

  /**
   * Validate generated guardrails
   */
  private async validateGuardrails(guardrails: Guardrail[]): Promise<Guardrail[]> {
    console.log('✅ Validating guardrails...');

    const validated: Guardrail[] = [];

    for (const guardrail of guardrails) {
      if (this.isValidGuardrail(guardrail)) {
        validated.push(guardrail);
      } else {
        console.warn(`Invalid guardrail skipped: ${guardrail.id}`);
      }
    }

    return validated;
  }

  /**
   * Check if a guardrail is valid - more permissive to preserve all guardrails
   */
  private isValidGuardrail(guardrail: Guardrail): boolean {
    // Only require essential fields
    const isValid = !!(
      guardrail.id &&
      guardrail.type &&
      guardrail.severity &&
      guardrail.rule &&
      guardrail.description
    );

    // If implementation is missing, add a basic one
    if (isValid && !guardrail.implementation) {
      guardrail.implementation = {
        platform: ['all'],
        configuration: {},
        monitoring: []
      };
    }

    // Log validation issues for debugging
    if (!isValid) {
      console.log(`Validation failed for guardrail: ${JSON.stringify({
        id: guardrail.id || 'missing',
        type: guardrail.type || 'missing',
        severity: guardrail.severity || 'missing',
        rule: guardrail.rule || 'missing',
        description: guardrail.description || 'missing'
      })}`);
    }

    return isValid;
  }

  /**
   * Generate implementation-ready configurations
   */
  private async generateImplementationConfigs(
    guardrails: Guardrail[],
    assessment: ComprehensiveAssessment
  ): Promise<ImplementationConfig> {
    console.log('🔧 Generating implementation configurations...');

    // Group guardrails more comprehensively to preserve all
    const grouped: any = {
      // Group by severity (all guardrails will be in one of these)
      critical: guardrails.filter(g => g.severity === 'critical'),
      high: guardrails.filter(g => g.severity === 'high'),
      medium: guardrails.filter(g => g.severity === 'medium'),
      low: guardrails.filter(g => g.severity === 'low'),

      // Legacy categories for backward compatibility
      operational: guardrails.filter(g =>
        ['performance', 'cost_control', 'operational', 'integration'].includes(g.type)),
      ethical: guardrails.filter(g =>
        ['ethical', 'bias_mitigation', 'bias_testing', 'bias-testing'].includes(g.type)),
      economic: guardrails.filter(g =>
        ['cost_control', 'economic'].includes(g.type)),
      evolutionary: guardrails.filter(g =>
        g.evolutionStrategy !== undefined || g.type === 'evolutionary'),

      // All guardrails preserved
      all: guardrails
    };

    // Group by type for better organization
    grouped.byType = guardrails.reduce((acc: any, g) => {
      const type = g.type || 'uncategorized';
      if (!acc[type]) acc[type] = [];
      acc[type].push(g);
      return acc;
    }, {});

    console.log(`📊 Guardrails preserved: ${guardrails.length} total`);
    console.log(`   By severity: Critical=${grouped.critical.length}, High=${grouped.high.length}, Medium=${grouped.medium.length}, Low=${grouped.low.length}`);
    console.log(`   By type: ${Object.keys(grouped.byType).length} unique types`);

    // Determine platform
    const platform = this.determinePlatform(assessment);

    return {
      version: '2.0.0',
      platform,
      rules: grouped,
      deployment: {
        stages: ['development', 'staging', 'production'],
        rollback: {
          triggers: this.determineRollbackTriggers(assessment),
          strategy: 'gradual'
        }
      },
      monitoring: this.generateMonitoringRequirements(guardrails),
      documentation: {
        rationale: 'Generated through multi-agent reasoning system',
        tradeoffs: this.identifyTradeoffs(guardrails),
        assumptions: [
          'Current regulatory framework remains stable',
          'User behavior follows expected patterns',
          'Infrastructure can support specified requirements'
        ]
      }
    };
  }

  /**
   * Determine the target platform
   */
  private determinePlatform(assessment: ComprehensiveAssessment): any {
    if (assessment.technicalFeasibility?.modelProvider) {
      const provider = assessment.technicalFeasibility.modelProvider.toLowerCase();
      if (provider.includes('openai')) return 'openai';
      if (provider.includes('anthropic')) return 'anthropic';
      if (provider.includes('google')) return 'google';
      if (provider.includes('aws')) return 'aws';
      if (provider.includes('azure')) return 'azure';
    }
    return 'multi-platform';
  }

  /**
   * Determine rollback triggers based on assessment
   */
  private determineRollbackTriggers(assessment: ComprehensiveAssessment): string[] {
    const triggers = ['error_rate > 5%', 'latency > 2000ms'];

    if (assessment.businessFeasibility?.systemCriticality === 'Mission Critical') {
      triggers.push('availability < 99.9%');
      triggers.push('data_loss_detected');
    }

    if (assessment.businessFeasibility?.maxHallucinationRate) {
      triggers.push(`hallucination_rate > ${assessment.businessFeasibility.maxHallucinationRate}%`);
    }

    return triggers;
  }

  /**
   * Generate monitoring requirements from guardrails
   */
  private generateMonitoringRequirements(guardrails: Guardrail[]): any[] {
    const requirements: any[] = [];

    guardrails.forEach(guardrail => {
      if (guardrail.implementation.monitoring) {
        requirements.push(...guardrail.implementation.monitoring);
      }
    });

    // Remove duplicates
    const unique = new Map();
    requirements.forEach(req => {
      const key = `${req.metric}-${req.threshold}`;
      if (!unique.has(key)) {
        unique.set(key, req);
      }
    });

    return Array.from(unique.values());
  }

  /**
   * Identify tradeoffs in the guardrails
   */
  private identifyTradeoffs(guardrails: Guardrail[]): string[] {
    const tradeoffs = [];

    // Check for performance vs safety tradeoffs
    const hasStrictSafety = guardrails.some(g => g.type === 'content_safety' && g.severity === 'critical');
    const hasPerformanceReqs = guardrails.some(g => g.type === 'performance');

    if (hasStrictSafety && hasPerformanceReqs) {
      tradeoffs.push('Strict safety checks may impact latency targets');
    }

    // Check for cost vs quality tradeoffs
    const hasCostControls = guardrails.some(g => g.type === 'cost_control');
    const hasQualityReqs = guardrails.some(g => g.type === 'hallucination_control');

    if (hasCostControls && hasQualityReqs) {
      tradeoffs.push('Cost optimization may require using smaller models with potential quality impact');
    }

    return tradeoffs;
  }

  /**
   * Combine reasoning from different sources
   */
  private combineReasoning(perspectives: any[], agentReasoning: any): any {
    return {
      timestamp: new Date().toISOString(),
      perspectives: perspectives.length > 0 
        ? perspectives.map(p => ({
            approach: p.approach || 'unknown',
            reasoning: p.reasoning || 'No reasoning available'
          }))
        : [],
      agentReasoning,
      synthesis: perspectives.length > 0
        ? 'Combined multi-perspective LLM reasoning with specialist agent analysis'
        : 'Agent-based analysis (LLM unavailable)'
    };
  }

  /**
   * Run comprehensive validation on generated guardrails
   */
  async runValidation(
    guardrails: GuardrailsConfig,
    assessment: ComprehensiveAssessment
  ): Promise<ValidationReport> {
    console.log('🔍 Running comprehensive validation...');
    
    const report = await validateGuardrails(guardrails, assessment);
    
    // If validation fails critically, log issues
    if (!report.isValid) {
      console.error('❌ Validation failed with critical errors:');
      report.issues
        .filter(i => i.type === 'error')
        .forEach(issue => {
          console.error(`  - ${issue.message}`);
          if (issue.suggestion) {
            console.error(`    💡 ${issue.suggestion}`);
          }
        });
    } else {
      console.log(`✅ Validation passed with score: ${report.score}/100`);
    }
    
    return report;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(perspectives: any[], agentConfidence: any): any {
    // Handle case where no LLM perspectives are available
    const llmConfidence = perspectives.length > 0 
      ? perspectives.reduce((sum, p) => sum + (p.confidence || 0), 0) / perspectives.length
      : 0;
    
    // If no LLM confidence, use agent confidence only
    const overallScore = perspectives.length > 0
      ? (llmConfidence + agentConfidence.overall) / 2
      : agentConfidence.overall;

    return {
      overall: overallScore,
      breakdown: {
        ...agentConfidence.breakdown,
        llmReasoning: llmConfidence
      },
      uncertainties: [
        'Emerging regulations may require updates',
        'Long-term model behavior under edge cases',
        'Unforeseen interaction effects between guardrails'
      ]
    };
  }

  /**
   * Assess the complexity of the use case
   */
  private assessComplexity(assessment: ComprehensiveAssessment): number {
    let complexity = 0;

    // Technical complexity
    complexity += (assessment.technicalFeasibility?.technicalComplexity || 0) / 10;

    // Integration complexity
    complexity += (assessment.technicalFeasibility?.integrationPoints?.length || 0) / 10;

    // Regulatory complexity
    complexity += (assessment.riskAssessment?.dataProtection?.jurisdictions?.length || 0) / 5;

    // Data complexity
    complexity += (assessment.dataReadiness?.dataTypes?.length || 0) / 10;

    // User complexity
    complexity += (assessment.businessFeasibility?.userCategories?.length || 0) / 5;

    return Math.min(complexity, 10);
  }

  /**
   * Get domain-specific system prompt
   */
  private getDomainSystemPrompt(domain?: string): string {
    const basePrompt = `You are an AI safety expert generating guardrails for AI systems. 
    You must respond with a valid, parseable JSON object. Be concise but comprehensive.`;

    if (!domain) {
      return `${basePrompt}
      
      Structure your response EXACTLY as follows:
      {
        "critical": [...],      // Array of critical guardrails
        "operational": [...],   // Array of operational guardrails  
        "ethical": [...],       // Array of ethical guardrails
        "economic": [...],      // Array of economic guardrails
        "reasoning": {...},     // Object with key_insights and assumptions
        "confidence": 0.85      // Number between 0-1
      }
      
      Each guardrail must have: id, type, severity, rule, description, rationale, implementation.
      Focus on the most important guardrails specific to this use case.`;
    }

    const domainPrompts: Record<string, string> = {
      security_vulnerabilities: `${basePrompt}
      
      You are specialized in security vulnerabilities and attack vectors.
      Focus EXCLUSIVELY on:
      - Prompt injection defense mechanisms
      - Jailbreak prevention strategies
      - Adversarial input detection
      - Model inversion attack prevention
      - Data poisoning mitigation
      - Output validation and sanitization
      
      Structure your response as:
      {
        "security": [
          {
            "id": "unique-id",
            "type": "prompt_injection|jailbreak|adversarial|data_poisoning",
            "severity": "critical|high|medium",
            "rule": "SPECIFIC_SECURITY_RULE",
            "description": "Clear security control description",
            "rationale": "Security risk being mitigated",
            "implementation": {
              "detection_pattern": "regex or algorithm",
              "prevention_method": "specific technique",
              "monitoring": { "metric": "...", "threshold": "..." }
            }
          }
        ],
        "reasoning": { "vulnerabilities_identified": [...], "attack_vectors": [...] },
        "confidence": 0.85
      }`,

      performance_sla: `${basePrompt}
      
      You are specialized in performance optimization and SLA management.
      Focus EXCLUSIVELY on:
      - Response time enforcement (latency requirements)
      - Throughput optimization
      - Availability and uptime requirements
      - Load balancing strategies
      - Caching mechanisms
      - Circuit breaker patterns
      - Timeout configurations
      
      Structure your response as:
      {
        "performance": [
          {
            "id": "unique-id",
            "type": "latency|throughput|availability|caching",
            "severity": "critical|high|medium",
            "rule": "SPECIFIC_PERFORMANCE_RULE",
            "description": "Performance requirement description",
            "rationale": "Why this performance metric matters",
            "implementation": {
              "threshold": "specific value with unit",
              "monitoring_interval": "1m|5m|1h",
              "fallback_strategy": "what to do when threshold exceeded",
              "optimization_technique": "specific method"
            }
          }
        ],
        "reasoning": { "sla_requirements": [...], "bottlenecks": [...] },
        "confidence": 0.85
      }`,

      cost_optimization: `${basePrompt}
      
      You are specialized in cost optimization and resource management.
      Focus EXCLUSIVELY on:
      - Token usage optimization
      - API call reduction strategies
      - Model selection optimization
      - Caching for cost reduction
      - Batch processing opportunities
      - Resource allocation efficiency
      - Budget alert mechanisms
      
      Structure your response as:
      {
        "cost": [
          {
            "id": "unique-id",
            "type": "token_optimization|api_cost|resource_efficiency",
            "severity": "high|medium|low",
            "rule": "SPECIFIC_COST_RULE",
            "description": "Cost optimization strategy",
            "rationale": "Expected cost savings",
            "implementation": {
              "optimization_method": "specific technique",
              "expected_savings": "percentage or amount",
              "budget_threshold": "alert level",
              "measurement": "how to track savings"
            }
          }
        ],
        "reasoning": { "cost_drivers": [...], "optimization_opportunities": [...] },
        "confidence": 0.85
      }`,

      data_governance: `${basePrompt}
      
      You are specialized in data governance and privacy management.
      Focus EXCLUSIVELY on:
      - Data minimization strategies
      - PII detection and masking
      - Data retention policies
      - Cross-border data transfer controls
      - Purpose limitation enforcement
      - Consent management
      - Data quality monitoring
      - Model drift detection
      
      Structure your response as:
      {
        "governance": [
          {
            "id": "unique-id",
            "type": "data_minimization|retention|privacy|drift_monitoring",
            "severity": "critical|high|medium",
            "rule": "SPECIFIC_GOVERNANCE_RULE",
            "description": "Data governance control",
            "rationale": "Compliance or risk mitigation reason",
            "implementation": {
              "control_mechanism": "specific method",
              "monitoring_frequency": "daily|weekly|monthly",
              "compliance_framework": "GDPR|HIPAA|etc",
              "enforcement_method": "how to enforce"
            }
          }
        ],
        "reasoning": { "data_risks": [...], "compliance_requirements": [...] },
        "confidence": 0.85
      }`
    };

    return domainPrompts[domain] || basePrompt;
  }

  /**
   * Generate domain-specific prompt
   */
  private generateDomainPrompt(
    assessment: ComprehensiveAssessment,
    orgPolicies: any,
    domain: string
  ): string {
    const domainContexts: Record<string, () => string> = {
      security_vulnerabilities: () => `
        Generate security-focused guardrails for this AI use case.
        
        CRITICAL SECURITY CONTEXT:
        - Prompt Injection Vulnerability Score: ${assessment.riskAssessment?.modelRisks?.['Prompt Injection Vulnerability'] || 'Unknown'}
        - Adversarial Input Risk: ${assessment.riskAssessment?.modelRisks?.['Adversarial Inputs'] || 'Unknown'}
        - Data Poisoning Risk: ${assessment.riskAssessment?.modelRisks?.['Data Poisoning Risk'] || 'Unknown'}
        - Public Facing: ${assessment.businessFeasibility?.userCategories?.includes('General Public') ? 'YES' : 'NO'}
        - Agent Architecture: ${assessment.technicalFeasibility?.agentArchitecture || 'Not specified'}
        - Autonomy Level: ${assessment.technicalFeasibility?.agentAutonomy || 'Not specified'}
        
        Generate specific security guardrails addressing these vulnerabilities.
        Include detection patterns, prevention methods, and monitoring configurations.`,

      performance_sla: () => `
        Generate performance and SLA guardrails for this AI use case.
        
        CRITICAL PERFORMANCE REQUIREMENTS:
        - Response Time Requirement: ${assessment.businessFeasibility?.responseTimeRequirement || 'Not specified'}
        - Availability Requirement: ${assessment.businessFeasibility?.availabilityRequirement || 'Not specified'}
        - Concurrent Users: ${assessment.businessFeasibility?.concurrentUsers || 'Not specified'}
        - System Criticality: ${assessment.businessFeasibility?.systemCriticality || 'Not specified'}
        - Expected Requests/Day: ${assessment.technicalFeasibility?.expectedRequestsPerDay || 'Not specified'}
        - Streaming Enabled: ${assessment.technicalFeasibility?.streamingEnabled ? 'YES' : 'NO'}
        
        Generate specific performance guardrails with thresholds, monitoring intervals, and fallback strategies.`,

      cost_optimization: () => `
        Generate cost optimization guardrails for this AI use case.
        
        CRITICAL COST CONTEXT:
        - Monthly Token Volume: ${assessment.budgetPlanning?.monthlyTokenVolume || 0} tokens
        - Budget Range: ${assessment.budgetPlanning?.budgetRange || 'Not specified'}
        - Total Investment: ${assessment.financialConstraints?.totalInvestment || 'Not specified'}
        - API Cost Base: ${assessment.budgetPlanning?.baseApiCost || 0}
        - Average Input Tokens: ${assessment.technicalFeasibility?.avgInputTokens || 0}
        - Average Output Tokens: ${assessment.technicalFeasibility?.avgOutputTokens || 0}
        - Model Provider: ${assessment.technicalFeasibility?.modelProvider || 'Not specified'}
        
        Generate specific cost optimization guardrails with budget alerts, token limits, and efficiency strategies.`,

      data_governance: () => `
        Generate data governance guardrails for this AI use case.
        
        CRITICAL DATA CONTEXT:
        - Data Types: ${assessment.dataReadiness?.dataTypes?.join(', ') || 'Not specified'}
        - Data Volume: ${assessment.dataReadiness?.dataVolume || 'Not specified'}
        - Data Retention: ${assessment.dataReadiness?.dataRetention || 'Not specified'}
        - Cross-Border Transfer: ${assessment.dataReadiness?.crossBorderTransfer ? 'YES' : 'NO'}
        - Data Minimization: ${assessment.ethicalImpact?.privacySecurity?.dataMinimization ? 'ENABLED' : 'NOT ENABLED'}
        - Model Drift Risk: ${assessment.riskAssessment?.modelRisks?.['Model Drift/Degradation'] || 'Unknown'}
        - Compliance: ${Object.keys(assessment.complianceRequirements || {}).filter(k => assessment.complianceRequirements[k]).join(', ')}
        
        Generate specific data governance guardrails for minimization, retention, drift monitoring, and compliance.`
    };

    const contextGenerator = domainContexts[domain];
    if (!contextGenerator) {
      throw new Error(`Unknown domain: ${domain}`);
    }

    return contextGenerator();
  }
}