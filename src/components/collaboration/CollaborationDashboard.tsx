import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedModal, EnhancedModalContent } from '@/components/ui/enhanced-modal'
import { 
  Users, 
  MessageCircle, 
  Bell, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  UserPlus,
  Settings,
  Eye,
  Edit,
  Share,
  Download,
  Filter,
  Search,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import { CollaborationPanel } from './CollaborationPanel'
import { NotificationCenter } from '../notifications/NotificationCenter'
import { TeamManagement } from './TeamManagement'
import { RealTimeComments } from './RealTimeComments'

export interface CollaborationStats {
  totalMembers: number
  activeMembers: number
  pendingInvitations: number
  totalComments: number
  unreadNotifications: number
  recentActivity: number
  collaborationScore: number
  responseTime: number
  engagementRate: number
}

export interface RecentActivity {
  id: string
  type: 'comment' | 'mention' | 'invitation' | 'update' | 'reaction'
  user: {
    id: string
    name: string
    avatar?: string
  }
  action: string
  target: string
  timestamp: Date
  metadata?: any
}

export interface CollaborationDashboardProps {
  organizationId: string
  currentUserId: string
  resourceId?: string
  resourceType?: 'use_case' | 'assessment' | 'document' | 'dashboard'
}

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({
  organizationId,
  currentUserId,
  resourceId,
  resourceType = 'use_case',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'comments' | 'activity'>('overview')
  const [stats, setStats] = useState<CollaborationStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockStats: CollaborationStats = {
      totalMembers: 12,
      activeMembers: 8,
      pendingInvitations: 2,
      totalComments: 45,
      unreadNotifications: 7,
      recentActivity: 23,
      collaborationScore: 85,
      responseTime: 2.5,
      engagementRate: 78,
    }

    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'comment',
        user: { id: 'user1', name: 'John Doe' },
        action: 'commented on',
        target: 'EU AI Act Assessment',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: '2',
        type: 'mention',
        user: { id: 'user2', name: 'Jane Smith' },
        action: 'mentioned you in',
        target: 'Risk Assessment',
        timestamp: new Date(Date.now() - 600000),
      },
      {
        id: '3',
        type: 'invitation',
        user: { id: 'user3', name: 'Bob Wilson' },
        action: 'invited',
        target: 'Alice Brown',
        timestamp: new Date(Date.now() - 900000),
      },
      {
        id: '4',
        type: 'update',
        user: { id: 'user4', name: 'Alice Brown' },
        action: 'updated',
        target: 'Data Governance Policy',
        timestamp: new Date(Date.now() - 1200000),
      },
      {
        id: '5',
        type: 'reaction',
        user: { id: 'user1', name: 'John Doe' },
        action: 'reacted to your comment in',
        target: 'Technical Feasibility',
        timestamp: new Date(Date.now() - 1500000),
      },
    ]

    setStats(mockStats)
    setRecentActivity(mockActivity)
  }, [organizationId])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-600" />
      case 'mention': return <Users className="h-4 w-4 text-purple-600" />
      case 'invitation': return <UserPlus className="h-4 w-4 text-green-600" />
      case 'update': return <Edit className="h-4 w-4 text-orange-600" />
      case 'reaction': return <TrendingUp className="h-4 w-4 text-pink-600" />
    }
  }

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'comment': return 'bg-blue-100 text-blue-800'
      case 'mention': return 'bg-purple-100 text-purple-800'
      case 'invitation': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-orange-100 text-orange-800'
      case 'reaction': return 'bg-pink-100 text-pink-800'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'activity', label: 'Activity', icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collaboration Hub</h2>
          <p className="text-muted-foreground">
            Manage team collaboration, comments, and real-time activities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationCenter
            userId={currentUserId}
            onNotificationClick={(notification) => {
              console.log('Notification clicked:', notification)
            }}
          />
          <EnhancedButton
            variant="outline"
            onClick={() => setShowTeamModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Team Settings
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.collaborationScore || 0}%</p>
                    <p className="text-sm text-muted-foreground">Collaboration Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.responseTime || 0}h</p>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Activity Trends
                </CardTitle>
                <CardDescription>
                  Collaboration activity over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Activity chart would be rendered here</p>
                    <p className="text-sm">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Team Distribution
                </CardTitle>
                <CardDescription>
                  Role distribution across the team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Owners</span>
                    </div>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Admins</span>
                    </div>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Members</span>
                    </div>
                    <span className="text-sm font-medium">6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                      <span className="text-sm">Viewers</span>
                    </div>
                    <span className="text-sm font-medium">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest collaboration activities across the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{activity.user.name}</span>
                        <span className="text-sm text-muted-foreground">{activity.action}</span>
                        <span className="font-medium text-sm">{activity.target}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <EnhancedBadge className={getActivityColor(activity.type)}>
                          {activity.type}
                        </EnhancedBadge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <TeamManagement
          organizationId={organizationId}
          currentUserId={currentUserId}
          onMemberUpdate={(member) => {
            console.log('Member updated:', member)
          }}
          onMemberRemove={(memberId) => {
            console.log('Member removed:', memberId)
          }}
          onInviteSent={(invitation) => {
            console.log('Invitation sent:', invitation)
          }}
        />
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comments & Discussions</h3>
              <p className="text-sm text-muted-foreground">
                Manage comments and discussions across all resources
              </p>
            </div>
            <EnhancedButton onClick={() => setShowCommentsModal(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              View All Comments
            </EnhancedButton>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Comments Overview</h3>
                <p className="mb-4">
                  View and manage comments across all your use cases, assessments, and documents.
                </p>
                <EnhancedButton onClick={() => setShowCommentsModal(true)}>
                  Open Comments Panel
                </EnhancedButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Activity Feed</h3>
              <p className="text-sm text-muted-foreground">
                Track all collaboration activities and changes
              </p>
            </div>
            <div className="flex gap-2">
              <EnhancedButton variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </EnhancedButton>
              <EnhancedButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </EnhancedButton>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Activities</CardTitle>
              <CardDescription>
                Complete activity log with filtering and search capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{activity.user.name}</span>
                        <span className="text-muted-foreground">{activity.action}</span>
                        <span className="font-medium">{activity.target}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <EnhancedBadge className={getActivityColor(activity.type)}>
                          {activity.type}
                        </EnhancedBadge>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Resource: {resourceType} • Organization: {organizationId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <EnhancedModal
        open={showTeamModal}
        onOpenChange={(open) => setShowTeamModal(open)}
      >
        <EnhancedModalContent
          title="Team Management"
          variant="info"
          size="lg"
          onClose={() => setShowTeamModal(false)}
        >
          <TeamManagement
            organizationId={organizationId}
            currentUserId={currentUserId}
            onMemberUpdate={(member) => {
              console.log('Member updated:', member)
              setShowTeamModal(false)
            }}
            onMemberRemove={(memberId) => {
              console.log('Member removed:', memberId)
            }}
            onInviteSent={(invitation) => {
              console.log('Invitation sent:', invitation)
            }}
          />
        </EnhancedModalContent>
      </EnhancedModal>

      <EnhancedModal
        open={showCommentsModal}
        onOpenChange={(open) => setShowCommentsModal(open)}
      >
        <EnhancedModalContent
          title="Comments & Discussions"
          variant="info"
          size="lg"
          onClose={() => setShowCommentsModal(false)}
        >
          {resourceId ? (
            <RealTimeComments
              resourceId={resourceId}
              resourceType={resourceType}
              currentUserId={currentUserId}
              onCommentAdd={(comment) => {
                console.log('Comment added:', comment)
              }}
              onCommentUpdate={(comment) => {
                console.log('Comment updated:', comment)
              }}
              onCommentDelete={(commentId) => {
                console.log('Comment deleted:', commentId)
              }}
              onReactionToggle={(commentId, reaction, userId) => {
                console.log('Reaction toggled:', { commentId, reaction, userId })
              }}
              onMentionUser={(userId) => {
                console.log('User mentioned:', userId)
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Resource Selected</h3>
              <p>Select a use case, assessment, or document to view comments.</p>
            </div>
          )}
        </EnhancedModalContent>
      </EnhancedModal>
    </div>
  )
}

export default CollaborationDashboard


