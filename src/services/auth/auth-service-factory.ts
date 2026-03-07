import type { ServerAuthService } from "./types";
import { noopAuthService } from "./noop-auth-service";
import { jwtAuthService } from "./jwt-auth-service";

let cachedService: ServerAuthService | null = null;

export function getAuthService(): ServerAuthService {
  if (cachedService) return cachedService;
  cachedService = process.env.AUTH_PROVIDER === "noop" ? noopAuthService : jwtAuthService;
  return cachedService;
}

export default getAuthService;
