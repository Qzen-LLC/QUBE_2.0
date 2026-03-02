import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prismaClient.carbonFootprint.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting carbon footprint:', error);
    return NextResponse.json({ error: 'Failed to delete carbon footprint' }, { status: 500 });
  }
}
