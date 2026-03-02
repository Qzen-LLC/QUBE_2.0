import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const authorities = await prismaClient.decisionAuthority.findMany({
      where: { organizationId },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(authorities);
  } catch (error) {
    console.error('Error fetching decision authorities:', error);
    return NextResponse.json({ error: 'Failed to fetch decision authorities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...authorityData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const authority = await prismaClient.decisionAuthority.create({
      data: { organizationId, ...authorityData }
    });

    return NextResponse.json(authority);
  } catch (error) {
    console.error('Error creating decision authority:', error);
    return NextResponse.json({ error: 'Failed to create decision authority' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...authorityData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Authority ID is required' }, { status: 400 });
    }

    const authority = await prismaClient.decisionAuthority.update({
      where: { id },
      data: authorityData
    });

    return NextResponse.json(authority);
  } catch (error) {
    console.error('Error updating decision authority:', error);
    return NextResponse.json({ error: 'Failed to update decision authority' }, { status: 500 });
  }
}
