"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProductionConfig {
  awsRegion: string;
  awsCostExplorerEnabled: boolean;
  langfuseEnabled: boolean;
  langfuseHost: string;
  langsmithEnabled: boolean;
  langsmithProject: string;
  mlflowEnabled: boolean;
  mlflowTrackingUrl: string;
  mlflowAuthUsername: string;
  mlflowAuthPassword: string;
}

const DEFAULT_CONFIG: ProductionConfig = {
  awsRegion: "us-east-1",
  awsCostExplorerEnabled: false,
  langfuseEnabled: false,
  langfuseHost: "https://cloud.langfuse.com",
  langsmithEnabled: false,
  langsmithProject: "",
  mlflowEnabled: false,
  mlflowTrackingUrl: "",
  mlflowAuthUsername: "",
  mlflowAuthPassword: "",
};

export default function ProductionConfigPage() {
  const [config, setConfig] = useState<ProductionConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mlflowTestResult, setMlflowTestResult] = useState<{ available: boolean; modelCount?: number; error?: string } | null>(null);
  const [mlflowTesting, setMlflowTesting] = useState(false);

  useEffect(() => {
    fetch("/api/production/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config) {
          setConfig({
            awsRegion: data.config.awsRegion || DEFAULT_CONFIG.awsRegion,
            awsCostExplorerEnabled: data.config.awsCostExplorerEnabled ?? false,
            langfuseEnabled: data.config.langfuseEnabled ?? false,
            langfuseHost: data.config.langfuseHost || DEFAULT_CONFIG.langfuseHost,
            langsmithEnabled: data.config.langsmithEnabled ?? false,
            langsmithProject: data.config.langsmithProject || "",
            mlflowEnabled: data.config.mlflowEnabled ?? false,
            mlflowTrackingUrl: data.config.mlflowTrackingUrl || "",
            mlflowAuthUsername: data.config.mlflowAuthUsername || "",
            mlflowAuthPassword: data.config.mlflowAuthPassword || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/production/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Configuration saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save configuration." });
    } finally {
      setSaving(false);
    }
  };

  const handleMlflowTest = async () => {
    setMlflowTesting(true);
    setMlflowTestResult(null);
    try {
      const res = await fetch("/api/production/mlflow/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingUrl: config.mlflowTrackingUrl,
          authUsername: config.mlflowAuthUsername || undefined,
          authPassword: config.mlflowAuthPassword || undefined,
        }),
      });
      const data = await res.json();
      setMlflowTestResult(data);
    } catch {
      setMlflowTestResult({ available: false, error: "Request failed" });
    } finally {
      setMlflowTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Production Tie-Back Configuration</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect your production infrastructure for cost reconciliation and eval monitoring.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* MLflow Model Registry */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold dark:text-white">MLflow Model Registry</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Discover registered AI models and reconcile against governed use cases.
            </p>
          </div>
          <Switch
            checked={config.mlflowEnabled}
            onCheckedChange={(checked) =>
              setConfig((c) => ({ ...c, mlflowEnabled: checked }))
            }
          />
        </div>
        {config.mlflowEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">MLflow Tracking URL</Label>
              <Input
                value={config.mlflowTrackingUrl}
                onChange={(e) => setConfig((c) => ({ ...c, mlflowTrackingUrl: e.target.value }))}
                placeholder="http://localhost:5000"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">Username (optional)</Label>
              <Input
                value={config.mlflowAuthUsername}
                onChange={(e) => setConfig((c) => ({ ...c, mlflowAuthUsername: e.target.value }))}
                placeholder="username"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">Password (optional)</Label>
              <Input
                type="password"
                value={config.mlflowAuthPassword}
                onChange={(e) => setConfig((c) => ({ ...c, mlflowAuthPassword: e.target.value }))}
                placeholder="password"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMlflowTest}
                disabled={mlflowTesting || !config.mlflowTrackingUrl}
              >
                {mlflowTesting ? "Testing..." : "Test Connection"}
              </Button>
              {mlflowTestResult && (
                <span
                  className={`text-sm ${
                    mlflowTestResult.available
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {mlflowTestResult.available
                    ? `Connected — ${mlflowTestResult.modelCount ?? 0} models found`
                    : mlflowTestResult.error || "Connection failed"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Enter your MLflow tracking server URL. Auth is optional for open servers.
            </p>
            <Link
              href="/dashboard/production/mlflow-discovery"
              className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Model Discovery →
            </Link>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
