import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { verifyUseCaseAccess } from '@/lib/org-scope';


export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');

    if (!useCaseId) {
      return new Response(JSON.stringify({ error: 'Missing useCaseId parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!(await verifyUseCaseAccess(auth, useCaseId))) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the latest guardrail for this use case
    const guardrail = await prismaClient.guardrail.findFirst({
      where: { useCaseId },
      orderBy: { createdAt: 'desc' },
      include: {
        rules: true
      }
    });

    if (!guardrail) {
      // Return success with empty payload instead of 404 to avoid noisy errors client-side
      return new Response(JSON.stringify({
        success: true,
        guardrails: null,
        rules: [],
        id: null,
        status: null,
        confidence: null,
        metadata: null
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Merge the database rules with the configuration
    const baseConfig = ((): any => {
      const cfg = guardrail.configuration as any;
      if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) return cfg;
      // Handle JSON string
      if (typeof cfg === 'string' && cfg.trim().length > 0) {
        try {
          return JSON.parse(cfg);
        } catch {
          return {};
        }
      }
      try {
        return JSON.parse(JSON.stringify(cfg ?? {}));
      } catch {
        return {};
      }
    })();
    
    // If configuration is empty but we have rules, reconstruct it
    const configWithDbIds = { ...(baseConfig as Record<string, any>) };
    const hasConfigContent = configWithDbIds && 
      Object.keys(configWithDbIds).length > 0 && 
      (configWithDbIds.guardrails || configWithDbIds.rules || configWithDbIds.metadata);
    
    // Variable to store deduplicated rules
    let uniqueRules: any[] = [];
    
    // If we have rules in the database, update the configuration with their IDs and status
    if (guardrail.rules && guardrail.rules.length > 0) {
      // First, deduplicate rules from database - keep only the latest version of each unique rule
      const uniqueRulesMap = new Map<string, any>();
      guardrail.rules.forEach((dbRule: any) => {
        const ruleKey = `${dbRule.type || 'general'}:${dbRule.rule}`;
        // If we've seen this rule before, keep the one with the latest updatedAt or createdAt
        if (!uniqueRulesMap.has(ruleKey)) {
          uniqueRulesMap.set(ruleKey, dbRule);
        } else {
          const existing = uniqueRulesMap.get(ruleKey)!;
          const existingTime = existing.updatedAt || existing.createdAt;
          const newTime = dbRule.updatedAt || dbRule.createdAt;
          if (newTime > existingTime) {
            uniqueRulesMap.set(ruleKey, dbRule);
          }
        }
      });
      
      // Convert map back to array of unique rules
      uniqueRules = Array.from(uniqueRulesMap.values());
      
      // Initialize guardrails structure if missing
      if (!configWithDbIds.guardrails) {
        configWithDbIds.guardrails = {};
      }
      if (!configWithDbIds.guardrails.rules) {
        configWithDbIds.guardrails.rules = {};
      }
      
      // Group rules by category/type
      uniqueRules.forEach((dbRule: any) => {
        const category = dbRule.type || 'general';
        if (!configWithDbIds.guardrails.rules[category]) {
          configWithDbIds.guardrails.rules[category] = [];
        }
        
        // Check if rule already exists in config (by rule name or ID)
        const existingRule = configWithDbIds.guardrails.rules[category].find(
          (r: any) => r.rule === dbRule.rule || r.id === dbRule.id
        );
        if (existingRule) {
          // Update existing rule with DB data
          Object.assign(existingRule, {
            id: dbRule.id,
            status: dbRule.status,
            isCustom: dbRule.isCustom,
            isEdited: dbRule.isEdited,
            approvedBy: dbRule.approvedBy,
            approvedAt: dbRule.approvedAt,
            rejectedBy: dbRule.rejectedBy,
            rejectedAt: dbRule.rejectedAt,
            rejectionReason: dbRule.rejectionReason
          });
        } else {
          // Add new rule from database
          configWithDbIds.guardrails.rules[category].push({
            id: dbRule.id,
            rule: dbRule.rule,
            type: dbRule.type,
            severity: dbRule.severity,
            description: dbRule.description,
            status: dbRule.status,
            isCustom: dbRule.isCustom,
            isEdited: dbRule.isEdited
          });
        }
      });
      
      // Add metadata if missing
      if (!configWithDbIds.metadata) {
        configWithDbIds.metadata = {
          version: '1.0',
          createdAt: guardrail.createdAt,
          updatedAt: guardrail.updatedAt
        };
      }
    }
    
    // Ensure we have a valid structure even if config was empty
    if (!hasConfigContent && guardrail.rules && guardrail.rules.length > 0) {
      // We've reconstructed from rules above, so configWithDbIds should now have content
      console.log(`✅ Reconstructed guardrails config from ${guardrail.rules.length} rules`);
    }
    
    // Return the guardrail configuration with the correct structure
    return new Response(JSON.stringify({
      success: true,
      guardrails: {
        ...configWithDbIds,
        // Ensure status and approval info are accessible
        status: guardrail.status,
        approvedAt: guardrail.approvedAt,
        approvedBy: guardrail.approvedBy,
        name: guardrail.name
      },
      rules: uniqueRules || guardrail.rules,
      id: guardrail.id,
      status: guardrail.status,
      approvedAt: guardrail.approvedAt,
      approvedBy: guardrail.approvedBy,
      name: guardrail.name,
      confidence: guardrail.confidence,
      metadata: {
        createdAt: guardrail.createdAt,
        updatedAt: guardrail.updatedAt,
        approvedAt: guardrail.approvedAt,
        approvedBy: guardrail.approvedBy
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching guardrails:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch guardrails', details: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });