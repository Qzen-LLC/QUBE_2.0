/**
 * Unit tests for Risk Management utility functions
 * 
 * Tests validate:
 * - normalizeLikelihood: normalizes likelihood values correctly
 * - normalizeSeverity: normalizes severity values correctly
 * - calculateTotalRisks: calculates total risk count
 * - calculateOpenRisks: calculates open risk count
 * - calculateCriticalSeverityCount: calculates critical severity count
 * - calculateHighSeverityCount: calculates high severity count
 * - calculateHighLikelihoodCount: calculates high likelihood count
 * - calculateCriticalHighLikelihoodCount: calculates critical/high severity with high likelihood count
 */

import {
  normalizeLikelihood,
  normalizeSeverity,
  calculateTotalRisks,
  calculateOpenRisks,
  calculateCriticalSeverityCount,
  calculateHighSeverityCount,
  calculateHighLikelihoodCount,
  calculateCriticalHighLikelihoodCount,
  type Risk,
  type UseCase,
} from '@/lib/utils/risk-utils';

describe('Risk Management Utilities', () => {
  describe('normalizeLikelihood', () => {
    it('should normalize "high" to "High"', () => {
      expect(normalizeLikelihood('high')).toBe('High');
      expect(normalizeLikelihood('High')).toBe('High');
      expect(normalizeLikelihood('HIGH')).toBe('High');
    });

    it('should normalize "medium" to "Medium"', () => {
      expect(normalizeLikelihood('medium')).toBe('Medium');
      expect(normalizeLikelihood('Medium')).toBe('Medium');
      expect(normalizeLikelihood('MEDIUM')).toBe('Medium');
    });

    it('should normalize "low" to "Low"', () => {
      expect(normalizeLikelihood('low')).toBe('Low');
      expect(normalizeLikelihood('Low')).toBe('Low');
      expect(normalizeLikelihood('LOW')).toBe('Low');
    });

    it('should handle whitespace', () => {
      expect(normalizeLikelihood(' high ')).toBe('High');
      expect(normalizeLikelihood('  medium  ')).toBe('Medium');
      expect(normalizeLikelihood('\tlow\n')).toBe('Low');
    });

    it('should return null for undefined or null', () => {
      expect(normalizeLikelihood(undefined)).toBeNull();
      expect(normalizeLikelihood(null)).toBeNull();
      expect(normalizeLikelihood('')).toBeNull();
    });

    it('should return original value for unrecognized strings', () => {
      expect(normalizeLikelihood('unknown')).toBe('unknown');
      expect(normalizeLikelihood('very-high')).toBe('very-high');
    });
  });

  describe('normalizeSeverity', () => {
    it('should normalize "critical" to "Critical"', () => {
      expect(normalizeSeverity('critical')).toBe('Critical');
      expect(normalizeSeverity('Critical')).toBe('Critical');
      expect(normalizeSeverity('CRITICAL')).toBe('Critical');
    });

    it('should normalize "high" to "High"', () => {
      expect(normalizeSeverity('high')).toBe('High');
      expect(normalizeSeverity('High')).toBe('High');
      expect(normalizeSeverity('HIGH')).toBe('High');
    });

    it('should normalize "medium" to "Medium"', () => {
      expect(normalizeSeverity('medium')).toBe('Medium');
      expect(normalizeSeverity('Medium')).toBe('Medium');
      expect(normalizeSeverity('MEDIUM')).toBe('Medium');
    });

    it('should normalize "low" to "Low"', () => {
      expect(normalizeSeverity('low')).toBe('Low');
      expect(normalizeSeverity('Low')).toBe('Low');
      expect(normalizeSeverity('LOW')).toBe('Low');
    });

    it('should handle whitespace', () => {
      expect(normalizeSeverity(' critical ')).toBe('Critical');
      expect(normalizeSeverity('  high  ')).toBe('High');
      expect(normalizeSeverity('\tmedium\n')).toBe('Medium');
    });

    it('should return null for undefined or null', () => {
      expect(normalizeSeverity(undefined)).toBeNull();
      expect(normalizeSeverity(null)).toBeNull();
      expect(normalizeSeverity('')).toBeNull();
    });

    it('should return original value for unrecognized strings', () => {
      expect(normalizeSeverity('unknown')).toBe('unknown');
      expect(normalizeSeverity('severe')).toBe('severe');
    });
  });

  describe('calculateTotalRisks', () => {
    it('should return 0 for empty array', () => {
      expect(calculateTotalRisks([])).toBe(0);
    });

    it('should calculate total for single use case', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'Medium', status: 'CLOSED', riskScore: 5, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateTotalRisks(useCases)).toBe(2);
    });

    it('should calculate total for multiple use cases', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
        {
          id: '2',
          risks: [
            { id: 'r2', category: 'data', riskLevel: 'Medium', status: 'CLOSED', riskScore: 5, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r3', category: 'operational', riskLevel: 'Low', status: 'OPEN', riskScore: 3, description: 'Risk 3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateTotalRisks(useCases)).toBe(3);
    });

    it('should handle use cases with no risks', () => {
      const useCases: UseCase[] = [
        { id: '1', risks: [] },
        { id: '2', risks: [] },
      ];
      expect(calculateTotalRisks(useCases)).toBe(0);
    });
  });

  describe('calculateOpenRisks', () => {
    it('should return 0 for empty array', () => {
      expect(calculateOpenRisks([])).toBe(0);
    });

    it('should count only OPEN status risks', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'Medium', status: 'CLOSED', riskScore: 5, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r3', category: 'operational', riskLevel: 'Low', status: 'OPEN', riskScore: 3, description: 'Risk 3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r4', category: 'regulatory', riskLevel: 'High', status: 'IN_PROGRESS', riskScore: 8, description: 'Risk 4', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateOpenRisks(useCases)).toBe(2);
    });

    it('should return 0 when no open risks', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', status: 'CLOSED', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'Medium', status: 'MITIGATED', riskScore: 5, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateOpenRisks(useCases)).toBe(0);
    });
  });

  describe('calculateCriticalSeverityCount', () => {
    it('should return 0 for empty array', () => {
      expect(calculateCriticalSeverityCount([])).toBe(0);
    });

    it('should count only risks with critical severity and likelihood', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'Critical', likelihood: 'High', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'Critical', likelihood: 'Medium', status: 'OPEN', riskScore: 8, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r3', category: 'operational', riskLevel: 'High', likelihood: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r4', category: 'regulatory', riskLevel: 'Critical', status: 'OPEN', riskScore: 8, description: 'Risk 4', createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // missing likelihood
          ],
        },
      ];
      expect(calculateCriticalSeverityCount(useCases)).toBe(2);
    });

    it('should handle case-insensitive matching', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'critical', likelihood: 'High', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'CRITICAL', likelihood: 'Medium', status: 'OPEN', riskScore: 8, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateCriticalSeverityCount(useCases)).toBe(2);
    });

    it('should ignore risks without likelihood', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'Critical', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateCriticalSeverityCount(useCases)).toBe(0);
    });

    it('should ignore risks without riskLevel', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', likelihood: 'High', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' } as Risk,
          ],
        },
      ];
      expect(calculateCriticalSeverityCount(useCases)).toBe(0);
    });
  });

  describe('calculateHighSeverityCount', () => {
    it('should return 0 for empty array', () => {
      expect(calculateHighSeverityCount([])).toBe(0);
    });

    it('should count only risks with high severity and likelihood', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', likelihood: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'High', likelihood: 'Medium', status: 'OPEN', riskScore: 6, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r3', category: 'operational', riskLevel: 'Critical', likelihood: 'High', status: 'OPEN', riskScore: 9, description: 'Risk 3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r4', category: 'regulatory', riskLevel: 'High', status: 'OPEN', riskScore: 6, description: 'Risk 4', createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // missing likelihood
          ],
        },
      ];
      expect(calculateHighSeverityCount(useCases)).toBe(2);
    });

    it('should handle case-insensitive matching', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'high', likelihood: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'HIGH', likelihood: 'Medium', status: 'OPEN', riskScore: 6, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateHighSeverityCount(useCases)).toBe(2);
    });
  });

  describe('calculateHighLikelihoodCount', () => {
    it('should return 0 for empty array', () => {
      expect(calculateHighLikelihoodCount([])).toBe(0);
    });

    it('should count only risks with high likelihood and severity', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', likelihood: 'High', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'Critical', likelihood: 'High', status: 'OPEN', riskScore: 9, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r3', category: 'operational', riskLevel: 'Medium', likelihood: 'Medium', status: 'OPEN', riskScore: 5, description: 'Risk 3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r4', category: 'regulatory', likelihood: 'High', status: 'OPEN', riskScore: 6, description: 'Risk 4', createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // missing riskLevel
          ],
        },
      ];
      expect(calculateHighLikelihoodCount(useCases)).toBe(2);
    });

    it('should handle case-insensitive matching', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', likelihood: 'high', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'Critical', likelihood: 'HIGH', status: 'OPEN', riskScore: 9, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateHighLikelihoodCount(useCases)).toBe(2);
    });

    it('should handle whitespace in likelihood', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'High', likelihood: ' high ', status: 'OPEN', riskScore: 7, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateHighLikelihoodCount(useCases)).toBe(1);
    });
  });

  describe('calculateCriticalHighLikelihoodCount', () => {
    it('should return 0 for empty array', () => {
      expect(calculateCriticalHighLikelihoodCount([])).toBe(0);
    });

    it('should count only risks with (critical or high) severity AND high likelihood', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'Critical', likelihood: 'High', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'High', likelihood: 'High', status: 'OPEN', riskScore: 8, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r3', category: 'operational', riskLevel: 'Critical', likelihood: 'Medium', status: 'OPEN', riskScore: 7, description: 'Risk 3', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r4', category: 'regulatory', riskLevel: 'Medium', likelihood: 'High', status: 'OPEN', riskScore: 6, description: 'Risk 4', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r5', category: 'ethical', riskLevel: 'High', likelihood: 'Low', status: 'OPEN', riskScore: 5, description: 'Risk 5', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateCriticalHighLikelihoodCount(useCases)).toBe(2);
    });

    it('should handle case-insensitive matching', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'critical', likelihood: 'high', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: 'HIGH', likelihood: 'HIGH', status: 'OPEN', riskScore: 8, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateCriticalHighLikelihoodCount(useCases)).toBe(2);
    });

    it('should ignore risks without both severity and likelihood', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: 'Critical', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // missing likelihood
            { id: 'r2', category: 'data', likelihood: 'High', status: 'OPEN', riskScore: 8, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // missing riskLevel
          ],
        },
      ];
      expect(calculateCriticalHighLikelihoodCount(useCases)).toBe(0);
    });

    it('should handle whitespace in both fields', () => {
      const useCases: UseCase[] = [
        {
          id: '1',
          risks: [
            { id: 'r1', category: 'technical', riskLevel: ' critical ', likelihood: ' high ', status: 'OPEN', riskScore: 9, description: 'Risk 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: 'r2', category: 'data', riskLevel: ' high ', likelihood: ' high ', status: 'OPEN', riskScore: 8, description: 'Risk 2', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        },
      ];
      expect(calculateCriticalHighLikelihoodCount(useCases)).toBe(2);
    });
  });
});


