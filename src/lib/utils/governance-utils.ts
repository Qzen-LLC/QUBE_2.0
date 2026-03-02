/**
 * Utility functions extracted from Governance Dashboard
 * These functions handle progress calculation, date formatting, and framework detection
 */

export interface AssessmentProgress {
  id?: string | null;
  status?: string;
  progress?: number | null;
  updatedAt?: string | null;
  maturityLevel?: string | null;
  weightedScore?: number;
}

export interface UseCase {
  useCaseId: string;
  regulatoryFrameworks: string[];
  industryStandards: string[];
  [key: string]: any;
}

/**
 * Safely extracts progress value from AssessmentProgress object
 * Returns 0 if progress is invalid, null, or undefined
 */
export function getSafeProgress(p?: AssessmentProgress): number {
  return typeof p?.progress === 'number' && !Number.isNaN(p.progress) ? p.progress : 0;
}

/**
 * Formats a date string to a readable format
 * Returns the original string if parsing fails
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Check if date is valid (Invalid Date objects have NaN as time value)
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats time remaining until expiration
 * Returns null if expiresAt is null, undefined, or invalid
 * Returns formatted string like "2h 30m", "45m 30s", or "30s"
 */
export function formatTimeRemaining(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return null;
  if (diffMs <= 0) return 'less than a minute';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  return `${seconds}s`;
}

/**
 * Framework detection result interface
 */
export interface FrameworkDetectionResult {
  hasEuAiAct: boolean;
  hasIso42001: boolean;
  hasUaeAi: boolean;
  hasIso27001: boolean;
}

/**
 * Detects which frameworks are enabled for a use case
 * Based on regulatoryFrameworks and industryStandards arrays
 */
export function detectEnabledFrameworks(useCase: UseCase): FrameworkDetectionResult {
  const hasEuAiAct = useCase.regulatoryFrameworks.includes('EU AI Act');
  const hasIso42001 = useCase.industryStandards.some(s => s.includes('ISO/IEC 42001'));
  const hasUaeAi = useCase.regulatoryFrameworks.includes('UAE AI/GenAI Controls');
  const hasIso27001 = useCase.industryStandards.some(s => s.includes('ISO 27001'));

  return {
    hasEuAiAct,
    hasIso42001,
    hasUaeAi,
    hasIso27001,
  };
}

