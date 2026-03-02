import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    console.log('[TEST STATUS] Starting test...');

    if (!auth.userId) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }

    // Test 2: Check if user record exists
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    console.log('[TEST STATUS] User record:', userRecord ? userRecord.id : 'null');
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    // Test 3: Check database connection
    const lockCount = await prismaClient.lock.count();
    console.log('[TEST STATUS] Total locks in database:', lockCount);

    // Test 4: Check if we can query locks
    const testLocks = await prismaClient.lock.findMany({
      take: 5,
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    console.log('[TEST STATUS] Sample locks:', testLocks.length);

    return NextResponse.json({
      success: true,
      user: {
        clerkId: auth.userId!,
        userId: userRecord.id,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName
      },
      database: {
        totalLocks: lockCount,
        sampleLocks: testLocks.length
      }
    });

  } catch (error) {
    console.error('[TEST STATUS] Error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}, { requireUser: true });