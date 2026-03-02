import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

// GET /api/risks/[useCaseId] - Get all risks for a use case
export const GET = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>, auth: any }
) => {
  try {
    // Await params as required by Next.js 15
    const { useCaseId } = await params;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
      const risks = await prismaClient.risk.findMany({
        where: { 
          useCaseId: useCaseId
        },
        orderBy: [
          { status: 'asc' },
          { riskScore: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return NextResponse.json(risks);
    } catch (dbError) {
      console.error('Database error fetching risks:', dbError);
      // Return empty array if risks table doesn't exist
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risks' },
      { status: 500 }
    );
  }
}, { requireUser: true });

// POST /api/risks/[useCaseId] - Create a new risk
export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>, auth: any }
) => {
  try {
    const { useCaseId } = await params;
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.riskLevel || !data.likelihood) {
      return NextResponse.json(
        { error: 'riskLevel and likelihood are required fields' },
        { status: 400 }
      );
    }

    // Set risk score based on level if not provided
    const riskScoreMap: { [key: string]: number } = {
      'Low': 2,
      'Medium': 5,
      'High': 7,
      'Critical': 9
    };

    try {
      // Debug: Log available models on prismaClient
      console.log('Available models on prismaClient:', Object.keys(prismaClient));
      console.log('Risk model exists:', !!prismaClient.risk);
      
      // Check if the Risk model exists
      if (!prismaClient.risk) {
        throw new Error('Risk model not available. Please ensure database schema is up to date.');
      }
      
      const risk = await prismaClient.risk.create({
        data: {
          useCaseId: useCaseId,
          category: data.category,
          riskLevel: data.riskLevel,
          riskScore: data.riskScore || riskScoreMap[data.riskLevel] || 5,
          title: data.title,
          description: data.description,
          impact: data.impact,
          likelihood: data.likelihood,
          status: 'OPEN',
          createdBy: userRecord.id,
          createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown User',
          createdByEmail: userRecord.email,
          mitigationPlan: data.mitigationPlan,
          assignedToName: data.assignedToName,
          assignedToEmail: data.assignedToEmail,
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
          notes: data.notes,
          sourceType: data.sourceType || null,
          sourceId: data.sourceId || null
        }
      });
      console.log('[CRUD_LOG] Risk created:', { id: risk.id, useCaseId: useCaseId, category: data.category, riskLevel: data.riskLevel, status: risk.status, createdAt: risk.createdAt, authoredBy: userRecord.id });

      return NextResponse.json(risk);
    } catch (dbError) {
      console.error('Database error creating risk:', dbError);
      return NextResponse.json(
        { error: 'Failed to create risk in database', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json(
      { error: 'Failed to create risk' },
      { status: 500 }
    );
  }
}, { requireUser: true });