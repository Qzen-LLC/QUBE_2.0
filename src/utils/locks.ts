import { prismaClient } from '@/utils/db';

type GovernanceScope =
  | 'GOVERNANCE_EU_AI_ACT'
  | 'GOVERNANCE_ISO_42001'
  | 'GOVERNANCE_UAE_AI'
  | 'GOVERNANCE_ISO_27001';

interface LockCheckOptions {
  useCaseId: string;
  userId: string;
  scope: GovernanceScope;
}

export async function hasActiveExclusiveGovernanceLock({
  useCaseId,
  userId,
  scope,
}: LockCheckOptions): Promise<boolean> {
  const lock = await prismaClient.lock.findFirst({
    where: {
      useCaseId,
      userId,
      scope,
      type: 'EXCLUSIVE',
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(lock);
}


