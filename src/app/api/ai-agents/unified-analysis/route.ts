import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { AIAgentManager } from '@/lib/ai-agents/ai-agent-manager';

export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const portfolio = searchParams.get('portfolio') === 'true';
    const executiveReport = searchParams.get('executiveReport') === 'true';

    if (!useCaseId && !portfolio && !executiveReport) {
      return NextResponse.json({ error: 'useCaseId, portfolio, or executiveReport parameter required' }, { status: 400 });
    }

    const aiAgentManager = AIAgentManager.getInstance();

    if (executiveReport) {
      // Generate executive report
      const report = await aiAgentManager.generateExecutiveReport();
      return NextResponse.json(report);
    } else if (portfolio) {
      // Analyze portfolio across both domains
      const portfolioInsights = await aiAgentManager.analyzePortfolio();
      return NextResponse.json(portfolioInsights);
    } else if (useCaseId) {
      // Perform unified analysis for specific use case
      const unifiedAnalysis = await aiAgentManager.performUnifiedAnalysis(useCaseId);
      return NextResponse.json(unifiedAnalysis);
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in unified analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { action, organizationId } = body;

    const aiAgentManager = AIAgentManager.getInstance();

    if (action === 'getRealTimeAlerts') {
      const alerts = await aiAgentManager.getRealTimeAlerts(organizationId);
      return NextResponse.json(alerts);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in unified analysis action API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });