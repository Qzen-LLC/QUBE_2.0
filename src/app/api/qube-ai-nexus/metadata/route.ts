/**
 * QUBE AI Risk Data - Metadata API
 * Returns taxonomies, risk groups, and statistics for filter dropdowns
 */

import { NextResponse } from 'next/server';
import { getAtlasNexusService } from '@/lib/qube-ai-nexus';

export async function GET() {
  try {
    const service = getAtlasNexusService();

    // Get all data
    const taxonomies = service.getAllTaxonomies();
    const riskGroups = service.getAllRiskGroups();
    const statistics = service.getStatistics();
    const allRisks = service.getAllRisks();

    // Count risks per taxonomy
    const taxonomyCounts: Record<string, number> = {};
    allRisks.forEach(risk => {
      const taxonomy = risk.isDefinedByTaxonomy || 'unknown';
      taxonomyCounts[taxonomy] = (taxonomyCounts[taxonomy] || 0) + 1;
    });

    // Count risks per risk group
    const riskGroupCounts: Record<string, number> = {};
    allRisks.forEach(risk => {
      if (risk.isPartOfRiskGroup) {
        const groups = Array.isArray(risk.isPartOfRiskGroup)
          ? risk.isPartOfRiskGroup
          : [risk.isPartOfRiskGroup];
        groups.forEach(group => {
          riskGroupCounts[group] = (riskGroupCounts[group] || 0) + 1;
        });
      }
    });

    // Enrich taxonomies with counts
    const enrichedTaxonomies = taxonomies.map(taxonomy => ({
      ...taxonomy,
      riskCount: taxonomyCounts[taxonomy.id] || 0,
    }));

    // Enrich risk groups with counts and taxonomy info
    const enrichedRiskGroups = riskGroups.map(group => ({
      ...group,
      riskCount: riskGroupCounts[group.id] || 0,
    }));

    // Group risk groups by taxonomy for easier UI rendering
    const riskGroupsByTaxonomy: Record<string, typeof enrichedRiskGroups> = {};
    enrichedRiskGroups.forEach(group => {
      const taxonomy = group.isDefinedByTaxonomy || 'other';
      if (!riskGroupsByTaxonomy[taxonomy]) {
        riskGroupsByTaxonomy[taxonomy] = [];
      }
      riskGroupsByTaxonomy[taxonomy].push(group);
    });

    return NextResponse.json({
      taxonomies: enrichedTaxonomies,
      riskGroups: enrichedRiskGroups,
      riskGroupsByTaxonomy,
      statistics,
      totalRisks: allRisks.length,
    });
  } catch (error) {
    console.error('[QUBE API] Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
