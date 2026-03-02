'use client';

import { useState } from 'react';

export interface DecisionRoutingRequest {
  decisionType: string;
  organizationId: string;
  requestedBy: string;
  riskLevel?: string;
  investmentAmount?: number;
  useCaseId?: string;
  metadata?: Record<string, any>;
}

export interface DecisionRoutingResult {
  approverRole: string;
  escalationRole?: string;
  requiresEscalation: boolean;
  escalationReason?: string;
  matchedRule?: any;
}

/**
 * Hook for decision routing functionality
 */
export function useDecisionRouting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Routes a decision and creates a decision record
   */
  const routeDecision = async (request: DecisionRoutingRequest): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/governance/route-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to route decision');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Previews routing without creating a decision record
   */
  const previewRouting = async (
    decisionType: string,
    organizationId: string,
    riskLevel?: string,
    investmentAmount?: number
  ): Promise<DecisionRoutingResult> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        decisionType,
        organizationId,
        ...(riskLevel && { riskLevel }),
        ...(investmentAmount !== undefined && { investmentAmount: investmentAmount.toString() }),
      });

      const response = await fetch(`/api/governance/route-decision?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preview routing');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    routeDecision,
    previewRouting,
    loading,
    error,
  };
}
