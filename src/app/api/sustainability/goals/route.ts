import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const goals = await prismaClient.sustainabilityGoal.findMany({
      where: { organizationId },
      orderBy: { targetDate: 'asc' }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching sustainability goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...goalData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const goal = await prismaClient.sustainabilityGoal.create({
      data: {
        organizationId,
        ...goalData
      }
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating sustainability goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...goalData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const goal = await prismaClient.sustainabilityGoal.update({
      where: { id },
      data: goalData
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating sustainability goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
