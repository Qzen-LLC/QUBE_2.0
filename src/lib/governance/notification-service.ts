/**
 * Notification Service
 * Handles notifications for governance decisions and escalations
 */

import { prismaClient } from '@/utils/db';

export interface NotificationContext {
  type: 'DECISION_ROUTING' | 'ESCALATION' | 'APPROVAL_TIMEOUT' | 'COMPLIANCE_ALERT';
  organizationId: string;
  recipients: string[]; // Email addresses
  subject: string;
  message: string;
  metadata?: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Sends a notification (email/in-app)
 */
export async function sendNotification(context: NotificationContext): Promise<boolean> {
  try {
    // Log notification for audit trail
    console.log(`[Notification] ${context.type}:`, {
      organizationId: context.organizationId,
      recipients: context.recipients,
      subject: context.subject,
      priority: context.priority || 'MEDIUM'
    });

    // In production, this would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - In-app notification system
    // - Slack/Teams integration
    // - SMS for critical alerts

    // For now, we'll log the notification
    // TODO: Implement actual email sending

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Sends decision routing notification
 */
export async function notifyDecisionRouting(
  organizationId: string,
  decisionType: string,
  approverRole: string,
  decisionDetails: any
): Promise<void> {
  const subject = `New Decision Requires Your Approval: ${decisionType}`;
  const message = `
    A new decision has been routed to you for approval.

    Decision Type: ${decisionType}
    Risk Level: ${decisionDetails.riskLevel || 'Not specified'}
    Investment Amount: ${decisionDetails.investmentAmount ? `$${decisionDetails.investmentAmount}` : 'N/A'}
    Requested By: ${decisionDetails.requestedBy}

    Please review and approve/reject this decision in the governance dashboard.
  `;

  // Get users with the approver role
  const approvers = await getUsersByRole(organizationId, approverRole);

  await sendNotification({
    type: 'DECISION_ROUTING',
    organizationId,
    recipients: approvers,
    subject,
    message,
    metadata: decisionDetails,
    priority: 'MEDIUM'
  });
}

/**
 * Sends escalation notification
 */
export async function notifyEscalation(
  organizationId: string,
  escalationRule: any,
  decisionDetails: any,
  reason: string
): Promise<void> {
  const subject = `🚨 Decision Escalation: ${escalationRule.triggerType}`;
  const message = `
    A decision has been automatically escalated based on governance rules.

    Escalation Trigger: ${escalationRule.triggerType}
    Reason: ${reason}
    Escalate To: ${escalationRule.escalateTo}

    Decision Details:
    - Type: ${decisionDetails.decisionType}
    - Risk Level: ${decisionDetails.riskLevel || 'Not specified'}
    - Investment Amount: ${decisionDetails.investmentAmount ? `$${decisionDetails.investmentAmount}` : 'N/A'}
    - Requested By: ${decisionDetails.requestedBy}

    Immediate attention required.
  `;

  await sendNotification({
    type: 'ESCALATION',
    organizationId,
    recipients: escalationRule.notifyEmails,
    subject,
    message,
    metadata: { escalationRule, decisionDetails, reason },
    priority: 'HIGH'
  });
}

/**
 * Sends approval timeout notification
 */
export async function notifyApprovalTimeout(
  organizationId: string,
  decisionId: string,
  daysOverdue: number,
  approverRole: string
): Promise<void> {
  const subject = `⏰ Approval Timeout: Decision Pending for ${daysOverdue} days`;
  const message = `
    A decision has been pending approval for ${daysOverdue} days and requires immediate attention.

    Decision ID: ${decisionId}
    Assigned To: ${approverRole}
    Days Overdue: ${daysOverdue}

    This decision will be automatically escalated if not addressed within 24 hours.
  `;

  // Get escalation rule for timeout
  const escalationRules = await prismaClient.escalationRule.findMany({
    where: {
      organizationId,
      triggerType: 'APPROVAL_TIMEOUT',
      isActive: true
    }
  });

  const recipients = new Set<string>();
  escalationRules.forEach(rule => {
    rule.notifyEmails.forEach(email => recipients.add(email));
  });

  // Also notify the assigned approver
  const approvers = await getUsersByRole(organizationId, approverRole);
  approvers.forEach(email => recipients.add(email));

  await sendNotification({
    type: 'APPROVAL_TIMEOUT',
    organizationId,
    recipients: Array.from(recipients),
    subject,
    message,
    metadata: { decisionId, daysOverdue, approverRole },
    priority: 'HIGH'
  });
}

/**
 * Sends compliance alert notification
 */
export async function notifyComplianceAlert(
  organizationId: string,
  violationType: string,
  useCaseId: string,
  details: any
): Promise<void> {
  const subject = `🔴 Compliance Alert: ${violationType}`;
  const message = `
    A compliance violation has been detected and requires immediate attention.

    Violation Type: ${violationType}
    Use Case ID: ${useCaseId}

    Details:
    ${JSON.stringify(details, null, 2)}

    Please review and take appropriate action immediately.
  `;

  // Get escalation rules for compliance violations
  const escalationRules = await prismaClient.escalationRule.findMany({
    where: {
      organizationId,
      triggerType: 'COMPLIANCE_VIOLATION',
      isActive: true
    }
  });

  const recipients = new Set<string>();
  escalationRules.forEach(rule => {
    rule.notifyEmails.forEach(email => recipients.add(email));
  });

  await sendNotification({
    type: 'COMPLIANCE_ALERT',
    organizationId,
    recipients: Array.from(recipients),
    subject,
    message,
    metadata: { violationType, useCaseId, details },
    priority: 'CRITICAL'
  });
}

/**
 * Helper function to get users by role
 * In production, this would query the user database with role filtering
 */
async function getUsersByRole(organizationId: string, role: string): Promise<string[]> {
  // TODO: Implement actual user role query
  // For now, return empty array - would need to integrate with Clerk or user management

  // This would typically query:
  // - Organization members
  // - Filter by role
  // - Return email addresses

  console.log(`[TODO] Get users with role ${role} in org ${organizationId}`);
  return [];
}

/**
 * Batch send notifications
 */
export async function sendBatchNotifications(notifications: NotificationContext[]): Promise<void> {
  const results = await Promise.allSettled(
    notifications.map(notification => sendNotification(notification))
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
    console.error(`${failed} notifications failed to send`);
  }
}
