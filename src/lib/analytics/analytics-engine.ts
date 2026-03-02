import { prisma } from '@/lib/prisma'

export interface AnalyticsMetrics {
  // Use Case Metrics
  totalUseCases: number
  activeUseCases: number
  completedUseCases: number
  useCasesByStage: Record<string, number>
  useCasesByRisk: Record<string, number>
  useCasesByCategory: Record<string, number>
  
  // Assessment Metrics
  totalAssessments: number
  completedAssessments: number
  assessmentsByFramework: Record<string, number>
  averageCompletionTime: number
  
  // User Metrics
  totalUsers: number
  activeUsers: number
  usersByRole: Record<string, number>
  userEngagement: number
  
  // Performance Metrics
  averageResponseTime: number
  systemUptime: number
  errorRate: number
  
  // Compliance Metrics
  complianceScore: number
  riskMitigationRate: number
  auditTrailCompleteness: number
  
  // Business Metrics
  costSavings: number
  timeToMarket: number
  stakeholderSatisfaction: number
}

export interface TimeSeriesData {
  timestamp: Date
  value: number
  label?: string
  metadata?: Record<string, any>
}

export interface AnalyticsQuery {
  startDate: Date
  endDate: Date
  organizationId?: string
  userId?: string
  resourceType?: 'use_case' | 'assessment' | 'user' | 'system'
  metrics?: string[]
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  filters?: Record<string, any>
}

export interface AnalyticsReport {
  id: string
  title: string
  description: string
  type: 'executive' | 'operational' | 'compliance' | 'performance' | 'custom'
  metrics: AnalyticsMetrics
  timeSeriesData: TimeSeriesData[]
  insights: string[]
  recommendations: string[]
  generatedAt: Date
  generatedBy: string
  organizationId: string
  parameters: AnalyticsQuery
}

