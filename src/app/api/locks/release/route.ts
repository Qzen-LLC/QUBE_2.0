import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (request: Request, { auth }: { auth: any }) => {
  console.log('🔒 [API] Lock release endpoint called');
  console.log('🔒 [API] Request URL:', request.url);
  console.log('🔒 [API] Request method:', request.method);
  console.log('🔒 [API] Request headers:', Object.fromEntries(request.headers.entries()));
  try {
    console.log('🔒 [API] User authenticated:', auth.userId!);

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let useCaseId: string;
    let lockType: string;
    let scope: string | undefined;

    // Handle both JSON and FormData (for beacon requests)
    const contentType = request.headers.get('content-type');
    console.log('🔒 [API] Content-Type:', contentType);
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      useCaseId = body.useCaseId;
      lockType = body.lockType;
      scope = body.scope;
      console.log('🔒 [API] Parsed JSON body:', { useCaseId, lockType, scope });
    } else {
      // Handle FormData from beacon
      const formData = await request.formData();
      useCaseId = formData.get('useCaseId') as string;
      lockType = formData.get('lockType') as string;
      scope = formData.get('scope') as string | undefined;
      console.log('🔒 [API] Parsed FormData:', { useCaseId, lockType, scope });
    }

    if (!useCaseId || !lockType) {
      return NextResponse.json({ 
        error: 'Missing required fields: useCaseId and lockType' 
      }, { status: 400 });
    }

    if (!['SHARED', 'EXCLUSIVE'].includes(lockType)) {
      return NextResponse.json({ 
        error: 'Invalid lock type. Must be SHARED or EXCLUSIVE' 
      }, { status: 400 });
    }

    // Validate scope if provided
    if (scope) {
      const validScopes = ['ASSESS', 'EDIT', 'GOVERNANCE_EU_AI_ACT', 'GOVERNANCE_ISO_42001', 'GOVERNANCE_UAE_AI', 'GOVERNANCE_ISO_27001'];
      if (!validScopes.includes(scope)) {
        return NextResponse.json({ 
          error: 'Invalid scope. Must be one of: ASSESS, EDIT, GOVERNANCE_EU_AI_ACT, GOVERNANCE_ISO_42001, GOVERNANCE_UAE_AI, GOVERNANCE_ISO_27001' 
        }, { status: 400 });
      }
    }

    // Find the current user's active lock of the specified type for this use case
    console.log('🔒 [API] Searching for current user\'s lock with criteria:', {
      useCaseId,
      userId: userRecord.id,
      type: lockType,
      scope: scope || 'ASSESS',
      isActive: true
    });
    
    const lock = await prismaClient.lock.findFirst({
      where: {
        useCaseId,
        userId: userRecord.id, // Only look for current user's lock
        type: lockType as any,
        scope: (scope || 'ASSESS') as any,
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

    console.log(`[LOCK RELEASE] Searching for lock with:`, {
      useCaseId,
      lockType,
      scope: scope || 'ASSESS',
      isActive: true
    });
    
    console.log(`[LOCK RELEASE] Found lock:`, lock ? {
      id: lock.id,
      userId: lock.userId,
      scope: lock.scope,
      isActive: lock.isActive
    } : 'No active lock found');

    if (!lock) {
      // No active lock found for current user - this is fine, just return success
      console.log(`[LOCK RELEASE] No active ${lockType} lock found for current user to release`);
      return NextResponse.json({
        success: true,
        message: `No active ${lockType} lock found for current user to release`,
        alreadyReleased: true
      });
    }

    // Release the active lock
    console.log(`[LOCK RELEASE] Releasing lock ${lock.id} for user ${lock.userId}`);
    
    await prismaClient.lock.update({
      where: { id: lock.id },
      data: { isActive: false }
    });
    
    console.log(`[LOCK RELEASE] Lock ${lock.id} released successfully`);

    return NextResponse.json({
      success: true,
      message: `${lockType} lock released successfully for current user`,
      alreadyReleased: false
    });

  } catch (error) {
    console.error('Error releasing lock:', error);
    return NextResponse.json(
      { error: 'Failed to release lock' },
      { status: 500 }
    );
  }
}, { requireUser: true });