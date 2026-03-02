import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

import { DatasetStatistics, QualityMetrics, EntryCategory, DataSource } from '@/lib/golden/types';

// GET /api/golden/datasets - List datasets or get specific dataset
export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');
    const useCaseId = searchParams.get('useCaseId');

    if (datasetId) {
      // Get specific dataset with entries
      const dataset = await prismaClient.goldenDataset.findUnique({
        where: { id: datasetId }
      });

      if (!dataset) {
        return new Response(JSON.stringify({ error: 'Dataset not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      // Get entries separately
      const entries = await prismaClient.goldenEntry.findMany({
        where: { datasetId: dataset.id }
      });

      // Get reviews for each entry
      const entriesWithReviews = await Promise.all(entries.map(async (entry) => {
        const reviews = await prismaClient.goldenReview.findMany({
          where: { entryId: entry.id }
        });
        return { ...entry, reviews };
      }));

      // Calculate statistics
      const statistics = calculateStatistics(entriesWithReviews);
      const qualityMetrics = calculateQualityMetrics(entriesWithReviews);

      return new Response(JSON.stringify({
        ...dataset,
        metadata: dataset.metadata || {},
        statistics: statistics,
        qualityMetrics: qualityMetrics,
        validationStatus: dataset.validationStatus || {},
        entries: entriesWithReviews
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // List datasets, optionally filtered by use case
    if (!useCaseId) {
      return new Response(JSON.stringify({ error: 'useCaseId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const datasets = await prismaClient.goldenDataset.findMany({
      where: { useCaseId },
      orderBy: { createdAt: 'desc' }
    });

    // Get entry counts for each dataset
    const datasetsWithCounts = await Promise.all(datasets.map(async (dataset) => {
      const entryCount = await prismaClient.goldenEntry.count({
        where: { datasetId: dataset.id }
      });
      return {
        ...dataset,
        entryCount
      };
    }));

    return new Response(JSON.stringify(datasetsWithCounts), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in GET /api/golden/datasets:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// POST /api/golden/datasets - Create new dataset
export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { 
      useCaseId, 
      name, 
      description, 
      metadata,
      validationStatus = {
        status: 'draft',
        validationProgress: {
          totalEntries: 0,
          validated: 0,
          pending: 0,
          rejected: 0
        },
        approvals: [],
        readyForProduction: false,
        productionChecklist: [],
        lastValidated: new Date().toISOString()
      }
    } = body;

    if (!useCaseId || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields: useCaseId and name' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify use case exists
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId }
    });

    if (!useCase) {
      return new Response(JSON.stringify({ error: 'Use case not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Create the dataset
    const dataset = await prismaClient.goldenDataset.create({
      data: {
        id: crypto.randomUUID(),
        useCaseId,
        name,
        description: description || '',
        version: '1.0.0',
        metadata: metadata || {},
        validationStatus: validationStatus,
        updatedAt: new Date(),
        statistics: {
          totalEntries: 0,
          byCategory: {},
          byDifficulty: {},
          bySource: {},
          avgQualityScore: 0
        },
        qualityMetrics: {
          overallScore: 0,
          dimensions: {
            completeness: 0,
            correctness: 0,
            consistency: 0,
            clarity: 0,
            diversity: 0,
            relevance: 0
          },
          issues: [],
          recommendations: []
        }
      }
    });

    return new Response(JSON.stringify({
      success: true,
      dataset,
      message: 'Golden dataset created successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in POST /api/golden/datasets:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// PUT /api/golden/datasets - Update dataset
export const PUT = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Dataset ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify dataset exists
    const existingDataset = await prismaClient.goldenDataset.findUnique({
      where: { id }
    });

    if (!existingDataset) {
      return new Response(JSON.stringify({ error: 'Dataset not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Update the dataset
    const dataset = await prismaClient.goldenDataset.update({
      where: { id },
      data: updates
    });

    return new Response(JSON.stringify({
      success: true,
      dataset,
      message: 'Dataset updated successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in PUT /api/golden/datasets:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// DELETE /api/golden/datasets - Delete dataset
export const DELETE = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Dataset ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Delete the dataset (entries will cascade delete)
    await prismaClient.goldenDataset.delete({
      where: { id }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Dataset deleted successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in DELETE /api/golden/datasets:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, { requireUser: true });

// Helper functions
function calculateStatistics(entries: any[]): Partial<DatasetStatistics> {
  const byCategory: Record<EntryCategory, number> = {
    functional: 0,
    edge_case: 0,
    adversarial: 0,
    safety: 0,
    performance: 0,
    quality: 0,
    robustness: 0,
    fairness: 0,
    compliance: 0,
    user_experience: 0,
  };

  const bySource: Record<DataSource, number> = {
    manual: 0,
    production: 0,
    synthetic: 0,
    crowdsourced: 0,
    imported: 0,
    augmented: 0,
    user_feedback: 0,
    a_b_testing: 0,
  };

  const stats: Partial<DatasetStatistics> = {
    totalEntries: entries.length,
    byCategory,
    byDifficulty: {},
    bySource,
    avgQualityScore: 0,
  };

  if (entries.length === 0) return stats;

  let totalQuality = 0;
  entries.forEach(entry => {
    // Count by category
    const rawCategory = entry.category as string | undefined;
    const allowedCategories: EntryCategory[] = [
      'functional','edge_case','adversarial','safety','performance','quality','robustness','fairness','compliance','user_experience'
    ];
    const category: EntryCategory = allowedCategories.includes(rawCategory as EntryCategory)
      ? (rawCategory as EntryCategory)
      : 'functional';
    stats.byCategory![category] = (stats.byCategory![category] || 0) + 1;

    // Count by difficulty
    const metadata = typeof entry.metadata === 'object' ? entry.metadata : {};
    const difficulty = metadata.difficulty || 'medium';
    stats.byDifficulty![difficulty] = (stats.byDifficulty![difficulty] || 0) + 1;

    // Count by source
    const rawSource = metadata.source as string | undefined;
    const allowedSources: DataSource[] = [
      'manual','production','synthetic','crowdsourced','imported','augmented','user_feedback','a_b_testing'
    ];
    const source: DataSource = allowedSources.includes(rawSource as DataSource)
      ? (rawSource as DataSource)
      : 'manual';
    stats.bySource![source] = (stats.bySource![source] || 0) + 1;

    // Sum quality scores
    const quality = typeof entry.quality === 'object' ? entry.quality : {};
    totalQuality += quality.validationScore || 0;
  });

  stats.avgQualityScore = totalQuality / entries.length;
  stats.lastUpdated = new Date().toISOString();

  return stats;
}

function calculateQualityMetrics(entries: any[]): Partial<QualityMetrics> {
  if (entries.length === 0) {
    return {
      overallScore: 0,
      dimensions: {
        completeness: 0,
        correctness: 0,
        consistency: 0,
        clarity: 0,
        diversity: 0,
        relevance: 0
      },
      issues: [],
      recommendations: []
    };
  }

  // Calculate dimension scores
  const dimensions = {
    completeness: calculateCompleteness(entries),
    correctness: calculateCorrectness(entries),
    consistency: calculateConsistency(entries),
    clarity: calculateClarity(entries),
    diversity: calculateDiversity(entries),
    relevance: calculateRelevance(entries)
  };

  const overallScore = Object.values(dimensions).reduce((sum, score) => sum + score, 0) / 6;

  // Identify issues
  const issues = identifyQualityIssues(entries);

  // Generate recommendations
  const recommendations = generateRecommendations(dimensions, issues);

  return {
    overallScore,
    dimensions,
    issues,
    recommendations
  };
}

function calculateCompleteness(entries: any[]): number {
  // Check if entries cover various categories and difficulties
  const categories = new Set(entries.map(e => e.category));
  const metadata = entries.map(e => typeof e.metadata === 'object' ? e.metadata : {});
  const difficulties = new Set(metadata.map(m => m.difficulty));
  
  const categoryScore = Math.min(categories.size / 5, 1); // Expect at least 5 categories
  const difficultyScore = Math.min(difficulties.size / 4, 1); // Expect all 4 difficulties
  
  return (categoryScore + difficultyScore) / 2;
}

function calculateCorrectness(entries: any[]): number {
  // Average validation scores
  const validScores = entries
    .map(e => typeof e.quality === 'object' ? e.quality : {})
    .filter(q => q.validationScore !== undefined)
    .map(q => q.validationScore);
  
  if (validScores.length === 0) return 0.5; // Default if no validation
  
  return validScores.reduce((sum: number, score: number) => sum + score, 0) / validScores.length;
}

function calculateConsistency(entries: any[]): number {
  // Check for consistency in format and structure
  let consistentCount = 0;
  
  entries.forEach(entry => {
    const input = typeof entry.inputSpec === 'object' ? entry.inputSpec : {};
    const hasInput = input.prompt;
    const hasOutput = entry.expectedOutputs;
    const hasMetadata = entry.metadata;
    
    if (hasInput && hasOutput && hasMetadata) {
      consistentCount++;
    }
  });
  
  return entries.length > 0 ? consistentCount / entries.length : 0;
}

function calculateClarity(entries: any[]): number {
  // Average clarity scores
  const clarityScores = entries
    .map(e => typeof e.quality === 'object' ? e.quality : {})
    .filter(q => q.clarityScore !== undefined)
    .map(q => q.clarityScore);
  
  if (clarityScores.length === 0) return 0.7; // Default
  
  return clarityScores.reduce((sum: number, score: number) => sum + score, 0) / clarityScores.length;
}

function calculateDiversity(entries: any[]): number {
  // Measure diversity of inputs
  const uniquePrompts = new Set(
    entries
      .map(e => {
        const input = typeof e.inputSpec === 'object' ? e.inputSpec : {};
        return input.prompt?.toLowerCase();
      })
      .filter(p => p)
  );
  const diversityRatio = uniquePrompts.size / Math.max(entries.length, 1);
  
  return diversityRatio;
}

function calculateRelevance(entries: any[]): number {
  // Average relevance scores
  const relevanceScores = entries
    .map(e => typeof e.quality === 'object' ? e.quality : {})
    .filter(q => q.relevanceScore !== undefined)
    .map(q => q.relevanceScore);
  
  if (relevanceScores.length === 0) return 0.8; // Default
  
  return relevanceScores.reduce((sum: number, score: number) => sum + score, 0) / relevanceScores.length;
}

function identifyQualityIssues(entries: any[]): any[] {
  const issues = [];
  
  // Check for duplicates
  const prompts = entries
    .map(e => {
      const input = typeof e.inputSpec === 'object' ? e.inputSpec : {};
      return input.prompt?.toLowerCase();
    })
    .filter(p => p);
  
  const duplicates = prompts.filter((p, i) => prompts.indexOf(p) !== i);
  
  if (duplicates.length > 0) {
    issues.push({
      type: 'duplicate',
      severity: 'medium',
      description: `Found ${duplicates.length} duplicate entries`,
      affectedEntries: duplicates
    });
  }
  
  // Check for low quality entries
  const lowQuality = entries.filter(e => {
    const quality = typeof e.quality === 'object' ? e.quality : {};
    return (quality.validationScore || 0) < 0.5;
  });
  
  if (lowQuality.length > 0) {
    issues.push({
      type: 'quality',
      severity: 'high',
      description: `${lowQuality.length} entries have low quality scores`,
      affectedEntries: lowQuality.map(e => e.id)
    });
  }
  
  return issues;
}

function generateRecommendations(dimensions: any, issues: any[]): string[] {
  const recommendations = [];
  
  if (dimensions.completeness < 0.7) {
    recommendations.push('Add more diverse categories and difficulty levels');
  }
  
  if (dimensions.diversity < 0.8) {
    recommendations.push('Increase input diversity to improve coverage');
  }
  
  if (dimensions.clarity < 0.7) {
    recommendations.push('Review and clarify ambiguous entries');
  }
  
  if (issues.some((i: any) => i.type === 'duplicate')) {
    recommendations.push('Remove or merge duplicate entries');
  }
  
  return recommendations;
}