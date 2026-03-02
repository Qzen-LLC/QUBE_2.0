'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Eye,
  Zap,
  Gauge,
  Target,
  Clock
} from 'lucide-react';
import { GovernanceInsight, GovernanceAnalysis, ComplianceStatus } from '@/lib/ai-agents/governance-agent';

interface AIInsightsProps {
  useCaseId?: string;
}

export default function GovernanceAIInsightsPage({ useCaseId }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<GovernanceAnalysis | null>(null);
  const [complianceStatuses, setComplianceStatuses] = useState<ComplianceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<GovernanceInsight | null>(null);
  const [portfolioMode, setPortfolioMode] = useState(!useCaseId);

  useEffect(() => {
    if (useCaseId) {
      fetchUseCaseAnalysis(useCaseId);
      fetchComplianceStatus(useCaseId);
    } else {
      fetchPortfolioAnalysis();
    }
  }, [useCaseId]);

  const fetchUseCaseAnalysis = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-agents/governance-analysis?useCaseId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch governance analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-agents/governance-analysis?useCaseId=${id}&complianceStatus=true`);
      if (response.ok) {
        const data = await response.json();
        setComplianceStatuses(data);
      }
    } catch (err) {
      console.error('Error fetching compliance status:', err);
    }
  };

  const fetchPortfolioAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-agents/governance-analysis?portfolio=true');
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
      fetchComplianceStatus(useCaseId);
    } else {
      fetchPortfolioAnalysis();
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'compliance_alert':
        return <AlertTriangle className="h-5 w-5" />;
      case 'risk_assessment':
        return <Shield className="h-5 w-5" />;
      case 'framework_gap':
        return <FileText className="h-5 w-5" />;
      case 'best_practice':
        return <CheckCircle className="h-5 w-5" />;
      case 'regulatory_update':
        return <Users className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'compliance_alert':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'risk_assessment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'framework_gap':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'best_practice':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'regulatory_update':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'partially_compliant':
        return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Analyzing governance data with AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analysis data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {portfolioMode ? 'Portfolio Governance AI Insights' : 'AI Governance Analysis'}
              </h1>
              <p className="text-gray-600 mt-2">
                Intelligent governance analysis and compliance monitoring powered by AI
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(analysis.complianceScore * 100).toFixed(0)}%
              </div>
              <Progress value={analysis.complianceScore * 100} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">
                {analysis.complianceScore > 0.8 ? 'Excellent' : analysis.complianceScore > 0.6 ? 'Good' : 'Needs Attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analysis.riskScore.toFixed(0)}%</div>
              <Progress value={analysis.riskScore} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">
                {analysis.riskScore > 70 ? 'High Risk' : analysis.riskScore > 40 ? 'Medium Risk' : 'Low Risk'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Framework Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(analysis.frameworkCoverage * 100).toFixed(0)}%
              </div>
              <Progress value={analysis.frameworkCoverage * 100} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">Coverage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{analysis.insights.length}</div>
              <p className="text-xs text-gray-500 mt-1">AI Generated</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{analysis.summary}</p>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        {complianceStatuses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gauge className="h-5 w-5 mr-2 text-blue-600" />
                Framework Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complianceStatuses.map((status, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{status.framework}</h4>
                      <Badge className={getComplianceStatusColor(status.status)}>
                        {status.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Score:</span>
                        <span className="font-semibold">{(status.overallScore * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Requirements:</span>
                        <span>{status.requirements.completed}/{status.requirements.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Critical:</span>
                        <span className="text-red-600">{status.requirements.critical}</span>
                      </div>
                    </div>

                    {status.gaps.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Key Gaps:</h5>
                        <ul className="space-y-1">
                          {status.gaps.slice(0, 3).map((gap, gapIndex) => (
                            <li key={gapIndex} className="text-xs text-red-600 flex items-start">
                              <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              AI Insights
            </h2>
            <div className="space-y-4">
              {analysis.insights.map((insight, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedInsight === insight ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{insight.title}</CardTitle>
                          <CardDescription className="text-xs">
                            Confidence: {(insight.confidence * 100).toFixed(0)}%
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Priority: {insight.priority}</span>
                      <span>Type: {insight.type.replace('_', ' ')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Next Steps
            </h2>
            <div className="space-y-4">
              {analysis.nextSteps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-4 mt-8 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Recommendations
            </h2>
            <div className="space-y-4">
              {analysis.recommendations.map((recommendation, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Insight View */}
        {selectedInsight && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  {getInsightIcon(selectedInsight.type)}
                  <span className="ml-2">{selectedInsight.title}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInsight(null)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700 mb-4">{selectedInsight.description}</p>
                  
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {selectedInsight.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Metrics</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedInsight.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-sm font-semibold">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Impact:</span>
                      <Badge className={getImpactColor(selectedInsight.impact)}>
                        {selectedInsight.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Confidence:</span>
                      <span className="text-sm font-semibold">
                        {(selectedInsight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Priority:</span>
                      <span className="text-sm font-semibold">{selectedInsight.priority}</span>
                    </div>
                    {selectedInsight.framework && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Framework:</span>
                        <span className="text-sm font-semibold">{selectedInsight.framework}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
