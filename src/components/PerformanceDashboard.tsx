import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedProgress } from '@/components/ui/enhanced-progress'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { usePerformanceMonitor } from '@/lib/performance-monitor'
import { useBundleAnalysis } from '@/lib/bundle-analyzer'
import { 
  Activity, 
  Zap, 
  Gauge, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  BarChart3
} from 'lucide-react'

export const PerformanceDashboard: React.FC = () => {
  const { metrics, score, grade, generateReport, sendToAnalytics } = usePerformanceMonitor()
  const { analysis, breakdown, impact, generateReport: generateBundleReport } = useBundleAnalysis()

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800'
      case 'B': return 'bg-yellow-100 text-yellow-800'
      case 'C': return 'bg-orange-100 text-orange-800'
      case 'D': return 'bg-red-100 text-red-800'
      case 'F': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and optimize your application performance</p>
        </div>
        <div className="flex gap-2">
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={() => sendToAnalytics()}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </EnhancedButton>
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

      {/* Performance Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{score}/100</div>
            <div className="flex items-center gap-2 mt-2">
              <EnhancedBadge className={getGradeColor(grade)}>
                Grade: {grade}
              </EnhancedBadge>
            </div>
            <EnhancedProgress 
              value={score} 
              className="mt-4"
              variant={score >= 90 ? "success" : score >= 70 ? "warning" : "destructive"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Impact</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{impact}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bundle size impact on performance
            </p>
            <EnhancedProgress 
              value={impact} 
              className="mt-4"
              variant={impact >= 90 ? "success" : impact >= 70 ? "warning" : "destructive"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bundle Size</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis ? formatBytes(analysis.totalSize) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analysis?.bundleCount || 0} bundles loaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>Key performance metrics for user experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">LCP</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics.lcp ? formatTime(metrics.lcp) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Largest Contentful Paint
              </div>
              {metrics.lcp && (
                <EnhancedBadge 
                  variant={metrics.lcp < 2500 ? "success" : metrics.lcp < 4000 ? "warning" : "destructive"}
                >
                  {metrics.lcp < 2500 ? "Good" : metrics.lcp < 4000 ? "Needs Improvement" : "Poor"}
                </EnhancedBadge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">FID</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics.fid ? formatTime(metrics.fid) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                First Input Delay
              </div>
              {metrics.fid && (
                <EnhancedBadge 
                  variant={metrics.fid < 100 ? "success" : metrics.fid < 300 ? "warning" : "destructive"}
                >
                  {metrics.fid < 100 ? "Good" : metrics.fid < 300 ? "Needs Improvement" : "Poor"}
                </EnhancedBadge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">CLS</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Cumulative Layout Shift
              </div>
              {metrics.cls && (
                <EnhancedBadge 
                  variant={metrics.cls < 0.1 ? "success" : metrics.cls < 0.25 ? "warning" : "destructive"}
                >
                  {metrics.cls < 0.1 ? "Good" : metrics.cls < 0.25 ? "Needs Improvement" : "Poor"}
                </EnhancedBadge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">FCP</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics.fcp ? formatTime(metrics.fcp) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                First Contentful Paint
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">TTFB</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics.ttfb ? formatTime(metrics.ttfb) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Time to First Byte
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bundle Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Bundle Analysis</CardTitle>
            <CardDescription>Detailed breakdown of your application bundles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Size Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-3">Size Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {formatBytes(breakdown?.js || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">JavaScript</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {formatBytes(breakdown?.css || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">CSS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {formatBytes(breakdown?.images || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">
                      {formatBytes(breakdown?.fonts || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Fonts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600">
                      {formatBytes(breakdown?.other || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Other</div>
                  </div>
                </div>
              </div>

              {/* Largest Bundles */}
              <div>
                <h4 className="text-sm font-medium mb-3">Largest Bundles</h4>
                <div className="space-y-2">
                  {analysis.largestBundles.slice(0, 5).map((bundle, index) => (
                    <div key={bundle.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{bundle.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {bundle.modules.length} modules
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatBytes(bundle.size)}</div>
                        <div className="text-sm text-muted-foreground">
                          {((bundle.size / analysis.totalSize) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues and Recommendations */}
              <div>
                <h4 className="text-sm font-medium mb-3">Issues & Recommendations</h4>
                <div className="space-y-3">
                  {analysis.duplicateModules.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-200">
                          Duplicate Modules Found
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          {analysis.duplicateModules.length} duplicate modules detected
                        </div>
                      </div>
                    </div>
                  )}

                  {analysis.unusedModules.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-800 dark:text-red-200">
                          Unused Modules Detected
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {analysis.unusedModules.length} potentially unused modules
                        </div>
                      </div>
                    </div>
                  )}

                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        {recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Load Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Page Load Metrics</CardTitle>
          <CardDescription>Detailed timing information for page loading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Page Load Time</div>
              <div className="text-lg font-semibold">
                {metrics.pageLoadTime ? formatTime(metrics.pageLoadTime) : 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">DOM Content Loaded</div>
              <div className="text-lg font-semibold">
                {metrics.domContentLoaded ? formatTime(metrics.domContentLoaded) : 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">DOM Interactive</div>
              <div className="text-lg font-semibold">
                {metrics.domInteractive ? formatTime(metrics.domInteractive) : 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Memory Usage</div>
              <div className="text-lg font-semibold">
                {metrics.memoryUsage ? `${(metrics.memoryUsage * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceDashboard


