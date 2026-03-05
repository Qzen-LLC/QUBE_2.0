'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Building,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserData } from '@/contexts/UserContext';

interface Threat {
  id: string;
  title: string;
  description: string;
  category: string;
  framework: string;
  severity: string;
  severityScore: number;
  likelihood: string;
  attackVector?: string;
  affectedAsset?: string;
  mitigationPlan?: string;
  mitreTechniqueIds: string[];
  status: string;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
}

interface UseCase {
  id: string;
  aiucId?: string | number;
  title: string;
  description: string;
  stage: string;
  organization?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  threats: Threat[];
}

interface UseCasesWithThreatsResponse {
  useCases: UseCase[];
  organizations: Array<{ id: string; name: string }>;
  userRole: string;
  userOrganizationId: string | null;
}

const getSeverityColor = (level: string) => {
  switch (level) {
    case 'Critical':
      return 'bg-red-500 text-white';
    case 'High':
      return 'bg-orange-500 text-white';
    case 'Medium':
      return 'bg-yellow-500 text-white';
    case 'Low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'CLOSED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'spoofing':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'tampering':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'repudiation':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
    case 'info_disclosure':
    case 'information disclosure':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'dos':
    case 'denial of service':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    case 'elevation':
    case 'elevation_of_privilege':
    case 'elevation of privilege':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const formatCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'spoofing': 'Spoofing',
    'tampering': 'Tampering',
    'repudiation': 'Repudiation',
    'info_disclosure': 'Information Disclosure',
    'information disclosure': 'Information Disclosure',
    'dos': 'Denial of Service',
    'denial of service': 'Denial of Service',
    'elevation': 'Elevation of Privilege',
    'elevation_of_privilege': 'Elevation of Privilege',
    'elevation of privilege': 'Elevation of Privilege',
  };
  return labels[category.toLowerCase()] || category;
};

const formatAiucId = (aiucId: string | number | undefined, id: string): string => {
  if (aiucId) {
    const aiucIdStr = String(aiucId);
    if (aiucIdStr.startsWith('AIUC-')) {
      return aiucIdStr;
    }
    return `AIUC-${aiucIdStr}`;
  }
  return `AIUC-${id.substring(0, 8)}`;
};

