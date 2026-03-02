import { prismaClient } from '@/utils/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';


export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');

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
        // USER can only read their own use cases
        if (useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        // ORG_ADMIN and ORG_USER can only read use cases in their organization
        if (useCase.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const res = await prismaClient.approval.findFirst({ where: { useCaseId } });
    
    // Normalize condition arrays to ensure they're always arrays (not null/undefined)
    if (res) {
      const normalized = {
        ...res,
        governanceConditions: Array.isArray(res.governanceConditions) ? res.governanceConditions : [],
        riskConditions: Array.isArray(res.riskConditions) ? res.riskConditions : [],
        legalConditions: Array.isArray(res.legalConditions) ? res.legalConditions : [],
        businessConditions: Array.isArray(res.businessConditions) ? res.businessConditions : [],
        aiGovernanceConditions: Array.isArray(res.aiGovernanceConditions) ? res.aiGovernanceConditions : [],
        modelValidationConditions: Array.isArray(res.modelValidationConditions) ? res.modelValidationConditions : [],
        aiEthicsConditions: Array.isArray(res.aiEthicsConditions) ? res.aiEthicsConditions : [],
      };
      return NextResponse.json(normalized);
    }
    
    return NextResponse.json(res);
  } catch (error) {
    console.error('Error reading approvals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, { requireUser: true });