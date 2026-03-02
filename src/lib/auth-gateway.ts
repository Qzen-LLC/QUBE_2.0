import { getAuthService } from "@/services/auth/auth-service-factory";
import type { AuthorizationOptions, AuthorizationResult, AuthContext, WithAuthHandler } from "@/services/auth/types";
import { AuthError } from "@/services/auth/types";

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authorizeRoles(ctx: AuthContext, allow?: string[], deny?: string[]): AuthorizationResult {
  const roles = ctx.user?.roles || [];
  if (deny && deny.length > 0) {
    const denySet = new Set(deny.map((r) => r.toUpperCase()));
    for (const role of roles) {
      if (denySet.has(String(role).toUpperCase())) {
        return { ok: false, status: 403, code: "FORBIDDEN", reason: "Role denied" };
      }
    }
  }
  if (allow && allow.length > 0) {
    const allowSet = new Set(allow.map((r) => r.toUpperCase()));
    for (const role of roles) {
      if (allowSet.has(String(role).toUpperCase())) {
        return { ok: true, status: 200 };
      }
    }
    return { ok: false, status: 403, code: "FORBIDDEN", reason: "Required role missing" };
  }
  return { ok: true, status: 200 };
}

function authorizeOrganization(ctx: AuthContext, requirement?: boolean | string[]): AuthorizationResult {
  if (!requirement) return { ok: true, status: 200 };
  const orgId = ctx.organizationId || ctx.user?.organizationId || null;
  if (!orgId) return { ok: false, status: 403, code: "MISSING_ORGANIZATION", reason: "Organization required" };
  if (Array.isArray(requirement)) {
    const ok = requirement.includes(orgId);
    return ok
      ? { ok: true, status: 200 }
      : { ok: false, status: 403, code: "FORBIDDEN", reason: "Organization not allowed" };
  }
  return { ok: true, status: 200 };
}

function authorizePermissions(ctx: AuthContext, required?: string[] | undefined): AuthorizationResult {
  if (!required || required.length === 0) return { ok: true, status: 200 };
  const granted = ctx.user?.permissions || [];
  if (granted.includes("*")) return { ok: true, status: 200 };
  for (const need of required) {
    if (granted.includes(need)) return { ok: true, status: 200 };
  }
  return { ok: false, status: 403, code: "FORBIDDEN", reason: "Required permission missing" };
}

export function withAuth<Extra = unknown>(
  handler: WithAuthHandler<Extra>,
  options: AuthorizationOptions = {}
): WithAuthHandler<Extra> {
  const {
    requireUser = true,
    allowRoles,
    denyRoles,
    requireOrganization,
    customAuthorize,
    allowApiKey,
  } = options;

  return async (req: Request, ctx: { auth: AuthContext } & Extra) => {
    const service = getAuthService();
    let authCtx: AuthContext;

    try {
      authCtx = requireUser
        ? await service.requireUser(req)
        : await service.getAuthContext(req);
    } catch (err) {
      if (err instanceof AuthError) {
        return json(err.status, { success: false, error: err.message, details: { code: err.code, reason: err.reason } });
      }
      return json(401, { success: false, error: "Authentication required", details: { code: "UNAUTHENTICATED" } });
    }

    // Detect method if not already set by service
    if (!authCtx.method) {
      const header = req.headers.get("authorization") || req.headers.get("Authorization");
      const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key");
      if (apiKey) authCtx.method = "api_key";
      else if (header && header.toLowerCase().startsWith("bearer ")) authCtx.method = "bearer";
      else authCtx.method = "session";
    }

    // Enforce API key allowance if applicable
    if (authCtx.method === "api_key" && allowApiKey === false) {
      return json(403, { success: false, error: "API key authentication not allowed", details: { code: "FORBIDDEN" } });
    }

    const roleCheck = authorizeRoles(authCtx, allowRoles, denyRoles);
    if (!roleCheck.ok) {
      return json(roleCheck.status, { success: false, error: "Access denied", details: { code: roleCheck.code, reason: roleCheck.reason } });
    }

    const orgCheck = authorizeOrganization(authCtx, requireOrganization);
    if (!orgCheck.ok) {
      return json(orgCheck.status, { success: false, error: "Organization required", details: { code: orgCheck.code, reason: orgCheck.reason } });
    }

    const permCheck = authorizePermissions(authCtx, options.permissions);
    if (!permCheck.ok) {
      return json(permCheck.status, { success: false, error: "Insufficient permissions", details: { code: permCheck.code, reason: permCheck.reason } });
    }

    if (customAuthorize) {
      const ok = await customAuthorize(authCtx, req);
      if (!ok) {
        return json(403, { success: false, error: "Custom authorization failed", details: { code: "FORBIDDEN" } });
      }
    }

    return handler(req, { ...(ctx as any), auth: authCtx });
  };
}

export default withAuth;


