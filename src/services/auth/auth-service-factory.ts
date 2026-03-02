import type { ServerAuthService } from "./types";
import { noopAuthService } from "./noop-auth-service";

let cachedService: ServerAuthService | null = null;

export function getAuthService(): ServerAuthService {
  if (cachedService) return cachedService;
  cachedService = noopAuthService;
  return cachedService;
}

export default getAuthService;
