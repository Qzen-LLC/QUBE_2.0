import { analyticsEngine, AnalyticsReport, AnalyticsQuery } from '@/lib/analytics/analytics-engine'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'executive' | 'operational' | 'compliance' | 'performance' | 'custom'
  category: 'scheduled' | 'on_demand' | 'real_time'
  parameters: {
    timeRange: '7d' | '30d' | '90d' | '1y' | 'custom'
    metrics: string[]
    filters: Record<string, any>
    format: 'pdf' | 'excel' | 'csv' | 'json'
  }
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    timezone: string
  }
  recipients: {
    emails: string[]
    roles: string[]
    users: string[]
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  organizationId: string
}

export interface ScheduledReport {
  id: string
  templateId: string
  template: ReportTemplate
  scheduledAt: Date
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  generatedReport?: AnalyticsReport
  error?: string
  createdAt: Date
  organizationId: string
}

export interface ReportDelivery {
  id: string
  reportId: string
  recipient: string
  method: 'email' | 'webhook' | 'api'
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sentAt?: Date
  deliveredAt?: Date
  error?: string
  metadata?: Record<string, any>
}

export class ReportingSystem {
  private templates = new Map<string, ReportTemplate>()
  private scheduledReports = new Map<string, ScheduledReport>()
  private deliveries = new Map<string, ReportDelivery>()
  private scheduler: NodeJS.Timeout | null = null

  constructor() {
    this.initializeScheduler()
  }

