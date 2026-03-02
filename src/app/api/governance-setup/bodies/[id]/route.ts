import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prismaClient.governanceBody.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting governance body:', error);
    return NextResponse.json(
      { error: 'Failed to delete governance body' },
      { status: 500 }
    );
  }
}
