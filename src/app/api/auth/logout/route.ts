import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/services/auth/jwt-auth-service";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response.headers);
  return response;
}
