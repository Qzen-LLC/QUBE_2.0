// Server-side authentication types and service interface

export type AuthErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_TOKEN"
  | "MISSING_ORGANIZATION"
  | "UNKNOWN";

export interface AuthErrorShape {
  code: AuthErrorCode;
  message: string;
  status: number; // HTTP status code
  reason?: string;
}

export class AuthError extends Error implements AuthErrorShape {
  code: AuthErrorCode;
  status: number;
  reason?: string;

  constructor(message: string, code: AuthErrorCode, status: number, reason?: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.reason = reason;
  }
}

export type UserRole = string;

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles?: UserRole[]; // normalized roles
  permissions?: string[]; // derived or stored permissions
  organizationId?: string | null;
  claims?: Record<string, unknown>; // provider specific claims
  raw?: unknown; // provider raw user object for debugging
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  userId: string | null;
  sessionId?: string | null;
  organizationId?: string | null;
  tokenClaims?: Record<string, unknown> | null;
  provider: "NONE" | "CUSTOM" | string;
  /** Which auth method authenticated the request */
  method?: "session" | "bearer" | "api_key";
}

export interface AuthorizationOptions {
  requireUser?: boolean; // default true
  allowRoles?: UserRole[];
  denyRoles?: UserRole[];
  requireOrganization?: boolean | string[]; // true = any org; string[] = allowed org IDs
  customAuthorize?: (ctx: AuthContext, req: Request) => boolean | Promise<boolean>;
  scopes?: string[]; // reserved for future use (locks/permissions)
  /** If false, blocks requests authenticated via API key */
  allowApiKey?: boolean;
  /** Required permissions; any match passes */
  permissions?: string[];
}

export interface AuthorizationResult {
  ok: boolean;
  status: number;
  code?: AuthErrorCode;
  reason?: string;
}

export interface ServerAuthService {
  /** Provider name for diagnostics */
  readonly provider: string;

  /**
   * Build an AuthContext from the incoming request.
   * Should not throw; return nulls inside context on anonymous.
   */
  getAuthContext(req: Request): Promise<AuthContext>;

  /** Ensures a signed-in user is present; throws AuthError on failure */
  requireUser(req: Request): Promise<AuthContext>;

  /** Returns true if the current user has any of the provided roles */
  hasRole(req: Request, roles: UserRole[]): Promise<boolean>;

  /** Convenience: extract bearer token if available */
  getBearerToken?(req: Request): string | null;
}

export type WithAuthHandler<Extra = unknown> = (
  req: Request,
  context: { auth: AuthContext } & Extra
) => Promise<Response> | Response;


