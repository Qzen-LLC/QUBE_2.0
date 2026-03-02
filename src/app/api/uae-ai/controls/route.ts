import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET() {
  try {
    const controls = await prismaClient.uaeAiControl.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(controls);
  } catch (error) {
    console.error('Error fetching UAE AI controls:', error);
    
    // Return empty array if tables don't exist yet
    return NextResponse.json([]);
  }
}