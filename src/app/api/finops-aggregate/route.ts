import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { syncFinOpsFromAssessment } from '@/lib/finops-aggregator';

export const POST = withAuth(async (req: Request) => {
  try {
    const { useCaseId, force } = await req.json();

    if (!useCaseId) {
      return NextResponse.json({ error: 'useCaseId is required' }, { status: 400 });
    }

    const result = await syncFinOpsFromAssessment(useCaseId, { force: !!force });

    if (result === null) {
      return NextResponse.json(
        { skipped: true, reason: 'Existing record has source="manual". Use force=true to override.' },
        { status: 200 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('FinOps aggregation error:', error);
    return NextResponse.json({ error: 'Aggregation failed' }, { status: 500 });
  }
}, { requireUser: true });
