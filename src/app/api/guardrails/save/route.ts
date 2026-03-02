import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { useCaseId, guardrails } = body;

    if (!useCaseId || !guardrails) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify use case exists
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId }
    });

    if (!useCase) {
      return new Response(JSON.stringify({ error: 'Use case not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // First check if a guardrail already exists for this use case
    let existingGuardrail = await prismaClient.guardrail.findFirst({
      where: { useCaseId },
      orderBy: { createdAt: 'desc' }
    });

    // Save or update guardrails
    const guardrailRecord = existingGuardrail 
      ? await prismaClient.guardrail.update({
          where: { id: existingGuardrail.id },
          data: {
            configuration: guardrails,
            reasoning: guardrails.reasoning || {},
            confidence: guardrails.confidence?.overall || 0.8,
            status: guardrails.status || 'draft',
            updatedAt: new Date()
          }
        })
      : await prismaClient.guardrail.create({
          data: {
            useCaseId,
            name: guardrails.name || 'Guardrails Configuration',
            description: guardrails.description || 'Generated guardrails for ' + useCase.title,
            approach: guardrails.approach || 'balanced_practical',
            configuration: guardrails,
            reasoning: guardrails.reasoning || {},
            confidence: guardrails.confidence?.overall || 0.8,
            status: 'draft'
          }
        });

    // Save individual rules if provided
    if (guardrails.guardrails?.rules) {
      // Delete existing rules for this guardrail
      await prismaClient.guardrailRule.deleteMany({
        where: { guardrailId: guardrailRecord.id }
      });

      // Flatten all rules from different categories
      const allRules: any[] = [];
      
      Object.entries(guardrails.guardrails.rules).forEach(([category, rules]: [string, any]) => {
        if (Array.isArray(rules)) {
          rules.forEach((rule: any) => {
            allRules.push({
              guardrailId: guardrailRecord.id,
              type: rule.type || category,
              severity: rule.severity || 'medium',
              rule: rule.rule || rule.name || 'Rule',
              description: rule.description || '',
              rationale: rule.rationale,
              implementation: rule.implementation || {},
              conditions: rule.conditions,
              exceptions: rule.exceptions,
              status: rule.status || 'PENDING',
              isCustom: rule.isCustom || false,
              isEdited: rule.isEdited || false,
              originalValue: rule.originalValue || null,
              editedBy: rule.editedBy || null,
              editedAt: rule.editedAt ? new Date(rule.editedAt) : null,
              approvedBy: rule.approvedBy || null,
              approvedAt: rule.approvedAt ? new Date(rule.approvedAt) : null,
              rejectedBy: rule.rejectedBy || null,
              rejectedAt: rule.rejectedAt ? new Date(rule.rejectedAt) : null,
              rejectionReason: rule.rejectionReason || null
            });
          });
        }
      });

      if (allRules.length > 0) {
        // Delete and recreate to ensure clean state
        await prismaClient.guardrailRule.createMany({
          data: allRules
        });
        
        // Fetch the created rules to get their IDs
        const createdRules = await prismaClient.guardrailRule.findMany({
          where: { guardrailId: guardrailRecord.id }
        });
        
        // Return the rules with their database IDs
        return new Response(JSON.stringify({
          success: true,
          guardrailId: guardrailRecord.id,
          rules: createdRules,
          message: 'Guardrails saved successfully'
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      guardrailId: guardrailRecord.id,
      rules: [],
      message: 'Guardrails saved successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error saving guardrails:', error);
    return new Response(JSON.stringify({ error: 'Failed to save guardrails', details: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });