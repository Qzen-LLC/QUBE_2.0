import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedModal } from '@/components/ui/enhanced-modal'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Lock,
  Key,
  Database,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  FileText,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Network,
  Zap,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle2,
  Info,
  ExternalLink
} from 'lucide-react'
import { securityAuditSystem, SecurityEvent, SecurityViolation, SecurityPolicy, ComplianceFramework, SecurityMetrics } from '@/lib/security/security-audit-system'

export interface SecurityDashboardProps {
  organizationId: string
  currentUserId: string
  onEventView?: (event: SecurityEvent) => void
  onViolationView?: (violation: SecurityViolation) => void
  onPolicyEdit?: (policy: SecurityPolicy) => void
  onFrameworkUpdate?: (framework: ComplianceFramework) => void
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  organizationId,
  currentUserId,
  onEventView,
  onViolationView,
  onPolicyEdit,
  onFrameworkUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'violations' | 'policies' | 'compliance'>('overview')
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [violations, setViolations] = useState<SecurityViolation[]>([])
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modals
  const [showEventModal, setShowEventModal] = useState(false)
  const [showViolationModal, setShowViolationModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [showFrameworkModal, setShowFrameworkModal] = useState(false)
  
  // Selected items
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [selectedViolation, setSelectedViolation] = useState<SecurityViolation | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null)
  
  // Filters
  const [eventFilters, setEventFilters] = useState({
    type: 'all',
    severity: 'all',
    userId: '',
    startDate: '',
    endDate: '',
  })
  const [violationFilters, setViolationFilters] = useState({
    type: 'all',
    severity: 'all',
    status: 'all',
    assignedTo: '',
  })

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [metricsData, eventsData, violationsData, policiesData, frameworksData] = await Promise.all([
        securityAuditSystem.getSecurityMetrics(organizationId),
        securityAuditSystem.getSecurityEvents(organizationId),
        securityAuditSystem.getViolations(organizationId),
        securityAuditSystem.getPolicies(organizationId),
        securityAuditSystem.getFrameworks(organizationId),
      ])

      setMetrics(metricsData)
      setEvents(eventsData)
      setViolations(violationsData)
      setPolicies(policiesData)
      setFrameworks(frameworksData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const handleViolationStatusUpdate = async (violationId: string, status: SecurityViolation['status']) => {
    try {
      await securityAuditSystem.updateViolationStatus(violationId, status, currentUserId)
      setViolations(prev => prev.map(v => 
        v.id === violationId ? { ...v, status, updatedAt: new Date() } : v
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update violation status')
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'medium': return <Info className="h-4 w-4 text-yellow-600" />
      case 'low': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="h-4 w-4 text-red-600" />
      case 'investigating': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'false_positive': return <Info className="h-4 w-4 text-blue-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'false_positive': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'partial': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'non_compliant': return <XCircle className="h-4 w-4 text-red-600" />
      case 'not_applicable': return <Info className="h-4 w-4 text-gray-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'non_compliant': return 'bg-red-100 text-red-800'
      case 'not_applicable': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return formatDate(date)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Activity },
    { id: 'violations', label: 'Violations', icon: AlertTriangle },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: Award },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Security Dashboard</h3>
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
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security events, violations, and compliance status
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <EnhancedButton onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </EnhancedButton>
          <EnhancedButton>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </EnhancedButton>
        </div>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.criticalEvents}</p>
                  <p className="text-sm text-muted-foreground">Critical Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.violationsOpen}</p>
                  <p className="text-sm text-muted-foreground">Open Violations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(metrics.complianceScore)}%</p>
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(metrics.riskScore)}</p>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
                <CardDescription>
                  Latest security events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(event.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.userEmail} • {formatTime(event.timestamp)}
                        </p>
                      </div>
                      <EnhancedBadge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </EnhancedBadge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Open Violations
                </CardTitle>
                <CardDescription>
                  Security violations requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {violations.filter(v => v.status === 'open').slice(0, 5).map((violation) => (
                    <div key={violation.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(violation.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{violation.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(violation.createdAt)}
                        </p>
                      </div>
                      <EnhancedBadge className={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </EnhancedBadge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Compliance Status
              </CardTitle>
              <CardDescription>
                Current compliance framework status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frameworks.map((framework) => {
                  const compliantCount = framework.requirements.filter(r => r.status === 'compliant').length
                  const totalCount = framework.requirements.length
                  const compliancePercentage = totalCount > 0 ? (compliantCount / totalCount) * 100 : 0

                  return (
                    <div key={framework.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{framework.name}</h3>
                          <p className="text-sm text-muted-foreground">{framework.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${compliancePercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round(compliancePercentage)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {compliantCount} of {totalCount} requirements
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Events</h3>
            <div className="flex gap-2">
              <EnhancedInput
                placeholder="Search events..."
                className="w-64"
              />
              <select
                value={eventFilters.severity}
                onChange={(e) => setEventFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(event.severity)}
                      <div>
                        <h4 className="font-medium">{event.action}</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.userEmail} • {event.type} • {formatTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnhancedBadge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </EnhancedBadge>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowEventModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </EnhancedButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Violations</h3>
            <div className="flex gap-2">
              <select
                value={violationFilters.status}
                onChange={(e) => setViolationFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {violations.map((violation) => (
              <Card key={violation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(violation.severity)}
                      <div>
                        <h4 className="font-medium">{violation.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {violation.type} • {formatTime(violation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnhancedBadge className={getStatusColor(violation.status)}>
                        {violation.status}
                      </EnhancedBadge>
                      <EnhancedBadge className={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </EnhancedBadge>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedViolation(violation)
                          setShowViolationModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </EnhancedButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Policies</h3>
            <EnhancedButton>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </EnhancedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                    </div>
                    {policy.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{policy.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rules:</span>
                      <span>{policy.rules.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Rules:</span>
                      <span>{policy.rules.filter(r => r.isActive).length}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPolicy(policy)
                        setShowPolicyModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </EnhancedButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Frameworks</h3>
            <EnhancedButton>
              <Plus className="h-4 w-4 mr-2" />
              Add Framework
            </EnhancedButton>
          </div>

          <div className="space-y-4">
            {frameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <CardTitle className="text-lg">{framework.name}</CardTitle>
                    </div>
                    <EnhancedBadge className="bg-blue-100 text-blue-800">
                      {framework.type}
                    </EnhancedBadge>
                  </div>
                  <CardDescription>{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {framework.requirements.map((requirement) => (
                      <div key={requirement.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getComplianceStatusIcon(requirement.status)}
                          <div>
                            <h4 className="font-medium">{requirement.title}</h4>
                            <p className="text-sm text-muted-foreground">{requirement.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <EnhancedBadge className={getComplianceStatusColor(requirement.status)}>
                            {requirement.status.replace('_', ' ')}
                          </EnhancedBadge>
                          <EnhancedButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFramework(framework)
                              setShowFrameworkModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </EnhancedButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <EnhancedModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Security Event Details"
        variant="info"
        size="large"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Event Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{selectedEvent.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Action:</span>
                    <span>{selectedEvent.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity:</span>
                    <EnhancedBadge className={getSeverityColor(selectedEvent.severity)}>
                      {selectedEvent.severity}
                    </EnhancedBadge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span>{formatDate(selectedEvent.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span>{selectedEvent.userEmail || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP Address:</span>
                    <span>{selectedEvent.ipAddress || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session:</span>
                    <span>{selectedEvent.sessionId || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resource:</span>
                    <span>{selectedEvent.resource || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Event Details</h4>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-auto">
                {JSON.stringify(selectedEvent.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </EnhancedModal>

      {/* Violation Details Modal */}
      <EnhancedModal
        isOpen={showViolationModal}
        onClose={() => setShowViolationModal(false)}
        title="Security Violation Details"
        variant="info"
        size="large"
      >
        {selectedViolation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Violation Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{selectedViolation.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity:</span>
                    <EnhancedBadge className={getSeverityColor(selectedViolation.severity)}>
                      {selectedViolation.severity}
                    </EnhancedBadge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <EnhancedBadge className={getStatusColor(selectedViolation.status)}>
                      {selectedViolation.status.replace('_', ' ')}
                    </EnhancedBadge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(selectedViolation.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Assignment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span>{selectedViolation.assignedTo || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(selectedViolation.updatedAt)}</span>
                  </div>
                  {selectedViolation.resolvedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolved:</span>
                      <span>{formatDate(selectedViolation.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedViolation.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Evidence</h4>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-auto">
                {JSON.stringify(selectedViolation.evidence, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <EnhancedButton
                variant="outline"
                onClick={() => setShowViolationModal(false)}
              >
                Close
              </EnhancedButton>
              {selectedViolation.status === 'open' && (
                <EnhancedButton
                  onClick={() => {
                    handleViolationStatusUpdate(selectedViolation.id, 'investigating')
                    setShowViolationModal(false)
                  }}
                >
                  Start Investigation
                </EnhancedButton>
              )}
              {selectedViolation.status === 'investigating' && (
                <EnhancedButton
                  onClick={() => {
                    handleViolationStatusUpdate(selectedViolation.id, 'resolved')
                    setShowViolationModal(false)
                  }}
                >
                  Mark Resolved
                </EnhancedButton>
              )}
            </div>
          </div>
        )}
      </EnhancedModal>
    </div>
  )
}

export default SecurityDashboard


