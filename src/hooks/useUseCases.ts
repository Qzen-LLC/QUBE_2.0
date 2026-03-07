import { useState, useEffect } from 'react';
import { useAuthClient } from './useAuthClient';

// Base UseCase type from the API
export interface UseCase {
  id: string;
  title: string;
  aiucId?: string;
  problemStatement?: string;
  proposedAISolution?: string;
  stage?: string;
  priority?: string;
  primaryStakeholders?: string[];
  secondaryStakeholders?: string[];
  successCriteria?: string;
  problemValidation?: string;
  solutionHypothesis?: string;
  keyAssumptions?: string;
  initialROI?: number;
  confidenceLevel?: number;
  operationalImpactScore?: number;
  productivityImpactScore?: number;
  revenueImpactScore?: number;
  implementationComplexity?: number;
  estimatedTimeline?: string;
  requiredResources?: string[];
  createdAt?: string;
  updatedAt?: string;
  businessFunction?: string;
  userId?: string | null;
  aiType?: string | null;
  executiveSponsor?: string | null;
  regulatoryFrameworks?: string[];
  industryStandards?: string[];
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  organization?: {
    name: string;
  };
}

// Mapped UseCase type with frontend-specific fields
export interface MappedUseCase extends UseCase {
  stage: string;
  priority: string;
  owner: string;
  lastUpdated: string;
  description: string;
  scores: {
    operational: number;
    productivity: number;
    revenue: number;
  };
  complexity: number;
  roi: number;
  timeline: string;
  stakeholders: string[];
  risks: string[];
  creator: {
    name: string;
    type: 'user' | 'organization';
  };
}

// Hook return types
interface UseUseCasesReturn {
  data: MappedUseCase[];
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
  updateUseCase: (useCaseId: string, updates: Partial<MappedUseCase>) => void;
}

interface UseUpdateUseCaseStageReturn {
  mutateAsync: (params: { useCaseId: string; newStage: string }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

interface UseDeleteUseCaseReturn {
  mutateAsync: (useCaseId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// Main hook for fetching use cases
export function useUseCases(): UseUseCasesReturn {
  const [data, setData] = useState<MappedUseCase[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn } = useAuthClient();

  const fetchUseCases = async () => {
    // Don't fetch if user is not signed in
    if (!isSignedIn) {
      setIsLoading(false);
      setData([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/read-usecases`);
      
      // If unauthorized, user is likely signing out - don't throw error
      if (response.status === 401) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const useCases = await response.json();
      
      // Map the data to include frontend-specific fields
      const arr = Array.isArray(useCases)
        ? useCases
        : Array.isArray(useCases.useCases)
          ? useCases.useCases
          : [];
      const mappedUseCases: MappedUseCase[] = arr.map((uc: UseCase) => {
        // Determine creator information
        let creatorName = 'Unknown';
        let creatorType: 'user' | 'organization' = 'user';
        
        if (uc.user) {
          const firstName = uc.user.firstName || '';
          const lastName = uc.user.lastName || '';
          creatorName = `${firstName} ${lastName}`.trim() || uc.user.email;
          creatorType = 'user';
        } else if (uc.organization) {
          creatorName = uc.organization.name;
          creatorType = 'organization';
        }

        return {
          ...uc,
          stage: uc.stage || 'discovery',
          priority: uc.priority || 'medium',
          owner: uc.primaryStakeholders?.[0] || creatorName || 'Unknown',
          lastUpdated: uc.updatedAt
            ? new Date(uc.updatedAt).toLocaleDateString()
            : '',
          description: uc.problemStatement || '',
          scores: {
            operational: uc.operationalImpactScore || 0,
            productivity: uc.productivityImpactScore || 0,
            revenue: uc.revenueImpactScore || 0,
          },
          complexity: uc.implementationComplexity || 0,
          roi: parseFloat(uc.initialROI as any) || 0,
          timeline: uc.estimatedTimeline || '',
          stakeholders: uc.primaryStakeholders || [],
          risks: uc.keyAssumptions || [],
          creator: {
            name: creatorName,
            type: creatorType,
          },
        };
      });
      
      setData(mappedUseCases);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch use cases'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUseCases();
  }, [isSignedIn]);

  const refetch = () => {
    fetchUseCases();
  };

  // Function to update a specific use case immediately
  const updateUseCase = (useCaseId: string, updates: Partial<MappedUseCase>) => {
    setData(prevData => 
      prevData.map(uc => 
        uc.id === useCaseId ? { ...uc, ...updates } : uc
      )
    );
  };

  return {
    data,
    error,
    isLoading,
    refetch,
    updateUseCase
  };
}

// Hook for updating use case stage
export function useUpdateUseCaseStage(): UseUpdateUseCaseStageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = async ({ useCaseId, newStage }: { useCaseId: string; newStage: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/update-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useCaseId, newStage }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update use case stage'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading,
    error
  };
}

// Hook for deleting use cases
export function useDeleteUseCase(): UseDeleteUseCaseReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = async (useCaseId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/delete-usecase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useCaseId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete use case'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading,
    error
  };
} 