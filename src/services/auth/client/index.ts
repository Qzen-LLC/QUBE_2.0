import type { ClientAuthService } from "./types";
import { jwtClientAuthService } from "./jwt-client";

export function getClientAuthService(): ClientAuthService {
  return jwtClientAuthService;
}

export type { ClientAuthService } from "./types";
