import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Calculate energy metrics from carbon footprint data
    const footprints = await prismaClient.carbonFootprint.findMany({
      where: { organizationId }
    });

    // Group by use case
    const useCaseMetrics = new Map<string, { totalEnergy: number; count: number }>();

    footprints.forEach(f => {
      const current = useCaseMetrics.get(f.useCaseId) || { totalEnergy: 0, count: 0 };
      useCaseMetrics.set(f.useCaseId, {
        totalEnergy: current.totalEnergy + (f.energyConsumption || 0),
        count: current.count + 1
      });
    });

    const metrics = Array.from(useCaseMetrics.entries()).map(([useCaseId, data]) => {
      const energyPerInference = data.totalEnergy / Math.max(data.count, 1);
      const totalInferences = data.count * 1000; // Placeholder

      // Simple efficiency calculation
      let efficiency: 'HIGH' | 'MEDIUM' | 'LOW';
      if (energyPerInference < 0.01) efficiency = 'HIGH';
      else if (energyPerInference < 0.1) efficiency = 'MEDIUM';
      else efficiency = 'LOW';

      return {
        useCaseId,
        useCaseName: useCaseId,
        energyPerInference,
        totalInferences,
        totalEnergy: data.totalEnergy,
        efficiency
      };
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching energy efficiency:', error);
    return NextResponse.json({ error: 'Failed to fetch energy efficiency' }, { status: 500 });
  }
}
