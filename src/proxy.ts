import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/webhook',
];

function isPublicRoute(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes to handle their own authentication via withAuth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For all other routes, just pass through.
  // Authentication is handled at the API / page level.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|_next/data|_next|.*\\..*|favicon.ico).*)',
  ],
};
