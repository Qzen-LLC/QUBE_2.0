import { useState, useEffect, useCallback } from 'react';

export interface LockInfo {
  hasExclusiveLock: boolean;
  exclusiveLockDetails?: {
    type: string;
    acquiredBy: string;
    acquiredAt: string;
    expiresAt: string;
  };
  canEdit?: boolean;
  message?: string;
  error?: string;
}

export interface UseLockReturn {
  lockInfo: LockInfo | null;
  isLocked: boolean;
  isExclusiveLocked: boolean;
  isSharedLocked: boolean;
  acquireExclusiveLock: () => Promise<boolean>;
  releaseLock: (lockType: 'SHARED' | 'EXCLUSIVE') => Promise<void>;
  refreshLockStatus: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useLock = (useCaseId: string, scope: 'ASSESS' | 'EDIT' = 'ASSESS'): UseLockReturn => {
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = lockInfo?.hasExclusiveLock || false;
  const isExclusiveLocked = lockInfo?.hasExclusiveLock || false;
  const isSharedLocked = false; // No more shared locks in this implementation

  const refreshLockStatus = useCallback(async () => {
    if (!useCaseId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔒 [useLock] Checking lock status (not acquiring)...');
      const response = await fetch(`/api/get-usecase-details?useCaseId=${useCaseId}&acquireSharedLock=true&scope=${scope}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lock status');
      }
      const data = await response.json();
      console.log('🔒 [useLock] Lock status check result:', data.lockInfo);
      setLockInfo((prev) => {
        const incoming: LockInfo | null = data.lockInfo || null;
        if (!incoming) return null;
        // Use the API's canEdit value directly - don't preserve previous state
        return { ...incoming, canEdit: incoming.canEdit ?? false };
      });
    } catch (err) {
      console.error('Error refreshing lock status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh lock status');
    } finally {
      setLoading(false);
    }
  }, [useCaseId]);

  const acquireExclusiveLock = useCallback(async (): Promise<boolean> => {
    if (!useCaseId) return false;
    if (lockInfo?.hasExclusiveLock && lockInfo?.canEdit) {
      console.log('🔒 [useLock] Already have exclusive lock with edit access, skipping acquisition');
      return true;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('🔒 [useLock] ACTUALLY acquiring exclusive lock...');
      const response = await fetch('/api/locks/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, lockType: 'EXCLUSIVE', scope })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setLockInfo({ hasExclusiveLock: true, exclusiveLockDetails: data.lockDetails, canEdit: false });
          return false;
        }
        throw new Error(data.error || 'Failed to acquire exclusive lock');
      }
      setLockInfo({ hasExclusiveLock: true, canEdit: true });
      return true;
    } catch (err) {
      console.error('Error acquiring exclusive lock:', err);
      setError(err instanceof Error ? err.message : 'Failed to acquire exclusive lock');
      return false;
    } finally {
      setLoading(false);
    }
  }, [useCaseId, lockInfo?.hasExclusiveLock, scope]);

  const releaseLock = useCallback(async (lockType: 'SHARED' | 'EXCLUSIVE'): Promise<void> => {
    if (!useCaseId) return;
    console.log('🔒 [useLock] releaseLock called with:', { useCaseId, lockType, scope });
    try {
      setLoading(true);
      setError(null);
      console.log('🔒 [useLock] Making API call to release lock...');
      const response = await fetch('/api/locks/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, lockType, scope })
      });
      console.log('🔒 [useLock] API response status:', response.status);
      if (!response.ok) {
        const data = await response.json();
        console.error('🔒 [useLock] API error:', data);
        throw new Error(data.error || 'Failed to release lock');
      }
      const result = await response.json();
      console.log('🔒 [useLock] Lock release successful:', result);
      // Update local state immediately instead of refreshing
      setLockInfo(prev => prev ? { ...prev, hasExclusiveLock: false, canEdit: false } : null);
      // Don't refresh immediately to avoid race conditions
    } catch (err) {
      console.error('🔒 [useLock] Error releasing lock:', err);
      setError(err instanceof Error ? err.message : 'Failed to release lock');
    } finally {
      setLoading(false);
    }
  }, [useCaseId, refreshLockStatus, scope]);

  useEffect(() => {
    if (useCaseId) {
      refreshLockStatus();
    }
  }, [useCaseId, refreshLockStatus]);

  useEffect(() => {
    if (!useCaseId) return;
    const interval = setInterval(() => { refreshLockStatus(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [useCaseId, refreshLockStatus]);

  useEffect(() => {
    if (!useCaseId || !lockInfo?.hasExclusiveLock) return;
    console.log('🔒 [useLock] Setting up auto-release timer for 30 minutes');
    const timeout = setTimeout(async () => {
      console.log('🔒 [useLock] Auto-release timer fired, releasing lock...');
      try {
        const response = await fetch('/api/locks/release', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useCaseId, lockType: 'EXCLUSIVE', scope }),
        });
        console.log('🔒 [useLock] Auto-release response status:', response.status);
        if (response.ok) {
          const result = await response.json();
          console.log('🔒 [useLock] Auto-release successful:', result);
        }
        setLockInfo(prev => prev ? { ...prev, hasExclusiveLock: false } : null);
      } catch (error) {
        console.error('🔒 [useLock] Failed to auto-release lock:', error);
      }
    }, 30 * 60 * 1000);
    return () => {
      console.log('🔒 [useLock] Clearing auto-release timer');
      clearTimeout(timeout);
    };
  }, [useCaseId, lockInfo?.hasExclusiveLock, scope]);

  useEffect(() => {
    if (!useCaseId) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (lockInfo?.hasExclusiveLock) {
        console.log('🔒 [useLock] Beforeunload triggered, releasing lock...');
        // Send beacon to release lock
        const data = new FormData();
        data.append('useCaseId', useCaseId);
        data.append('lockType', 'EXCLUSIVE');
        data.append('scope', scope);
        navigator.sendBeacon('/api/locks/release', data);
        
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    // No lock release on visibility/pagehide to avoid releasing on tab switch

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Send beacon on cleanup
      if (lockInfo?.hasExclusiveLock) {
        console.log('🔒 [useLock] Component cleanup, sending beacon for lock release...');
        const data = new FormData();
        data.append('useCaseId', useCaseId);
        data.append('lockType', 'EXCLUSIVE');
        data.append('scope', scope);
        try { 
          navigator.sendBeacon('/api/locks/release', data);
          console.log('🔒 [useLock] Beacon sent successfully');
        } catch (error) {
          console.error('🔒 [useLock] Failed to send beacon for lock release:', error);
        }
      }
    };
  }, [useCaseId, lockInfo?.hasExclusiveLock, scope]);

  return { lockInfo, isLocked, isExclusiveLocked, isSharedLocked, acquireExclusiveLock, releaseLock, refreshLockStatus, loading, error };
}
