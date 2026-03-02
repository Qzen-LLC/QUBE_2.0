import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { EnhancedModal, EnhancedModalContent } from '@/components/ui/enhanced-modal'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'

export interface TeamMember {
  id: string
  userId: string
  email: string
  name: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending' | 'suspended'
  joinedAt: Date
  lastActiveAt: Date
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canInvite: boolean
    canManageRoles: boolean
    canViewAnalytics: boolean
  }
  metadata?: {
    department?: string
    title?: string
    phone?: string
    timezone?: string
  }
}

export interface TeamInvitation {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export interface TeamManagementProps {
  organizationId: string
  currentUserId: string
  onMemberUpdate?: (member: TeamMember) => void
  onMemberRemove?: (memberId: string) => void
  onInviteSent?: (invitation: TeamInvitation) => void
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  organizationId,
  currentUserId,
  onMemberUpdate,
  onMemberRemove,
  onInviteSent,
}) => {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joinedAt' | 'lastActiveAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member' | 'viewer',
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockMembers: TeamMember[] = [
      {
        id: '1',
        userId: 'user1',
        email: 'john.doe@company.com',
        name: 'John Doe',
        role: 'owner',
        status: 'active',
        joinedAt: new Date('2024-01-15'),
        lastActiveAt: new Date(),
        permissions: {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageRoles: true,
          canViewAnalytics: true,
        },
        metadata: {
          department: 'Engineering',
          title: 'CTO',
          phone: '+1-555-0123',
          timezone: 'UTC-8',
        },
      },
      {
        id: '2',
        userId: 'user2',
        email: 'jane.smith@company.com',
        name: 'Jane Smith',
        role: 'admin',
        status: 'active',
        joinedAt: new Date('2024-02-01'),
        lastActiveAt: new Date(Date.now() - 3600000),
        permissions: {
          canEdit: true,
          canDelete: false,
          canInvite: true,
          canManageRoles: true,
          canViewAnalytics: true,
        },
        metadata: {
          department: 'Product',
          title: 'Product Manager',
          phone: '+1-555-0124',
          timezone: 'UTC-5',
        },
      },
      {
        id: '3',
        userId: 'user3',
        email: 'bob.wilson@company.com',
        name: 'Bob Wilson',
        role: 'member',
        status: 'active',
        joinedAt: new Date('2024-02-15'),
        lastActiveAt: new Date(Date.now() - 7200000),
        permissions: {
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageRoles: false,
          canViewAnalytics: false,
        },
        metadata: {
          department: 'Engineering',
          title: 'Senior Developer',
          phone: '+1-555-0125',
          timezone: 'UTC-8',
        },
      },
      {
        id: '4',
        userId: 'user4',
        email: 'alice.brown@company.com',
        name: 'Alice Brown',
        role: 'viewer',
        status: 'pending',
        joinedAt: new Date('2024-03-01'),
        lastActiveAt: new Date(Date.now() - 86400000),
        permissions: {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageRoles: false,
          canViewAnalytics: false,
        },
        metadata: {
          department: 'Legal',
          title: 'Legal Counsel',
          phone: '+1-555-0126',
          timezone: 'UTC-5',
        },
      },
    ]

    const mockInvitations: TeamInvitation[] = [
      {
        id: 'inv1',
        email: 'new.user@company.com',
        role: 'member',
        invitedBy: 'user1',
        invitedAt: new Date(Date.now() - 86400000),
        expiresAt: new Date(Date.now() + 604800000),
        status: 'pending',
      },
    ]

    setMembers(mockMembers)
    setInvitations(mockInvitations)
  }, [organizationId])

  useEffect(() => {
    // Apply filters and sorting
    let filtered = members

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.metadata?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'role':
          const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 }
          aValue = roleOrder[a.role]
          bValue = roleOrder[b.role]
          break
        case 'joinedAt':
          aValue = a.joinedAt.getTime()
          bValue = b.joinedAt.getTime()
          break
        case 'lastActiveAt':
          aValue = a.lastActiveAt.getTime()
          bValue = b.lastActiveAt.getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredMembers(filtered)
  }, [members, searchTerm, roleFilter, statusFilter, sortBy, sortOrder])

  const handleInviteMember = () => {
    if (!inviteForm.email || !inviteForm.role) return

    const newInvitation: TeamInvitation = {
      id: `inv_${Date.now()}`,
      email: inviteForm.email,
      role: inviteForm.role,
      invitedBy: currentUserId,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 604800000), // 7 days
      status: 'pending',
    }

    setInvitations(prev => [newInvitation, ...prev])
    setInviteForm({ email: '', role: 'member' })
    setShowInviteModal(false)
    onInviteSent?.(newInvitation)
  }

  const handleUpdateMemberRole = (memberId: string, newRole: TeamMember['role']) => {
    setMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? { ...member, role: newRole, permissions: getPermissionsForRole(newRole) }
          : member
      )
    )
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId))
    onMemberRemove?.(memberId)
  }

  const handleCancelInvitation = (invitationId: string) => {
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === invitationId ? { ...inv, status: 'declined' } : inv
      )
    )
  }

  const getPermissionsForRole = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageRoles: true,
          canViewAnalytics: true,
        }
      case 'admin':
        return {
          canEdit: true,
          canDelete: false,
          canInvite: true,
          canManageRoles: true,
          canViewAnalytics: true,
        }
      case 'member':
        return {
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageRoles: false,
          canViewAnalytics: false,
        }
      case 'viewer':
        return {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageRoles: false,
          canViewAnalytics: false,
        }
    }
  }

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      case 'member': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'suspended': return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return formatDate(date)
  }

  const currentUser = members.find(m => m.userId === currentUserId)
  const canManageTeam = currentUser?.permissions.canManageRoles || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">
            Manage team members, roles, and permissions
          </p>
        </div>
        {canManageTeam && (
          <EnhancedButton onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </EnhancedButton>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {invitations.filter(i => i.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <EnhancedInput
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="role-asc">Role Asc</option>
                <option value="role-desc">Role Desc</option>
                <option value="joinedAt-desc">Newest First</option>
                <option value="joinedAt-asc">Oldest First</option>
                <option value="lastActiveAt-desc">Recently Active</option>
                <option value="lastActiveAt-asc">Least Active</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {filteredMembers.length} of {members.length} members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      {getStatusIcon(member.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.metadata?.title && (
                      <p className="text-xs text-muted-foreground">
                        {member.metadata.title} • {member.metadata.department}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <EnhancedBadge className={getRoleColor(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{member.role}</span>
                      </EnhancedBadge>
                      <EnhancedBadge className={getStatusColor(member.status)}>
                        {member.status}
                      </EnhancedBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(member.joinedAt)} • Last active {formatLastActive(member.lastActiveAt)}
                    </p>
                  </div>

                  {canManageTeam && member.userId !== currentUserId && (
                    <div className="flex items-center gap-1">
                      <EnhancedButton
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setSelectedMember(member)
                          setShowMemberModal(true)
                        }}
                        title="Manage member"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </EnhancedButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {invitations.filter(i => i.status === 'pending').length} pending invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter(i => i.status === 'pending')
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited as {invitation.role} • Expires {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                    </div>
                    
                    {canManageTeam && (
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        Cancel
                      </EnhancedButton>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Modal */}
      <EnhancedModal
        open={showInviteModal}
        onOpenChange={(open) => setShowInviteModal(open)}
      >
        <EnhancedModalContent
          title="Invite Team Member"
          variant="info"
          onClose={() => setShowInviteModal(false)}
        >
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <EnhancedInput
              type="email"
              placeholder="colleague@company.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="viewer">Viewer - Can view only</option>
              <option value="member">Member - Can edit and collaborate</option>
              <option value="admin">Admin - Can manage team and settings</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <EnhancedButton
              variant="outline"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              onClick={handleInviteMember}
              disabled={!inviteForm.email}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Send Invitation
            </EnhancedButton>
          </div>
        </div>
        </EnhancedModalContent>
      </EnhancedModal>

      {/* Member Management Modal */}
      <EnhancedModal
        open={showMemberModal}
        onOpenChange={(open) => setShowMemberModal(open)}
      >
        <EnhancedModalContent
          title={`Manage ${selectedMember?.name}`}
          variant="info"
          onClose={() => setShowMemberModal(false)}
        >
          {selectedMember && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={selectedMember.role}
                onChange={(e) => {
                  const newRole = e.target.value as TeamMember['role']
                  setSelectedMember(prev => prev ? { ...prev, role: newRole } : null)
                }}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="viewer">Viewer</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                {selectedMember.role === 'owner' && <option value="owner">Owner</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedMember.status}
                onChange={(e) => {
                  const newStatus = e.target.value as TeamMember['status']
                  setSelectedMember(prev => prev ? { ...prev, status: newStatus } : null)
                }}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <EnhancedButton
                variant="outline"
                onClick={() => setShowMemberModal(false)}
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="destructive"
                onClick={() => {
                  handleRemoveMember(selectedMember.id)
                  setShowMemberModal(false)
                }}
              >
                Remove Member
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  if (selectedMember) {
                    handleUpdateMemberRole(selectedMember.id, selectedMember.role)
                    setShowMemberModal(false)
                  }
                }}
              >
                Save Changes
              </EnhancedButton>
            </div>
          </div>
        )}
        </EnhancedModalContent>
      </EnhancedModal>
    </div>
  )
}

export default TeamManagement


