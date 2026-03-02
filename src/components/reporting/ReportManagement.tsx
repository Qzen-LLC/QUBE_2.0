import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedModal } from '@/components/ui/enhanced-modal'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  Edit,
  Trash2,
  Download,
  Send,
  Plus,
  Settings,
  Users,
  Mail,
  Webhook,
  BarChart3,
  PieChart,
  LineChart,
  Award,
  Shield,
  Zap,
  MoreHorizontal,
  Copy,
  Eye,
  RefreshCw
} from 'lucide-react'
import { reportingSystem, ReportTemplate, ScheduledReport, ReportDelivery } from '@/lib/reporting/reporting-system'

export interface ReportManagementProps {
  organizationId: string
  currentUserId: string
  onTemplateCreate?: (template: ReportTemplate) => void
  onTemplateUpdate?: (template: ReportTemplate) => void
  onTemplateDelete?: (templateId: string) => void
  onReportGenerate?: (report: ScheduledReport) => void
}

export const ReportManagement: React.FC<ReportManagementProps> = ({
  organizationId,
  currentUserId,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onReportGenerate,
}) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'templates' | 'scheduled' | 'history' | 'deliveries'>('templates')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    type: 'operational' as ReportTemplate['type'],
    category: 'on_demand' as ReportTemplate['category'],
    timeRange: '30d' as ReportTemplate['parameters']['timeRange'],
    format: 'pdf' as ReportTemplate['parameters']['format'],
    metrics: [] as string[],
    filters: {} as Record<string, any>,
    schedule: {
      frequency: 'weekly' as ReportTemplate['schedule']['frequency'],
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'UTC',
    },
    recipients: {
      emails: [] as string[],
      roles: [] as string[],
      users: [] as string[],
    },
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [templatesData, scheduledData, statsData] = await Promise.all([
        reportingSystem.getTemplates(organizationId),
        reportingSystem.getScheduledReports(organizationId),
        reportingSystem.getReportStats(organizationId),
      ])

      setTemplates(templatesData)
      setScheduledReports(scheduledData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const newTemplate = await reportingSystem.createTemplate({
        name: templateForm.name,
        description: templateForm.description,
        type: templateForm.type,
        category: templateForm.category,
        parameters: {
          timeRange: templateForm.timeRange,
          metrics: templateForm.metrics,
          filters: templateForm.filters,
          format: templateForm.format,
        },
        schedule: templateForm.category === 'scheduled' ? templateForm.schedule : undefined,
        recipients: templateForm.recipients,
        isActive: templateForm.isActive,
        createdBy: currentUserId,
        organizationId,
      })

      setTemplates(prev => [newTemplate, ...prev])
      setShowCreateModal(false)
      resetForm()
      onTemplateCreate?.(newTemplate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const updatedTemplate = await reportingSystem.updateTemplate(selectedTemplate.id, {
        name: templateForm.name,
        description: templateForm.description,
        type: templateForm.type,
        category: templateForm.category,
        parameters: {
          timeRange: templateForm.timeRange,
          metrics: templateForm.metrics,
          filters: templateForm.filters,
          format: templateForm.format,
        },
        schedule: templateForm.category === 'scheduled' ? templateForm.schedule : undefined,
        recipients: templateForm.recipients,
        isActive: templateForm.isActive,
      })

      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate! : t))
      setShowEditModal(false)
      setSelectedTemplate(null)
      resetForm()
      onTemplateUpdate?.(updatedTemplate!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await reportingSystem.deleteTemplate(templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      onTemplateDelete?.(templateId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const handleScheduleReport = async (templateId: string) => {
    try {
      const scheduledReport = await reportingSystem.scheduleReport(templateId, new Date())
      if (scheduledReport) {
        setScheduledReports(prev => [scheduledReport, ...prev])
        onReportGenerate?.(scheduledReport)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule report')
    }
  }

  const handleCancelScheduledReport = async (reportId: string) => {
    try {
      await reportingSystem.cancelScheduledReport(reportId)
      setScheduledReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'cancelled' } : r
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel report')
    }
  }

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      type: 'operational',
      category: 'on_demand',
      timeRange: '30d',
      format: 'pdf',
      metrics: [],
      filters: {},
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        time: '09:00',
        timezone: 'UTC',
      },
      recipients: {
        emails: [],
        roles: [],
        users: [],
      },
      isActive: true,
    })
  }

  const openEditModal = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      timeRange: template.parameters.timeRange,
      format: template.parameters.format,
      metrics: template.parameters.metrics,
      filters: template.parameters.filters,
      schedule: template.schedule || {
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        time: '09:00',
        timezone: 'UTC',
      },
      recipients: template.recipients,
      isActive: template.isActive,
    })
    setShowEditModal(true)
  }

  const getTypeIcon = (type: ReportTemplate['type']) => {
    switch (type) {
      case 'executive': return <Award className="h-4 w-4" />
      case 'operational': return <BarChart3 className="h-4 w-4" />
      case 'compliance': return <Shield className="h-4 w-4" />
      case 'performance': return <Zap className="h-4 w-4" />
      case 'custom': return <Settings className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ReportTemplate['type']) => {
    switch (type) {
      case 'executive': return 'bg-purple-100 text-purple-800'
      case 'operational': return 'bg-blue-100 text-blue-800'
      case 'compliance': return 'bg-green-100 text-green-800'
      case 'performance': return 'bg-yellow-100 text-yellow-800'
      case 'custom': return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: ScheduledReport['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: ScheduledReport['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tabs = [
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'deliveries', label: 'Deliveries', icon: Send },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading report management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <EnhancedButton onClick={loadData}>
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
          <h2 className="text-2xl font-bold">Report Management</h2>
          <p className="text-muted-foreground">
            Create, schedule, and manage analytics reports
          </p>
        </div>
        
        <EnhancedButton onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </EnhancedButton>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                  <p className="text-sm text-muted-foreground">Total Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.scheduledReports}</p>
                  <p className="text-sm text-muted-foreground">Scheduled Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedReports}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Send className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.successfulDeliveries}</p>
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Report Templates</h3>
            <div className="flex gap-2">
              <EnhancedButton variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </EnhancedButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <EnhancedBadge className={getTypeColor(template.type)}>
                        {template.type}
                      </EnhancedBadge>
                      {template.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Pause className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="capitalize">{template.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="uppercase">{template.parameters.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recipients:</span>
                      <span>{template.recipients.emails.length + template.recipients.users.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleScheduleReport(template.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Schedule
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </EnhancedButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          
          <div className="space-y-4">
            {scheduledReports.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(report.status)}
                      <div>
                        <h4 className="font-medium">{report.template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Scheduled for {formatDate(report.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <EnhancedBadge className={getStatusColor(report.status)}>
                        {report.status}
                      </EnhancedBadge>
                      {report.status === 'pending' && (
                        <EnhancedButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelScheduledReport(report.id)}
                        >
                          Cancel
                        </EnhancedButton>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Report History</h3>
          
          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(report.status)}
                      <div>
                        <h4 className="font-medium">{report.template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(report.createdAt)} • {report.template.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <EnhancedBadge className={getStatusColor(report.status)}>
                        {report.status}
                      </EnhancedBadge>
                      {report.generatedReport && (
                        <EnhancedButton variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </EnhancedButton>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      <EnhancedModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Report Template"
        variant="info"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <EnhancedInput
              value={templateForm.name}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={templateForm.description}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description"
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={templateForm.type}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="executive">Executive</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="performance">Performance</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="on_demand">On Demand</option>
                <option value="scheduled">Scheduled</option>
                <option value="real_time">Real Time</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <EnhancedButton
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              onClick={handleCreateTemplate}
              disabled={!templateForm.name}
            >
              Create Template
            </EnhancedButton>
          </div>
        </div>
      </EnhancedModal>

      {/* Edit Template Modal */}
      <EnhancedModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Report Template"
        variant="info"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <EnhancedInput
              value={templateForm.name}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={templateForm.description}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description"
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={templateForm.type}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="executive">Executive</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="performance">Performance</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="on_demand">On Demand</option>
                <option value="scheduled">Scheduled</option>
                <option value="real_time">Real Time</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <EnhancedButton
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              onClick={handleUpdateTemplate}
              disabled={!templateForm.name}
            >
              Update Template
            </EnhancedButton>
          </div>
        </div>
      </EnhancedModal>
    </div>
  )
}

export default ReportManagement


