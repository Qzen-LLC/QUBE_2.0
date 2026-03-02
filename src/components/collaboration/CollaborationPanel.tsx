import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { 
  Users, 
  MessageCircle, 
  Eye, 
  Edit3, 
  Send,
  MoreHorizontal,
  Smile,
  Reply,
  Check,
  X,
  Plus,
  Settings,
  Bell,
  BellOff
} from 'lucide-react'
import { collaborationSystem, CollaborationUser, CollaborationComment, CursorPosition, SelectionRange, TypingIndicator } from '@/lib/collaboration/realtime-collaboration'

export interface CollaborationPanelProps {
  useCaseId: string
  currentUser: CollaborationUser
  onUserJoin?: (user: CollaborationUser) => void
  onUserLeave?: (userId: string) => void
  onCommentAdd?: (comment: CollaborationComment) => void
  onCursorMove?: (cursor: CursorPosition) => void
  onSelectionChange?: (selection: SelectionRange) => void
  onTypingChange?: (indicator: TypingIndicator) => void
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  useCaseId,
  currentUser,
  onUserJoin,
  onUserLeave,
  onCommentAdd,
  onCursorMove,
  onSelectionChange,
  onTypingChange,
}) => {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([])
  const [comments, setComments] = useState<CollaborationComment[]>([])
  const [activeCursors, setActiveCursors] = useState<CursorPosition[]>([])
  const [activeSelections, setActiveSelections] = useState<SelectionRange[]>([])
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(true)
  const [showUsers, setShowUsers] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Join collaboration session
    const session = collaborationSystem.joinSession(useCaseId, currentUser)
    if (session) {
      setActiveUsers(session.participants.filter(p => p.status === 'online'))
    }

    // Set up event listeners
    const handleCollaborationEvent = (event: any) => {
      switch (event.type) {
        case 'join':
          setActiveUsers(prev => {
            const existing = prev.find(u => u.id === event.data.user.id)
            if (existing) {
              return prev.map(u => u.id === event.data.user.id ? { ...u, status: 'online' } : u)
            }
            return [...prev, event.data.user]
          })
          onUserJoin?.(event.data.user)
          break

        case 'leave':
          setActiveUsers(prev => prev.filter(u => u.id !== event.data.userId))
          onUserLeave?.(event.data.userId)
          break

        case 'comment':
          setComments(prev => {
            const existing = prev.find(c => c.id === event.data.comment.id)
            if (existing) {
              return prev.map(c => c.id === event.data.comment.id ? event.data.comment : c)
            }
            return [...prev, event.data.comment]
          })
          onCommentAdd?.(event.data.comment)
          break

        case 'cursor_move':
          setActiveCursors(prev => {
            const filtered = prev.filter(c => c.userId !== event.data.cursor.userId)
            return [...filtered, event.data.cursor]
          })
          onCursorMove?.(event.data.cursor)
          break

        case 'selection_change':
          setActiveSelections(prev => {
            const filtered = prev.filter(s => s.userId !== event.data.selection.userId)
            return [...filtered, event.data.selection]
          })
          onSelectionChange?.(event.data.selection)
          break

        case 'typing':
          setTypingIndicators(prev => {
            const filtered = prev.filter(t => t.userId !== event.data.indicator.userId)
            if (event.data.indicator.isTyping) {
              return [...filtered, event.data.indicator]
            }
            return filtered
          })
          onTypingChange?.(event.data.indicator)
          break
      }
    }

    collaborationSystem.addEventListener(useCaseId, handleCollaborationEvent)

    // Load existing comments
    const existingComments = collaborationSystem.getComments(useCaseId)
    setComments(existingComments)

    // Cleanup
    return () => {
      collaborationSystem.removeEventListener(useCaseId, handleCollaborationEvent)
      collaborationSystem.leaveSession(useCaseId, currentUser.id)
    }
  }, [useCaseId, currentUser, onUserJoin, onUserLeave, onCommentAdd, onCursorMove, onSelectionChange, onTypingChange])

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = collaborationSystem.addComment(useCaseId, {
      useCaseId,
      content: newComment.trim(),
      author: currentUser,
      mentions: extractMentions(newComment),
    })

    setNewComment('')
    setReplyingTo(null)
  }

  const handleTyping = (value: string) => {
    setNewComment(value)

    // Set typing indicator
    if (!isTyping && value.trim()) {
      setIsTyping(true)
      collaborationSystem.setTypingIndicator(useCaseId, currentUser.id, currentUser.name, 'comment', true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      collaborationSystem.setTypingIndicator(useCaseId, currentUser.id, currentUser.name, 'comment', false)
    }, 1000)
  }

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }

    return mentions
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
    ]
    const index = userId.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Collaboration</h3>
        </div>
        <div className="flex items-center gap-2">
          <EnhancedButton
            variant="ghost"
            size="icon-sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </EnhancedButton>
          <EnhancedButton
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowUsers(!showUsers)}
            title={showUsers ? 'Hide users' : 'Show users'}
          >
            <Users className="h-4 w-4" />
          </EnhancedButton>
          <EnhancedButton
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowComments(!showComments)}
            title={showComments ? 'Hide comments' : 'Show comments'}
          >
            <MessageCircle className="h-4 w-4" />
          </EnhancedButton>
        </div>
      </div>

      {/* Active Users */}
      {showUsers && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Active Users ({activeUsers.length})
          </h4>
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full ${getUserColor(user.id)} flex items-center justify-center text-white text-sm font-medium`}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      getUserInitials(user.name)
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                </div>
                <EnhancedBadge variant="outline" className="text-xs">
                  {user.currentActivity || 'Viewing'}
                </EnhancedBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Cursors */}
      {activeCursors.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-3">Active Cursors</h4>
          <div className="space-y-2">
            {activeCursors.map((cursor) => (
              <div key={cursor.userId} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${getUserColor(cursor.userId)}`} />
                <span className="font-medium">{cursor.userName}</span>
                <span className="text-muted-foreground">
                  {cursor.field ? `editing ${cursor.field}` : 'viewing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typing Indicators */}
      {typingIndicators.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-3">Typing</h4>
          <div className="space-y-2">
            {typingIndicators.map((indicator) => (
              <div key={indicator.userId} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${getUserColor(indicator.userId)}`} />
                <span>{indicator.userName} is typing...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </h4>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${getUserColor(comment.author.id)} flex items-center justify-center text-white text-sm font-medium`}>
                    {comment.author.avatar ? (
                      <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      getUserInitials(comment.author.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                      {comment.resolved && (
                        <EnhancedBadge variant="success" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Resolved
                        </EnhancedBadge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                    
                    {/* Reactions */}
                    {Object.keys(comment.reactions).length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {Object.entries(comment.reactions).map(([reaction, userIds]) => (
                          <EnhancedButton
                            key={reaction}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Smile className="h-3 w-3 mr-1" />
                            {reaction} {userIds.length}
                          </EnhancedButton>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </EnhancedButton>
                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        <Smile className="h-3 w-3 mr-1" />
                        React
                      </EnhancedButton>
                      {comment.author.id === currentUser.id && (
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </EnhancedButton>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-11 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full ${getUserColor(reply.author.id)} flex items-center justify-center text-white text-xs font-medium`}>
                          {reply.author.avatar ? (
                            <img src={reply.author.avatar} alt={reply.author.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            getUserInitials(reply.author.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{reply.author.name}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(reply.createdAt)}</span>
                          </div>
                          <p className="text-xs text-foreground">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="p-4 border-t">
            <div className="space-y-3">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Reply className="h-4 w-4" />
                  <span>Replying to comment</span>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-3 w-3" />
                  </EnhancedButton>
                </div>
              )}
              
              <EnhancedInput
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </div>
                <EnhancedButton
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollaborationPanel


