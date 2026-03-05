'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useParams } from 'next/navigation';
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

// Number of months to forecast
const FORECAST_MONTHS = 36;

const MONTHS = Array.from({ length: FORECAST_MONTHS }, (_, i) => {
  const date = new Date();
  date.setDate(1); // Always first of month for consistency
  date.setMonth(date.getMonth() + i);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
});

function formatCurrency(num: number) {
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function formatPercent(num: number) {
  return num.toFixed(1) + '%';
}

// Helper for $K formatting
function formatK(num: number) {
  if (Math.abs(num) >= 1000) return `$${(num/1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

const FinancialDashboard = () => {
  const params = useParams();
  const useCaseId = params.useCaseId as string;
  // 6 Inputs
  const [initialDevCost, setInitialDevCost] = useState<number>(0);
  const [baseApiCost, setBaseApiCost] = useState<number>(0);
  const [baseInfraCost, setBaseInfraCost] = useState<number>(0);
  const [baseOpCost, setBaseOpCost] = useState<number>(0);
  const [baseMonthlyValue, setBaseMonthlyValue] = useState<number>(0);
  const [valueGrowthRate, setValueGrowthRate] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [_error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showFormulae, setShowFormulae] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!useCaseId) return;
    setLoading(true);
    fetch(`/api/get-finops?id=${useCaseId}&_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const d = data[0];
          if (d) {
            setInitialDevCost(d.devCostBase ?? 0);
            setBaseApiCost(d.apiCostBase ?? 0);
            setBaseInfraCost(d.infraCostBase ?? 0);
            setBaseOpCost(d.opCostBase ?? 0);
            setBaseMonthlyValue(d.valueBase ?? 0);
            setValueGrowthRate(d.valueGrowthRate ?? 0);
          }
        } else {
          setInitialDevCost(0);
          setBaseApiCost(0);
          setBaseInfraCost(0);
          setBaseOpCost(0);
          setBaseMonthlyValue(0);
          setValueGrowthRate(0);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [useCaseId]);

  // Calculations for 36 months
  const rows = useMemo(() => {
    let cumulativeValue = 0;
    let cumulativeOpCosts = 0;
    let breakEvenMonth = null;
    const result = [];
    for (let month = 1; month <= FORECAST_MONTHS; month++) {
      const apiCost = baseApiCost * Math.pow(1.12, month / 12);
      const infraCost = baseInfraCost * Math.pow(1.05, month / 12);
      const opCost = baseOpCost * Math.pow(1.08, month / 12);
      const totalMonthlyCost = apiCost + infraCost + opCost;
      const monthlyValue = baseMonthlyValue * Math.pow(1 + valueGrowthRate, month / 12);
      cumulativeValue += monthlyValue;
      cumulativeOpCosts += totalMonthlyCost;
      const totalInvestment = initialDevCost + cumulativeOpCosts;
      const _monthlyProfit = monthlyValue - totalMonthlyCost;
      const netValue = cumulativeValue - totalInvestment;
      const ROI = totalInvestment > 0 ? (netValue / totalInvestment) * 100 : 0;
      if (breakEvenMonth === null && netValue >= 0) breakEvenMonth = month;
      result.push({
        month,
        monthlyApiCost: apiCost,
        monthlyInfraCost: infraCost,
        monthlyOpCost: opCost,
        apiCost,
        infraCost,
        opCost,
        totalMonthlyCost,
        monthlyValue,
        cumulativeValue,
        cumulativeOpCosts,
        totalInvestment,
        monthlyProfit: _monthlyProfit,
        netValue,
        ROI,
      });
    }
    // Attach break-even month to all rows for summary
    return result.map(r => ({ ...r, breakEvenMonth }));
  }, [initialDevCost, baseApiCost, baseInfraCost, baseOpCost, baseMonthlyValue, valueGrowthRate]);

  const summary = useMemo(() => {
    const last = rows[FORECAST_MONTHS - 1] || {};
    return {
      totalInvestment: last.totalInvestment || 0,
      totalValue: last.cumulativeValue || 0,
      netROI: last.ROI || 0,
      breakEvenMonth: last.breakEvenMonth || '-',
      netValue: last.netValue || 0,
    };
  }, [rows]);

  // Cumulative Financial View Chart
  const cumulativeChartData = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Development Cost (One-time)',
        data: Array(FORECAST_MONTHS).fill(initialDevCost),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderDash: [10, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 3,
        tension: 0.1,
        showLine: true,
        type: 'line' as const,
      },
      {
        label: 'Cumulative Operating Costs',
        data: rows.map(r => r.cumulativeOpCosts),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.15)',
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 4,
        tension: 0.4,
        type: 'line' as const,
      },
      {
        label: 'Total Value Generated',
        data: rows.map(r => r.cumulativeValue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.15)',
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 4,
        tension: 0.4,
        type: 'line' as const,
      },
      {
        label: 'Net Profit/Loss',
        data: rows.map(r => r.netValue),
        borderColor: '#3b82f6',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const {ctx: canvasCtx, chartArea} = chart;
          if (!chartArea) return 'rgba(59,130,246,0.15)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59,130,246,0.05)');
          gradient.addColorStop(0.5, 'rgba(59,130,246,0.15)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.3)');
          return gradient;
        },
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 4,
        tension: 0.4,
        type: 'line' as const,
      },
      {
        label: 'Break-even Line',
        data: Array(FORECAST_MONTHS).fill(0),
        borderColor: '#6b7280',
        borderDash: [8, 8],
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
        type: 'line' as const,
        order: 0,
      },
    ]
  };
  const cumulativeChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: { 
        position: 'top' as const,
        align: 'center' as const,
        labels: { 
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 14, weight: 600 },
          color: isDarkMode ? '#ffffff' : '#1f2937',
          padding: 25,
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 16,
        padding: 20,
        bodySpacing: 10,
        titleSpacing: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (ctx: any) => `Month ${ctx[0].label} Financial Overview`,
          label: (ctx: any) => {
            const label = ctx.dataset.label || '';
            let value = ctx.parsed.y;
            if (label.includes('Value') || label.includes('Cost') || label.includes('Profit')) {
              value = formatCurrency(value);
            }
            let _color = ctx.dataset.borderColor;
            if (label.includes('Development')) _color = '#ff4d4f';
            if (label.includes('Cumulative')) _color = '#ff9900';
            if (label.includes('Lifetime')) _color = '#10b981';
            if (label.includes('Net')) _color = '#2563eb';
            return `${label}: ${value}`;
          },
        },
        bodyFont: { weight: 600, size: 14 },
        titleFont: { weight: 'bold' as const, size: 15 },
        boxPadding: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (tickValue: string | number) => formatK(Number(tickValue)),
          color: isDarkMode ? '#ffffff' : '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 12,
          maxTicksLimit: 8,
        },
        title: { 
          display: true,
          text: 'Financial Value ($)',
          color: isDarkMode ? '#ffffff' : '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 20, bottom: 10 }
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.15)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
      x: {
        title: { 
          display: true,
          text: 'Timeline (Months)',
          color: isDarkMode ? '#ffffff' : '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 15, bottom: 5 }
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 10,
          maxTicksLimit: 12,
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.08)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
    },
  }), [isDarkMode]);

  // Monthly Cost Breakdown (Stacked Area)
  const costBreakdownChart = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [
      {
        label: 'API Costs',
        data: rows.map(r => r.apiCost),
        borderColor: '#ef4444',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const {ctx: canvasCtx, chartArea} = chart;
          if (!chartArea) return 'rgba(239, 68, 68, 0.4)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
          return gradient;
        },
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 3,
        tension: 0.4,
        type: 'line' as const,
        stack: 'Stack 0',
      },
      {
        label: 'Infrastructure',
        data: rows.map(r => r.infraCost),
        borderColor: '#f97316',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const {ctx: canvasCtx, chartArea} = chart;
          if (!chartArea) return 'rgba(249, 115, 22, 0.4)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.1)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0.6)');
          return gradient;
        },
        fill: '-1',
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 3,
        tension: 0.4,
        type: 'line' as const,
        stack: 'Stack 0',
      },
      {
        label: 'Operations',
        data: rows.map(r => r.opCost),
        borderColor: '#eab308',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const {ctx: canvasCtx, chartArea} = chart;
          if (!chartArea) return 'rgba(234, 179, 8, 0.4)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(234, 179, 8, 0.1)');
          gradient.addColorStop(1, 'rgba(234, 179, 8, 0.6)');
          return gradient;
        },
        fill: '-1',
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: '#eab308',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderWidth: 3,
        tension: 0.4,
        type: 'line' as const,
        stack: 'Stack 0',
      },
    ]
  };
  const costBreakdownOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    animation: {
      duration: 1600,
      easing: 'easeInOutSine' as const,
    },
    plugins: {
      legend: { 
        position: 'top' as const,
        align: 'center' as const,
        labels: { 
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 14, weight: 600 },
          color: isDarkMode ? '#ffffff' : '#1f2937',
          padding: 25,
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 16,
        padding: 20,
        bodySpacing: 10,
        titleSpacing: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (ctx: any) => `Month ${ctx[0].label} Cost Breakdown`,
          label: (ctx: any) => {
            const label = ctx.dataset.label || '';
            let value = ctx.parsed.y;
            value = formatCurrency(value);
            let icon = '$';
            if (label.includes('API')) icon = 'API';
            if (label.includes('Infrastructure')) icon = 'Infra';
            if (label.includes('Operations')) icon = 'Ops';
            return `  ${icon} ${label}: ${value}`;
          },
        },
        bodyFont: { weight: 600, size: 14 },
        titleFont: { weight: 'bold' as const, size: 15 },
        boxPadding: 8,
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (tickValue: string | number) => formatK(Number(tickValue)),
          color: isDarkMode ? '#ffffff' : '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 12,
          maxTicksLimit: 8,
        },
        title: { 
          display: true,
          text: 'Monthly Costs ($)',
          color: isDarkMode ? '#ffffff' : '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 20, bottom: 10 }
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.15)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
      x: {
        title: { 
          display: true,
          text: 'Timeline (Months)',
          color: isDarkMode ? '#ffffff' : '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 15, bottom: 5 }
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 10,
          maxTicksLimit: 12,
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.08)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
    },
  }), [isDarkMode]);

  // Monthly Profit/Loss (Bar)
  const profitLossChart = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Monthly Profit/Loss',
        data: rows.map(r => r.monthlyProfit),
        backgroundColor: rows.map(r => {
          if (r.monthlyProfit >= 0) {
            return 'rgba(34, 197, 94, 0.85)';
          } else {
            return 'rgba(239, 68, 68, 0.85)';
          }
        }),
        borderColor: rows.map(r => {
          if (r.monthlyProfit >= 0) {
            return '#16a34a';
          } else {
            return '#dc2626';
          }
        }),
        borderWidth: 2,
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: ((r: any) => r.parsed.y < 0 ? 8 : 0) as any,
          bottomRight: ((r: any) => r.parsed.y < 0 ? 8 : 0) as any,
        },
        borderSkipped: false,
        barPercentage: 0.75,
        categoryPercentage: 0.85,
        hoverBackgroundColor: rows.map(r => {
          if (r.monthlyProfit >= 0) {
            return 'rgba(34, 197, 94, 1)';
          } else {
            return 'rgba(239, 68, 68, 1)';
          }
        }),
        hoverBorderColor: rows.map(r => {
          if (r.monthlyProfit >= 0) {
            return '#15803d';
          } else {
            return '#b91c1c';
          }
        }),
        hoverBorderWidth: 3,
      },
    ],
  };
  const profitLossOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    animation: {
      duration: 1800,
      easing: 'easeOutBounce' as const,
    },
    plugins: {
      legend: { 
        position: 'top' as const,
        align: 'center' as const,
        labels: { 
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: { size: 14, weight: 600 },
          color: isDarkMode ? '#ffffff' : '#1f2937',
          padding: 25,
          boxWidth: 15,
          boxHeight: 12,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 16,
        padding: 20,
        bodySpacing: 10,
        titleSpacing: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (ctx: any) => `Month ${ctx[0].label} Performance`,
          label: (ctx: any) => {
            let value = ctx.parsed.y;
            const isProfit = value >= 0;
            value = formatCurrency(value);
            const icon = isProfit ? 'Up' : 'Down';
            return `  ${icon} ${isProfit ? 'Profit' : 'Loss'}: ${value}`;
          },
        },
        bodyFont: { weight: 600, size: 14 },
        titleFont: { weight: 'bold' as const, size: 15 },
        boxPadding: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (tickValue: string | number) => formatK(Number(tickValue)),
          color: '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 12,
          maxTicksLimit: 8,
        },
        title: { 
          display: true,
          text: 'Monthly Profit/Loss ($)',
          color: '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 20, bottom: 10 }
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.15)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
      x: {
        title: { 
          display: true,
          text: 'Timeline (Months)',
          color: '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 15, bottom: 5 }
        },
        ticks: {
          color: '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 10,
          maxTicksLimit: 12,
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.08)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
    },
  };

  // ROI Trend
  const roiChart = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Return on Investment (%)',
        data: rows.map(r => r.ROI),
        borderColor: '#8b5cf6',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const {ctx: canvasCtx, chartArea} = chart;
          if (!chartArea) return 'rgba(139, 92, 246, 0.2)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
          gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.15)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.4)');
          return gradient;
        },
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 10,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointHoverBackgroundColor: '#7c3aed',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
        borderWidth: 4,
        tension: 0.4,
        type: 'line' as const,
      },
      {
        label: 'Break-even Line (0%)',
        data: Array(FORECAST_MONTHS).fill(0),
        borderColor: '#6b7280',
        borderDash: [12, 8],
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
        type: 'line' as const,
        order: 1,
      },
    ],
  };
  const roiOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    animation: {
      duration: 2200,
      easing: 'easeInOutElastic' as const,
    },
    plugins: {
      legend: { 
        position: 'top' as const,
        align: 'center' as const,
        labels: { 
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 14, weight: 600 },
          color: isDarkMode ? '#ffffff' : '#1f2937',
          padding: 25,
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 16,
        padding: 20,
        bodySpacing: 10,
        titleSpacing: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (ctx: any) => `Month ${ctx[0].label} ROI Analysis`,
          label: (ctx: any) => {
            const label = ctx.dataset.label || '';
            let value = ctx.parsed.y;
            if (label.includes('Return')) {
              const formatted = `${value.toFixed(1)}%`;
              const icon = value >= 0 ? 'Up' : 'Down';
              return `  ${icon} ${label}: ${formatted}`;
            }
            if (label.includes('Break-even')) return `  ${label}: 0%`;
            return `  ${label}: ${value}`;
          },
        },
        bodyFont: { weight: 600, size: 14 },
        titleFont: { weight: 'bold' as const, size: 15 },
        boxPadding: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (tickValue: string | number) => `${Number(tickValue).toFixed(0)}%`,
          color: '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 12,
          maxTicksLimit: 8,
        },
        title: { 
          display: true,
          text: 'Return on Investment (%)',
          color: '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 20, bottom: 10 }
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.15)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
      x: {
        title: { 
          display: true,
          text: 'Timeline (Months)',
          color: '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: { top: 15, bottom: 5 }
        },
        ticks: {
          color: '#6b7280',
          font: { size: 13, weight: 600 },
          padding: 10,
          maxTicksLimit: 12,
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.08)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: { display: false },
      },
    },
  };

  // Save handler: send forecast values to backend
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const last = rows[FORECAST_MONTHS - 1];
      const payload = {
        useCaseId,
        ROI: last.ROI,
        netValue: last.netValue,
        apiCostBase: baseApiCost,
        cumOpCost: last.cumulativeOpCosts,
        cumValue: last.cumulativeValue,
        devCostBase: initialDevCost,
        infraCostBase: baseInfraCost,
        opCostBase: baseOpCost,
        totalInvestment: last.totalInvestment,
        valueBase: baseMonthlyValue,
        valueGrowthRate: valueGrowthRate,
      };
      const res = await fetch('/api/update-finops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');

       // Refresh data from database after saving to ensure consistency
       try {
         const refreshRes = await fetch(`/api/get-finops?id=${useCaseId}&_t=${Date.now()}`);
         const data = await refreshRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const d = data[0];
          if (d) {
            setInitialDevCost(d.devCostBase ?? initialDevCost);
            setBaseApiCost(d.apiCostBase ?? baseApiCost);
            setBaseInfraCost(d.infraCostBase ?? baseInfraCost);
            setBaseOpCost(d.opCostBase ?? baseOpCost);
            setBaseMonthlyValue(d.valueBase ?? baseMonthlyValue);
            setValueGrowthRate(d.valueGrowthRate ?? valueGrowthRate);
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh data after save:', refreshError);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
                 <Button
           variant="outline"
           onClick={() => setShowFormulae(!showFormulae)}
           className="mb-4 text-dark dark:border-gray-600 dark:hover:bg-gray-700"
         >
          {showFormulae ? 'Hide Formula' : 'Show Formula'}
        </Button>
      </div>

      {showFormulae && (
        <Card className="p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Financial Formulas</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>API Cost Growth:</strong> baseApiCost × (1.12)^(month/12)</p>
            <p><strong>Infrastructure Cost Growth:</strong> baseInfraCost × (1.05)^(month/12)</p>
            <p><strong>Operational Cost Growth:</strong> baseOpCost × (1.08)^(month/12)</p>
            <p><strong>Monthly Value Growth:</strong> baseMonthlyValue × (1 + valueGrowthRate)^(month/12)</p>
            <p><strong>Total Investment:</strong> initialDevCost + Cumulative Operating Costs</p>
            <p><strong>Net Value:</strong> Cumulative Value - Total Investment</p>
            <p><strong>ROI:</strong> (Net Value / Total Investment) × 100%</p>
          </div>
        </Card>
      )}

      {success && (
        <div className="w-full text-center py-3 mb-4 rounded-xl bg-green-100 text-green-800 font-semibold border border-green-300 shadow-sm animate-fade-in">
          Forecast saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
                     <label className="font-semibold text-[#23235b] dark:text-blue-200">Initial Dev Cost</label>
          <Input 
            type="number" 
            value={initialDevCost} 
            min={0} 
            onChange={e => { setInitialDevCost(Number(e.target.value)); setSuccess(false); }} 
            onFocus={e => { if (e.target.value === '0') e.target.select(); }}
            className="w-full" 
          />
        </div>
        <div>
                     <label className="font-semibold text-[#23235b] dark:text-blue-200">Monthly API Cost</label>
          <Input 
            type="number" 
            value={baseApiCost} 
            min={0} 
            onChange={e => { setBaseApiCost(Number(e.target.value)); setSuccess(false); }} 
            onFocus={e => { if (e.target.value === '0') e.target.select(); }}
            className="w-full" 
          />
        </div>
        <div>
                     <label className="font-semibold text-[#23235b] dark:text-blue-200">Monthly Infrastructure</label>
          <Input 
            type="number" 
            value={baseInfraCost} 
            min={0} 
            onChange={e => { setBaseInfraCost(Number(e.target.value)); setSuccess(false); }} 
            onFocus={e => { if (e.target.value === '0') e.target.select(); }}
            className="w-full" 
          />
        </div>
        <div>
                     <label className="font-semibold text-[#23235b] dark:text-blue-200">Monthly Operations</label>
          <Input 
            type="number" 
            value={baseOpCost} 
            min={0} 
            onChange={e => { setBaseOpCost(Number(e.target.value)); setSuccess(false); }} 
            onFocus={e => { if (e.target.value === '0') e.target.select(); }}
            className="w-full" 
          />
        </div>
        <div>
                     <label className="font-semibold text-[#23235b] dark:text-blue-200">Monthly Value Generated</label>
          <Input 
            type="number" 
            value={baseMonthlyValue} 
            min={0} 
            onChange={e => { setBaseMonthlyValue(Number(e.target.value)); setSuccess(false); }} 
            onFocus={e => { if (e.target.value === '0') e.target.select(); }}
            className="w-full" 
          />
        </div>
        <div>
                     <label className="font-semibold text-[#23235b] dark:text-blue-200">Value Growth Rate (%)</label>
          <Input 
            type="number" 
            value={valueGrowthRate} 
            min={0} 
            max={100} 
            onChange={e => { setValueGrowthRate(Number(e.target.value)); setSuccess(false); }} 
            onFocus={e => { if (e.target.value === '0') e.target.select(); }}
            className="w-full" 
          />
        </div>
      </div>
      <Button className="mt-6 w-full bg-gradient-to-r from-[#8f4fff] via-[#b84fff] to-[#ff4fa3] hover:from-[#ff4fa3] hover:to-[#8f4fff] text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-lg transition" onClick={handleSave} disabled={saving}>Save Forecast</Button>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 justify-center">
        {[{
          value: formatCurrency(summary.totalInvestment),
          label: 'Total Investment'
        }, {
          value: formatCurrency(summary.totalValue),
          label: 'Total Value Generated'
        }, {
          value: formatPercent(summary.netROI),
          label: 'Net ROI'
        }, {
          value: `${summary.breakEvenMonth} months`,
          label: 'Break-even Month'
        }, {
          value: formatCurrency(summary.netValue),
          label: 'Net Value (Forecast)'
        }].map((item, idx) => (
                     <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center">
             <div className="text-3xl font-extrabold mb-1 text-purple-600 dark:text-purple-400">{item.value}</div>
             <div className="font-medium text-base text-purple-600 dark:text-purple-400">{item.label}</div>
           </div>
        ))}
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
          {/* ROI Analysis */}
                     <Card className="p-8 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                               <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">ROI Performance</h3>
               <p className="text-gray-600 dark:text-gray-300 text-sm">Return on investment trajectory</p>
              </div>
            </div>
                         <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-4 shadow-inner" style={{ height: 360 }}>
               <Line data={roiChart} options={roiOptions} />
             </div>
          </Card>

          {/* Cost Breakdown */}
                     <Card className="p-8 bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-gray-800 dark:via-orange-900/20 dark:to-red-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cost Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Monthly operational cost breakdown</p>
              </div>
            </div>
                         <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-4 shadow-inner" style={{ height: 360 }}>
               <Line data={costBreakdownChart} options={costBreakdownOptions} />
             </div>
          </Card>
        </div>

        {/* Profit/Loss Chart */}
                 <Card className="w-full mx-auto p-8 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Profit & Loss Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Track monthly profitability and break-even progression</p>
            </div>
          </div>
                     <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-6 shadow-inner" style={{ height: 420 }}>
            <Bar data={profitLossChart} options={profitLossOptions} />
          </div>
        </Card>
      </div>

             {/* Cost Structure Analysis */}
       <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cost Structure Analysis (Month 12)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Detailed breakdown of operational costs at the 1-year mark</p>
          </div>
        </div>
        
        {(() => {
          const m12 = rows[11];
          if (!m12) return null;
          const total = m12.totalMonthlyCost;
          const apiPct = total ? (m12.monthlyApiCost / total) * 100 : 0;
          const infraPct = total ? (m12.monthlyInfraCost / total) * 100 : 0;
          const opPct = total ? (m12.monthlyOpCost / total) * 100 : 0;
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center hover:shadow-md transition-all duration-200">
                 <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-xl text-white">API</span>
                 </div>
                 <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{formatCurrency(m12.monthlyApiCost)}</div>
                 <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">API Costs</div>
                 <div className="text-sm font-medium text-red-500 dark:text-red-400">{apiPct.toFixed(1)}% of total</div>
               </div>
                             <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6 text-center hover:shadow-md transition-all duration-200">
                 <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-xl text-white">Infra</span>
                 </div>
                 <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{formatCurrency(m12.monthlyInfraCost)}</div>
                 <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Infrastructure</div>
                 <div className="text-sm font-medium text-orange-500 dark:text-orange-400">{infraPct.toFixed(1)}% of total</div>
               </div>
                             <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 text-center hover:shadow-md transition-all duration-200">
                 <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-xl text-white">Ops</span>
                 </div>
                 <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">{formatCurrency(m12.monthlyOpCost)}</div>
                 <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Operations</div>
                 <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{opPct.toFixed(1)}% of total</div>
               </div>
                             <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center hover:shadow-md transition-all duration-200">
                 <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <span className="text-xl text-white">Total</span>
                 </div>
                 <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">{formatCurrency(total)}</div>
                 <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Total Monthly</div>
                 <div className="text-sm font-medium text-gray-600 dark:text-gray-400">100% combined</div>
               </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default FinancialDashboard; 