  // Template Management
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.templates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    return this.templates.get(templateId) || null
  }

  async getTemplates(organizationId: string): Promise<ReportTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.organizationId === organizationId)
  }

  async updateTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate | null> {
    const template = this.templates.get(templateId)
    if (!template) return null

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    }

    this.templates.set(templateId, updatedTemplate)
    return updatedTemplate
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    return this.templates.delete(templateId)
  }

  // Report Generation
  async generateReport(templateId: string, parameters?: Partial<AnalyticsQuery>): Promise<AnalyticsReport | null> {
    const template = this.templates.get(templateId)
    if (!template) return null

    try {
      const query = this.buildAnalyticsQuery(template, parameters)
      const report = await analyticsEngine.generateReport(query, template.type)
      return report
    } catch (error) {
      console.error('Failed to generate report:', error)
      return null
    }
  }

  private buildAnalyticsQuery(template: ReportTemplate, parameters?: Partial<AnalyticsQuery>): AnalyticsQuery {
    const endDate = new Date()
    const startDate = new Date()

    // Calculate date range based on template parameters
    switch (template.parameters.timeRange) {
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
      case 'custom':
        // Use provided parameters or default to 30 days
        if (parameters?.startDate) startDate.setTime(parameters.startDate.getTime())
        if (parameters?.endDate) endDate.setTime(parameters.endDate.getTime())
        break
    }

    return {
      startDate,
      endDate,
      organizationId: template.organizationId,
      userId: template.createdBy,
      metrics: template.parameters.metrics,
      filters: template.parameters.filters,
      ...parameters,
    }
  }

  // Scheduled Reports
  async scheduleReport(templateId: string, scheduledAt: Date): Promise<ScheduledReport | null> {
    const template = this.templates.get(templateId)
    if (!template) return null

    const scheduledReport: ScheduledReport = {
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      template,
      scheduledAt,
      status: 'pending',
      createdAt: new Date(),
      organizationId: template.organizationId,
    }

    this.scheduledReports.set(scheduledReport.id, scheduledReport)
    return scheduledReport
  }

  async getScheduledReports(organizationId: string): Promise<ScheduledReport[]> {
    return Array.from(this.scheduledReports.values())
      .filter(report => report.organizationId === organizationId)
  }

  async cancelScheduledReport(reportId: string): Promise<boolean> {
    const report = this.scheduledReports.get(reportId)
    if (!report || report.status !== 'pending') return false

    report.status = 'cancelled'
    this.scheduledReports.set(reportId, report)
    return true
  }

  // Report Delivery
  async deliverReport(report: AnalyticsReport, template: ReportTemplate): Promise<ReportDelivery[]> {
    const deliveries: ReportDelivery[] = []

    for (const email of template.recipients.emails) {
      const delivery = await this.createDelivery(report.id, email, 'email')
      if (delivery) {
        deliveries.push(delivery)
        await this.sendEmailReport(report, email, template)
      }
    }

    for (const webhook of template.recipients.users) {
      const delivery = await this.createDelivery(report.id, webhook, 'webhook')
      if (delivery) {
        deliveries.push(delivery)
        await this.sendWebhookReport(report, webhook, template)
      }
    }

    return deliveries
  }

  private async createDelivery(reportId: string, recipient: string, method: ReportDelivery['method']): Promise<ReportDelivery | null> {
    const delivery: ReportDelivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      recipient,
      method,
      status: 'pending',
    }

    this.deliveries.set(delivery.id, delivery)
    return delivery
  }

  private async sendEmailReport(report: AnalyticsReport, email: string, template: ReportTemplate): Promise<void> {
    try {
      // Mock email sending - implement actual email service integration
      console.log(`Sending report to ${email}:`, {
        subject: `Analytics Report: ${report.title}`,
        template: template.name,
        reportId: report.id,
      })

      // Update delivery status
      const delivery = Array.from(this.deliveries.values())
        .find(d => d.reportId === report.id && d.recipient === email)
      
      if (delivery) {
        delivery.status = 'sent'
        delivery.sentAt = new Date()
        this.deliveries.set(delivery.id, delivery)
      }
    } catch (error) {
      console.error('Failed to send email report:', error)
      
      const delivery = Array.from(this.deliveries.values())
        .find(d => d.reportId === report.id && d.recipient === email)
      
      if (delivery) {
        delivery.status = 'failed'
        delivery.error = error instanceof Error ? error.message : 'Unknown error'
        this.deliveries.set(delivery.id, delivery)
      }
    }
  }

  private async sendWebhookReport(report: AnalyticsReport, webhook: string, template: ReportTemplate): Promise<void> {
    try {
      // Mock webhook sending - implement actual webhook service integration
      console.log(`Sending webhook report to ${webhook}:`, {
        url: webhook,
        template: template.name,
        reportId: report.id,
      })

      // Update delivery status
      const delivery = Array.from(this.deliveries.values())
        .find(d => d.reportId === report.id && d.recipient === webhook)
      
      if (delivery) {
        delivery.status = 'sent'
        delivery.sentAt = new Date()
        this.deliveries.set(delivery.id, delivery)
      }
    } catch (error) {
      console.error('Failed to send webhook report:', error)
      
      const delivery = Array.from(this.deliveries.values())
        .find(d => d.reportId === report.id && d.recipient === webhook)
      
      if (delivery) {
        delivery.status = 'failed'
        delivery.error = error instanceof Error ? error.message : 'Unknown error'
        this.deliveries.set(delivery.id, delivery)
      }
    }
  }

  // Scheduler
  private initializeScheduler(): void {
    // Check for scheduled reports every minute
    this.scheduler = setInterval(() => {
      this.processScheduledReports()
    }, 60000)
  }

  private async processScheduledReports(): Promise<void> {
    const now = new Date()
    const pendingReports = Array.from(this.scheduledReports.values())
      .filter(report => 
        report.status === 'pending' && 
        report.scheduledAt <= now
      )

    for (const scheduledReport of pendingReports) {
      await this.executeScheduledReport(scheduledReport)
    }
  }

  private async executeScheduledReport(scheduledReport: ScheduledReport): Promise<void> {
    try {
      scheduledReport.status = 'running'
      this.scheduledReports.set(scheduledReport.id, scheduledReport)

      const report = await this.generateReport(scheduledReport.templateId)
      
      if (report) {
        scheduledReport.generatedReport = report
        scheduledReport.status = 'completed'
        
        // Deliver the report
        await this.deliverReport(report, scheduledReport.template)
      } else {
        scheduledReport.status = 'failed'
        scheduledReport.error = 'Failed to generate report'
      }

      this.scheduledReports.set(scheduledReport.id, scheduledReport)
    } catch (error) {
      scheduledReport.status = 'failed'
      scheduledReport.error = error instanceof Error ? error.message : 'Unknown error'
      this.scheduledReports.set(scheduledReport.id, scheduledReport)
    }
  }

  // Utility Methods
  async getReportHistory(organizationId: string, limit = 50): Promise<ScheduledReport[]> {
    return Array.from(this.scheduledReports.values())
      .filter(report => report.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  async getDeliveryStatus(reportId: string): Promise<ReportDelivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.reportId === reportId)
  }

  async getReportStats(organizationId: string): Promise<{
    totalTemplates: number
    activeTemplates: number
    scheduledReports: number
    completedReports: number
    failedReports: number
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
  }> {
    const templates = await this.getTemplates(organizationId)
    const scheduledReports = await this.getScheduledReports(organizationId)
    const deliveries = Array.from(this.deliveries.values())

    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      scheduledReports: scheduledReports.length,
      completedReports: scheduledReports.filter(r => r.status === 'completed').length,
      failedReports: scheduledReports.filter(r => r.status === 'failed').length,
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter(d => d.status === 'sent' || d.status === 'delivered').length,
      failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
    }
  }

  // Cleanup
  destroy(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler)
      this.scheduler = null
    }
  }
}

export const reportingSystem = new ReportingSystem()


