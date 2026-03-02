import { useState, useEffect } from 'react';

interface ExecutiveMetrics {
  portfolio: {
    totalUseCases: number;
    stageDistribution: Record<string, number>;
    businessFunctionDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    impactScores: {
      operational: { average: number; total: number };
      productivity: { average: number; total: number };
      revenue: { average: number; total: number };
    };
    overallScore: number;
    complexityAnalysis: { average: number; distribution: Record<string, number> };
    confidenceAnalysis: { average: number; distribution: Record<string, number> };
  };
  financial: {
    totalInvestment: number;
    totalROI: number;
    averageROI: number;
    projectedValue: number;
    netValue: number;
    costBreakdown: {
      development: number;
      infrastructure: number;
      operations: number;
      api: number;
    };
    investmentByFunction: Record<string, number>;
  };
  risk: {
    totalAssessed: number;
    riskDistribution: Record<string, number>;
    riskCategories: {
      technical: Record<string, number>;
      business: Record<string, number>;
      data: Record<string, number>;
      ethical: Record<string, number>;
    };
    approvalStatus: {
      totalWithApprovals: number;
      governance: { approved: number; pending: number; rejected: number };
      risk: { approved: number; pending: number; rejected: number };
      legal: { approved: number; pending: number; rejected: number };
      business: { approved: number; pending: number; rejected: number };
    };
  };
  strategic: {
    businessFunctionPerformance: Array<{
      function: string;
      count: number;
      avgOperationalScore: number;
      avgProductivityScore: number;
      avgRevenueScore: number;
      totalInvestment: number;
      averageROI: number;
    }>;
    portfolioBalance: {
      highImpactLowComplexity: number;
      quickWins: number;
    };
  };
}

interface UseExecutiveMetricsReturn {
  data: ExecutiveMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useExecutiveMetrics(): UseExecutiveMetricsReturn {
  const [data, setData] = useState<ExecutiveMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/executive-metrics');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const metrics = await response.json();
      setData(metrics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch executive metrics'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const refetch = () => {
    fetchMetrics();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
} 