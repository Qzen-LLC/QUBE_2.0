import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


// GET /api/golden/entries - Get entries for a dataset
export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    const entryId = searchParams.get('id');
    const category = searchParams.get('category');

    if (entryId) {
      // Get specific entry
      const entry = await prismaClient.goldenEntry.findUnique({
        where: { id: entryId },
        include: {
          reviews: true
        }
      });

      if (!entry) {
        return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify(entry), { headers: { 'Content-Type': 'application/json' } });
    }

    if (!datasetId) {
      return new Response(JSON.stringify({ error: 'Dataset ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Build query with filters
    const where: any = { datasetId };
    if (category) {
      where.category = category;
    }

    const entries = await prismaClient.goldenEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: {
          select: {
            id: true,
            decision: true,
            reviewer: true
          }
        }
      }
    });

    return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in GET /api/golden/entries:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// POST /api/golden/entries - Create new entry
export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const {
      datasetId,
      category,
      input,
      expectedOutputs,
      metadata,
      quality
    } = body;

    if (!datasetId || !category || !input) {
      return new Response(JSON.stringify({ error: 'Missing required fields: datasetId, category, and input' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify dataset exists
    const dataset = await prismaClient.goldenDataset.findUnique({
      where: { id: datasetId }
    });

    if (!dataset) {
      return new Response(JSON.stringify({ error: 'Dataset not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Create the entry
    const entry = await prismaClient.goldenEntry.create({
      data: {
        datasetId,
        category,
        inputSpec: input,
        expectedOutputs: expectedOutputs || [],
        metadata: metadata || {},
        quality: quality || {
          validationScore: 0,
          clarityScore: 0,
          completenessScore: 0,
          relevanceScore: 0,
          expertReviewed: false,
          productionTested: false
        },
        version: 1
      }
    });

    // Update dataset statistics
    await updateDatasetStatistics(datasetId);

    return new Response(JSON.stringify({
      success: true,
      entry,
      message: 'Entry created successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in POST /api/golden/entries:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// PUT /api/golden/entries - Update entry
export const PUT = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get existing entry
    const existingEntry = await prismaClient.goldenEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Store previous version if content is changing
    const previousVersions: any[] = Array.isArray((existingEntry as any).previousVersions)
      ? ([...(existingEntry as any).previousVersions] as any[])
      : [];
    previousVersions.push({
      version: (existingEntry as any).version,
      content: {
        inputSpec: (existingEntry as any).inputSpec,
        expectedOutputs: (existingEntry as any).expectedOutputs,
        metadata: (existingEntry as any).metadata,
      },
      updatedAt: (existingEntry as any).updatedAt,
    });

    // Update the entry
    const entry = await prismaClient.goldenEntry.update({
      where: { id },
      data: {
        ...updates,
        version: (existingEntry as any).version + 1,
        previousVersions: previousVersions
      }
    });

    // Update dataset statistics
    await updateDatasetStatistics(existingEntry.datasetId);

    return new Response(JSON.stringify({
      success: true,
      entry,
      message: 'Entry updated successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in PUT /api/golden/entries:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// DELETE /api/golden/entries - Delete entry
export const DELETE = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get entry to know the dataset
    const entry = await prismaClient.goldenEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Delete the entry
    await prismaClient.goldenEntry.delete({
      where: { id }
    });

    // Update dataset statistics
    await updateDatasetStatistics(entry.datasetId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Entry deleted successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in DELETE /api/golden/entries:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// Helper function to update dataset statistics
async function updateDatasetStatistics(datasetId: string) {
  try {
    const entries = await prismaClient.goldenEntry.findMany({
      where: { datasetId }
    });

    const stats = {
      totalEntries: entries.length,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      avgQualityScore: 0,
      lastUpdated: new Date().toISOString()
    };

    let totalQuality = 0;
    
    entries.forEach(entry => {
      // Count by category
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
      
      // Count by difficulty and source from metadata
      const metadata = typeof entry.metadata === 'object' ? entry.metadata as any : {};
      const difficulty = metadata.difficulty || 'medium';
      const source = metadata.source || 'manual';
      
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      
      // Sum quality scores
      const quality = typeof entry.quality === 'object' ? entry.quality as any : {};
      totalQuality += quality.validationScore || 0;
    });

    if (entries.length > 0) {
      stats.avgQualityScore = totalQuality / entries.length;
    }

    // Update dataset with new statistics
    await prismaClient.goldenDataset.update({
      where: { id: datasetId },
      data: {
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Error updating dataset statistics:', error);
  }
}