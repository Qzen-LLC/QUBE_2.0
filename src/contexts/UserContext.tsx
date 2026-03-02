'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/me');
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

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UserContext.Provider value={{ userData, loading, error, refetch }}>
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
      refetch: async () => {},
    };
  }
  return context;
}
