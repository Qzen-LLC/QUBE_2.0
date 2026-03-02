import { NextRequest, NextResponse } from 'next/server';
import { vendorServiceServer } from '@/lib/vendorServiceServer';

interface Params {
  id: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const resolvedParams = await params;
    const result = await vendorServiceServer.calculateOverallScore(resolvedParams.id);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ score: result.data });
  } catch (error: any) {
    console.error('Calculate score API error:', error);
    return NextResponse.json({ error: 'Failed to calculate overall score' }, { status: 500 });
  }
}