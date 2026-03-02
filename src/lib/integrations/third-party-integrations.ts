import { apiIntegrationSystem, ApiIntegration } from './api-integration-system'

export interface ThirdPartyProvider {
  id: string
  name: string
  description: string
  category: 'analytics' | 'communication' | 'storage' | 'monitoring' | 'security' | 'development' | 'business'
  logo?: string
  website?: string
  documentation?: string
  supportedFeatures: string[]
  pricing: {
    model: 'free' | 'freemium' | 'paid' | 'enterprise'
    tiers?: {
      name: string
      price: number
      currency: string
      features: string[]
    }[]
  }
  authentication: {
    supportedTypes: ('api_key' | 'oauth2' | 'basic' | 'bearer' | 'jwt')[]
    oauthScopes?: string[]
    setupInstructions: string
  }
  endpoints: {
    name: string
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    description: string
    parameters?: Record<string, any>
    responseSchema?: Record<string, any>
  }[]
  webhooks?: {
    events: string[]
    payloadSchema?: Record<string, any>
  }
  isActive: boolean
  isPopular: boolean
  rating: number
  reviewCount: number
}

export interface IntegrationTemplate {
  id: string
  providerId: string
  name: string
  description: string
  category: string
  template: Partial<ApiIntegration>
  setupSteps: {
    step: number
    title: string
    description: string
    type: 'form' | 'api_key' | 'oauth' | 'webhook' | 'configuration'
    fields?: {
      name: string
      type: 'text' | 'password' | 'email' | 'url' | 'select' | 'checkbox'
      label: string
      placeholder?: string
      required: boolean
      options?: { value: string; label: string }[]
    }[]
  }[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class ThirdPartyIntegrationsSystem {
  private providers = new Map<string, ThirdPartyProvider>()
  private templates = new Map<string, IntegrationTemplate>()

  constructor() {
    this.initializeProviders()
    this.initializeTemplates()
  }

  private initializeProviders(): void {
    const providers: ThirdPartyProvider[] = [
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team communication and collaboration platform',
        category: 'communication',
        logo: '/logos/slack.png',
        website: 'https://slack.com',
        documentation: 'https://api.slack.com',
        supportedFeatures: ['messaging', 'notifications', 'file_sharing', 'bots', 'workflows'],
        pricing: {
          model: 'freemium',
          tiers: [
            {
              name: 'Free',
              price: 0,
              currency: 'USD',
              features: ['10,000 message history', '10 integrations', '1:1 video calls'],
            },
            {
              name: 'Pro',
              price: 6.67,
              currency: 'USD',
              features: ['Unlimited message history', 'Unlimited integrations', 'Screen sharing'],
            },
          ],
        },
        authentication: {
          supportedTypes: ['oauth2', 'api_key'],
          oauthScopes: ['chat:write', 'channels:read', 'users:read'],
          setupInstructions: 'Create a Slack app and configure OAuth2 settings',
        },
        endpoints: [
          {
            name: 'Send Message',
            path: '/api/chat.postMessage',
            method: 'POST',
            description: 'Send a message to a channel or user',
            parameters: {
              channel: { type: 'string', required: true },
              text: { type: 'string', required: true },
            },
          },
          {
            name: 'List Channels',
            path: '/api/conversations.list',
            method: 'GET',
            description: 'Get list of channels',
          },
        ],
        webhooks: {
          events: ['message', 'channel_created', 'user_joined'],
          payloadSchema: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
        isActive: true,
        isPopular: true,
        rating: 4.5,
        reviewCount: 1250,
      },
      {
        id: 'microsoft_teams',
        name: 'Microsoft Teams',
        description: 'Collaboration and communication platform',
        category: 'communication',
        logo: '/logos/teams.png',
        website: 'https://teams.microsoft.com',
        documentation: 'https://docs.microsoft.com/en-us/graph/api/resources/teams-api-overview',
        supportedFeatures: ['messaging', 'video_calls', 'file_sharing', 'bots', 'apps'],
        pricing: {
          model: 'freemium',
          tiers: [
            {
              name: 'Free',
              price: 0,
              currency: 'USD',
              features: ['Unlimited chat', 'Video calls', '10GB storage'],
            },
            {
              name: 'Business Basic',
              price: 5,
              currency: 'USD',
              features: ['Everything in Free', 'Scheduled meetings', '1TB storage'],
            },
          ],
        },
        authentication: {
          supportedTypes: ['oauth2'],
          oauthScopes: ['https://graph.microsoft.com/Team.ReadBasic.All'],
          setupInstructions: 'Register an app in Azure AD and configure Microsoft Graph permissions',
        },
        endpoints: [
          {
            name: 'Send Message',
            path: '/v1.0/teams/{teamId}/channels/{channelId}/messages',
            method: 'POST',
            description: 'Send a message to a Teams channel',
          },
          {
            name: 'List Teams',
            path: '/v1.0/me/joinedTeams',
            method: 'GET',
            description: 'Get list of joined teams',
          },
        ],
        isActive: true,
        isPopular: true,
        rating: 4.3,
        reviewCount: 890,
      },
      {
        id: 'google_analytics',
        name: 'Google Analytics',
        description: 'Web analytics service',
        category: 'analytics',
        logo: '/logos/google-analytics.png',
        website: 'https://analytics.google.com',
        documentation: 'https://developers.google.com/analytics',
        supportedFeatures: ['web_analytics', 'conversion_tracking', 'audience_insights', 'real_time_data'],
        pricing: {
          model: 'freemium',
          tiers: [
            {
              name: 'Free',
              price: 0,
              currency: 'USD',
              features: ['Up to 10M hits/month', 'Standard reports', 'Real-time data'],
            },
            {
              name: 'Analytics 360',
              price: 150000,
              currency: 'USD',
              features: ['Unlimited hits', 'Advanced analysis', 'Data Studio'],
            },
          ],
        },
        authentication: {
          supportedTypes: ['oauth2'],
          oauthScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
          setupInstructions: 'Create a Google Cloud project and enable Analytics API',
        },
        endpoints: [
          {
            name: 'Get Reports',
            path: '/v4/reports:batchGet',
            method: 'POST',
            description: 'Get analytics reports',
          },
          {
            name: 'List Accounts',
            path: '/v3/management/accounts',
            method: 'GET',
            description: 'List Google Analytics accounts',
          },
        ],
        isActive: true,
        isPopular: true,
        rating: 4.7,
        reviewCount: 2100,
      },
      {
        id: 'aws_s3',
        name: 'Amazon S3',
        description: 'Object storage service',
        category: 'storage',
        logo: '/logos/aws-s3.png',
        website: 'https://aws.amazon.com/s3',
        documentation: 'https://docs.aws.amazon.com/s3',
        supportedFeatures: ['file_storage', 'backup', 'cdn', 'versioning', 'encryption'],
        pricing: {
          model: 'paid',
          tiers: [
            {
              name: 'Standard',
              price: 0.023,
              currency: 'USD',
              features: ['First 50TB', 'Standard storage', '99.999999999% durability'],
            },
          ],
        },
        authentication: {
          supportedTypes: ['api_key'],
          setupInstructions: 'Create AWS IAM user with S3 permissions and generate access keys',
        },
        endpoints: [
          {
            name: 'Upload Object',
            path: '/{bucket}/{key}',
            method: 'PUT',
            description: 'Upload a file to S3 bucket',
          },
          {
            name: 'Download Object',
            path: '/{bucket}/{key}',
            method: 'GET',
            description: 'Download a file from S3 bucket',
          },
        ],
        isActive: true,
        isPopular: true,
        rating: 4.6,
        reviewCount: 1800,
      },
      {
        id: 'datadog',
        name: 'Datadog',
        description: 'Monitoring and analytics platform',
        category: 'monitoring',
        logo: '/logos/datadog.png',
        website: 'https://www.datadoghq.com',
        documentation: 'https://docs.datadoghq.com/api',
        supportedFeatures: ['infrastructure_monitoring', 'apm', 'logs', 'synthetics', 'security'],
        pricing: {
          model: 'freemium',
          tiers: [
            {
              name: 'Free',
              price: 0,
              currency: 'USD',
              features: ['Up to 5 hosts', '1-day retention', 'Basic metrics'],
            },
            {
              name: 'Pro',
              price: 15,
              currency: 'USD',
              features: ['Unlimited hosts', '15-month retention', 'Advanced features'],
            },
          ],
        },
        authentication: {
          supportedTypes: ['api_key'],
          setupInstructions: 'Generate API and application keys from Datadog settings',
        },
        endpoints: [
          {
            name: 'Send Metrics',
            path: '/api/v1/series',
            method: 'POST',
            description: 'Send custom metrics to Datadog',
          },
          {
            name: 'Query Metrics',
            path: '/api/v1/query',
            method: 'GET',
            description: 'Query metrics data',
          },
        ],
        isActive: true,
        isPopular: true,
        rating: 4.4,
        reviewCount: 650,
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Customer relationship management platform',
        category: 'business',
        logo: '/logos/salesforce.png',
        website: 'https://www.salesforce.com',
        documentation: 'https://developer.salesforce.com/docs',
        supportedFeatures: ['crm', 'sales_automation', 'marketing', 'analytics', 'custom_apps'],
        pricing: {
          model: 'paid',
          tiers: [
            {
              name: 'Essentials',
              price: 25,
              currency: 'USD',
              features: ['Up to 10 users', 'Basic CRM', 'Email integration'],
            },
            {
              name: 'Professional',
              price: 75,
              currency: 'USD',
              features: ['Unlimited users', 'Advanced CRM', 'Customization'],
            },
          ],
        },
        authentication: {
          supportedTypes: ['oauth2'],
          oauthScopes: ['api', 'refresh_token'],
          setupInstructions: 'Create a connected app in Salesforce and configure OAuth settings',
        },
        endpoints: [
          {
            name: 'Create Record',
            path: '/services/data/v52.0/sobjects/{sobjectType}',
            method: 'POST',
            description: 'Create a new record in Salesforce',
          },
          {
            name: 'Query Records',
            path: '/services/data/v52.0/query',
            method: 'GET',
            description: 'Query records using SOQL',
          },
        ],
        isActive: true,
        isPopular: true,
        rating: 4.2,
        reviewCount: 950,
      },
    ]

    providers.forEach(provider => {
      this.providers.set(provider.id, provider)
    })
  }

  private initializeTemplates(): void {
    const templates: IntegrationTemplate[] = [
      {
        id: 'slack_notifications',
        providerId: 'slack',
        name: 'Slack Notifications',
        description: 'Send notifications to Slack channels',
        category: 'communication',
        template: {
          name: 'Slack Integration',
          description: 'Integration with Slack for notifications',
          type: 'rest',
          provider: 'Slack',
          baseUrl: 'https://slack.com',
          authentication: {
            type: 'oauth2',
            credentials: {},
          },
          endpoints: [
            {
              id: 'send_message',
              name: 'Send Message',
              path: '/api/chat.postMessage',
              method: 'POST',
              description: 'Send a message to a channel',
              parameters: {
                body: {
                  channel: { type: 'string', required: true },
                  text: { type: 'string', required: true },
                },
              },
              timeout: 5000,
              retryCount: 3,
              isActive: true,
            },
          ],
          rateLimits: {
            requestsPerMinute: 20,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
          },
          retryPolicy: {
            maxRetries: 3,
            backoffMultiplier: 2,
            maxBackoffDelay: 30000,
          },
          isActive: true,
        },
        setupSteps: [
          {
            step: 1,
            title: 'Create Slack App',
            description: 'Go to api.slack.com and create a new app',
            type: 'form',
            fields: [
              {
                name: 'app_name',
                type: 'text',
                label: 'App Name',
                placeholder: 'My Integration App',
                required: true,
              },
              {
                name: 'workspace',
                type: 'select',
                label: 'Development Workspace',
                required: true,
                options: [
                  { value: 'workspace1', label: 'My Workspace' },
                ],
              },
            ],
          },
          {
            step: 2,
            title: 'Configure OAuth',
            description: 'Set up OAuth2 settings and scopes',
            type: 'oauth',
          },
          {
            step: 3,
            title: 'Install App',
            description: 'Install the app to your workspace',
            type: 'form',
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'google_analytics_reports',
        providerId: 'google_analytics',
        name: 'Google Analytics Reports',
        description: 'Fetch analytics data from Google Analytics',
        category: 'analytics',
        template: {
          name: 'Google Analytics Integration',
          description: 'Integration with Google Analytics for reporting',
          type: 'rest',
          provider: 'Google Analytics',
          baseUrl: 'https://analyticsreporting.googleapis.com',
          authentication: {
            type: 'oauth2',
            credentials: {},
          },
          endpoints: [
            {
              id: 'get_reports',
              name: 'Get Reports',
              path: '/v4/reports:batchGet',
              method: 'POST',
              description: 'Get analytics reports',
              parameters: {
                body: {
                  reportRequests: { type: 'array', required: true },
                },
              },
              timeout: 10000,
              retryCount: 3,
              isActive: true,
            },
          ],
          rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 10000,
            requestsPerDay: 100000,
          },
          retryPolicy: {
            maxRetries: 3,
            backoffMultiplier: 2,
            maxBackoffDelay: 30000,
          },
          isActive: true,
        },
        setupSteps: [
          {
            step: 1,
            title: 'Create Google Cloud Project',
            description: 'Create a new project in Google Cloud Console',
            type: 'form',
            fields: [
              {
                name: 'project_name',
                type: 'text',
                label: 'Project Name',
                placeholder: 'My Analytics Project',
                required: true,
              },
            ],
          },
          {
            step: 2,
            title: 'Enable Analytics API',
            description: 'Enable the Google Analytics Reporting API',
            type: 'form',
          },
          {
            step: 3,
            title: 'Configure OAuth',
            description: 'Set up OAuth2 credentials and scopes',
            type: 'oauth',
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  // Provider Management
  async getProviders(category?: string): Promise<ThirdPartyProvider[]> {
    let providers = Array.from(this.providers.values())
    
    if (category) {
      providers = providers.filter(provider => provider.category === category)
    }
    
    return providers.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1
      if (!a.isPopular && b.isPopular) return 1
      return b.rating - a.rating
    })
  }

  async getProvider(providerId: string): Promise<ThirdPartyProvider | null> {
    return this.providers.get(providerId) || null
  }

  async getPopularProviders(): Promise<ThirdPartyProvider[]> {
    return Array.from(this.providers.values())
      .filter(provider => provider.isPopular)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
  }

  // Template Management
  async getTemplates(providerId?: string): Promise<IntegrationTemplate[]> {
    let templates = Array.from(this.templates.values())
    
    if (providerId) {
      templates = templates.filter(template => template.providerId === providerId)
    }
    
    return templates.filter(template => template.isActive)
  }

  async getTemplate(templateId: string): Promise<IntegrationTemplate | null> {
    return this.templates.get(templateId) || null
  }

  // Integration Creation
  async createIntegrationFromTemplate(
    templateId: string,
    organizationId: string,
    createdBy: string,
    configuration: Record<string, any>
  ): Promise<ApiIntegration | null> {
    const template = this.templates.get(templateId)
    if (!template) return null

    const integrationData = {
      ...template.template,
      ...configuration,
      organizationId,
      createdBy,
    } as Omit<ApiIntegration, 'id' | 'createdAt' | 'updatedAt'>

    return await apiIntegrationSystem.createIntegration(integrationData)
  }

  // Search and Discovery
  async searchProviders(query: string): Promise<ThirdPartyProvider[]> {
    const searchTerm = query.toLowerCase()
    return Array.from(this.providers.values())
      .filter(provider => 
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.description.toLowerCase().includes(searchTerm) ||
        provider.supportedFeatures.some(feature => feature.toLowerCase().includes(searchTerm))
      )
  }

  async getProvidersByCategory(): Promise<Record<string, ThirdPartyProvider[]>> {
    const categories: Record<string, ThirdPartyProvider[]> = {}
    
    Array.from(this.providers.values()).forEach(provider => {
      if (!categories[provider.category]) {
        categories[provider.category] = []
      }
      categories[provider.category].push(provider)
    })
    
    return categories
  }

  // Statistics
  async getIntegrationStats(): Promise<{
    totalProviders: number
    totalTemplates: number
    categoriesCount: number
    popularProviders: number
  }> {
    const providers = Array.from(this.providers.values())
    const templates = Array.from(this.templates.values())
    const categories = new Set(providers.map(p => p.category))
    
    return {
      totalProviders: providers.length,
      totalTemplates: templates.length,
      categoriesCount: categories.size,
      popularProviders: providers.filter(p => p.isPopular).length,
    }
  }
}

export const thirdPartyIntegrationsSystem = new ThirdPartyIntegrationsSystem()


