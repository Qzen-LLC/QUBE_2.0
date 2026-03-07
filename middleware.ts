import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/api/auth/",
];

const STATIC_PREFIXES = [
  "/_next/",
  "/favicon",
  "/images/",
  "/fonts/",
];

function isPublicPath(pathname: string): boolean {
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Noop mode — skip auth entirely
  if (process.env.AUTH_PROVIDER === "noop") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("qube-access-token")?.value;

  if (!accessToken) {
    return handleUnauthenticated(request, pathname);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(accessToken, secret);

    // If user has no org and is not heading to onboarding, redirect
    if (!payload.orgId && !pathname.startsWith("/onboarding") && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    return NextResponse.next();
  } catch {
    // Token expired or invalid — redirect to sign-in
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

function handleUnauthenticated(request: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
