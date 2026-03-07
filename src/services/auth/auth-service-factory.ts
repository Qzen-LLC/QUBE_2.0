import type { ServerAuthService } from "./types";
import { jwtAuthService } from "./jwt-auth-service";

export function getAuthService(): ServerAuthService {
  return jwtAuthService;
}

export default getAuthService;
