import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { ruleId, updates } = body;

    if (!ruleId || !updates) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify the rule exists
    const existingRule = await prismaClient.guardrailRule.findUnique({
      where: { id: ruleId },
      include: {
        guardrail: {
          include: {
            useCase: true
          }
        }
      }
    });

    if (!existingRule) {
      return new Response(JSON.stringify({ error: 'Guardrail rule not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if rule is approved - approved rules cannot be edited
    if (existingRule.status === 'APPROVED') {
      return new Response(JSON.stringify({ error: 'Cannot edit approved guardrails. Please create a new version.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Store original value if this is the first edit
    const originalValue = existingRule.isEdited ? existingRule.originalValue : {
      rule: existingRule.rule,
      description: existingRule.description,
      severity: existingRule.severity,
      rationale: existingRule.rationale,
      implementation: existingRule.implementation,
      conditions: existingRule.conditions,
      exceptions: existingRule.exceptions
    };

    // Update the rule
    const currentUser = await prismaClient.user.findUnique({ where: { clerkId: auth.userId! } });
    const currentEmail = currentUser?.email || auth.userId!;

    const updatedRule = await prismaClient.guardrailRule.update({
      where: { id: ruleId },
      data: {
        ...updates,
        status: 'EDITED',
        isEdited: true,
        originalValue: originalValue,
        editedBy: currentEmail,
        editedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create audit log
    await prismaClient.guardrailAudit.create({
      data: {
        guardrailId: existingRule.guardrailId,
        ruleId: ruleId,
        action: 'edit',
        userId: auth.userId!,
        userName: currentEmail,
        changes: {
          before: existingRule,
          after: updates
        }
      }
    });

    // Update guardrail status to indicate it has been edited
    await prismaClient.guardrail.update({
      where: { id: existingRule.guardrailId },
      data: {
        isEdited: true,
        editedBy: currentEmail,
        editedAt: new Date(),
        status: 'pending_approval'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      rule: updatedRule,
      message: 'Guardrail rule updated successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error updating guardrail rule:', error);
    return new Response(JSON.stringify({ error: 'Failed to update guardrail rule', details: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });