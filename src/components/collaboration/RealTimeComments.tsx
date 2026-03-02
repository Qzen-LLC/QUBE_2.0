import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { 
  MessageCircle, 
  Send, 
  Edit, 
  Trash2, 
  Reply, 
  MoreHorizontal, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  Pin,
  CheckCircle,
  Clock,
  User,
  AtSign,
  Heart,
  Hash,
  Paperclip,
  Smile,
  Image,
  ExternalLink,
  FileText
} from 'lucide-react'

export interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: Date
  editedAt?: Date
  replies: Comment[]
  reactions: {
    thumbsUp: string[]
    thumbsDown: string[]
    heart: string[]
    laugh: string[]
  }
  mentions: string[]
  attachments: {
    id: string
    name: string
    type: string
    url: string
    size: number
  }[]
  isPinned: boolean
  isResolved: boolean
  metadata?: {
    threadId?: string
    parentId?: string
    context?: {
      section?: string
      lineNumber?: number
      elementId?: string
    }
  }
}

export interface RealTimeCommentsProps {
  resourceId: string
  resourceType: 'use_case' | 'assessment' | 'document' | 'dashboard'
  currentUserId: string
  onCommentAdd?: (comment: Comment) => void
  onCommentUpdate?: (comment: Comment) => void
  onCommentDelete?: (commentId: string) => void
  onReactionToggle?: (commentId: string, reaction: string, userId: string) => void
  onMentionUser?: (userId: string) => void
}

