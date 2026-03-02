import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

import * as yaml from 'js-yaml';

export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const guardrailId = searchParams.get('guardrailId');
    const format = searchParams.get('format') || 'json';

    if (!useCaseId && !guardrailId) {
      return new Response(JSON.stringify({ error: 'Either useCaseId or guardrailId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let guardrails: any[];
    
    if (guardrailId) {
      // Export specific guardrail
      const guardrail = await prismaClient.guardrail.findUnique({
        where: { id: guardrailId },
        include: {
          rules: true,
          useCase: {
            select: {
              title: true,
              problemStatement: true
            }
          }
        }
      });

      if (!guardrail) {
        return new Response(JSON.stringify({ error: 'Guardrail not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      guardrails = [guardrail];
    } else {
      // Export all guardrails for a use case
      guardrails = await prismaClient.guardrail.findMany({
        where: { useCaseId: useCaseId as string },
        include: {
          rules: true,
          useCase: {
            select: {
              title: true,
              problemStatement: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (format === 'yaml') {
      // Convert to YAML format
      const yamlContent = (yaml as any).dump({
        guardrails: guardrails.map((g: any) => ({
          name: (g as any).name,
          useCase: (g as any).useCase?.title,
          approach: (g as any).approach,
          confidence: (g as any).confidence,
          status: (g as any).status,
          rules: (g as any).rules?.map((r: any) => ({
            type: r.type,
            severity: r.severity,
            rule: r.rule,
            description: r.description,
            implementation: r.implementation
          }))
        }))
      });
      
      return new Response(yamlContent, {
        headers: {
          'Content-Type': 'text/yaml',
          'Content-Disposition': `attachment; filename="guardrails-${Date.now()}.yaml"`
        }
      });
    } else if (format === 'openai') {
      // Export in OpenAI format for their moderation API
      const openAIFormat = guardrails.map((g: any) => ({
        name: (g as any).name,
        rules: (g as any).rules?.filter((r: any) => r.type === 'content_safety').map((r: any) => ({
          category: r.rule,
          threshold: r.severity === 'critical' ? 0.1 : r.severity === 'high' ? 0.3 : 0.5
        }))
      }));
      
      return new Response(JSON.stringify(openAIFormat), { headers: { 'Content-Type': 'application/json' } });
    } else {
      // Return as JSON
      return new Response(JSON.stringify({
        guardrails,
        exportedAt: new Date().toISOString(),
        count: guardrails.length
      }), { headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Error exporting guardrails:', error);
    return new Response(JSON.stringify({ error: 'Failed to export guardrails' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });