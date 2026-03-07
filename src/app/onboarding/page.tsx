'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Mode = 'choose' | 'create' | 'join';

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationParam = searchParams.get('invitation') || '';

  const [mode, setMode] = useState<Mode>(invitationParam ? 'join' : 'choose');

  // Create org state
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');

  // Join org state
  const [invitationToken, setInvitationToken] = useState(invitationParam);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/organizations/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName, domain: orgDomain || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create organization');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Accept invitation (validates + joins org)
      const acceptRes = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitationToken }),
      });

      const data = await acceptRes.json();
      if (!acceptRes.ok) {
        setError(data.error || 'Invalid or expired invitation');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to QUBE</CardTitle>
            <CardDescription>
              Set up your organization to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              variant="outline"
              onClick={() => setMode('create')}
            >
              <span className="font-semibold">Create a new organization</span>
              <span className="text-xs text-muted-foreground font-normal">
                Set up a workspace for your team
              </span>
            </Button>
            <Button
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              variant="outline"
              onClick={() => setMode('join')}
            >
              <span className="font-semibold">Join an existing organization</span>
              <span className="text-xs text-muted-foreground font-normal">
                Use an invitation token from your admin
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>
              You&apos;ll be the admin of this organization
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateOrg}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDomain">Domain (optional)</Label>
                <Input
                  id="orgDomain"
                  placeholder="acme.com"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => { setMode('choose'); setError(''); }}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create organization'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Join mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join organization</CardTitle>
          <CardDescription>
            Enter the invitation token you received
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleJoinOrg}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="token">Invitation token</Label>
              <Input
                id="token"
                placeholder="Paste your invitation token"
                value={invitationToken}
                onChange={(e) => setInvitationToken(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => { setMode('choose'); setError(''); }}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Joining...' : 'Join organization'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
