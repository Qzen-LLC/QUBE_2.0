'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserData } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Member {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { firstName: string | null; lastName: string | null; email: string };
  organization: { id: string; name: string };
}

export default function MembersPage() {
  const { userData } = useUserData();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ORG_USER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success?: boolean; message?: string; token?: string } | null>(null);

  const isAdmin = userData?.role === 'ORG_ADMIN' || userData?.role === 'QZEN_ADMIN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/organizations/users'),
        fetch('/api/invitations/list'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.users || []);
      }
      if (invitationsRes.ok) {
        const data = await invitationsRes.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteResult(null);

    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          organizationId: userData?.organizationId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteResult({ success: true, message: 'Invitation sent!', token: data.invitation?.token });
        setInviteEmail('');
        fetchData();
      } else {
        setInviteResult({ success: false, message: data.error || 'Failed to send invitation' });
      }
    } catch {
      setInviteResult({ success: false, message: 'Something went wrong' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch('/api/invitations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this member?')) return;

    try {
      const res = await fetch('/api/organizations/users/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deactivating member:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Only organization admins can manage members.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-muted-foreground">Manage your organization&apos;s members and invitations</p>
      </div>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite a member</CardTitle>
          <CardDescription>Send an invitation to join your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-40 space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <select
                id="inviteRole"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="ORG_USER">Member</option>
                <option value="ORG_ADMIN">Admin</option>
              </select>
            </div>
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Sending...' : 'Send invite'}
            </Button>
          </form>
          {inviteResult && (
            <div className={`mt-3 text-sm p-3 rounded-md ${inviteResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
              {inviteResult.message}
              {inviteResult.token && (
                <div className="mt-1 font-mono text-xs bg-background p-2 rounded border">
                  Token: {inviteResult.token}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Current members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground">No members found</p>
          ) : (
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {member.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                    </span>
                    {member.id !== userData?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(member.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
            <p className="text-muted-foreground">No pending invitations</p>
          ) : (
            <div className="divide-y">
              {invitations
                .filter((i) => i.status === 'PENDING')
                .map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName} &middot;{' '}
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        {invitation.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
