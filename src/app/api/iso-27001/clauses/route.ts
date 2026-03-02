import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET() {
  try {
    // Fetch all ISO 27001 clauses with their subclauses
    const clauses = await prismaClient.iso27001Clause.findMany({
      include: {
        subclauses: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    return NextResponse.json(clauses);

  } catch (error) {
    console.error('Error fetching ISO 27001 clauses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ISO 27001 clauses' },
      { status: 500 }
    );
  }
}
