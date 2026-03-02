import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedProgress } from '@/components/ui/enhanced-progress'
import { EnhancedModal } from '@/components/ui/enhanced-modal'
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { evaluationEngine } from '@/lib/ai/enhanced-evaluation-engine'
import { insightsGenerator } from '@/lib/ai/insights-generator'
import { recommendationEngine } from '@/lib/ai/recommendation-engine'

export const AIInsightsDashboard: React.FC = () => {
  const [selectedUseCase, setSelectedUseCase] = useState<any>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'evaluation' | 'insights' | 'recommendations'>('evaluation')
  const [showDetails, setShowDetails] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Mock use cases data
  const useCases = [
    {
      id: '1',
      title: 'AI-Powered Customer Service Chatbot',
      problemStatement: 'High volume of customer inquiries overwhelming support team',
      proposedAISolution: 'Implement intelligent chatbot with natural language processing',
      businessFunction: 'Customer Service',
      primaryStakeholders: ['Customer Service', 'IT', 'Management'],
      successCriteria: 'Reduce response time by 70%, improve customer satisfaction',
      estimatedTimeline: '3-6 months',
      requiredResources: 'AI/ML team, chatbot platform, training data',
      initialCost: '$150,000',
      initialROI: '250%',
    },
    {
      id: '2',
      title: 'Predictive Maintenance System',
      problemStatement: 'Unexpected equipment failures causing production delays',
      proposedAISolution: 'Machine learning model to predict equipment failures',
      businessFunction: 'Manufacturing',
      primaryStakeholders: ['Operations', 'Maintenance', 'Data Science'],
      successCriteria: 'Reduce unplanned downtime by 40%',
      estimatedTimeline: '6-12 months',
      requiredResources: 'IoT sensors, ML engineers, cloud infrastructure',
      initialCost: '$300,000',
      initialROI: '180%',
    },
  ]

  const handleEvaluateUseCase = async (useCase: any) => {
    setSelectedUseCase(useCase)
    setLoading(true)
    
    try {
      // Generate evaluation
      const evaluationResult = await evaluationEngine.evaluateUseCase(useCase)
      setEvaluation(evaluationResult)
      
      // Generate insights
      const insightsResult = await insightsGenerator.generateInsights(useCase, evaluationResult)
      setInsights(insightsResult)
      
      // Generate recommendations
      const recommendationsResult = await recommendationEngine.generateRecommendations({
        useCaseData: useCase,
        evaluationData: evaluationResult,
        insightsData: insightsResult,
      })
      setRecommendations(recommendationsResult)
      
      setActiveTab('evaluation')
    } catch (error) {
      console.error('Failed to evaluate use case:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800'
    if (priority >= 6) return 'bg-orange-100 text-orange-800'
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(0)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Insights Dashboard
          </h1>
          <p className="text-muted-foreground">Intelligent evaluation and recommendations for AI use cases</p>
        </div>
        <div className="flex gap-2">
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </EnhancedButton>
        </div>
      </div>

      {/* Use Case Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Use Case for AI Analysis</CardTitle>
          <CardDescription>Choose a use case to generate intelligent insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((useCase) => (
              <Card
                key={useCase.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedUseCase?.id === useCase.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleEvaluateUseCase(useCase)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                  <CardDescription>{useCase.businessFunction}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {useCase.problemStatement.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span>{useCase.estimatedTimeline}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ROI:</span>
                    <span className="font-medium text-green-600">{useCase.initialROI}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Generating AI insights...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {selectedUseCase && !loading && (evaluation || insights || recommendations) && (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'evaluation'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2 inline" />
              Evaluation
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lightbulb className="h-4 w-4 mr-2 inline" />
              Insights
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="h-4 w-4 mr-2 inline" />
              Recommendations
            </button>
          </div>

          {/* Evaluation Tab */}
          {activeTab === 'evaluation' && evaluation && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Evaluation Score</CardTitle>
                  <CardDescription>Comprehensive assessment of the use case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                      {evaluation.overallScore.toFixed(1)}
                    </div>
                    <div className="text-2xl text-muted-foreground">/ 10</div>
                    <EnhancedProgress 
                      value={evaluation.overallScore * 10} 
                      className="mt-4"
                      variant={evaluation.overallScore >= 8 ? "success" : evaluation.overallScore >= 6 ? "warning" : "destructive"}
                    />
                    <div className="mt-4 text-sm text-muted-foreground">
                      Confidence Level: {formatConfidence(evaluation.confidenceLevel)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Detailed scores by evaluation category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(evaluation.categoryScores).map(([category, score]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                          <span className={`font-bold ${getScoreColor(score as number)}`}>
                            {(score as number).toFixed(1)}/10
                          </span>
                        </div>
                        <EnhancedProgress 
                          value={(score as number) * 10}
                          variant={(score as number) >= 8 ? "success" : (score as number) >= 6 ? "warning" : "destructive"}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>Comprehensive risk analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Overall Risk Level:</span>
                      <EnhancedBadge className={getImpactColor(evaluation.riskAssessment.overallRisk)}>
                        {evaluation.riskAssessment.overallRisk.toUpperCase()}
                      </EnhancedBadge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Compliance Risks</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {evaluation.riskAssessment.complianceRisks.slice(0, 3).map((risk: string, index: number) => (
                            <li key={index}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Technical Risks</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {evaluation.riskAssessment.technicalRisks.slice(0, 3).map((risk: string, index: number) => (
                            <li key={index}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Business Risks</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {evaluation.riskAssessment.businessRisks.slice(0, 3).map((risk: string, index: number) => (
                            <li key={index}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Feasibility Score</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{evaluation.feasibilityScore.toFixed(1)}/10</div>
                    <p className="text-xs text-muted-foreground">Technical feasibility</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Priority Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{evaluation.priorityScore.toFixed(1)}/10</div>
                    <p className="text-xs text-muted-foreground">Business priority</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estimated ROI</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{evaluation.estimatedROI}%</div>
                    <p className="text-xs text-muted-foreground">Return on investment</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && insights && (
            <div className="space-y-6">
              {/* Insights Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Insights</CardTitle>
                  <CardDescription>Intelligent analysis and patterns identified</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{insights.summary.totalInsights}</div>
                      <div className="text-sm text-muted-foreground">Total Insights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{insights.summary.highImpactInsights}</div>
                      <div className="text-sm text-muted-foreground">High Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{insights.summary.actionableInsights}</div>
                      <div className="text-sm text-muted-foreground">Actionable</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatConfidence(insights.summary.averageConfidence)}</div>
                      <div className="text-sm text-muted-foreground">Avg Confidence</div>
                    </div>
                  </div>

                  {/* Top Categories */}
                  <div>
                    <h4 className="font-medium mb-3">Top Insight Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.summary.topCategories.map((category: string, index: number) => (
                        <EnhancedBadge key={index} variant="secondary">
                          {category.replace('_', ' ')}
                        </EnhancedBadge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights List */}
              <div className="space-y-4">
                {insights.insights.slice(0, 10).map((insight: any, index: number) => (
                  <Card key={insight.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <EnhancedBadge className={getImpactColor(insight.impact)}>
                              {insight.impact}
                            </EnhancedBadge>
                            <EnhancedBadge className={getPriorityColor(insight.priority)}>
                              Priority {insight.priority}
                            </EnhancedBadge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Confidence: {formatConfidence(insight.confidence)}</span>
                            <span>Category: {insight.category.replace('_', ' ')}</span>
                            <span>Actionable: {insight.actionable ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        <EnhancedButton
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedItem(insight)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </EnhancedButton>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && recommendations && (
            <div className="space-y-6">
              {/* Recommendations Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Intelligent Recommendations</CardTitle>
                  <CardDescription>AI-generated actionable recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{recommendations.summary.totalRecommendations}</div>
                      <div className="text-sm text-muted-foreground">Total Recommendations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{recommendations.summary.highPriorityRecommendations}</div>
                      <div className="text-sm text-muted-foreground">High Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{recommendations.summary.highImpactRecommendations}</div>
                      <div className="text-sm text-muted-foreground">High Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatConfidence(recommendations.summary.averageConfidence)}</div>
                      <div className="text-sm text-muted-foreground">Avg Confidence</div>
                    </div>
                  </div>

                  {/* Resource Requirements */}
                  <div>
                    <h4 className="font-medium mb-3">Resource Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.summary.resourceRequirements.map((resource: string, index: number) => (
                        <EnhancedBadge key={index} variant="outline">
                          {resource}
                        </EnhancedBadge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations List */}
              <div className="space-y-4">
                {recommendations.recommendations.slice(0, 10).map((rec: any, index: number) => (
                  <Card key={rec.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <EnhancedBadge variant="secondary">{rec.type}</EnhancedBadge>
                            <EnhancedBadge className={getImpactColor(rec.impact)}>
                              {rec.impact}
                            </EnhancedBadge>
                            <EnhancedBadge className={getPriorityColor(rec.priority)}>
                              Priority {rec.priority}
                            </EnhancedBadge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Effort: {rec.effort}</span>
                            <span>Confidence: {formatConfidence(rec.confidence)}</span>
                            <span>Timeline: {rec.timeline}</span>
                          </div>
                        </div>
                        <EnhancedButton
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedItem(rec)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </EnhancedButton>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      <EnhancedModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedItem?.title}
        description={selectedItem?.description}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Impact</h4>
                <EnhancedBadge className={getImpactColor(selectedItem.impact)}>
                  {selectedItem.impact}
                </EnhancedBadge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Priority</h4>
                <EnhancedBadge className={getPriorityColor(selectedItem.priority)}>
                  {selectedItem.priority}/10
                </EnhancedBadge>
              </div>
            </div>

            {selectedItem.rationale && (
              <div>
                <h4 className="font-medium mb-2">Rationale</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.rationale}</p>
              </div>
            )}

            {selectedItem.suggestions && selectedItem.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggestions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedItem.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.metrics && selectedItem.metrics.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Success Metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedItem.metrics.map((metric: string, index: number) => (
                    <li key={index}>• {metric}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.risks && selectedItem.risks.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Risks</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedItem.risks.map((risk: string, index: number) => (
                    <li key={index}>• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </EnhancedModal>
    </div>
  )
}

export default AIInsightsDashboard


