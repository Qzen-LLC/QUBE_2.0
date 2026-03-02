import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get all carbon footprint records
    const footprints = await prismaClient.carbonFootprint.findMany({
      where: { organizationId },
      orderBy: { measurementDate: 'desc' }
    });

    const totalEmissions = footprints.reduce((sum, f) => sum + (f.totalEmissions || 0), 0);
    const averageEmissions = footprints.length > 0 ? totalEmissions / footprints.length : 0;
    const energyConsumption = footprints.reduce((sum, f) => sum + (f.energyConsumption || 0), 0);
    const useCasesTracked = footprints.length;

    // Calculate trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentEmissions = footprints
      .filter(f => new Date(f.measurementDate) >= thirtyDaysAgo)
      .reduce((sum, f) => sum + (f.totalEmissions || 0), 0);

    const previousEmissions = footprints
      .filter(f => new Date(f.measurementDate) >= sixtyDaysAgo && new Date(f.measurementDate) < thirtyDaysAgo)
      .reduce((sum, f) => sum + (f.totalEmissions || 0), 0);

    const emissionsTrend = previousEmissions > 0
      ? ((recentEmissions - previousEmissions) / previousEmissions) * 100
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
      .map(([useCaseId, emissions]) => ({
        useCaseId,
        useCaseName: useCaseId, // Would fetch actual name from AIUseCase table
        emissions
      }));

    return NextResponse.json({
      totalEmissions,
      averageEmissions,
      energyConsumption,
      useCasesTracked,
      emissionsTrend,
      topEmitters
    });
  } catch (error) {
    console.error('Error fetching sustainability stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sustainability stats' },
      { status: 500 }
    );
  }
}
