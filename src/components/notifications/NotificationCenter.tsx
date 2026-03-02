import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Filter,
  Search,
  Settings,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Users,
  MessageCircle,
  Shield,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react'
import { notificationSystem, Notification, NotificationPreferences, NotificationStats } from '@/lib/notifications/notification-system'

export interface NotificationCenterProps {
  userId: string
  onNotificationClick?: (notification: Notification) => void
  onPreferencesChange?: (preferences: NotificationPreferences) => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  onNotificationClick,
  onPreferencesChange,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'category'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPreferences, setShowPreferences] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load notifications
    const userNotifications = notificationSystem.getNotifications(userId, 50)
    setNotifications(userNotifications)

    // Load stats
    const userStats = notificationSystem.getNotificationStats(userId)
    setStats(userStats)

    // Load preferences
    const userPreferences = notificationSystem.getPreferences(userId)
    setPreferences(userPreferences)

    // Set up notification listener
    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      setStats(prev => prev ? {
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        byCategory: {
          ...prev.byCategory,
          [notification.category]: (prev.byCategory[notification.category] || 0) + 1,
        },
        byPriority: {
          ...prev.byPriority,
          [notification.priority]: (prev.byPriority[notification.priority] || 0) + 1,
        },
        byType: {
          ...prev.byType,
          [notification.type]: (prev.byType[notification.type] || 0) + 1,
        },
        recentActivity: prev.recentActivity + 1,
      } : null)
    }

    notificationSystem.addNotificationListener(userId, handleNewNotification)

    return () => {
      notificationSystem.removeNotificationListener(userId, handleNewNotification)
    }
  }, [userId])

  useEffect(() => {
    // Apply filters
    let filtered = notifications

    // Filter by read status
    if (activeFilter === 'unread') {
      filtered = filtered.filter(n => !n.read)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, activeFilter, selectedCategory, searchTerm])

  const handleMarkAsRead = (notificationId: string) => {
    notificationSystem.markAsRead(userId, notificationId)
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setStats(prev => prev ? { ...prev, unread: prev.unread - 1 } : null)
  }

  const handleMarkAllAsRead = () => {
    notificationSystem.markAllAsRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setStats(prev => prev ? { ...prev, unread: 0 } : null)
  }

  const handleDeleteNotification = (notificationId: string) => {
    notificationSystem.deleteNotification(userId, notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setStats(prev => prev ? { ...prev, total: prev.total - 1 } : null)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    onNotificationClick?.(notification)
  }

  const handlePreferencesUpdate = (newPreferences: Partial<NotificationPreferences>) => {
    if (!preferences) return

    const updatedPreferences = { ...preferences, ...newPreferences }
    setPreferences(updatedPreferences)
    notificationSystem.setPreferences(userId, updatedPreferences)
    onPreferencesChange?.(updatedPreferences)
  }

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'collaboration') return <Users className="h-4 w-4" />
    if (category === 'security') return <Shield className="h-4 w-4" />
    if (category === 'performance') return <Zap className="h-4 w-4" />
    
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'info': return <Info className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600'
    if (priority === 'high') return 'text-orange-600'
    
    switch (type) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return date.toLocaleDateString()
  }

  const categories = [
    { id: 'all', name: 'All', count: stats?.total || 0 },
    { id: 'use_case', name: 'Use Cases', count: stats?.byCategory.use_case || 0 },
    { id: 'collaboration', name: 'Collaboration', count: stats?.byCategory.collaboration || 0 },
    { id: 'system', name: 'System', count: stats?.byCategory.system || 0 },
    { id: 'security', name: 'Security', count: stats?.byCategory.security || 0 },
    { id: 'performance', name: 'Performance', count: stats?.byCategory.performance || 0 },
  ]

  return (
    <div className="relative">
      {/* Notification Bell */}
      <EnhancedButton
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {stats && stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </EnhancedButton>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notifications</h3>
              {stats && stats.unread > 0 && (
                <EnhancedBadge variant="destructive" className="text-xs">
                  {stats.unread} new
                </EnhancedBadge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPreferences(!showPreferences)}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </EnhancedButton>
              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </EnhancedButton>
            </div>
          </div>

          {/* Preferences Panel */}
          {showPreferences && preferences && (
            <div className="p-4 border-b bg-muted/50">
              <h4 className="font-medium mb-3">Notification Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">In-app notifications</span>
                  <EnhancedButton
                    variant={preferences.inApp ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferencesUpdate({ inApp: !preferences.inApp })}
                  >
                    {preferences.inApp ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </EnhancedButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email notifications</span>
                  <EnhancedButton
                    variant={preferences.email ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferencesUpdate({ email: !preferences.email })}
                  >
                    {preferences.email ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </EnhancedButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push notifications</span>
                  <EnhancedButton
                    variant={preferences.push ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferencesUpdate({ push: !preferences.push })}
                  >
                    {preferences.push ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </EnhancedButton>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <EnhancedInput
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                <EnhancedButton
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </EnhancedButton>
                <EnhancedButton
                  variant={activeFilter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('unread')}
                >
                  Unread
                </EnhancedButton>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {categories.map((category) => (
                <EnhancedButton
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                  {category.count > 0 && (
                    <span className="ml-1 text-xs">({category.count})</span>
                  )}
                </EnhancedButton>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredNotifications.length} notifications
              </span>
              <div className="flex gap-2">
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={stats?.unread === 0}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </EnhancedButton>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <EnhancedBadge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </EnhancedBadge>
                            <EnhancedButton
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </EnhancedButton>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(notification.timestamp)}</span>
                            <EnhancedBadge variant="outline" className="text-xs">
                              {notification.category}
                            </EnhancedBadge>
                          </div>
                          {notification.actionUrl && (
                            <ExternalLink className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <EnhancedButton
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </EnhancedButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter


