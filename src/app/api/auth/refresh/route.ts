import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prismaClient } from "@/utils/db";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/services/auth/jwt-auth-service";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshCookie = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("qube-refresh-token="));

    if (!refreshCookie) {
      return NextResponse.json(
        { error: "No refresh token" },
        { status: 401 }
      );
    }

    const token = refreshCookie.split("=").slice(1).join("=").trim();
    if (!token) {
      return NextResponse.json(
        { error: "No refresh token" },
        { status: 401 }
      );
    }

    let payload: { sid: string; fam: string };
    try {
      payload = await verifyRefreshToken(token);
    } catch {
      const response = NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
      clearAuthCookies(response.headers);
      return response;
    }

    // Look up session
    const session = await prismaClient.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      // If session was revoked, this might be a token reuse attack — revoke all sessions in the family
      if (session?.revokedAt) {
        await prismaClient.session.updateMany({
          where: { tokenFamily: session.tokenFamily, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      const response = NextResponse.json(
        { error: "Session expired or revoked" },
        { status: 401 }
      );
      clearAuthCookies(response.headers);
      return response;
    }

    if (!session.user.isActive) {
      const response = NextResponse.json(
        { error: "Account deactivated" },
        { status: 401 }
      );
      clearAuthCookies(response.headers);
      return response;
    }

    // Rotate: revoke old session, create new one in same family
    await prismaClient.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newSession = await prismaClient.session.create({
      data: {
        userId: session.userId,
        tokenFamily: session.tokenFamily,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = await createAccessToken({
      clerkId: session.user.clerkId,
      role: session.user.role,
      organizationId: session.user.organizationId,
    });
    const refreshTokenNew = await createRefreshToken(
      newSession.id,
      session.tokenFamily
    );

    const response = NextResponse.json({ success: true });
    setAuthCookies(response.headers, accessToken, refreshTokenNew);
    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}
