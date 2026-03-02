import type { ClientAuthService } from "./types";
import { noopClientAuthService } from "./noop-client";

export function getClientAuthService(): ClientAuthService {
  return noopClientAuthService;
}

export type { ClientAuthService } from "./types";
