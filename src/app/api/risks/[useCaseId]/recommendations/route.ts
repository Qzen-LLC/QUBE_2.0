import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { recommendRisksFromExternalSources, getExternalRisk } from '@/lib/integrations/risk-recommender';
import type { ExternalRisk, OwaspRisk, MitreTechniqueData } from '@/lib/integrations/types';
import { buildStepsDataFromAnswers } from '@/lib/mappers/answers-to-steps';
import { getRiskIdentificationEngine } from '@/lib/qube-ai-nexus';

export const GET = withAuth(
  async (request: Request, { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }) => {
    try {
      const { useCaseId } = await params;

      // Determine which source to use
      const url = new URL(request.url);
      const source = url.searchParams.get('source') || 'atlas'; // Default to atlas (LLM-based)

      // Validate source parameter
      if (!['atlas', 'risks', 'security', 'incidents'].includes(source)) {
        return NextResponse.json(
          { error: 'Invalid source parameter. Must be: atlas, risks, security, or incidents' },
          { status: 400 }
        );
      }

      // Fetch use case to verify it exists and get rich metadata
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
      });

      if (!useCase) {
        return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
      }

      // Build stepsData from Answer records (same approach as /api/get-usecase-details)
      const stepsData = await buildStepsDataFromAnswers(useCaseId);

      console.log('[Recommendations API] Generating recommendations for use case:', useCaseId, {
        source,
        hasMetadata: !!(useCase.title || useCase.problemStatement || useCase.proposedAISolution),
      });

      // QUBE AI Risk Data - LLM-based risk identification
      if (source === 'atlas') {
        console.log('[Recommendations API] Using QUBE AI Risk Data LLM-based identification...');

        const engine = getRiskIdentificationEngine();

        const result = await engine.identifyRisks({
          useCaseTitle: useCase.title || 'Untitled Use Case',
          useCaseDescription: useCase.problemStatement || useCase.proposedAISolution || '',
          problemStatement: useCase.problemStatement || undefined,
          proposedAISolution: useCase.proposedAISolution || undefined,
          assessmentData: stepsData || undefined,
        });

        console.log('[Recommendations API] QUBE AI Risk Data results:', {
          risksCount: result.identifiedRisks.length,
          mitigationsCount: result.mitigations.length,
          controlsCount: result.controls.length,
          evaluationsCount: result.evaluations.length,
          isGenAI: result.analysis.isGenAI,
          isAgenticAI: result.analysis.isAgenticAI,
        });

        // Return in a format compatible with the frontend
        return NextResponse.json({
          // Atlas Nexus data
          atlas: {
            risks: result.identifiedRisks,
            mitigations: result.mitigations,
            controls: result.controls,
            evaluations: result.evaluations,
          },
          // Legacy format compatibility
          ibm: result.identifiedRisks.map((r) => ({
            Id: r.id,
            Summary: r.name,
            Description: r.description,
            RiskCategory: r.riskGroupName || 'General',
            RiskSeverity: r.severity || 'Medium',
            Likelihood: r.likelihood || 'Possible',
            source: 'atlas',
            metadata: {
              taxonomy: r.isDefinedByTaxonomy,
              tag: r.tag,
              mitigationsCount: r.relatedActions?.length || 0,
              evaluationsCount: r.relatedEvaluations?.length || 0,
              controlsCount: r.relatedControls?.length || 0,
            },
          })),
          mit: [],
          owasp: [],
          mitre: [],
          aiid: [],
          totalRecommendations: result.identifiedRisks.length,
          analysis: {
            isGenAI: result.analysis.isGenAI,
            isAgenticAI: result.analysis.isAgenticAI,
            primaryUseCase: result.analysis.useCaseType,
            riskCategories: Array.from(
              new Set(result.identifiedRisks.map((r) => r.riskGroupName).filter(Boolean))
            ),
            // New analysis data
            matchedTaxonomies: result.analysis.matchedTaxonomies,
            totalRisksAnalyzed: result.analysis.totalRisksAnalyzed,
            llmConfidence: result.analysis.llmConfidence,
            totalMitigations: result.mitigations.length,
            totalControls: result.controls.length,
            totalEvaluations: result.evaluations.length,
          },
        });
      }

      // Validate that we have assessment data for legacy sources
      if (!stepsData || Object.keys(stepsData).length === 0) {
        return NextResponse.json(
          {
            error: 'No assessment data found. Please complete the assessment first.',
          },
          { status: 400 }
        );
      }

      // Legacy: Get recommendations from external sources using assessment data + rich metadata
      const recommendations = await recommendRisksFromExternalSources(
        {
          useCaseId,
          assessmentData: stepsData,
          useCaseMetadata: {
            title: useCase.title || undefined,
            problemStatement: useCase.problemStatement || undefined,
            proposedAISolution: useCase.proposedAISolution || undefined,
            keyBenefits: useCase.keyBenefits || undefined,
            successCriteria: useCase.successCriteria || undefined,
            currentState: useCase.currentState || undefined,
            desiredState: useCase.desiredState || undefined,
            keyAssumptions: useCase.keyAssumptions || undefined,
            businessFunction: useCase.businessFunction || undefined,
            primaryStakeholders: useCase.primaryStakeholders || undefined,
            operationalImpactScore: useCase.operationalImpactScore || undefined,
          },
        },
        source as 'risks' | 'security' | 'incidents'
      );

      console.log('[Recommendations API] Generated:', {
        ibmCount: recommendations.ibm.length,
        mitCount: recommendations.mit.length,
        owaspCount: recommendations.owasp.length,
        mitreCount: recommendations.mitre.length,
        aiidCount: recommendations.aiid.length,
        total: recommendations.totalRecommendations,
      });

      return NextResponse.json(recommendations);
    } catch (error) {
      console.error('[Recommendations API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate risk recommendations' },
        { status: 500 }
      );
    }
  },
  { requireUser: true }
);

/**
 * POST /api/risks/[useCaseId]/recommendations
 * Import selected risks from external sources to the use case
 */
export const POST = withAuth(
  async (request: Request, { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }) => {
    try {
      const { useCaseId } = await params;
      const { selectedRisks } = await request.json();

      if (!selectedRisks || !Array.isArray(selectedRisks) || selectedRisks.length === 0) {
        return NextResponse.json({ error: 'No risks selected for import' }, { status: 400 });
      }

      // Get user record
      const userRecord = await prismaClient.user.findUnique({
        where: { clerkId: auth.userId! },
      });

      if (!userRecord) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify use case exists
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
      });

      if (!useCase) {
        return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
      }

      console.log('[Recommendations API] Importing risks:', {
        useCaseId,
        count: selectedRisks.length,
        sources: selectedRisks.map((r: any) => r.source),
      });

      // Import each selected risk
      const createdRisks = [];

      for (const riskData of selectedRisks) {
        const { source, sourceId } = riskData;

        // Map external risk to internal risk model
        let mappedRisk;

        // Handle Atlas Nexus risks (LLM-identified)
        if (source === 'atlas') {
          // For Atlas risks, we use the risk ID to look up from our local data
          const { getAtlasNexusService } = await import('@/lib/qube-ai-nexus');
          const atlasService = getAtlasNexusService();
          const atlasRisk = atlasService.getRiskById(sourceId);

          if (!atlasRisk) {
            console.warn(`[Recommendations API] Atlas risk not found: ${sourceId}`);
            continue;
          }

          // Get related mitigations for the risk
          const relatedActions = atlasService.getRelatedActions(atlasRisk);
          const mitigationPlan =
            relatedActions.length > 0
              ? relatedActions
                  .slice(0, 5)
                  .map((a) => `• ${a.name}: ${a.description}`)
                  .join('\n\n')
              : 'Refer to QUBE AI Risk Data for mitigation strategies';

          mappedRisk = {
            useCaseId,
            title: atlasRisk.name,
            description: atlasRisk.description || `Risk from ${atlasRisk.isDefinedByTaxonomy || 'QUBE AI Risk Data'} taxonomy: ${atlasRisk.name}`,
            category: mapAtlasTaxonomyToCategory(atlasRisk.isDefinedByTaxonomy),
            riskLevel: 'Medium', // Default for Atlas risks
            riskScore: 5,
            likelihood: 'Possible',
            impact: `Risk from ${atlasRisk.isDefinedByTaxonomy} taxonomy`,
            mitigationPlan,
            sourceType: 'atlas',
            sourceId: atlasRisk.id,
            sourceMetadata: {
              taxonomy: atlasRisk.isDefinedByTaxonomy,
              tag: atlasRisk.tag,
              relatedActionsCount: relatedActions.length,
            },
            createdBy: userRecord.id,
            createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown',
            createdByEmail: userRecord.email,
          };
        } else {
          // Get full risk details from the appropriate service for legacy sources
          const riskDetails = await getExternalRisk(source, sourceId);

          if (!riskDetails) {
            console.warn(`[Recommendations API] Risk not found: ${source}:${sourceId}`);
            continue;
          }

          if (source === 'owasp') {
          const owaspRisk = riskDetails as unknown as OwaspRisk;
          mappedRisk = {
            useCaseId,
            title: `${owaspRisk.id}: ${owaspRisk.title}`,
            description: owaspRisk.description || `OWASP LLM Top 10 risk ${owaspRisk.id}: ${owaspRisk.title}`,
            category: mapOwaspToCategory(owaspRisk.id),
            riskLevel: owaspRisk.severity === 'Critical' ? 'Critical' : owaspRisk.severity,
            riskScore: owaspRisk.severity === 'Critical' ? 9 : owaspRisk.severity === 'High' ? 7 : 5,
            likelihood: 'Possible',
            impact: 'High impact for LLM applications',
            mitigationPlan: owaspRisk.mitigation.join('\n\n'),
            sourceType: source,
            sourceId: owaspRisk.id,
            sourceMetadata: {
              rank: owaspRisk.rank,
              examples: owaspRisk.examples,
              realWorldIncidents: owaspRisk.realWorldIncidents,
            },
            createdBy: userRecord.id,
            createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown',
            createdByEmail: userRecord.email,
          };
        } else if (source === 'mitre') {
          // MITRE ATLAS technique
          const mitreTechnique = riskDetails as unknown as MitreTechniqueData;
          const techniqueId = mitreTechnique?.techniqueId || sourceId || 'Unknown';
          const technique = mitreTechnique?.technique || 'MITRE ATLAS Technique';
          const tactic = mitreTechnique?.tactic || 'Unknown Tactic';
          // Ensure description always has a value - it's required by Prisma
          const description = mitreTechnique?.description || 
            `MITRE ATLAS technique ${techniqueId}: ${technique}. ${tactic && tactic !== 'Unknown Tactic' ? `Tactic: ${tactic}` : ''}`.trim() ||
            `MITRE ATLAS security technique ${sourceId || 'Unknown'}`;
          
          mappedRisk = {
            useCaseId,
            title: `${techniqueId}: ${technique}`,
            description: description,
            category: 'technical', // All MITRE techniques are security/technical
            riskLevel: mitreTechnique?.severity || 'Medium',
            riskScore: mitreTechnique?.severity === 'Critical' ? 9 : mitreTechnique?.severity === 'High' ? 7 : mitreTechnique?.severity === 'Medium' ? 5 : 3,
            likelihood: 'Possible',
            impact: `Adversarial technique targeting AI systems - Tactic: ${tactic}`,
            mitigationPlan: mitreTechnique?.mitigation || 'Refer to MITRE ATLAS guidance for mitigation strategies',
            sourceType: source,
            sourceId: techniqueId,
            sourceMetadata: {
              tactic: tactic,
              tacticId: mitreTechnique?.tacticId,
              detection: mitreTechnique?.detection,
              caseStudies: mitreTechnique?.caseStudies,
              platforms: mitreTechnique?.metadata?.platforms,
            },
            createdBy: userRecord.id,
            createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown',
            createdByEmail: userRecord.email,
          };
        } else if (source === 'aiid') {
          // AIID incident
          const { aiidService } = await import('@/lib/integrations/aiid.service');
          const incident = await aiidService.getIncidentById(parseInt(sourceId));

          if (!incident) {
            console.warn(`[Recommendations API] AIID incident not found: ${sourceId}`);
            continue;
          }

          // Calculate harm severity-based risk score
          const harmSeverityScore = incident.harmSeverity !== undefined ? Math.min(10, incident.harmSeverity * 2) : 5;

          mappedRisk = {
            useCaseId,
            title: `AIID #${incident.incidentId}: ${incident.title}`,
            description: incident.description || `AI incident #${incident.incidentId}: ${incident.title}`,
            category: 'operational', // Real-world incidents are typically operational
            riskLevel: harmSeverityScore >= 8 ? 'Critical' : harmSeverityScore >= 6 ? 'High' : harmSeverityScore >= 4 ? 'Medium' : 'Low',
            riskScore: harmSeverityScore,
            likelihood: 'Possible', // Incidents have already happened, so possible
            impact: `Real-world AI incident - Harm Severity: ${incident.harmSeverity || 'N/A'}`,
            mitigationPlan: incident.lessonsLearned || 'Review incident reports for specific mitigation strategies',
            sourceType: source,
            sourceId: String(incident.incidentId),
            sourceMetadata: JSON.parse(JSON.stringify({
              harmType: incident.harmType,
              sector: incident.sector,
              technology: incident.technology,
              failureCause: incident.failureCause,
              reportCount: incident.reports.length,
              deployers: incident.deployers,
              developers: incident.developers,
            })),
            createdBy: userRecord.id,
            createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown',
            createdByEmail: userRecord.email,
          } as any;
        } else {
          // IBM or MIT risk
          const externalRisk = riskDetails as unknown as ExternalRisk;
          mappedRisk = {
            useCaseId,
            title: externalRisk.Summary,
            description: externalRisk.Description || externalRisk.Summary || 'Risk from external source',
            category: mapCategoryToInternal(externalRisk.RiskCategory),
            riskLevel: mapSeverity(externalRisk.RiskSeverity),
            riskScore: calculateRiskScore(externalRisk.RiskSeverity, externalRisk.Likelihood),
            likelihood: mapLikelihood(externalRisk.Likelihood),
            impact: `Risk severity: ${externalRisk.RiskSeverity}`,
            mitigationPlan: 'To be assessed based on use case specifics',
            sourceType: source,
            sourceId: String(externalRisk.Id),
            sourceMetadata: {
              originalCategory: externalRisk.RiskCategory,
              source: externalRisk.source,
            },
            createdBy: userRecord.id,
            createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown',
            createdByEmail: userRecord.email,
          };
        }
        } // Close the outer else block for legacy sources

        // Create the risk in database
        const risk = await prismaClient.risk.create({
          data: mappedRisk,
        });

        createdRisks.push(risk);
      }

      console.log('[Recommendations API] Successfully imported:', {
        imported: createdRisks.length,
        requested: selectedRisks.length,
        riskIds: createdRisks.map((r) => r.id),
      });

      return NextResponse.json({
        imported: createdRisks.length,
        risks: createdRisks,
        message: `Successfully imported ${createdRisks.length} risk(s) from external sources`,
      });
    } catch (error) {
      console.error('[Recommendations API] Import error:', error);
      return NextResponse.json({ error: 'Failed to import risks' }, { status: 500 });
    }
  },
  { requireUser: true }
);

