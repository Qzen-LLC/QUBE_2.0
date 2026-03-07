import { NextResponse } from "next/server";
import { prismaClient } from "@/utils/db";
import { getAuthService } from "@/services/auth/auth-service-factory";
import { createAccessToken, setAuthCookies } from "@/services/auth/jwt-auth-service";

export async function POST(request: Request) {
  try {
    const authService = getAuthService();
    const authCtx = await authService.requireUser(request);

    if (!authCtx.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const dbUser = await prismaClient.user.findUnique({
      where: { clerkId: authCtx.user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.organizationId) {
      return NextResponse.json({ error: "User already belongs to an organization" }, { status: 400 });
    }

    const body = await request.json();
    const { name, domain } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    // Check domain uniqueness if provided
    if (domain) {
      const existing = await prismaClient.organization.findUnique({
        where: { domain: domain.toLowerCase() },
      });
      if (existing) {
        return NextResponse.json({ error: "An organization with this domain already exists" }, { status: 409 });
      }
    }

    // Create org and assign user as ORG_ADMIN in a transaction
    const result = await prismaClient.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          domain: domain ? domain.toLowerCase() : null,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: dbUser.id },
        data: {
          organizationId: org.id,
          role: "ORG_ADMIN",
        },
      });

      return { org, user: updatedUser };
    });

    // Re-issue tokens with the new orgId
    const accessToken = await createAccessToken({
      clerkId: result.user.clerkId,
      role: result.user.role,
      organizationId: result.org.id,
    });

    const response = NextResponse.json({
      success: true,
      organization: {
        id: result.org.id,
        name: result.org.name,
        domain: result.org.domain,
      },
    });

    setAuthCookies(response.headers, accessToken);
    return response;
  } catch (error) {
    console.error("Organization setup error:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
