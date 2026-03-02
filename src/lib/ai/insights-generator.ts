import { OpenAI } from 'openai'

// AI-powered insights generator for use cases

export interface InsightCategory {
  id: string
  name: string
  description: string
  weight: number
}

export interface GeneratedInsight {
  id: string
  category: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  actionable: boolean
  priority: number
  relatedData: string[]
  suggestions: string[]
  metrics: string[]
  timeline: string
  resources: string[]
  dependencies: string[]
  risks: string[]
  opportunities: string[]
  createdAt: Date
}

export interface InsightAnalysis {
  useCaseId: string
  insights: GeneratedInsight[]
  summary: {
    totalInsights: number
    highImpactInsights: number
    actionableInsights: number
    averageConfidence: number
    topCategories: string[]
  }
  recommendations: string[]
  trends: string[]
  patterns: string[]
  analysisDate: Date
}

export interface ComparativeInsight {
  insightId: string
  comparison: {
    similarUseCases: number
    averageScore: number
    bestPractices: string[]
    commonChallenges: string[]
    successFactors: string[]
  }
}

class AIInsightsGenerator {
  private openai: OpenAI
  private insightCategories: InsightCategory[] = []

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.initializeCategories()
  }

  private initializeCategories() {
    this.insightCategories = [
      {
        id: 'technical_feasibility',
        name: 'Technical Feasibility',
        description: 'Insights related to technical implementation and feasibility',
        weight: 0.25,
      },
      {
        id: 'business_value',
        name: 'Business Value',
        description: 'Insights related to business impact and value creation',
        weight: 0.20,
      },
      {
        id: 'data_insights',
        name: 'Data Insights',
        description: 'Insights related to data quality, availability, and utilization',
        weight: 0.15,
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        description: 'Insights related to potential risks and mitigation strategies',
        weight: 0.15,
      },
      {
        id: 'compliance',
        name: 'Compliance & Governance',
        description: 'Insights related to regulatory compliance and governance',
        weight: 0.10,
      },
      {
        id: 'optimization',
        name: 'Optimization Opportunities',
        description: 'Insights related to optimization and improvement opportunities',
        weight: 0.10,
      },
      {
        id: 'stakeholder',
        name: 'Stakeholder Impact',
        description: 'Insights related to stakeholder engagement and impact',
        weight: 0.05,
      },
    ]
  }

  async generateInsights(useCaseData: any, evaluationData?: any): Promise<InsightAnalysis> {
    try {
      const insights: GeneratedInsight[] = []
      
      // Generate insights for each category
      for (const category of this.insightCategories) {
        const categoryInsights = await this.generateCategoryInsights(category, useCaseData, evaluationData)
        insights.push(...categoryInsights)
      }

      // Generate cross-category insights
      const crossCategoryInsights = await this.generateCrossCategoryInsights(useCaseData, evaluationData)
      insights.push(...crossCategoryInsights)

      // Analyze patterns and trends
      const patterns = await this.analyzePatterns(insights)
      const trends = await this.analyzeTrends(useCaseData, insights)

      // Generate summary
      const summary = this.generateSummary(insights)
      const recommendations = await this.generateRecommendations(insights, patterns, trends)

      return {
        useCaseId: useCaseData.id,
        insights,
        summary,
        recommendations,
        trends,
        patterns,
        analysisDate: new Date(),
      }

    } catch (error) {
      console.error('Failed to generate insights:', error)
      throw new Error('Insight generation failed')
    }
  }

  private async generateCategoryInsights(
    category: InsightCategory,
    useCaseData: any,
    evaluationData?: any
  ): Promise<GeneratedInsight[]> {
    const prompt = this.buildCategoryPrompt(category, useCaseData, evaluationData)
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI insights expert specializing in ${category.name}. Generate actionable insights based on the provided use case data.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content || ''
      return this.parseInsightsResponse(content, category.id)

    } catch (error) {
      console.error(`Failed to generate insights for category ${category.id}:`, error)
      return []
    }
  }

  private buildCategoryPrompt(category: InsightCategory, useCaseData: any, evaluationData?: any): string {
    return `
Generate 3-5 actionable insights for the category: "${category.name}"

Category Description: ${category.description}

Use Case Data:
- Title: ${useCaseData.title}
- Problem Statement: ${useCaseData.problemStatement}
- Proposed Solution: ${useCaseData.proposedAISolution}
- Business Function: ${useCaseData.businessFunction}
- Stakeholders: ${useCaseData.primaryStakeholders?.join(', ')}
- Success Criteria: ${useCaseData.successCriteria}
- Timeline: ${useCaseData.estimatedTimeline}
- Resources: ${useCaseData.requiredResources}
- Budget: ${useCaseData.initialCost}
- ROI: ${useCaseData.initialROI}

${evaluationData ? `
Evaluation Data:
- Overall Score: ${evaluationData.overallScore}/10
- Category Scores: ${JSON.stringify(evaluationData.categoryScores)}
- Risk Assessment: ${evaluationData.riskAssessment?.overallRisk}
` : ''}

For each insight, provide:
1. Title (concise and actionable)
2. Description (detailed explanation)
3. Impact (low, medium, high, critical)
4. Confidence (0-1)
5. Actionable (true/false)
6. Priority (1-10)
7. Related Data (what data supports this insight)
8. Suggestions (specific actions to take)
9. Metrics (how to measure success)
10. Timeline (when to implement)
11. Resources (what resources are needed)
12. Dependencies (what needs to happen first)
13. Risks (potential risks)
14. Opportunities (potential opportunities)

Format as JSON array with these fields.
    `.trim()
  }

  private parseInsightsResponse(content: string, categoryId: string): GeneratedInsight[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return parsed.map((insight: any, index: number) => ({
        id: `${categoryId}_${index}_${Date.now()}`,
        category: categoryId,
        title: insight.title || 'Untitled Insight',
        description: insight.description || 'No description provided',
        impact: insight.impact || 'medium',
        confidence: Math.max(0, Math.min(1, insight.confidence || 0.5)),
        actionable: insight.actionable !== false,
        priority: Math.max(1, Math.min(10, insight.priority || 5)),
        relatedData: Array.isArray(insight.relatedData) ? insight.relatedData : [],
        suggestions: Array.isArray(insight.suggestions) ? insight.suggestions : [],
        metrics: Array.isArray(insight.metrics) ? insight.metrics : [],
        timeline: insight.timeline || 'To be determined',
        resources: Array.isArray(insight.resources) ? insight.resources : [],
        dependencies: Array.isArray(insight.dependencies) ? insight.dependencies : [],
        risks: Array.isArray(insight.risks) ? insight.risks : [],
        opportunities: Array.isArray(insight.opportunities) ? insight.opportunities : [],
        createdAt: new Date(),
      }))

    } catch (error) {
      console.error('Failed to parse insights response:', error)
      return []
    }
  }

  private async generateCrossCategoryInsights(useCaseData: any, evaluationData?: any): Promise<GeneratedInsight[]> {
    const prompt = `
Generate 2-3 cross-category insights that connect multiple aspects of this use case:

Use Case: ${useCaseData.title}
Problem: ${useCaseData.problemStatement}
Solution: ${useCaseData.proposedAISolution}

${evaluationData ? `
Evaluation Data:
- Overall Score: ${evaluationData.overallScore}/10
- Risk Level: ${evaluationData.riskAssessment?.overallRisk}
` : ''}

Look for insights that:
1. Connect technical and business aspects
2. Identify optimization opportunities across categories
3. Highlight potential synergies or conflicts
4. Suggest innovative approaches
5. Address multiple risk factors simultaneously

Format as JSON array with the same structure as category insights.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1000,
      })

      const content = response.choices[0]?.message?.content || ''
      return this.parseInsightsResponse(content, 'cross_category')

    } catch (error) {
      console.error('Failed to generate cross-category insights:', error)
      return []
    }
  }

  private async analyzePatterns(insights: GeneratedInsight[]): Promise<string[]> {
    const patterns: string[] = []
    
    // Analyze impact patterns
    const highImpactInsights = insights.filter(i => i.impact === 'high' || i.impact === 'critical')
    if (highImpactInsights.length > 3) {
      patterns.push('Multiple high-impact insights identified - consider prioritization strategy')
    }

    // Analyze confidence patterns
    const lowConfidenceInsights = insights.filter(i => i.confidence < 0.6)
    if (lowConfidenceInsights.length > insights.length * 0.3) {
      patterns.push('High number of low-confidence insights - additional data collection recommended')
    }

    // Analyze actionable patterns
    const actionableInsights = insights.filter(i => i.actionable)
    if (actionableInsights.length < insights.length * 0.5) {
      patterns.push('Low actionable insight ratio - focus on implementation-ready recommendations')
    }

    // Analyze category distribution
    const categoryCounts = insights.reduce((acc, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const dominantCategory = Object.entries(categoryCounts).reduce((a, b) => 
      categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b
    )

    if (dominantCategory[1] > insights.length * 0.4) {
      patterns.push(`Insights heavily focused on ${dominantCategory[0]} - consider broader analysis`)
    }

    return patterns
  }

  private async analyzeTrends(useCaseData: any, insights: GeneratedInsight[]): Promise<string[]> {
    const trends: string[] = []

    // Analyze timeline trends
    const timelineInsights = insights.filter(i => i.timeline && i.timeline !== 'To be determined')
    if (timelineInsights.length > 0) {
      const shortTermInsights = timelineInsights.filter(i => 
        i.timeline.includes('1-3') || i.timeline.includes('immediate') || i.timeline.includes('quick')
      )
      if (shortTermInsights.length > timelineInsights.length * 0.6) {
        trends.push('Most insights suggest short-term implementation - consider phased approach')
      }
    }

    // Analyze resource trends
    const resourceInsights = insights.filter(i => i.resources.length > 0)
    const commonResources = resourceInsights.flatMap(i => i.resources)
    const resourceCounts = commonResources.reduce((acc, resource) => {
      acc[resource] = (acc[resource] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topResources = Object.entries(resourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    if (topResources.length > 0) {
      trends.push(`Common resource requirements: ${topResources.map(r => r[0]).join(', ')}`)
    }

    // Analyze risk trends
    const riskInsights = insights.filter(i => i.risks.length > 0)
    if (riskInsights.length > insights.length * 0.4) {
      trends.push('High risk awareness - comprehensive risk mitigation strategy needed')
    }

    return trends
  }

  private generateSummary(insights: GeneratedInsight[]): any {
    const highImpactInsights = insights.filter(i => i.impact === 'high' || i.impact === 'critical')
    const actionableInsights = insights.filter(i => i.actionable)
    const averageConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length

    const categoryCounts = insights.reduce((acc, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(c => c[0])

    return {
      totalInsights: insights.length,
      highImpactInsights: highImpactInsights.length,
      actionableInsights: actionableInsights.length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      topCategories,
    }
  }

  private async generateRecommendations(
    insights: GeneratedInsight[],
    patterns: string[],
    trends: string[]
  ): Promise<string[]> {
    const prompt = `
Based on the following insights analysis, generate 5-7 strategic recommendations:

Insights Summary:
- Total Insights: ${insights.length}
- High Impact: ${insights.filter(i => i.impact === 'high' || i.impact === 'critical').length}
- Actionable: ${insights.filter(i => i.actionable).length}
- Average Confidence: ${(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length).toFixed(2)}

Patterns Identified:
${patterns.map(p => `- ${p}`).join('\n')}

Trends Identified:
${trends.map(t => `- ${t}`).join('\n')}

Generate strategic recommendations that:
1. Address the identified patterns and trends
2. Prioritize high-impact, actionable insights
3. Consider resource constraints and timelines
4. Provide clear next steps
5. Focus on business value creation

Format as a simple list of recommendations.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
      })

      const content = response.choices[0]?.message?.content || ''
      return content.split('\n').filter(line => line.trim()).map(line => line.replace(/^\d+\.\s*/, '').trim())
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return ['Manual review recommended for strategic recommendations']
    }
  }

  // Generate comparative insights
  async generateComparativeInsights(
    currentUseCase: any,
    similarUseCases: any[]
  ): Promise<ComparativeInsight[]> {
    const prompt = `
Compare the current use case with similar use cases to generate comparative insights:

Current Use Case:
- Title: ${currentUseCase.title}
- Problem: ${currentUseCase.problemStatement}
- Solution: ${currentUseCase.proposedAISolution}
- Business Function: ${currentUseCase.businessFunction}

Similar Use Cases:
${similarUseCases.map((uc, index) => `
${index + 1}. ${uc.title}
   - Problem: ${uc.problemStatement}
   - Solution: ${uc.proposedAISolution}
   - Business Function: ${uc.businessFunction}
   - Success Rate: ${uc.successRate || 'Unknown'}
`).join('\n')}

Generate insights that compare:
1. Common success factors
2. Shared challenges
3. Best practices from similar cases
4. Unique aspects of current case
5. Lessons learned from similar implementations

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
      console.error('Failed to generate comparative insights:', error)
      return []
    }
  }

  // Get insight categories
  getInsightCategories(): InsightCategory[] {
    return [...this.insightCategories]
  }

  // Filter insights by criteria
  filterInsights(insights: GeneratedInsight[], criteria: {
    category?: string
    impact?: string
    actionable?: boolean
    minConfidence?: number
    minPriority?: number
  }): GeneratedInsight[] {
    return insights.filter(insight => {
      if (criteria.category && insight.category !== criteria.category) return false
      if (criteria.impact && insight.impact !== criteria.impact) return false
      if (criteria.actionable !== undefined && insight.actionable !== criteria.actionable) return false
      if (criteria.minConfidence && insight.confidence < criteria.minConfidence) return false
      if (criteria.minPriority && insight.priority < criteria.minPriority) return false
      return true
    })
  }
}

// Global insights generator instance
export const insightsGenerator = new AIInsightsGenerator()

export default insightsGenerator


