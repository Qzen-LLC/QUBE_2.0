"use client";

import { getClientAuthService } from "@/services/auth/client";
import type { UseAuthResult, UseUserResult } from "@/services/auth/client/types";

/**
 * Unified authentication hook that proxies calls to the configured auth service.
 * This provides a consistent interface regardless of the underlying auth provider.
 * 
 * @returns Authentication state and methods
 */
export function useAuthClient(): UseAuthResult {
  const authService = getClientAuthService();
  return authService.hooks.useAuth();
}

/**
 * Unified user hook that proxies calls to the configured auth service.
 * This provides a consistent interface for accessing user data.
 * 
 * @template UserType - The type of user object expected
 * @returns User data and loading state
 */
export function useUserClient<UserType = unknown>(): UseUserResult<UserType> {
  const authService = getClientAuthService();
  return authService.hooks.useUser<UserType>();
}

// Re-export types for convenience
export type { UseAuthResult, UseUserResult } from "@/services/auth/client/types";
