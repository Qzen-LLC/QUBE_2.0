import { NextRequest, NextResponse } from 'next/server';
import { routeDecision, createDecisionRecord, DecisionContext } from '@/lib/governance/decision-router';
import { notifyDecisionRouting, notifyEscalation } from '@/lib/governance/notification-service';

/**
 * POST /api/governance/route-decision
 * Routes a decision to the appropriate approver based on decision authority rules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { decisionType, organizationId, requestedBy } = body;
    if (!decisionType || !organizationId || !requestedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: decisionType, organizationId, requestedBy' },
        { status: 400 }
      );
    }

    // Build decision context
    const context: DecisionContext = {
      decisionType,
      organizationId,
      requestedBy,
      riskLevel: body.riskLevel,
      investmentAmount: body.investmentAmount,
      useCaseId: body.useCaseId,
      metadata: body.metadata || {}
    };

    // Route the decision
    const routing = await routeDecision(context);

    // Create decision record
    const decision = await createDecisionRecord(context, routing);

    // Send notifications
    try {
      // Notify approver
      await notifyDecisionRouting(
        organizationId,
        decisionType,
        routing.approverRole,
        context
      );

      // If escalation is required, send escalation notification
      if (routing.requiresEscalation && routing.notifyEmails.length > 0) {
        await notifyEscalation(
          organizationId,
          { triggerType: 'AUTO', escalateTo: routing.escalationRole, notifyEmails: routing.notifyEmails },
          context,
          routing.escalationReason || 'Automatic escalation triggered'
        );
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Continue even if notifications fail
    }

    return NextResponse.json({
      success: true,
      decision,
      routing: {
        approverRole: routing.approverRole,
        escalationRole: routing.escalationRole,
        requiresEscalation: routing.requiresEscalation,
        escalationReason: routing.escalationReason,
        matchedRule: routing.matchedRule ? {
          id: routing.matchedRule.id,
          decisionType: routing.matchedRule.decisionType,
          description: routing.matchedRule.description
        } : null
      }
    });
  } catch (error) {
    console.error('Error routing decision:', error);
    return NextResponse.json(
      { error: 'Failed to route decision', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/governance/route-decision?decisionType=...&organizationId=...
 * Preview routing without creating a decision record
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const decisionType = searchParams.get('decisionType');
    const organizationId = searchParams.get('organizationId');
    const riskLevel = searchParams.get('riskLevel');
    const investmentAmount = searchParams.get('investmentAmount');

    if (!decisionType || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: decisionType, organizationId' },
        { status: 400 }
      );
    }

    const context: DecisionContext = {
      decisionType,
      organizationId,
      requestedBy: 'preview',
      riskLevel: riskLevel || undefined,
      investmentAmount: investmentAmount ? parseFloat(investmentAmount) : undefined
    };

    const routing = await routeDecision(context);

    return NextResponse.json({
      approverRole: routing.approverRole,
      escalationRole: routing.escalationRole,
      requiresEscalation: routing.requiresEscalation,
      escalationReason: routing.escalationReason,
      matchedRule: routing.matchedRule ? {
        id: routing.matchedRule.id,
        decisionType: routing.matchedRule.decisionType,
        description: routing.matchedRule.description,
        riskLevel: routing.matchedRule.riskLevel,
        investmentMin: routing.matchedRule.investmentMin,
        investmentMax: routing.matchedRule.investmentMax
      } : null
    });
  } catch (error) {
    console.error('Error previewing routing:', error);
    return NextResponse.json(
      { error: 'Failed to preview routing' },
      { status: 500 }
    );
  }
}
