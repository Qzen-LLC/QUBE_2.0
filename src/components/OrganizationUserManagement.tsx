'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, UserCheck, UserX, Mail, Calendar, Shield, UserPlus, AlertCircle, Edit } from 'lucide-react';
import { useUserData } from '@/contexts/UserContext';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function OrganizationUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('ORG_USER');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [removeUserLoading, setRemoveUserLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserFirstName, setEditUserFirstName] = useState('');
  const [editUserLastName, setEditUserLastName] = useState('');
  const [editUserRole, setEditUserRole] = useState('ORG_USER');
  const [editUserLoading, setEditUserLoading] = useState(false);
  const { userData } = useUserData();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Get organization ID from user data
  const orgId = userData?.organizationId;

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/organizations/users');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail) {
      setError('Email is required');
      return;
    }
    if (!orgId) {
      setError('Organization ID not found. Please refresh and try again.');
      return;
    }
    
    setAddUserLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
          organizationId: orgId
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewUserEmail('');
        setNewUserFirstName('');
        setNewUserLastName('');
        setNewUserRole('ORG_USER');
        setShowAddUser(false);
        setSuccess('Invitation sent successfully!');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserFirstName(user.firstName || '');
    setEditUserLastName(user.lastName || '');
    // Map legacy 'USER' role to 'ORG_USER' for consistency
    setEditUserRole(user.role === 'USER' ? 'ORG_USER' : user.role);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setEditUserLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/organizations/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editUserFirstName,
          lastName: editUserLastName,
          role: editUserRole,
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('User updated successfully!');
        setEditingUser(null);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) {
      return;
    }

    setRemoveUserLoading(userId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/organizations/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('User removed successfully!');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      setError('Failed to remove user');
    } finally {
      setRemoveUserLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading user management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Modern Header */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground leading-tight">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">Manage users within your organization</p>
            </div>
            <Button 
              className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 bg-white text-foreground border-2 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700 dark:hover:border-neutral-500 font-medium" 
              onClick={() => setShowAddUser(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <span className="text-green-800 dark:text-green-200 font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
            <span className="text-destructive-foreground font-medium">{error}</span>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Add New User</h2>
                  <p className="text-muted-foreground">Send invitation to join your organization</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userFirstName" className="text-sm font-medium text-foreground mb-2 block">First Name</Label>
                    <Input
                      id="userFirstName"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userLastName" className="text-sm font-medium text-foreground mb-2 block">Last Name</Label>
                    <Input
                      id="userLastName"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="userEmail" className="text-sm font-medium text-foreground mb-2 block">Email *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="userRole" className="text-sm font-medium text-foreground mb-2 block">Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORG_ADMIN">Organization Admin</SelectItem>
                      <SelectItem value="ORG_USER">Organization User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleAddUser} 
                    disabled={!newUserEmail || addUserLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {addUserLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending Invite...
                      </div>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddUser(false)}
                    className="flex-1 border-border text-foreground hover:bg-muted px-6 py-3 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Edit className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Edit User</h2>
                  <p className="text-muted-foreground">Update user information</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="editUserEmail" className="text-sm font-medium text-foreground mb-2 block">Email</Label>
                  <Input
                    id="editUserEmail"
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editUserFirstName" className="text-sm font-medium text-foreground mb-2 block">First Name</Label>
                    <Input
                      id="editUserFirstName"
                      value={editUserFirstName}
                      onChange={(e) => setEditUserFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editUserLastName" className="text-sm font-medium text-foreground mb-2 block">Last Name</Label>
                    <Input
                      id="editUserLastName"
                      value={editUserLastName}
                      onChange={(e) => setEditUserLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="editUserRole" className="text-sm font-medium text-foreground mb-2 block">Role</Label>
                  <Select value={editUserRole} onValueChange={setEditUserRole}>
                    <SelectTrigger className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORG_ADMIN">Organization Admin</SelectItem>
                      <SelectItem value="ORG_USER">Organization User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleUpdateUser} 
                    disabled={editUserLoading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-medium"
                  >
                    {editUserLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update User'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 border-border text-foreground hover:bg-muted px-6 py-3 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center">
                  <Users className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{users.filter(u => u.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'ORG_ADMIN').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-foreground" />
              Organization Users
            </h2>
            <Badge variant="secondary" className="px-2.5 py-1 rounded-md text-xs">
              {users.length} {users.length === 1 ? 'User' : 'Users'}
            </Badge>
          </div>
          
          {users.length === 0 ? (
            <Card className="bg-card border border-border shadow-sm rounded-lg">
              <CardContent className="text-center py-10">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-2">No Users Yet</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">Add users to your organization to get started with collaboration</p>
                <Button 
                  onClick={() => setShowAddUser(true)}
                  className="bg-white text-foreground border border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700 px-5 py-2.5 rounded-lg"
                >
                  Add User
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-muted-foreground">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-medium text-foreground truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-md">
                              {user.role === 'ORG_ADMIN' ? 'Admin' : 'User'}
                            </Badge>
                            {user.isActive && (
                              <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-md">Active</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1 min-w-0">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => handleEditUser(user)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => handleRemoveUser(user.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 