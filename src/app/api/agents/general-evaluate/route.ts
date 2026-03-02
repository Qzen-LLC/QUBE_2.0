import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { AIService } from '@/lib/ai-service';

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // Allow internal server-to-server calls with an internal token
    const internalToken = request.headers.get('x-internal-token');
    const isInternal = !!internalToken && !!process.env.INTERNAL_API_TOKEN && internalToken === process.env.INTERNAL_API_TOKEN;
    if (!isInternal) {
      // auth context is provided by withAuth wrapper
    }

    const body = await request.json();
    const { input, scenario, testType } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Missing input parameter' },
        { status: 400 }
      );
    }

    // Ensure input is a string
    const inputStr = typeof input === 'string' ? input : String(input);

    // Use real AI service for evaluation
    const aiService = new AIService();

    const response = await aiService.callAI(inputStr, {
      agentType: 'general',
      scenario,
      testType,
      additionalContext: { input, scenario, testType }
    });

    // Add artifacts based on the evaluation type
    const artifacts = [`${testType || 'general'}_evaluation_report.json`];
    if (testType === 'safety') artifacts.push('safety_analysis.json');
    if (testType === 'compliance') artifacts.push('compliance_checklist.json');
    if (testType === 'ethics') artifacts.push('bias_assessment.json');
    if (testType === 'performance') artifacts.push('performance_metrics.json');

    console.log(`🤖 General AI Agent Evaluation: ${scenario}`);
    console.log(`   - Input length: ${input.length} chars`);
    console.log(`   - Tokens used: ${response.tokens}`);
    console.log(`   - Cost: $${response.cost.toFixed(4)}`);
    console.log(`   - Confidence: ${(response.confidence * 100).toFixed(1)}%`);

    return NextResponse.json({
      ...response,
      artifacts
    });
  } catch (error) {
    console.error('Error in general AI agent evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate with AI agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });