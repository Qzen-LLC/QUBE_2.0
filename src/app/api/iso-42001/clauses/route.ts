import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';


export async function GET() {
  try {

    const clauses = await prismaClient.iso42001Clause.findMany({
      include: {
        subclauses: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });


    return NextResponse.json(clauses);
  } catch (error) {
    console.error('Error fetching ISO 42001 clauses:', error);
    
    // Return empty array if tables don't exist yet
    return NextResponse.json([]);
  }
}