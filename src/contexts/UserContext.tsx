'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    domain: string;
  } | null;
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/me');
      if (response.status === 401) {
        // Not authenticated — only redirect if not already on auth pages
        const path = window.location.pathname;
        if (!path.startsWith('/sign-in') && !path.startsWith('/sign-up') && !path.startsWith('/onboarding')) {
          router.push('/sign-in');
        }
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch user data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchUserData();
    }
  }, [mounted]);

  const needsOnboarding = !!(userData && !userData.organizationId);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UserContext.Provider value={{ userData, loading, error, needsOnboarding, refetch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserContext);
  if (context === undefined) {
    return {
      userData: null,
      loading: true,
      error: null,
      needsOnboarding: false,
      refetch: async () => {},
    };
  }
  return context;
}
