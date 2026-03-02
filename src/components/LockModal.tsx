'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Edit, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LockInfo {
  hasExclusiveLock: boolean;
  exclusiveLockDetails?: {
    type: string;
    acquiredBy: string;
    acquiredAt: string;
    expiresAt: string;
  };
  canEdit?: boolean;
  message?: string;
}

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockInfo: LockInfo | null;
  onAcquireExclusiveLock: () => Promise<boolean>;
  onProceedToAssessment: () => void;
  onViewLockedUseCase: () => void;
  loading: boolean;
  error: string | null;
}

export const LockModal: React.FC<LockModalProps> = ({
  isOpen,
  onClose,
  lockInfo,
  onAcquireExclusiveLock,
  onProceedToAssessment,
  onViewLockedUseCase,
  loading,
  error
}) => {
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);

  const handleAcquireLock = async () => {
    setIsAcquiringLock(true);
    try {
      const success = await onAcquireExclusiveLock();
      if (success) {
        onProceedToAssessment();
      }
    } finally {
      setIsAcquiringLock(false);
    }
  };

  if (!isOpen) return null;

  // If assessment is locked, show simplified dialog
  if (lockInfo?.hasExclusiveLock) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              Assessment in Progress
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Being edited by {lockInfo.exclusiveLockDetails?.acquiredBy || 'another user'}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={onViewLockedUseCase}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Read-Only
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If assessment is available or lockInfo is not yet loaded, show the original interface
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-600" />
            Ready to Assess
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 p-4 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  You can start editing now
                </span>
              </div>
              
              <div className="text-xs text-green-600 dark:text-green-400">
                No other users are currently editing this assessment
              </div>
            </div>
          </div>

          {error && (
            <div className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading || isAcquiringLock}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleAcquireLock}
              disabled={loading || isAcquiringLock}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isAcquiringLock ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Acquiring Lock...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Start Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LockModal;
