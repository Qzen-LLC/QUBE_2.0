/**
 * Unit tests for Governance Dashboard utility functions
 * 
 * Tests validate:
 * - getSafeProgress: safely extracts progress values
 * - formatDate: formats date strings correctly
 * - formatTimeRemaining: formats time remaining until expiration
 * - detectEnabledFrameworks: correctly identifies enabled frameworks
 */

import {
  getSafeProgress,
  formatDate,
  formatTimeRemaining,
  detectEnabledFrameworks,
  type AssessmentProgress,
  type UseCase,
} from '@/lib/utils/governance-utils';

describe('Governance Dashboard Utilities', () => {
  describe('getSafeProgress', () => {
    it('should return progress value when valid number is provided', () => {
      const progress: AssessmentProgress = { progress: 75 };
      expect(getSafeProgress(progress)).toBe(75);
    });

    it('should return 0 when progress is null', () => {
      const progress: AssessmentProgress = { progress: null };
      expect(getSafeProgress(progress)).toBe(0);
    });

    it('should return 0 when progress is undefined', () => {
      const progress: AssessmentProgress = {};
      expect(getSafeProgress(progress)).toBe(0);
    });

    it('should return 0 when progress is NaN', () => {
      const progress: AssessmentProgress = { progress: NaN };
      expect(getSafeProgress(progress)).toBe(0);
    });

    it('should return 0 when object is undefined', () => {
      expect(getSafeProgress(undefined)).toBe(0);
    });

    it('should handle zero progress value', () => {
      const progress: AssessmentProgress = { progress: 0 };
      expect(getSafeProgress(progress)).toBe(0);
    });

    it('should handle negative progress values', () => {
      const progress: AssessmentProgress = { progress: -10 };
      expect(getSafeProgress(progress)).toBe(-10);
    });

    it('should handle progress values over 100', () => {
      const progress: AssessmentProgress = { progress: 150 };
      expect(getSafeProgress(progress)).toBe(150);
    });

    it('should handle decimal progress values', () => {
      const progress: AssessmentProgress = { progress: 45.5 };
      expect(getSafeProgress(progress)).toBe(45.5);
    });

    it('should ignore other properties in the object', () => {
      const progress: AssessmentProgress = {
        id: 'test-id',
        status: 'completed',
        progress: 50,
        updatedAt: '2024-01-01',
        maturityLevel: 'high',
        weightedScore: 75,
      };
      expect(getSafeProgress(progress)).toBe(50);
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    it('should format date string with time component', () => {
      const dateString = '2024-12-25T12:00:00.000Z';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/Dec 25, 2024/);
    });

    it('should format date-only string', () => {
      const dateString = '2024-06-01';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/Jun 1, 2024/);
    });

    it('should return original string if date parsing fails', () => {
      const invalidDate = 'invalid-date-string';
      const formatted = formatDate(invalidDate);
      expect(formatted).toBe(invalidDate);
    });

    it('should handle empty string', () => {
      const emptyString = '';
      const formatted = formatDate(emptyString);
      expect(formatted).toBe(emptyString);
    });

    it('should format dates in different months correctly', () => {
      const dates = [
        { input: '2024-01-01', expected: 'Jan' },
        { input: '2024-02-15', expected: 'Feb' },
        { input: '2024-03-20', expected: 'Mar' },
        { input: '2024-04-10', expected: 'Apr' },
        { input: '2024-05-05', expected: 'May' },
        { input: '2024-06-30', expected: 'Jun' },
        { input: '2024-07-04', expected: 'Jul' },
        { input: '2024-08-15', expected: 'Aug' },
        { input: '2024-09-01', expected: 'Sep' },
        { input: '2024-10-31', expected: 'Oct' },
        { input: '2024-11-11', expected: 'Nov' },
        { input: '2024-12-25', expected: 'Dec' },
      ];

      dates.forEach(({ input, expected }) => {
        const formatted = formatDate(input);
        expect(formatted).toContain(expected);
      });
    });

    it('should handle single-digit days correctly', () => {
      const dateString = '2024-01-05';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/Jan 5, 2024/);
    });

    it('should handle double-digit days correctly', () => {
      const dateString = '2024-01-25';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/Jan 25, 2024/);
    });
  });

  describe('formatTimeRemaining', () => {
    beforeEach(() => {
      // Mock Date.now() to have consistent test results
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return null when expiresAt is undefined', () => {
      expect(formatTimeRemaining(undefined)).toBeNull();
    });

    it('should return null when expiresAt is null', () => {
      expect(formatTimeRemaining(null)).toBeNull();
    });

    it('should return null when expiresAt is invalid date string', () => {
      expect(formatTimeRemaining('invalid-date')).toBeNull();
    });

    it('should return "less than a minute" when time has already passed', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      jest.setSystemTime(Date.now());
      expect(formatTimeRemaining(pastDate)).toBe('less than a minute');
    });

    it('should return "less than a minute" when time is exactly now', () => {
      const now = new Date(Date.now()).toISOString();
      jest.setSystemTime(Date.now());
      expect(formatTimeRemaining(now)).toBe('less than a minute');
    });

    it('should format hours and minutes correctly', () => {
      const futureDate = new Date(Date.now() + 2 * 3600 * 1000 + 30 * 60 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/2h 30m/);
    });

    it('should format only hours when minutes are zero', () => {
      const futureDate = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/3h 0m/);
    });

    it('should format minutes and seconds when less than an hour', () => {
      const futureDate = new Date(Date.now() + 45 * 60 * 1000 + 30 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/45m \d{2}s/);
    });

    it('should format only minutes when seconds are zero', () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/15m 00s/);
    });

    it('should format only seconds when less than a minute', () => {
      const futureDate = new Date(Date.now() + 30 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/30s/);
    });

    it('should pad seconds with zero when less than 10', () => {
      const futureDate = new Date(Date.now() + 5 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toBe('5s');
    });

    it('should handle very large time differences', () => {
      const futureDate = new Date(Date.now() + 24 * 3600 * 1000 + 15 * 60 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/\d+h 15m/);
    });

    it('should handle edge case of exactly 1 hour', () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/1h 0m/);
    });

    it('should handle edge case of exactly 1 minute', () => {
      const futureDate = new Date(Date.now() + 60 * 1000).toISOString();
      jest.setSystemTime(Date.now());
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/1m \d{2}s/);
    });
  });

  describe('detectEnabledFrameworks', () => {
    it('should detect EU AI Act when present in regulatoryFrameworks', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-1',
        regulatoryFrameworks: ['EU AI Act'],
        industryStandards: [],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(true);
      expect(result.hasIso42001).toBe(false);
      expect(result.hasUaeAi).toBe(false);
      expect(result.hasIso27001).toBe(false);
    });

    it('should detect ISO/IEC 42001 when present in industryStandards', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-2',
        regulatoryFrameworks: [],
        industryStandards: ['ISO/IEC 42001'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(false);
      expect(result.hasIso42001).toBe(true);
      expect(result.hasUaeAi).toBe(false);
      expect(result.hasIso27001).toBe(false);
    });

    it('should detect ISO/IEC 42001 with version suffix', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-3',
        regulatoryFrameworks: [],
        industryStandards: ['ISO/IEC 42001:2023'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasIso42001).toBe(true);
    });

    it('should detect UAE AI/GenAI Controls when present in regulatoryFrameworks', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-4',
        regulatoryFrameworks: ['UAE AI/GenAI Controls'],
        industryStandards: [],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(false);
      expect(result.hasIso42001).toBe(false);
      expect(result.hasUaeAi).toBe(true);
      expect(result.hasIso27001).toBe(false);
    });

    it('should detect ISO 27001 when present in industryStandards', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-5',
        regulatoryFrameworks: [],
        industryStandards: ['ISO 27001'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(false);
      expect(result.hasIso42001).toBe(false);
      expect(result.hasUaeAi).toBe(false);
      expect(result.hasIso27001).toBe(true);
    });

    it('should detect ISO 27001 with version suffix', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-6',
        regulatoryFrameworks: [],
        industryStandards: ['ISO 27001:2022'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasIso27001).toBe(true);
    });

    it('should detect multiple frameworks simultaneously', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-7',
        regulatoryFrameworks: ['EU AI Act', 'UAE AI/GenAI Controls'],
        industryStandards: ['ISO/IEC 42001', 'ISO 27001'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(true);
      expect(result.hasIso42001).toBe(true);
      expect(result.hasUaeAi).toBe(true);
      expect(result.hasIso27001).toBe(true);
    });

    it('should return false for all frameworks when arrays are empty', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-8',
        regulatoryFrameworks: [],
        industryStandards: [],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(false);
      expect(result.hasIso42001).toBe(false);
      expect(result.hasUaeAi).toBe(false);
      expect(result.hasIso27001).toBe(false);
    });

    it('should not detect EU AI Act with partial match', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-9',
        regulatoryFrameworks: ['EU AI Regulation'], // Different name
        industryStandards: [],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(false);
    });

    it('should not detect UAE AI with partial match', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-10',
        regulatoryFrameworks: ['UAE AI Controls'], // Missing /GenAI
        industryStandards: [],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasUaeAi).toBe(false);
    });

    it('should handle case sensitivity correctly', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-11',
        regulatoryFrameworks: ['eu ai act'], // lowercase
        industryStandards: [],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(false); // Should be case-sensitive
    });

    it('should detect framework when mixed with other frameworks', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-12',
        regulatoryFrameworks: ['GDPR', 'EU AI Act', 'HIPAA'],
        industryStandards: ['ISO 9001', 'ISO/IEC 42001', 'ISO 14001'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(true);
      expect(result.hasIso42001).toBe(true);
      expect(result.hasUaeAi).toBe(false);
      expect(result.hasIso27001).toBe(false);
    });

    it('should handle use case with additional properties', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-13',
        regulatoryFrameworks: ['EU AI Act'],
        industryStandards: ['ISO 27001'],
        useCaseName: 'Test Use Case',
        department: 'IT',
        useCaseType: 'PRODUCTION',
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasEuAiAct).toBe(true);
      expect(result.hasIso27001).toBe(true);
    });

    it('should correctly identify ISO/IEC 42001 in a longer string', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-14',
        regulatoryFrameworks: [],
        industryStandards: ['ISO/IEC 42001 - Information technology — Artificial intelligence — Management system'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasIso42001).toBe(true);
    });

    it('should correctly identify ISO 27001 in a longer string', () => {
      const useCase: UseCase = {
        useCaseId: 'uc-15',
        regulatoryFrameworks: [],
        industryStandards: ['ISO 27001 - Information security management systems'],
      };
      const result = detectEnabledFrameworks(useCase);
      expect(result.hasIso27001).toBe(true);
    });
  });
});

