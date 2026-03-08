'use client';
import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Search } from 'lucide-react';

interface Anomaly {
  useCaseId: string;
  useCaseTitle: string;
  aiucId: number;
  category: string;
  variancePercent: number;
  message: string;
  reconciledAt: string;
  projectedImpact: number;
  severity: string;
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(num);
}

export default function AnomalyDashboardPage() {
  const router = useRouter();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function fetchAnomalies() {
      setLoading(true);
      try {
        const res = await fetch('/api/finops-dashboard/anomalies');
        if (!res.ok) throw new Error('Failed to fetch anomalies');
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      } catch {
        setError('Unable to load anomaly data.');
      }
      setLoading(false);
    }
    fetchAnomalies();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(anomalies.map((a) => a.category));
    return Array.from(cats).sort();
  }, [anomalies]);

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          a.useCaseTitle.toLowerCase().includes(s) ||
          a.category.toLowerCase().includes(s) ||
          a.message.toLowerCase().includes(s) ||
          `AIUC-${a.aiucId}`.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [anomalies, severityFilter, categoryFilter, search]);

  const severityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    anomalies.forEach((a) => {
      if (a.severity in counts) counts[a.severity as keyof typeof counts]++;
    });
    return counts;
  }, [anomalies]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button
              onClick={() => router.push('/dashboard/finops-dashboard')}
              className="hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              FinOps Dashboard
            </button>
            <span>/</span>
            <span>Anomalies</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Cost Anomalies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-portfolio view of all detected cost anomalies from reconciliation
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 rounded-md p-3">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">High Severity</p>
            <p className="text-2xl font-bold text-red-600">{severityCounts.high}</p>
          </Card>
          <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 rounded-md p-3">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">Medium Severity</p>
            <p className="text-2xl font-bold text-amber-600">{severityCounts.medium}</p>
          </Card>
          <Card className="border border-border bg-card rounded-md p-3">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">Low Severity</p>
            <p className="text-2xl font-bold text-foreground">{severityCounts.low}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border bg-card rounded-md p-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search anomalies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} anomal{filtered.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
        </Card>

        {/* Table */}
        {loading ? (
          <Card className="p-12 text-center border border-border bg-card rounded-md">
            <p className="text-sm text-muted-foreground">Loading anomalies...</p>
          </Card>
        ) : error ? (
          <Card className="p-6 border border-destructive bg-destructive/10 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center border border-border rounded-md">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm font-medium">No anomalies found</p>
              <p className="text-xs text-muted-foreground">
                {anomalies.length === 0
                  ? 'No cost anomalies have been detected across your portfolio.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                      Use Case
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">
                      Variance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">
                      Projected Impact (Annual)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((anomaly, i) => (
                    <tr
                      key={`${anomaly.useCaseId}-${anomaly.category}-${i}`}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/finops-dashboard/${anomaly.useCaseId}`)
                      }
                    >
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-[11px] font-mono">
                            AIUC-{anomaly.aiucId}
                          </span>
                          <span className="text-foreground text-sm font-medium">
                            {anomaly.useCaseTitle}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground capitalize">
                        {anomaly.category.replace(/_/g, ' ')}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${
                          anomaly.variancePercent > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {anomaly.variancePercent > 0 ? '+' : ''}
                        {anomaly.variancePercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-foreground">
                        {formatCurrency(anomaly.projectedImpact)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            anomaly.severity === 'high'
                              ? 'destructive'
                              : anomaly.severity === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[11px]"
                        >
                          {anomaly.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(anomaly.reconciledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
