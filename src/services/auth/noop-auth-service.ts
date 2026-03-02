import type { AuthContext, AuthenticatedUser, ServerAuthService, UserRole } from "./types";
import { prismaClient } from "@/utils/db";

// In-memory cache for the default user to avoid repeated DB queries
let cachedDefaultUser: AuthenticatedUser | null = null;

async function getDefaultUser(): Promise<AuthenticatedUser> {
  if (cachedDefaultUser) return cachedDefaultUser;

  const user = await prismaClient.user.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    // Fallback: try any user at all
    const anyUser = await prismaClient.user.findFirst({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!anyUser) {
      throw new Error("No users found in database. Please seed at least one user.");
    }

    cachedDefaultUser = {
      id: anyUser.clerkId || anyUser.id,
      email: anyUser.email ?? null,
      firstName: anyUser.firstName ?? null,
      lastName: anyUser.lastName ?? null,
      organizationId: anyUser.organizationId ?? null,
      roles: ["QZEN_ADMIN"],
      permissions: ["*"],
      claims: undefined,
      raw: undefined,
    };
    return cachedDefaultUser;
  }

  cachedDefaultUser = {
    id: user.clerkId || user.id,
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    organizationId: user.organizationId ?? null,
    roles: ["QZEN_ADMIN"],
    permissions: ["*"],
    claims: undefined,
    raw: undefined,
  };

  return cachedDefaultUser;
}

async function buildContext(): Promise<AuthContext> {
  const authenticatedUser = await getDefaultUser();

  return {
    user: authenticatedUser,
    userId: authenticatedUser.id,
    sessionId: "noop-session",
    organizationId: authenticatedUser.organizationId ?? null,
    tokenClaims: null,
    provider: "NONE",
    method: "session",
  };
}

export const noopAuthService: ServerAuthService = {
  provider: "NONE",

  async getAuthContext(_req: Request): Promise<AuthContext> {
    return buildContext();
  },

  async requireUser(_req: Request): Promise<AuthContext> {
    return buildContext();
  },

  async hasRole(_req: Request, _roles: UserRole[]): Promise<boolean> {
    // Always authorized
    return true;
  },

  getBearerToken(_req: Request): string | null {
    return null;
  },
};

export default noopAuthService;
