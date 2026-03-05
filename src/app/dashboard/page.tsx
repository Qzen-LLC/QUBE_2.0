'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserContext';
import {
  Plus, Search, RefreshCw, AlertTriangle, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Info, X, Settings, ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUseCases, useDeleteUseCase, type MappedUseCase } from '@/hooks/useUseCases';

const PAGE_SIZE = 10;

const stages: Record<string, { label: string; className: string }> = {
  discovery: { label: 'Discovery', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  'proof-of-value': { label: 'Proof of Value', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  backlog: { label: 'Backlog', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  'in-progress': { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  'solution-validation': { label: 'Solution Validation', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  pilot: { label: 'Pilot', className: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
  deployment: { label: 'Deployment', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
  HIGH: { label: 'High Risk', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  LOW: { label: 'Low', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
};

const businessFunctions = [
  'Sales', 'Marketing', 'Product Development', 'Operations', 'Customer Support',
  'HR', 'Finance', 'IT', 'Legal', 'Procurement', 'Facilities', 'Strategy',
  'Communications', 'Risk & Audit', 'Innovation Office', 'ESG', 'Data Office', 'PMO',
];

const formatAiucId = (aiucId: string | number | undefined, id: string): string => {
  if (aiucId) {
    const s = String(aiucId);
    return s.startsWith('AIUC-') ? s : `AIUC-${s}`;
  }
  return `AIUC-${id}`;
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

type SortKey = 'aiucId' | 'title' | 'stage' | 'priority' | 'owner' | 'lastUpdated';
const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const Dashboard = () => {
  const router = useRouter();
  const { userData, loading: userLoading, error: userError, refetch: refetchUser } = useUserData();
  const { data: useCases = [], error, isLoading, refetch } = useUseCases();
  const deleteUseCaseMutation = useDeleteUseCase();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedBusinessFunction, setSelectedBusinessFunction] = useState('');
  const [deletingUseCaseId, setDeletingUseCaseId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('lastUpdated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [showTip, setShowTip] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filteredUseCases = useMemo(() => {
    let result = useCases;
    if (selectedBusinessFunction) result = result.filter((uc: any) => uc.businessFunction === selectedBusinessFunction);
    result = result.filter(uc => {
      const matchesSearch = uc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uc.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatAiucId(uc.aiucId, uc.id).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || (uc.priority && uc.priority.toLowerCase() === filterBy.toLowerCase());
      return matchesSearch && matchesFilter;
    });
    return result;
  }, [useCases, selectedBusinessFunction, searchTerm, filterBy]);

  const sortedUseCases = useMemo(() => {
    const sorted = [...filteredUseCases].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'aiucId':
          cmp = formatAiucId(a.aiucId, a.id).localeCompare(formatAiucId(b.aiucId, b.id));
          break;
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '');
          break;
        case 'stage':
          cmp = (a.stage || '').localeCompare(b.stage || '');
          break;
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case 'owner':
          cmp = (a.owner || '').localeCompare(b.owner || '');
          break;
        case 'lastUpdated':
          cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredUseCases, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedUseCases.length / pageSize));
  const pagedUseCases = sortedUseCases.slice(page * pageSize, (page + 1) * pageSize);
  const rangeStart = sortedUseCases.length === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, sortedUseCases.length);

  useEffect(() => { setPage(0); }, [searchTerm, filterBy, selectedBusinessFunction, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this use case? This action cannot be undone.')) return;
    if (!confirm('This action is irreversible. Are you absolutely certain?')) return;
    try {
      setDeletingUseCaseId(id);
      await deleteUseCaseMutation.mutateAsync(id);
      await refetch();
    } catch (err) {
      console.error('Error deleting use case:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete use case.');
    } finally {
      setDeletingUseCaseId(null);
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  };

  const activeFilterCount = [
    filterBy !== 'all',
    selectedBusinessFunction !== '',
  ].filter(Boolean).length;

  // --- Error / loading states ---

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md border border-border">
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Unable to load user data</h2>
            <p className="text-xs text-muted-foreground">{userError}</p>
            <Button size="sm" onClick={() => refetchUser()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md border border-border">
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Unable to load use cases</h2>
            <p className="text-xs text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading use cases\u2026' : 'Loading user data\u2026'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        {/* Page header */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Use Cases</h1>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Manage and track your organization&apos;s AI use cases
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                A use case is a real-world scenario describing how an AI system is applied within an organization to achieve a defined purpose or outcome.
              </p>
            </div>
            <Button onClick={() => router.push('/new-usecase')} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              New Use Case
            </Button>
          </div>
        </div>

        {/* Tip banner */}
        {showTip && (
          <div className="relative bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
            <button
              onClick={() => setShowTip(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3 pr-6">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Use Cases define where and how AI is used in your organization.
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Every AI deployment should have a documented use case. This creates visibility into AI activities and helps identify potential risks before deployment.
                  Start by documenting your most critical or highest-risk AI systems.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar: Filter, Search, Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-sm"
            onClick={() => setShowFilters(f => !f)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full w-4 h-4 inline-flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search use cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => refetch()} variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filter row (collapsible) */}
        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap bg-muted/30 border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Priority</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="h-8 px-3 text-xs border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Function</label>
              <select
                value={selectedBusinessFunction}
                onChange={(e) => setSelectedBusinessFunction(e.target.value)}
                className="h-8 px-3 text-xs border border-border rounded-md bg-background text-foreground min-w-[150px]"
              >
                <option value="">All</option>
                {businessFunctions.map((func) => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setFilterBy('all'); setSelectedBusinessFunction(''); }}
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Table card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden relative">
          {deletingUseCaseId && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <p className="text-sm font-medium text-foreground">Deleting use case&hellip;</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {([
                    ['aiucId', 'USE CASE ID', 'w-[130px]'],
                    ['title', 'USE CASE TITLE', 'min-w-[260px]'],
                    ['priority', 'AI RISK LEVEL', 'w-[140px]'],
                    ['owner', 'OWNER', 'w-[180px]'],
                    ['stage', 'STAGE', 'w-[160px]'],
                    ['lastUpdated', 'LAST UPDATED', 'w-[150px]'],
                  ] as [SortKey, string, string][]).map(([key, label, width]) => (
                    <th
                      key={key}
                      className={`px-5 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase cursor-pointer select-none hover:text-foreground transition-colors ${width}`}
                      onClick={() => toggleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        <SortIcon column={key} />
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 w-[60px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedUseCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No use cases found</p>
                        {searchTerm && (
                          <p className="text-xs text-muted-foreground/70">
                            Try adjusting your search or filters
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : pagedUseCases.map((uc) => (
                  <tr
                    key={uc.id}
                    className="group hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/${uc.id}`)}
                  >
                    <td className="px-5 py-3.5 font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {formatAiucId(uc.aiucId, uc.id)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-foreground line-clamp-1">
                        {uc.title}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {uc.priority && (
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold border ${priorityConfig[uc.priority]?.className || ''}`}
                        >
                          {priorityConfig[uc.priority]?.label || uc.priority}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground truncate max-w-[180px]">
                      {uc.owner}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium border ${stages[uc.stage]?.className || ''}`}
                      >
                        {stages[uc.stage]?.label || uc.stage}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(uc.updatedAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(uc.id); }}
                              disabled={deletingUseCaseId === uc.id}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/${uc.id}`); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Manage</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart} - {rangeEnd} of {sortedUseCases.length} use case{sortedUseCases.length !== 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Use cases per page</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 w-16 px-2 text-sm border border-border rounded-md bg-background text-foreground text-center"
                >
                  {[10, 20, 50].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
