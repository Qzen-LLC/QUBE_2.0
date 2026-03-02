/**
 * Threat Identification Engine
 *
 * Uses LLM + MITRE ATLAS catalog to identify threats for an AI use case
 * using the STRIDE framework. Returns 5-15 threats with severity scores,
 * attack vectors, and MITRE technique mappings.
 */

import OpenAI from 'openai';
import { MitreAtlasService } from '@/lib/integrations/mitre-atlas.service';
import { prismaClient } from '@/utils/db';

export interface IdentifiedThreat {
  title: string;
  description: string;
  category: string; // STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
  framework: string; // 'STRIDE' | 'MITRE-ATLAS'
  severity: string; // Critical, High, Medium, Low
  severityScore: number; // 1-10
  likelihood: string;
  attackVector: string;
  affectedAsset: string;
  mitigationPlan: string;
  mitreTechniqueIds: string[];
  justification: string;
}

export interface ThreatIdentificationResult {
  threats: IdentifiedThreat[];
  tokenUsage: { input: number; output: number };
  duration: number;
}

const STRIDE_DEFINITIONS = `
STRIDE Categories:
- Spoofing: Pretending to be something or someone else (e.g., impersonating a legitimate user/model)
- Tampering: Modifying data or code without authorization (e.g., adversarial inputs, training data poisoning)
- Repudiation: Claiming to not have performed an action (e.g., denying AI-generated decisions)
- Information Disclosure: Exposing information to unauthorized entities (e.g., model extraction, PII leakage)
- Denial of Service: Making a system unavailable (e.g., resource exhaustion, model overload)
- Elevation of Privilege: Gaining unauthorized access to capabilities (e.g., prompt injection to bypass guardrails)
`;

export class ThreatIdentificationEngine {
  private openai: OpenAI;
  private atlasService: MitreAtlasService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for Threat Identification');
    }
    this.openai = new OpenAI({ apiKey });
    this.atlasService = new MitreAtlasService();
  }

  async identifyThreats(
    useCaseTitle: string,
    useCaseDescription: string,
    assessmentContextText?: string
  ): Promise<ThreatIdentificationResult> {
    const startTime = Date.now();

    // Build MITRE technique catalog summary
    const mitreSummary = this.buildMitreCatalogSummary();

    const contextSection = assessmentContextText
      ? `\n## FULL ASSESSMENT CONTEXT\n${assessmentContextText.substring(0, 25000)}`
      : '';

    const prompt = `You are an AI security threat modeling expert. Analyze the following AI use case and identify 5-15 threats using the STRIDE framework, with MITRE ATLAS technique mappings where applicable.

## USE CASE
Title: ${useCaseTitle}
Description: ${useCaseDescription}
${contextSection}

${STRIDE_DEFINITIONS}

## AVAILABLE MITRE ATLAS TECHNIQUES
${mitreSummary}

For each threat, provide:
1. A STRIDE category
2. Severity score (1-10) with justification
3. Likelihood (Very High, High, Medium, Low)
4. Attack vector description
5. Affected asset
6. Mitigation plan
7. Any matching MITRE ATLAS technique IDs

Respond with a JSON object:
{
  "threats": [
    {
      "title": "<threat title>",
      "description": "<1-2 sentence description>",
      "category": "<Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege>",
      "severity": "<Critical|High|Medium|Low>",
      "severityScore": <1-10>,
      "likelihood": "<Very High|High|Medium|Low>",
      "attackVector": "<how the attack would be executed>",
      "affectedAsset": "<what component/data is at risk>",
      "mitigationPlan": "<recommended mitigation steps>",
      "mitreTechniqueIds": ["<technique IDs from MITRE ATLAS>"],
      "justification": "<why this threat is relevant to this specific use case>"
    }
  ]
}

Guidelines:
- Focus on AI-specific threats (not generic IT security)
- Include at least one threat from each relevant STRIDE category
- Higher severity for customer-facing, safety-critical, or PII-handling systems
- Map to MITRE ATLAS techniques when a clear match exists`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an AI security threat modeling specialist. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { threats: [], tokenUsage: { input: 0, output: 0 }, duration: Date.now() - startTime };
      }

      const parsed = JSON.parse(content);
      const threats: IdentifiedThreat[] = (parsed.threats || []).map((t: any) => ({
        title: t.title || '',
        description: t.description || '',
        category: t.category || 'Information Disclosure',
        framework: t.mitreTechniqueIds?.length > 0 ? 'MITRE-ATLAS' : 'STRIDE',
        severity: t.severity || 'Medium',
        severityScore: Math.max(1, Math.min(10, Math.round(t.severityScore || 5))),
        likelihood: t.likelihood || 'Medium',
        attackVector: t.attackVector || '',
        affectedAsset: t.affectedAsset || '',
        mitigationPlan: t.mitigationPlan || '',
        mitreTechniqueIds: t.mitreTechniqueIds || [],
        justification: t.justification || '',
      }));

      return {
        threats,
        tokenUsage: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[Threat Engine] Error identifying threats:', error);
      return { threats: [], tokenUsage: { input: 0, output: 0 }, duration: Date.now() - startTime };
    }
  }

  private buildMitreCatalogSummary(): string {
    try {
      const allTechniques = this.atlasService.getAllTechniques();
      // Group by tactic
      const byTactic: Record<string, string[]> = {};
      for (const t of allTechniques.slice(0, 100)) {
        const tactic = t.tactic || 'Unknown';
        if (!byTactic[tactic]) byTactic[tactic] = [];
        byTactic[tactic].push(`${t.techniqueId}: ${t.technique?.substring(0, 60) || ''}`);
      }

      return Object.entries(byTactic)
        .map(([tactic, techniques]) => `### ${tactic}\n${techniques.join('\n')}`)
        .join('\n\n');
    } catch {
      return 'MITRE ATLAS catalog not available';
    }
  }
}
