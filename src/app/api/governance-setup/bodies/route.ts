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

    const bodies = await prismaClient.governanceBody.findMany({
      where: { organizationId },
      include: {
        members: true,
        meetings: {
          take: 5,
          orderBy: { scheduledDate: 'desc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(bodies);
  } catch (error) {
    console.error('Error fetching governance bodies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance bodies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...bodyData } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const governanceBody = await prismaClient.governanceBody.create({
      data: {
        organizationId,
        ...bodyData
      },
      include: {
        members: true
      }
    });

    return NextResponse.json(governanceBody);
  } catch (error) {
    console.error('Error creating governance body:', error);
    return NextResponse.json(
      { error: 'Failed to create governance body' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, organizationId, ...bodyData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Body ID is required' },
        { status: 400 }
      );
    }

    const governanceBody = await prismaClient.governanceBody.update({
      where: { id },
      data: bodyData,
      include: {
        members: true
      }
    });

    return NextResponse.json(governanceBody);
  } catch (error) {
    console.error('Error updating governance body:', error);
    return NextResponse.json(
      { error: 'Failed to update governance body' },
      { status: 500 }
    );
  }
}
