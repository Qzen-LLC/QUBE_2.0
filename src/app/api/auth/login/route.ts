import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prismaClient } from "@/utils/db";
import {
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from "@/services/auth/jwt-auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prismaClient.user.findUnique({
      where: { email },
      select: {
        id: true,
        clerkId: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const tokenFamily = uuidv4();
    const session = await prismaClient.session.create({
      data: {
        userId: user.id,
        tokenFamily,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = await createAccessToken({
      clerkId: user.clerkId,
      role: user.role,
      organizationId: user.organizationId,
    });
    const refreshToken = await createRefreshToken(session.id, tokenFamily);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    });

    setAuthCookies(response.headers, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
