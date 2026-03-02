import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';


export async function GET() {
  try {

    const controlCategories = await prismaClient.euAiActControlCategory.findMany({
      include: {
        controls: {
          include: {
            subcontrols: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });


    return NextResponse.json(controlCategories);
  } catch (error) {
    console.error('Error fetching EU AI ACT control categories:', error);
    
    // Return empty array if tables don't exist yet
    return NextResponse.json([]);
  }
}