// Helper functions

function mapOwaspToCategory(owaspId: string): string {
  const mapping: Record<string, string> = {
    LLM01: 'technical', // Prompt Injection
    LLM02: 'data', // Sensitive Info Disclosure
    LLM03: 'technical', // Supply Chain
    LLM04: 'technical', // Data Poisoning
    LLM05: 'technical', // Improper Output Handling
    LLM06: 'operational', // Excessive Agency
    LLM07: 'technical', // System Prompt Leakage
    LLM08: 'technical', // Vector Weaknesses
    LLM09: 'ethical', // Misinformation
    LLM10: 'operational', // Unbounded Consumption
  };
  return mapping[owaspId] || 'technical';
}

function mapCategoryToInternal(externalCategory: string): string {
  const categoryLower = externalCategory.toLowerCase();

  if (categoryLower.includes('data') || categoryLower.includes('privacy')) return 'data';
  if (categoryLower.includes('technical') || categoryLower.includes('security')) return 'technical';
  if (categoryLower.includes('regulatory') || categoryLower.includes('compliance')) return 'regulatory';
  if (categoryLower.includes('ethical') || categoryLower.includes('bias') || categoryLower.includes('fairness'))
    return 'ethical';
  if (categoryLower.includes('operational')) return 'operational';
  if (categoryLower.includes('business') || categoryLower.includes('reputational')) return 'business';

  return 'technical'; // default
}

