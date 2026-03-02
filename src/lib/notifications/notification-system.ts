// Advanced notification system for collaboration and updates

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'collaboration' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'use_case' | 'collaboration' | 'system' | 'security' | 'performance'
  actionUrl?: string
  actionLabel?: string
  metadata?: any
  expiresAt?: Date
  userId: string
  source: string
}

export interface NotificationPreferences {
  userId: string
  email: boolean
  push: boolean
  inApp: boolean
  categories: {
    use_case: boolean
    collaboration: boolean
    system: boolean
    security: boolean
    performance: boolean
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string // HH:MM format
    timezone: string
  }
}

export interface NotificationTemplate {
  id: string
  name: string
  type: string
  category: string
  title: string
  message: string
  variables: string[]
  defaultPriority: string
  defaultExpiry?: number // minutes
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  byType: Record<string, number>
  recentActivity: number
}

class NotificationSystem {
  private notifications: Map<string, Notification[]> = new Map()
  private preferences: Map<string, NotificationPreferences> = new Map()
  private templates: Map<string, NotificationTemplate> = new Map()
  private listeners: Map<string, ((notification: Notification) => void)[]> = new Map()
  private webSocket: WebSocket | null = null
  private isConnected = false

  constructor() {
    this.initializeTemplates()
    this.initializeWebSocket()
  }

  private initializeTemplates() {
    const templates: NotificationTemplate[] = [
      {
        id: 'use_case_created',
        name: 'Use Case Created',
        type: 'success',
        category: 'use_case',
        title: 'New Use Case Created',
        message: 'A new use case "{useCaseTitle}" has been created by {userName}',
        variables: ['useCaseTitle', 'userName'],
        defaultPriority: 'medium',
      },
      {
        id: 'use_case_updated',
        name: 'Use Case Updated',
        type: 'info',
        category: 'use_case',
        title: 'Use Case Updated',
        message: 'Use case "{useCaseTitle}" has been updated by {userName}',
        variables: ['useCaseTitle', 'userName'],
        defaultPriority: 'medium',
      },
      {
        id: 'collaboration_comment',
        name: 'New Comment',
        type: 'collaboration',
        category: 'collaboration',
        title: 'New Comment',
        message: '{userName} commented on "{useCaseTitle}": "{commentPreview}"',
        variables: ['userName', 'useCaseTitle', 'commentPreview'],
        defaultPriority: 'medium',
      },
      {
        id: 'collaboration_mention',
        name: 'Mentioned in Comment',
        type: 'collaboration',
        category: 'collaboration',
        title: 'You were mentioned',
        message: '{userName} mentioned you in a comment on "{useCaseTitle}"',
        variables: ['userName', 'useCaseTitle'],
        defaultPriority: 'high',
      },
      {
        id: 'evaluation_complete',
        name: 'Evaluation Complete',
        type: 'success',
        category: 'use_case',
        title: 'AI Evaluation Complete',
        message: 'AI evaluation for "{useCaseTitle}" has been completed with a score of {score}/10',
        variables: ['useCaseTitle', 'score'],
        defaultPriority: 'medium',
      },
      {
        id: 'system_maintenance',
        name: 'System Maintenance',
        type: 'warning',
        category: 'system',
        title: 'Scheduled Maintenance',
        message: 'System maintenance is scheduled for {date} from {startTime} to {endTime}',
        variables: ['date', 'startTime', 'endTime'],
        defaultPriority: 'high',
        defaultExpiry: 1440, // 24 hours
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        type: 'error',
        category: 'security',
        title: 'Security Alert',
        message: 'Unusual activity detected: {description}',
        variables: ['description'],
        defaultPriority: 'urgent',
        defaultExpiry: 60, // 1 hour
      },
      {
        id: 'performance_alert',
        name: 'Performance Alert',
        type: 'warning',
        category: 'performance',
        title: 'Performance Issue',
        message: 'Performance degradation detected: {description}',
        variables: ['description'],
        defaultPriority: 'high',
        defaultExpiry: 120, // 2 hours
      },
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  private initializeWebSocket() {
    if (typeof window === 'undefined') return

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
      this.webSocket = new WebSocket(wsUrl)

      this.webSocket.onopen = () => {
        this.isConnected = true
        console.log('Notification WebSocket connected')
      }

      this.webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'notification') {
            this.handleIncomingNotification(data.notification)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.webSocket.onclose = () => {
        this.isConnected = false
        console.log('Notification WebSocket disconnected')
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.initializeWebSocket()
        }, 5000)
      }

      this.webSocket.onerror = (error) => {
        console.error('Notification WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  // Notification Management
  createNotification(
    userId: string,
    templateId: string,
    variables: Record<string, string>,
    overrides: Partial<Notification> = {}
  ): Notification {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // Replace variables in title and message
    let title = template.title
    let message = template.message

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      title = title.replace(new RegExp(placeholder, 'g'), value)
      message = message.replace(new RegExp(placeholder, 'g'), value)
    })

    const notification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type as any,
      title,
      message,
      timestamp: new Date(),
      read: false,
      priority: template.defaultPriority as any,
      category: template.category as any,
      userId,
      source: 'system',
      ...overrides,
    }

    // Set expiry if template has default expiry
    if (template.defaultExpiry) {
      notification.expiresAt = new Date(Date.now() + template.defaultExpiry * 60 * 1000)
    }

    this.addNotification(notification)
    return notification
  }

  addNotification(notification: Notification): void {
    const userNotifications = this.notifications.get(notification.userId) || []
    userNotifications.unshift(notification)
    this.notifications.set(notification.userId, userNotifications)

    // Emit to listeners
    this.emitNotification(notification)

    // Send via WebSocket if connected
    if (this.isConnected && this.webSocket) {
      this.webSocket.send(JSON.stringify({
        type: 'notification',
        notification,
      }))
    }

    // Check if notification should be sent immediately
    const preferences = this.preferences.get(notification.userId)
    if (preferences?.inApp) {
      this.showInAppNotification(notification)
    }
  }

  getNotifications(userId: string, limit?: number): Notification[] {
    const userNotifications = this.notifications.get(userId) || []
    const filtered = userNotifications.filter(n => !n.expiresAt || n.expiresAt > new Date())
    
    return limit ? filtered.slice(0, limit) : filtered
  }

  getUnreadNotifications(userId: string): Notification[] {
    const userNotifications = this.notifications.get(userId) || []
    return userNotifications.filter(n => !n.read && (!n.expiresAt || n.expiresAt > new Date()))
  }

  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId)
    if (!userNotifications) return

    const notification = userNotifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId)
    if (!userNotifications) return

    userNotifications.forEach(notification => {
      notification.read = true
    })
  }

  deleteNotification(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId)
    if (!userNotifications) return

    const index = userNotifications.findIndex(n => n.id === notificationId)
    if (index > -1) {
      userNotifications.splice(index, 1)
    }
  }

  // Preferences Management
  setPreferences(userId: string, preferences: NotificationPreferences): void {
    this.preferences.set(userId, preferences)
  }

  getPreferences(userId: string): NotificationPreferences | null {
    return this.preferences.get(userId) || null
  }

  // Event System
  addNotificationListener(userId: string, callback: (notification: Notification) => void): void {
    const listeners = this.listeners.get(userId) || []
    listeners.push(callback)
    this.listeners.set(userId, listeners)
  }

  removeNotificationListener(userId: string, callback: (notification: Notification) => void): void {
    const listeners = this.listeners.get(userId)
    if (!listeners) return

    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  private emitNotification(notification: Notification): void {
    const listeners = this.listeners.get(notification.userId)
    if (!listeners) return

    listeners.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })
  }

  // Browser Notifications
  private async showInAppNotification(notification: Notification): Promise<void> {
    if (typeof window === 'undefined') return

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return
      }
    }

    // Show notification
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
      })

      browserNotification.onclick = () => {
        window.focus()
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl
        }
        browserNotification.close()
      }

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close()
        }, 5000)
      }
    }
  }

  // Statistics
  getNotificationStats(userId: string): NotificationStats {
    const userNotifications = this.notifications.get(userId) || []
    const unread = userNotifications.filter(n => !n.read)
    const recent = userNotifications.filter(n => 
      Date.now() - n.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    )

    const byCategory = userNotifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPriority = userNotifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = userNotifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: userNotifications.length,
      unread: unread.length,
      byCategory,
      byPriority,
      byType,
      recentActivity: recent.length,
    }
  }

  // Cleanup
  cleanupExpiredNotifications(): void {
    const now = new Date()
    
    for (const [userId, notifications] of this.notifications.entries()) {
      const validNotifications = notifications.filter(n => 
        !n.expiresAt || n.expiresAt > now
      )
      
      if (validNotifications.length !== notifications.length) {
        this.notifications.set(userId, validNotifications)
      }
    }
  }

  // Bulk Operations
  createBulkNotifications(
    userIds: string[],
    templateId: string,
    variables: Record<string, string>,
    overrides: Partial<Notification> = {}
  ): Notification[] {
    return userIds.map(userId => 
      this.createNotification(userId, templateId, variables, overrides)
    )
  }

  // Template Management
  getTemplate(templateId: string): NotificationTemplate | null {
    return this.templates.get(templateId) || null
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values())
  }

  // Utility Methods
  isInQuietHours(userId: string): boolean {
    const preferences = this.preferences.get(userId)
    if (!preferences?.quietHours.enabled) return false

    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    const start = preferences.quietHours.start
    const end = preferences.quietHours.end

    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end
    }

    return currentTime >= start && currentTime <= end
  }

  shouldSendNotification(userId: string, notification: Notification): boolean {
    const preferences = this.preferences.get(userId)
    if (!preferences) return true

    // Check if category is enabled
    if (!preferences.categories[notification.category]) return false

    // Check quiet hours
    if (this.isInQuietHours(userId) && notification.priority !== 'urgent') {
      return false
    }

    return true
  }
}

// Global notification system instance
export const notificationSystem = new NotificationSystem()

// Cleanup expired notifications every hour
setInterval(() => {
  notificationSystem.cleanupExpiredNotifications()
}, 60 * 60 * 1000)

export default notificationSystem


