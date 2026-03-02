import { OpenAI } from 'openai'

// Enhanced AI evaluation engine with intelligent recommendations

export interface EvaluationCriteria {
  id: string
  name: string
  description: string
  weight: number
  category: 'technical' | 'business' | 'compliance' | 'risk' | 'feasibility'
  minScore: number
  maxScore: number
}

export interface EvaluationResult {
  criteriaId: string
  score: number
  reasoning: string
  confidence: number
  recommendations: string[]
  risks: string[]
  opportunities: string[]
}

export interface UseCaseEvaluation {
  useCaseId: string
  overallScore: number
  categoryScores: Record<string, number>
  results: EvaluationResult[]
  insights: string[]
  recommendations: string[]
  riskAssessment: RiskAssessment
  feasibilityScore: number
  priorityScore: number
  estimatedROI: number
  confidenceLevel: number
  evaluationDate: Date
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: Array<{
    factor: string
    level: 'low' | 'medium' | 'high' | 'critical'
    impact: string
    mitigation: string
  }>
  complianceRisks: string[]
  technicalRisks: string[]
  businessRisks: string[]
}

export interface AIInsight {
  id: string
  type: 'opportunity' | 'risk' | 'optimization' | 'compliance' | 'technical'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  actionable: boolean
  priority: number
  relatedCriteria: string[]
  suggestions: string[]
}

export interface IntelligentRecommendation {
  id: string
  type: 'implementation' | 'optimization' | 'risk_mitigation' | 'compliance' | 'business'
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
}