export class AnalyticsEngine {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async getMetrics(query: AnalyticsQuery): Promise<AnalyticsMetrics> {
    const cacheKey = `metrics_${JSON.stringify(query)}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const metrics = await this.calculateMetrics(query)
    this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() })
    
    return metrics
  }

  private async calculateMetrics(query: AnalyticsQuery): Promise<AnalyticsMetrics> {
    const { startDate, endDate, organizationId } = query

    // Use Case Metrics
    const useCases = await prisma.useCase.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(organizationId && { organizationId }),
      },
    })

    const totalUseCases = useCases.length
    const activeUseCases = useCases.filter(uc => uc.status === 'active').length
    const completedUseCases = useCases.filter(uc => uc.status === 'completed').length

    const useCasesByStage = useCases.reduce((acc, uc) => {
      acc[uc.stage] = (acc[uc.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const useCasesByRisk = useCases.reduce((acc, uc) => {
      const riskLevel = uc.riskLevel || 'unknown'
      acc[riskLevel] = (acc[riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const useCasesByCategory = useCases.reduce((acc, uc) => {
      const category = uc.category || 'other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Assessment Metrics
    const assessments = await prisma.assessment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(organizationId && { organizationId }),
      },
    })

    const totalAssessments = assessments.length
    const completedAssessments = assessments.filter(a => a.status === 'completed').length

    const assessmentsByFramework = assessments.reduce((acc, a) => {
      const framework = a.framework || 'unknown'
      acc[framework] = (acc[framework] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageCompletionTime = this.calculateAverageCompletionTime(assessments)

    // User Metrics
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(organizationId && { organizationId }),
      },
    })

    const totalUsers = users.length
    const activeUsers = users.filter(u => u.lastActiveAt && 
      new Date(u.lastActiveAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length

    const usersByRole = users.reduce((acc, u) => {
      const role = u.role || 'user'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const userEngagement = this.calculateUserEngagement(users, assessments, useCases)

    // Performance Metrics
    const performanceMetrics = await this.calculatePerformanceMetrics(query)

    // Compliance Metrics
    const complianceMetrics = await this.calculateComplianceMetrics(query)

    // Business Metrics
    const businessMetrics = await this.calculateBusinessMetrics(query)

    return {
      // Use Case Metrics
      totalUseCases,
      activeUseCases,
      completedUseCases,
      useCasesByStage,
      useCasesByRisk,
      useCasesByCategory,
      
      // Assessment Metrics
      totalAssessments,
      completedAssessments,
      assessmentsByFramework,
      averageCompletionTime,
      
      // User Metrics
      totalUsers,
      activeUsers,
      usersByRole,
      userEngagement,
      
      // Performance Metrics
      ...performanceMetrics,
      
      // Compliance Metrics
      ...complianceMetrics,
      
      // Business Metrics
      ...businessMetrics,
    }
  }

  private calculateAverageCompletionTime(assessments: any[]): number {
    const completedAssessments = assessments.filter(a => 
      a.status === 'completed' && a.completedAt && a.createdAt
    )
    
    if (completedAssessments.length === 0) return 0
    
    const totalTime = completedAssessments.reduce((sum, a) => {
      const start = new Date(a.createdAt)
      const end = new Date(a.completedAt)
      return sum + (end.getTime() - start.getTime())
    }, 0)
    
    return totalTime / completedAssessments.length / (1000 * 60 * 60) // hours
  }

  private calculateUserEngagement(users: any[], assessments: any[], useCases: any[]): number {
    if (users.length === 0) return 0
    
    const totalActivities = assessments.length + useCases.length
    const averageActivitiesPerUser = totalActivities / users.length
    
    // Normalize to percentage (assuming 10 activities per user is 100% engagement)
    return Math.min((averageActivitiesPerUser / 10) * 100, 100)
  }

  private async calculatePerformanceMetrics(query: AnalyticsQuery): Promise<Partial<AnalyticsMetrics>> {
    // Mock performance metrics - replace with actual monitoring data
    return {
      averageResponseTime: 1.2, // seconds
      systemUptime: 99.9, // percentage
      errorRate: 0.1, // percentage
    }
  }

  private async calculateComplianceMetrics(query: AnalyticsQuery): Promise<Partial<AnalyticsMetrics>> {
    const { startDate, endDate, organizationId } = query

    // Get compliance-related data
    const assessments = await prisma.assessment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(organizationId && { organizationId }),
        framework: { in: ['EU_AI_ACT', 'ISO_42001', 'GDPR', 'HIPAA'] },
      },
    })

    const totalAssessments = assessments.length
    const completedAssessments = assessments.filter(a => a.status === 'completed').length
    
    const complianceScore = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0
    
    // Calculate risk mitigation rate
    const riskMitigationRate = this.calculateRiskMitigationRate(assessments)
    
    // Calculate audit trail completeness
    const auditTrailCompleteness = this.calculateAuditTrailCompleteness(assessments)

    return {
      complianceScore,
      riskMitigationRate,
      auditTrailCompleteness,
    }
  }

  private calculateRiskMitigationRate(assessments: any[]): number {
    // Mock calculation - replace with actual risk assessment logic
    return 85.5
  }

  private calculateAuditTrailCompleteness(assessments: any[]): number {
    // Mock calculation - replace with actual audit trail logic
    return 92.3
  }

  private async calculateBusinessMetrics(query: AnalyticsQuery): Promise<Partial<AnalyticsMetrics>> {
    // Mock business metrics - replace with actual business calculations
    return {
      costSavings: 125000, // dollars
      timeToMarket: 2.5, // months
      stakeholderSatisfaction: 4.2, // out of 5
    }
  }

  async getTimeSeriesData(query: AnalyticsQuery): Promise<TimeSeriesData[]> {
    const { startDate, endDate, groupBy = 'day', organizationId } = query
    
    // Generate time series data based on groupBy
    const timeSeries: TimeSeriesData[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)
    
    while (current <= end) {
      const nextDate = new Date(current)
      
      switch (groupBy) {
        case 'day':
          nextDate.setDate(current.getDate() + 1)
          break
        case 'week':
          nextDate.setDate(current.getDate() + 7)
          break
        case 'month':
          nextDate.setMonth(current.getMonth() + 1)
          break
        case 'quarter':
          nextDate.setMonth(current.getMonth() + 3)
          break
        case 'year':
          nextDate.setFullYear(current.getFullYear() + 1)
          break
      }
      
      // Get data for this time period
      const periodData = await this.getPeriodData(current, nextDate, organizationId)
      
      timeSeries.push({
        timestamp: new Date(current),
        value: periodData.totalUseCases,
        label: current.toLocaleDateString(),
        metadata: periodData,
      })
      
      current.setTime(nextDate.getTime())
    }
    
    return timeSeries
  }

  private async getPeriodData(startDate: Date, endDate: Date, organizationId?: string) {
    const useCases = await prisma.useCase.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(organizationId && { organizationId }),
      },
    })

    const assessments = await prisma.assessment.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(organizationId && { organizationId }),
      },
    })

    const users = await prisma.user.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(organizationId && { organizationId }),
      },
    })

    return {
      totalUseCases: useCases,
      totalAssessments: assessments,
      totalUsers: users,
    }
  }

  async generateReport(query: AnalyticsQuery, reportType: AnalyticsReport['type']): Promise<AnalyticsReport> {
    const metrics = await this.getMetrics(query)
    const timeSeriesData = await this.getTimeSeriesData(query)
    const insights = this.generateInsights(metrics, timeSeriesData)
    const recommendations = this.generateRecommendations(metrics, insights)

    return {
      id: `report_${Date.now()}`,
      title: this.getReportTitle(reportType),
      description: this.getReportDescription(reportType),
      type: reportType,
      metrics,
      timeSeriesData,
      insights,
      recommendations,
      generatedAt: new Date(),
      generatedBy: query.userId || 'system',
      organizationId: query.organizationId || 'default',
      parameters: query,
    }
  }

  private generateInsights(metrics: AnalyticsMetrics, timeSeriesData: TimeSeriesData[]): string[] {
    const insights: string[] = []

    // Use Case Insights
    if (metrics.totalUseCases > 0) {
      const completionRate = (metrics.completedUseCases / metrics.totalUseCases) * 100
      if (completionRate > 80) {
        insights.push(`High completion rate of ${completionRate.toFixed(1)}% indicates strong project execution`)
      } else if (completionRate < 50) {
        insights.push(`Low completion rate of ${completionRate.toFixed(1)}% suggests potential bottlenecks`)
      }
    }

    // User Engagement Insights
    if (metrics.userEngagement > 70) {
      insights.push(`Strong user engagement at ${metrics.userEngagement.toFixed(1)}% indicates active platform adoption`)
    } else if (metrics.userEngagement < 30) {
      insights.push(`Low user engagement at ${metrics.userEngagement.toFixed(1)}% may require user training initiatives`)
    }

    // Compliance Insights
    if (metrics.complianceScore > 90) {
      insights.push(`Excellent compliance score of ${metrics.complianceScore.toFixed(1)}% demonstrates strong governance`)
    } else if (metrics.complianceScore < 70) {
      insights.push(`Compliance score of ${metrics.complianceScore.toFixed(1)}% needs improvement`)
    }

    // Performance Insights
    if (metrics.averageResponseTime < 2) {
      insights.push(`Fast response time of ${metrics.averageResponseTime}s indicates good system performance`)
    } else if (metrics.averageResponseTime > 5) {
      insights.push(`Slow response time of ${metrics.averageResponseTime}s may impact user experience`)
    }

    return insights
  }

  private generateRecommendations(metrics: AnalyticsMetrics, insights: string[]): string[] {
    const recommendations: string[] = []

    // Based on insights, generate recommendations
    if (metrics.completedUseCases / metrics.totalUseCases < 0.5) {
      recommendations.push('Implement project management best practices to improve completion rates')
    }

    if (metrics.userEngagement < 50) {
      recommendations.push('Develop user onboarding program and training materials')
    }

    if (metrics.complianceScore < 80) {
      recommendations.push('Review and update compliance procedures and training')
    }

    if (metrics.averageResponseTime > 3) {
      recommendations.push('Optimize system performance and consider infrastructure scaling')
    }

    if (metrics.errorRate > 1) {
      recommendations.push('Implement better error handling and monitoring systems')
    }

    return recommendations
  }

  private getReportTitle(type: AnalyticsReport['type']): string {
    switch (type) {
      case 'executive': return 'Executive Dashboard Report'
      case 'operational': return 'Operational Performance Report'
      case 'compliance': return 'Compliance & Risk Report'
      case 'performance': return 'System Performance Report'
      case 'custom': return 'Custom Analytics Report'
      default: return 'Analytics Report'
    }
  }

  private getReportDescription(type: AnalyticsReport['type']): string {
    switch (type) {
      case 'executive': return 'High-level overview of key performance indicators and business metrics'
      case 'operational': return 'Detailed operational metrics and process performance indicators'
      case 'compliance': return 'Compliance status, risk assessment, and regulatory adherence metrics'
      case 'performance': return 'System performance, uptime, and technical health indicators'
      case 'custom': return 'Custom analytics report based on specific requirements'
      default: return 'Comprehensive analytics report'
    }
  }

  async exportReport(report: AnalyticsReport, format: 'json' | 'csv' | 'pdf'): Promise<string> {
    // Mock export functionality - implement actual export logic
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      case 'csv':
        return this.convertToCSV(report)
      case 'pdf':
        return 'PDF export not implemented yet'
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private convertToCSV(report: AnalyticsReport): string {
    const headers = ['Metric', 'Value', 'Category']
    const rows: string[][] = []

    // Add metrics to CSV
    Object.entries(report.metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        rows.push([key, value.toString(), 'metric'])
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          rows.push([`${key}.${subKey}`, subValue.toString(), 'metric'])
        })
      }
    })

    // Add time series data
    report.timeSeriesData.forEach((data, index) => {
      rows.push([`timeSeries.${index}.timestamp`, data.timestamp.toISOString(), 'timeSeries'])
      rows.push([`timeSeries.${index}.value`, data.value.toString(), 'timeSeries'])
    })

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const analyticsEngine = new AnalyticsEngine()


