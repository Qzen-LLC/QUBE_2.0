import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { GovernanceAIAgent } from '@/lib/ai-agents/governance-agent';

export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const portfolio = searchParams.get('portfolio') === 'true';
    const complianceStatus = searchParams.get('complianceStatus') === 'true';

    if (!useCaseId && !portfolio && !complianceStatus) {
      return NextResponse.json({ error: 'useCaseId, portfolio, or complianceStatus parameter required' }, { status: 400 });
    }

    const governanceAgent = GovernanceAIAgent.getInstance();

    if (portfolio) {
      // Analyze portfolio
      const portfolioAnalysis = await governanceAgent.analyzePortfolio();
      return NextResponse.json(portfolioAnalysis);
    } else if (complianceStatus && useCaseId) {
      // Get compliance status for specific use case
      const complianceStatuses = await governanceAgent.getComplianceStatus(useCaseId);
      return NextResponse.json(complianceStatuses);
    } else if (useCaseId) {
      // Analyze specific use case
      const analysis = await governanceAgent.analyzeUseCase(useCaseId);
      return NextResponse.json(analysis);
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in governance analysis API:', error);
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
    const { action } = body;

    const governanceAgent = GovernanceAIAgent.getInstance();

    if (action === 'monitorRegulatoryUpdates') {
      const updates = await governanceAgent.monitorRegulatoryUpdates();
      return NextResponse.json(updates);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in governance action API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });