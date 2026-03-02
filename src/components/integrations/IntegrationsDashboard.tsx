import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedModal } from '@/components/ui/enhanced-modal'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { 
  Plug, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Eye,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Globe,
  Shield,
  Database,
  MessageCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Star,
  Users,
  Calendar,
  FileText,
  Webhook
} from 'lucide-react'
import { apiIntegrationSystem, ApiIntegration, IntegrationMetrics } from '@/lib/integrations/api-integration-system'
import { thirdPartyIntegrationsSystem, ThirdPartyProvider, IntegrationTemplate } from '@/lib/integrations/third-party-integrations'

export interface IntegrationsDashboardProps {
  organizationId: string
  currentUserId: string
  onIntegrationCreate?: (integration: ApiIntegration) => void
  onIntegrationUpdate?: (integration: ApiIntegration) => void
  onIntegrationDelete?: (integrationId: string) => void
}

export const IntegrationsDashboard: React.FC<IntegrationsDashboardProps> = ({
  organizationId,
  currentUserId,
  onIntegrationCreate,
  onIntegrationUpdate,
  onIntegrationDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'providers' | 'templates' | 'logs'>('overview')
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([])
  const [providers, setProviders] = useState<ThirdPartyProvider[]>([])
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  
  // Selected items
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<ThirdPartyProvider | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [integrationsData, providersData, templatesData, statsData] = await Promise.all([
        apiIntegrationSystem.getIntegrations(organizationId),
        thirdPartyIntegrationsSystem.getProviders(),
        thirdPartyIntegrationsSystem.getTemplates(),
        apiIntegrationSystem.getIntegrationStats(organizationId),
      ])

      setIntegrations(integrationsData)
      setProviders(providersData)
      setTemplates(templatesData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async (templateId: string, configuration: Record<string, any>) => {
    try {
      const integration = await thirdPartyIntegrationsSystem.createIntegrationFromTemplate(
        templateId,
        organizationId,
        currentUserId,
        configuration
      )

      if (integration) {
        setIntegrations(prev => [integration, ...prev])
        setShowTemplateModal(false)
        onIntegrationCreate?.(integration)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration')
    }
  }

  const handleUpdateIntegration = async (integrationId: string, updates: Partial<ApiIntegration>) => {
    try {
      const updatedIntegration = await apiIntegrationSystem.updateIntegration(integrationId, updates)
      if (updatedIntegration) {
        setIntegrations(prev => prev.map(i => i.id === integrationId ? updatedIntegration : i))
        setShowEditModal(false)
        setSelectedIntegration(null)
        onIntegrationUpdate?.(updatedIntegration)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration')
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await apiIntegrationSystem.deleteIntegration(integrationId)
      setIntegrations(prev => prev.filter(i => i.id !== integrationId))
      onIntegrationDelete?.(integrationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete integration')
    }
  }

  const handleToggleIntegration = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId)
    if (integration) {
      await handleUpdateIntegration(integrationId, { isActive: !integration.isActive })
    }
  }

  const getTypeIcon = (type: ApiIntegration['type']) => {
    switch (type) {
      case 'rest': return <Globe className="h-4 w-4" />
      case 'graphql': return <Database className="h-4 w-4" />
      case 'soap': return <FileText className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'sftp': return <Database className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ApiIntegration['type']) => {
    switch (type) {
      case 'rest': return 'bg-blue-100 text-blue-800'
      case 'graphql': return 'bg-purple-100 text-purple-800'
      case 'soap': return 'bg-gray-100 text-gray-800'
      case 'webhook': return 'bg-green-100 text-green-800'
      case 'sftp': return 'bg-orange-100 text-orange-800'
      case 'database': return 'bg-red-100 text-red-800'
    }
  }

  const getCategoryIcon = (category: ThirdPartyProvider['category']) => {
    switch (category) {
      case 'analytics': return <BarChart3 className="h-4 w-4" />
      case 'communication': return <MessageCircle className="h-4 w-4" />
      case 'storage': return <Database className="h-4 w-4" />
      case 'monitoring': return <Activity className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'development': return <Zap className="h-4 w-4" />
      case 'business': return <Users className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: ThirdPartyProvider['category']) => {
    switch (category) {
      case 'analytics': return 'bg-blue-100 text-blue-800'
      case 'communication': return 'bg-green-100 text-green-800'
      case 'storage': return 'bg-purple-100 text-purple-800'
      case 'monitoring': return 'bg-yellow-100 text-yellow-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'development': return 'bg-orange-100 text-orange-800'
      case 'business': return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'providers', label: 'Providers', icon: Globe },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'logs', label: 'Logs', icon: Activity },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading integrations dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Integrations</h3>
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
          <h2 className="text-2xl font-bold">Integrations Dashboard</h2>
          <p className="text-muted-foreground">
            Manage API integrations, webhooks, and third-party connections
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <EnhancedButton onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </EnhancedButton>
          <EnhancedButton onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </EnhancedButton>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plug className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalIntegrations}</p>
                  <p className="text-sm text-muted-foreground">Total Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeIntegrations}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Webhook className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalWebhooks}</p>
                  <p className="text-sm text-muted-foreground">Webhooks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
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
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest integration activities and requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.slice(0, 5).map((integration) => (
                    <div key={integration.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getTypeIcon(integration.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.provider}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <EnhancedBadge className={integration.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </EnhancedBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Popular Providers
                </CardTitle>
                <CardDescription>
                  Most used third-party integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.filter(p => p.isPopular).slice(0, 5).map((provider) => (
                    <div key={provider.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getCategoryIcon(provider.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs">{provider.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">API Integrations</h3>
            <div className="flex gap-2">
              <EnhancedInput
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter(integration => {
                const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  integration.provider.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || 
                  (statusFilter === 'active' && integration.isActive) ||
                  (statusFilter === 'inactive' && !integration.isActive)
                return matchesSearch && matchesStatus
              })
              .map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(integration.type)}
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <EnhancedBadge className={getTypeColor(integration.type)}>
                          {integration.type.toUpperCase()}
                        </EnhancedBadge>
                        {integration.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Provider:</span>
                        <span>{integration.provider}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Endpoints:</span>
                        <span>{integration.endpoints.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(integration.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntegration(integration)
                          setShowEditModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleIntegration(integration.id)}
                      >
                        {integration.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </EnhancedButton>
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteIntegration(integration.id)}
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

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Third-Party Providers</h3>
            <div className="flex gap-2">
              <EnhancedInput
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Categories</option>
                <option value="analytics">Analytics</option>
                <option value="communication">Communication</option>
                <option value="storage">Storage</option>
                <option value="monitoring">Monitoring</option>
                <option value="security">Security</option>
                <option value="development">Development</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers
              .filter(provider => {
                const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  provider.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesCategory = categoryFilter === 'all' || provider.category === categoryFilter
                return matchesSearch && matchesCategory
              })
              .map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(provider.category)}
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <EnhancedBadge className={getCategoryColor(provider.category)}>
                          {provider.category}
                        </EnhancedBadge>
                        {provider.isPopular && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </div>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{provider.rating}</span>
                          <span className="text-muted-foreground">({provider.reviewCount})</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pricing:</span>
                        <span className="capitalize">{provider.pricing.model}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Features:</span>
                        <span>{provider.supportedFeatures.length}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProvider(provider)
                          setShowProviderModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </EnhancedButton>
                      <EnhancedButton
                        size="sm"
                        onClick={() => {
                          const template = templates.find(t => t.providerId === provider.id)
                          if (template) {
                            setSelectedTemplate(template)
                            setShowTemplateModal(true)
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Integrate
                      </EnhancedButton>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Integration Templates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <EnhancedBadge className="bg-blue-100 text-blue-800">
                      {template.category}
                    </EnhancedBadge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Provider:</span>
                      <span>{providers.find(p => p.id === template.providerId)?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Setup Steps:</span>
                      <span>{template.setupSteps.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowTemplateModal(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Use Template
                    </EnhancedButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Integration Logs</h3>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Integration Logs</h3>
                <p className="mb-4">
                  View detailed logs of API requests, responses, and errors for all integrations.
                </p>
                <EnhancedButton>
                  <Eye className="h-4 w-4 mr-2" />
                  View Logs
                </EnhancedButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Details Modal */}
      <EnhancedModal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title={selectedProvider?.name || 'Provider Details'}
        variant="info"
        size="large"
      >
        {selectedProvider && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                {getCategoryIcon(selectedProvider.category)}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedProvider.name}</h3>
                <p className="text-muted-foreground">{selectedProvider.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <EnhancedBadge className={getCategoryColor(selectedProvider.category)}>
                    {selectedProvider.category}
                  </EnhancedBadge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{selectedProvider.rating}</span>
                    <span className="text-sm text-muted-foreground">({selectedProvider.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Supported Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.supportedFeatures.map((feature) => (
                    <EnhancedBadge key={feature} variant="outline">
                      {feature.replace('_', ' ')}
                    </EnhancedBadge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Pricing</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model:</span>
                    <span className="text-sm font-medium capitalize">{selectedProvider.pricing.model}</span>
                  </div>
                  {selectedProvider.pricing.tiers && (
                    <div className="space-y-1">
                      {selectedProvider.pricing.tiers.map((tier, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{tier.name}:</span>
                          <span className="ml-2">
                            {tier.price === 0 ? 'Free' : `$${tier.price}/${tier.currency}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Available Endpoints</h4>
              <div className="space-y-2">
                {selectedProvider.endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <EnhancedBadge className="bg-blue-100 text-blue-800">
                      {endpoint.method}
                    </EnhancedBadge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{endpoint.name}</p>
                      <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <EnhancedButton
                variant="outline"
                onClick={() => setShowProviderModal(false)}
              >
                Close
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  const template = templates.find(t => t.providerId === selectedProvider.id)
                  if (template) {
                    setSelectedTemplate(template)
                    setShowProviderModal(false)
                    setShowTemplateModal(true)
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Integration
              </EnhancedButton>
            </div>
          </div>
        )}
      </EnhancedModal>

      {/* Template Modal */}
      <EnhancedModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={selectedTemplate?.name || 'Integration Template'}
        variant="info"
        size="large"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedTemplate.name}</h3>
              <p className="text-muted-foreground mb-4">{selectedTemplate.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Setup Steps</h4>
              <div className="space-y-4">
                {selectedTemplate.setupSteps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{step.title}</h5>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <EnhancedButton
                variant="outline"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={() => handleCreateIntegration(selectedTemplate.id, {})}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Integration
              </EnhancedButton>
            </div>
          </div>
        )}
      </EnhancedModal>
    </div>
  )
}

export default IntegrationsDashboard


