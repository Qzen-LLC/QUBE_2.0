'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Building,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  calculateRiskScores,
  getRiskLevel,
  type StepsData
} from '@/lib/risk-calculations';
import { type GovernanceFramework } from '@/hooks/useGovernanceLock';

interface UseCase {
  useCaseId: string;
  useCaseNumber: number;
  useCaseName: string;
  useCaseType: string;
  department: string;
  regulatoryFrameworks: string[];
  industryStandards: string[];
  lastUpdated: string;
  assessData?: {
    stepsData: any;
  };
  risks?: {
    id: string;
    category: string;
    riskLevel: string;
    status: string;
  }[];
}

interface AssessmentProgress {
  id: string | null;
  status: string;
  progress: number;
  updatedAt: string | null;
  maturityLevel?: string | null;
  weightedScore?: number;
}

type ProgressMap = {
  [useCaseId: string]: {
    euAiAct?: AssessmentProgress;
    iso42001?: AssessmentProgress;
    uaeAi?: AssessmentProgress;
    iso27001?: AssessmentProgress;
  }
};

export default function GovernancePage() {
  const router = useRouter();
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [assessmentProgress, setAssessmentProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<GovernanceFramework | null>(null);
  const [lockConflict, setLockConflict] = useState<{
    acquiredBy: string;
    expiresAt?: string | null;
    framework: GovernanceFramework;
    useCaseName: string;
  } | null>(null);

  // --- Utility helpers ------------------------------------------------------
  const getSafeProgress = (p?: AssessmentProgress) =>
    typeof p?.progress === 'number' && !Number.isNaN(p.progress) ? p.progress : 0;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTimeRemaining = (expiresAt?: string | null) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (Number.isNaN(diffMs)) return null;
    if (diffMs <= 0) return 'less than a minute';
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    return `${seconds}s`;
  };

  const conflictTimeRemaining = useMemo(
    () => (lockConflict?.expiresAt ? formatTimeRemaining(lockConflict.expiresAt) : null),
    [lockConflict?.expiresAt]
  );

  // --- Data fetching --------------------------------------------------------
  useEffect(() => {
    fetchAllData();
    const handleFocus = () => {
      fetchAllData(true);
    };
    const handleGovernanceRefresh = () => {
      fetchAllData(true);
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('governance-refresh', handleGovernanceRefresh);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('governance-refresh', handleGovernanceRefresh);
    };
  }, []);

  const fetchAllData = async (isRefresh = false) => {
    try {
      if (inFlight.current) return;
      inFlight.current = true;
      if (isRefresh) setRefreshing(true);

      setError(null);

      const response = await fetch('/api/governance-data', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch governance data');

      const governanceData: UseCase[] = await response.json();

      setUseCases(governanceData);

      const progressData: ProgressMap = {};

      for (const useCase of governanceData) {
        const useCaseId = useCase.useCaseId;
        progressData[useCaseId] = {};

        const hasEuAiAct = useCase.regulatoryFrameworks.includes('EU AI Act');
        const hasIso42001 = useCase.industryStandards.some(s => s.includes('ISO/IEC 42001'));
        const hasUaeAi = useCase.regulatoryFrameworks.includes('UAE AI/GenAI Controls');
        const hasIso27001 = useCase.industryStandards.some(s => s.includes('ISO 27001'));

        const promises: Promise<void>[] = [];

        if (hasEuAiAct) {
          promises.push(
            fetch(`/api/eu-ai-act/progress/${useCaseId}`, { cache: 'no-store' })
              .then(res => res.json())
              .then(data => { progressData[useCaseId].euAiAct = data; })
              .catch(err => console.error(`Error fetching EU AI Act progress for ${useCaseId}:`, err))
          );
        }

        if (hasIso42001) {
          promises.push(
            fetch(`/api/iso-42001/progress/${useCaseId}`, { cache: 'no-store' })
              .then(res => res.json())
              .then(data => { progressData[useCaseId].iso42001 = data; })
              .catch(err => console.error(`Error fetching ISO 42001 progress for ${useCaseId}:`, err))
          );
        }

        if (hasUaeAi) {
          promises.push(
            fetch(`/api/uae-ai/progress/${useCaseId}`, { cache: 'no-store' })
              .then(res => res.json())
              .then(data => { progressData[useCaseId].uaeAi = data; })
              .catch(err => console.error(`Error fetching UAE AI progress for ${useCaseId}:`, err))
          );
        }

        if (hasIso27001) {
          promises.push(
            fetch(`/api/iso-27001/progress/${useCaseId}`, { cache: 'no-store' })
              .then(res => res.json())
              .then(data => { progressData[useCaseId].iso27001 = data; })
              .catch(err => console.error(`Error fetching ISO 27001 progress for ${useCaseId}:`, err))
          );
        }

        await Promise.all(promises);
      }

      setAssessmentProgress(progressData);

    } catch (err) {
      console.error('Error fetching governance data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading governance data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  };

  const handleRefresh = () => {
    if (!inFlight.current) fetchAllData(true);
  };

  // --- Lock-aware assessment navigation ------------------------------------
  const handleStartAssessment = async (useCase: UseCase, framework: GovernanceFramework) => {
    setSelectedUseCase(useCase);
    setSelectedFramework(framework);
    setError(null);
    setLockConflict(null);

    try {
      const response = await fetch('/api/locks/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId: useCase.useCaseId,
          lockType: 'EXCLUSIVE',
          scope: framework,
        }),
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setLockConflict({
            acquiredBy: data.lockDetails?.acquiredBy || 'another user',
            expiresAt: data.lockDetails?.expiresAt ?? null,
            framework,
            useCaseName: useCase.useCaseName,
          });
          return;
        }
        throw new Error(data.error || 'Failed to acquire lock');
      }

      const frameworkRoutes: Record<GovernanceFramework, string> = {
        GOVERNANCE_EU_AI_ACT: `/dashboard/${useCase.useCaseId}/eu-ai-act`,
        GOVERNANCE_ISO_42001: `/dashboard/${useCase.useCaseId}/iso-42001`,
        GOVERNANCE_UAE_AI: `/dashboard/${useCase.useCaseId}/uae-ai`,
        GOVERNANCE_ISO_27001: `/dashboard/${useCase.useCaseId}/iso-27001`,
      };

      const route = frameworkRoutes[framework];

      if (route) {
        window.location.href = route;
      }

    } catch (err) {
      console.error('Error acquiring lock:', err);
      setError(err instanceof Error ? err.message : 'Failed to acquire lock for this assessment.');
    } finally {
      setSelectedUseCase(null);
      setSelectedFramework(null);
    }
  };



  // --- Loading & error states ----------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Loading governance dashboard…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md w-full border-destructive/40 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <h2 className="mb-1 text-base font-semibold text-destructive">
                  Unable to load governance data
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {error}
                </p>
                <Button size="sm" onClick={() => fetchAllData()}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main UI --------------------------------------------------------------
  return (
    <>
      {/* Lock conflict dialog */}
      <Dialog
        open={Boolean(lockConflict)}
        onOpenChange={(open) => {
          if (!open) setLockConflict(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assessment currently locked</DialogTitle>
            <DialogDescription>
              {(lockConflict?.useCaseName || 'This assessment')} is currently being edited by{" "}
              <span className="font-medium text-foreground">
                {lockConflict?.acquiredBy}
              </span>.
            </DialogDescription>
          </DialogHeader>
          {conflictTimeRemaining && (
            <p className="text-sm text-muted-foreground">
              The editing lock will expire in {conflictTimeRemaining}.
            </p>
          )}
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLockConflict(null);
                handleRefresh();
              }}
            >
              Refresh status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-full bg-background">
        <div className="px-6 py-6">
          {/* Empty state */}
          {useCases.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  No governance applied yet
                </h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  When AI use cases are mapped to regulatory frameworks or industry standards,
                  they will appear here for centralized tracking.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Use case list */}
          {useCases.length > 0 && (
            <div className="space-y-4">
              {useCases.map((item) => {
                const showEuAiAct = item.regulatoryFrameworks.includes('EU AI Act');
                const showIso42001 = item.industryStandards.some((s) => s.includes('ISO/IEC 42001'));
                const showUaeAi = item.regulatoryFrameworks.includes('UAE AI/GenAI Controls');
                const showIso27001 = item.industryStandards.some((s) => s.includes('ISO 27001'));

                const activeSections = [
                  true, // risk block always present
                  showEuAiAct,
                  showIso42001,
                  showUaeAi,
                  showIso27001,
                ].filter(Boolean).length;

                const gridCols =
                  activeSections === 1
                    ? 'grid-cols-1'
                    : activeSections === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : activeSections === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-4';

                const progressFor = assessmentProgress[item.useCaseId] || {};

                // Risk calculations
                const riskBlock = (() => {
                  if (!item.assessData?.stepsData) {
                    return {
                      label: 'Not assessed',
                      chipClass: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200',
                      summary: 'Complete the risk assessment to view risk distribution.',
                      openCount: (item.risks || []).filter(r => r.status === 'OPEN').length,
                    };
                  }

                  const riskResult = calculateRiskScores(item.assessData.stepsData as StepsData);
                  const riskLevel = getRiskLevel(riskResult.score);
                  const openRisks = (item.risks || []).filter(r => r.status === 'OPEN').length;
                  const criticalCount = riskResult.chartData.filter(d => d.desktop >= 8).length;
                  const highCount = riskResult.chartData.filter(d => d.desktop >= 6 && d.desktop < 8).length;

                  const base = {
                    openCount: openRisks,
                    summary: `${criticalCount} critical, ${highCount} high areas`,
                  };

                  switch (riskLevel) {
                    case 'Critical':
                      return {
                        ...base,
                        label: `Critical (${openRisks} open)`,
                        chipClass:
                          'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-200',
                      };
                    case 'High':
                      return {
                        ...base,
                        label: `High (${openRisks} open)`,
                        chipClass:
                          'bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-200',
                      };
                    case 'Medium':
                      return {
                        ...base,
                        label: `Medium (${openRisks} open)`,
                        chipClass:
                          'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-200',
                      };
                    default:
                      return {
                        ...base,
                        label: `Low (${openRisks} open)`,
                        chipClass:
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-200',
                      };
                  }
                })();

                return (
                  <Card
                    key={item.useCaseId}
                    className="border border-border bg-card/95 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Use case header */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            <span className="rounded-full bg-muted px-2 py-0.5">
                              AIUC-{item.useCaseNumber}
                            </span>
                            <span className="text-[11px]">
                              Last updated on {formatDate(item.lastUpdated)}
                            </span>
                          </div>
                          <h3 className="truncate text-sm font-semibold leading-snug text-foreground">
                            {item.useCaseName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {item.department}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.useCaseType}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.regulatoryFrameworks.slice(0, 3).map((framework, idx) => (
                              <Badge
                                key={`reg-${idx}`}
                                variant="outline"
                                className="h-5 rounded-full px-2 text-[11px] bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                              >
                                {framework}
                              </Badge>
                            ))}
                            {item.industryStandards.slice(0, 3).map((standard, idx) => (
                              <Badge
                                key={`std-${idx}`}
                                variant="outline"
                                className="h-5 rounded-full px-2 text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700"
                              >
                                {standard.includes('FedRAMP')
                                  ? 'FedRAMP'
                                  : standard.includes('AICPA')
                                  ? 'AICPA AI Auditing'
                                  : standard.includes('ISO/IEC 42001')
                                  ? 'ISO/IEC 42001:2023'
                                  : standard.includes('ISO/IEC JTC')
                                  ? 'ISO/IEC JTC 1/SC 42'
                                  : standard}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            <Link href={`/dashboard/${item.useCaseId}/assess`}>
                              View assessment
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Blocks grid */}
                      <div className={`grid gap-3 ${gridCols}`}>
                        {/* Risk block - red */}
                        <div className="flex flex-col gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs dark:border-red-900/40 dark:bg-red-900/15">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-300" />
                              <span className="font-semibold text-red-900 dark:text-red-100">
                                Risk management
                              </span>
                            </div>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] text-red-700 hover:bg-red-100/80 dark:text-red-200 dark:hover:bg-red-900/30"
                            >
                              <Link href={`/dashboard/${item.useCaseId}/risks`}>
                                Manage
                              </Link>
                            </Button>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${riskBlock.chipClass}`}
                            >
                              {riskBlock.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-red-800/90 dark:text-red-200/90">
                            {riskBlock.summary}
                          </div>
                        </div>

                        {/* EU AI Act */}
                        {showEuAiAct && (
                          <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card px-3 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                EU AI Act
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {Math.round(getSafeProgress(progressFor.euAiAct))}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${getSafeProgress(progressFor.euAiAct)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={`h-5 rounded-md px-2 text-[10px] font-medium ${
                                  progressFor.euAiAct?.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {progressFor.euAiAct?.status === 'completed'
                                  ? 'Completed'
                                  : 'In progress'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => handleStartAssessment(item, 'GOVERNANCE_EU_AI_ACT')}
                              >
                                Open
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* ISO 42001 */}
                        {showIso42001 && (
                          <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card px-3 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                ISO 42001
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {Math.round(getSafeProgress(progressFor.iso42001))}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${getSafeProgress(progressFor.iso42001)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={`h-5 rounded-md px-2 text-[10px] font-medium ${
                                  progressFor.iso42001?.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {progressFor.iso42001?.status === 'completed'
                                  ? 'Completed'
                                  : 'In progress'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => handleStartAssessment(item, 'GOVERNANCE_ISO_42001')}
                              >
                                Open
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* UAE AI Controls */}
                        {showUaeAi && (
                          <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card px-3 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                UAE AI Controls
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {Math.round(getSafeProgress(progressFor.uaeAi))}%
                                </span>
                                {progressFor.uaeAi && (
                                  <span
                                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                      progressFor.uaeAi.maturityLevel === 'mature'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                        : progressFor.uaeAi.maturityLevel === 'moderate'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                                    }`}
                                  >
                                    {progressFor.uaeAi.maturityLevel === 'mature'
                                      ? 'Mature'
                                      : progressFor.uaeAi.maturityLevel === 'moderate'
                                      ? 'Moderate'
                                      : 'High risk'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${getSafeProgress(progressFor.uaeAi)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={`h-5 rounded-md px-2 text-[10px] font-medium ${
                                  progressFor.uaeAi?.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {progressFor.uaeAi?.status === 'completed'
                                  ? 'Completed'
                                  : 'In progress'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => handleStartAssessment(item, 'GOVERNANCE_UAE_AI')}
                              >
                                Open
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* ISO 27001 */}
                        {showIso27001 && (
                          <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card px-3 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                ISO 27001
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {Math.round(getSafeProgress(progressFor.iso27001))}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${getSafeProgress(progressFor.iso27001)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={`h-5 rounded-md px-2 text-[10px] font-medium ${
                                  progressFor.iso27001?.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {progressFor.iso27001?.status === 'completed'
                                  ? 'Completed'
                                  : 'In progress'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => handleStartAssessment(item, 'GOVERNANCE_ISO_27001')}
                              >
                                Open
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}