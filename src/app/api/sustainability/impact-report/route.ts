import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const footprints = await prismaClient.carbonFootprint.findMany({
      where: {
        organizationId,
        measurementDate: { gte: thirtyDaysAgo }
      }
    });

    const totalEmissions = footprints.reduce((sum, f) => sum + (f.totalEmissions || 0), 0);
    const energyConsumption = footprints.reduce((sum, f) => sum + (f.energyConsumption || 0), 0);

    // Calculate emissions change
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousFootprints = await prismaClient.carbonFootprint.findMany({
      where: {
        organizationId,
        measurementDate: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    });

    const previousEmissions = previousFootprints.reduce((sum, f) => sum + (f.totalEmissions || 0), 0);
    const emissionsChange = previousEmissions > 0
      ? ((totalEmissions - previousEmissions) / previousEmissions) * 100
      : 0;

    // Top emitters
    const useCaseEmissions = new Map<string, number>();
    footprints.forEach(f => {
      const current = useCaseEmissions.get(f.useCaseId) || 0;
      useCaseEmissions.set(f.useCaseId, current + (f.totalEmissions || 0));
    });

    const topEmitters = Array.from(useCaseEmissions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, emissions]) => ({
        name,
        emissions,
        percentage: totalEmissions > 0 ? (emissions / totalEmissions) * 100 : 0
      }));

    const recommendations = [
      'Consider switching to more efficient models for high-emission use cases',
      'Implement batch processing to reduce inference overhead',
      'Use model caching and reuse strategies to minimize redundant computations',
      'Optimize data preprocessing pipelines to reduce computational requirements',
      'Evaluate energy-efficient cloud providers and regions'
    ];

    return NextResponse.json({
      period: 'Last 30 Days',
      totalEmissions,
      emissionsChange,
      energyConsumption,
      useCasesAnalyzed: footprints.length,
      topEmitters,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching impact report:', error);
    return NextResponse.json({ error: 'Failed to fetch impact report' }, { status: 500 });
  }
}
