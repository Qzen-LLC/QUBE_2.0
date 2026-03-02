import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const evaluationId = searchParams.get('evaluationId');
    const format = searchParams.get('format') || 'json';

    if (!useCaseId && !evaluationId) {
      return NextResponse.json(
        { error: 'Either useCaseId or evaluationId is required' },
        { status: 400 }
      );
    }

    let evaluations;
    
    if (evaluationId) {
      // Export specific evaluation
      const evaluation = await prismaClient.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
          results: true,
          useCase: {
            select: {
              title: true,
              problemStatement: true
            }
          }
        }
      });

      if (!evaluation) {
        return NextResponse.json(
          { error: 'Evaluation not found' },
          { status: 404 }
        );
      }

      evaluations = [evaluation];
    } else {
      // Export all evaluations for a use case
      evaluations = await prismaClient.evaluation.findMany({
        where: { useCaseId: useCaseId as string },
        include: {
          results: true,
          useCase: {
            select: {
              title: true,
              problemStatement: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(evaluations);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="evaluations-${Date.now()}.csv"`
        }
      });
    } else {
      // Return as JSON
      return NextResponse.json({
        evaluations,
        exportedAt: new Date().toISOString(),
        count: evaluations.length
      });
    }
  } catch (error) {
    console.error('Error exporting evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to export evaluations' },
      { status: 500 }
    );
  }
}, { requireUser: true });

function convertToCSV(evaluations: any[]): string {
  const headers = [
    'Use Case',
    'Evaluation Name',
    'Status',
    'Test Category',
    'Test Type',
    'Passed',
    'Severity',
    'Input',
    'Expected Output',
    'Actual Output',
    'Created At'
  ];

  const rows: string[][] = [headers];

  evaluations.forEach(evaluation => {
    evaluation.results?.forEach((result: any) => {
      rows.push([
        evaluation.useCase?.title || '',
        evaluation.name || '',
        evaluation.status || '',
        result.category || '',
        result.testType || '',
        result.passed ? 'Yes' : 'No',
        result.severity || '',
        JSON.stringify(result.input || {}),
        JSON.stringify(result.expectedOutput || {}),
        JSON.stringify(result.actualOutput || {}),
        evaluation.createdAt?.toString() || ''
      ]);
    });
  });

  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}