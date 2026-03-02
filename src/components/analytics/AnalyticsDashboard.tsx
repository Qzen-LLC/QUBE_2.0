import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedModal, EnhancedModalContent } from '@/components/ui/enhanced-modal'
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield,
  Zap,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Share,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Award,
  MessageCircle,
  FileText,
  Database,
  Cpu,
  Globe
} from 'lucide-react'
import { analyticsEngine, AnalyticsMetrics, AnalyticsReport, AnalyticsQuery } from '@/lib/analytics/analytics-engine'
import { ExecutiveDashboard } from './ExecutiveDashboard'

export interface AnalyticsDashboardProps {
  organizationId: string
  currentUserId: string
  onReportGenerate?: (report: AnalyticsReport) => void
  onExportReport?: (report: AnalyticsReport, format: string) => void
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  organizationId,
  currentUserId,
  onReportGenerate,
  onExportReport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'executive' | 'operational' | 'compliance' | 'performance' | 'custom'>('overview')
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<AnalyticsReport | null>(null)
  const [reportType, setReportType] = useState<AnalyticsReport['type']>('operational')

  useEffect(() => {
    if (activeTab !== 'executive') {
      loadMetrics()
    }
  }, [organizationId, timeRange, activeTab])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      const query: AnalyticsQuery = {
        startDate,
        endDate,
        organizationId,
        userId: currentUserId,
      }

      const currentMetrics = await analyticsEngine.getMetrics(query)
      setMetrics(currentMetrics)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!metrics) return

    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      const query: AnalyticsQuery = {
        startDate,
        endDate,
        organizationId,
        userId: currentUserId,
      }

      const report = await analyticsEngine.generateReport(query, reportType)
      setGeneratedReport(report)
      setShowReportModal(true)
      onReportGenerate?.(report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    }
  }

  const exportReport = async (format: 'json' | 'csv' | 'pdf') => {
    if (!generatedReport) return

    try {
      const exportedData = await analyticsEngine.exportReport(generatedReport, format)
      
      // Create download link
      const blob = new Blob([exportedData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onExportReport?.(generatedReport, format)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report')
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'executive', label: 'Executive', icon: Award },
    { id: 'operational', label: 'Operational', icon: Activity },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'custom', label: 'Custom', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <EnhancedButton onClick={loadMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </EnhancedButton>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting for your organization
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <EnhancedButton onClick={loadMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </EnhancedButton>
          
          <EnhancedButton onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </EnhancedButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <EnhancedButton
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1"
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </EnhancedButton>
          )
        })}
      </div>

      {/* Executive Tab */}
      {activeTab === 'executive' && (
        <ExecutiveDashboard
          organizationId={organizationId}
          currentUserId={currentUserId}
          onReportGenerate={onReportGenerate}
          onExportReport={onExportReport}
        />
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(metrics.totalUseCases)}</p>
                    <p className="text-sm text-muted-foreground">Total Use Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(metrics.activeUsers)}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatPercentage(metrics.complianceScore)}</p>
                    <p className="text-sm text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.costSavings)}</p>
                    <p className="text-sm text-muted-foreground">Cost Savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Use Cases by Stage
                </CardTitle>
                <CardDescription>
                  Distribution of use cases across different stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.useCasesByStage).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          stage === 'planning' ? 'bg-blue-500' :
                          stage === 'development' ? 'bg-yellow-500' :
                          stage === 'testing' ? 'bg-orange-500' :
                          stage === 'production' ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm capitalize">{stage}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Assessments by Framework
                </CardTitle>
                <CardDescription>
                  Compliance assessments across different frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.assessmentsByFramework).map(([framework, count]) => (
                    <div key={framework} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          framework === 'EU_AI_ACT' ? 'bg-blue-500' :
                          framework === 'ISO_42001' ? 'bg-green-500' :
                          framework === 'GDPR' ? 'bg-purple-500' :
                          framework === 'HIPAA' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm">{framework.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Operational Tab */}
      {activeTab === 'operational' && metrics && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Operational Metrics
              </CardTitle>
              <CardDescription>
                Detailed operational performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Avg Completion Time</h3>
                  <p className="text-2xl font-bold text-blue-600">{metrics.averageCompletionTime.toFixed(1)}h</p>
                  <p className="text-sm text-muted-foreground">Assessment completion</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Completion Rate</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage((metrics.completedAssessments / metrics.totalAssessments) * 100)}
                  </p>
                  <p className="text-sm text-muted-foreground">Assessments completed</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1">User Engagement</h3>
                  <p className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.userEngagement)}</p>
                  <p className="text-sm text-muted-foreground">Platform activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && metrics && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Overview
              </CardTitle>
              <CardDescription>
                Compliance status and risk assessment metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Compliance Score</h3>
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(metrics.complianceScore)}</p>
                  <p className="text-sm text-muted-foreground">Overall compliance</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Risk Mitigation</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.riskMitigationRate)}</p>
                  <p className="text-sm text-muted-foreground">Risk reduction</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Audit Completeness</h3>
                  <p className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.auditTrailCompleteness)}</p>
                  <p className="text-sm text-muted-foreground">Documentation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && metrics && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                System Performance
              </CardTitle>
              <CardDescription>
                Technical performance and system health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Response Time</h3>
                  <p className="text-2xl font-bold text-green-600">{metrics.averageResponseTime}s</p>
                  <p className="text-sm text-muted-foreground">Average response</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">System Uptime</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.systemUptime)}</p>
                  <p className="text-sm text-muted-foreground">Availability</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Error Rate</h3>
                  <p className="text-2xl font-bold text-red-600">{formatPercentage(metrics.errorRate)}</p>
                  <p className="text-sm text-muted-foreground">System errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Custom Analytics
              </CardTitle>
              <CardDescription>
                Create custom reports and analytics views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Custom Analytics</h3>
                <p className="mb-4">
                  Create custom reports, dashboards, and analytics views tailored to your specific needs.
                </p>
                <EnhancedButton>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Custom Views
                </EnhancedButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      <EnhancedModal
        open={showReportModal}
        onOpenChange={(open) => setShowReportModal(open)}
      >
        <EnhancedModalContent
          title="Analytics Report"
          variant="info"
          size="lg"
          onClose={() => setShowReportModal(false)}
        >
          {generatedReport && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{generatedReport.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Generated on {generatedReport.generatedAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <EnhancedButton
                  variant="outline"
                  onClick={() => exportReport('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </EnhancedButton>
                <EnhancedButton
                  variant="outline"
                  onClick={() => exportReport('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </EnhancedButton>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Key Insights</h4>
                <ul className="space-y-1">
                  {generatedReport.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {generatedReport.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        </EnhancedModalContent>
      </EnhancedModal>
    </div>
  )
}

export default AnalyticsDashboard


