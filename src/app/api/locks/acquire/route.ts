import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let body: { useCaseId?: string; lockType?: string; scope?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body: expected JSON' },
        { status: 400 }
      );
    }

    const { useCaseId, lockType, scope } = body;

    if (!useCaseId || !lockType) {
      return NextResponse.json({
        error: 'Missing required fields: useCaseId and lockType',
      }, { status: 400 });
    }

    // Validate scope (required for lock creation)
    const validScopes = ['ASSESS', 'EDIT', 'GOVERNANCE_EU_AI_ACT', 'GOVERNANCE_ISO_42001', 'GOVERNANCE_UAE_AI', 'GOVERNANCE_ISO_27001'];
    if (typeof scope !== 'string' || !scope || !validScopes.includes(scope)) {
      return NextResponse.json({
        error: 'Invalid or missing scope. Must be one of: ASSESS, EDIT, GOVERNANCE_EU_AI_ACT, GOVERNANCE_ISO_42001, GOVERNANCE_UAE_AI, GOVERNANCE_ISO_27001',
      }, { status: 400 });
    }

    if (!['SHARED', 'EXCLUSIVE'].includes(lockType)) {
      return NextResponse.json({ 
        error: 'Invalid lock type. Must be SHARED or EXCLUSIVE' 
      }, { status: 400 });
    }

    // Check if use case exists and user has access
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

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

    // Clean up expired locks
    await prismaClient.lock.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true
      },
      data: { isActive: false }
    });

    // Check for existing locks based on scope (no include to avoid relation naming issues in generated client)
    const lockWhere = {
      useCaseId,
      scope: scope as 'ASSESS' | 'EDIT' | 'GOVERNANCE_EU_AI_ACT' | 'GOVERNANCE_ISO_42001' | 'GOVERNANCE_UAE_AI' | 'GOVERNANCE_ISO_27001',
      isActive: true
    };

    const existingLocks = await prismaClient.lock.findMany({
      where: lockWhere,
    });

    const exclusiveLocks = existingLocks.filter((l) => l.type === 'EXCLUSIVE');
    const sharedLocks = existingLocks.filter((l) => l.type === 'SHARED');

    // Helper: get display name for lock holder (avoids include/relation issues)
    const getLockHolderName = async (userId: string): Promise<string> => {
      try {
        const u = await prismaClient.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true }
        });
        if (!u) return 'Another user';
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
        return name || u.email || 'Another user';
      } catch {
        return 'Another user';
      }
    };

    // Handle exclusive lock acquisition
    if (lockType === 'EXCLUSIVE') {
      console.log(`[LOCK ACQUIRE] Attempting to acquire EXCLUSIVE lock for useCaseId: ${useCaseId}, scope: ${scope}, userId: ${userRecord.id}`);
      console.log(`[LOCK ACQUIRE] Existing exclusive locks: ${exclusiveLocks.length}, shared locks: ${sharedLocks.length}`);
      
      if (exclusiveLocks.length > 0) {
        const lock = exclusiveLocks[0];
        const heldByCurrentUser = lock.userId === userRecord.id;
        const acquiredBy = heldByCurrentUser ? 'You' : await getLockHolderName(lock.userId);
        console.log(`[LOCK ACQUIRE] Exclusive lock already exists, held by: ${acquiredBy} (currentUser=${heldByCurrentUser})`);
        
        if (heldByCurrentUser) {
          return NextResponse.json({
            success: true,
            lock,
            message: 'Exclusive lock already owned by current user'
          });
        }
        
        return NextResponse.json({
          error: 'Exclusive lock already exists',
          lockDetails: {
            type: lock.type,
            scope: lock.scope,
            acquiredBy,
            acquiredAt: lock.acquiredAt,
            expiresAt: lock.expiresAt
          }
        }, { status: 409 });
      }

      // If there are shared locks, we can still acquire exclusive lock
      // but we'll notify shared lock holders
      try {
        console.log(`[LOCK ACQUIRE] Creating new EXCLUSIVE lock for useCaseId: ${useCaseId}, scope: ${scope}, userId: ${userRecord.id}`);
        
        const lock = await prismaClient.lock.create({
          data: {
            useCaseId,
            userId: userRecord.id,
            type: 'EXCLUSIVE',
            scope,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            isActive: true
          }
        });

        console.log(`[LOCK ACQUIRE] Successfully created EXCLUSIVE lock with ID: ${lock.id}, isActive: ${lock.isActive}`);

        return NextResponse.json({
          success: true,
          lock,
          message: sharedLocks.length > 0 
            ? `Exclusive lock acquired. ${sharedLocks.length} shared lock(s) will be notified.`
            : 'Exclusive lock acquired successfully'
        });
      } catch (error: any) {
        // P2002 = unique constraint on (useCaseId, userId, type, scope) - existing row may be inactive
        if (error.code === 'P2002') {
          console.log(`[LOCK ACQUIRE] Unique constraint violation, attempting to reactivate existing lock`);
          const existingLock = await prismaClient.lock.findFirst({
            where: {
              useCaseId,
              userId: userRecord.id,
              type: 'EXCLUSIVE',
              scope
            }
          });

          if (existingLock) {
            console.log(`[LOCK ACQUIRE] Found existing lock with ID: ${existingLock.id}, reactivating...`);
            const updatedLock = await prismaClient.lock.update({
              where: { id: existingLock.id },
              data: {
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                isActive: true
              }
            });
            console.log(`[LOCK ACQUIRE] Successfully reactivated lock with ID: ${updatedLock.id}, isActive: ${updatedLock.isActive}`);
            return NextResponse.json({
              success: true,
              lock: updatedLock,
              message: 'Exclusive lock reactivated successfully'
            });
          }
        }
        throw error;
      }
    }

    // Handle shared lock acquisition
    if (lockType === 'SHARED') {
      if (exclusiveLocks.length > 0) {
        const lock = exclusiveLocks[0];
        const acquiredBy = await getLockHolderName(lock.userId);
        return NextResponse.json({
          error: 'Cannot acquire shared lock while exclusive lock exists',
          lockDetails: {
            type: lock.type,
            scope: lock.scope,
            acquiredBy,
            acquiredAt: lock.acquiredAt,
            expiresAt: lock.expiresAt
          }
        }, { status: 409 });
      }

      // Check if user already has a shared lock
      const existingUserLock = existingLocks.find((l) => 
        l.userId === userRecord.id && l.type === 'SHARED'
      );

      if (existingUserLock) {
        // Extend existing lock
        const updatedLock = await prismaClient.lock.update({
          where: { id: existingUserLock.id },
          data: {
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            isActive: true
          }
        });

        return NextResponse.json({
          success: true,
          lock: updatedLock,
          message: 'Shared lock extended successfully'
        });
      }

      // Create new shared lock
      try {
        const lock = await prismaClient.lock.create({
          data: {
            useCaseId,
            userId: userRecord.id,
            type: 'SHARED',
            scope,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            isActive: true
          }
        });

        return NextResponse.json({
          success: true,
          lock,
          message: 'Shared lock acquired successfully'
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          const existingLock = await prismaClient.lock.findFirst({
            where: {
              useCaseId,
              userId: userRecord.id,
              type: 'SHARED',
              scope
            }
          });
          if (existingLock) {
            const updatedLock = await prismaClient.lock.update({
              where: { id: existingLock.id },
              data: {
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                isActive: true
              }
            });
            return NextResponse.json({
              success: true,
              lock: updatedLock,
              message: 'Shared lock reactivated successfully'
            });
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: 'Invalid lock type' }, { status: 400 });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: unknown; message?: string };
    console.error('[LOCK ACQUIRE] Error acquiring lock:', {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      stack: err && typeof err === 'object' && 'stack' in err ? (err as Error).stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to acquire lock',
        ...(process.env.NODE_ENV === 'development' && err?.code
          ? { debug: { code: err.code, message: err?.message } }
          : {}),
      },
      { status: 500 }
    );
  }
}, { requireUser: true });