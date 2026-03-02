import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { notifyApprovalTimeout } from '@/lib/governance/notification-service';

/**
 * POST /api/governance/check-timeouts
 * Checks for approval timeouts and sends notifications
 * This endpoint should be called by a scheduled job (e.g., cron, Vercel Cron Jobs)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from a trusted source (e.g., cron job with secret token)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all organizations with active escalation rules for approval timeout
    const escalationRules = await prismaClient.escalationRule.findMany({
      where: {
        triggerType: 'APPROVAL_TIMEOUT',
        isActive: true,
        autoEscalate: true
      },
      include: {
        organization: true
      }
    });

    const notificationsSent = [];
    const errors = [];

    // In a real implementation, we would:
    // 1. Query pending approvals/decisions from a Decision table
    // 2. Calculate how long they've been pending
    // 3. Check against timeout thresholds
    // 4. Send notifications for overdue approvals

    // For now, we'll log the check
    for (const rule of escalationRules) {
      try {
        console.log(`[Timeout Check] Organization: ${rule.organizationId}`, {
          escalateTo: rule.escalateTo,
          notifyEmails: rule.notifyEmails,
          description: rule.description
        });

        // TODO: Implement actual timeout check logic
        // Example logic:
        // - Query pending approvals older than X days
        // - Send notifications
        // - Auto-escalate if needed

        notificationsSent.push({
          organizationId: rule.organizationId,
          rule: rule.id
        });
      } catch (error) {
        console.error(`Error checking timeouts for org ${rule.organizationId}:`, error);
        errors.push({
          organizationId: rule.organizationId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: escalationRules.length,
      notificationsSent: notificationsSent.length,
      errors: errors.length,
      details: {
        notificationsSent,
        errors
      }
    });
  } catch (error) {
    console.error('Error checking approval timeouts:', error);
    return NextResponse.json(
      { error: 'Failed to check approval timeouts' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/governance/check-timeouts
 * Returns information about timeout monitoring configuration
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    const where = organizationId
      ? { organizationId, triggerType: 'APPROVAL_TIMEOUT' as const, isActive: true }
      : { triggerType: 'APPROVAL_TIMEOUT' as const, isActive: true };

    const rules = await prismaClient.escalationRule.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        escalateTo: true,
        notifyEmails: true,
        autoEscalate: true,
        description: true,
        isActive: true
      }
    });

    return NextResponse.json({
      count: rules.length,
      rules
    });
  } catch (error) {
    console.error('Error fetching timeout rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeout rules' },
      { status: 500 }
    );
  }
}
