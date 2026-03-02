// Real-time collaboration system for use cases

export interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
  currentActivity?: string
}

export interface CollaborationSession {
  id: string
  useCaseId: string
  participants: CollaborationUser[]
  activeUsers: string[]
  createdAt: Date
  lastActivity: Date
  isActive: boolean
}

export interface CollaborationEvent {
  id: string
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor_move' | 'selection_change' | 'typing'
  userId: string
  useCaseId: string
  timestamp: Date
  data: any
  metadata?: any
}

export interface CursorPosition {
  userId: string
  userName: string
  x: number
  y: number
  field?: string
  timestamp: Date
}

export interface SelectionRange {
  userId: string
  userName: string
  start: number
  end: number
  field: string
  timestamp: Date
}

export interface TypingIndicator {
  userId: string
  userName: string
  field: string
  isTyping: boolean
  timestamp: Date
}

export interface CollaborationComment {
  id: string
  useCaseId: string
  field?: string
  content: string
  author: CollaborationUser
  createdAt: Date
  updatedAt: Date
  replies: CollaborationComment[]
  resolved: boolean
  mentions: string[]
  reactions: Record<string, string[]>
}

export interface CollaborationPermission {
  userId: string
  permissions: {
    canEdit: boolean
    canComment: boolean
    canInvite: boolean
    canDelete: boolean
    canManagePermissions: boolean
  }
}

class RealtimeCollaborationSystem {
  private sessions: Map<string, CollaborationSession> = new Map()
  private activeCursors: Map<string, CursorPosition> = new Map()
  private activeSelections: Map<string, SelectionRange> = new Map()
  private typingIndicators: Map<string, TypingIndicator> = new Map()
  private comments: Map<string, CollaborationComment[]> = new Map()
  private permissions: Map<string, CollaborationPermission[]> = new Map()
  private eventListeners: Map<string, ((event: CollaborationEvent) => void)[]> = new Map()

  constructor() {
    this.initializeEventHandlers()
  }

