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
  Sparkles,
  ArrowRight,
  Info,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserData } from '@/contexts/UserContext';
import { ChartRadarDots } from '@/components/ui/radar-chart';
import { type StepsData } from '@/lib/risk-calculations';

interface Risk {
  id: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  likelihood?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';
  riskScore: number;
  description: string;
  mitigationStrategy?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseCase {
  id: string;
  aiucId?: string | number;
  title: string;
  description: string;
  stage: string;
  answers?: any[];
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
  risks: Risk[];
  assessData?: {
    stepsData: StepsData;
    updatedAt: string | Date;
    createdAt: string | Date;
  };
}

interface UseCasesWithRisksResponse {
  useCases: UseCase[];
  organizations: Array<{ id: string; name: string }>;
  userRole: string;
  userOrganizationId: string | null;
}

const getRiskLevelColor = (level: string) => {
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

export default function RiskManagementPage() {
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
        ? `/api/use-cases-with-risks?organizationId=${selectedOrgId}`
        : '/api/use-cases-with-risks';
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: UseCasesWithRisksResponse = await response.json();
      setUseCases(data.useCases);
      setOrganizations(data.organizations || []);
      
      // Set initial organization filter for QZEN_ADMIN
      if (data.userRole === 'QZEN_ADMIN' && !selectedOrgId && data.organizations.length > 0) {
        // Don't auto-select, let user choose
      }
    } catch (err) {
      console.error('[Risk Management] Fetch error:', err);
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
  const totalRisks = useCases.reduce((sum, uc) => sum + uc.risks.length, 0);
  const openRisks = useCases.reduce((sum, uc) => 
    sum + uc.risks.filter(r => r.status === 'OPEN').length, 0
  );
  
  // Calculate risks by severity (only risks with both severity and likelihood)
  const criticalSeverityCount = useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      return r.riskLevel.trim().toLowerCase() === 'critical';
    }).length;
  }, 0);
  
  const highSeverityCount = useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      return r.riskLevel.trim().toLowerCase() === 'high';
    }).length;
  }, 0);
  
  // Calculate risks by likelihood (only risks with both severity and likelihood)
  const highLikelihoodCount = useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      return r.likelihood.toLowerCase().trim() === 'high';
    }).length;
  }, 0);
  
  const criticalHighLikelihoodCount = useCases.reduce((sum, uc) => {
    return sum + uc.risks.filter(r => {
      if (!r.riskLevel || !r.likelihood) return false;
      const severity = r.riskLevel.trim().toLowerCase();
      const likelihood = r.likelihood.toLowerCase().trim();
      return (severity === 'critical' || severity === 'high') && likelihood === 'high';
    }).length;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading risk management…
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
              Unable to load risk management
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
          Consolidated view of AI use cases and associated risk posture.
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
            <CardTitle className={kpiLabel}>Total Risks</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={kpiValue}>{totalRisks}</div>
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

      {/* Executive Overview: Heatmap + Status/Category */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Risk Heatmap */}
        <Card className={cardClass}>
          <CardHeader className="px-3 pt-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Risk Heatmap
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of risks by severity and likelihood.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {(() => {
              // Calculate risk distribution for heatmap
              const allRisks = useCases.flatMap(uc => uc.risks);
              const heatmapData = [
                { severity: 'Critical', likelihood: 'High', risks: [] as Risk[] },
                { severity: 'Critical', likelihood: 'Medium', risks: [] as Risk[] },
                { severity: 'Critical', likelihood: 'Low', risks: [] as Risk[] },
                { severity: 'High', likelihood: 'High', risks: [] as Risk[] },
                { severity: 'High', likelihood: 'Medium', risks: [] as Risk[] },
                { severity: 'High', likelihood: 'Low', risks: [] as Risk[] },
                { severity: 'Medium', likelihood: 'High', risks: [] as Risk[] },
                { severity: 'Medium', likelihood: 'Medium', risks: [] as Risk[] },
                { severity: 'Medium', likelihood: 'Low', risks: [] as Risk[] },
                { severity: 'Low', likelihood: 'High', risks: [] as Risk[] },
                { severity: 'Low', likelihood: 'Medium', risks: [] as Risk[] },
                { severity: 'Low', likelihood: 'Low', risks: [] as Risk[] },
              ];

              // Helper function to normalize likelihood values
              const normalizeLikelihood = (likelihood: string | undefined | null): string | null => {
                if (!likelihood) return null;
                const normalized = likelihood.trim();
                // Handle case variations: 'high', 'High', 'HIGH' -> 'High'
                const lower = normalized.toLowerCase();
                if (lower === 'high') return 'High';
                if (lower === 'medium') return 'Medium';
                if (lower === 'low') return 'Low';
                return normalized; // Return as-is if doesn't match
              };

              // Helper function to normalize severity values
              const normalizeSeverity = (severity: string | undefined | null): string | null => {
                if (!severity) return null;
                const normalized = severity.trim();
                // Handle case variations
                const lower = normalized.toLowerCase();
                if (lower === 'critical') return 'Critical';
                if (lower === 'high') return 'High';
                if (lower === 'medium') return 'Medium';
                if (lower === 'low') return 'Low';
                return normalized; // Return as-is if doesn't match
              };

              allRisks.forEach(risk => {
                const normalizedSeverity = normalizeSeverity(risk.riskLevel);
                const normalizedLikelihood = normalizeLikelihood(risk.likelihood);
                
                // Only process risks that have both severity and likelihood
                if (normalizedSeverity && normalizedLikelihood) {
                  const cell = heatmapData.find(
                    d => d.severity === normalizedSeverity && d.likelihood === normalizedLikelihood
                  );
                  if (cell) {
                    cell.risks.push(risk);
                  }
                }
              });

              // Calculate max count for better color scaling
              const maxCount = Math.max(...heatmapData.map(d => d.risks.length), 1);
              
              const getCellColor = (count: number, severity: string) => {
                if (count === 0) return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };
                
                // Calculate intensity based on percentage of max count
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
                // Low severity
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
                        const count = cell?.risks.length || 0;
                        const colors = getCellColor(count, severity);
                        return (
                          <div
                            key={likelihood}
                            className={`${colors.bg} ${colors.text} rounded-sm h-10 flex items-center justify-center text-xs transition-all hover:scale-105 cursor-pointer`}
                            title={`${severity} / ${likelihood}: ${count} risk(s)`}
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border text-center">
                    Darker cells indicate higher concentration of risks.
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Status + Categories */}
        <div className="space-y-3">
          {/* Status */}
          <Card className={cardClass}>
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="text-sm font-medium">Risk Status</CardTitle>
              <CardDescription className="text-xs">
                Distribution across workflow stages.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {(() => {
                const allRisks = useCases.flatMap(uc => uc.risks);
                const openCount = allRisks.filter(r => r.status === 'OPEN').length;
                const inProgressCount = allRisks.filter(r => r.status === 'IN_PROGRESS').length;
                const mitigatedCount = allRisks.filter(r => r.status === 'MITIGATED').length;
                const closedCount = allRisks.filter(r => r.status === 'CLOSED').length;
                const total = allRisks.length || 1;

                const rowClass = 'flex items-center justify-between text-xs';
                const barBg = 'w-full bg-muted rounded-full h-1.5';
                const barInner = 'h-1.5 rounded-full transition-all';

                return (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className={rowClass}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span>Open</span>
                        </div>
                        <span className="font-semibold">{openCount}</span>
                      </div>
                      <div className={barBg}>
                        <div
                          className={`${barInner} bg-red-500`}
                          style={{ width: `${(openCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className={rowClass}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>In Progress</span>
                        </div>
                        <span className="font-semibold">{inProgressCount}</span>
                      </div>
                      <div className={barBg}>
                        <div
                          className={`${barInner} bg-amber-500`}
                          style={{ width: `${(inProgressCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className={rowClass}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Mitigated</span>
                        </div>
                        <span className="font-semibold">{mitigatedCount}</span>
                      </div>
                      <div className={barBg}>
                        <div
                          className={`${barInner} bg-blue-500`}
                          style={{ width: `${(mitigatedCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className={rowClass}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                          <span>Closed</span>
                        </div>
                        <span className="font-semibold">{closedCount}</span>
                      </div>
                      <div className={barBg}>
                        <div
                          className={`${barInner} bg-gray-500`}
                          style={{ width: `${(closedCount / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className={cardClass}>
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="text-sm font-medium">Risk Categories</CardTitle>
              <CardDescription className="text-xs">
                Breakdown by risk classification.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {(() => {
                const allRisks = useCases.flatMap(uc => uc.risks);
                const categories = ['technical', 'data', 'operational', 'regulatory', 'ethical', 'business'];
                const categoryLabels: Record<string, string> = {
                  'technical': 'Technical',
                  'data': 'Data Privacy',
                  'operational': 'Operational',
                  'regulatory': 'Regulatory',
                  'ethical': 'Ethical',
                  'business': 'Business'
                };
                const categoryCounts = categories.map(cat => ({
                  category: cat,
                  label: categoryLabels[cat],
                  count: allRisks.filter(r => r.category === cat).length
                })).filter(c => c.count > 0);

                const total = allRisks.length || 1;

                if (!categoryCounts.length) {
                  return (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No categorized risks available.
                    </p>
                  );
                }

                return (
                  <div className="space-y-2">
                    {categoryCounts.map(({ category, label, count }) => (
                      <div
                        key={category}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-primary/80 transition-all"
                              style={{ width: `${(count / total) * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
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

      {/* Use Cases & Risk Details */}
      <section className="space-y-3">
        {filteredUseCases.length === 0 ? (
          <Card className={cardClass}>
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center space-y-2">
                <Shield className="w-8 h-8 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">
                  {searchTerm
                    ? 'No use cases match your search.'
                    : 'No use cases with associated risks found.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUseCases.map((useCase) => {
            const riskCount = useCase.risks.length;
            const openRiskCount = useCase.risks.filter(r => r.status === 'OPEN').length;
            const highRiskCount = useCase.risks.filter(r => 
              r.riskLevel === 'High' || r.riskLevel === 'Critical'
            ).length;
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
                        <div className="text-[10px] text-muted-foreground">Risks</div>
                        <div className="text-lg font-semibold text-foreground">
                          {riskCount}
                        </div>
                      </div>

                      {/* Manage button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/${useCase.id}/risks?from=risks`);
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
                    {riskCount === 0 ? (
                      <div className="border border-dashed border-border rounded-sm p-4 bg-muted/20">
                        <div className="flex flex-col items-start gap-2">
                          <h4 className="text-xs font-semibold text-foreground">
                            No risks recorded
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Use the assessment workflow to generate an initial set of risk
                            insights and AI-driven recommendations.
                          </p>
                          <Button
                            onClick={() =>
                              router.push(`/dashboard/${useCase.id}/assess?step=10`)
                            }
                            size="sm"
                            className="h-7 text-[11px] px-3"
                          >
                            Go to risk assessment
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {useCase.risks.map((risk) => (
                          <Card
                            key={risk.id}
                            className={`${cardClass} border-l-4 bg-muted/20`}
                            style={{
                              borderLeftColor:
                                risk.riskLevel === 'Critical'
                                  ? '#ef4444'
                                  : risk.riskLevel === 'High'
                                  ? '#f97316'
                                  : risk.riskLevel === 'Medium'
                                  ? '#eab308'
                                  : '#22c55e',
                            }}
                          >
                            <CardContent className="px-3 py-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    <Badge
                                      className={`${getRiskLevelColor(
                                        risk.riskLevel
                                      )} text-[10px] px-1.5 py-0 rounded`}
                                    >
                                      {risk.riskLevel}
                                    </Badge>
                                    <Badge
                                      className={`${getStatusColor(
                                        risk.status
                                      )} text-[10px] px-1.5 py-0 rounded`}
                                    >
                                      {risk.status.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      Score: {risk.riskScore}/10
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-semibold text-foreground mb-1">
                                    {risk.category}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {risk.description}
                                  </p>
                                  {risk.mitigationStrategy && (
                                    <div className="mt-1.5 pt-1.5 border-t border-border">
                                      <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                        Mitigation strategy
                                      </p>
                                      <p className="text-[11px] text-foreground">
                                        {risk.mitigationStrategy}
                                      </p>
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
