import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const footprints = await prismaClient.carbonFootprint.findMany({
      where: { organizationId },
      orderBy: { measurementDate: 'desc' }
    });

    return NextResponse.json(footprints);
  } catch (error) {
    console.error('Error fetching carbon footprints:', error);
    return NextResponse.json({ error: 'Failed to fetch carbon footprints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...footprintData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Calculate total emissions if not provided
    const totalEmissions = footprintData.totalEmissions ||
      (footprintData.trainingEmissions || 0) + (footprintData.inferenceEmissions || 0);

    const footprint = await prismaClient.carbonFootprint.create({
      data: {
        organizationId,
        ...footprintData,
        totalEmissions
      }
    });

    return NextResponse.json(footprint);
  } catch (error) {
    console.error('Error creating carbon footprint:', error);
    return NextResponse.json({ error: 'Failed to create carbon footprint' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...footprintData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const totalEmissions = footprintData.totalEmissions ||
      (footprintData.trainingEmissions || 0) + (footprintData.inferenceEmissions || 0);

    const footprint = await prismaClient.carbonFootprint.update({
      where: { id },
      data: {
        ...footprintData,
        totalEmissions
      }
    });

    return NextResponse.json(footprint);
  } catch (error) {
    console.error('Error updating carbon footprint:', error);
    return NextResponse.json({ error: 'Failed to update carbon footprint' }, { status: 500 });
  }
}
