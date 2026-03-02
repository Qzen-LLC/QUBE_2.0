import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prismaClient.governanceKPI.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    return NextResponse.json({ error: 'Failed to delete KPI' }, { status: 500 });
  }
}
