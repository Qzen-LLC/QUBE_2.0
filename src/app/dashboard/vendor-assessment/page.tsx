'use client';

import VendorAssessment from '@/components/VendorAssessment';
import { useUserData } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';
import { useStableRender } from '@/hooks/useStableRender';

export default function VendorAssessmentPage() {
  const { userData } = useUserData();
  const [mounted, setMounted] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  
  // Use global stable render hook
  const { isReady } = useStableRender();
  
  useEffect(() => {
    setMounted(true);
    // Wait a bit for user data to be loaded
    const timer = setTimeout(() => {
      setDataReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render until mounted, data is ready, and stable render is ready
  if (!mounted || !dataReady || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading Vendor Assessment...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VendorAssessment user={{ 
          id: userData?.id || 'user-1', 
          name: userData ? `${userData.firstName} ${userData.lastName}` : 'Current User' 
        }} />
      </div>
    </div>
  );
}