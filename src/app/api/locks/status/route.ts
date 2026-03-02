import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const GET = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    console.log('[LOCK STATUS] Starting lock status check...');
    
    console.log('[LOCK STATUS] User found:', auth.userId!);

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      console.log('[LOCK STATUS] User record not found for clerk ID:', auth.userId!);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[LOCK STATUS] User record found:', userRecord.id);

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const scope = searchParams.get('scope');

    console.log('[LOCK STATUS] Request parameters:', { useCaseId, scope });

    if (!useCaseId || !scope) {
      console.log('[LOCK STATUS] Missing required parameters');
      return NextResponse.json({ 
        error: 'Missing required parameters: useCaseId and scope' 
      }, { status: 400 });
    }

    // Validate scope
    const validScopes = ['ASSESS', 'EDIT', 'GOVERNANCE_EU_AI_ACT', 'GOVERNANCE_ISO_42001', 'GOVERNANCE_UAE_AI', 'GOVERNANCE_ISO_27001'];
    if (!validScopes.includes(scope)) {
      console.log('[LOCK STATUS] Invalid scope:', scope);
      return NextResponse.json({ 
        error: 'Invalid scope. Must be one of: ASSESS, EDIT, GOVERNANCE_EU_AI_ACT, GOVERNANCE_ISO_42001, GOVERNANCE_UAE_AI, GOVERNANCE_ISO_27001' 
      }, { status: 400 });
    }

    // Check if use case exists and user has access
    console.log('[LOCK STATUS] Checking use case:', useCaseId);
    
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
    });

    if (!useCase) {
      console.log('[LOCK STATUS] Use case not found:', useCaseId);
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    console.log('[LOCK STATUS] Use case found:', useCase.id);

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      if (userRecord.role === 'USER') {
        if (useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        if (useCase.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Clean up expired locks first
    console.log('[LOCK STATUS] Cleaning up expired locks...');
    try {
      await prismaClient.lock.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: { isActive: false }
      });
    } catch (cleanupError) {
      console.error('[LOCK STATUS] Error cleaning up expired locks:', cleanupError);
      // Continue anyway, this is not critical
    }

    // Check for existing locks on this specific scope
    console.log('[LOCK STATUS] Checking for existing locks...');
    let existingLocks = [];
    try {
      existingLocks = await prismaClient.lock.findMany({
        where: {
          useCaseId,
          scope: scope as any,
          isActive: true
        },
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
    } catch (lockError) {
      console.error('[LOCK STATUS] Error fetching locks:', lockError);
      // Return default state if we can't fetch locks
      return NextResponse.json({ 
        lockInfo: {
          hasLock: false,
          canEdit: true
        }
      });
    }

    console.log('[LOCK STATUS] Found existing locks:', existingLocks.length);

    const exclusiveLocks = existingLocks.filter(lock => lock.type === 'EXCLUSIVE');
    const sharedLocks = existingLocks.filter(lock => lock.type === 'SHARED');

    console.log('[LOCK STATUS] Exclusive locks:', exclusiveLocks.length, 'Shared locks:', sharedLocks.length);

    let lockInfo = null;

    if (exclusiveLocks.length > 0) {
      // There's an exclusive lock
      const exclusiveLock = exclusiveLocks[0];
      const heldByCurrentUser = exclusiveLock.userId === userRecord.id;
      
      // Safely handle User data that might be null
      const userName = exclusiveLock.User 
        ? `${exclusiveLock.User.firstName || ''} ${exclusiveLock.User.lastName || ''}`.trim() || 'Unknown User'
        : 'Unknown User';
      
      lockInfo = {
        hasLock: true,
        canEdit: heldByCurrentUser,
        lockDetails: {
          scope: exclusiveLock.scope as any,
          acquiredBy: userName,
          acquiredAt: exclusiveLock.acquiredAt?.toISOString() || new Date().toISOString(),
          expiresAt: exclusiveLock.expiresAt?.toISOString() || new Date().toISOString(),
          isOwnedByCurrentUser: heldByCurrentUser
        }
      };
    } else if (sharedLocks.length > 0) {
      // There are shared locks but no exclusive lock
      const currentUserSharedLock = sharedLocks.find(lock => lock.userId === userRecord.id);
      
      lockInfo = {
        hasLock: !!currentUserSharedLock,
        canEdit: true, // Shared locks allow editing
        lockDetails: currentUserSharedLock ? {
          scope: currentUserSharedLock.scope as any,
          acquiredBy: 'You',
          acquiredAt: currentUserSharedLock.acquiredAt?.toISOString() || new Date().toISOString(),
          expiresAt: currentUserSharedLock.expiresAt?.toISOString() || new Date().toISOString(),
          isOwnedByCurrentUser: true
        } : undefined
      };
    } else {
      // No locks exist
      lockInfo = {
        hasLock: false,
        canEdit: true
      };
    }

    console.log('[LOCK STATUS] Returning lock info:', lockInfo);
    return NextResponse.json({ lockInfo });
  } catch (error) {
    console.error('[LOCK STATUS] Error checking lock status:', error);
    console.error('[LOCK STATUS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a safe default response instead of throwing
    return NextResponse.json({ 
      lockInfo: {
        hasLock: false,
        canEdit: true
      }
    });
  }
}, { requireUser: true });