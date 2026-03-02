'use client';

import { useEffect, useState } from 'react';
import { useAuthClient } from '@/hooks/useAuthClient';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { useUserData } from '@/contexts/UserContext';

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuthClient();
  const router = useRouter();
  const { userData, loading, error } = useUserData();
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      console.log('User not signed in, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    // Set debug info when user data is loaded
    if (userData) {
      setDebug({ user: userData });
    }
  }, [isSignedIn, isLoaded, router, userData]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect to sign-in
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
        <p className="mb-4 text-gray-700">{error}</p>
        {debug && (
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h2 className="font-semibold mb-2">Debug Info:</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (userData?.role !== 'QZEN_ADMIN') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You don't have permission to access the admin dashboard.</p>
        <p className="mb-4 text-gray-600">Your role: {userData?.role || 'Unknown'}</p>
        {debug && (
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h2 className="font-semibold mb-2">Debug Info:</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AdminDashboard />
    </div>
  );
} 