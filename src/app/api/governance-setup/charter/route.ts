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

    const charter = await prismaClient.governanceCharter.findUnique({
      where: { organizationId }
    });

    return NextResponse.json(charter);
  } catch (error) {
    console.error('Error fetching governance charter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance charter' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...charterData } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const charter = await prismaClient.governanceCharter.create({
      data: {
        organizationId,
        ...charterData
      }
    });

    return NextResponse.json(charter);
  } catch (error) {
    console.error('Error creating governance charter:', error);
    return NextResponse.json(
      { error: 'Failed to create governance charter' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, organizationId, ...charterData } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const charter = await prismaClient.governanceCharter.upsert({
      where: { organizationId },
      update: charterData,
      create: {
        organizationId,
        ...charterData
      }
    });

    return NextResponse.json(charter);
  } catch (error) {
    console.error('Error updating governance charter:', error);
    return NextResponse.json(
      { error: 'Failed to update governance charter' },
      { status: 500 }
    );
  }
}
