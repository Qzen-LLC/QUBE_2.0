import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


// POST /api/golden/collect - Collect entry from production or testing
export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const {
      datasetId,
      source = 'production',
      sessionId,
      input,
      output,
      metadata = {},
      userFeedback,
      modelInfo
    } = body;

    if (!datasetId || !input || !output) {
      return new Response(JSON.stringify({ error: 'Missing required fields: datasetId, input, and output' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify dataset exists
    const dataset = await prismaClient.goldenDataset.findUnique({
      where: { id: datasetId }
    });

    if (!dataset) {
      return new Response(JSON.stringify({ error: 'Dataset not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Determine category based on input type or metadata
    const category = metadata.category || inferCategory(input, output);

    // Create entry from collected data
    const entry = await prismaClient.goldenEntry.create({
      data: {
        datasetId,
        category,
        inputSpec: {
          prompt: typeof input === 'string' ? input : input.prompt,
          context: input.context,
          systemPrompt: input.systemPrompt,
          parameters: input.parameters || {},
          conversationHistory: input.conversationHistory
        },
        expectedOutputs: [{
          id: generateId(),
          content: typeof output === 'string' ? output : output.content,
          type: 'collected',
          format: output.format || 'text',
          isPreferred: true,
          acceptabilityScore: userFeedback?.rating ? userFeedback.rating / 5 : 0.8
        }],
        metadata: {
          ...metadata,
          source,
          sourceDetails: {
            originalId: sessionId,
            timestamp: new Date().toISOString(),
            user: auth.userId!,
            session: sessionId,
            confidence: output.confidence
          },
          difficulty: metadata.difficulty || 'medium',
          priority: metadata.priority || 'medium',
          testTypes: metadata.testTypes || ['functional'],
          evaluationDimensions: metadata.evaluationDimensions || ['accuracy'],
          isEdgeCase: metadata.isEdgeCase || false,
          isAdversarial: metadata.isAdversarial || false,
          isRealWorld: true,
          isSynthetic: false,
          createdBy: auth.userId!,
          modelInfo
        },
        quality: {
          validationScore: userFeedback?.rating ? userFeedback.rating / 5 : 0,
          clarityScore: 0.8,
          completenessScore: 0.9,
          relevanceScore: 0.9,
          expertReviewed: false,
          productionTested: true,
          productionMetrics: {
            usageCount: 1,
            successRate: userFeedback?.success ? 1 : 0,
            avgConfidence: output.confidence || 0.8,
            lastUsed: new Date().toISOString()
          }
        },
        version: 1
      }
    });

    // Update dataset statistics
    await updateDatasetStatistics(datasetId);

    return new Response(JSON.stringify({
      success: true,
      entry,
      message: 'Entry collected successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in POST /api/golden/collect:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function inferCategory(input: any, output: any): string {
  // Simple category inference based on input/output patterns
  const prompt = typeof input === 'string' ? input : input.prompt || '';
  
  if (prompt.includes('classify') || prompt.includes('categorize')) {
    return 'classification';
  }
  if (prompt.includes('generate') || prompt.includes('create')) {
    return 'generation';
  }
  if (prompt.includes('extract') || prompt.includes('find')) {
    return 'extraction';
  }
  if (prompt.includes('summarize') || prompt.includes('summary')) {
    return 'summarization';
  }
  if (prompt.includes('question') || prompt.includes('answer')) {
    return 'qa';
  }
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    return 'conversation';
  }
  
  return 'functional';
}

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
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
      
      const metadata = typeof entry.metadata === 'object' ? entry.metadata as any : {};
      const difficulty = metadata.difficulty || 'medium';
      const source = metadata.source || 'manual';
      
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      
      const quality = typeof entry.quality === 'object' ? entry.quality as any : {};
      totalQuality += quality.validationScore || 0;
    });

    if (entries.length > 0) {
      stats.avgQualityScore = totalQuality / entries.length;
    }

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