import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { AIService } from '@/lib/ai-service';

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    const internalToken = request.headers.get('x-internal-token');
    const isInternal = !!internalToken && !!process.env.INTERNAL_API_TOKEN && internalToken === process.env.INTERNAL_API_TOKEN;
    if (!isInternal) {
      // auth context is provided by withAuth wrapper
    }

    const body = await request.json();
    const { input, scenario, expectedLatency } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Missing input parameter' },
        { status: 400 }
      );
    }

    // Ensure input is a string
    const inputStr = typeof input === 'string' ? input : String(input);

    // Use real AI service for performance evaluation
    const aiService = new AIService();
    
    const response = await aiService.callAI(inputStr, {
      agentType: 'performance',
      scenario,
      additionalContext: { input, scenario, expectedLatency }
    });

    // Add performance-specific artifacts
    const artifacts = ['performance_report.json'];
    if (scenario?.includes('latency')) artifacts.push('latency_analysis.json');
    if (scenario?.includes('throughput')) artifacts.push('throughput_metrics.json');

    console.log(`🤖 Performance AI Agent Evaluation: ${scenario}`);
    console.log(`   - Input length: ${input.length} chars`);
    console.log(`   - Tokens used: ${response.tokens}`);
    console.log(`   - Cost: $${response.cost.toFixed(4)}`);
    console.log(`   - Confidence: ${(response.confidence * 100).toFixed(1)}%`);

    return NextResponse.json({
      ...response,
      artifacts
    });
  } catch (error) {
    console.error('Error in performance AI agent evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate with performance AI agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });