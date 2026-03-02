'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Lightbulb,
  Building2,
  GraduationCap,
  Shield,
  BookOpen,
  Zap,
  CheckCircle2,
  FileText,
  Target,
  FlaskConical,
  Database,
  AlertTriangle,
  Scale,
  Globe,
  Info,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RiskRecommendationsPanel } from './risk-assessment/RiskRecommendationsPanel';
import { ManualRiskBrowser } from './risk-assessment/ManualRiskBrowser';
import type { RiskRecommendations } from '@/lib/integrations/types';

// QUBE AI Risk Data Statistics
const QUBE_RISK_STATS = {
  totalRisks: 1206,
  totalMitigations: 254,
  totalControls: 17,
  totalEvaluations: 24,
  taxonomies: [
    { id: 'qube-legacy-mit', name: 'MIT AI Risk Repository', risks: 604, color: 'purple' },
    { id: 'ai-risk-taxonomy', name: 'AIR 2024', risks: 314, color: 'indigo' },
    { id: 'ibm-risk-atlas', name: 'IBM AI Risk Atlas', risks: 99, color: 'blue' },
    { id: 'qube-legacy-ibm', name: 'IBM (Extended)', risks: 89, color: 'sky' },
    { id: 'credo-ucf', name: 'Credo UCF', risks: 49, color: 'violet' },
    { id: 'nist-ai-rmf', name: 'NIST AI RMF', risks: 12, color: 'cyan' },
    { id: 'ailuminate-v1.0', name: 'AILuminate', risks: 12, color: 'amber' },
    { id: 'owasp-llm-2.0', name: 'OWASP Top 10 LLMs', risks: 10, color: 'red' },
    { id: 'ibm-granite-guardian', name: 'Granite Guardian', risks: 13, color: 'emerald' },
    { id: 'shieldgemma-taxonomy', name: 'ShieldGemma', risks: 4, color: 'teal' },
  ],
};

export default function AIRiskIntelligence() {
  const params = useParams();
  const useCaseId = params?.useCaseId as string;

  // AI Recommendations state
  const [showRecommendationsPanel, setShowRecommendationsPanel] = useState(false);
  const [recommendations, setRecommendations] = useState<RiskRecommendations | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Manual Browser state
  const [showManualBrowser, setShowManualBrowser] = useState(false);

  // Info Dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // Assessment-based risk generation state
  const [generatingFromAssessment, setGeneratingFromAssessment] = useState(false);
  const [generatedRisks, setGeneratedRisks] = useState<any[] | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Imported Risks state
  const [importedRisks, setImportedRisks] = useState<any[]>([]);
  const [loadingImportedRisks, setLoadingImportedRisks] = useState(true);

  // Fetch imported risks on component mount
  useEffect(() => {
    if (!useCaseId) return;
    
    const fetchImportedRisks = async () => {
      try {
        setLoadingImportedRisks(true);
        const response = await fetch(`/api/risks/${useCaseId}`);
        if (response.ok) {
          const risksData = await response.json();
          // Filter to show only risks from AI Risk Intelligence (atlas source)
          const atlasRisks = Array.isArray(risksData) 
            ? risksData.filter((r: any) => r.sourceType === 'atlas')
            : [];
          setImportedRisks(atlasRisks);
        }
      } catch (error) {
        console.error('Error fetching imported risks:', error);
      } finally {
        setLoadingImportedRisks(false);
      }
    };

    fetchImportedRisks();
  }, [useCaseId]);

  // Refresh imported risks when panel closes (after import)
  useEffect(() => {
    if (!showRecommendationsPanel && useCaseId) {
      // Refetch risks when panel closes
      fetch(`/api/risks/${useCaseId}`)
        .then(res => res.json())
        .then(data => {
          const atlasRisks = Array.isArray(data) 
            ? data.filter((r: any) => r.sourceType === 'atlas')
            : [];
          setImportedRisks(atlasRisks);
        })
        .catch(err => console.error('Error refreshing risks:', err));
    }
  }, [showRecommendationsPanel, useCaseId]);

  // Fetch AI-powered recommendations using QUBE AI Risk Data LLM-based identification
  const fetchRecommendations = async () => {
    if (!useCaseId) {
      setRecommendationsError('Use case ID not found');
      return;
    }

    setLoadingRecommendations(true);
    setRecommendationsError(null);

    try {
      // Use QUBE AI Risk Data LLM-based risk identification (default: source=atlas)
      // This uses OpenAI to semantically match risks from 1200+ entries across 10 taxonomies
      // and returns enriched data with mitigations, controls, and evaluations
      const response = await fetch(`/api/risks/${useCaseId}/recommendations?source=atlas`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle different error response formats
        let errorMessage = 'Failed to fetch recommendations';
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = JSON.stringify(errorData.error);
        }
        throw new Error(errorMessage);
      }

      const data: RiskRecommendations = await response.json();
      setRecommendations(data);
      setShowRecommendationsPanel(true);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendationsError(error instanceof Error ? error.message : 'Failed to fetch recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleGenerateFromAssessment = async (dryRun: boolean = true) => {
    if (!useCaseId) return;
    setGeneratingFromAssessment(true);
    setGenerationError(null);
    try {
      const response = await fetch(`/api/risks/${useCaseId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to generate risks');
      }
      const data = await response.json();
      if (dryRun) {
        setGeneratedRisks(data.risks);
      } else {
        setGeneratedRisks(null);
        // Refresh imported risks
        const res = await fetch(`/api/risks/${useCaseId}`);
        if (res.ok) {
          const risks = await res.json();
          setImportedRisks(Array.isArray(risks) ? risks.filter((r: any) => r.sourceType === 'atlas' || r.sourceType === 'llm-assessment') : []);
        }
      }
    } catch (err: any) {
      setGenerationError(err.message);
    } finally {
      setGeneratingFromAssessment(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border-l-4 border-purple-500 p-6 rounded-2xl shadow-md relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Risk Intelligence
            </h2>
            <p className="text-muted-foreground mt-1">
              Powered by <span className="font-semibold text-purple-600">QUBE AI Risk Data</span> - comprehensive AI governance data from industry-leading sources
            </p>
          </div>
          {/* Info Icon */}
          <button
            onClick={() => setShowInfoDialog(true)}
            className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            title="View QUBE AI Risk Data details"
          >
            <Info className="h-5 w-5 text-purple-600" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">{QUBE_RISK_STATS.totalRisks}+ Risks</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{QUBE_RISK_STATS.totalMitigations} Mitigations</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{QUBE_RISK_STATS.totalControls} Controls</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
            <FlaskConical className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">{QUBE_RISK_STATS.totalEvaluations} Evaluations</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
            <Database className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">{QUBE_RISK_STATS.taxonomies.length} Taxonomies</span>
          </div>
        </div>
      </div>

      {/* Two Main Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: AI-Powered Recommendations */}
        <Card className="border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/10 dark:to-blue-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  AI-Powered Recommendations
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Get intelligent risk recommendations with mitigations & evaluations
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-purple-600 font-semibold">•</span>
                <p>Analyzes your assessment across 10 taxonomies</p>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-600 font-semibold">•</span>
                <p>Matches risks from IBM, NIST, MIT, OWASP, Credo & more</p>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-600 font-semibold">•</span>
                <p className="text-green-600 font-medium">NEW: Includes mitigations, controls & evaluations</p>
              </div>
            </div>

            {recommendationsError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-xs text-red-600 dark:text-red-500">{recommendationsError}</p>
              </div>
            )}

            <Button
              onClick={fetchRecommendations}
              disabled={loadingRecommendations}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              size="lg"
            >
              {loadingRecommendations ? (
                <>
                  Analyzing Assessment...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get AI Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Manual Database Browsing */}
        <Card className="border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  Browse All Risk Databases
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Manually explore {QUBE_RISK_STATS.totalRisks}+ risks from all sources
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <p>Browse 1200+ risks across 10 AI governance taxonomies</p>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <p>Search with AI-powered semantic matching</p>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <p>Filter by source: MIT, IBM, NIST, OWASP, Credo & more</p>
              </div>
            </div>

            <Button
              onClick={() => setShowManualBrowser(true)}
              variant="outline"
              className="w-full border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              size="lg"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Browse Risk Databases
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Option 3: Generate from Assessment Context */}
      <Card className="border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/10 dark:to-emerald-950/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground mb-1">
                Generate from Assessment
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                LLM-scored risks using your full assessment context
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="text-green-600 font-semibold">•</span>
              <p>Uses all assessment answers (real + AI-inferred) for context</p>
            </div>
            <div className="flex gap-2">
              <span className="text-green-600 font-semibold">•</span>
              <p>Severity scoring with justifications (1-10 scale)</p>
            </div>
            <div className="flex gap-2">
              <span className="text-green-600 font-semibold">•</span>
              <p>Suggested mitigations for each identified risk</p>
            </div>
          </div>

          {generationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md text-sm">
              {generationError}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleGenerateFromAssessment(true)}
              disabled={generatingFromAssessment}
              variant="outline"
              className="flex-1 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
            >
              {generatingFromAssessment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Preview Risks
                </>
              )}
            </Button>
            {generatedRisks && generatedRisks.length > 0 && (
              <Button
                onClick={() => handleGenerateFromAssessment(false)}
                disabled={generatingFromAssessment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Import {generatedRisks.length} Risks
              </Button>
            )}
          </div>

          {/* Preview of generated risks */}
          {generatedRisks && generatedRisks.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {generatedRisks.map((risk: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{risk.riskName}</span>
                    <Badge variant={
                      risk.severityLabel === 'Critical' ? 'destructive' :
                      risk.severityLabel === 'High' ? 'destructive' :
                      risk.severityLabel === 'Medium' ? 'secondary' : 'outline'
                    }>
                      {risk.severityLabel} ({risk.severity}/10)
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{risk.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Imported Risks Section */}
      <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/10 dark:to-blue-950/10">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            Imported Risks ({importedRisks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingImportedRisks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-sm text-muted-foreground">Loading imported risks...</span>
            </div>
          ) : importedRisks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No risks imported yet. Use AI Recommendations or Browse Databases to import risks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {importedRisks.map((risk) => (
                <Card 
                  key={risk.id} 
                  className="border-l-4 bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700"
                  style={{
                    borderLeftColor: risk.riskLevel === 'Critical' ? '#ef4444' :
                      risk.riskLevel === 'High' ? '#f97316' :
                      risk.riskLevel === 'Medium' ? '#eab308' : '#22c55e'
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`text-xs px-2 py-0.5 ${
                            risk.riskLevel === 'Critical' ? 'bg-red-500 text-white' :
                            risk.riskLevel === 'High' ? 'bg-orange-500 text-white' :
                            risk.riskLevel === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                          }`}>
                            {risk.riskLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {risk.category}
                          </Badge>
                          {risk.sourceType && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {risk.sourceType === 'atlas' ? 'QUBE AI Risk Data' : risk.sourceType}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          {risk.title || risk.category}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {risk.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QUBE AI Risk Data Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              What's Included with QUBE AI Risk Data
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Risks */}
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-900 dark:text-red-200">Risks</h3>
                </div>
                <p className="text-3xl font-bold text-red-600 mb-1">{QUBE_RISK_STATS.totalRisks}+</p>
                <p className="text-xs text-muted-foreground">From 10 taxonomies including IBM, NIST, MIT, OWASP, Credo, AILuminate</p>
              </div>

              {/* Mitigations */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-200">Mitigations</h3>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">{QUBE_RISK_STATS.totalMitigations}</p>
                <p className="text-xs text-muted-foreground">Actions from NIST AI RMF (212) and Credo UCF (42)</p>
              </div>

              {/* Controls */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">Controls</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">{QUBE_RISK_STATS.totalControls}</p>
                <p className="text-xs text-muted-foreground">Detection controls from Granite Guardian & ShieldGemma</p>
              </div>

              {/* Evaluations */}
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-200">Evaluations</h3>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-1">{QUBE_RISK_STATS.totalEvaluations}</p>
                <p className="text-xs text-muted-foreground">Benchmarks: TruthfulQA, BBQ, BOLD, AttaQ & more</p>
              </div>
            </div>

            {/* Risk Taxonomies Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                Available Risk Taxonomies (10 Sources)
              </h3>

              {/* Primary Sources */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* IBM Risk Atlas */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-200">IBM AI Risk Atlas</h3>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">99 risks</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Curated AI risks covering agentic AI, data privacy, generative AI, and security
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Agentic AI</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">GenAI</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Privacy</span>
                  </div>
                </div>

                {/* AIR 2024 */}
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">AIR 2024 Taxonomy</h3>
                    </div>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">314 risks</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Comprehensive taxonomy from government and company AI policies worldwide
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">Policy</span>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">Government</span>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">Comprehensive</span>
                  </div>
                </div>

                {/* NIST AI RMF */}
                <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-cyan-600" />
                      <h3 className="font-semibold text-cyan-900 dark:text-cyan-200">NIST AI RMF</h3>
                    </div>
                    <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">12 risks + 212 actions</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    U.S. government framework for AI risk management with comprehensive mitigations
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded">Governance</span>
                    <span className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded">Compliance</span>
                    <span className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded">Actions</span>
                  </div>
                </div>
              </div>

              {/* Secondary Sources */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* MIT */}
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-200">MIT AI Risk Repository</h3>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 mb-2">33 risks</Badge>
                  <p className="text-xs text-muted-foreground">Domain & causal risk classifications</p>
                </div>

                {/* Credo UCF */}
                <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-violet-600" />
                    <h3 className="font-semibold text-sm text-violet-900 dark:text-violet-200">Credo UCF</h3>
                  </div>
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 mb-2">49 risks + 42 actions</Badge>
                  <p className="text-xs text-muted-foreground">Unified control framework</p>
                </div>

                {/* OWASP */}
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    <h3 className="font-semibold text-sm text-red-900 dark:text-red-200">OWASP Top 10 LLMs</h3>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 mb-2">10 risks</Badge>
                  <p className="text-xs text-muted-foreground">Critical LLM security vulnerabilities</p>
                </div>

                {/* AILuminate */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">AILuminate</h3>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 mb-2">12 risks</Badge>
                  <p className="text-xs text-muted-foreground">MLCommons safety benchmark</p>
                </div>
              </div>

              {/* Detection Controls */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Granite Guardian */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">IBM Granite Guardian</h3>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">13 controls</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detection controls: Harm, Bias, Jailbreak, Groundedness, Relevance, Profanity & more
                  </p>
                </div>

                {/* ShieldGemma */}
                <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-teal-600" />
                      <h3 className="font-semibold text-teal-900 dark:text-teal-200">Google ShieldGemma</h3>
                    </div>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">4 controls</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Content safety: Sexually Explicit, Dangerous, Hate Speech, Harassment detection
                  </p>
                </div>
              </div>
            </div>

            {/* Evaluations & Benchmarks Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-600" />
                Included Evaluations & Benchmarks ({QUBE_RISK_STATS.totalEvaluations})
              </h3>
              <div className="grid md:grid-cols-4 gap-3">
                {[
                  { name: 'TruthfulQA', desc: 'Truthfulness' },
                  { name: 'BBQ', desc: 'Bias detection' },
                  { name: 'BOLD', desc: 'Bias in generation' },
                  { name: 'Discrim_eval', desc: 'Discrimination' },
                  { name: 'AttaQ', desc: 'Harmlessness' },
                  { name: 'ProvoQ', desc: 'Stigma sensitivity' },
                  { name: 'CrowS-Pairs', desc: 'Stereotypes' },
                  { name: 'AILuminate', desc: 'Safety benchmark' },
                  { name: 'FM Transparency', desc: 'Model transparency' },
                  { name: 'ALERT', desc: 'Red-teaming' },
                  { name: 'SALAD-Bench', desc: 'Safety evaluation' },
                  { name: 'ToxiGen', desc: 'Toxicity detection' },
                ].map((eval_item) => (
                  <div key={eval_item.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                    <p className="font-medium text-sm">{eval_item.name}</p>
                    <p className="text-xs text-muted-foreground">{eval_item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Recommendations Panel (Modal) */}
      {showRecommendationsPanel && recommendations && (
        <RiskRecommendationsPanel
          open={showRecommendationsPanel}
          onClose={() => setShowRecommendationsPanel(false)}
          recommendations={recommendations}
          useCaseId={useCaseId}
        />
      )}

      {/* Manual Risk Browser (Modal) */}
      {showManualBrowser && (
        <ManualRiskBrowser
          open={showManualBrowser}
          onClose={() => setShowManualBrowser(false)}
          useCaseId={useCaseId}
        />
      )}
    </div>
  );
}
