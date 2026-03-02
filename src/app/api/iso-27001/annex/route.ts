import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';


export async function GET() {
  try {


    const annexCategories = await prismaClient.iso27001AnnexCategory.findMany({
      include: {
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });


    return NextResponse.json(annexCategories);
  } catch (error) {
    console.error('Error fetching ISO 27001 annex:', error);
    
    // Return empty array if tables don't exist yet
    return NextResponse.json([]);
  }
}
