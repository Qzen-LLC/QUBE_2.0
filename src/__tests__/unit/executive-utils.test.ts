/**
 * Unit tests for Executive Dashboard utility functions
 * 
 * Tests validate:
 * - formatCurrency: formats numbers as USD currency correctly
 * - calculateRiskLevel: calculates risk levels based on complexity and confidence
 * - generateCSVContent: generates CSV content from metrics data
 */

import {
  formatCurrency,
  calculateRiskLevel,
  generateCSVContent,
  type ExecutiveMetrics,
} from '@/lib/utils/executive-utils';

describe('Executive Dashboard Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive integers correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(500)).toBe('$500');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should format large numbers correctly', () => {
      expect(formatCurrency(1234567890)).toBe('$1,234,567,890');
    });

    it('should format decimal numbers by rounding to nearest integer', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(1234.44)).toBe('$1,234');
      expect(formatCurrency(999.99)).toBe('$1,000');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000');
      expect(formatCurrency(-500)).toBe('-$500');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(1)).toBe('$1');
      expect(formatCurrency(0.5)).toBe('$1');
      expect(formatCurrency(0.4)).toBe('$0');
    });
  });

  describe('calculateRiskLevel', () => {
    describe('High Risk conditions', () => {
      it('should return High when complexity >= 7 and confidence <= 40', () => {
        expect(calculateRiskLevel(7, 40)).toBe('High');
        expect(calculateRiskLevel(8, 30)).toBe('High');
        expect(calculateRiskLevel(10, 20)).toBe('High');
        expect(calculateRiskLevel(7, 40)).toBe('High');
      });

      it('should return High at boundary values', () => {
        expect(calculateRiskLevel(7, 40)).toBe('High');
        expect(calculateRiskLevel(7, 0)).toBe('High');
        expect(calculateRiskLevel(10, 40)).toBe('High');
      });
    });

    describe('Medium Risk conditions', () => {
      it('should return Medium when complexity >= 4 (but not High)', () => {
        expect(calculateRiskLevel(4, 50)).toBe('Medium');
        expect(calculateRiskLevel(5, 70)).toBe('Medium');
        expect(calculateRiskLevel(6, 80)).toBe('Medium');
      });

      it('should return Medium when confidence <= 60 (but not High)', () => {
        expect(calculateRiskLevel(3, 60)).toBe('Medium');
        expect(calculateRiskLevel(2, 50)).toBe('Medium');
        expect(calculateRiskLevel(1, 40)).toBe('Medium');
      });

      it('should return Medium when both conditions are met (but not High)', () => {
        expect(calculateRiskLevel(5, 50)).toBe('Medium');
        expect(calculateRiskLevel(4, 60)).toBe('Medium');
      });

      it('should return Medium at boundary values', () => {
        expect(calculateRiskLevel(4, 61)).toBe('Medium');
        expect(calculateRiskLevel(3, 60)).toBe('Medium');
      });
    });

    describe('Low Risk conditions', () => {
      it('should return Low when complexity < 4 and confidence > 60', () => {
        expect(calculateRiskLevel(3, 61)).toBe('Low');
        expect(calculateRiskLevel(2, 70)).toBe('Low');
        expect(calculateRiskLevel(1, 80)).toBe('Low');
        expect(calculateRiskLevel(0, 100)).toBe('Low');
      });

      it('should return Low at boundary values', () => {
        expect(calculateRiskLevel(3, 61)).toBe('Low');
        expect(calculateRiskLevel(0, 100)).toBe('Low');
      });
    });

    describe('Edge cases', () => {
      it('should handle zero values', () => {
        expect(calculateRiskLevel(0, 0)).toBe('Medium');
        expect(calculateRiskLevel(0, 100)).toBe('Low');
      });

      it('should handle maximum values', () => {
        expect(calculateRiskLevel(10, 100)).toBe('Medium');
        expect(calculateRiskLevel(10, 50)).toBe('Medium');
      });

      it('should handle negative values (edge case)', () => {
        expect(calculateRiskLevel(-1, 50)).toBe('Medium');
        expect(calculateRiskLevel(5, -10)).toBe('Medium');
      });
    });
  });

  describe('generateCSVContent', () => {
    it('should generate CSV with header and date', () => {
      const metrics: ExecutiveMetrics = {};
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('Executive Dashboard Report');
      expect(csv).toContain(new Date().toLocaleDateString());
    });

    it('should include portfolio metrics when provided', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          totalUseCases: 10,
          overallScore: 7.5,
          complexityAnalysis: { average: 5.2 },
          confidenceAnalysis: { average: 75.8 },
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('PORTFOLIO METRICS');
      expect(csv).toContain('Total Use Cases');
      expect(csv).toContain('"10"');
      expect(csv).toContain('Portfolio Score');
      expect(csv).toContain('"7.5/10"');
      expect(csv).toContain('Average Complexity');
      expect(csv).toContain('"5.2/10"');
      expect(csv).toContain('Average Confidence');
      expect(csv).toContain('"76%"'); // Math.round(75.8) = 76
    });

    it('should handle missing portfolio values with defaults', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {},
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('"0"'); // totalUseCases default
      expect(csv).toContain('"0.0/10"'); // overallScore default
      expect(csv).toContain('"0.0/10"'); // complexity default
      expect(csv).toContain('"0%"'); // confidence default
    });

    it('should include stage distribution when provided', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          stageDistribution: {
            'discovery': 3,
            'in-progress': 5,
            'deployment': 2,
          },
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('STAGE DISTRIBUTION');
      expect(csv).toContain('Stage');
      expect(csv).toContain('Count');
      expect(csv).toContain('discovery');
      expect(csv).toContain('"3"');
      expect(csv).toContain('in progress'); // hyphen replaced with space
      expect(csv).toContain('"5"');
      expect(csv).toContain('deployment');
      expect(csv).toContain('"2"');
    });

    it('should include priority distribution when provided', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          priorityDistribution: {
            'high': 4,
            'medium': 3,
            'low': 2,
          },
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('PRIORITY DISTRIBUTION');
      expect(csv).toContain('Priority');
      expect(csv).toContain('Count');
      expect(csv).toContain('high');
      expect(csv).toContain('"4"');
      expect(csv).toContain('medium');
      expect(csv).toContain('"3"');
      expect(csv).toContain('low');
      expect(csv).toContain('"2"');
    });

    it('should include financial metrics when provided', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          totalUseCases: 5,
        },
        financial: {
          totalInvestment: 150000,
          totalROI: 200000,
          averageROI: 25.5,
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('FINANCIAL METRICS');
      expect(csv).toContain('Total Investment');
      expect(csv).toContain('$150,000');
      expect(csv).toContain('Total ROI');
      expect(csv).toContain('$200,000');
      expect(csv).toContain('Average ROI');
      expect(csv).toContain('"25.5%"');
      expect(csv).toContain('Avg Cost per Use Case');
      expect(csv).toContain('$30,000'); // 150000 / 5
    });

    it('should handle financial metrics with zero totalUseCases', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          totalUseCases: 0,
        },
        financial: {
          totalInvestment: 100000,
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      // Should divide by 1 when totalUseCases is 0
      expect(csv).toContain('$100,000'); // 100000 / 1
    });

    it('should include risk assessment when provided', () => {
      const metrics: ExecutiveMetrics = {
        risk: {
          totalAssessed: 10,
          riskDistribution: {
            'High': 2,
            'Medium': 5,
            'Low': 3,
          },
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('RISK ASSESSMENT');
      expect(csv).toContain('Risk Level');
      expect(csv).toContain('Count');
      expect(csv).toContain('High');
      expect(csv).toContain('"2"');
      expect(csv).toContain('Medium');
      expect(csv).toContain('"5"');
      expect(csv).toContain('Low');
      expect(csv).toContain('"3"');
      expect(csv).toContain('Total Assessed');
      expect(csv).toContain('"10"');
    });

    it('should include strategic insights when provided', () => {
      const metrics: ExecutiveMetrics = {
        strategic: {
          businessFunctionPerformance: [
            { function: 'Sales', count: 5, averageROI: 30.5 },
            { function: 'Marketing', count: 3, averageROI: 25.2 },
          ],
          portfolioBalance: {
            quickWins: 4,
            highImpactLowComplexity: 6,
          },
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('STRATEGIC INSIGHTS');
      expect(csv).toContain('BUSINESS FUNCTION PERFORMANCE');
      expect(csv).toContain('Function');
      expect(csv).toContain('Count');
      expect(csv).toContain('Average ROI');
      expect(csv).toContain('Sales');
      expect(csv).toContain('"5"');
      expect(csv).toContain('"30.5%"');
      expect(csv).toContain('Marketing');
      expect(csv).toContain('"3"');
      expect(csv).toContain('"25.2%"');
      
      expect(csv).toContain('PORTFOLIO BALANCE');
      expect(csv).toContain('Category');
      expect(csv).toContain('Quick Wins');
      expect(csv).toContain('"4"');
      expect(csv).toContain('High Impact Low Complexity');
      expect(csv).toContain('"6"');
    });

    it('should handle empty metrics object', () => {
      const metrics: ExecutiveMetrics = {};
      const csv = generateCSVContent(metrics);
      
      expect(csv).toContain('Executive Dashboard Report');
      expect(csv).toContain('PORTFOLIO METRICS');
      expect(csv).toContain('"0"'); // Default values
    });

    it('should properly escape CSV values with quotes', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          totalUseCases: 1,
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      // All values should be wrapped in quotes
      const lines = csv.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          // Each cell should be quoted
          expect(line).toMatch(/^"[^"]*"(,"[^"]*")*$/);
        }
      });
    });

    it('should handle complete metrics object', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          totalUseCases: 10,
          overallScore: 8.5,
          complexityAnalysis: { average: 6.2 },
          confidenceAnalysis: { average: 80.5 },
          stageDistribution: {
            'discovery': 2,
            'in-progress': 5,
            'deployment': 3,
          },
          priorityDistribution: {
            'high': 4,
            'medium': 4,
            'low': 2,
          },
        },
        financial: {
          totalInvestment: 200000,
          totalROI: 250000,
          averageROI: 30.5,
        },
        risk: {
          totalAssessed: 10,
          riskDistribution: {
            'High': 1,
            'Medium': 4,
            'Low': 5,
          },
        },
        strategic: {
          businessFunctionPerformance: [
            { function: 'Sales', count: 5, averageROI: 35.2 },
            { function: 'Operations', count: 3, averageROI: 28.1 },
            { function: 'IT', count: 2, averageROI: 25.0 },
          ],
          portfolioBalance: {
            quickWins: 3,
            highImpactLowComplexity: 7,
          },
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      // Verify all sections are present
      expect(csv).toContain('PORTFOLIO METRICS');
      expect(csv).toContain('STAGE DISTRIBUTION');
      expect(csv).toContain('PRIORITY DISTRIBUTION');
      expect(csv).toContain('FINANCIAL METRICS');
      expect(csv).toContain('RISK ASSESSMENT');
      expect(csv).toContain('STRATEGIC INSIGHTS');
      
      // Verify key values
      expect(csv).toContain('"10"'); // totalUseCases
      expect(csv).toContain('"8.5/10"'); // overallScore
      expect(csv).toContain('$200,000'); // totalInvestment
      expect(csv).toContain('"30.5%"'); // averageROI
      expect(csv).toContain('"10"'); // totalAssessed
      expect(csv).toContain('Sales');
      expect(csv).toContain('"35.2%"');
    });

    it('should handle missing optional fields gracefully', () => {
      const metrics: ExecutiveMetrics = {
        portfolio: {
          totalUseCases: 5,
        },
        financial: {
          totalInvestment: 100000,
        },
        risk: {
          totalAssessed: 5,
        },
      };
      
      const csv = generateCSVContent(metrics);
      
      // Should not throw errors and should include what's available
      expect(csv).toContain('PORTFOLIO METRICS');
      expect(csv).toContain('FINANCIAL METRICS');
      expect(csv).toContain('RISK ASSESSMENT');
      expect(csv).not.toContain('STRATEGIC INSIGHTS');
    });
  });
});





