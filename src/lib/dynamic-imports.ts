import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import heavy components
export const DynamicTechnicalFeasibility = dynamic(
  () => import('@/components/TechnicalFeasibility'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicBusinessFeasibility = dynamic(
  () => import('@/components/BusinessFeasibility'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicEthicalImpact = dynamic(
  () => import('@/components/EthicalImpact'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicRiskAssessment = dynamic(
  () => import('@/components/RiskAssessment'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicDataReadiness = dynamic(
  () => import('@/components/DataReadiness'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicRoadmapPosition = dynamic(
  () => import('@/components/RoadmapPosition'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicBudgetPlanning = dynamic(
  () => import('@/components/BudgetPlanning'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

export const DynamicApprovalsPage = dynamic(
  () => import('@/components/ApprovalsPage'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
);

// Chart components
export const DynamicChart = dynamic(
  () => import('@/components/ui/lazy-chart'),
  {
    loading: () => React.createElement('div', { className: "animate-pulse bg-gray-200 h-96 rounded-lg" }),
    ssr: false,
  }
); 