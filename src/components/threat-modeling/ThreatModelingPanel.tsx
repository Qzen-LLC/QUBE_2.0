'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Target,
  Trash2,
} from 'lucide-react';

interface Threat {
  id: string;
  title: string;
  description: string;
  category: string;
  framework: string;
  severity: string;
  severityScore: number;
  likelihood: string;
  attackVector: string;
  affectedAsset: string;
  mitigationPlan: string;
  mitreTechniqueIds: string[];
  justification: string;
  sourceType: string;
  status: string;
  createdAt: string;
}

const STRIDE_COLORS: Record<string, string> = {
  'Spoofing': 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
  'Tampering': 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
  'Repudiation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
  'Information Disclosure': 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  'Denial of Service': 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  'Elevation of Privilege': 'bg-pink-100 text-pink-800 dark:bg-pink-950/30 dark:text-pink-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  'Critical': 'bg-red-600 text-white',
  'High': 'bg-orange-500 text-white',
  'Medium': 'bg-yellow-500 text-black',
  'Low': 'bg-green-500 text-white',
};

export function ThreatModelingPanel({ useCaseId }: { useCaseId: string }) {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedThreat, setExpandedThreat] = useState<string | null>(null);

  const fetchThreats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/threats/${useCaseId}`);
      if (res.ok) {
        const data = await res.json();
        setThreats(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching threats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (useCaseId) fetchThreats();
  }, [useCaseId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/threats/${useCaseId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to generate threats');
      }
      await fetchThreats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (threatId: string) => {
    if (!confirm('Delete this threat?')) return;
    try {
      await fetch(`/api/threats/${useCaseId}/${threatId}`, { method: 'DELETE' });
      setThreats(threats.filter(t => t.id !== threatId));
    } catch (err) {
      console.error('Error deleting threat:', err);
    }
  };

  // Summary counts by category
  const categoryCount: Record<string, number> = {};
  const severityCount: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const t of threats) {
    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    severityCount[t.severity] = (severityCount[t.severity] || 0) + 1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading threat model...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            AI Threat Model
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            STRIDE framework analysis with MITRE ATLAS technique mapping
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              {threats.length > 0 ? 'Regenerate Threat Model' : 'Generate Threat Model'}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {threats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{threats.length}</div>
              <div className="text-sm text-muted-foreground">Total Threats</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-red-600">{severityCount.Critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-orange-500">{severityCount.High}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">{severityCount.Medium + severityCount.Low}</div>
              <div className="text-sm text-muted-foreground">Medium/Low</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STRIDE Category Distribution */}
      {threats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCount).map(([cat, count]) => (
            <Badge key={cat} className={STRIDE_COLORS[cat] || 'bg-gray-100 text-gray-800'}>
              {cat}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Threat List */}
      {threats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">
              No threats identified yet. Click &quot;Generate Threat Model&quot; to analyze this use case.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threats.map((threat) => (
            <Card key={threat.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedThreat(expandedThreat === threat.id ? null : threat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <AlertTriangle className={`h-5 w-5 ${
                      threat.severity === 'Critical' ? 'text-red-600' :
                      threat.severity === 'High' ? 'text-orange-500' :
                      threat.severity === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <div>
                      <h3 className="font-semibold">{threat.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{threat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STRIDE_COLORS[threat.category] || ''}>
                      {threat.category}
                    </Badge>
                    <Badge className={SEVERITY_COLORS[threat.severity] || ''}>
                      {threat.severity} ({threat.severityScore}/10)
                    </Badge>
                    {expandedThreat === threat.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {expandedThreat === threat.id && (
                <CardContent className="border-t pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Likelihood:</span>
                      <span className="ml-2">{threat.likelihood}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Framework:</span>
                      <span className="ml-2">{threat.framework}</span>
                    </div>
                    {threat.attackVector && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Attack Vector:</span>
                        <p className="mt-1">{threat.attackVector}</p>
                      </div>
                    )}
                    {threat.affectedAsset && (
                      <div>
                        <span className="font-medium text-muted-foreground">Affected Asset:</span>
                        <span className="ml-2">{threat.affectedAsset}</span>
                      </div>
                    )}
                    {threat.mitreTechniqueIds.length > 0 && (
                      <div>
                        <span className="font-medium text-muted-foreground">MITRE Techniques:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {threat.mitreTechniqueIds.map(id => (
                            <Badge key={id} variant="outline" className="text-xs">
                              {id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {threat.mitigationPlan && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Mitigation Plan:</span>
                        <p className="mt-1 p-2 bg-green-50 dark:bg-green-950/20 rounded">{threat.mitigationPlan}</p>
                      </div>
                    )}
                    {threat.justification && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Justification:</span>
                        <p className="mt-1 text-muted-foreground italic">{threat.justification}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => { e.stopPropagation(); handleDelete(threat.id); }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
