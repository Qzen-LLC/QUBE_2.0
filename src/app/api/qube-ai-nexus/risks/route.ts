/**
 * QUBE AI Risk Data - Risks API
 * Returns risks from the merged QUBE AI Risk Data sources with filtering support
 *
 * Query Parameters:
 * - taxonomies: comma-separated list (e.g., "ibm-risk-atlas,owasp-llm-top-10-2025")
 * - riskGroups: comma-separated list of risk group IDs
 * - search: keyword search string
 * - page: pagination page number (default: 1)
 * - limit: items per page (default: 50, max: 5000)
 */

import { NextResponse } from 'next/server';
import { getAtlasNexusService } from '@/lib/qube-ai-nexus';
import type { Risk } from '@/lib/qube-ai-nexus/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // Parse query parameters
    const taxonomiesParam = url.searchParams.get('taxonomies');
    const riskGroupsParam = url.searchParams.get('riskGroups');
    const searchParam = url.searchParams.get('search');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(5000, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));

    const taxonomies = taxonomiesParam ? taxonomiesParam.split(',').filter(Boolean) : [];
    const riskGroups = riskGroupsParam ? riskGroupsParam.split(',').filter(Boolean) : [];
    const search = searchParam?.trim().toLowerCase() || '';

    const service = getAtlasNexusService();
    let allRisks = service.getAllRisks();

    // Apply taxonomy filter (multi-select)
    if (taxonomies.length > 0) {
      allRisks = allRisks.filter(risk =>
        taxonomies.includes(risk.isDefinedByTaxonomy)
      );
    }

    // Apply risk group filter (multi-select)
    if (riskGroups.length > 0) {
      allRisks = allRisks.filter(risk =>
        risk.isPartOfRiskGroup && riskGroups.some(group =>
          Array.isArray(risk.isPartOfRiskGroup)
            ? risk.isPartOfRiskGroup.includes(group)
            : risk.isPartOfRiskGroup === group
        )
      );
    }

    // Apply keyword search
    if (search) {
      allRisks = allRisks.filter(risk =>
        risk.name?.toLowerCase().includes(search) ||
        risk.description?.toLowerCase().includes(search) ||
        risk.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Get total count before pagination
    const totalCount = allRisks.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedRisks = allRisks.slice(startIndex, startIndex + limit);

    // Get statistics
    const statistics = service.getStatistics();

    // Group risks by taxonomy for counts
    const taxonomyCounts: Record<string, number> = {};
    allRisks.forEach(risk => {
      const taxonomy = risk.isDefinedByTaxonomy || 'unknown';
      taxonomyCounts[taxonomy] = (taxonomyCounts[taxonomy] || 0) + 1;
    });

    return NextResponse.json({
      risks: paginatedRisks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        taxonomies,
        riskGroups,
        search: search || null,
      },
      taxonomyCounts,
      statistics,
    });
  } catch (error) {
    console.error('[QUBE API] Error fetching risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risks' },
      { status: 500 }
    );
  }
}
