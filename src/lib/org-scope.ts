import type { AuthContext } from "@/services/auth/types";
import { prismaClient } from "@/utils/db";

interface OrgScope {
  userId: string;
  organizationId: string | null;
  whereClause: Record<string, unknown>;
  isAdmin: boolean;
}

/**
 * Returns org-scoping information based on the authenticated user's role.
 * - QZEN_ADMIN: no filtering (god mode)
 * - ORG_ADMIN / ORG_USER: filter by organizationId
 * - USER (no org): filter by userId only
 */
export async function getOrgScope(auth: AuthContext): Promise<OrgScope> {
  const roles = auth.user?.roles || [];
  const isQzenAdmin = roles.includes("QZEN_ADMIN");
  const orgId = auth.organizationId || auth.user?.organizationId || null;

  // Look up the actual DB user id (auth.userId is clerkId)
  const dbUser = await prismaClient.user.findUnique({
    where: { clerkId: auth.userId! },
    select: { id: true, organizationId: true },
  });

  const userId = dbUser?.id || "";
  const effectiveOrgId = orgId || dbUser?.organizationId || null;

  if (isQzenAdmin) {
    return { userId, organizationId: effectiveOrgId, whereClause: {}, isAdmin: true };
  }

  if (effectiveOrgId) {
    return {
      userId,
      organizationId: effectiveOrgId,
      whereClause: { organizationId: effectiveOrgId },
      isAdmin: false,
    };
  }

  // USER with no org — can only see own data
  return {
    userId,
    organizationId: null,
    whereClause: { userId },
    isAdmin: false,
  };
}

/**
 * Verifies the authenticated user has access to a specific use case.
 * - QZEN_ADMIN: always true
 * - ORG_ADMIN / ORG_USER: use case must belong to user's organization
 * - USER: use case must belong to user directly
 */
export async function verifyUseCaseAccess(auth: AuthContext, useCaseId: string): Promise<boolean> {
  const roles = auth.user?.roles || [];
  if (roles.includes("QZEN_ADMIN")) return true;

  const dbUser = await prismaClient.user.findUnique({
    where: { clerkId: auth.userId! },
    select: { id: true, organizationId: true },
  });

  if (!dbUser) return false;

  const useCase = await prismaClient.useCase.findUnique({
    where: { id: useCaseId },
    select: { organizationId: true, userId: true },
  });

  if (!useCase) return false;

  // Check org match
  if (dbUser.organizationId && useCase.organizationId === dbUser.organizationId) {
    return true;
  }

  // Check direct ownership
  if (useCase.userId === dbUser.id) {
    return true;
  }

  return false;
}
