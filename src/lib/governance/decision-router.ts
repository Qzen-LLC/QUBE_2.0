/**
 * Decision Router
 * Automatically routes decisions to appropriate approvers based on decision authority matrix
 */

import { prismaClient } from '@/utils/db';

export interface DecisionContext {
  decisionType: string;
  riskLevel?: string;
  investmentAmount?: number;
  useCaseId?: string;
  organizationId: string;
  requestedBy: string;
  metadata?: Record<string, any>;
}

export interface RoutingResult {
  approverRole: string;
  escalationRole?: string;
  matchedRule: any;
  requiresEscalation: boolean;
  escalationReason?: string;
  notifyEmails: string[];
}

/**
 * Routes a decision to the appropriate approver based on decision authority rules
 */
export async function routeDecision(context: DecisionContext): Promise<RoutingResult> {
  // Fetch active decision authority rules for the organization
  const rules = await prismaClient.decisionAuthority.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });

  // Find the matching rule
  let matchedRule = null;

  for (const rule of rules) {
    // Check if decision type matches
    if (rule.decisionType !== context.decisionType) {
      continue;
    }

    // Check if risk level matches (if specified)
    if (context.riskLevel && rule.riskLevel && rule.riskLevel !== context.riskLevel) {
      continue;
    }

    // Check if investment amount is within range (if specified)
    if (context.investmentAmount !== undefined) {
      if (rule.investmentMin !== null && context.investmentAmount < rule.investmentMin) {
        continue;
      }
      if (rule.investmentMax !== null && context.investmentAmount > rule.investmentMax) {
        continue;
      }
    }

    // Found a match
    matchedRule = rule;
    break;
  }

  if (!matchedRule) {
    // No rule found - default to org admin with escalation
    return {
      approverRole: 'ORG_ADMIN',
      escalationRole: 'QZEN_ADMIN',
      matchedRule: null,
      requiresEscalation: true,
      escalationReason: 'No matching decision authority rule found',
      notifyEmails: []
    };
  }

  // Check if escalation is needed based on escalation rules
  const escalationCheck = await checkEscalationRules(context);

  return {
    approverRole: matchedRule.approverRole,
    escalationRole: matchedRule.escalationRole || undefined,
    matchedRule,
    requiresEscalation: escalationCheck.requiresEscalation,
    escalationReason: escalationCheck.reason,
    notifyEmails: escalationCheck.notifyEmails
  };
}

/**
 * Checks if any escalation rules are triggered
 */
async function checkEscalationRules(context: DecisionContext): Promise<{
  requiresEscalation: boolean;
  reason?: string;
  notifyEmails: string[];
}> {
  const rules = await prismaClient.escalationRule.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
      autoEscalate: true
    }
  });

  const triggeredRules = [];
  const allNotifyEmails = new Set<string>();

  for (const rule of rules) {
    let isTriggered = false;
    let reason = '';

    switch (rule.triggerType) {
      case 'RISK_LEVEL':
        // Check if risk level meets threshold
        if (context.riskLevel && ['HIGH', 'CRITICAL'].includes(context.riskLevel)) {
          isTriggered = true;
          reason = `High risk level detected: ${context.riskLevel}`;
        }
        break;

      case 'INVESTMENT_THRESHOLD':
        // Check if investment exceeds threshold (assuming threshold in metadata)
        if (context.investmentAmount && context.investmentAmount > 100000) {
          isTriggered = true;
          reason = `Investment amount exceeds threshold: $${context.investmentAmount}`;
        }
        break;

      case 'COMPLIANCE_VIOLATION':
        // Check metadata for compliance issues
        if (context.metadata?.complianceViolation) {
          isTriggered = true;
          reason = 'Compliance violation detected';
        }
        break;

      case 'POLICY_EXCEPTION':
        // Check if policy exception is requested
        if (context.metadata?.policyException) {
          isTriggered = true;
          reason = 'Policy exception requested';
        }
        break;

      case 'APPROVAL_TIMEOUT':
        // This would be checked separately by a scheduled job
        // Not applicable for initial routing
        break;
    }

    if (isTriggered) {
      triggeredRules.push({ rule, reason });
      rule.notifyEmails.forEach(email => allNotifyEmails.add(email));
    }
  }

  return {
    requiresEscalation: triggeredRules.length > 0,
    reason: triggeredRules.map(t => t.reason).join('; '),
    notifyEmails: Array.from(allNotifyEmails)
  };
}

/**
 * Creates a decision record with routing information
 */
export async function createDecisionRecord(
  context: DecisionContext,
  routing: RoutingResult
): Promise<any> {
  // This would create a record in a Decision table (to be created)
  // For now, we'll return the structured data
  return {
    id: `decision_${Date.now()}`,
    ...context,
    routing: {
      approverRole: routing.approverRole,
      escalationRole: routing.escalationRole,
      requiresEscalation: routing.requiresEscalation,
      escalationReason: routing.escalationReason
    },
    status: 'PENDING_APPROVAL',
    createdAt: new Date(),
    notificationsSent: routing.notifyEmails
  };
}

/**
 * Gets the decision authority matrix for an organization
 */
export async function getDecisionMatrix(organizationId: string) {
  return await prismaClient.decisionAuthority.findMany({
    where: {
      organizationId,
      isActive: true
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });
}

/**
 * Gets active escalation rules for an organization
 */
export async function getEscalationRules(organizationId: string) {
  return await prismaClient.escalationRule.findMany({
    where: {
      organizationId,
      isActive: true
    }
  });
}
