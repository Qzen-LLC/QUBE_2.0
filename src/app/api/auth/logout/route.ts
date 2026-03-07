import { NextResponse } from "next/server";
import { prismaClient } from "@/utils/db";
import { verifyRefreshToken, clearAuthCookies } from "@/services/auth/jwt-auth-service";

export async function POST(request: Request) {
  try {
    // Try to revoke the session if refresh token is present
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshCookie = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("qube-refresh-token="));

    if (refreshCookie) {
      const token = refreshCookie.split("=").slice(1).join("=").trim();
      if (token) {
        try {
          const { sid } = await verifyRefreshToken(token);
          await prismaClient.session.update({
            where: { id: sid },
            data: { revokedAt: new Date() },
          });
        } catch {
          // Token invalid or session not found — still clear cookies
        }
      }
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response.headers);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response.headers);
    return response;
  }
}
