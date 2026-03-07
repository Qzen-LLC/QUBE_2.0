'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const SidebarLayout = dynamic(() => import('@/components/ui/sidebar-layout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
});

// Routes that should NOT have the sidebar
const NO_SIDEBAR_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/onboarding',
  '/user-profile'
];

// Routes that should have the sidebar
const SIDEBAR_ROUTES = [
  '/dashboard',
  '/new-usecase',
  '/edit-usecase',
  '/view-usecase',
  '/dev',
  '/invite',
];

function ConditionalSidebarLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Public routes: render immediately, skip sidebar
  if (NO_SIDEBAR_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show sidebar for sidebar routes
  if (SIDEBAR_ROUTES.some(route => pathname.startsWith(route))) {
    return <SidebarLayout>{children}</SidebarLayout>;
  }

  // Default: don't show sidebar for unknown routes
  return <>{children}</>;
}

export default function ConditionalSidebarLayout({ children }: { children: React.ReactNode }) {
  return <ConditionalSidebarLayoutContent>{children}</ConditionalSidebarLayoutContent>;
}
