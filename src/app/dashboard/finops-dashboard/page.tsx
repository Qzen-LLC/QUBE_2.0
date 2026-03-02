'use client';
import { useEffect, useState, useMemo } from "react";
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useStableRender } from '@/hooks/useStableRender';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from 'react-chartjs-2';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(num);
}

type FilterColumn = 'breakEvenMonth' | 'totalInvestment' | 'ROI' | 'none';
type SortDirection = 'asc' | 'desc';

interface UseCase {
  title: string;
  owner: string;
  stage: string;
  aiucId: number;
}

interface FinOpsData {
  useCaseId: string;
  ROI: number;
  netValue: number;
  apiCostBase: number;
  cumOpCost: number;
  cumValue: number;
  devCostBase: number;
  infraCostBase: number;
  opCostBase: number;
  totalInvestment: number;
  valueBase: number;
  valueGrowthRate: number;
  breakEvenMonth?: number;
  organizationName?: string;
  useCase?: UseCase;
}

export default function FinOpsDashboardPage() {
  const router = useRouter();
  const { isReady } = useStableRender();
  const [finops, setFinops] = useState<FinOpsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState<FilterColumn>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtering & Sorting ------------------------------------------------------
  const filteredFinops = useMemo(() => {
    let result = finops.filter(f =>
      f.useCase?.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.useCase?.owner || "").toLowerCase().includes(search.toLowerCase())
    );

    if (filterColumn !== "none") {
      result.sort((a, b) => {
        const aValue = (a[filterColumn] ?? 0) as number;
        const bValue = (b[filterColumn] ?? 0) as number;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
    }

    return result;
  }, [finops, search, filterColumn, sortDirection]);

  // Pagination ---------------------------------------------------------------
  const totalPages = Math.ceil(filteredFinops.length / itemsPerPage);
  const paginatedFinops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFinops.slice(start, start + itemsPerPage);
  }, [filteredFinops, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [search, filterColumn, sortDirection]);

  // Summary Metrics ----------------------------------------------------------
  const summary = useMemo(() => {
    const count = filteredFinops.length;
    if (count === 0)
      return {
        totalInvestment: 0,
        totalNetValue: 0,
        avgROI: 0,
        totalUseCases: 0,
        positiveROI: 0,
        negativeROI: 0
      };

    const totalInvestment = filteredFinops.reduce((s, x) => s + x.totalInvestment, 0);
    const totalNet = filteredFinops.reduce((s, x) => s + x.netValue, 0);
    const avgROI = filteredFinops.reduce((s, x) => s + x.ROI, 0) / count;

    return {
      totalInvestment,
      totalNetValue: totalNet,
      avgROI,
      totalUseCases: count,
      positiveROI: filteredFinops.filter(x => x.ROI > 0).length,
      negativeROI: filteredFinops.filter(x => x.ROI <= 0).length
    };
  }, [filteredFinops]);

  // Chart Data (Enterprise colors)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true },
      x: {
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
      }
    }
  };

  const roiDistributionData = useMemo(() => {
    const bins = [
      { label: "< 0%", cond: (x: number) => x < 0 },
      { label: "0–50%", cond: (x: number) => x >= 0 && x < 50 },
      { label: "50–100%", cond: (x: number) => x >= 50 && x < 100 },
      { label: "100–200%", cond: (x: number) => x >= 100 && x < 200 },
      { label: "> 200%", cond: (x: number) => x >= 200 }
    ];
    const dataset = bins.map(b =>
      filteredFinops.filter(f => b.cond(f.ROI)).length
    );
    return {
      labels: bins.map(b => b.label),
      datasets: [
        {
          label: "Count",
          data: dataset,
          backgroundColor: "rgba(100, 116, 139, 0.6)", // slate-500 muted
          borderColor: "rgba(100, 116, 139, 1)"
        }
      ]
    };
  }, [filteredFinops]);

  const topInvestmentData = useMemo(() => {
    const top = [...filteredFinops]
      .sort((a, b) => b.totalInvestment - a.totalInvestment)
      .slice(0, 10);
    return {
      labels: top.map(x => `AIUC-${x.useCase?.aiucId}`),
      datasets: [
        {
          label: "Investment",
          data: top.map(x => x.totalInvestment),
          backgroundColor: "rgba(71, 85, 105, 0.6)", // slate-600
          borderColor: "rgba(71, 85, 105, 1)"
        }
      ]
    };
  }, [filteredFinops]);

  const topROIData = useMemo(() => {
    const top = [...filteredFinops].sort((a, b) => b.ROI - a.ROI).slice(0, 10);
    return {
      labels: top.map(x => `AIUC-${x.useCase?.aiucId}`),
      datasets: [
        {
          label: "ROI",
          data: top.map(x => x.ROI),
          backgroundColor: top.map((x) => x.ROI >= 0 ? "rgba(34, 197, 94, 0.6)" : "rgba(239,68,68,0.6)"),
          borderColor: top.map((x) => x.ROI >= 0 ? "rgba(34, 197, 94, 1)" : "rgba(239,68,68,1)")
        }
      ]
    };
  }, [filteredFinops]);

  // Fetch data --------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;

    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/finops-dashboard');
        if (!res.ok) throw new Error("Failed to fetch FinOps data");
        const data = await res.json();
        setFinops(data.finops || []);
      } catch (error) {
        setError('Unable to load financial data.');
      }
      setLoading(false);
    }

    fetchData();
  }, [isReady]);

  const handleRowClick = (id: string) =>
    router.push(`/dashboard/finops-dashboard/${id}`);

  if (!isReady)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );

  // ---------------------------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* KPI Cards (Power BI style) */}
        {!loading && !error && filteredFinops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Investment */}
            <Card className="border border-border bg-card rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground mb-1">
                    Total Investment
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(summary.totalInvestment)}
                  </p>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>

            {/* Total Net Value */}
            <Card className="border border-border bg-card rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground mb-1">
                    Net Value Generated
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(summary.totalNetValue)}
                  </p>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>

            {/* Avg ROI */}
            <Card className="border border-border bg-card rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground mb-1">
                    Average ROI
                  </p>
                  <p className="text-lg font-semibold">
                    {summary.avgROI.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>

            {/* Number of Use Cases */}
            <Card className="border border-border bg-card rounded-md p-3">
              <div>
                <p className="text-[11px] uppercase text-muted-foreground mb-1">
                  Use Cases Analyzed
                </p>
                <p className="text-lg font-semibold">
                  {summary.totalUseCases}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {summary.positiveROI} positive, {summary.negativeROI} negative
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Charts */}
        {!loading && !error && filteredFinops.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="p-3 border border-border bg-card rounded-md">
              <p className="text-sm font-medium mb-2">ROI Distribution</p>
              <div className="h-64">
                <Bar data={roiDistributionData} options={chartOptions} />
              </div>
            </Card>

            <Card className="p-3 border border-border bg-card rounded-md">
              <p className="text-sm font-medium mb-2">Top Investments</p>
              <div className="h-64">
                <Bar data={topInvestmentData} options={chartOptions} />
              </div>
            </Card>

            <Card className="p-3 border border-border bg-card rounded-md lg:col-span-2">
              <p className="text-sm font-medium mb-2">Highest ROI Use Cases</p>
              <div className="h-64">
                <Bar data={topROIData} options={chartOptions} />
              </div>
            </Card>
          </div>
        )}

        {/* Search + Filters (Enterprise ribbon) */}
        <Card className="border border-border bg-card rounded-md p-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <Input
              placeholder="Search by use case or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />

            <div className="flex items-center gap-2">
              <Select
                value={filterColumn}
                onValueChange={(v) => setFilterColumn(v as FilterColumn)}
              >
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sort by...</SelectItem>
                  <SelectItem value="totalInvestment">Investment</SelectItem>
                  <SelectItem value="ROI">ROI</SelectItem>
                  <SelectItem value="breakEvenMonth">Break-even Month</SelectItem>
                </SelectContent>
              </Select>
              {filterColumn !== "none" && (
                <Select
                  value={sortDirection}
                  onValueChange={(v) => setSortDirection(v as SortDirection)}
                >
                  <SelectTrigger className="w-[120px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {filteredFinops.length} results
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              {filterColumn !== "none" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setFilterColumn("none");
                    setSortDirection("desc");
                    setSearch("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Table Section */}
        {loading ? (
          <Card className="p-12 text-center border border-border bg-card rounded-md">
            <p className="text-sm text-muted-foreground">Loading data…</p>
          </Card>
        ) : error ? (
          <Card className="p-6 border border-destructive bg-destructive/10 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        ) : filteredFinops.length === 0 ? (
          <Card className="p-10 text-center border border-border rounded-md">
            <div className="flex flex-col items-center gap-3">
              <BarChart3 className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm font-medium">No results</p>
              <p className="text-xs text-muted-foreground">
                Your filters returned no data.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border border-border rounded-md overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Use Case</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Owner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Stage</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Investment</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Net Value</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">ROI (%)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedFinops.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => handleRowClick(item.useCaseId)}
                    >
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-[11px] font-mono">
                            AIUC-{item.useCase?.aiucId}
                          </span>
                          <span className="text-foreground text-sm font-medium">
                            {item.useCase?.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.useCase?.owner || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-sm px-2 py-0.5 text-[11px] bg-muted text-muted-foreground border border-border">
                          {item.useCase?.stage || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-foreground">
                        {formatCurrency(item.totalInvestment)}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs text-right font-medium ${
                          item.netValue >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(item.netValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs text-right font-medium ${
                          item.ROI >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.ROI >= 0 ? "+" : ""}
                        {item.ROI.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-xs text-right text-foreground">
                        {(item.valueGrowthRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-muted border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredFinops.length)} of {filteredFinops.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                  className="h-8 text-xs px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  )
                  .map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 text-xs min-w-[32px]"
                    >
                      {page}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                  className="h-8 text-xs px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
