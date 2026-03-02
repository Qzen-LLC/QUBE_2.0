import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const kpis = await prismaClient.governanceKPI.findMany({
      where: { organizationId },
      orderBy: { measurementDate: 'desc' }
    });

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...kpiData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Auto-calculate status based on current vs target
    let status = kpiData.status;
    if (kpiData.current !== undefined && kpiData.target) {
      const percentage = (kpiData.current / kpiData.target) * 100;
      if (percentage >= 90) status = 'ON_TRACK';
      else if (percentage >= 70) status = 'AT_RISK';
      else status = 'OFF_TRACK';
    }

    const kpi = await prismaClient.governanceKPI.create({
      data: {
        organizationId,
        ...kpiData,
        status
      }
    });

    return NextResponse.json(kpi);
  } catch (error) {
    console.error('Error creating KPI:', error);
    return NextResponse.json({ error: 'Failed to create KPI' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...kpiData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    let status = kpiData.status;
    if (kpiData.current !== undefined && kpiData.target) {
      const percentage = (kpiData.current / kpiData.target) * 100;
      if (percentage >= 90) status = 'ON_TRACK';
      else if (percentage >= 70) status = 'AT_RISK';
      else status = 'OFF_TRACK';
    }

    const kpi = await prismaClient.governanceKPI.update({
      where: { id },
      data: {
        ...kpiData,
        status
      }
    });

    return NextResponse.json(kpi);
  } catch (error) {
    console.error('Error updating KPI:', error);
    return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 });
  }
}
