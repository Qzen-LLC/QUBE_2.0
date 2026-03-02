import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const { useCaseId, evaluationConfig, evaluationResult } = body;

    if (!useCaseId || !evaluationConfig) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Save or update evaluation
    let evaluation;
    if (evaluationConfig.id) {
      // Try to find existing evaluation first
      const existingEvaluation = await prismaClient.evaluation.findUnique({
        where: { id: evaluationConfig.id }
      });
      
      if (existingEvaluation) {
        // Update existing evaluation
        evaluation = await prismaClient.evaluation.update({
          where: { id: evaluationConfig.id },
          data: {
            name: evaluationConfig.name || 'Evaluation ' + new Date().toLocaleDateString(),
            description: evaluationConfig.description,
            configuration: evaluationConfig,
            status: evaluationResult ? 'completed' : 'pending',
            completedAt: evaluationResult ? new Date() : null
          }
        });
      } else {
        // Create new evaluation with the provided ID
        evaluation = await prismaClient.evaluation.create({
          data: {
            id: evaluationConfig.id,
            useCaseId,
            name: evaluationConfig.name || 'Evaluation ' + new Date().toLocaleDateString(),
            description: evaluationConfig.description,
            configuration: evaluationConfig,
            status: evaluationResult ? 'completed' : 'pending',
            completedAt: evaluationResult ? new Date() : null
          }
        });
      }
    } else {
      // Create new evaluation without ID
      evaluation = await prismaClient.evaluation.create({
        data: {
          useCaseId,
          name: evaluationConfig.name || 'Evaluation ' + new Date().toLocaleDateString(),
          description: evaluationConfig.description,
          configuration: evaluationConfig,
          status: evaluationResult ? 'completed' : 'pending',
          completedAt: evaluationResult ? new Date() : null
        }
      });
    }

    // If evaluation result is provided, save the results
    if (evaluationResult && evaluationResult.results) {
      // Delete existing results for this evaluation
      await prismaClient.evaluationResult.deleteMany({
        where: { evaluationId: evaluation.id }
      });

      // Save new results
      const results = evaluationResult.results.map((result: any) => ({
        evaluationId: evaluation.id,
        category: result.category || 'general',
        testType: result.testType || 'functional',
        input: result.input || {},
        expectedOutput: result.expectedOutput,
        actualOutput: result.actualOutput,
        metrics: result.metrics || {},
        passed: result.passed || false,
        severity: result.severity,
        details: result.details || {}
      }));

      await prismaClient.evaluationResult.createMany({
        data: results
      });

      // Update evaluation summary with detailed scores
      const passedCount = results.filter((r: any) => r.passed).length;
      const totalCount = results.length;
      
      // Extract dimension scores from the evaluation result if available
      let dimensionScores = {};
      let overallScore = 0;
      let recommendations = [];
      
      if (evaluationResult && evaluationResult.scores) {
        dimensionScores = evaluationResult.scores.dimensionScores || {};
        overallScore = evaluationResult.scores.overallScore?.value || 0;
        recommendations = evaluationResult.recommendations || [];
      }
      
      try {
        await prismaClient.evaluation.update({
          where: { id: evaluation.id },
          data: {
            summary: {
              totalTests: totalCount,
              passed: passedCount,
              failed: totalCount - passedCount,
              passRate: totalCount > 0 ? passedCount / totalCount : 0,
              overallScore: overallScore,
              dimensionScores: dimensionScores,
              recommendations: recommendations,
              timestamp: new Date().toISOString()
            }
          }
        });
        console.log(`✅ Evaluation summary updated for evaluation ${evaluation.id}`);
        console.log(`   Overall score: ${overallScore}`);
        console.log(`   Dimension scores:`, Object.keys(dimensionScores));
      } catch (updateError) {
        console.error('Failed to update evaluation summary:', updateError);
        // Don't fail the entire request if summary update fails
      }
    }

    return NextResponse.json({
      success: true,
      evaluationId: evaluation.id,
      message: 'Evaluation saved successfully'
    });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to save evaluation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });