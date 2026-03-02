import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';


export async function GET() {
  try {

    const topics = await prismaClient.euAiActTopic.findMany({
      include: {
        subtopics: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });


    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching EU AI ACT topics:', error);
    
    // Return empty array if tables don't exist yet
    return NextResponse.json([]);
  }
}