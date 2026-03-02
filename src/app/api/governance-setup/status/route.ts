import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check for governance charter
    const charter = await prismaClient.governanceCharter.findUnique({
      where: { organizationId }
    });

    // Check for governance bodies
    const bodiesCount = await prismaClient.governanceBody.count({
      where: { organizationId, isActive: true }
    });

    // Check for decision authority rules
    const decisionRulesCount = await prismaClient.decisionAuthority.count({
      where: { organizationId, isActive: true }
    });

    // Check for escalation rules
    const escalationRulesCount = await prismaClient.escalationRule.count({
      where: { organizationId, isActive: true }
    });

    const hasCharter = charter !== null;
    const hasBodies = bodiesCount > 0;
    const hasDecisionRights = decisionRulesCount > 0;
    const hasEscalationRules = escalationRulesCount > 0;

    const completedItems = [
      hasCharter,
      hasBodies,
      hasDecisionRights,
      hasEscalationRules
    ].filter(Boolean).length;

    const completionPercentage = Math.round((completedItems / 4) * 100);

    return NextResponse.json({
      hasCharter,
      hasBodies,
      hasDecisionRights,
      hasEscalationRules,
      completionPercentage,
      bodiesCount,
      decisionRulesCount,
      escalationRulesCount
    });
  } catch (error) {
    console.error('Error fetching governance setup status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup status' },
      { status: 500 }
    );
  }
}
