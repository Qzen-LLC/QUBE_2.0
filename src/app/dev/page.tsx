'use client';

import { useUserClient, useAuthClient } from '@/hooks/useAuthClient';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function DevPage() {
  const { user } = useUserClient<any>();
  const { isSignedIn } = useAuthClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createUser = async (role: string) => {
    if (!isSignedIn) {
      alert('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/dev/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`User created successfully with role: ${role}`);
      } else {
        alert('Error creating user: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Development Tools</h1>
        <p>Please sign in to access development tools.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Development Tools</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}</p>
          <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Create User in Database</h2>
          <div className="space-y-2">
            <Button 
              onClick={() => createUser('USER')} 
              disabled={loading}
              className="mr-2"
            >
              Create as USER
            </Button>
            <Button 
              onClick={() => createUser('ORG_USER')} 
              disabled={loading}
              variant="outline"
              className="mr-2"
            >
              Create as ORG_USER
            </Button>
            <Button 
              onClick={() => createUser('ORG_ADMIN')} 
              disabled={loading}
              variant="outline"
              className="mr-2"
            >
              Create as ORG_ADMIN
            </Button>
            <Button 
              onClick={() => createUser('QZEN_ADMIN')} 
              disabled={loading}
              variant="outline"
            >
              Create as QZEN_ADMIN
            </Button>
          </div>
        </div>

        {result && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Last Result</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
          <div className="space-y-2">
            <a href="/admin" className="block text-blue-600 hover:underline">
              → Admin Dashboard
            </a>
            <a href="/dashboard" className="block text-blue-600 hover:underline">
              → Main Dashboard
            </a>
            <a href="/" className="block text-blue-600 hover:underline">
              → Home Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 