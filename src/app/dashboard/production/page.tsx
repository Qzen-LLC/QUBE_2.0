"use client";

import React, { useState, useEffect } from "react";
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
}

const DEFAULT_CONFIG: ProductionConfig = {
  awsRegion: "us-east-1",
  awsCostExplorerEnabled: false,
  langfuseEnabled: false,
  langfuseHost: "https://cloud.langfuse.com",
  langsmithEnabled: false,
  langsmithProject: "",
};

export default function ProductionConfigPage() {
  const [config, setConfig] = useState<ProductionConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

      {/* AWS Cost Explorer */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold dark:text-white">AWS Cost Explorer</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reconcile projected FinOps costs against actual AWS spend.
            </p>
          </div>
          <Switch
            checked={config.awsCostExplorerEnabled}
            onCheckedChange={(checked) =>
              setConfig((c) => ({ ...c, awsCostExplorerEnabled: checked }))
            }
          />
        </div>
        {config.awsCostExplorerEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">AWS Region</Label>
              <Input
                value={config.awsRegion}
                onChange={(e) => setConfig((c) => ({ ...c, awsRegion: e.target.value }))}
                placeholder="us-east-1"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) must be set as environment variables.
            </p>
          </div>
        )}
      </Card>

      {/* Langfuse */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold dark:text-white">Langfuse</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor guardrail eval metrics via Langfuse.
            </p>
          </div>
          <Switch
            checked={config.langfuseEnabled}
            onCheckedChange={(checked) =>
              setConfig((c) => ({ ...c, langfuseEnabled: checked }))
            }
          />
        </div>
        {config.langfuseEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">Langfuse Host</Label>
              <Input
                value={config.langfuseHost}
                onChange={(e) => setConfig((c) => ({ ...c, langfuseHost: e.target.value }))}
                placeholder="https://cloud.langfuse.com"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set as environment variables.
            </p>
          </div>
        )}
      </Card>

      {/* LangSmith */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold dark:text-white">LangSmith</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor guardrail eval metrics via LangSmith.
            </p>
          </div>
          <Switch
            checked={config.langsmithEnabled}
            onCheckedChange={(checked) =>
              setConfig((c) => ({ ...c, langsmithEnabled: checked }))
            }
          />
        </div>
        {config.langsmithEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">LangSmith Project</Label>
              <Input
                value={config.langsmithProject}
                onChange={(e) => setConfig((c) => ({ ...c, langsmithProject: e.target.value }))}
                placeholder="my-project"
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              LANGSMITH_API_KEY must be set as an environment variable.
            </p>
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
