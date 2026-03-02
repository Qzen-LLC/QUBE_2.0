import { OpenAI } from 'openai'

// Intelligent recommendation engine for AI use cases

export interface RecommendationContext {
  useCaseData: any
  evaluationData?: any
  insightsData?: any
  userPreferences?: any
  organizationalContext?: any
  historicalData?: any[]
}

export interface RecommendationRule {
  id: string
  name: string
  description: string
  category: 'technical' | 'business' | 'compliance' | 'risk' | 'optimization'
  priority: number
  conditions: string[]
  actions: string[]
  confidence: number
}

export interface IntelligentRecommendation {
  id: string
  type: 'implementation' | 'optimization' | 'risk_mitigation' | 'compliance' | 'business' | 'technical'
  title: string
  description: string
  rationale: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  effort: 'low' | 'medium' | 'high'
  priority: number
  confidence: number
  dependencies: string[]
  timeline: string
  resources: string[]
  expectedOutcome: string
  metrics: string[]
  successCriteria: string[]
  risks: string[]
  opportunities: string[]
  alternatives: string[]
  bestPractices: string[]
  lessonsLearned: string[]
  createdAt: Date
}

export interface RecommendationSet {
  useCaseId: string
  recommendations: IntelligentRecommendation[]
  summary: {
    totalRecommendations: number
    highPriorityRecommendations: number
    highImpactRecommendations: number
    averageConfidence: number
    estimatedTimeline: string
    resourceRequirements: string[]
  }
  analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  generatedAt: Date
}

export interface RecommendationComparison {
  recommendationId: string
  similarRecommendations: number
  successRate: number
  averageOutcome: string
  commonChallenges: string[]
  bestPractices: string[]
}

