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
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prismaClient.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const clerkId = `usr_${uuidv4().replace(/-/g, "")}`;

    const user = await prismaClient.user.create({
      data: {
        clerkId,
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "USER",
      },
    });

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
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
