'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ExpansionReview } from '@/components/assessment/ExpansionReview';

export default function ExpansionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const useCaseId = params?.useCaseId as string;

  if (!useCaseId) {
    return <div className="p-8 text-muted-foreground">No use case selected.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/${useCaseId}/assess`)}
          className="text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment
        </Button>
      </div>
      <ExpansionReview useCaseId={useCaseId} />
    </div>
  );
}
