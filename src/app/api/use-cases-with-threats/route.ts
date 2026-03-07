import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { getOrgScope } from '@/lib/org-scope';

export const GET = withAuth(async (request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get org-scoped filtering based on user role
    const scope = await getOrgScope(auth);

    // Build where clause from scope, with optional organizationId filter for admins
    const whereClause: any = { ...scope.whereClause };

    if (organizationId) {
      if (scope.isAdmin) {
        // QZEN_ADMIN can filter by any organization
        whereClause.organizationId = organizationId;
      } else if (scope.organizationId && organizationId !== scope.organizationId) {
        // Non-admin trying to access a different org
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Fetch use cases with their threats
    const useCases = await prismaClient.useCase.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        threats: {
          orderBy: [
            { status: 'asc' },
            { severityScore: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Fetch all organizations for QZEN_ADMIN
    let organizations = [];
    if (scope.isAdmin) {
      organizations = await prismaClient.organization.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({
      useCases,
      organizations,
      userRole: scope.isAdmin ? 'QZEN_ADMIN' : (scope.organizationId ? 'ORG_USER' : 'USER'),
      userOrganizationId: scope.organizationId
    });
  } catch (error) {
    console.error('Error fetching use cases with threats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch use cases with threats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });
