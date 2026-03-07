import type { ClientAuthService } from "./types";
import { noopClientAuthService } from "./noop-client";
import { jwtClientAuthService } from "./jwt-client";

export function getClientAuthService(): ClientAuthService {
  if (typeof window === "undefined") {
    // Server-side: check env
    return process.env.AUTH_PROVIDER === "noop" ? noopClientAuthService : jwtClientAuthService;
  }
  // Client-side: check if noop mode by looking at a flag set during SSR
  // We use the same env var via Next.js public config
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER === "noop" ? noopClientAuthService : jwtClientAuthService;
}

export type { ClientAuthService } from "./types";
