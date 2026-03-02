import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface UseLockedRouterProps {
  useCaseId: string;
  isExclusiveLocked: boolean;
  releaseLock: () => void;
}

export function useLockedRouter({ useCaseId, isExclusiveLocked, releaseLock }: UseLockedRouterProps) {
  const router = useRouter();

  const releaseLockAndNavigate = useCallback((navigationFn: () => void) => {
    if (isExclusiveLocked) {
      console.log('[LOCKED_ROUTER] Releasing lock before navigation...');
      try {
        // Try beacon first
        const data = new FormData();
        data.append('useCaseId', useCaseId);
        data.append('lockType', 'EXCLUSIVE');
        data.append('scope', 'ASSESS');
        const beaconResult = navigator.sendBeacon('/api/locks/release', data);
        console.log('[LOCKED_ROUTER] Beacon result:', beaconResult);
        
        // If beacon fails, try synchronous request
        if (!beaconResult) {
          console.log('[LOCKED_ROUTER] Beacon failed, trying synchronous request...');
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/locks/release', false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({ useCaseId, lockType: 'EXCLUSIVE', scope: 'ASSESS' }));
          console.log('[LOCKED_ROUTER] Synchronous request status:', xhr.status);
        }
      } catch (error) {
        console.error('[LOCKED_ROUTER] Error releasing lock:', error);
      }
    }
    
    // Call the original navigation function
    navigationFn();
  }, [useCaseId, isExclusiveLocked]);

  const push = useCallback((href: string, options?: any) => {
    releaseLockAndNavigate(() => router.push(href, options));
  }, [router, releaseLockAndNavigate]);

  const replace = useCallback((href: string, options?: any) => {
    releaseLockAndNavigate(() => router.replace(href, options));
  }, [router, releaseLockAndNavigate]);

  const back = useCallback(() => {
    releaseLockAndNavigate(() => router.back());
  }, [router, releaseLockAndNavigate]);

  const forward = useCallback(() => {
    releaseLockAndNavigate(() => router.forward());
  }, [router, releaseLockAndNavigate]);

  return {
    push,
    replace,
    back,
    forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  };
}
