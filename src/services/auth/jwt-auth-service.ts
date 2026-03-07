import { jwtVerify, SignJWT } from "jose";
import type { AuthContext, AuthenticatedUser, ServerAuthService, UserRole } from "./types";
import { AuthError } from "./types";
import { prismaClient } from "@/utils/db";

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return new TextEncoder().encode(secret);
};

const ACCESS_TOKEN_EXPIRY = "24h";
const ACCESS_COOKIE = "qube-access-token";

interface AccessTokenPayload {
  sub: string; // clerkId (user identifier)
  role: string;
  orgId: string | null;
}

// --- Token helpers ---

export async function createAccessToken(user: { clerkId: string; role: string; organizationId: string | null }): Promise<string> {
  return new SignJWT({ role: user.role, orgId: user.organizationId } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.clerkId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET());
  return {
    sub: payload.sub as string,
    role: payload.role as string,
    orgId: (payload.orgId as string) || null,
  };
}

// --- Cookie helpers ---

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const [key, ...vals] = pair.trim().split("=");
    if (key) cookies[key.trim()] = vals.join("=").trim();
  }
  return cookies;
}

const isProduction = () => process.env.NODE_ENV === "production";

export function setAuthCookies(headers: Headers, accessToken: string) {
  const secure = isProduction() ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=${accessToken}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=86400`
  );
}

export function clearAuthCookies(headers: Headers) {
  const secure = isProduction() ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=0`
  );
}

// --- Auth service ---

async function lookupUser(clerkId: string): Promise<AuthenticatedUser | null> {
  const user = await prismaClient.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;

  const role = user.role as string;
  return {
    id: user.clerkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    organizationId: user.organizationId,
    roles: [role],
    permissions: role === "QZEN_ADMIN" ? ["*"] : [],
  };
}

async function extractAuthContext(req: Request): Promise<AuthContext> {
  const cookies = parseCookies(req);
  const accessToken = cookies[ACCESS_COOKIE];

  if (!accessToken) {
    return { user: null, userId: null, provider: "CUSTOM", method: "session" };
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    const user = await lookupUser(payload.sub);

    if (!user) {
      return { user: null, userId: null, provider: "CUSTOM", method: "session" };
    }

    // QZEN_ADMIN org override support
    const orgOverride = req.headers.get("x-org-override");
    const effectiveOrgId =
      user.roles?.includes("QZEN_ADMIN") && orgOverride
        ? orgOverride
        : user.organizationId ?? null;

    return {
      user,
      userId: user.id,
      sessionId: null,
      organizationId: effectiveOrgId,
      tokenClaims: { role: payload.role, orgId: payload.orgId },
      provider: "CUSTOM",
      method: "session",
    };
  } catch {
    return { user: null, userId: null, provider: "CUSTOM", method: "session" };
  }
}

export const jwtAuthService: ServerAuthService = {
  provider: "CUSTOM",

  async getAuthContext(req: Request): Promise<AuthContext> {
    return extractAuthContext(req);
  },

  async requireUser(req: Request): Promise<AuthContext> {
    const ctx = await extractAuthContext(req);
    if (!ctx.user) {
      throw new AuthError("Authentication required", "UNAUTHENTICATED", 401);
    }
    return ctx;
  },

  async hasRole(req: Request, roles: UserRole[]): Promise<boolean> {
    const ctx = await extractAuthContext(req);
    if (!ctx.user) return false;
    const userRoles = ctx.user.roles || [];
    return roles.some((r) => userRoles.includes(r));
  },

  getBearerToken(req: Request): string | null {
    const header = req.headers.get("authorization");
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  },
};
