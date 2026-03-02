'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UseCaseDashboard() {
  const params = useParams();
  const router = useRouter();
  const useCaseId = params.useCaseId as string;

  useEffect(() => {
    if (useCaseId) {
      router.replace(`/dashboard/${useCaseId}/assess`);
    }
  }, [useCaseId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to assessment...</p>
      </div>
    </div>
  );
} 