'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Target,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Eye,
  Zap
} from 'lucide-react';
import { FinancialInsight, FinancialAnalysis } from '@/lib/ai-agents/financial-agent';

interface AIInsightsProps {
  useCaseId?: string;
}

export default function AIInsightsPage({ useCaseId }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<FinancialInsight | null>(null);
  const [portfolioMode, setPortfolioMode] = useState(!useCaseId);

  useEffect(() => {
    if (useCaseId) {
      fetchUseCaseAnalysis(useCaseId);
    } else {
      fetchPortfolioAnalysis();
    }
  }, [useCaseId]);

  const fetchUseCaseAnalysis = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-agents/financial-analysis?useCaseId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-agents/financial-analysis?portfolio=true');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (useCaseId) {
      fetchUseCaseAnalysis(useCaseId);
    } else {
      fetchPortfolioAnalysis();
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cost_optimization':
        return <DollarSign className="h-5 w-5" />;
      case 'roi_improvement':
        return <TrendingUp className="h-5 w-5" />;
      case 'risk_alert':
        return <AlertTriangle className="h-5 w-5" />;
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      case 'trend_analysis':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'cost_optimization':
        return 'bg-primary/20 text-primary border-primary/30 dark:bg-primary/30 dark:text-primary-foreground dark:border-primary/40';
      case 'roi_improvement':
        return 'bg-success/20 text-success border-success/30 dark:bg-success/30 dark:text-success-foreground dark:border-success/40';
      case 'risk_alert':
        return 'bg-destructive/20 text-destructive border-destructive/30 dark:bg-destructive/30 dark:text-destructive-foreground dark:border-destructive/40';
      case 'opportunity':
        return 'bg-warning/20 text-warning border-warning/30 dark:bg-warning/30 dark:text-warning-foreground dark:border-warning/40';
      case 'trend_analysis':
        return 'bg-accent/20 text-accent-foreground border-accent/30 dark:bg-accent/30 dark:text-accent-foreground dark:border-accent/40';
      default:
        return 'bg-muted text-muted-foreground border-border dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive/30 dark:bg-destructive/30 dark:text-destructive-foreground dark:border-destructive/40';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30 dark:bg-warning/30 dark:text-warning-foreground dark:border-warning/40';
      case 'low':
        return 'bg-success/20 text-success border-success/30 dark:bg-success/30 dark:text-success-foreground dark:border-success/40';
      default:
        return 'bg-muted text-muted-foreground border-border dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success/20 text-success dark:bg-success/30 dark:text-success-foreground';
    if (confidence >= 60) return 'bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning-foreground';
    return 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive-foreground';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary dark:text-primary-foreground" />
        <p className="text-muted-foreground dark:text-gray-400">Analyzing financial data with AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <AlertTriangle className="h-8 w-8 text-destructive dark:text-red-400 mx-auto mb-4" />
        <p className="text-destructive dark:text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <p className="text-muted-foreground dark:text-gray-400">No analysis data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            {useCaseId ? `AI Insights - ${analysis.useCaseTitle || 'Use Case'}` : 'Portfolio AI Insights'}
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">
            AI-powered financial analysis and recommendations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive dark:text-red-400">{analysis.riskScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">Risk Level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Opportunity Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success dark:text-green-400">{analysis.opportunityScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">Growth Potential</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Cost Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary dark:text-primary-foreground">{analysis.costOptimizationPotential.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">Potential Savings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground dark:text-accent-foreground">{analysis.insights.length}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">AI Generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground dark:text-white">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground dark:text-gray-300">{analysis.summary}</p>
          </CardContent>
        </Card>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {analysis.insights.map((insight, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setSelectedInsight(insight)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium text-foreground dark:text-white">{insight.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">
                      {insight.type.replace('_', ' ').toUpperCase()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">{insight.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-500">
                  <span>Priority: {insight.priority}</span>
                  <span>Confidence: {insight.confidence}%</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(insight.impact)}`}>
                    {insight.priority}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground dark:text-white">Key Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted dark:bg-gray-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground dark:text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insight Detail Modal */}
        {selectedInsight && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground dark:text-white">{selectedInsight.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInsight(null)}
                    className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-foreground dark:text-gray-300">{selectedInsight.description}</p>
                  
                  {selectedInsight.recommendations && selectedInsight.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground dark:text-white mb-2">Recommendations:</h4>
                      <ul className="space-y-2">
                        {selectedInsight.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-sm text-foreground dark:text-gray-300">• {rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border dark:border-gray-700">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground dark:text-gray-400 capitalize">
                        Type:
                      </span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${getInsightColor(selectedInsight.type)}`}>
                        {selectedInsight.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Impact:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${getPriorityColor(selectedInsight.impact)}`}>
                        {selectedInsight.impact}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">Confidence:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${getConfidenceColor(selectedInsight.confidence)}`}>
                        {selectedInsight.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
