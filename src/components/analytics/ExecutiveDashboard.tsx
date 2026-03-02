import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedModal, EnhancedModalContent } from '@/components/ui/enhanced-modal'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  Share,
  Settings,
  Activity,
  Shield,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import { analyticsEngine, AnalyticsMetrics, AnalyticsReport, AnalyticsQuery } from '@/lib/analytics/analytics-engine'

export interface ExecutiveDashboardProps {
  organizationId: string
  currentUserId: string
  onReportGenerate?: (report: AnalyticsReport) => void
  onExportReport?: (report: AnalyticsReport, format: string) => void
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  organizationId,
  currentUserId,
  onReportGenerate,
  onExportReport,
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<AnalyticsReport | null>(null)
  const [comparisonMetrics, setComparisonMetrics] = useState<AnalyticsMetrics | null>(null)

  useEffect(() => {
    loadMetrics()
  }, [organizationId, timeRange])

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

      // Load comparison metrics (previous period)
      const comparisonStartDate = new Date(startDate)
      const comparisonEndDate = new Date(startDate)
      
      switch (timeRange) {
        case '7d':
          comparisonStartDate.setDate(comparisonStartDate.getDate() - 7)
          break
        case '30d':
          comparisonStartDate.setDate(comparisonStartDate.getDate() - 30)
          break
        case '90d':
          comparisonStartDate.setDate(comparisonStartDate.getDate() - 90)
          break
        case '1y':
          comparisonStartDate.setFullYear(comparisonStartDate.getFullYear() - 1)
          break
      }

      const comparisonQuery: AnalyticsQuery = {
        ...query,
        startDate: comparisonStartDate,
        endDate: comparisonEndDate,
      }

      const comparison = await analyticsEngine.getMetrics(comparisonQuery)
      setComparisonMetrics(comparison)

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

      const report = await analyticsEngine.generateReport(query, 'executive')
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
      a.download = `executive-report-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onExportReport?.(generatedReport, format)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report')
    }
  }

  const calculateChange = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { value: 0, direction: 'neutral' }
    
    const change = ((current - previous) / previous) * 100
    
    if (change > 0) return { value: Math.abs(change), direction: 'up' }
    if (change < 0) return { value: Math.abs(change), direction: 'down' }
    return { value: 0, direction: 'neutral' }
  }

  const getChangeIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'neutral': return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading executive dashboard...</p>
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

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground">No metrics found for the selected time period.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Executive Dashboard</h2>
          <p className="text-muted-foreground">
            High-level overview of key performance indicators and business metrics
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Use Cases</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalUseCases)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(metrics.totalUseCases, comparisonMetrics.totalUseCases).direction)}
                    <span className={`text-sm ${getChangeColor(calculateChange(metrics.totalUseCases, comparisonMetrics.totalUseCases).direction)}`}>
                      {formatPercentage(calculateChange(metrics.totalUseCases, comparisonMetrics.totalUseCases).value)}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.activeUsers)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(metrics.activeUsers, comparisonMetrics.activeUsers).direction)}
                    <span className={`text-sm ${getChangeColor(calculateChange(metrics.activeUsers, comparisonMetrics.activeUsers).direction)}`}>
                      {formatPercentage(calculateChange(metrics.activeUsers, comparisonMetrics.activeUsers).value)}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{formatPercentage(metrics.complianceScore)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(metrics.complianceScore, comparisonMetrics.complianceScore).direction)}
                    <span className={`text-sm ${getChangeColor(calculateChange(metrics.complianceScore, comparisonMetrics.complianceScore).direction)}`}>
                      {formatPercentage(calculateChange(metrics.complianceScore, comparisonMetrics.complianceScore).value)}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.costSavings)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(metrics.costSavings, comparisonMetrics.costSavings).direction)}
                    <span className={`text-sm ${getChangeColor(calculateChange(metrics.costSavings, comparisonMetrics.costSavings).direction)}`}>
                      {formatPercentage(calculateChange(metrics.costSavings, comparisonMetrics.costSavings).value)}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Overview
            </CardTitle>
            <CardDescription>
              Key activity metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.completedUseCases / metrics.totalUseCases) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {formatPercentage((metrics.completedUseCases / metrics.totalUseCases) * 100)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">User Engagement</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${metrics.userEngagement}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {formatPercentage(metrics.userEngagement)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">System Uptime</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${metrics.systemUptime}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {formatPercentage(metrics.systemUptime)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Risk Distribution
            </CardTitle>
            <CardDescription>
              Use cases by risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.useCasesByRisk).map(([risk, count]) => (
                <div key={risk} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${
                      risk === 'high' ? 'bg-red-500' :
                      risk === 'medium' ? 'bg-yellow-500' :
                      risk === 'low' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm capitalize">{risk} Risk</span>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Business Impact
          </CardTitle>
          <CardDescription>
            Key business metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Time to Market</h3>
              <p className="text-2xl font-bold text-green-600">{metrics.timeToMarket} months</p>
              <p className="text-sm text-muted-foreground">Average project completion</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Stakeholder Satisfaction</h3>
              <p className="text-2xl font-bold text-blue-600">{metrics.stakeholderSatisfaction}/5</p>
              <p className="text-sm text-muted-foreground">Average rating</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1">Risk Mitigation</h3>
              <p className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.riskMitigationRate)}</p>
              <p className="text-sm text-muted-foreground">Success rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Modal */}
      <EnhancedModal
        open={showReportModal}
        onOpenChange={(open) => setShowReportModal(open)}
      >
        <EnhancedModalContent
          title="Executive Report"
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

export default ExecutiveDashboard


