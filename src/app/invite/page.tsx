'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthClient } from '@/hooks/useAuthClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn } = useAuthClient();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for both token and invitation_token parameters
  const token = searchParams.get('token') || searchParams.get('invitation_token');
  
  console.log('[InvitePage] URL parameters:', {
    token: searchParams.get('token'),
    invitation_token: searchParams.get('invitation_token'),
    resolvedToken: token,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    // Validate the invitation token
    fetch('/api/invitations/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvitation(data.invitation);
        } else {
          setError(data.error || 'Invalid invitation');
        }
      })
      .catch((err) => {
        setError('Failed to validate invitation');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!isSignedIn) {
      // Redirect to sign up with invitation token so new users can create an account and join the organization
      router.push(`/sign-up?invitation_token=${token}&redirect_url=${encodeURIComponent(window.location.href)}`);
      return;
    }

    // If user is already signed in, redirect them to signup anyway to ensure proper organization assignment
    router.push(`/sign-up?invitation_token=${token}&redirect_url=${encodeURIComponent(window.location.href)}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join {invitation?.organization?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization</Label>
            <p className="text-sm text-gray-600">{invitation?.organization?.name}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <p className="text-sm text-gray-600">{invitation?.role}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Invited by</Label>
            <p className="text-sm text-gray-600">
              {invitation?.invitedBy?.firstName} {invitation?.invitedBy?.lastName}
            </p>
          </div>

          {!isSignedIn ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Please sign up to accept this invitation and join the organization
              </p>
              <Button onClick={handleAcceptInvitation} className="w-full">
                Sign Up to Accept Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Click below to complete your organization setup
              </p>
              <Button 
                onClick={handleAcceptInvitation} 
                className="w-full"
              >
                Complete Organization Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <InvitePageContent />
    </Suspense>
  );
} 