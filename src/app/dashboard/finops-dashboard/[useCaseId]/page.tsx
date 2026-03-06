'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler,
  Scale,
  CoreScaleOptions
} from 'chart.js';
import { ArrowLeft, RefreshCw, Info, Sparkles, Loader2, AlertTriangle, TrendingDown, TrendingUp, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { FinOpsReconciliationTab } from '@/components/architect/FinOpsReconciliationTab';
import { Badge } from '@/components/ui/badge';
import { computeForecastRows } from '@/lib/finops-forecast';

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

interface ReconciliationData {
  id: string;
  reconciledAt: string;
  source: string;
  totalProjected: number;
  totalActual: number;
  totalVariancePercent: number;
  varianceLines: Array<{
    category: string;
    projected: number;
    actual: number;
    variancePercent: number;
    status: string;
  }>;
  narrative: string;
}

export default function FinancialDashboard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const useCaseId = params.useCaseId as string;

  const [baseApiCost, setBaseApiCost] = useState<number>(0);
  const [baseInfraCost, setBaseInfraCost] = useState<number>(0);
  const [baseOpCost, setBaseOpCost] = useState<number>(0);
  const [baseMonthlyValue, setBaseMonthlyValue] = useState<number>(0);
  const [valueGrowthRate, setValueGrowthRate] = useState<number>(0);
  const [apiGrowthRate, setApiGrowthRate] = useState<number>(12);
  const [infraGrowthRate, setInfraGrowthRate] = useState<number>(5);
  const [opsGrowthRate, setOpsGrowthRate] = useState<number>(8);
  const [budgetRange, setBudgetRange] = useState<number>(0);
  const [showGrowthOverrides, setShowGrowthOverrides] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFormulae, setShowFormulae] = useState(false);
  const [useCaseDetails, setUseCaseDetails] = useState<{ title: string; aiucId: number } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [lastAggregatedAt, setLastAggregatedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [insights, setInsights] = useState<any[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [growthOverrides, setGrowthOverrides] = useState<any | null>(null);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);

  const fetchData = () => {
    if (!useCaseId) return;
    setLoading(true);

    // Fetch use case details
    fetch(`/api/get-usecase?id=${useCaseId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUseCaseDetails({ title: data.title, aiucId: data.aiucId });
          if (data.budgetRange) setBudgetRange(Number(data.budgetRange) || 0);
        }
      })
      .catch(console.error);

    // Fetch finops data
    fetch(`/api/get-finops?id=${useCaseId}&_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const d = data[0];
          if (d) {
            setBaseApiCost(d.apiCostBase ?? 0);
            setBaseInfraCost(d.infraCostBase ?? 0);
            setBaseOpCost(d.opCostBase ?? 0);
            setBaseMonthlyValue(d.valueBase ?? 0);
            setValueGrowthRate(d.valueGrowthRate ?? 0);
            setSource(d.source ?? null);
            setLastAggregatedAt(d.lastAggregatedAt ?? null);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch latest reconciliation
    fetch(`/api/production/finops/reconcile/latest/${useCaseId}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && !data.error) setReconciliationData(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, [useCaseId, pathname]);

  // Track theme to make charts dark-mode aware
  useEffect(() => {
    const getIsDark = () => {
      try {
        const saved = (localStorage.getItem('theme') || 'system') as 'light' | 'dark' | 'system';
        const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return (
          saved === 'dark' ||
          (saved === 'system' && systemDark) ||
          document.documentElement.classList.contains('dark') ||
          document.body.classList.contains('dark')
        );
      } catch {
        return false;
      }
    };

    const update = () => setIsDark(getIsDark());
    update();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') update();
    };
    window.addEventListener('storage', onStorage);

    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('storage', onStorage);
      mo.disconnect();
    };
  }, []);

  const rows = useMemo(() => {
    return computeForecastRows({
      devCostBase: 0,
      apiCostBase: baseApiCost,
      infraCostBase: baseInfraCost,
      opCostBase: baseOpCost,
      valueBase: baseMonthlyValue,
      valueGrowthRate,
      overrideApiGrowthRate: apiGrowthRate / 100,
      overrideInfraGrowthRate: infraGrowthRate / 100,
      overrideOpsGrowthRate: opsGrowthRate / 100,
    });
  }, [baseApiCost, baseInfraCost, baseOpCost, baseMonthlyValue, valueGrowthRate, apiGrowthRate, infraGrowthRate, opsGrowthRate]);

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

  const reconciliationFinopsOutput = useMemo(() => {
    if (!baseApiCost && !baseInfraCost && !baseOpCost) return null;
    return {
      lineItems: [
        { category: 'api_costs', monthlyCostMid: baseApiCost, sourcePillar: 'finops' },
        { category: 'infrastructure', monthlyCostMid: baseInfraCost, sourcePillar: 'finops' },
        { category: 'operations', monthlyCostMid: baseOpCost, sourcePillar: 'finops' },
      ],
      totalMonthlyCost: baseApiCost + baseInfraCost + baseOpCost,
      totalAnnualCost: (baseApiCost + baseInfraCost + baseOpCost) * 12,
    };
  }, [baseApiCost, baseInfraCost, baseOpCost]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const last = rows[FORECAST_MONTHS - 1];
      const newSource = source === 'assessment' ? 'hybrid' : (source || 'manual');
      const payload = {
        useCaseId,
        ROI: last.ROI,
        netValue: last.netValue,
        apiCostBase: baseApiCost,
        cumOpCost: last.cumulativeOpCosts,
        cumValue: last.cumulativeValue,
        devCostBase: 0,
        infraCostBase: baseInfraCost,
        opCostBase: baseOpCost,
        totalInvestment: last.totalInvestment,
        valueBase: baseMonthlyValue,
        valueGrowthRate: valueGrowthRate,
        source: newSource,
      };
      const res = await fetch('/api/update-finops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');

      setSource(newSource);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save');
    }
    setSaving(false);
  };

  const handleResync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await fetch('/api/finops-aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, force: true }),
      });
      if (!res.ok) throw new Error('Re-sync failed');
      fetchData();
    } catch {
      setError('Failed to re-sync from assessment');
    }
    setSyncing(false);
  };

  // Chart configurations
  const cumulativeChartData = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Cumulative Running Costs',
        data: rows.map(r => r.cumulativeOpCosts),
        borderColor: '#ff9900',
        backgroundColor: 'rgba(255,153,0,0.15)',
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: '#ff9900',
        borderWidth: 2,
        tension: 0.1,
        type: 'line' as const,
      },
      {
        label: 'Total Lifetime Value',
        data: rows.map(r => r.cumulativeValue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        borderWidth: 2,
        tension: 0.1,
        type: 'line' as const,
      },
      {
        label: 'Net Value (Profit/Loss)',
        data: rows.map(r => r.netValue),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
        borderWidth: 2,
        tension: 0.1,
        type: 'line' as const,
      },
      {
        label: 'Break-even Line',
        data: Array(FORECAST_MONTHS).fill(0),
        borderColor: '#888',
        borderDash: [6, 6],
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        type: 'line' as const,
        order: 0,
      },
    ]
  };

  const roiChart = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [{
      label: 'ROI %',
      data: rows.map(r => r.ROI),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      borderWidth: 2,
      tension: 0.1,
    }]
  };

  const axisColors = useMemo(() => ({
    tick: isDark ? '#e5e7eb' : '#222',
    grid: isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
  }), [isDark]);

  const roiOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: axisColors.tick } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `ROI: ${formatPercent(ctx.parsed.y)}`,
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        ticks: {
          callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
            return formatPercent(Number(tickValue));
          },
          color: axisColors.tick,
        },
        grid: { color: axisColors.grid },
      },
      x: {
        grid: { color: axisColors.grid },
      }
    }
  } as const;

  const costBreakdownChart = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [
      {
        label: 'API Costs',
        data: rows.map(r => r.apiCost),
        borderColor: '#ff4d4f',
        backgroundColor: 'rgba(255,77,79,0.1)',
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ff4d4f',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Infrastructure',
        data: rows.map(r => r.infraCost),
        borderColor: '#ff9900',
        backgroundColor: 'rgba(255,153,0,0.1)',
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ff9900',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Operations',
        data: rows.map(r => r.opCost),
        borderColor: '#faad14',
        backgroundColor: 'rgba(250,173,20,0.1)',
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#faad14',
        borderWidth: 2,
        tension: 0.1,
      }
    ]
  };

  const costBreakdownOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: axisColors.tick } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        ticks: {
          callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
            return formatK(Number(tickValue));
          },
          color: axisColors.tick,
        },
        grid: { color: axisColors.grid },
      },
      x: {
        grid: { color: axisColors.grid },
      }
    }
  } as const;

  const profitLossChart = {
    labels: MONTHS.map((_, i) => i + 1),
    datasets: [{
      label: 'Monthly Profit/Loss',
      data: rows.map(r => r.monthlyProfit),
      backgroundColor: rows.map(r => r.monthlyProfit >= 0 ? 'rgba(16,185,129,0.6)' : 'rgba(255,77,79,0.6)'),
      borderColor: rows.map(r => r.monthlyProfit >= 0 ? '#10b981' : '#ff4d4f'),
      borderWidth: 1,
    }]
  };

  const profitLossOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: axisColors.tick } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        ticks: {
          callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
            return formatK(Number(tickValue));
          },
          color: axisColors.tick,
        },
        grid: { color: axisColors.grid },
      },
      x: {
        grid: { color: axisColors.grid },
      }
    }
  } as const;

  const cumulativeChartOptions = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, color: axisColors.tick } },
      tooltip: {
        callbacks: {
          title: (ctx: any) => `Month ${ctx[0].label}`,
          label: (ctx: any) => {
            const label = ctx.dataset.label || '';
            let value = ctx.parsed.y;
            if (label.includes('Value') || label.includes('Cost') || label.includes('Profit')) {
              value = formatCurrency(value);
            }
            return `${label}: ${value}`;
          },
          labelTextColor: (ctx: any) => ctx.dataset.borderColor,
        },
        displayColors: false,
        bodyFont: { weight: 'bold' as const },
        titleFont: { weight: 'bold' as const },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        ticks: {
          callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
            return formatK(Number(tickValue));
          },
          color: axisColors.tick,
          font: { weight: 'bold' as const },
        },
        title: { display: false },
        grid: { color: axisColors.grid },
      },
      x: {
        type: 'linear' as const,
        grid: { color: axisColors.grid },
      },
    },
  } as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="mt-3 text-sm text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <button onClick={() => router.push('/dashboard/finops-dashboard')} className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            FinOps Dashboard
          </button>
          <span>/</span>
          <span>AIUC-{useCaseDetails?.aiucId ?? '...'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">
              {useCaseDetails?.title ?? 'FinOps Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">36-month financial forecast and cost analysis</p>
          </div>
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => setShowFormulae(true)}
          >
            View Formulae
          </button>
        </div>
      </div>

      {/* Formulae Modal */}
      {showFormulae && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40">
          <div className="bg-card rounded-xl shadow-2xl p-8 max-w-lg w-full relative border border-border">
            <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xl" onClick={() => setShowFormulae(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-foreground">Financial Formulae</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><b>LLM / API Cost Growth:</b> <code>monthlyApiCost(m) = base × (1 + apiRate)<sup>m/12</sup></code></li>
              <li><b>Infrastructure Cost Growth:</b> <code>monthlyInfraCost(m) = base × (1 + infraRate)<sup>m/12</sup></code></li>
              <li><b>Operations Cost Growth:</b> <code>monthlyOpCost(m) = base × (1 + opsRate)<sup>m/12</sup></code></li>
              <li><b>Total Monthly Cost:</b> <code>api + infra + ops</code></li>
              <li><b>Monthly Value:</b> <code>valueBase × (1 + valueGrowthRate)<sup>m/12</sup></code></li>
              <li><b>Net Value:</b> <code>Σ value − Σ costs</code></li>
              <li><b>ROI:</b> <code>(netValue / totalInvestment) × 100</code></li>
              <li><b>Break-even:</b> first month where netValue ≥ 0</li>
            </ul>
          </div>
        </div>
      )}

      {/* Source provenance banner */}
      {(source === 'assessment' || source === 'hybrid') && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              {source === 'assessment'
                ? 'Auto-calculated from Pillar 6 (FinOps Assessment) answers.'
                : 'Originally from assessment, modified manually.'}
              {lastAggregatedAt && (
                <span className="ml-1 text-blue-500 dark:text-blue-400">
                  Last synced: {new Date(lastAggregatedAt).toLocaleString()}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={handleResync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Re-sync from Assessment'}
          </button>
        </div>
      )}

      {/* Card 1: Cost Parameters */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">Cost Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Monthly LLM / API Cost</label>
            <Input
              type="number"
              value={baseApiCost}
              min={0}
              onChange={e => setBaseApiCost(Number(e.target.value))}
              onFocus={e => { if (e.target.value === '0') e.target.select(); }}
              className="w-full mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Include all LLM inference costs — for agentic use cases, account for multiple calls per session (tool calls, reasoning steps, retries)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Monthly Infrastructure</label>
            <Input
              type="number"
              value={baseInfraCost}
              min={0}
              onChange={e => setBaseInfraCost(Number(e.target.value))}
              onFocus={e => { if (e.target.value === '0') e.target.select(); }}
              className="w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Monthly Operations</label>
            <Input
              type="number"
              value={baseOpCost}
              min={0}
              onChange={e => setBaseOpCost(Number(e.target.value))}
              onFocus={e => { if (e.target.value === '0') e.target.select(); }}
              className="w-full mt-1"
            />
          </div>
        </div>
        {/* Collapsible Growth Rate Overrides */}
        <button
          onClick={() => setShowGrowthOverrides(!showGrowthOverrides)}
          className="flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showGrowthOverrides ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Growth Rate Overrides
        </button>
        {showGrowthOverrides && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Growth (%/yr)</label>
              <Input
                type="number"
                value={apiGrowthRate}
                min={0}
                max={100}
                onChange={e => setApiGrowthRate(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Infra Growth (%/yr)</label>
              <Input
                type="number"
                value={infraGrowthRate}
                min={0}
                max={100}
                onChange={e => setInfraGrowthRate(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ops Growth (%/yr)</label>
              <Input
                type="number"
                value={opsGrowthRate}
                min={0}
                max={100}
                onChange={e => setOpsGrowthRate(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Card 2: Value & Budget */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">Value & Budget</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Monthly Value Generated</label>
            <Input
              type="number"
              value={baseMonthlyValue}
              min={0}
              onChange={e => setBaseMonthlyValue(Number(e.target.value))}
              onFocus={e => { if (e.target.value === '0') e.target.select(); }}
              className="w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Value Growth Rate (%)</label>
            <Input
              type="number"
              value={valueGrowthRate}
              min={0}
              max={100}
              onChange={e => setValueGrowthRate(Number(e.target.value))}
              onFocus={e => { if (e.target.value === '0') e.target.select(); }}
              className="w-full mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Year 1 Budget</label>
            <Input
              type="number"
              value={budgetRange}
              readOnly
              className="w-full mt-1 bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">From assessment data</p>
          </div>
        </div>
      </Card>

      {/* Save button + status */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Forecast'}
        </Button>
        {success && <span className="text-sm text-green-600 dark:text-green-400">Saved successfully</span>}
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <Card key={idx} className="p-6 dark:bg-gray-900 dark:border-gray-800 flex flex-col items-center">
            <div className="text-2xl font-bold mb-1 text-foreground">{item.value}</div>
            <div className="font-medium text-sm text-muted-foreground">{item.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">Cumulative Financial View</h2>
        <div style={{ height: 360 }}>
          <Line data={cumulativeChartData} options={cumulativeChartOptions} />
        </div>
      </Card>

      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">ROI Trend</h2>
        <div style={{ height: 360 }}>
          <Line data={roiChart} options={roiOptions} />
        </div>
      </Card>

      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">Monthly Cost Breakdown</h2>
        <div style={{ height: 360 }}>
          <Line data={costBreakdownChart} options={costBreakdownOptions} />
        </div>
      </Card>

      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">Monthly Profit/Loss</h2>
        <div style={{ height: 360 }}>
          <Bar data={profitLossChart} options={profitLossOptions} />
        </div>
      </Card>

      {/* Cost Structure Verification (Month 12) */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-base font-semibold text-foreground mb-4">Cost Structure Verification (Month 12)</h2>
        {(() => {
          const m12 = rows[11];
          if (!m12) return null;
          const total = m12.totalMonthlyCost;
          const apiPct = total ? (m12.apiCost / total) * 100 : 0;
          const infraPct = total ? (m12.infraCost / total) * 100 : 0;
          const opPct = total ? (m12.opCost / total) * 100 : 0;
          return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-500">{formatCurrency(m12.apiCost)}</div>
                <div className="text-sm font-medium text-foreground mt-1">API Costs</div>
                <div className="text-xs text-red-400 mt-1">{apiPct.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{formatCurrency(m12.infraCost)}</div>
                <div className="text-sm font-medium text-foreground mt-1">Infrastructure</div>
                <div className="text-xs text-orange-400 mt-1">{infraPct.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-700">{formatCurrency(m12.opCost)}</div>
                <div className="text-sm font-medium text-foreground mt-1">Operations</div>
                <div className="text-xs text-yellow-600 mt-1">{opPct.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(total)}</div>
                <div className="text-sm font-medium text-foreground mt-1">Total Monthly</div>
                <div className="text-xs text-muted-foreground mt-1">100%</div>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Reconciliation Comparison Panel */}
      {reconciliationData && reconciliationData.totalProjected != null && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Cost Reconciliation</h2>
            <div className="text-xs text-muted-foreground">
              Last reconciled: {new Date(reconciliationData.reconciledAt).toLocaleString()}
              {reconciliationData.source && <span className="ml-2">· {reconciliationData.source}</span>}
            </div>
          </div>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground">Total Projected</div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(reconciliationData.totalProjected)}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground">Total Actual</div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(reconciliationData.totalActual)}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground">Overall Variance</div>
              <div className={`text-lg font-bold ${reconciliationData.totalVariancePercent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {reconciliationData.totalVariancePercent > 0 ? '+' : ''}{formatPercent(reconciliationData.totalVariancePercent)}
              </div>
            </div>
          </div>
          {/* Per-category table */}
          {reconciliationData.varianceLines && reconciliationData.varianceLines.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Category</th>
                    <th className="text-right py-2 font-medium">Projected</th>
                    <th className="text-right py-2 font-medium">Actual</th>
                    <th className="text-right py-2 font-medium">Variance</th>
                    <th className="text-right py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliationData.varianceLines.map((line: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 capitalize">{(line.category ?? '').replace(/_/g, ' ')}</td>
                      <td className="py-2 text-right">{formatCurrency(line.projectedMonthly ?? 0)}</td>
                      <td className="py-2 text-right">{formatCurrency(line.actualMonthly ?? 0)}</td>
                      <td className={`py-2 text-right ${(line.variancePercent ?? 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {(line.variancePercent ?? 0) > 0 ? '+' : ''}{formatPercent(line.variancePercent ?? 0)}
                      </td>
                      <td className="py-2 text-right">
                        <Badge variant={
                          line.status === 'over_budget' || line.status === 'anomaly' ? 'destructive' :
                          line.status === 'under_budget' ? 'secondary' : 'outline'
                        }>
                          {(line.status ?? 'unknown').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {reconciliationData.narrative && (
            <p className="text-sm text-muted-foreground">{reconciliationData.narrative}</p>
          )}
        </Card>
      )}

      {/* Run Reconciliation */}
      {reconciliationFinopsOutput && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-base font-semibold text-foreground mb-4">Run Reconciliation</h2>
          <FinOpsReconciliationTab
            finopsOutput={reconciliationFinopsOutput}
            useCaseId={useCaseId}
          />
        </Card>
      )}

      {/* AI FinOps Insights */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            AI FinOps Insights
          </h2>
          <Button
            variant="outline"
            size="sm"
            disabled={insightsLoading}
            onClick={async () => {
              setInsightsLoading(true);
              setInsightsError(null);
              try {
                const res = await fetch(`/api/finops-dashboard/${useCaseId}/generate-insights`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || data.message || 'Failed');
                }
                const data = await res.json();
                setInsights(data.insights);
                setGrowthOverrides(data.growthRateOverrides);
              } catch (err: any) {
                setInsightsError(err.message);
              } finally {
                setInsightsLoading(false);
              }
            }}
          >
            {insightsLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate Insights</>
            )}
          </Button>
        </div>

        {insightsError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md text-sm mb-4">
            {insightsError}
          </div>
        )}

        {!insights && !insightsLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click &quot;Generate Insights&quot; to get AI-powered cost optimization recommendations
          </p>
        )}

        {insights && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight: any, idx: number) => (
              <div key={idx} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {insight.category === 'optimization' && <TrendingDown className="h-4 w-4 text-green-600" />}
                    {insight.category === 'hidden_cost' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {insight.category === 'growth_adjustment' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    {insight.category === 'roi_validation' && <Eye className="h-4 w-4 text-purple-500" />}
                    {insight.category === 'risk' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium">{insight.title}</span>
                  </div>
                  <Badge variant={
                    insight.impact === 'high' ? 'destructive' :
                    insight.impact === 'medium' ? 'secondary' : 'outline'
                  }>
                    {insight.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.estimatedSavings && (
                  <p className="text-sm text-green-600 mt-1">Estimated savings: {insight.estimatedSavings}</p>
                )}
                {insight.suggestedAction && (
                  <p className="text-sm text-blue-600 mt-1">Action: {insight.suggestedAction}</p>
                )}
              </div>
            ))}

            {growthOverrides && (
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Suggested Growth Rate Adjustments
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {growthOverrides.apiGrowthRate != null && (
                    <div>
                      <span className="text-muted-foreground">API:</span>{' '}
                      <span className="font-medium">{(growthOverrides.apiGrowthRate * 100).toFixed(0)}%/yr</span>
                      <span className="text-xs text-muted-foreground ml-1">(default: 12%)</span>
                    </div>
                  )}
                  {growthOverrides.infraGrowthRate != null && (
                    <div>
                      <span className="text-muted-foreground">Infra:</span>{' '}
                      <span className="font-medium">{(growthOverrides.infraGrowthRate * 100).toFixed(0)}%/yr</span>
                      <span className="text-xs text-muted-foreground ml-1">(default: 5%)</span>
                    </div>
                  )}
                  {growthOverrides.opsGrowthRate != null && (
                    <div>
                      <span className="text-muted-foreground">Ops:</span>{' '}
                      <span className="font-medium">{(growthOverrides.opsGrowthRate * 100).toFixed(0)}%/yr</span>
                      <span className="text-xs text-muted-foreground ml-1">(default: 8%)</span>
                    </div>
                  )}
                </div>
                {growthOverrides.reasoning && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{growthOverrides.reasoning}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
