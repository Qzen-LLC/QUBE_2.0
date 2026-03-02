'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ThreatModelingPanel } from '@/components/threat-modeling/ThreatModelingPanel';

export default function ThreatModelingPage() {
  const params = useParams();
  const useCaseId = params?.useCaseId as string;

  if (!useCaseId) {
    return <div className="p-8 text-muted-foreground">No use case selected.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ThreatModelingPanel useCaseId={useCaseId} />
    </div>
  );
}
