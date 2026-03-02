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
    const { input, scenario, guardrails } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Missing input parameter' },
        { status: 400 }
      );
    }

    // Ensure input is a string
    const inputStr = typeof input === 'string' ? input : String(input);

    // Use real AI service for safety evaluation
    const aiService = new AIService();
    
    const response = await aiService.callAI(inputStr, {
      agentType: 'safety',
      scenario,
      additionalContext: { input, scenario, guardrails }
    });

    // Add safety-specific artifacts
    const artifacts = ['safety_report.json', 'risk_assessment.json'];
    if (scenario?.includes('toxic')) artifacts.push('toxicity_analysis.json');
    if (scenario?.includes('injection')) artifacts.push('injection_detection.json');
    if (scenario?.includes('bias')) artifacts.push('bias_assessment.json');

    console.log(`🛡️ Safety AI Agent Evaluation: ${scenario}`);
    console.log(`   - Input length: ${input.length} chars`);
    console.log(`   - Tokens used: ${response.tokens}`);
    console.log(`   - Cost: $${response.cost.toFixed(4)}`);
    console.log(`   - Confidence: ${(response.confidence * 100).toFixed(1)}%`);

    return NextResponse.json({
      ...response,
      artifacts
    });
  } catch (error) {
    console.error('Error in safety AI agent evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate with safety AI agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });