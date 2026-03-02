import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

export const GET = withAuth(async (_req, { auth }) => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    userId: auth.userId,
    message: 'Auth is disabled (no-op mode). No token minting available.',
  });
}, { requireUser: true });
