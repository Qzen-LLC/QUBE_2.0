/**
 * QUBE AI Risk Data - Single Risk Details API
 * Returns enriched risk data with related mitigations, controls, and evaluations
 */

import { NextResponse } from 'next/server';
import { getAtlasNexusService } from '@/lib/qube-ai-nexus';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Risk ID is required' },
        { status: 400 }
      );
    }

    const service = getAtlasNexusService();
    const risk = service.getRiskById(id);

    if (!risk) {
      return NextResponse.json(
        { error: 'Risk not found' },
        { status: 404 }
      );
    }

    // Get enriched risk with related items
    const enrichedRisk = service.getEnrichedRisk(risk);

    // Get additional related data
    const relatedActions = service.getRelatedActions(risk);
    const relatedControls = service.getRelatedControls(risk);
    const relatedEvaluations = service.getRelatedEvaluations(risk);

    // Get taxonomy info
    const taxonomies = service.getAllTaxonomies();
    const taxonomy = taxonomies.find(t => t.id === risk.isDefinedByTaxonomy);

    // Get risk group info
    const riskGroups = service.getAllRiskGroups();
    const riskGroupIds = Array.isArray(risk.isPartOfRiskGroup)
      ? risk.isPartOfRiskGroup
      : risk.isPartOfRiskGroup
        ? [risk.isPartOfRiskGroup]
        : [];
    const riskGroupDetails = riskGroups.filter(g => riskGroupIds.includes(g.id));

    return NextResponse.json({
      risk: {
        ...enrichedRisk,
        taxonomyDetails: taxonomy || null,
        riskGroupDetails,
      },
      relatedItems: {
        mitigations: relatedActions,
        controls: relatedControls,
        evaluations: relatedEvaluations,
      },
      counts: {
        mitigations: relatedActions.length,
        controls: relatedControls.length,
        evaluations: relatedEvaluations.length,
      },
    });
  } catch (error) {
    console.error('[QUBE API] Error fetching risk details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk details' },
      { status: 500 }
    );
  }
}
