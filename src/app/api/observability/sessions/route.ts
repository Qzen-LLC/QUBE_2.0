import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

export const GET = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    // auth context is provided by withAuth wrapper

    // Fetch sessions from database
    const sessions = await prismaClient.observabilitySession.findMany({
      orderBy: { startTime: 'desc' },
      take: 100, // Limit to most recent 100 sessions
    });

    // Transform for UI
    const formattedSessions = sessions.map(session => ({
      id: session.sessionId,
      useCaseTitle: session.useCaseTitle || 'Unknown',
      type: session.sessionType,
      status: session.status,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration || 0,
      totalLLMCalls: session.totalLLMCalls,
      totalTokens: session.totalTokens,
      totalCost: session.totalCost,
      agentsInvolved: session.agentsInvolved,
      langsmithUrl: session.langsmithUrl,
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Error fetching observability sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}, { requireUser: true });

export const POST = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { sessionData } = body;

    if (!sessionData || !sessionData.sessionId) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 400 }
      );
    }

    // Create or update session
    const session = await prismaClient.observabilitySession.upsert({
      where: { sessionId: sessionData.sessionId },
      update: {
        status: sessionData.status || 'running',
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : undefined,
        duration: sessionData.duration,
        totalLLMCalls: sessionData.totalLLMCalls || 0,
        totalTokens: sessionData.totalTokens || 0,
        totalCost: sessionData.totalCost || 0,
        agentsInvolved: sessionData.agentsInvolved || [],
        langsmithUrl: sessionData.langsmithUrl,
        langsmithRunId: sessionData.langsmithRunId,
        metadata: sessionData.metadata || {},
        errors: sessionData.errors || null,
      },
      create: {
        sessionId: sessionData.sessionId,
        useCaseId: sessionData.useCaseId,
        useCaseTitle: sessionData.useCaseTitle,
        sessionType: sessionData.sessionType || 'evaluation',
        status: sessionData.status || 'running',
        startTime: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : undefined,
        duration: sessionData.duration,
        totalLLMCalls: sessionData.totalLLMCalls || 0,
        totalTokens: sessionData.totalTokens || 0,
        totalCost: sessionData.totalCost || 0,
        agentsInvolved: sessionData.agentsInvolved || [],
        langsmithUrl: sessionData.langsmithUrl,
        langsmithRunId: sessionData.langsmithRunId,
        metadata: sessionData.metadata || {},
        errors: sessionData.errors || null,
      },
    });

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error saving observability session:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}, { requireUser: true });