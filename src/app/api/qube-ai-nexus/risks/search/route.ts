/**
 * QUBE AI Risk Data - Semantic Search API
 * Uses OpenAI to semantically match search queries to risks
 *
 * POST body:
 * - query: string (required) - The search query
 * - taxonomies: string[] (optional) - Filter by specific taxonomies
 * - limit: number (optional) - Max results (default: 20)
 */

import { NextResponse } from 'next/server';
import { getRiskIdentificationEngine } from '@/lib/qube-ai-nexus';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, taxonomies, limit } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log('[QUBE API] Semantic search request:', {
      query: query.substring(0, 100),
      taxonomies: taxonomies?.length || 'all',
      limit: limit || 20,
    });

    const engine = getRiskIdentificationEngine();

    const result = await engine.semanticSearch(query.trim(), {
      taxonomies: taxonomies?.length > 0 ? taxonomies : undefined,
      limit: limit || 20,
    });

    return NextResponse.json({
      query: query.trim(),
      risks: result.risks,
      relevanceScores: result.relevanceScores,
      totalMatched: result.totalMatched,
      filters: {
        taxonomies: taxonomies || [],
        limit: limit || 20,
      },
    });
  } catch (error) {
    console.error('[QUBE API] Semantic search error:', error);

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI search is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}
