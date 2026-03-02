'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Line,
  Bar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const FORECAST_MONTHS = 36;
const MONTHS = Array.from({ length: FORECAST_MONTHS }, (_, i) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + i);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
});


function formatCurrency(num: number) {
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}


function formatPercent(num: number) {
  return num.toFixed(1) + '%';
}


function formatK(num: number) {
  if (Math.abs(num) >= 1000) return `$${(num/1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}


interface ReadOnlyFinancialDashboardProps {
  data?: {
    initialDevCost: number;
    baseApiCost: number;
    baseInfraCost: number;
    baseOpCost: number;
    baseMonthlyValue: number;
    valueGrowthRate: number;
    budgetRange: string;
    // Gen AI specific fields
    inputTokenPrice?: number;
    outputTokenPrice?: number;
    embeddingTokenPrice?: number;
    finetuningTokenPrice?: number;
    monthlyTokenBudget?: number;
    avgTokensPerUser?: number;
    peakTokenUsage?: number;
    optimizationStrategies?: string[];
    vectorDbCost?: number;
    gpuInferenceCost?: number;
    monitoringToolsCost?: number;
    safetyApiCost?: number;
    backupModelCost?: number;
  };
  finopsData?: {
    totalInvestment: number;
    cumValue: number;
    ROI: number;
    netValue: number;
  };
}


const ReadOnlyFinancialDashboard: React.FC<ReadOnlyFinancialDashboardProps> = ({ data, finopsData }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);


  // Default values if no data provided
  const initialDevCost = data?.initialDevCost || 0;
  const baseApiCost = data?.baseApiCost || 0;
  const baseInfraCost = data?.baseInfraCost || 0;
  const baseOpCost = data?.baseOpCost || 0;
  const baseMonthlyValue = data?.baseMonthlyValue || 0;
  const valueGrowthRate = data?.valueGrowthRate || 0;


  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);


  // Calculate financial projections
  const financialProjections = useMemo(() => {
    const projections = [];
   
    for (let month = 1; month <= FORECAST_MONTHS; month++) {
      const monthNumber = month;
      const devCost = month === 1 ? initialDevCost : 0;
      
      // Use the specified growth formulas (same as Financial Dashboard)
      const monthlyApiCost = baseApiCost * Math.pow(1.12, month / 12);
      const monthlyInfraCost = baseInfraCost * Math.pow(1.05, month / 12);
      const monthlyOpCost = baseOpCost * Math.pow(1.08, month / 12);
      const totalMonthlyCost = monthlyOpCost + monthlyApiCost + monthlyInfraCost;
      const monthlyValue = baseMonthlyValue * Math.pow(1 + valueGrowthRate, month / 12);
      const netMonthlyValue = monthlyValue - totalMonthlyCost;
     
      // Calculate cumulative operating costs (excluding initial dev cost)
      const cumulativeOperatingCosts: number = projections.length > 0
        ? projections[projections.length - 1].cumulativeOperatingCosts + totalMonthlyCost
        : totalMonthlyCost;
     
      // Total Investment = initialDevCost + Cumulative Operating Costs
      const totalInvestment = initialDevCost + cumulativeOperatingCosts;
     
      const cumulativeValue: number = projections.length > 0
        ? projections[projections.length - 1].cumulativeValue + monthlyValue
        : monthlyValue;
     
      // Net Value = Cumulative Value - Total Investment
      const netValue = cumulativeValue - totalInvestment;
      
      // ROI = (Net Value / Total Investment) × 100%
      const roi = totalInvestment > 0 ? (netValue / totalInvestment) * 100 : 0;
     
      projections.push({
        month: monthNumber,
        monthName: MONTHS[month],
        devCost,
        monthlyOpCost,
        monthlyApiCost,
        monthlyInfraCost,
        totalMonthlyCost,
        monthlyValue,
        netMonthlyValue,
        cumulativeOperatingCosts,
        totalInvestment,
        cumulativeValue,
        netValue,
        roi
      });
    }
   
    return projections;
  }, [initialDevCost, baseApiCost, baseInfraCost, baseOpCost, baseMonthlyValue, valueGrowthRate]);


  // Chart configurations
  const cumulativeChartData = useMemo(() => ({
    labels: MONTHS,
    datasets: [
      {
        label: 'Total Investment',
        data: financialProjections.map(p => p.totalInvestment),
        borderColor: isDarkMode ? '#ef4444' : '#dc2626',
        backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Cumulative Value Generated',
        data: financialProjections.map(p => p.cumulativeValue),
        borderColor: isDarkMode ? '#10b981' : '#059669',
        backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Net Value',
        data: financialProjections.map(p => p.netValue),
        borderColor: isDarkMode ? '#3b82f6' : '#2563eb',
        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      }
    ]
  }), [financialProjections, isDarkMode]);


  const cumulativeChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Timeline',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 12,
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return formatK(value);
          }
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }), [isDarkMode]);


  // ROI Chart
  const roiChart = useMemo(() => ({
    labels: MONTHS,
    datasets: [
      {
        label: 'ROI %',
        data: financialProjections.map(p => p.roi),
        borderColor: isDarkMode ? '#8b5cf6' : '#7c3aed',
        backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      }
    ]
  }), [financialProjections, isDarkMode]);


  const roiOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `ROI: ${formatPercent(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Timeline',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 12,
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'ROI (%)',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return formatPercent(value);
          }
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      }
    }
  }), [isDarkMode]);


  // Cost Breakdown Chart
  const costBreakdownChart = useMemo(() => ({
    labels: MONTHS,
    datasets: [
      {
        label: 'API Costs',
        data: financialProjections.map(p => p.monthlyApiCost),
        borderColor: isDarkMode ? '#f59e0b' : '#d97706',
        backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
      {
        label: 'Infrastructure',
        data: financialProjections.map(p => p.monthlyInfraCost),
        borderColor: isDarkMode ? '#06b6d4' : '#0891b2',
        backgroundColor: isDarkMode ? 'rgba(6, 182, 212, 0.1)' : 'rgba(8, 145, 178, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
      {
        label: 'Operations',
        data: financialProjections.map(p => p.monthlyOpCost),
        borderColor: isDarkMode ? '#ef4444' : '#dc2626',
        backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
      }
    ]
  }), [financialProjections, isDarkMode]);


  const costBreakdownOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Timeline',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 12,
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Monthly Cost ($)',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return formatK(value);
          }
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      }
    }
  }), [isDarkMode]);


  // Profit/Loss Chart
  const profitLossChart = useMemo(() => ({
    labels: MONTHS,
    datasets: [
      {
        label: 'Monthly Net Value',
        data: financialProjections.map(p => p.netMonthlyValue),
        backgroundColor: financialProjections.map(p =>
          p.netMonthlyValue >= 0
            ? (isDarkMode ? 'rgba(16, 185, 129, 0.8)' : 'rgba(5, 150, 105, 0.8)')
            : (isDarkMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)')
        ),
        borderColor: financialProjections.map(p =>
          p.netMonthlyValue >= 0
            ? (isDarkMode ? '#10b981' : '#059669')
            : (isDarkMode ? '#ef4444' : '#dc2626')
        ),
        borderWidth: 1,
      }
    ]
  }), [financialProjections, isDarkMode]);


  const profitLossOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Net Value: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Timeline',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 12,
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Monthly Net Value ($)',
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return formatK(value);
          }
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        }
      }
    }
  }), [isDarkMode]);


  // Get key metrics
  const finalProjection = financialProjections[financialProjections.length - 1];
  const breakEvenMonth = financialProjections.findIndex(p => p.netValue >= 0) + 1;
  const maxROI = Math.max(...financialProjections.map(p => p.roi));


  return (
    <div className="space-y-8 p-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6 bg-muted/50 border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(finopsData?.totalInvestment || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Investment</p>
          </div>
        </Card>


        <Card className="p-6 bg-muted/50 border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(finopsData?.cumValue || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Value Generated</p>
          </div>
        </Card>


        <Card className="p-6 bg-muted/50 border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatPercent(finopsData?.ROI || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Net ROI</p>
          </div>
        </Card>


        <Card className="p-6 bg-muted/50 border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-1">
              {breakEvenMonth} months
            </p>
            <p className="text-sm text-muted-foreground">Break-even Month</p>
          </div>
        </Card>


        <Card className="p-6 bg-muted/50 border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(finopsData?.netValue || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Net Value (Forecast)</p>
          </div>
        </Card>
      </div>


      {/* Financial Inputs Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Core Financial Inputs</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Initial Dev Cost:</span>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">{formatCurrency(initialDevCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Monthly API Cost:</span>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">{formatCurrency(baseApiCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Monthly Infrastructure:</span>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">{formatCurrency(baseInfraCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Monthly Operations:</span>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">{formatCurrency(baseOpCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Monthly Value Generated:</span>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">{formatCurrency(baseMonthlyValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Value Growth Rate (%):</span>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">{valueGrowthRate}%</span>
            </div>
          </div>
        </Card>


        {/* Cost Structure Analysis (Month 12) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Cost Structure Analysis (Month 12)</h3>
          <div className="space-y-4">
            {(() => {
              const month12Data = financialProjections[11]; // Month 12 (index 11)
              const totalMonthlyCost = month12Data.totalMonthlyCost;
              const apiPercentage = totalMonthlyCost > 0 ? ((month12Data.monthlyApiCost / totalMonthlyCost) * 100).toFixed(1) : '0.0';
              const infraPercentage = totalMonthlyCost > 0 ? ((month12Data.monthlyInfraCost / totalMonthlyCost) * 100).toFixed(1) : '0.0';
              const opsPercentage = totalMonthlyCost > 0 ? ((month12Data.monthlyOpCost / totalMonthlyCost) * 100).toFixed(1) : '0.0';
             
              return (
                <>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">API</div>
                      <div>
                        <div className="font-medium text-foreground">API Costs</div>
                        <div className="text-xs text-muted-foreground">{apiPercentage}% of total</div>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(month12Data.monthlyApiCost)}</span>
                  </div>
                 
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Infra</div>
                      <div>
                        <div className="font-medium text-foreground">Infrastructure</div>
                        <div className="text-xs text-muted-foreground">{infraPercentage}% of total</div>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(month12Data.monthlyInfraCost)}</span>
                  </div>
                 
                  <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Ops</div>
                      <div>
                        <div className="font-medium text-foreground">Operations</div>
                        <div className="text-xs text-muted-foreground">{opsPercentage}% of total</div>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(month12Data.monthlyOpCost)}</span>
                  </div>
                 
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Total</div>
                      <div>
                        <div className="font-medium text-foreground">Total Monthly</div>
                        <div className="text-xs text-muted-foreground">100% combined</div>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(totalMonthlyCost)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      </div>


      {/* Financial Analytics Dashboard */}
      <div className="space-y-12">
        {/* Primary Chart - Cumulative Financial View */}
        <Card className="w-full mx-auto p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cumulative Financial Overview</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Track investment vs value generation over 36 months</p>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-6 shadow-inner" style={{ height: 480 }}>
            <Line data={cumulativeChartData} options={cumulativeChartOptions} />
          </div>
        </Card>


        {/* Secondary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ROI Trend Chart */}
          <Card className="p-6 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-lg rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">ROI Performance</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Return on investment over time</p>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <Line data={roiChart} options={roiOptions} />
            </div>
          </Card>


          {/* Monthly Cost Breakdown */}
          <Card className="p-6 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 dark:from-gray-800 dark:via-amber-900/20 dark:to-orange-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-lg rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cost Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Operational cost components</p>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <Line data={costBreakdownChart} options={costBreakdownOptions} />
            </div>
          </Card>
        </div>


        {/* Monthly Profit/Loss Chart */}
        <Card className="p-6 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 dark:from-gray-800 dark:via-emerald-900/20 dark:to-teal-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-lg rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Monthly Profit & Loss Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Net value generation per month</p>
            </div>
          </div>
          <div style={{ height: 300 }}>
            <Bar data={profitLossChart} options={profitLossOptions} />
          </div>
        </Card>
      </div>
    </div>
  );
};


export default ReadOnlyFinancialDashboard;



