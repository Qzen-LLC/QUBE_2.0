import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alert = await prismaClient.governanceAlert.update({
      where: { id: params.id },
      data: {
        status: 'ACKNOWLEDGED'
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
  }
}
