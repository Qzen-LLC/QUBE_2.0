import { useState, useEffect, useCallback } from 'react';

export type GovernanceFramework = 'GOVERNANCE_EU_AI_ACT' | 'GOVERNANCE_ISO_42001' | 'GOVERNANCE_UAE_AI' | 'GOVERNANCE_ISO_27001';

export interface GovernanceLockInfo {
  hasLock: boolean;
  canEdit: boolean;
  lockDetails?: {
    scope: GovernanceFramework;
    acquiredBy: string;
    acquiredAt: string;
    expiresAt: string;
    isOwnedByCurrentUser: boolean;
  };
  error?: string;
}

export interface UseGovernanceLockReturn {
  lockInfo: GovernanceLockInfo | null;
  isLocked: boolean;
  canEdit: boolean;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
  refreshLockStatus: () => Promise<void>;
  markLockForNavigation: () => void;
  loading: boolean;
  error: string | null;
}

export const useGovernanceLock = (
  useCaseId: string, 
  framework: GovernanceFramework
): UseGovernanceLockReturn => {
  const [lockInfo, setLockInfo] = useState<GovernanceLockInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRetentionKey = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return `retain-governance-lock:${framework}:${useCaseId}`;
  }, [framework, useCaseId]);

  const markLockForNavigation = useCallback(() => {
    const key = getRetentionKey();
    if (!key) return;
    try {
      window.sessionStorage.setItem(key, 'true');
    } catch (err) {
      console.warn('Failed to set lock retention flag', err);
    }
  }, [getRetentionKey]);

  const consumeRetentionFlag = useCallback(() => {
    const key = getRetentionKey();
    if (!key) return false;
    try {
      const shouldRetain = window.sessionStorage.getItem(key) === 'true';
      if (shouldRetain) {
        window.sessionStorage.removeItem(key);
      }
      return shouldRetain;
    } catch (err) {
      console.warn('Failed to read lock retention flag', err);
      return false;
    }
  }, [getRetentionKey]);

  const isLocked = lockInfo?.hasLock || false;
  const canEdit = lockInfo?.canEdit || false;

  const refreshLockStatus = useCallback(async () => {
    if (!useCaseId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Check for existing locks on this specific framework
      const response = await fetch(`/api/locks/status?useCaseId=${useCaseId}&scope=${framework}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lock status');
      }
      
      const data = await response.json();
      setLockInfo(data.lockInfo || null);
    } catch (err) {
      console.error('Error refreshing lock status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh lock status');
    } finally {
      setLoading(false);
    }
  }, [useCaseId, framework]);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!useCaseId) return false;
    
    if (lockInfo?.hasLock && lockInfo?.canEdit) {
      console.log('Already have lock, skipping acquisition');
      return true;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/locks/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          useCaseId, 
          lockType: 'EXCLUSIVE', 
          scope: framework 
        }),
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // Lock is held by another user
          setLockInfo({
            hasLock: true,
            canEdit: false,
            lockDetails: {
              scope: framework,
              acquiredBy: data.lockDetails.acquiredBy,
              acquiredAt: data.lockDetails.acquiredAt,
              expiresAt: data.lockDetails.expiresAt,
              isOwnedByCurrentUser: false
            }
          });
          return false;
        }
        throw new Error(data.error || 'Failed to acquire lock');
      }
      
      // Lock acquired successfully
      setLockInfo({
        hasLock: true,
        canEdit: true,
        lockDetails: {
          scope: framework,
          acquiredBy: 'You',
          acquiredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          isOwnedByCurrentUser: true
        }
      });
      
      return true;
    } catch (err) {
      console.error('Error acquiring lock:', err);
      setError(err instanceof Error ? err.message : 'Failed to acquire lock');
      return false;
    } finally {
      setLoading(false);
    }
  }, [useCaseId, framework, lockInfo]);

  const releaseLock = useCallback(async (): Promise<void> => {
    if (!useCaseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/locks/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          useCaseId, 
          lockType: 'EXCLUSIVE', 
          scope: framework 
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to release lock');
      }
      
      // Lock released successfully
      setLockInfo({
        hasLock: false,
        canEdit: false
      });
    } catch (err) {
      console.error('Error releasing lock:', err);
      setError(err instanceof Error ? err.message : 'Failed to release lock');
    } finally {
      setLoading(false);
    }
  }, [useCaseId, framework]);

  // Initial load
  useEffect(() => {
    if (useCaseId) {
      refreshLockStatus();
    }
  }, [useCaseId, refreshLockStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!useCaseId) return;
    
    const interval = setInterval(() => {
      refreshLockStatus();
    }, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [useCaseId, refreshLockStatus]);

  // Auto-release lock after 30 minutes
  useEffect(() => {
    if (!useCaseId || !lockInfo?.hasLock || !lockInfo?.canEdit) return;
    
    const timeout = setTimeout(async () => {
      try {
        await releaseLock();
      } catch (error) {
        console.error('Failed to auto-release lock:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearTimeout(timeout);
  }, [useCaseId, lockInfo?.hasLock, lockInfo?.canEdit, releaseLock]);

  // Handle browser close/refresh; release on unmount for in-app navigation. No visibility/pagehide.
  useEffect(() => {
    if (!useCaseId || !lockInfo?.hasLock || !lockInfo?.canEdit) return;

    const handleBeforeUnload = () => {
      const data = new FormData();
      data.append('useCaseId', useCaseId);
      data.append('lockType', 'EXCLUSIVE');
      data.append('scope', framework);
      try { navigator.sendBeacon('/api/locks/release', data); } catch (_) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const shouldRetainLock = consumeRetentionFlag();
      if (shouldRetainLock) {
        return;
      }
      // Release on unmount to handle in-app navigation
      const data = new FormData();
      data.append('useCaseId', useCaseId);
      data.append('lockType', 'EXCLUSIVE');
      data.append('scope', framework);
      try { navigator.sendBeacon('/api/locks/release', data); } catch (_) {}
    };
  }, [useCaseId, framework, lockInfo?.hasLock, lockInfo?.canEdit, consumeRetentionFlag]);

  return {
    lockInfo,
    isLocked,
    canEdit,
    acquireLock,
    releaseLock,
    refreshLockStatus,
    markLockForNavigation,
    loading,
    error
  };
};