class EnhancedEvaluationEngine {
  private openai: OpenAI
  private criteria: EvaluationCriteria[] = []
  private evaluationHistory: UseCaseEvaluation[] = []

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.initializeCriteria()
  }

  private initializeCriteria() {
    this.criteria = [
      // Technical Criteria
      {
        id: 'technical_feasibility',
        name: 'Technical Feasibility',
        description: 'Assessment of technical implementation complexity and feasibility',
        weight: 0.25,
        category: 'technical',
        minScore: 1,
        maxScore: 10,
      },
      {
        id: 'data_quality',
        name: 'Data Quality & Availability',
        description: 'Quality and availability of required data for the AI solution',
        weight: 0.20,
        category: 'technical',
        minScore: 1,
        maxScore: 10,
      },
      {
        id: 'integration_complexity',
        name: 'Integration Complexity',
        description: 'Complexity of integrating with existing systems',
        weight: 0.15,
        category: 'technical',
        minScore: 1,
        maxScore: 10,
      },

      // Business Criteria
      {
        id: 'business_value',
        name: 'Business Value',
        description: 'Potential business value and impact of the AI solution',
        weight: 0.20,
        category: 'business',
        minScore: 1,
        maxScore: 10,
      },
      {
        id: 'stakeholder_support',
        name: 'Stakeholder Support',
        description: 'Level of support from key stakeholders',
        weight: 0.10,
        category: 'business',
        minScore: 1,
        maxScore: 10,
      },
      {
        id: 'resource_availability',
        name: 'Resource Availability',
        description: 'Availability of required resources (budget, personnel, time)',
        weight: 0.15,
        category: 'business',
        minScore: 1,
        maxScore: 10,
      },

      // Compliance Criteria
      {
        id: 'regulatory_compliance',
        name: 'Regulatory Compliance',
        description: 'Compliance with relevant regulations (GDPR, HIPAA, etc.)',
        weight: 0.15,
        category: 'compliance',
        minScore: 1,
        maxScore: 10,
      },
      {
        id: 'data_privacy',
        name: 'Data Privacy & Security',
        description: 'Data privacy and security considerations',
        weight: 0.10,
        category: 'compliance',
        minScore: 1,
        maxScore: 10,
      },

      // Risk Criteria
      {
        id: 'implementation_risk',
        name: 'Implementation Risk',
        description: 'Risk associated with implementation and deployment',
        weight: 0.10,
        category: 'risk',
        minScore: 1,
        maxScore: 10,
      },
      {
        id: 'operational_risk',
        name: 'Operational Risk',
        description: 'Risk associated with ongoing operations and maintenance',
        weight: 0.05,
        category: 'risk',
        minScore: 1,
        maxScore: 10,
      },
    ]
  }

  async evaluateUseCase(useCaseData: any): Promise<UseCaseEvaluation> {
    try {
      const evaluationResults: EvaluationResult[] = []
      let totalWeightedScore = 0
      let totalWeight = 0

      // Evaluate each criteria
      for (const criteria of this.criteria) {
        const result = await this.evaluateCriteria(criteria, useCaseData)
        evaluationResults.push(result)
        
        totalWeightedScore += result.score * criteria.weight
        totalWeight += criteria.weight
      }

      const overallScore = totalWeightedScore / totalWeight
      const categoryScores = this.calculateCategoryScores(evaluationResults)
      
      // Generate insights and recommendations
      const insights = await this.generateInsights(useCaseData, evaluationResults)
      const recommendations = await this.generateRecommendations(useCaseData, evaluationResults, insights)
      const riskAssessment = await this.assessRisks(useCaseData, evaluationResults)
      
      // Calculate derived scores
      const feasibilityScore = this.calculateFeasibilityScore(evaluationResults)
      const priorityScore = this.calculatePriorityScore(useCaseData, evaluationResults)
      const estimatedROI = this.calculateEstimatedROI(useCaseData, evaluationResults)
      const confidenceLevel = this.calculateConfidenceLevel(evaluationResults)

      const evaluation: UseCaseEvaluation = {
        useCaseId: useCaseData.id,
        overallScore,
        categoryScores,
        results: evaluationResults,
        insights,
        recommendations,
        riskAssessment,
        feasibilityScore,
        priorityScore,
        estimatedROI,
        confidenceLevel,
        evaluationDate: new Date(),
      }

      this.evaluationHistory.push(evaluation)
      return evaluation

    } catch (error) {
      console.error('Evaluation failed:', error)
      throw new Error('Failed to evaluate use case')
    }
  }

  private async evaluateCriteria(criteria: EvaluationCriteria, useCaseData: any): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(criteria, useCaseData)
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI evaluation expert. Analyze the provided use case data against the specific criteria and provide a detailed evaluation.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const content = response.choices[0]?.message?.content || ''
      return this.parseEvaluationResponse(content, criteria)

    } catch (error) {
      console.error(`Evaluation failed for criteria ${criteria.id}:`, error)
      return {
        criteriaId: criteria.id,
        score: 5, // Default middle score
        reasoning: 'Evaluation failed due to technical error',
        confidence: 0.5,
        recommendations: ['Manual review recommended'],
        risks: ['Evaluation error occurred'],
        opportunities: [],
      }
    }
  }

  private buildEvaluationPrompt(criteria: EvaluationCriteria, useCaseData: any): string {
    return `
Evaluate the following use case against the criteria: "${criteria.name}"

Criteria Description: ${criteria.description}
Score Range: ${criteria.minScore} - ${criteria.maxScore}

Use Case Data:
- Title: ${useCaseData.title}
- Problem Statement: ${useCaseData.problemStatement}
- Proposed Solution: ${useCaseData.proposedAISolution}
- Business Function: ${useCaseData.businessFunction}
- Stakeholders: ${useCaseData.primaryStakeholders?.join(', ')}
- Success Criteria: ${useCaseData.successCriteria}
- Timeline: ${useCaseData.estimatedTimeline}
- Resources: ${useCaseData.requiredResources}

Please provide your evaluation in the following JSON format:
{
  "score": <number between ${criteria.minScore} and ${criteria.maxScore}>,
  "reasoning": "<detailed explanation of the score>",
  "confidence": <number between 0 and 1>,
  "recommendations": ["<recommendation1>", "<recommendation2>"],
  "risks": ["<risk1>", "<risk2>"],
  "opportunities": ["<opportunity1>", "<opportunity2>"]
}
    `.trim()
  }

  private parseEvaluationResponse(content: string, criteria: EvaluationCriteria): EvaluationResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        criteriaId: criteria.id,
        score: Math.max(criteria.minScore, Math.min(criteria.maxScore, parsed.score || 5)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      }
    } catch (error) {
      console.error('Failed to parse evaluation response:', error)
      return {
        criteriaId: criteria.id,
        score: 5,
        reasoning: 'Failed to parse evaluation response',
        confidence: 0.3,
        recommendations: ['Manual review required'],
        risks: ['Parsing error occurred'],
        opportunities: [],
      }
    }
  }

  private calculateCategoryScores(results: EvaluationResult[]): Record<string, number> {
    const categoryScores: Record<string, number> = {}
    
    this.criteria.forEach(criteria => {
      const result = results.find(r => r.criteriaId === criteria.id)
      if (result) {
        if (!categoryScores[criteria.category]) {
          categoryScores[criteria.category] = 0
        }
        categoryScores[criteria.category] += result.score * criteria.weight
      }
    })

    return categoryScores
  }

  private async generateInsights(useCaseData: any, results: EvaluationResult[]): Promise<string[]> {
    const prompt = `
Based on the following use case evaluation results, generate 5-7 key insights:

Use Case: ${useCaseData.title}
Problem: ${useCaseData.problemStatement}
Solution: ${useCaseData.proposedAISolution}

Evaluation Results:
${results.map(r => `- ${r.criteriaId}: ${r.score}/10 - ${r.reasoning}`).join('\n')}

Provide insights that are:
1. Actionable and specific
2. Based on the evaluation data
3. Focused on opportunities and risks
4. Relevant to the business context

Format as a simple list of insights.
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
      console.error('Failed to generate insights:', error)
      return ['Manual review recommended for insights generation']
    }
  }

  private async generateRecommendations(
    useCaseData: any, 
    results: EvaluationResult[], 
    insights: string[]
  ): Promise<string[]> {
    const prompt = `
Based on the use case evaluation and insights, generate 5-7 specific, actionable recommendations:

Use Case: ${useCaseData.title}
Insights: ${insights.join(', ')}

Evaluation Results:
${results.map(r => `- ${r.criteriaId}: ${r.score}/10`).join('\n')}

Focus on:
1. Implementation improvements
2. Risk mitigation strategies
3. Optimization opportunities
4. Compliance considerations
5. Resource allocation

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
      return ['Manual review recommended for recommendations generation']
    }
  }

  private async assessRisks(useCaseData: any, results: EvaluationResult[]): Promise<RiskAssessment> {
    const riskResults = results.filter(r => r.risks.length > 0)
    const allRisks = riskResults.flatMap(r => r.risks)
    
    // Analyze risk levels based on scores
    const lowScoreCriteria = results.filter(r => r.score <= 4)
    const mediumScoreCriteria = results.filter(r => r.score > 4 && r.score <= 6)
    const highScoreCriteria = results.filter(r => r.score > 6 && r.score <= 8)
    const criticalScoreCriteria = results.filter(r => r.score > 8)

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (criticalScoreCriteria.length > 0) overallRisk = 'critical'
    else if (highScoreCriteria.length > 2) overallRisk = 'high'
    else if (mediumScoreCriteria.length > 3) overallRisk = 'medium'

    return {
      overallRisk,
      riskFactors: allRisks.map(risk => ({
        factor: risk,
        level: overallRisk,
        impact: 'To be assessed',
        mitigation: 'To be developed',
      })),
      complianceRisks: results.filter(r => r.criteriaId.includes('compliance')).flatMap(r => r.risks),
      technicalRisks: results.filter(r => r.criteriaId.includes('technical')).flatMap(r => r.risks),
      businessRisks: results.filter(r => r.criteriaId.includes('business')).flatMap(r => r.risks),
    }
  }

  private calculateFeasibilityScore(results: EvaluationResult[]): number {
    const technicalResults = results.filter(r => 
      this.criteria.find(c => c.id === r.criteriaId)?.category === 'technical'
    )
    
    if (technicalResults.length === 0) return 5
    
    const avgScore = technicalResults.reduce((sum, r) => sum + r.score, 0) / technicalResults.length
    return Math.round(avgScore * 10) / 10
  }

  private calculatePriorityScore(useCaseData: any, results: EvaluationResult[]): number {
    const businessResults = results.filter(r => 
      this.criteria.find(c => c.id === r.criteriaId)?.category === 'business'
    )
    
    if (businessResults.length === 0) return 5
    
    const businessScore = businessResults.reduce((sum, r) => sum + r.score, 0) / businessResults.length
    
    // Adjust based on additional factors
    let priorityScore = businessScore
    
    // Higher priority for shorter timelines
    if (useCaseData.estimatedTimeline && useCaseData.estimatedTimeline.includes('1-3')) {
      priorityScore += 1
    }
    
    // Higher priority for more stakeholders
    if (useCaseData.primaryStakeholders && useCaseData.primaryStakeholders.length > 3) {
      priorityScore += 0.5
    }
    
    return Math.min(10, Math.max(1, priorityScore))
  }

  private calculateEstimatedROI(useCaseData: any, results: EvaluationResult[]): number {
    // Simple ROI calculation based on business value and implementation complexity
    const businessValue = results.find(r => r.criteriaId === 'business_value')?.score || 5
    const implementationRisk = results.find(r => r.criteriaId === 'implementation_risk')?.score || 5
    
    // ROI = Business Value / Implementation Risk * 100
    const roi = (businessValue / implementationRisk) * 100
    return Math.round(roi)
  }

  private calculateConfidenceLevel(results: EvaluationResult[]): number {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    return Math.round(avgConfidence * 100) / 100
  }

  // Generate intelligent recommendations
  async generateIntelligentRecommendations(useCaseData: any): Promise<IntelligentRecommendation[]> {
    const prompt = `
Based on the following use case, generate 5-7 intelligent recommendations:

Use Case: ${useCaseData.title}
Problem: ${useCaseData.problemStatement}
Solution: ${useCaseData.proposedAISolution}
Business Function: ${useCaseData.businessFunction}
Stakeholders: ${useCaseData.primaryStakeholders?.join(', ')}
Timeline: ${useCaseData.estimatedTimeline}
Resources: ${useCaseData.requiredResources}

Generate recommendations that are:
1. Specific and actionable
2. Based on AI/ML best practices
3. Consider implementation complexity
4. Address potential risks
5. Optimize for business value

For each recommendation, provide:
- Type (implementation, optimization, risk_mitigation, compliance, business)
- Title
- Description
- Rationale
- Impact (low, medium, high, critical)
- Effort (low, medium, high)
- Priority (1-10)
- Confidence (0-1)
- Dependencies
- Timeline
- Resources needed
- Expected outcome
- Success metrics

Format as JSON array.
    `.trim()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const content = response.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return []
    } catch (error) {
      console.error('Failed to generate intelligent recommendations:', error)
      return []
    }
  }

  // Get evaluation history
  getEvaluationHistory(): UseCaseEvaluation[] {
    return [...this.evaluationHistory]
  }

  // Get criteria
  getCriteria(): EvaluationCriteria[] {
    return [...this.criteria]
  }

  // Compare evaluations
  compareEvaluations(evaluation1: UseCaseEvaluation, evaluation2: UseCaseEvaluation): any {
    return {
      scoreDifference: evaluation1.overallScore - evaluation2.overallScore,
      categoryDifferences: Object.keys(evaluation1.categoryScores).map(category => ({
        category,
        difference: evaluation1.categoryScores[category] - evaluation2.categoryScores[category]
      })),
      riskComparison: {
        evaluation1: evaluation1.riskAssessment.overallRisk,
        evaluation2: evaluation2.riskAssessment.overallRisk
      }
    }
  }
}

// Global evaluation engine instance
export const evaluationEngine = new EnhancedEvaluationEngine()

export default evaluationEngine


