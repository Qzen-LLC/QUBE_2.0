'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Edit3,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { PillarProfile, InferredField, PillarKey } from '@/lib/expansion/types';
import { PILLAR_LABELS } from '@/lib/expansion/types';

interface ExpansionReviewProps {
  useCaseId: string;
}

interface ExpansionData {
  id: string;
  status: string;
  overallConfidence: number;
  coreAnswerCount: number;
  expandedFieldCount: number;
  modelUsed: string;
  expansionDuration: number;
  userReviewed: boolean;
  requirementsProfile: PillarProfile | null;
  technicalProfile: PillarProfile | null;
  businessProfile: PillarProfile | null;
  responsibleEthicalProfile: PillarProfile | null;
  legalRegulatoryProfile: PillarProfile | null;
  dataReadinessProfile: PillarProfile | null;
  finopsProfile: PillarProfile | null;
}

const PILLAR_KEYS: { key: PillarKey; profileField: string }[] = [
  { key: 'requirements', profileField: 'requirementsProfile' },
  { key: 'technical', profileField: 'technicalProfile' },
  { key: 'business', profileField: 'businessProfile' },
  { key: 'responsibleEthical', profileField: 'responsibleEthicalProfile' },
  { key: 'legalRegulatory', profileField: 'legalRegulatoryProfile' },
  { key: 'dataReadiness', profileField: 'dataReadinessProfile' },
  { key: 'finops', profileField: 'finopsProfile' },
];

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">High ({Math.round(confidence * 100)}%)</Badge>;
  }
  if (confidence >= 0.5) {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">Medium ({Math.round(confidence * 100)}%)</Badge>;
  }
  return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">Low ({Math.round(confidence * 100)}%)</Badge>;
}

export function ExpansionReview({ useCaseId }: ExpansionReviewProps) {
  const [expansion, setExpansion] = useState<ExpansionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!useCaseId) return;
    setLoading(true);
    fetch(`/api/assessment-expansion?useCaseId=${useCaseId}`)
      .then(res => res.json())
      .then(data => {
        setExpansion(data.expansion);
        if (data.expansion?.userOverrides) {
          setOverrides(data.expansion.userOverrides);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [useCaseId]);

  const handleSaveOverrides = async () => {
    if (!expansion) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/assessment-expansion/${expansion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userOverrides: overrides }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setExpansion(data.expansion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAll = () => {
    // Accepting all means no overrides needed — just mark as reviewed
    handleSaveOverrides();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading expansion results...</span>
      </div>
    );
  }

  if (!expansion || expansion.status !== 'completed') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-muted-foreground">
            {expansion?.status === 'expanding'
              ? 'Expansion is in progress. Please wait...'
              : expansion?.status === 'failed'
                ? 'Expansion failed. Please try again from the assessment page.'
                : 'No expansion found. Start by answering core questions and clicking "Expand with AI".'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Expansion Review
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review AI-inferred answers across all pillars. Accept, edit, or reject each field.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAcceptAll}
            disabled={saving}
          >
            <Check className="mr-2 h-4 w-4" />
            Accept All
          </Button>
          <Button
            onClick={handleSaveOverrides}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Review
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{expansion.coreAnswerCount}</div>
            <div className="text-sm text-muted-foreground">Core Answers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{expansion.expandedFieldCount}</div>
            <div className="text-sm text-muted-foreground">AI-Inferred Fields</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{Math.round(expansion.overallConfidence * 100)}%</div>
            <div className="text-sm text-muted-foreground">Overall Confidence</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{((expansion.expansionDuration || 0) / 1000).toFixed(1)}s</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Pillar Accordions */}
      {PILLAR_KEYS.map(({ key, profileField }) => {
        const profile = (expansion as any)[profileField] as PillarProfile | null;
        if (!profile || !profile.fields || Object.keys(profile.fields).length === 0) return null;

        const isExpanded = expandedPillar === key;
        const fieldEntries = Object.entries(profile.fields);

        return (
          <Card key={key}>
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
              onClick={() => setExpandedPillar(isExpanded ? null : key)}
            >
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{PILLAR_LABELS[key]}</h3>
                <Badge variant="outline">{fieldEntries.length} fields</Badge>
                <ConfidenceBadge confidence={profile.pillarConfidence} />
              </div>
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>

            {isExpanded && (
              <CardContent className="border-t pt-4">
                <div className="space-y-3">
                  {fieldEntries.map(([fieldKey, field]) => {
                    const f = field as InferredField;
                    const overrideKey = `${key}.${fieldKey}`;
                    const hasOverride = overrides[overrideKey] !== undefined;

                    return (
                      <div key={fieldKey} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{fieldKey}</span>
                            <ConfidenceBadge confidence={f.confidence} />
                            {f.source === 'user' && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">User</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Answer: </span>
                          {hasOverride ? (
                            <span className="text-purple-700 dark:text-purple-400 font-medium">
                              {String(overrides[overrideKey])} (overridden)
                            </span>
                          ) : (
                            <span>{String(f.value)}</span>
                          )}
                        </div>
                        {f.reasoning && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Reasoning: {f.reasoning}
                          </p>
                        )}
                        {f.inferredFrom && f.inferredFrom.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Inferred from: {f.inferredFrom.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
