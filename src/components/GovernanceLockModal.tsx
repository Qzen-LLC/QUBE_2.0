import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, User, Clock, AlertTriangle } from 'lucide-react';
import { GovernanceLockInfo, GovernanceFramework } from '@/hooks/useGovernanceLock';

interface GovernanceLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockInfo: GovernanceLockInfo | null;
  framework: GovernanceFramework;
  useCaseId: string;
  useCaseName: string;
  onAcquireLock: () => Promise<boolean>;
  onReleaseLock: () => Promise<void>;
  loading: boolean;
}

const getFrameworkDisplayName = (framework: GovernanceFramework): string => {
  switch (framework) {
    case 'GOVERNANCE_EU_AI_ACT':
      return 'EU AI Act Assessment';
    case 'GOVERNANCE_ISO_42001':
      return 'ISO 42001 Assessment';
    case 'GOVERNANCE_UAE_AI':
      return 'UAE AI Assessment';
    default:
      return 'Assessment';
  }
};

const getFrameworkColor = (framework: GovernanceFramework): string => {
  switch (framework) {
    case 'GOVERNANCE_EU_AI_ACT':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    case 'GOVERNANCE_ISO_42001':
      return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700';
    case 'GOVERNANCE_UAE_AI':
      return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
    default:
      return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
  }
};

export const GovernanceLockModal: React.FC<GovernanceLockModalProps> = ({
  isOpen,
  onClose,
  lockInfo,
  framework,
  useCaseId,
  useCaseName,
  onAcquireLock,
  onReleaseLock,
  loading
}) => {
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [currentLockInfo, setCurrentLockInfo] = useState<GovernanceLockInfo | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Check lock status when modal opens
  useEffect(() => {
    if (isOpen && !lockInfo) {
      checkLockStatus();
    } else if (isOpen && lockInfo) {
      setCurrentLockInfo(lockInfo);
    }
  }, [isOpen, lockInfo]);

  const checkLockStatus = async () => {
    setIsCheckingStatus(true);
    try {
      console.log(`🔍 Checking lock status for useCaseId: ${useCaseId}, scope: ${framework}`);
      
      const response = await fetch(`/api/locks/status?useCaseId=${useCaseId}&scope=${framework}`);
      console.log(`🔍 Response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Lock status response:`, data);
        setCurrentLockInfo(data.lockInfo);
      } else {
        console.error('Failed to check lock status:', response.status);
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response');
        }
        
        // Set default state on error
        setCurrentLockInfo({
          hasLock: false,
          canEdit: true
        });
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Set default state on error
      setCurrentLockInfo({
        hasLock: false,
        canEdit: true
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleAcquireLock = async () => {
    setIsAcquiring(true);
    try {
      const success = await onAcquireLock();
      if (success) {
        onClose();
      }
    } finally {
      setIsAcquiring(false);
    }
  };

  const handleReleaseLock = async () => {
    console.log('🔒 Modal: handleReleaseLock called');
    setIsReleasing(true);
    try {
      console.log('🔒 Modal: Calling onReleaseLock...');
      await onReleaseLock();
      console.log('🔒 Modal: onReleaseLock completed successfully');
      onClose();
    } catch (error) {
      console.error('🔒 Modal: Error in handleReleaseLock:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const renderLockStatus = () => {
    console.log('🔒 Modal: Rendering lock status with:', {
      isCheckingStatus,
      currentLockInfo,
      lockInfo: lockInfo,
      isOwnedByCurrentUser: currentLockInfo?.lockDetails?.isOwnedByCurrentUser
    });

    if (isCheckingStatus) {
      return (
        <div className="text-center py-6">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Checking lock status...</p>
        </div>
      );
    }

    if (!currentLockInfo) {
      return (
        <div className="text-center py-6">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Unable to determine lock status</p>
        </div>
      );
    }

    if (!currentLockInfo.hasLock) {
      return (
        <div className="text-center py-6">
          <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3 w-fit mx-auto mb-3">
            <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Framework Available</h3>
          <p className="text-muted-foreground mb-4">
            No active locks found. You can start working on this framework assessment.
          </p>
          <Button 
            onClick={handleAcquireLock} 
            disabled={isAcquiring || loading}
            className="w-full"
          >
            {isAcquiring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Acquiring Lock...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Start Assessment
              </>
            )}
          </Button>
        </div>
      );
    }

    if (currentLockInfo.lockDetails?.isOwnedByCurrentUser) {
      console.log('🔒 Modal: User owns the lock, showing continue editing options');
      return (
        <div className="text-center py-6">
          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3 w-fit mx-auto mb-3">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">You Are Editing</h3>
          <p className="text-muted-foreground mb-4">
            You already have an active lock on this framework.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">Lock expires in:</span>
              <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600">
                {formatTimeRemaining(currentLockInfo.lockDetails.expiresAt)}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                console.log('🔒 Modal: Continue Editing button clicked');
                // Close modal and let user continue editing
                onClose();
              }} 
              variant="outline" 
              className="flex-1"
            >
              Continue Editing
            </Button>
            <Button 
              onClick={handleReleaseLock} 
              variant="destructive" 
              disabled={isReleasing}
              className="flex-1"
            >
              {isReleasing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Releasing...
                </>
              ) : (
                'Release Lock'
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Lock held by another user
    return (
      <div className="text-center py-6">
        <div className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-3 w-fit mx-auto mb-3">
          <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Framework in Use</h3>
        <p className="text-muted-foreground mb-4">
          This framework is currently being edited by another user.
        </p>
        
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-orange-700 dark:text-orange-300">Edited by:</span>
              <span className="font-medium text-orange-800 dark:text-orange-200">
                {currentLockInfo.lockDetails?.acquiredBy}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-700 dark:text-orange-300">Available in:</span>
              <Badge variant="outline" className="text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600">
                {formatTimeRemaining(currentLockInfo.lockDetails?.expiresAt || '')}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={checkLockStatus} 
            variant="outline" 
            className="flex-1"
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking...
              </>
            ) : (
              'Refresh Status'
            )}
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className={getFrameworkColor(framework)}>
              {getFrameworkDisplayName(framework)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Lock management for {useCaseName}
          </DialogDescription>
        </DialogHeader>
        
        {renderLockStatus()}
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3" />
              <span>Locks expire after 30 minutes of inactivity</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Only one user can edit a framework at a time</span>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
