import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const rules = await prismaClient.escalationRule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching escalation rules:', error);
    return NextResponse.json({ error: 'Failed to fetch escalation rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, triggerCondition, escalationPath, ...ruleData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const rule = await prismaClient.escalationRule.create({
      data: {
        organizationId,
        triggerCondition: triggerCondition || {},
        escalationPath: escalationPath || {},
        ...ruleData
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error creating escalation rule:', error);
    return NextResponse.json({ error: 'Failed to create escalation rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, triggerCondition, escalationPath, ...ruleData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const rule = await prismaClient.escalationRule.update({
      where: { id },
      data: {
        triggerCondition: triggerCondition || {},
        escalationPath: escalationPath || {},
        ...ruleData
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating escalation rule:', error);
    return NextResponse.json({ error: 'Failed to update escalation rule' }, { status: 500 });
  }
}
