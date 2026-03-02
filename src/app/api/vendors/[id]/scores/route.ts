import { NextRequest, NextResponse } from 'next/server';
import { vendorServiceServer } from '@/lib/vendorServiceServer';

interface Params {
  id: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { category, subcategory, score, comment } = await request.json();
    const resolvedParams = await params;
    
    const result = await vendorServiceServer.updateAssessmentScore(
      resolvedParams.id,
      category,
      subcategory,
      score,
      comment || ''
    );
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Calculate and update overall score
    await vendorServiceServer.calculateOverallScore(resolvedParams.id);
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Assessment score API error:', error);
    return NextResponse.json({ error: 'Failed to update assessment score' }, { status: 500 });
  }
}