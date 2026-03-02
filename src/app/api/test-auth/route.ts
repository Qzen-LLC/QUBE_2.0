import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';


export const GET = withAuth(async (request, { auth }) => {
  try {
    console.log('[Test Auth] Starting authentication check...');

    if (!auth.userId) {
      return NextResponse.json({ 
        error: 'Unauthorized - No user session found',
        message: 'Please sign in through the browser first',
        status: 'unauthenticated'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Authentication successful',
      user: {
        id: auth.userId!,
        email: auth.user?.email || null,
        firstName: auth.user?.firstName || null,
        lastName: auth.user?.lastName || null
      },
      status: 'authenticated'
    });

  } catch (error) {
    console.error('[Test Auth] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 });
  }
}, { requireUser: true });