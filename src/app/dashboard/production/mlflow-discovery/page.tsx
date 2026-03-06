"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiscoveredModel {
  id: string;
  modelName: string;
  description: string | null;
  latestVersion: string | null;
  stage: string | null;
  tags: Record<string, string>;
  matchedUseCaseId: string | null;
  matchConfidence: number | null;
  matchMethod: string | null;
  governanceStatus: string;
  syncedAt: string;
  matchedUseCase: { id: string; title: string } | null;
}

interface SyncData {
  totalModels: number;
  governedCount: number;
  ungovernedCount: number;
  reviewNeededCount: number;
  models: DiscoveredModel[];
  syncedAt: string | null;
}

interface UseCase {
  id: string;
  title: string;
}

const STATUS_STYLES: Record<string, string> = {
  governed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ungoverned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  review_needed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const STAGE_STYLES: Record<string, string> = {
  Production: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Staging: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  None: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function MlflowDiscoveryPage() {
  const [data, setData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [linkingModelId, setLinkingModelId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/production/mlflow/discover");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetch("/api/use-cases")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setUseCases(Array.isArray(d) ? d : d.useCases ?? []))
      .catch(() => {});
  }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/production/mlflow/discover", { method: "POST" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const handleMatch = async (modelId: string, useCaseId: string | null) => {
    try {
      const res = await fetch("/api/production/mlflow/match", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, useCaseId }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setLinkingModelId(null);
    }
  };

  const filteredModels = (data?.models ?? []).filter((m) => {
    if (statusFilter !== "all" && m.governanceStatus !== statusFilter) return false;
    if (search && !m.modelName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading discovery data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">MLflow Model Discovery</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discover registered models and reconcile against governed use cases.
            {data?.syncedAt && (
              <span className="ml-2">
                Last synced: {new Date(data.syncedAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Models</p>
          <p className="text-2xl font-bold dark:text-white">{data?.totalModels ?? 0}</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-sm text-green-600 dark:text-green-400">Governed</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{data?.governedCount ?? 0}</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-sm text-red-600 dark:text-red-400">Ungoverned</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{data?.ungovernedCount ?? 0}</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-sm text-amber-600 dark:text-amber-400">Review Needed</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{data?.reviewNeededCount ?? 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-200"
        >
          <option value="all">All Statuses</option>
          <option value="governed">Governed</option>
          <option value="ungoverned">Ungoverned</option>
          <option value="review_needed">Review Needed</option>
        </select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models..."
          className="max-w-xs dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {/* Models Table */}
      {filteredModels.length === 0 ? (
        <Card className="p-8 text-center dark:bg-gray-900 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            {data?.totalModels === 0
              ? "No models discovered yet. Click \"Sync Now\" to fetch models from MLflow."
              : "No models match the current filters."}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-left">
              <tr>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Model Name</th>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Version</th>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Stage</th>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Matched Use Case</th>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Confidence</th>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-medium dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredModels.map((model) => (
                <tr key={model.id} className="dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3 font-medium dark:text-white">{model.modelName}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{model.latestVersion ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STAGE_STYLES[model.stage ?? "None"] ?? STAGE_STYLES.None}`}>
                      {model.stage ?? "None"}
                    </span>
                  </td>
                  <td className="px-4 py-3 dark:text-gray-300">
                    {model.matchedUseCase ? (
                      <Link
                        href={`/dashboard/${model.matchedUseCase.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {model.matchedUseCase.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 dark:text-gray-300">
                    {model.matchConfidence != null
                      ? `${Math.round(model.matchConfidence * 100)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[model.governanceStatus] ?? ""}`}>
                      {model.governanceStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {linkingModelId === model.id ? (
                      <select
                        className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs dark:text-gray-200"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleMatch(model.id, e.target.value);
                          else setLinkingModelId(null);
                        }}
                        onBlur={() => setLinkingModelId(null)}
                        autoFocus
                      >
                        <option value="">Select use case...</option>
                        {useCases.map((uc) => (
                          <option key={uc.id} value={uc.id}>
                            {uc.title}
                          </option>
                        ))}
                      </select>
                    ) : model.matchedUseCaseId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleMatch(model.id, null)}
                      >
                        Unlink
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setLinkingModelId(model.id)}
                      >
                        Link
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
