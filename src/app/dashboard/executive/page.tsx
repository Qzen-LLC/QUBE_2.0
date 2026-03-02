'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useExecutiveMetrics } from '@/hooks/useExecutiveMetrics';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { TrendingUp, DollarSign, Shield, Target, AlertTriangle, CheckCircle, Clock, Zap, Users, Building2, PieChart, Activity, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Download, Eye, Filter } from 'lucide-react';
import { formatCurrency, generateCSVContent, calculateRiskLevel } from '@/lib/utils/executive-utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

interface UseCase {
  id: string;
  title: string;
  implementationComplexity: number;
  confidenceLevel: number;
}

const ExecutiveDashboard = () => {
  const { data: metrics, isLoading: loading, error, refetch } = useExecutiveMetrics();
  const { isDark: isDarkMode, mounted: themeMounted } = useTheme();
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: number}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Plugin to ensure Chart.js uses correct text colors
  const forceTextColorPlugin = useMemo(() => ({
    id: 'forceTextColor',
    beforeLayout: (chart: any) => {
      const textColor = isDarkMode ? '#ffffff' : '#000000';
      
      // Force update scale options before layout
      if (chart.scales.y) {
        chart.scales.y.options.ticks.color = textColor;
      }
      if (chart.scales.x) {
        chart.scales.x.options.ticks.color = textColor;
      }
    },
    beforeUpdate: (chart: any) => {
      const textColor = isDarkMode ? '#ffffff' : '#000000';
      
      // Force update scale options before chart updates
      if (chart.scales.y) {
        chart.scales.y.options.ticks.color = textColor;
      }
      if (chart.scales.x) {
        chart.scales.x.options.ticks.color = textColor;
      }
    }
  }), [isDarkMode]);

  const [useCasesByRisk, setUseCasesByRisk] = useState<{
    High: UseCase[];
    Medium: UseCase[];
    Low: UseCase[];
  }>({ High: [], Medium: [], Low: [] });

  // Update Chart.js defaults when theme changes (based on app theme, not browser)
  useEffect(() => {
    if (!themeMounted) return;
    
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    ChartJS.defaults.color = textColor;
    ChartJS.defaults.scales.linear.ticks.color = textColor;
    ChartJS.defaults.scales.category.ticks.color = textColor;
  }, [isDarkMode, themeMounted]);


  // Animated counter effect
  const animateValue = (key: string, endValue: number, duration: number = 2000) => {
    const startValue = animatedValues[key] || 0;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = startValue + (endValue - startValue) * progress;
      
      setAnimatedValues(prev => ({ ...prev, [key]: currentValue }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Fetch use cases and group by risk
  useEffect(() => {
    const fetchUseCases = async () => {
      try {
        const response = await fetch('/api/read-usecases');
        // If unauthorized, user is likely signing out - don't process
        if (response.status === 401) return;
        if (!response.ok) return;
        
        const data = await response.json();
        const useCases = Array.isArray(data.useCases) ? data.useCases : [];
        
        const grouped: { High: UseCase[]; Medium: UseCase[]; Low: UseCase[] } = {
          High: [],
          Medium: [],
          Low: []
        };
        
        useCases.forEach((uc: any) => {
          const complexity = uc.implementationComplexity || 0;
          const confidence = uc.confidenceLevel || 0;
          
          const riskLevel = calculateRiskLevel(complexity, confidence);
          
          grouped[riskLevel].push({
            id: uc.id,
            title: uc.title || 'Untitled Use Case',
            implementationComplexity: complexity,
            confidenceLevel: confidence
          });
        });
        
        setUseCasesByRisk(grouped);
      } catch (err) {
        console.error('Error fetching use cases for tooltips:', err);
      }
    };
    
    fetchUseCases();
  }, []);

  // Animate values when metrics load
  useEffect(() => {
    if (metrics) {
      animateValue('totalUseCases', metrics.portfolio.totalUseCases);
      animateValue('portfolioScore', metrics.portfolio.overallScore || 0);
      animateValue('complexity', metrics.portfolio.complexityAnalysis?.average || 0);
      animateValue('confidence', metrics.portfolio.confidenceAnalysis?.average || 0);
    }
  }, [metrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    if (!metrics) return;

    // Create CSV content
    const csvContent = generateCSVContent(metrics);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `executive-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Loading Executive Dashboard</h3>
            <p className="text-xs text-muted-foreground">Gathering portfolio insights and metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="p-4 text-center space-y-3 rounded-sm">
            <div className="w-10 h-10 bg-destructive/10 rounded-sm flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Unable to Load Dashboard</h2>
              <p className="text-xs text-muted-foreground">{error?.message}</p>
            </div>
            <button 
              onClick={handleRefresh}
              className="w-full bg-primary text-primary-foreground font-medium py-1.5 px-3 text-xs rounded-sm hover:bg-primary/90 transition-colors duration-150"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Try Again
            </button>
          </Card>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-4 text-center space-y-2 rounded-sm">
          <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">No Data Available</h2>
            <p className="text-xs text-muted-foreground">No metrics data available for this organization.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Action Buttons */}
        <div className="mb-3 flex justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-sm hover:bg-muted transition-colors duration-150"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors duration-150"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {/* Clean KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

          {/* Total Use Cases */}
          <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
            <div className="p-2.5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Use Cases</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(animatedValues.totalUseCases || 0)}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-success rounded-full"></div>
                  <span className="text-[10px] text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio Score */}
          <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
            <div className="p-2.5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Portfolio Score</p>
                <p className="text-lg font-semibold text-foreground">
                  {(animatedValues.portfolioScore || 0).toFixed(1)}
                </p>
                <div className="w-full bg-muted rounded-sm h-1">
                  <div 
                    className="bg-primary/70 h-1 rounded-sm transition-all duration-1000 ease-out"
                    style={{ width: `${(animatedValues.portfolioScore || 0) * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Complexity */}
          <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
            <div className="p-2.5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Complexity</p>
                <p className="text-lg font-semibold text-foreground">
                  {(animatedValues.complexity || 0).toFixed(1)}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-warning rounded-full"></div>
                  <span className="text-[10px] text-muted-foreground">Moderate</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Confidence */}
          <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
            <div className="p-2.5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Confidence</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(animatedValues.confidence || 0)}%
                </p>
                <div className="w-full bg-muted rounded-sm h-1">
                  <div 
                    className="bg-primary/70 h-1 rounded-sm transition-all duration-1000 ease-out"
                    style={{ width: `${animatedValues.confidence || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

        </section>

        {/* Portfolio Health Section */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-primary rounded-sm"></div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Portfolio Health</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Stage Distribution */}
            {(() => {
              const hasStageData = Object.keys(metrics.portfolio.stageDistribution ?? {}).length > 0;
              if (!hasStageData) {
                return (
                  <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                    <div className="p-3">
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-foreground">Stage Distribution</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Use cases by development stage</p>
                      </div>
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No stage data available</p>
                      </div>
                    </div>
                  </Card>
                );
              }
              
              const stageData = Object.entries(metrics.portfolio.stageDistribution || {}).sort((a, b) => (b[1] as number) - (a[1] as number));
              
              // All bars use blue color
              const getComputedColor = (index: number) => {
                if (isDarkMode) {
                  return 'rgba(140, 160, 255, 0.9)'; // Light Blue for dark mode
                } else {
                  return 'rgba(70, 90, 200, 0.9)'; // Blue for light mode
                }
              };
              
              const chartData = {
                labels: stageData.map(([stage]) => {
                  return stage
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                }),
                datasets: [{
                  label: 'Use Cases',
                  data: stageData.map(([, count]) => count as number),
                  backgroundColor: stageData.map((_, index) => getComputedColor(index)),
                  borderRadius: 2,
                  borderSkipped: false,
                  maxBarThickness: 50,
                }]
              };

              const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 0
                },
                plugins: {
                  legend: {
                    display: false,
                    labels: {
                      color: isDarkMode ? '#fff' : '#000'
                    }
                  },
                  tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? '#fff' : '#000',
                    bodyColor: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    cornerRadius: 2,
                    callbacks: {
                      label: function(context: any) {
                        return `${context.parsed.y} use case${context.parsed.y !== 1 ? 's' : ''}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: isDarkMode ? '#ffffff' : '#000000',
                      font: {
                        size: 12,
                        weight: 'bold' as const,
                        family: 'system-ui, -apple-system, sans-serif'
                      },
                      stepSize: 1,
                      precision: 0,
                      padding: 8,
                      callback: function(value: any) {
                        return value;
                      }
                    },
                    grid: {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      drawBorder: false,
                    }
                  },
                  x: {
                    ticks: {
                      color: isDarkMode ? '#ffffff' : '#000000',
                      font: {
                        size: 11,
                        weight: 'bold' as const,
                        family: 'system-ui, -apple-system, sans-serif'
                      },
                      maxRotation: 45,
                      minRotation: 0,
                      padding: 6
                    },
                    grid: {
                      display: false,
                      drawBorder: false,
                    }
                  }
                }
              };

              return (
                <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                  <div className="p-3">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-foreground">Stage Distribution</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Use cases by development stage</p>
                    </div>
                    <div className="h-64 chart-container" style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                      <Bar 
                        key={`stage-${isDarkMode}`} 
                        data={chartData} 
                        options={chartOptions}
                        plugins={[forceTextColorPlugin]}
                        redraw={true}
                      />
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* Priority Distribution */}
            {(() => {
              const priorityDist = metrics.portfolio.priorityDistribution ?? {};
              const hasPriorityData = Object.keys(priorityDist).length > 0 && 
                Object.values(priorityDist).some((count: any) => count > 0);
              if (!hasPriorityData) {
                return (
                  <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                    <div className="p-3">
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-foreground">Priority Distribution</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Use cases by priority level</p>
                      </div>
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No priority data available</p>
                      </div>
                    </div>
                  </Card>
                );
              }
              
              const priorityData = Object.entries(priorityDist).filter(([, count]) => (count as number) > 0).sort((a, b) => {
                const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a[0].toLowerCase()] || 0;
                const bPriority = priorityOrder[b[0].toLowerCase()] || 0;
                return bPriority - aPriority;
              });

              // All bars use blue color
              const getPriorityColor = (priority: string) => {
                if (isDarkMode) {
                  return 'rgba(140, 160, 255, 0.9)'; // Light Blue for dark mode
                } else {
                  return 'rgba(70, 90, 200, 0.9)'; // Blue for light mode
                }
              };
              
              const chartData = {
                labels: priorityData.map(([priority]) => priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()),
                datasets: [{
                  label: 'Use Cases',
                  data: priorityData.map(([, count]) => count as number),
                  backgroundColor: priorityData.map(([priority]) => getPriorityColor(priority)),
                  borderRadius: 2,
                  borderSkipped: false,
                  maxBarThickness: 50,
                }]
              };

              const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 0
                },
                plugins: {
                  legend: {
                    display: false,
                    labels: {
                      color: isDarkMode ? '#fff' : '#000'
                    }
                  },
                  tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? '#fff' : '#000',
                    bodyColor: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    cornerRadius: 2,
                    callbacks: {
                      label: function(context: any) {
                        return `${context.parsed.y} use case${context.parsed.y !== 1 ? 's' : ''}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: isDarkMode ? '#ffffff' : '#000000',
                      font: {
                        size: 12,
                        weight: 'bold' as const,
                        family: 'system-ui, -apple-system, sans-serif'
                      },
                      stepSize: 1,
                      precision: 0,
                      padding: 8,
                      callback: function(value: any) {
                        return value;
                      }
                    },
                    grid: {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      drawBorder: false,
                    }
                  },
                  x: {
                    ticks: {
                      color: isDarkMode ? '#ffffff' : '#000000',
                      font: {
                        size: 11,
                        weight: 'bold' as const,
                        family: 'system-ui, -apple-system, sans-serif'
                      },
                      padding: 6
                    },
                    grid: {
                      display: false,
                      drawBorder: false,
                    }
                  }
                }
              };

              return (
                <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                  <div className="p-3">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-foreground">Priority Distribution</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Use cases by priority level</p>
                    </div>
                    <div className="h-64 chart-container" style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                      <Bar 
                        key={`priority-${isDarkMode}`} 
                        data={chartData} 
                        options={chartOptions}
                        plugins={[forceTextColorPlugin]}
                        redraw={true}
                      />
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        </section>

        {/* Financial Metrics Section */}
        {metrics.financial && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-primary rounded-sm"></div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Financial Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Investment */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-2.5">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Investment</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(metrics.financial.totalInvestment ?? 0)}
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-[10px] text-muted-foreground">Growing</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Total ROI */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-2.5">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total ROI</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(metrics.financial.totalROI ?? 0)}
                    </p>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-success" />
                      <span className="text-[10px] text-muted-foreground">Positive</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Average ROI */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-2.5">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Average ROI</p>
                    <p className="text-lg font-semibold text-foreground">
                      {(metrics.financial.averageROI ?? 0).toFixed(1)}%
                    </p>
                    <div className="w-full bg-muted rounded-sm h-1">
                      <div 
                        className="bg-primary/70 h-1 rounded-sm transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((metrics.financial.averageROI ?? 0) * 2, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Average Cost per Use Case */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-2.5">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Cost per Use Case</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency((metrics.financial.totalInvestment ?? 0) / (metrics.portfolio.totalUseCases || 1))}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      <span className="text-[10px] text-muted-foreground">Per Case</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Risk Assessment Section */}
        {metrics.risk && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-primary rounded-sm"></div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Risk Assessment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* High Risk */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 cursor-pointer rounded-sm">
                    <div className="p-2.5">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">High Risk</p>
                        <p className="text-lg font-semibold text-foreground">
                          {metrics.risk.riskDistribution?.High ?? 0}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-destructive rounded-full"></div>
                          <span className="text-[10px] text-muted-foreground">Critical</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  hideArrow
                  className="max-w-xs bg-card text-foreground border border-border shadow-lg p-2.5 rounded-sm"
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">High Risk Use Cases:</p>
                    {useCasesByRisk.High.length > 0 ? (
                      <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                        {useCasesByRisk.High.map((uc) => (
                          <li key={uc.id} className="text-xs text-foreground">• {uc.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No high risk use cases</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Medium Risk */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 cursor-pointer rounded-sm">
                    <div className="p-2.5">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Medium Risk</p>
                        <p className="text-lg font-semibold text-foreground">
                          {metrics.risk.riskDistribution?.Medium ?? 0}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-warning rounded-full"></div>
                          <span className="text-[10px] text-muted-foreground">Monitor</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  hideArrow
                  className="max-w-xs bg-card text-foreground border border-border shadow-lg p-2.5 rounded-sm"
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Medium Risk Use Cases:</p>
                    {useCasesByRisk.Medium.length > 0 ? (
                      <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                        {useCasesByRisk.Medium.map((uc) => (
                          <li key={uc.id} className="text-xs text-foreground">• {uc.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No medium risk use cases</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Low Risk */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 cursor-pointer rounded-sm">
                    <div className="p-2.5">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Low Risk</p>
                        <p className="text-lg font-semibold text-foreground">
                          {metrics.risk.riskDistribution?.Low ?? 0}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-success rounded-full"></div>
                          <span className="text-[10px] text-muted-foreground">Safe</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  hideArrow
                  className="max-w-xs bg-card text-foreground border border-border shadow-lg p-2.5 rounded-sm"
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Low Risk Use Cases:</p>
                    {useCasesByRisk.Low.length > 0 ? (
                      <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                        {useCasesByRisk.Low.map((uc) => (
                          <li key={uc.id} className="text-xs text-foreground">• {uc.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No low risk use cases</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Total Assessed */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-2.5">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Assessed</p>
                    <p className="text-lg font-semibold text-foreground">
                      {metrics.risk.totalAssessed ?? 0}
                    </p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground">Complete</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Strategic Insights Section */}
        {metrics.strategic && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-primary rounded-sm"></div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Strategic Insights</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Business Function Performance */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-3">
                  <div className="mb-2.5">
                    <h3 className="text-sm font-medium text-foreground">Business Function Performance</h3>
                  </div>
                  <div className="space-y-1.5">
                    {metrics.strategic.businessFunctionPerformance?.map((func: any, index: number) => (
                      <div key={func.function} className="flex items-center justify-between p-1.5 bg-muted/50 rounded-sm hover:bg-muted transition-colors duration-150">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            index === 0 ? 'bg-primary' :
                            index === 1 ? 'bg-success' :
                            index === 2 ? 'bg-warning' :
                            index === 3 ? 'bg-secondary' : 'bg-muted-foreground'
                          }`}></div>
                          <span className="text-[11px] font-medium text-foreground">
                            {func.function}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-sm">
                          {func.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              {/* Portfolio Balance */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-3">
                  <div className="mb-2.5">
                    <h3 className="text-sm font-medium text-foreground">Portfolio Balance</h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 bg-success/10 rounded-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-[11px] font-medium text-foreground">Quick Wins</span>
                      </div>
                      <span className="px-2 py-1 bg-success text-success-foreground text-sm font-semibold rounded-sm">
                        {metrics.strategic.portfolioBalance?.quickWins ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-[11px] font-medium text-foreground">High Impact Low Complexity</span>
                      </div>
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-sm">
                        {metrics.strategic.portfolioBalance?.highImpactLowComplexity ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Average ROI by Function */}
              <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-150 rounded-sm">
                <div className="p-3">
                  <div className="mb-2.5">
                    <h3 className="text-sm font-medium text-foreground">Average ROI by Function</h3>
                  </div>
                  <div className="space-y-1.5">
                    {metrics.strategic.businessFunctionPerformance?.slice(0, 5).map((func: any, index: number) => (
                      <div key={func.function} className="flex items-center justify-between p-1.5 bg-muted/50 rounded-sm hover:bg-muted transition-colors duration-150">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            index === 0 ? 'bg-primary' :
                            index === 1 ? 'bg-success' :
                            index === 2 ? 'bg-warning' :
                            index === 3 ? 'bg-secondary' : 'bg-muted-foreground'
                          }`}></div>
                          <span className="text-[11px] font-medium text-foreground">
                            {func.function}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-sm">
                          {func.averageROI.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