  private initializeEventHandlers() {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions()
    }, 5 * 60 * 1000)

    // Clean up stale cursors every 30 seconds
    setInterval(() => {
      this.cleanupStaleCursors()
    }, 30 * 1000)

    // Clean up stale typing indicators every 10 seconds
    setInterval(() => {
      this.cleanupStaleTypingIndicators()
    }, 10 * 1000)
  }

  // Session Management
  createSession(useCaseId: string, user: CollaborationUser): CollaborationSession {
    const session: CollaborationSession = {
      id: `session_${useCaseId}_${Date.now()}`,
      useCaseId,
      participants: [user],
      activeUsers: [user.id],
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    }

    this.sessions.set(useCaseId, session)
    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'join',
      userId: user.id,
      useCaseId,
      timestamp: new Date(),
      data: { user },
    })

    return session
  }

  joinSession(useCaseId: string, user: CollaborationUser): CollaborationSession | null {
    const session = this.sessions.get(useCaseId)
    if (!session) return null

    // Check if user already exists
    const existingUser = session.participants.find(p => p.id === user.id)
    if (existingUser) {
      existingUser.status = 'online'
      existingUser.lastSeen = new Date()
    } else {
      session.participants.push(user)
    }

    if (!session.activeUsers.includes(user.id)) {
      session.activeUsers.push(user.id)
    }

    session.lastActivity = new Date()
    session.isActive = true

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'join',
      userId: user.id,
      useCaseId,
      timestamp: new Date(),
      data: { user },
    })

    return session
  }

  leaveSession(useCaseId: string, userId: string): void {
    const session = this.sessions.get(useCaseId)
    if (!session) return

    // Remove from active users
    session.activeUsers = session.activeUsers.filter(id => id !== userId)

    // Update user status
    const user = session.participants.find(p => p.id === userId)
    if (user) {
      user.status = 'offline'
      user.lastSeen = new Date()
    }

    // Clean up user's cursors and selections
    this.activeCursors.delete(userId)
    this.activeSelections.delete(userId)
    this.typingIndicators.delete(userId)

    session.lastActivity = new Date()

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'leave',
      userId,
      useCaseId,
      timestamp: new Date(),
      data: { userId },
    })
  }

  getSession(useCaseId: string): CollaborationSession | null {
    return this.sessions.get(useCaseId) || null
  }

  // Cursor Management
  updateCursor(useCaseId: string, userId: string, userName: string, x: number, y: number, field?: string): void {
    const cursor: CursorPosition = {
      userId,
      userName,
      x,
      y,
      field,
      timestamp: new Date(),
    }

    this.activeCursors.set(userId, cursor)

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'cursor_move',
      userId,
      useCaseId,
      timestamp: new Date(),
      data: { cursor },
    })
  }

  getActiveCursors(useCaseId: string): CursorPosition[] {
    const session = this.sessions.get(useCaseId)
    if (!session) return []

    return Array.from(this.activeCursors.values())
      .filter(cursor => session.activeUsers.includes(cursor.userId))
      .filter(cursor => Date.now() - cursor.timestamp.getTime() < 30000) // 30 seconds
  }

  // Selection Management
  updateSelection(useCaseId: string, userId: string, userName: string, start: number, end: number, field: string): void {
    const selection: SelectionRange = {
      userId,
      userName,
      start,
      end,
      field,
      timestamp: new Date(),
    }

    this.activeSelections.set(userId, selection)

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'selection_change',
      userId,
      useCaseId,
      timestamp: new Date(),
      data: { selection },
    })
  }

  getActiveSelections(useCaseId: string): SelectionRange[] {
    const session = this.sessions.get(useCaseId)
    if (!session) return []

    return Array.from(this.activeSelections.values())
      .filter(selection => session.activeUsers.includes(selection.userId))
      .filter(selection => Date.now() - selection.timestamp.getTime() < 30000) // 30 seconds
  }

  // Typing Indicators
  setTypingIndicator(useCaseId: string, userId: string, userName: string, field: string, isTyping: boolean): void {
    const indicator: TypingIndicator = {
      userId,
      userName,
      field,
      isTyping,
      timestamp: new Date(),
    }

    if (isTyping) {
      this.typingIndicators.set(userId, indicator)
    } else {
      this.typingIndicators.delete(userId)
    }

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'typing',
      userId,
      useCaseId,
      timestamp: new Date(),
      data: { indicator },
    })
  }

  getTypingIndicators(useCaseId: string): TypingIndicator[] {
    const session = this.sessions.get(useCaseId)
    if (!session) return []

    return Array.from(this.typingIndicators.values())
      .filter(indicator => session.activeUsers.includes(indicator.userId))
      .filter(indicator => Date.now() - indicator.timestamp.getTime() < 10000) // 10 seconds
  }

  // Comments System
  addComment(useCaseId: string, comment: Omit<CollaborationComment, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'resolved' | 'reactions'>): CollaborationComment {
    const newComment: CollaborationComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
      resolved: false,
      reactions: {},
    }

    const comments = this.comments.get(useCaseId) || []
    comments.push(newComment)
    this.comments.set(useCaseId, comments)

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'comment',
      userId: comment.author.id,
      useCaseId,
      timestamp: new Date(),
      data: { comment: newComment },
    })

    return newComment
  }

  getComments(useCaseId: string): CollaborationComment[] {
    return this.comments.get(useCaseId) || []
  }

  updateComment(useCaseId: string, commentId: string, updates: Partial<CollaborationComment>): CollaborationComment | null {
    const comments = this.comments.get(useCaseId)
    if (!comments) return null

    const commentIndex = comments.findIndex(c => c.id === commentId)
    if (commentIndex === -1) return null

    const updatedComment = {
      ...comments[commentIndex],
      ...updates,
      updatedAt: new Date(),
    }

    comments[commentIndex] = updatedComment
    this.comments.set(useCaseId, comments)

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'comment',
      userId: updatedComment.author.id,
      useCaseId,
      timestamp: new Date(),
      data: { comment: updatedComment },
    })

    return updatedComment
  }

  deleteComment(useCaseId: string, commentId: string): boolean {
    const comments = this.comments.get(useCaseId)
    if (!comments) return false

    const commentIndex = comments.findIndex(c => c.id === commentId)
    if (commentIndex === -1) return false

    comments.splice(commentIndex, 1)
    this.comments.set(useCaseId, comments)

    return true
  }

  addCommentReaction(useCaseId: string, commentId: string, userId: string, reaction: string): void {
    const comments = this.comments.get(useCaseId)
    if (!comments) return

    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    if (!comment.reactions[reaction]) {
      comment.reactions[reaction] = []
    }

    if (!comment.reactions[reaction].includes(userId)) {
      comment.reactions[reaction].push(userId)
    }

    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'comment',
      userId,
      useCaseId,
      timestamp: new Date(),
      data: { comment, reaction },
    })
  }

  // Permissions Management
  setPermissions(useCaseId: string, permissions: CollaborationPermission[]): void {
    this.permissions.set(useCaseId, permissions)
  }

  getPermissions(useCaseId: string): CollaborationPermission[] {
    return this.permissions.get(useCaseId) || []
  }

  getUserPermissions(useCaseId: string, userId: string): CollaborationPermission | null {
    const permissions = this.permissions.get(useCaseId)
    if (!permissions) return null

    return permissions.find(p => p.userId === userId) || null
  }

  // Event System
  addEventListener(useCaseId: string, callback: (event: CollaborationEvent) => void): void {
    const listeners = this.eventListeners.get(useCaseId) || []
    listeners.push(callback)
    this.eventListeners.set(useCaseId, listeners)
  }

  removeEventListener(useCaseId: string, callback: (event: CollaborationEvent) => void): void {
    const listeners = this.eventListeners.get(useCaseId)
    if (!listeners) return

    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  private emitEvent(event: CollaborationEvent): void {
    const listeners = this.eventListeners.get(event.useCaseId)
    if (!listeners) return

    listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    })
  }

  // Cleanup Methods
  private cleanupInactiveSessions(): void {
    const now = Date.now()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes

    for (const [useCaseId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > inactiveThreshold) {
        session.isActive = false
        session.activeUsers = []
      }
    }
  }

  private cleanupStaleCursors(): void {
    const now = Date.now()
    const staleThreshold = 30 * 1000 // 30 seconds

    for (const [userId, cursor] of this.activeCursors.entries()) {
      if (now - cursor.timestamp.getTime() > staleThreshold) {
        this.activeCursors.delete(userId)
      }
    }
  }

  private cleanupStaleTypingIndicators(): void {
    const now = Date.now()
    const staleThreshold = 10 * 1000 // 10 seconds

    for (const [userId, indicator] of this.typingIndicators.entries()) {
      if (now - indicator.timestamp.getTime() > staleThreshold) {
        this.typingIndicators.delete(userId)
      }
    }
  }

  // Utility Methods
  getActiveUsers(useCaseId: string): CollaborationUser[] {
    const session = this.sessions.get(useCaseId)
    if (!session) return []

    return session.participants.filter(user => 
      session.activeUsers.includes(user.id) && user.status === 'online'
    )
  }

  getUserActivity(useCaseId: string, userId: string): string | null {
    const session = this.sessions.get(useCaseId)
    if (!session) return null

    const user = session.participants.find(p => p.id === userId)
    return user?.currentActivity || null
  }

  setUserActivity(useCaseId: string, userId: string, activity: string): void {
    const session = this.sessions.get(useCaseId)
    if (!session) return

    const user = session.participants.find(p => p.id === userId)
    if (user) {
      user.currentActivity = activity
      user.lastSeen = new Date()
    }
  }

  // Statistics
  getCollaborationStats(useCaseId: string): any {
    const session = this.sessions.get(useCaseId)
    if (!session) return null

    const comments = this.comments.get(useCaseId) || []
    const activeCursors = this.getActiveCursors(useCaseId)
    const activeSelections = this.getActiveSelections(useCaseId)
    const typingIndicators = this.getTypingIndicators(useCaseId)

    return {
      sessionId: session.id,
      participants: session.participants.length,
      activeUsers: session.activeUsers.length,
      totalComments: comments.length,
      activeCursors: activeCursors.length,
      activeSelections: activeSelections.length,
      typingUsers: typingIndicators.length,
      lastActivity: session.lastActivity,
      isActive: session.isActive,
    }
  }
}

// Global collaboration system instance
export const collaborationSystem = new RealtimeCollaborationSystem()

export default collaborationSystem


