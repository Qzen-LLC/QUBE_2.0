import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const audits = await prismaClient.auditLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}
