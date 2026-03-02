import { prismaClient, retryDatabaseOperation } from '@/utils/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';


export const POST = withAuth(async (
  req: Request,
  { auth }: { auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { useCaseId, ...rest } = body;
    
    if (!useCaseId) {
      return NextResponse.json({ error: 'Missing useCaseId' }, { status: 400 });
    }

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
      });
      
      if (!useCase) {
        return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
      }
      
      if (userRecord.role === 'USER') {
        // USER can only write to their own use cases
        if (useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        // ORG_ADMIN and ORG_USER can only write to use cases in their organization
        if (useCase.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Coerce fields that must be strings (some clients may submit arrays)
    // Ensure condition arrays are properly formatted (never null, always arrays)
    const cleanedUpdate: any = {
      ...rest,
      businessFunction: Array.isArray((rest as any).businessFunction)
        ? (rest as any).businessFunction[0] ?? ''
        : (rest as any).businessFunction ?? '',
      // Ensure all condition arrays are arrays (not null/undefined)
      governanceConditions: Array.isArray((rest as any).governanceConditions) 
        ? (rest as any).governanceConditions.filter((c: string) => c && c.trim() !== '')
        : [],
      riskConditions: Array.isArray((rest as any).riskConditions)
        ? (rest as any).riskConditions.filter((c: string) => c && c.trim() !== '')
        : [],
      legalConditions: Array.isArray((rest as any).legalConditions)
        ? (rest as any).legalConditions.filter((c: string) => c && c.trim() !== '')
        : [],
      businessConditions: Array.isArray((rest as any).businessConditions)
        ? (rest as any).businessConditions.filter((c: string) => c && c.trim() !== '')
        : [],
      aiGovernanceConditions: Array.isArray((rest as any).aiGovernanceConditions)
        ? (rest as any).aiGovernanceConditions.filter((c: string) => c && c.trim() !== '')
        : [],
      modelValidationConditions: Array.isArray((rest as any).modelValidationConditions)
        ? (rest as any).modelValidationConditions.filter((c: string) => c && c.trim() !== '')
        : [],
      aiEthicsConditions: Array.isArray((rest as any).aiEthicsConditions)
        ? (rest as any).aiEthicsConditions.filter((c: string) => c && c.trim() !== '')
        : [],
    };

    // Use retry logic for database operations to handle connection issues
    const res = await retryDatabaseOperation(async () => {
      return await prismaClient.approval.upsert({
        where: { useCaseId },
        update: cleanedUpdate,
        create: { useCaseId, ...cleanedUpdate },
      });
    }, 3);

    console.log('[CRUD_LOG] Approval data upserted:', { 
      useCaseId, 
      approvalId: res.id, 
      updatedAt: res.updatedAt, 
      authoredBy: userRecord.id,
      conditionsCounts: {
        governance: cleanedUpdate.governanceConditions?.length || 0,
        risk: cleanedUpdate.riskConditions?.length || 0,
        legal: cleanedUpdate.legalConditions?.length || 0,
        business: cleanedUpdate.businessConditions?.length || 0,
        aiGovernance: cleanedUpdate.aiGovernanceConditions?.length || 0,
        modelValidation: cleanedUpdate.modelValidationConditions?.length || 0,
        aiEthics: cleanedUpdate.aiEthicsConditions?.length || 0,
      }
    });
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Error writing approvals:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Connection terminated') || error.message?.includes('ECONNRESET')) {
      return NextResponse.json({ 
        error: 'Database connection error. Please try again.',
        details: error.message 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}, { requireUser: true });