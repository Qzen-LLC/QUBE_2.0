"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ClientAuthService, UseAuthResult, UseUserResult } from "./types";

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  organizationId: string | null;
  user: Record<string, unknown> | null;
}

const AuthContext = createContext<AuthState>({
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  organizationId: null,
  user: null,
});

const RefreshContext = createContext<() => Promise<void>>(async () => {});

const AuthProvider: ClientAuthService["components"]["AuthProvider"] = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    organizationId: null,
    user: null,
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.status === 401) {
        setState({ isLoaded: true, isSignedIn: false, userId: null, organizationId: null, user: null });
        router.push("/sign-in");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setState({
          isLoaded: true,
          isSignedIn: true,
          userId: data.user?.id || null,
          organizationId: data.user?.organizationId || null,
          user: data.user || null,
        });
      } else {
        setState({ isLoaded: true, isSignedIn: false, userId: null, organizationId: null, user: null });
      }
    } catch {
      setState({ isLoaded: true, isSignedIn: false, userId: null, organizationId: null, user: null });
    }
  }, [router]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={state}>
      <RefreshContext.Provider value={fetchMe}>
        {children}
      </RefreshContext.Provider>
    </AuthContext.Provider>
  );
};

function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext);
  const router = useRouter();

  const signOut = useCallback(async (opts?: { redirectUrl?: string }) => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(opts?.redirectUrl || "/sign-in");
  }, [router]);

  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    signOut,
  };
}

function useUser<TUser = unknown>(): UseUserResult<TUser> {
  const ctx = useContext(AuthContext);
  return {
    isLoaded: ctx.isLoaded,
    user: ctx.user as TUser | null,
  };
}

const SignIn: ClientAuthService["components"]["SignIn"] = () => null;
const SignUp: ClientAuthService["components"]["SignUp"] = () => null;

const UserButton: ClientAuthService["components"]["UserButton"] = () => {
  const { isSignedIn, signOut } = useAuth();
  const ctx = useContext(AuthContext);

  if (!isSignedIn) return null;

  const user = ctx.user as Record<string, unknown> | null;
  const initials = [
    (user?.firstName as string)?.[0],
    (user?.lastName as string)?.[0],
  ].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <div className="relative group">
      <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
        {initials}
      </button>
      <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-md shadow-md hidden group-hover:block z-50">
        <div className="p-2 text-sm border-b">
          <p className="font-medium">{user?.firstName as string} {user?.lastName as string}</p>
          <p className="text-muted-foreground text-xs">{user?.email as string}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

const OrganizationSwitcher: ClientAuthService["components"]["OrganizationSwitcher"] = () => {
  // Only render for QZEN_ADMIN — shows an org override selector
  const ctx = useContext(AuthContext);
  const user = ctx.user as Record<string, unknown> | null;
  const role = user?.role as string;

  if (role !== "QZEN_ADMIN") return null;

  return (
    <div className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
      QZEN Admin Mode
    </div>
  );
};

export const jwtClientAuthService: ClientAuthService = {
  provider: "CUSTOM",
  hooks: { useAuth, useUser },
  components: { AuthProvider, SignIn, SignUp, UserButton, OrganizationSwitcher },
};