export default function ThreatModelingPage() {
  const router = useRouter();
  const { userData } = useUserData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null);

  // Common compact enterprise styles
  const cardClass = 'bg-card border border-border rounded-sm transition-colors hover:border-primary/40';
  const kpiLabel = 'text-[11px] uppercase tracking-wide text-muted-foreground';
  const kpiValue = 'text-lg font-semibold text-foreground';

  useEffect(() => {
    fetchData();
  }, [selectedOrgId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = selectedOrgId
        ? `/api/use-cases-with-threats?organizationId=${selectedOrgId}`
        : '/api/use-cases-with-threats';

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: UseCasesWithThreatsResponse = await response.json();
      setUseCases(data.useCases);
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('[Threat Modeling] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUseCaseExpansion = (useCaseId: string) => {
    setExpandedUseCase(expandedUseCase === useCaseId ? null : useCaseId);
  };

  // Filter use cases based on search term
  const filteredUseCases = useCases.filter(uc => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      uc.title.toLowerCase().includes(searchLower) ||
      formatAiucId(uc.aiucId, uc.id).toLowerCase().includes(searchLower) ||
      uc.organization?.name.toLowerCase().includes(searchLower) ||
      `${uc.user?.firstName} ${uc.user?.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  // Calculate summary statistics
  const totalThreats = useCases.reduce((sum, uc) => sum + uc.threats.length, 0);

  const criticalSeverityCount = useCases.reduce((sum, uc) => {
    return sum + uc.threats.filter(t => {
      if (!t.severity || !t.likelihood) return false;
      return t.severity.trim().toLowerCase() === 'critical';
    }).length;
  }, 0);

  const highSeverityCount = useCases.reduce((sum, uc) => {
    return sum + uc.threats.filter(t => {
      if (!t.severity || !t.likelihood) return false;
      return t.severity.trim().toLowerCase() === 'high';
    }).length;
  }, 0);

  const highLikelihoodCount = useCases.reduce((sum, uc) => {
    return sum + uc.threats.filter(t => {
      if (!t.severity || !t.likelihood) return false;
      return t.likelihood.toLowerCase().trim() === 'high';
    }).length;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading threat modeling…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className={`${cardClass} max-w-md`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Unable to load threat modeling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchData} size="sm" className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="mb-3">
        <p className="text-[11px] text-muted-foreground">
          Consolidated view of AI use cases and associated STRIDE threat posture.
        </p>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-1.5">
            <CardTitle className={kpiLabel}>Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={kpiValue}>{filteredUseCases.length}</div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-1.5">
            <CardTitle className={kpiLabel}>Total Threats</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={kpiValue}>{totalThreats}</div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-1.5">
            <CardTitle className={kpiLabel}>Critical Severity</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`${kpiValue} text-red-600 dark:text-red-500`}>
              {criticalSeverityCount}
            </div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-1.5">
            <CardTitle className={kpiLabel}>High Severity</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`${kpiValue} text-orange-600 dark:text-orange-500`}>
              {highSeverityCount}
            </div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-1.5">
            <CardTitle className={kpiLabel}>High Likelihood</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`${kpiValue} text-amber-600 dark:text-amber-400`}>
              {highLikelihoodCount}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Executive Overview: Heatmap + STRIDE Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Threat Heatmap */}
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Threat Heatmap
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of threats by severity and likelihood.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {(() => {
              const allThreats = useCases.flatMap(uc => uc.threats);
              const heatmapData = [
                { severity: 'Critical', likelihood: 'High', threats: [] as Threat[] },
                { severity: 'Critical', likelihood: 'Medium', threats: [] as Threat[] },
                { severity: 'Critical', likelihood: 'Low', threats: [] as Threat[] },
                { severity: 'High', likelihood: 'High', threats: [] as Threat[] },
                { severity: 'High', likelihood: 'Medium', threats: [] as Threat[] },
                { severity: 'High', likelihood: 'Low', threats: [] as Threat[] },
                { severity: 'Medium', likelihood: 'High', threats: [] as Threat[] },
                { severity: 'Medium', likelihood: 'Medium', threats: [] as Threat[] },
                { severity: 'Medium', likelihood: 'Low', threats: [] as Threat[] },
                { severity: 'Low', likelihood: 'High', threats: [] as Threat[] },
                { severity: 'Low', likelihood: 'Medium', threats: [] as Threat[] },
                { severity: 'Low', likelihood: 'Low', threats: [] as Threat[] },
              ];

              const normalizeLikelihood = (likelihood: string | undefined | null): string | null => {
                if (!likelihood) return null;
                const lower = likelihood.trim().toLowerCase();
                if (lower === 'high') return 'High';
                if (lower === 'medium') return 'Medium';
                if (lower === 'low') return 'Low';
                return null;
              };

              const normalizeSeverity = (severity: string | undefined | null): string | null => {
                if (!severity) return null;
                const lower = severity.trim().toLowerCase();
                if (lower === 'critical') return 'Critical';
                if (lower === 'high') return 'High';
                if (lower === 'medium') return 'Medium';
                if (lower === 'low') return 'Low';
                return null;
              };

              allThreats.forEach(threat => {
                const normalizedSeverity = normalizeSeverity(threat.severity);
                const normalizedLikelihood = normalizeLikelihood(threat.likelihood);

                if (normalizedSeverity && normalizedLikelihood) {
                  const cell = heatmapData.find(
                    d => d.severity === normalizedSeverity && d.likelihood === normalizedLikelihood
                  );
                  if (cell) {
                    cell.threats.push(threat);
                  }
                }
              });

              const maxCount = Math.max(...heatmapData.map(d => d.threats.length), 1);

              const getCellColor = (count: number, severity: string) => {
                if (count === 0) return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };

                const intensity = maxCount > 0 ? count / maxCount : 0;

                if (severity === 'Critical') {
                  if (intensity >= 0.7) return { bg: 'bg-red-700 dark:bg-red-800', text: 'text-white' };
                  if (intensity >= 0.4) return { bg: 'bg-red-600 dark:bg-red-700', text: 'text-white' };
                  if (intensity >= 0.2) return { bg: 'bg-red-500 dark:bg-red-600', text: 'text-white' };
                  return { bg: 'bg-red-400 dark:bg-red-500', text: 'text-white' };
                }
                if (severity === 'High') {
                  if (intensity >= 0.7) return { bg: 'bg-orange-700 dark:bg-orange-800', text: 'text-white' };
                  if (intensity >= 0.4) return { bg: 'bg-orange-600 dark:bg-orange-700', text: 'text-white' };
                  if (intensity >= 0.2) return { bg: 'bg-orange-500 dark:bg-orange-600', text: 'text-white' };
                  return { bg: 'bg-orange-400 dark:bg-orange-500', text: 'text-white' };
                }
                if (severity === 'Medium') {
                  if (intensity >= 0.7) return { bg: 'bg-yellow-600 dark:bg-yellow-700', text: 'text-white' };
                  if (intensity >= 0.4) return { bg: 'bg-yellow-500 dark:bg-yellow-600', text: 'text-white' };
                  if (intensity >= 0.2) return { bg: 'bg-yellow-400 dark:bg-yellow-500', text: 'text-white' };
                  return { bg: 'bg-yellow-300 dark:bg-yellow-400', text: 'text-gray-800 dark:text-gray-900' };
                }
                if (intensity >= 0.7) return { bg: 'bg-green-600 dark:bg-green-700', text: 'text-white' };
                if (intensity >= 0.4) return { bg: 'bg-green-500 dark:bg-green-600', text: 'text-white' };
                if (intensity >= 0.2) return { bg: 'bg-green-400 dark:bg-green-500', text: 'text-white' };
                return { bg: 'bg-green-300 dark:bg-green-400', text: 'text-gray-800 dark:text-gray-900' };
              };

              return (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5 text-[10px] font-medium text-center">
                    <div></div>
                    <div className="text-muted-foreground">Low</div>
                    <div className="text-muted-foreground">Medium</div>
                    <div className="text-muted-foreground">High</div>
                  </div>
                  {['Critical', 'High', 'Medium', 'Low'].map(severity => (
                    <div key={severity} className="grid grid-cols-4 gap-1.5">
                      <div className="flex items-center text-[10px] font-medium text-muted-foreground">{severity}</div>
                      {['Low', 'Medium', 'High'].map(likelihood => {
                        const cell = heatmapData.find(d => d.severity === severity && d.likelihood === likelihood);
                        const count = cell?.threats.length || 0;
                        const colors = getCellColor(count, severity);
                        return (
                          <div
                            key={likelihood}
                            className={`${colors.bg} ${colors.text} rounded-sm h-10 flex items-center justify-center text-xs transition-all hover:scale-105 cursor-pointer`}
                            title={`${severity} / ${likelihood}: ${count} threat(s)`}
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border text-center">
                    Darker cells indicate higher concentration of threats.
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* STRIDE Category Breakdown */}
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              STRIDE Category Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution across STRIDE threat categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {(() => {
              const allThreats = useCases.flatMap(uc => uc.threats);
              const strideCategories = [
                { key: 'spoofing', label: 'Spoofing', color: 'bg-red-500' },
                { key: 'tampering', label: 'Tampering', color: 'bg-orange-500' },
                { key: 'repudiation', label: 'Repudiation', color: 'bg-amber-500' },
                { key: 'info_disclosure', label: 'Information Disclosure', color: 'bg-blue-500' },
                { key: 'dos', label: 'Denial of Service', color: 'bg-purple-500' },
                { key: 'elevation_of_privilege', label: 'Elevation of Privilege', color: 'bg-pink-500' },
              ];

              const categoryCounts = strideCategories.map(cat => ({
                ...cat,
                count: allThreats.filter(t => t.category.toLowerCase() === cat.key || t.category.toLowerCase() === cat.label.toLowerCase()).length
              }));

              const total = allThreats.length || 1;
              const hasData = categoryCounts.some(c => c.count > 0);

              if (!hasData) {
                return (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No categorized threats available.
                  </p>
                );
              }

              return (
                <div className="space-y-3">
                  {categoryCounts.map(({ key, label, color, count }) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-muted-foreground">{label}</span>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${color} transition-all`}
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <section className={`${cardClass} mb-4`}>
        <div className="p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Org filter for admin */}
            {userData?.role === 'QZEN_ADMIN' && organizations.length > 0 && (
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                  Organization
                </label>
                <Select
                  value={selectedOrgId === '' ? 'ALL' : selectedOrgId}
                  onValueChange={(v) => setSelectedOrgId(v === 'ALL' ? '' : v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="All organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5" />
                          <span className="text-xs">{org.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                Search Use Cases
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Title, ID, organization, or owner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* Refresh */}
            <div className="flex items-end">
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases & Threat Details */}
      <section className="space-y-3">
        {filteredUseCases.length === 0 ? (
          <Card className={cardClass}>
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center space-y-2">
                <Shield className="w-8 h-8 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">
                  {searchTerm
                    ? 'No use cases match your search.'
                    : 'No use cases with associated threats found.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUseCases.map((useCase) => {
            const threatCount = useCase.threats.length;
            const isExpanded = expandedUseCase === useCase.id;

            return (
              <Card
                key={useCase.id}
                className={`${cardClass} overflow-hidden`}
              >
                {/* Header Row */}
                <CardHeader
                  className="px-3 pt-3 pb-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleUseCaseExpansion(useCase.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {formatAiucId(useCase.aiucId, useCase.id)} – {useCase.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 rounded"
                        >
                          {useCase.stage}
                        </Badge>
                      </div>
                      <CardDescription className="text-[11px]">
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                          {useCase.organization?.name && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {useCase.organization.name}
                            </span>
                          )}
                          {useCase.user && (
                            <span>
                              Owner: {useCase.user.firstName} {useCase.user.lastName}
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right min-w-[70px]">
                        <div className="text-[10px] text-muted-foreground">Threats</div>
                        <div className="text-lg font-semibold text-foreground">
                          {threatCount}
                        </div>
                      </div>

                      {/* Manage button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/${useCase.id}/threat-modeling`);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Manage
                      </Button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="pt-0 px-4 pb-4">
                    {threatCount === 0 ? (
                      <div className="border border-dashed border-border rounded-sm p-4 bg-muted/20">
                        <div className="flex flex-col items-start gap-2">
                          <h4 className="text-xs font-semibold text-foreground">
                            No threats recorded
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Use the threat modeling workflow to generate STRIDE-based threat analysis.
                          </p>
                          <Button
                            onClick={() =>
                              router.push(`/dashboard/${useCase.id}/threat-modeling`)
                            }
                            size="sm"
                            className="h-7 text-[11px] px-3"
                          >
                            Go to threat modeling
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {useCase.threats.map((threat) => (
                          <Card
                            key={threat.id}
                            className={`${cardClass} border-l-4 bg-muted/20`}
                            style={{
                              borderLeftColor:
                                threat.severity === 'Critical'
                                  ? '#ef4444'
                                  : threat.severity === 'High'
                                  ? '#f97316'
                                  : threat.severity === 'Medium'
                                  ? '#eab308'
                                  : '#22c55e',
                            }}
                          >
                            <CardContent className="px-3 py-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    <Badge
                                      className={`${getSeverityColor(
                                        threat.severity
                                      )} text-[10px] px-1.5 py-0 rounded`}
                                    >
                                      {threat.severity}
                                    </Badge>
                                    <Badge
                                      className={`${getStatusColor(
                                        threat.status
                                      )} text-[10px] px-1.5 py-0 rounded`}
                                    >
                                      {threat.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge
                                      className={`${getCategoryColor(
                                        threat.category
                                      )} text-[10px] px-1.5 py-0 rounded`}
                                    >
                                      {formatCategoryLabel(threat.category)}
                                    </Badge>
                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      Score: {threat.severityScore}/10
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-semibold text-foreground mb-1">
                                    {threat.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {threat.description}
                                  </p>
                                  {(threat.attackVector || threat.affectedAsset) && (
                                    <div className="mt-1.5 pt-1.5 border-t border-border flex flex-wrap gap-3">
                                      {threat.attackVector && (
                                        <div>
                                          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                            Attack Vector
                                          </p>
                                          <p className="text-[11px] text-foreground">
                                            {threat.attackVector}
                                          </p>
                                        </div>
                                      )}
                                      {threat.affectedAsset && (
                                        <div>
                                          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                            Affected Asset
                                          </p>
                                          <p className="text-[11px] text-foreground">
                                            {threat.affectedAsset}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {threat.mitigationPlan && (
                                    <div className="mt-1.5 pt-1.5 border-t border-border">
                                      <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                        Mitigation Plan
                                      </p>
                                      <p className="text-[11px] text-foreground">
                                        {threat.mitigationPlan}
                                      </p>
                                    </div>
                                  )}
                                  {threat.mitreTechniqueIds && threat.mitreTechniqueIds.length > 0 && (
                                    <div className="mt-1.5 pt-1.5 border-t border-border">
                                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                                        MITRE Techniques
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {threat.mitreTechniqueIds.map((techId) => (
                                          <span
                                            key={techId}
                                            className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                                          >
                                            {techId}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
