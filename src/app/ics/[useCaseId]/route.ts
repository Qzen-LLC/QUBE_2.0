import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

/**
 * GET /ics/[useCaseId]
 * Returns risk metrics and chart data for a use case
 * This endpoint provides risk assessment data for the assess dashboard
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }
  ) => {
    try {
      const { useCaseId } = await params;

      if (!useCaseId) {
        return NextResponse.json(
          { error: 'useCaseId is required' },
          { status: 400 }
        );
      }

      const userRecord = await prismaClient.user.findUnique({
        where: { clerkId: auth.userId! },
      });

      if (!userRecord) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Verify user has access to this use case
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
        select: {
          id: true,
          userId: true,
          organizationId: true,
        },
      });

      if (!useCase) {
        return NextResponse.json(
          { error: 'Use case not found' },
          { status: 404 }
        );
      }

      // Check permissions
      const hasAccess =
        userRecord.role === 'QZEN_ADMIN' ||
        (userRecord.role === 'ORG_ADMIN' &&
          useCase.organizationId === userRecord.organizationId) ||
        (userRecord.role === 'ORG_USER' &&
          useCase.organizationId === userRecord.organizationId) ||
        useCase.userId === userRecord.id;

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      // Fetch risks for this use case
      const risks = await prismaClient.risk.findMany({
        where: { useCaseId },
        select: {
          id: true,
          riskScore: true,
          status: true,
          createdAt: true,
        },
      });

      // Calculate risk metrics
      const totalRisks = risks.length;
      const openRisks = risks.filter((r) => r.status === 'OPEN').length;
      const avgRiskScore =
        risks.length > 0
          ? risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) / risks.length
          : 0;

      // Generate chart data (monthly risk trend)
      // Group risks by month
      const monthlyData: Record<string, number> = {};
      risks.forEach((risk) => {
        const month = new Date(risk.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const chartData = Object.entries(monthlyData)
        .map(([month, count]) => ({
          month,
          desktop: count,
        }))
        .sort((a, b) => {
          // Sort by date
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      // Return the expected structure
      return NextResponse.json({
        risk: {
          total: totalRisks,
          open: openRisks,
          closed: totalRisks - openRisks,
          averageScore: Math.round(avgRiskScore * 100) / 100,
          chartData,
        },
      });
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  { requireUser: true }
);

