import React from 'react';
import { Lock, Unlock, Edit, Eye, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LockInfo } from '@/hooks/useLock';

interface LockIndicatorProps {
  lockInfo: LockInfo | null;
  isExclusiveLocked: boolean;
  isSharedLocked: boolean;
  onAcquireExclusiveLock: () => Promise<boolean>;
  onReleaseLock: (lockType: 'SHARED' | 'EXCLUSIVE') => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const LockIndicator: React.FC<LockIndicatorProps> = ({
  lockInfo,
  isExclusiveLocked,
  isSharedLocked,
  onAcquireExclusiveLock,
  onReleaseLock,
  loading,
  error
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!lockInfo) {
    return null;
  }

  if (isExclusiveLocked) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300">
                    <Edit className="h-3 w-3 mr-1" />
                    Exclusive Lock
                  </Badge>
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    Currently being edited by {lockInfo.exclusiveLockDetails?.acquiredBy}
                  </span>
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Locked since {formatTime(lockInfo.exclusiveLockDetails?.acquiredAt || '')} on {formatDate(lockInfo.exclusiveLockDetails?.acquiredAt || '')}
                </div>
              </div>
            </div>
                         <div className="text-right">
               <div className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                 Expires at {formatTime(lockInfo.exclusiveLockDetails?.expiresAt || '')}
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => onReleaseLock('EXCLUSIVE')}
                 disabled={loading}
                 className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
               >
                 <Unlock className="h-3 w-3 mr-1" />
                 Release Lock
               </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSharedLocked) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
                    <Eye className="h-3 w-3 mr-1" />
                    View Mode
                  </Badge>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Read-only access
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Shared lock active
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReleaseLock('SHARED')}
                disabled={loading}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
              >
                <Unlock className="h-3 w-3 mr-1" />
                Release Lock
              </Button>
              <Button
                size="sm"
                onClick={onAcquireExclusiveLock}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No locks - can edit
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300">
                  <Edit className="h-3 w-3 mr-1" />
                  Available for Editing
                </Badge>
                <span className="text-sm text-green-700 dark:text-green-300">
                  No exclusive locks active
                </span>
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Multiple users can view, but only one can edit
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onAcquireExclusiveLock}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Edit className="h-3 w-3 mr-1" />
            Start Editing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LockIndicator;
