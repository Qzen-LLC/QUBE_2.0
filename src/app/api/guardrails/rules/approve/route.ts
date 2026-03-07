import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { NextResponse } from 'next/server';
import { verifyUseCaseAccess } from '@/lib/org-scope';

// Health check endpoint to verify route is accessible
export const GET = withAuth(async (request: Request, { auth }) => {
  return NextResponse.json({ 
    success: true, 
    message: 'Guardrails approval route is accessible',
    method: 'GET'
  });
}, { requireUser: true });

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { ruleId, approved, reason, guardrailId, useCaseId } = body;

    console.log('[APPROVE] Received approval request:', { ruleId, approved, reason, guardrailId, useCaseId });

    if (useCaseId && !(await verifyUseCaseAccess(auth, useCaseId))) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    if (!ruleId || approved === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // If rejecting, reason is required
    if (!approved && !reason) {
      return new Response(JSON.stringify({ error: 'Rejection reason is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify the rule exists
    // First try to find by UUID (database ID)
    console.log('[APPROVE] Looking up rule by ID:', ruleId);
    let existingRule = await prismaClient.guardrailRule.findUnique({
      where: { id: ruleId },
      include: {
        guardrail: true
      }
    });
    
    console.log('[APPROVE] Rule lookup by UUID result:', existingRule ? 'Found' : 'Not found');

    // If not found by UUID, try to find by rule text or within a specific guardrail
    if (!existingRule) {
      // Check if ruleId looks like a UUID (contains hyphens and is 36 chars)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ruleId);
      
      if (!isUUID) {
        // If we have guardrailId or useCaseId, search within that guardrail
        let targetGuardrailId = guardrailId;
        
        if (!targetGuardrailId && useCaseId) {
          // Get the latest guardrail for this use case
          const latestGuardrail = await prismaClient.guardrail.findFirst({
            where: { useCaseId },
            orderBy: { createdAt: 'desc' },
            select: { id: true }
          });
          if (latestGuardrail) {
            targetGuardrailId = latestGuardrail.id;
            console.log('[APPROVE] Found guardrail by useCaseId:', targetGuardrailId);
          }
        }
        
        if (targetGuardrailId) {
          // Search within the specific guardrail's rules
          // First try exact match on rule text
          existingRule = await prismaClient.guardrailRule.findFirst({
            where: {
              guardrailId: targetGuardrailId,
              rule: ruleId
            },
            include: {
              guardrail: true
            }
          });
          
          // If not found by exact match, try contains search
          if (!existingRule) {
            const rules = await prismaClient.guardrailRule.findMany({
              where: {
                guardrailId: targetGuardrailId,
                rule: {
                  contains: ruleId,
                  mode: 'insensitive'
                }
              },
              include: {
                guardrail: true
              },
              take: 1
            });
            
            if (rules.length > 0) {
              existingRule = rules[0];
            }
          }
          
          // If still not found, get all rules and try various matching strategies
          if (!existingRule) {
            console.log('[APPROVE] Getting all rules for comprehensive lookup...');
            const allRules = await prismaClient.guardrailRule.findMany({
              where: {
                guardrailId: targetGuardrailId
              },
              include: {
                guardrail: true
              },
              orderBy: {
                createdAt: 'asc'
              }
            });
            
            console.log('[APPROVE] Found', allRules.length, 'rules in guardrail');
            
            // Strategy 1: If ruleId looks like a code (e.g., "GR-001", "GR-002"), try index-based lookup
            if (/^GR-(\d+)$/i.test(ruleId)) {
              const match = ruleId.match(/^GR-(\d+)$/i);
              if (match) {
                const ruleNumber = parseInt(match[1], 10);
                const ruleIndex = ruleNumber - 1; // Convert to 0-based index
                console.log('[APPROVE] Trying to find rule by code:', ruleId, 'index:', ruleIndex);
                
                // Try to match by overall index first
                if (ruleIndex >= 0 && ruleIndex < allRules.length) {
                  existingRule = allRules[ruleIndex];
                  console.log('[APPROVE] Found rule by overall index:', existingRule.id, 'rule text:', existingRule.rule?.substring(0, 50) || 'N/A');
                } else {
                  // If index doesn't match, try grouping by category/type and finding within category
                  console.log('[APPROVE] Index out of range, trying category-based lookup...');
                  
                  // Group rules by type/category
                  const rulesByCategory: Record<string, typeof allRules> = {};
                  allRules.forEach(rule => {
                    const category = rule.type || 'general';
                    if (!rulesByCategory[category]) {
                      rulesByCategory[category] = [];
                    }
                    rulesByCategory[category].push(rule);
                  });
                  
                  // Try to find in each category
                  for (const [category, categoryRules] of Object.entries(rulesByCategory)) {
                    if (ruleIndex >= 0 && ruleIndex < categoryRules.length) {
                      existingRule = categoryRules[ruleIndex];
                      console.log('[APPROVE] Found rule in category', category, 'by index:', existingRule.id);
                      break;
                    }
                  }
                }
              }
            }
            
            // Strategy 2: If still not found, try to find by matching rule text that contains the ID
            if (!existingRule) {
              console.log('[APPROVE] Trying to find rule by text matching...');
              for (const rule of allRules) {
                // Check if the rule text or description contains the ruleId
                if (rule.rule?.includes(ruleId) || rule.description?.includes(ruleId)) {
                  existingRule = rule;
                  console.log('[APPROVE] Found rule by text match:', rule.id);
                  break;
                }
              }
            }
            
            // Strategy 3: Last resort - if we have rules but can't match, log for debugging
            if (!existingRule && allRules.length > 0) {
              console.log('[APPROVE] Could not match ruleId:', ruleId);
              console.log('[APPROVE] Available rule IDs:', allRules.map(r => r.id).slice(0, 5));
              console.log('[APPROVE] Available rule texts (first 3):', allRules.slice(0, 3).map(r => r.rule?.substring(0, 50)));
            }
          }
        } else {
          // Fallback: search all guardrails (less efficient but works)
          console.log('[APPROVE] No guardrail context, searching all rules...');
          const exactMatch = await prismaClient.guardrailRule.findFirst({
            where: {
              rule: ruleId
            },
            include: {
              guardrail: true
            }
          });
          
          if (exactMatch) {
            existingRule = exactMatch;
          } else {
            // Try contains search as fallback
            const rules = await prismaClient.guardrailRule.findMany({
              where: {
                rule: {
                  contains: ruleId,
                  mode: 'insensitive'
                }
              },
              include: {
                guardrail: true
              },
              take: 1
            });
            
            if (rules.length > 0) {
              existingRule = rules[0];
            }
          }
        }
        
        console.log('[APPROVE] Fallback lookup result:', existingRule ? 'Found' : 'Not found');
      }
    }

    if (!existingRule) {
      return new Response(JSON.stringify({ error: 'Guardrail rule not found', details: `No rule found with ID: ${ruleId}` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Load current user email and prevent self-approval
    const currentUser = await prismaClient.user.findUnique({ where: { clerkId: auth.userId! } });
    const currentEmail = currentUser?.email || auth.userId!;
    if (existingRule.editedBy === currentEmail) {
      return new Response(JSON.stringify({ error: 'You cannot approve your own changes' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Update the rule with approval/rejection
    const updatedRule = await prismaClient.guardrailRule.update({
      where: { id: ruleId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        ...(approved ? {
          approvedBy: currentEmail,
          approvedAt: new Date()
        } : {
          rejectedBy: currentEmail,
          rejectedAt: new Date(),
          rejectionReason: reason
        }),
        updatedAt: new Date()
      }
    });

    // Create audit log (non-blocking - don't fail the request if audit logging fails)
    try {
      await prismaClient.guardrailAudit.create({
        data: {
          guardrailId: existingRule.guardrailId,
          ruleId: ruleId,
          action: approved ? 'approve' : 'reject',
          userId: auth.userId!,
          userName: currentEmail,
          changes: approved ? undefined : { reason }
        }
      });
    } catch (auditError) {
      // Log the error but don't fail the request
      console.warn('Failed to create audit log (non-critical):', auditError);
    }

    // Check if all rules in the guardrail are approved/rejected and update guardrail status
    const allRules = await prismaClient.guardrailRule.findMany({
      where: { guardrailId: existingRule.guardrailId }
    });

    const allApproved = allRules.every(rule => rule.status === 'APPROVED');
    const hasRejected = allRules.some(rule => rule.status === 'REJECTED');
    const hasPending = allRules.some(rule => rule.status === 'PENDING' || rule.status === 'EDITED');

    let guardrailStatus = 'pending_approval';
    if (allApproved) {
      guardrailStatus = 'approved';
    } else if (hasRejected && !hasPending) {
      guardrailStatus = 'rejected';
    }

    await prismaClient.guardrail.update({
      where: { id: existingRule.guardrailId },
      data: {
        status: guardrailStatus,
        ...(guardrailStatus === 'approved' ? {
          approvedBy: currentEmail,
          approvedAt: new Date()
        } : guardrailStatus === 'rejected' ? {
          rejectedBy: currentEmail,
          rejectedAt: new Date()
        } : {})
      }
    });

    return new Response(JSON.stringify({
      success: true,
      rule: updatedRule,
      guardrailStatus,
      message: `Guardrail rule ${approved ? 'approved' : 'rejected'} successfully`
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error approving/rejecting guardrail rule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorDetails });
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to process approval', 
      message: errorMessage,
      details: errorDetails 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// Bulk approve/reject endpoint
export const PUT = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { updates } = body; // Array of { ruleId, status, reason? }

    if (!updates || !Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { ruleId, status, reason } = update;
        
        if (status === 'REJECTED' && !reason) {
          errors.push({ ruleId, error: 'Rejection reason required' });
          continue;
        }

        const rule = await prismaClient.guardrailRule.findUnique({
          where: { id: ruleId }
        });

        if (!rule) {
          errors.push({ ruleId, error: 'Rule not found' });
          continue;
        }

        // Check self-approval
        const currentUser = await prismaClient.user.findUnique({ where: { clerkId: auth.userId! } });
        const currentEmail = currentUser?.email || auth.userId!;
        if (rule.editedBy === currentEmail) {
          errors.push({ ruleId, error: 'Cannot approve own changes' });
          continue;
        }

        const updatedRule = await prismaClient.guardrailRule.update({
          where: { id: ruleId },
          data: {
            status: status,
            ...(status === 'APPROVED' ? {
              approvedBy: currentEmail,
              approvedAt: new Date()
            } : status === 'REJECTED' ? {
              rejectedBy: currentEmail,
              rejectedAt: new Date(),
              rejectionReason: reason
            } : {})
          }
        });

        // Create audit log (non-blocking - don't fail the request if audit logging fails)
        try {
          await prismaClient.guardrailAudit.create({
            data: {
              guardrailId: rule.guardrailId,
              ruleId: ruleId,
              action: status === 'APPROVED' ? 'approve' : 'reject',
              userId: auth.userId!,
              userName: currentEmail,
              changes: status === 'REJECTED' ? { reason } : undefined
            }
          });
        } catch (auditError) {
          // Log the error but don't fail the request
          console.warn('Failed to create audit log (non-critical):', auditError);
        }

        results.push({ ruleId, status: 'success' });
      } catch (err) {
        errors.push({ 
          ruleId: update.ruleId, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      errors,
      message: `Processed ${results.length} rules successfully, ${errors.length} errors`
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in bulk approval:', error);
    return new Response(JSON.stringify({ error: 'Failed to process bulk approval', details: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });