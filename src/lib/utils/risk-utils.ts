/**
 * Risk Management utility functions
 * 
 * Provides utilities for:
 * - Risk aggregation and counting
 * - Severity normalization
 * - Likelihood normalization
 */

/**
 * Risk interface matching the Risk Management page structure
 */
export interface Risk {
  id: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  likelihood?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';
  riskScore: number;
  description: string;
  mitigationStrategy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * UseCase interface with risks
 */
export interface UseCase {
  id: string;
  risks: Risk[];
}

/**
 * Normalizes likelihood values to standard format
 * Handles case variations: 'high', 'High', 'HIGH' -> 'High'
 * 
 * @param likelihood - The likelihood value to normalize
 * @returns Normalized likelihood ('High', 'Medium', 'Low') or null if invalid
 */
export function normalizeLikelihood(likelihood: string | undefined | null): string | null {
  if (!likelihood) return null;
  const normalized = likelihood.trim();
  const lower = normalized.toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  if (lower === 'low') return 'Low';
  return normalized; // Return as-is if doesn't match
}

/**
 * Normalizes severity/risk level values to standard format
 * Handles case variations: 'critical', 'Critical', 'CRITICAL' -> 'Critical'
 * 
 * @param severity - The severity/risk level value to normalize
 * @returns Normalized severity ('Critical', 'High', 'Medium', 'Low') or null if invalid
 */
export function normalizeSeverity(severity: string | undefined | null): string | null {
  if (!severity) return null;
  const normalized = severity.trim();
  const lower = normalized.toLowerCase();
  if (lower === 'critical') return 'Critical';
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  if (lower === 'low') return 'Low';
  return normalized; // Return as-is if doesn't match
}

/**
 * Calculates the total number of risks across all use cases
 * 
 * @param useCases - Array of use cases with risks
 * @returns Total count of all risks
 */
export function calculateTotalRisks(useCases: UseCase[]): number {
  return useCases.reduce((sum, uc) => sum + uc.risks.length, 0);
}

/**
 * Calculates the number of open risks across all use cases
 * 
 * @param useCases - Array of use cases with risks
 * @returns Count of risks with status 'OPEN'
 */
export function calculateOpenRisks(useCases: UseCase[]): number {
  return useCases.reduce((sum, uc) => 
    sum + uc.risks.filter(r => r.status === 'OPEN').length, 0
  );
}

/**
 * Calculates the number of risks with critical severity
 * Only counts risks that have both severity and likelihood defined
 * 
 * @param useCases - Array of use cases with risks
 * @returns Count of risks with riskLevel 'critical'
 */
export function calculateCriticalSeverityCount(useCases: UseCase[]): number {
  return useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      return r.riskLevel.trim().toLowerCase() === 'critical';
    }).length;
  }, 0);
}

/**
 * Calculates the number of risks with high severity
 * Only counts risks that have both severity and likelihood defined
 * 
 * @param useCases - Array of use cases with risks
 * @returns Count of risks with riskLevel 'high'
 */
export function calculateHighSeverityCount(useCases: UseCase[]): number {
  return useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      return r.riskLevel.trim().toLowerCase() === 'high';
    }).length;
  }, 0);
}

/**
 * Calculates the number of risks with high likelihood
 * Only counts risks that have both severity and likelihood defined
 * 
 * @param useCases - Array of use cases with risks
 * @returns Count of risks with likelihood 'high'
 */
export function calculateHighLikelihoodCount(useCases: UseCase[]): number {
  return useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      return r.likelihood.toLowerCase().trim() === 'high';
    }).length;
  }, 0);
}

/**
 * Calculates the number of risks with critical or high severity AND high likelihood
 * Only counts risks that have both severity and likelihood defined
 * 
 * @param useCases - Array of use cases with risks
 * @returns Count of risks with (critical or high) severity and high likelihood
 */
export function calculateCriticalHighLikelihoodCount(useCases: UseCase[]): number {
  return useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      const severity = r.riskLevel.trim().toLowerCase();
      const likelihood = r.likelihood.toLowerCase().trim();
      return (severity === 'critical' || severity === 'high') && likelihood === 'high';
    }).length;
  }, 0);
}