function mapSeverity(severity: string): string {
  const severityLower = severity.toLowerCase();

  if (severityLower === 'catastrophic' || severityLower === 'major') return 'Critical';
  if (severityLower === 'moderate') return 'High';
  if (severityLower === 'minor') return 'Medium';
  if (severityLower === 'negligible') return 'Low';

  return 'Medium'; // default
}

function mapLikelihood(likelihood: string): string {
  const likelihoodLower = likelihood.toLowerCase();

  if (likelihoodLower.includes('almost certain') || likelihoodLower === 'likely') return 'High';
  if (likelihoodLower === 'possible') return 'Medium';
  if (likelihoodLower === 'unlikely' || likelihoodLower === 'rare') return 'Low';

  return 'Medium'; // default
}

function calculateRiskScore(severity: string, likelihood: string): number {
  const severityScores: Record<string, number> = {
    Catastrophic: 5,
    Major: 4,
    Moderate: 3,
    Minor: 2,
    Negligible: 1,
  };

  const likelihoodScores: Record<string, number> = {
    'Almost certain': 5,
    Likely: 4,
    Possible: 3,
    Unlikely: 2,
    Rare: 1,
  };

  const severityScore = severityScores[severity] || 3;
  const likelihoodScore = likelihoodScores[likelihood] || 3;

  // Calculate average and scale to 0-10
  return Math.min(10, Math.round(((severityScore + likelihoodScore) / 2) * 2));
}

function mapAtlasTaxonomyToCategory(taxonomy: string): string {
  const mapping: Record<string, string> = {
    'ibm-risk-atlas': 'technical',
    'air-2024': 'ethical',
    'ailuminate': 'ethical',
    'nist-ai-rmf': 'regulatory',
    'credo-ucf': 'regulatory',
    'owasp-llm': 'technical',
    'mit-ai-risk': 'technical',
    'granite-guardian': 'technical',
    'shieldgemma': 'technical',
  };
  return mapping[taxonomy] || 'technical';
}
