'use client';

import { useEffect, useState } from 'react';
import { useUserClient } from '@/hooks/useAuthClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/contexts/UserContext';

export default function AdminTestPage() {
  const { user, isLoaded } = useUserClient<any>();
  const { userData, loading, error } = useUserData();

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">User Information:</h3>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify({ user: userData }, null, 2)}
              </pre>
            </div>
          </div>
          
          {error && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Error:</h3>
              <div className="bg-red-100 p-4 rounded">
                <pre className="text-sm text-red-800">{error}</pre>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">Clerk User:</h3>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify({
                  id: user?.id,
                  email: user?.emailAddresses[0]?.emailAddress,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                }, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => window.location.href = '/admin'}>
              Go to Admin Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Go to Main Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 