export const RealTimeComments: React.FC<RealTimeCommentsProps> = ({
  resourceId,
  resourceType,
  currentUserId,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  onReactionToggle,
  onMentionUser,
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'reactions'>('newest')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [mentions, setMentions] = useState<string[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: '1',
        content: 'This use case looks comprehensive. I think we should consider adding more details about the data privacy requirements.',
        author: {
          id: 'user1',
          name: 'John Doe',
          email: 'john.doe@company.com',
        },
        timestamp: new Date(Date.now() - 3600000),
        replies: [],
        reactions: {
          thumbsUp: ['user2', 'user3'],
          thumbsDown: [],
          heart: ['user4'],
          laugh: [],
        },
        mentions: [],
        attachments: [],
        isPinned: false,
        isResolved: false,
        metadata: {
          context: {
            section: 'data_privacy',
          },
        },
      },
      {
        id: '2',
        content: 'Great point @john.doe! We should also consider the EU AI Act compliance requirements.',
        author: {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
        },
        timestamp: new Date(Date.now() - 1800000),
        replies: [
          {
            id: '2-1',
            content: 'Absolutely! The EU AI Act has specific requirements for high-risk AI systems.',
            author: {
              id: 'user3',
              name: 'Bob Wilson',
              email: 'bob.wilson@company.com',
            },
            timestamp: new Date(Date.now() - 900000),
            replies: [],
            reactions: {
              thumbsUp: ['user1', 'user2'],
              thumbsDown: [],
              heart: [],
              laugh: [],
            },
            mentions: ['user2'],
            attachments: [],
            isPinned: false,
            isResolved: false,
            metadata: {
              threadId: '2',
              parentId: '2',
            },
          },
        ],
        reactions: {
          thumbsUp: ['user1', 'user3'],
          thumbsDown: [],
          heart: [],
          laugh: [],
        },
        mentions: ['user1'],
        attachments: [],
        isPinned: true,
        isResolved: false,
        metadata: {
          context: {
            section: 'compliance',
          },
        },
      },
      {
        id: '3',
        content: 'I\'ve uploaded the compliance checklist document for reference.',
        author: {
          id: 'user4',
          name: 'Alice Brown',
          email: 'alice.brown@company.com',
        },
        timestamp: new Date(Date.now() - 300000),
        replies: [],
        reactions: {
          thumbsUp: ['user1', 'user2', 'user3'],
          thumbsDown: [],
          heart: [],
          laugh: [],
        },
        mentions: [],
        attachments: [
          {
            id: 'att1',
            name: 'EU_AI_Act_Checklist.pdf',
            type: 'application/pdf',
            url: '/attachments/eu_ai_act_checklist.pdf',
            size: 1024000,
          },
        ],
        isPinned: false,
        isResolved: true,
        metadata: {
          context: {
            section: 'attachments',
          },
        },
      },
    ]

    setComments(mockComments)
  }, [resourceId, resourceType])

  useEffect(() => {
    // Apply filters and sorting
    let filtered = comments

    // Filter resolved comments
    if (!showResolved) {
      filtered = filtered.filter(comment => !comment.isResolved)
    }

    // Sort comments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp.getTime() - a.timestamp.getTime()
        case 'oldest':
          return a.timestamp.getTime() - b.timestamp.getTime()
        case 'reactions':
          const aReactions = Object.values(a.reactions).flat().length
          const bReactions = Object.values(b.reactions).flat().length
          return bReactions - aReactions
        default:
          return b.timestamp.getTime() - a.timestamp.getTime()
      }
    })

    setFilteredComments(filtered)
  }, [comments, showResolved, sortBy])

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      content: newComment,
      author: {
        id: currentUserId,
        name: 'Current User', // Replace with actual user data
        email: 'current@company.com',
      },
      timestamp: new Date(),
      replies: [],
      reactions: {
        thumbsUp: [],
        thumbsDown: [],
        heart: [],
        laugh: [],
      },
      mentions: mentions,
      attachments: [],
      isPinned: false,
      isResolved: false,
      metadata: {
        threadId: replyingTo || undefined,
        parentId: replyingTo || undefined,
      },
    }

    if (replyingTo) {
      // Add as reply
      setComments(prev =>
        prev.map(c =>
          c.id === replyingTo
            ? { ...c, replies: [...c.replies, comment] }
            : c
        )
      )
    } else {
      // Add as new comment
      setComments(prev => [comment, ...prev])
    }

    setNewComment('')
    setMentions([])
    setReplyingTo(null)
    onCommentAdd?.(comment)
  }

  const handleEditComment = (commentId: string) => {
    const comment = findComment(commentId)
    if (comment) {
      setEditingComment(commentId)
      setEditContent(comment.content)
    }
  }

  const handleSaveEdit = () => {
    if (!editingComment || !editContent.trim()) return

    setComments(prev => updateComment(prev, editingComment, { content: editContent, editedAt: new Date() }))
    setEditingComment(null)
    setEditContent('')
    onCommentUpdate?.(findComment(editingComment)!)
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    onCommentDelete?.(commentId)
  }

  const handleToggleReaction = (commentId: string, reaction: string) => {
    setComments(prev => {
      const updated = updateComment(prev, commentId, (comment) => {
        const reactions = { ...comment.reactions }
        const reactionArray = reactions[reaction as keyof typeof reactions]
        
        if (reactionArray.includes(currentUserId)) {
          reactions[reaction as keyof typeof reactions] = reactionArray.filter(id => id !== currentUserId)
        } else {
          reactions[reaction as keyof typeof reactions] = [...reactionArray, currentUserId]
        }
        
        return { ...comment, reactions }
      })
      return updated
    })
    
    onReactionToggle?.(commentId, reaction, currentUserId)
  }

  const handleTogglePin = (commentId: string) => {
    setComments(prev => updateComment(prev, commentId, { isPinned: !findComment(commentId)?.isPinned }))
  }

  const handleToggleResolve = (commentId: string) => {
    setComments(prev => updateComment(prev, commentId, { isResolved: !findComment(commentId)?.isResolved }))
  }

  const handleMention = (userId: string) => {
    setMentions(prev => [...prev, userId])
    setShowMentions(false)
    setMentionQuery('')
  }

  const handleInputChange = (value: string) => {
    setNewComment(value)
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true)
      // Simulate typing indicator
      setTypingUsers(prev => [...prev, currentUserId])
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTypingUsers(prev => prev.filter(id => id !== currentUserId))
    }, 1000)

    // Handle mentions
    const mentionMatch = value.match(/@(\w+)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const findComment = (commentId: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === commentId) return comment
      for (const reply of comment.replies) {
        if (reply.id === commentId) return reply
      }
    }
    return null
  }

  const updateComment = (comments: Comment[], commentId: string, updates: Partial<Comment> | ((comment: Comment) => Comment)): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return typeof updates === 'function' ? updates(comment) : { ...comment, ...updates }
      }
      
      const updatedReplies = comment.replies.map(reply => {
        if (reply.id === commentId) {
          return typeof updates === 'function' ? updates(reply) : { ...reply, ...updates }
        }
        return reply
      })
      
      return { ...comment, replies: updatedReplies }
    })
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />
    return <Paperclip className="h-4 w-4" />
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className={`flex gap-3 ${isReply ? 'py-2' : 'py-4'}`}>
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {comment.author.name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
            {comment.editedAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-yellow-600" />
            )}
            {comment.isResolved && (
              <CheckCircle className="h-3 w-3 text-green-600" />
            )}
          </div>
          
          <div className="text-sm text-foreground mb-2">
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <EnhancedButton size="sm" onClick={handleSaveEdit}>
                    Save
                  </EnhancedButton>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingComment(null)}
                  >
                    Cancel
                  </EnhancedButton>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{comment.content}</div>
            )}
          </div>

          {/* Attachments */}
          {comment.attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {comment.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                >
                  {getFileIcon(attachment.type)}
                  <span className="text-sm font-medium">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(attachment.size)})
                  </span>
                  <EnhancedButton variant="ghost" size="icon-sm">
                    <ExternalLink className="h-3 w-3" />
                  </EnhancedButton>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {editingComment !== comment.id && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <EnhancedButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleToggleReaction(comment.id, 'thumbsUp')}
                  className={comment.reactions.thumbsUp.includes(currentUserId) ? 'text-blue-600' : ''}
                >
                  <ThumbsUp className="h-3 w-3" />
                </EnhancedButton>
                {comment.reactions.thumbsUp.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {comment.reactions.thumbsUp.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <EnhancedButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleToggleReaction(comment.id, 'heart')}
                  className={comment.reactions.heart.includes(currentUserId) ? 'text-red-600' : ''}
                >
                  <Heart className="w-4 h-4" />
                </EnhancedButton>
                {comment.reactions.heart.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {comment.reactions.heart.length}
                  </span>
                )}
              </div>

              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePin(comment.id)}
              >
                <Pin className="h-3 w-3 mr-1" />
                {comment.isPinned ? 'Unpin' : 'Pin'}
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => handleToggleResolve(comment.id)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {comment.isResolved ? 'Reopen' : 'Resolve'}
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEditComment(comment.id)}
              >
                <Edit className="h-3 w-3" />
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </EnhancedButton>
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  placeholder="Write a reply..."
                  value={newComment}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="flex-1 p-2 border rounded-md resize-none"
                  rows={2}
                />
                <EnhancedButton onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </EnhancedButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Comments</h3>
          <p className="text-sm text-muted-foreground">
            {filteredComments.length} comments • {comments.reduce((acc, c) => acc + c.replies.length, 0)} replies
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <EnhancedButton
            variant={showResolved ? "default" : "outline"}
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Show Resolved
          </EnhancedButton>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="reactions">Most Reactions</option>
          </select>
        </div>
      </div>

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>
            {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
          </span>
        </div>
      )}

      {/* New Comment Input */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1 p-3 border rounded-md resize-none"
                rows={3}
              />
              <EnhancedButton onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </EnhancedButton>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Use @ to mention someone</span>
              <span>•</span>
              <span>Press Ctrl+Enter to send</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to add a comment!</p>
          </div>
        ) : (
          filteredComments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* Mentions Dropdown */}
      {showMentions && (
        <div className="absolute z-10 w-64 bg-background border rounded-md shadow-lg p-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground mb-2">Suggestions for @{mentionQuery}</div>
            {/* Mock user suggestions */}
            {['john.doe', 'jane.smith', 'bob.wilson', 'alice.brown'].map((user) => (
              <div
                key={user}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => handleMention(user)}
              >
                <User className="h-4 w-4" />
                <span className="text-sm">{user}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RealTimeComments


