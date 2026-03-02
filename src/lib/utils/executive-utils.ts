/**
 * Executive Dashboard utility functions
 * 
 * Provides utilities for:
 * - Currency formatting
 * - CSV content generation
 * - Risk level calculation
 */

/**
 * Formats a number as USD currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$1,000")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Calculates risk level based on implementation complexity and confidence level
 * @param complexity - Implementation complexity (0-10 scale)
 * @param confidence - Confidence level (0-100 scale)
 * @returns Risk level: 'High', 'Medium', or 'Low'
 */
export function calculateRiskLevel(
  complexity: number,
  confidence: number
): 'High' | 'Medium' | 'Low' {
  if (complexity >= 7 && confidence <= 40) {
    return 'High';
  } else if (complexity >= 4 || confidence <= 60) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Executive metrics data structure for CSV generation
 */
export interface ExecutiveMetrics {
  portfolio?: {
    totalUseCases?: number;
    overallScore?: number;
    complexityAnalysis?: {
      average?: number;
    };
    confidenceAnalysis?: {
      average?: number;
    };
    stageDistribution?: Record<string, number>;
    priorityDistribution?: Record<string, number>;
  };
  financial?: {
    totalInvestment?: number;
    totalROI?: number;
    averageROI?: number;
  };
  risk?: {
    totalAssessed?: number;
    riskDistribution?: Record<string, number>;
  };
  strategic?: {
    businessFunctionPerformance?: Array<{
      function: string;
      count: number;
      averageROI: number;
    }>;
    portfolioBalance?: {
      quickWins?: number;
      highImpactLowComplexity?: number;
    };
  };
}

/**
 * Generates CSV content from executive metrics
 * @param metrics - Executive metrics data
 * @returns CSV-formatted string
 */
export function generateCSVContent(metrics: ExecutiveMetrics): string {
  const rows: (string | number)[][] = [];
  
  rows.push(['Executive Dashboard Report', new Date().toLocaleDateString()]);
  rows.push([]);
  
  rows.push(['PORTFOLIO METRICS']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Use Cases', metrics.portfolio?.totalUseCases || 0]);
  rows.push(['Portfolio Score', `${(metrics.portfolio?.overallScore || 0).toFixed(1)}/10`]);
  rows.push(['Average Complexity', `${(metrics.portfolio?.complexityAnalysis?.average || 0).toFixed(1)}/10`]);
  rows.push(['Average Confidence', `${Math.round(metrics.portfolio?.confidenceAnalysis?.average || 0)}%`]);
  rows.push([]);
  
  if (metrics.portfolio?.stageDistribution) {
    rows.push(['STAGE DISTRIBUTION']);
    rows.push(['Stage', 'Count']);
    Object.entries(metrics.portfolio.stageDistribution).forEach(([stage, count]) => {
      rows.push([stage.replace('-', ' '), count]);
    });
    rows.push([]);
  }
  
  if (metrics.portfolio?.priorityDistribution) {
    rows.push(['PRIORITY DISTRIBUTION']);
    rows.push(['Priority', 'Count']);
    Object.entries(metrics.portfolio.priorityDistribution).forEach(([priority, count]) => {
      rows.push([priority, count]);
    });
    rows.push([]);
  }
  
  if (metrics.financial) {
    rows.push(['FINANCIAL METRICS']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Investment', formatCurrency(metrics.financial.totalInvestment ?? 0)]);
    rows.push(['Total ROI', formatCurrency(metrics.financial.totalROI ?? 0)]);
    rows.push(['Average ROI', `${(metrics.financial.averageROI ?? 0).toFixed(1)}%`]);
    rows.push(['Avg Cost per Use Case', formatCurrency((metrics.financial.totalInvestment ?? 0) / (metrics.portfolio?.totalUseCases || 1))]);
    rows.push([]);
  }
  
  if (metrics.risk) {
    rows.push(['RISK ASSESSMENT']);
    rows.push(['Risk Level', 'Count']);
    if (metrics.risk.riskDistribution) {
      Object.entries(metrics.risk.riskDistribution).forEach(([risk, count]) => {
        rows.push([risk, count]);
      });
    }
    rows.push(['Total Assessed', metrics.risk.totalAssessed ?? 0]);
    rows.push([]);
  }
  
  if (metrics.strategic) {
    rows.push(['STRATEGIC INSIGHTS']);
    
    if (metrics.strategic.businessFunctionPerformance) {
      rows.push(['BUSINESS FUNCTION PERFORMANCE']);
      rows.push(['Function', 'Count', 'Average ROI']);
      metrics.strategic.businessFunctionPerformance.forEach((func) => {
        rows.push([func.function, func.count, `${func.averageROI.toFixed(1)}%`]);
      });
      rows.push([]);
    }
    
    if (metrics.strategic.portfolioBalance) {
      rows.push(['PORTFOLIO BALANCE']);
      rows.push(['Category', 'Count']);
      rows.push(['Quick Wins', metrics.strategic.portfolioBalance.quickWins ?? 0]);
      rows.push(['High Impact Low Complexity', metrics.strategic.portfolioBalance.highImpactLowComplexity ?? 0]);
    }
  }
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}