class IntelligentRecommendationEngine {
  private openai: OpenAI
  private recommendationRules: RecommendationRule[] = []
  private historicalRecommendations: IntelligentRecommendation[] = []

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.initializeRules()
  }

  private initializeRules() {
    this.recommendationRules = [
      {
        id: 'technical_feasibility_check',
        name: 'Technical Feasibility Assessment',
        description: 'Assess technical feasibility and provide implementation recommendations',
        category: 'technical',
        priority: 9,
        conditions: ['technical_complexity_high', 'integration_required'],
        actions: ['assess_technical_feasibility', 'recommend_implementation_approach'],
        confidence: 0.8,
      },
      {
        id: 'data_quality_improvement',
        name: 'Data Quality Enhancement',
        description: 'Recommend data quality improvements for better AI outcomes',
        category: 'technical',
        priority: 8,
        conditions: ['data_quality_issues', 'ai_model_required'],
        actions: ['assess_data_quality', 'recommend_data_improvements'],
        confidence: 0.85,
      },
      {
        id: 'risk_mitigation_strategy',
        name: 'Risk Mitigation Strategy',
        description: 'Develop comprehensive risk mitigation strategies',
        category: 'risk',
        priority: 9,
        conditions: ['high_risk_identified', 'compliance_requirements'],
        actions: ['assess_risks', 'recommend_mitigation_strategies'],
        confidence: 0.75,
      },
      {
        id: 'business_value_optimization',
        name: 'Business Value Optimization',
        description: 'Optimize business value and ROI through strategic recommendations',
        category: 'business',
        priority: 8,
        conditions: ['business_value_assessment', 'roi_calculation'],
        actions: ['assess_business_value', 'recommend_optimization'],
        confidence: 0.8,
      },
      {
        id: 'compliance_framework',
        name: 'Compliance Framework Implementation',
        description: 'Ensure compliance with relevant regulations and standards',
        category: 'compliance',
        priority: 7,
        conditions: ['regulatory_requirements', 'data_privacy_concerns'],
        actions: ['assess_compliance', 'recommend_framework'],
        confidence: 0.9,
      },
    ]
  }

  async generateRecommendations(context: RecommendationContext): Promise<RecommendationSet> {
    try {
      const recommendations: IntelligentRecommendation[] = []

      // Generate recommendations based on rules
      for (const rule of this.recommendationRules) {
        if (this.evaluateRuleConditions(rule, context)) {
          const ruleRecommendations = await this.generateRuleBasedRecommendations(rule, context)
          recommendations.push(...ruleRecommendations)
        }
      }

      // Generate contextual recommendations
      const contextualRecommendations = await this.generateContextualRecommendations(context)
      recommendations.push(...contextualRecommendations)

      // Generate optimization recommendations
      const optimizationRecommendations = await this.generateOptimizationRecommendations(context)
      recommendations.push(...optimizationRecommendations)

      // Remove duplicates and sort by priority
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations)
      const sortedRecommendations = uniqueRecommendations.sort((a, b) => b.priority - a.priority)

      // Generate analysis
      const analysis = await this.generateSWOTAnalysis(context, sortedRecommendations)
      const summary = this.generateSummary(sortedRecommendations)

      const recommendationSet: RecommendationSet = {
        useCaseId: context.useCaseData.id,
        recommendations: sortedRecommendations,
        summary,
        analysis,
        generatedAt: new Date(),
      }

      // Store for future reference
      this.historicalRecommendations.push(...sortedRecommendations)

      return recommendationSet

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      throw new Error('Recommendation generation failed')
    }
  }

  private evaluateRuleConditions(rule: RecommendationRule, context: RecommendationContext): boolean {
    // Simple condition evaluation - in a real implementation, this would be more sophisticated
    return rule.conditions.some(condition => {
      switch (condition) {
        case 'technical_complexity_high':
          return context.evaluationData?.categoryScores?.technical < 6
        case 'integration_required':
          return context.useCaseData.requiredResources?.includes('integration')
        case 'data_quality_issues':
          return context.evaluationData?.categoryScores?.technical < 7
        case 'ai_model_required':
          return context.useCaseData.proposedAISolution?.includes('AI') || 
                 context.useCaseData.proposedAISolution?.includes('ML')
        case 'high_risk_identified':
          return context.evaluationData?.riskAssessment?.overallRisk === 'high' ||
                 context.evaluationData?.riskAssessment?.overallRisk === 'critical'
        case 'compliance_requirements':
          return context.useCaseData.primaryStakeholders?.includes('compliance') ||
                 context.useCaseData.primaryStakeholders?.includes('legal')
        case 'business_value_assessment':
          return context.evaluationData?.categoryScores?.business > 7
        case 'roi_calculation':
          return context.useCaseData.initialROI && parseFloat(context.useCaseData.initialROI) > 0
        case 'regulatory_requirements':
          return context.useCaseData.businessFunction?.includes('healthcare') ||
                 context.useCaseData.businessFunction?.includes('finance')
        case 'data_privacy_concerns':
          return context.useCaseData.proposedAISolution?.includes('personal') ||
                 context.useCaseData.proposedAISolution?.includes('customer')
        default:
          return false
      }
    })
  }

  private async generateRuleBasedRecommendations(
    rule: RecommendationRule,
    context: RecommendationContext
  ): Promise<IntelligentRecommendation[]> {
    const prompt = this.buildRulePrompt(rule, context)
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI recommendation expert. Generate specific, actionable recommendations based on the provided rule and context.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content || ''
      return this.parseRecommendationsResponse(content, rule.category)

    } catch (error) {
      console.error(`Failed to generate recommendations for rule ${rule.id}:`, error)
      return []
    }
  }

  private buildRulePrompt(rule: RecommendationRule, context: RecommendationContext): string {
    return `
Generate 2-3 specific recommendations based on the rule: "${rule.name}"

Rule Description: ${rule.description}
Rule Category: ${rule.category}
Rule Priority: ${rule.priority}

Use Case Context:
- Title: ${context.useCaseData.title}
- Problem: ${context.useCaseData.problemStatement}
- Solution: ${context.useCaseData.proposedAISolution}
- Business Function: ${context.useCaseData.businessFunction}
- Stakeholders: ${context.useCaseData.primaryStakeholders?.join(', ')}
- Timeline: ${context.useCaseData.estimatedTimeline}
- Resources: ${context.useCaseData.requiredResources}

${context.evaluationData ? `
Evaluation Data:
- Overall Score: ${context.evaluationData.overallScore}/10
- Category Scores: ${JSON.stringify(context.evaluationData.categoryScores)}
- Risk Level: ${context.evaluationData.riskAssessment?.overallRisk}
` : ''}

For each recommendation, provide:
1. Type (implementation, optimization, risk_mitigation, compliance, business, technical)
2. Title (concise and actionable)
3. Description (detailed explanation)
4. Rationale (why this recommendation is important)
5. Impact (low, medium, high, critical)
6. Effort (low, medium, high)
7. Priority (1-10)
8. Confidence (0-1)
9. Dependencies (what needs to happen first)
10. Timeline (when to implement)
11. Resources (what resources are needed)
12. Expected Outcome (what success looks like)
13. Metrics (how to measure success)
14. Success Criteria (specific criteria for success)
15. Risks (potential risks)
16. Opportunities (potential opportunities)
17. Alternatives (alternative approaches)
18. Best Practices (industry best practices)
19. Lessons Learned (from similar implementations)

Format as JSON array with these fields.
    `.trim()
  }

  private async generateContextualRecommendations(context: RecommendationContext): Promise<IntelligentRecommendation[]> {
    const prompt = `
Generate 3-5 contextual recommendations based on the specific use case context:

Use Case: ${context.useCaseData.title}
Problem: ${context.useCaseData.problemStatement}
Solution: ${context.useCaseData.proposedAISolution}

Context Analysis:
- Business Function: ${context.useCaseData.businessFunction}
- Stakeholders: ${context.useCaseData.primaryStakeholders?.join(', ')}
- Success Criteria: ${context.useCaseData.successCriteria}
- Timeline: ${context.useCaseData.estimatedTimeline}
- Budget: ${context.useCaseData.initialCost}
- Expected ROI: ${context.useCaseData.initialROI}

${context.organizationalContext ? `
Organizational Context:
- Industry: ${context.organizationalContext.industry}
- Size: ${context.organizationalContext.size}
- Maturity: ${context.organizationalContext.aiMaturity}
` : ''}

Focus on recommendations that:
1. Address specific challenges in this context
2. Leverage organizational strengths
3. Mitigate contextual risks
4. Optimize for the specific business function
5. Align with stakeholder expectations

Format as JSON array with the same structure as rule-based recommendations.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content || ''
      return this.parseRecommendationsResponse(content, 'contextual')

    } catch (error) {
      console.error('Failed to generate contextual recommendations:', error)
      return []
    }
  }

  private async generateOptimizationRecommendations(context: RecommendationContext): Promise<IntelligentRecommendation[]> {
    const prompt = `
Generate 2-3 optimization recommendations to maximize the value and success of this use case:

Use Case: ${context.useCaseData.title}
Current Approach: ${context.useCaseData.proposedAISolution}

${context.evaluationData ? `
Current Assessment:
- Overall Score: ${context.evaluationData.overallScore}/10
- Feasibility Score: ${context.evaluationData.feasibilityScore}/10
- Priority Score: ${context.evaluationData.priorityScore}/10
- Estimated ROI: ${context.evaluationData.estimatedROI}%
` : ''}

Focus on optimizations that:
1. Improve implementation efficiency
2. Enhance business value
3. Reduce risks
4. Accelerate time-to-value
5. Optimize resource utilization
6. Improve scalability
7. Enhance maintainability

Format as JSON array with the same structure as other recommendations.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
      })

      const content = response.choices[0]?.message?.content || ''
      return this.parseRecommendationsResponse(content, 'optimization')

    } catch (error) {
      console.error('Failed to generate optimization recommendations:', error)
      return []
    }
  }

  private parseRecommendationsResponse(content: string, category: string): IntelligentRecommendation[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return parsed.map((rec: any, index: number) => ({
        id: `${category}_${index}_${Date.now()}`,
        type: rec.type || 'implementation',
        title: rec.title || 'Untitled Recommendation',
        description: rec.description || 'No description provided',
        rationale: rec.rationale || 'No rationale provided',
        impact: rec.impact || 'medium',
        effort: rec.effort || 'medium',
        priority: Math.max(1, Math.min(10, rec.priority || 5)),
        confidence: Math.max(0, Math.min(1, rec.confidence || 0.5)),
        dependencies: Array.isArray(rec.dependencies) ? rec.dependencies : [],
        timeline: rec.timeline || 'To be determined',
        resources: Array.isArray(rec.resources) ? rec.resources : [],
        expectedOutcome: rec.expectedOutcome || 'Improved outcomes',
        metrics: Array.isArray(rec.metrics) ? rec.metrics : [],
        successCriteria: Array.isArray(rec.successCriteria) ? rec.successCriteria : [],
        risks: Array.isArray(rec.risks) ? rec.risks : [],
        opportunities: Array.isArray(rec.opportunities) ? rec.opportunities : [],
        alternatives: Array.isArray(rec.alternatives) ? rec.alternatives : [],
        bestPractices: Array.isArray(rec.bestPractices) ? rec.bestPractices : [],
        lessonsLearned: Array.isArray(rec.lessonsLearned) ? rec.lessonsLearned : [],
        createdAt: new Date(),
      }))

    } catch (error) {
      console.error('Failed to parse recommendations response:', error)
      return []
    }
  }

  private deduplicateRecommendations(recommendations: IntelligentRecommendation[]): IntelligentRecommendation[] {
    const seen = new Set<string>()
    return recommendations.filter(rec => {
      const key = `${rec.title}_${rec.type}_${rec.description.substring(0, 50)}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private async generateSWOTAnalysis(
    context: RecommendationContext,
    recommendations: IntelligentRecommendation[]
  ): Promise<any> {
    const prompt = `
Generate a SWOT analysis based on the use case and recommendations:

Use Case: ${context.useCaseData.title}
Problem: ${context.useCaseData.problemStatement}
Solution: ${context.useCaseData.proposedAISolution}

Recommendations Summary:
${recommendations.slice(0, 5).map(r => `- ${r.title}: ${r.description}`).join('\n')}

Generate:
1. Strengths (internal positive factors)
2. Weaknesses (internal negative factors)
3. Opportunities (external positive factors)
4. Threats (external negative factors)

Format as JSON with arrays for each category.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
      })

      const content = response.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      }
    } catch (error) {
      console.error('Failed to generate SWOT analysis:', error)
      return {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      }
    }
  }

  private generateSummary(recommendations: IntelligentRecommendation[]): any {
    const highPriorityRecommendations = recommendations.filter(r => r.priority >= 8)
    const highImpactRecommendations = recommendations.filter(r => r.impact === 'high' || r.impact === 'critical')
    const averageConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length

    // Estimate timeline based on recommendations
    const timelines = recommendations.map(r => r.timeline).filter(t => t !== 'To be determined')
    const estimatedTimeline = timelines.length > 0 ? timelines[0] : 'To be determined'

    // Collect resource requirements
    const allResources = recommendations.flatMap(r => r.resources)
    const uniqueResources = [...new Set(allResources)]

    return {
      totalRecommendations: recommendations.length,
      highPriorityRecommendations: highPriorityRecommendations.length,
      highImpactRecommendations: highImpactRecommendations.length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      estimatedTimeline,
      resourceRequirements: uniqueResources,
    }
  }

  // Generate comparative recommendations
  async generateComparativeRecommendations(
    currentUseCase: any,
    similarUseCases: any[]
  ): Promise<RecommendationComparison[]> {
    const prompt = `
Compare recommendations for the current use case with similar use cases:

Current Use Case:
- Title: ${currentUseCase.title}
- Problem: ${currentUseCase.problemStatement}
- Solution: ${currentUseCase.proposedAISolution}

Similar Use Cases:
${similarUseCases.map((uc, index) => `
${index + 1}. ${uc.title}
   - Problem: ${uc.problemStatement}
   - Solution: ${uc.proposedAISolution}
   - Success Rate: ${uc.successRate || 'Unknown'}
   - Key Recommendations: ${uc.recommendations?.join(', ') || 'None'}
`).join('\n')}

Generate comparative insights that include:
1. Similar recommendations across use cases
2. Success rates for different recommendation types
3. Common challenges and how they were addressed
4. Best practices from successful implementations
5. Lessons learned from failed attempts

Format as JSON array with comparison data.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return []
    } catch (error) {
      console.error('Failed to generate comparative recommendations:', error)
      return []
    }
  }

  // Get recommendation rules
  getRecommendationRules(): RecommendationRule[] {
    return [...this.recommendationRules]
  }

  // Get historical recommendations
  getHistoricalRecommendations(): IntelligentRecommendation[] {
    return [...this.historicalRecommendations]
  }

  // Filter recommendations by criteria
  filterRecommendations(recommendations: IntelligentRecommendation[], criteria: {
    type?: string
    impact?: string
    effort?: string
    minPriority?: number
    minConfidence?: number
  }): IntelligentRecommendation[] {
    return recommendations.filter(rec => {
      if (criteria.type && rec.type !== criteria.type) return false
      if (criteria.impact && rec.impact !== criteria.impact) return false
      if (criteria.effort && rec.effort !== criteria.effort) return false
      if (criteria.minPriority && rec.priority < criteria.minPriority) return false
      if (criteria.minConfidence && rec.confidence < criteria.minConfidence) return false
      return true
    })
  }
}

// Global recommendation engine instance
export const recommendationEngine = new IntelligentRecommendationEngine()

export default recommendationEngine


