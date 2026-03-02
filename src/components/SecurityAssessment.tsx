'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, BookOpen, Zap, AlertTriangle, Info, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RiskRecommendations } from '@/lib/integrations/types';
import { SecurityRecommendationsPanel } from './security-assessment/SecurityRecommendationsPanel';
import { ManualMitreBrowser } from './security-assessment/ManualMitreBrowser';

export default function SecurityAssessment() {
  const params = useParams();
  const useCaseId = params?.useCaseId as string;

  // AI Security Recommendations state
  const [showRecommendationsPanel, setShowRecommendationsPanel] = useState(false);
  const [recommendations, setRecommendations] = useState<RiskRecommendations | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Manual MITRE Browser state
  const [showManualBrowser, setShowManualBrowser] = useState(false);

  // Info Dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // Imported Security Risks state
  const [importedRisks, setImportedRisks] = useState<any[]>([]);
  const [loadingImportedRisks, setLoadingImportedRisks] = useState(true);

  // Fetch imported security risks on component mount
  useEffect(() => {
    if (!useCaseId) return;
    
    const fetchImportedRisks = async () => {
      try {
        setLoadingImportedRisks(true);
        const response = await fetch(`/api/risks/${useCaseId}`);
        if (response.ok) {
          const risksData = await response.json();
          // Filter to show only MITRE ATLAS risks (mitre source)
          const mitreRisks = Array.isArray(risksData) 
            ? risksData.filter((r: any) => r.sourceType === 'mitre')
            : [];
          setImportedRisks(mitreRisks);
        }
      } catch (error) {
        console.error('Error fetching imported security risks:', error);
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
          const mitreRisks = Array.isArray(data) 
            ? data.filter((r: any) => r.sourceType === 'mitre')
            : [];
          setImportedRisks(mitreRisks);
        })
        .catch(err => console.error('Error refreshing risks:', err));
    }
  }, [showRecommendationsPanel, useCaseId]);

  // Fetch AI-powered security recommendations
  const fetchSecurityRecommendations = async () => {
    if (!useCaseId) {
      setRecommendationsError('Use case ID not found');
      return;
    }

    setLoadingRecommendations(true);
    setRecommendationsError(null);

    try {
      // Fetch MITRE ATLAS techniques only (Step 11: Security Assessment)
      const response = await fetch(`/api/risks/${useCaseId}/recommendations?source=security`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle different error response formats
        let errorMessage = 'Failed to fetch security recommendations';
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
      console.error('Error fetching security recommendations:', error);
      setRecommendationsError(
        error instanceof Error ? error.message : 'Failed to fetch security recommendations'
      );
    } finally {
      setLoadingRecommendations(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-amber-950/20 border-l-4 border-red-500 p-6 rounded-2xl shadow-md relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Security Assessment - MITRE ATLAS
            </h2>
            <p className="text-muted-foreground mt-1">
              Identify adversarial tactics and techniques targeting AI systems with MITRE's comprehensive framework
            </p>
          </div>
          {/* Info Icon */}
          <button
            onClick={() => setShowInfoDialog(true)}
            className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            title="View MITRE ATLAS Framework details"
          >
            <Info className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>

      {/* Two Main Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: AI-Powered Security Recommendations */}
        <Card className="border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/10 dark:to-orange-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  AI-Powered Security Recommendations
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  AI analyzes your assessment to identify relevant adversarial techniques
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">•</span>
                <p>Analyzes your AI system characteristics and architecture</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">•</span>
                <p>Maps to MITRE ATLAS tactics and adversarial techniques</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">•</span>
                <p>Provides mitigations and real-world attack case studies</p>
              </div>
            </div>

            {recommendationsError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-xs text-red-600 dark:text-red-500">{recommendationsError}</p>
              </div>
            )}

            <Button
              onClick={fetchSecurityRecommendations}
              disabled={loadingRecommendations}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
              size="lg"
            >
              {loadingRecommendations ? (
                <>
                  Analyzing Security Posture...
                </>
              ) : (
                <>
                  <ShieldAlert className="mr-2 h-5 w-5" />
                  Get Security Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Manual MITRE ATLAS Browsing */}
        <Card className="border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  Browse MITRE ATLAS Database
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Manually explore all adversarial techniques and tactics
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-orange-600 font-semibold">•</span>
                <p>Browse 140+ adversarial techniques for AI systems</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-600 font-semibold">•</span>
                <p>Organized across 14 attack tactics from reconnaissance to impact</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-600 font-semibold">•</span>
                <p>Filter by tactic, severity, and real-world case studies</p>
              </div>
            </div>

            <Button
              onClick={() => setShowManualBrowser(true)}
              variant="outline"
              className="w-full border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              size="lg"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Browse MITRE ATLAS Techniques
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Imported Security Risks Section */}
      <Card className="border-red-200 dark:border-red-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/10 dark:to-orange-950/10">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-red-600" />
            Imported Security Risks ({importedRisks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingImportedRisks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              <span className="ml-2 text-sm text-muted-foreground">Loading imported security risks...</span>
            </div>
          ) : importedRisks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No security risks imported yet. Use AI Security Recommendations or Browse MITRE ATLAS to import risks.
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
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            MITRE ATLAS
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          {risk.title || risk.category}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {risk.description}
                        </p>
                        {risk.mitigationPlan && (
                          <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Mitigation:</p>
                            <p className="text-sm text-foreground">{risk.mitigationPlan}</p>
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
      </Card>

      {/* MITRE ATLAS Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              MITRE ATLAS Framework for AI Security
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* MITRE ATLAS Info Card */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    Adversarial Threat Landscape for AI Systems
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    MITRE ATLAS is a globally accessible knowledge base of adversary tactics and techniques based on
                    real-world attack observations. It complements MITRE ATT&CK specifically for AI/ML systems.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-900">
                      <div className="text-2xl font-bold text-red-600">140+</div>
                      <div className="text-xs text-muted-foreground mt-1">Adversarial Techniques</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-orange-100 dark:border-orange-900">
                      <div className="text-2xl font-bold text-orange-600">14</div>
                      <div className="text-xs text-muted-foreground mt-1">Attack Tactics</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-amber-100 dark:border-amber-900">
                      <div className="text-2xl font-bold text-amber-600">25+</div>
                      <div className="text-xs text-muted-foreground mt-1">Real-World Case Studies</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Tactics Grid */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Key Adversarial Tactics</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'Reconnaissance', description: 'Gathering AI system information' },
                  { name: 'Initial Access', description: 'Gaining access to AI systems' },
                  { name: 'ML Attack Staging', description: 'Preparing ML-specific attacks' },
                  { name: 'Exfiltration', description: 'Stealing model data and outputs' },
                  { name: 'Impact', description: 'Manipulating AI system behavior' },
                  { name: 'Defense Evasion', description: 'Avoiding detection mechanisms' },
                ].map((tactic) => (
                  <div
                    key={tactic.name}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="font-semibold text-sm text-foreground mb-1">{tactic.name}</div>
                    <div className="text-xs text-muted-foreground">{tactic.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Recommendations Panel (Modal) */}
      {showRecommendationsPanel && recommendations && (
        <SecurityRecommendationsPanel
          open={showRecommendationsPanel}
          onClose={() => setShowRecommendationsPanel(false)}
          recommendations={recommendations}
          useCaseId={useCaseId}
        />
      )}

      {/* Manual MITRE Browser (Modal) */}
      {showManualBrowser && (
        <ManualMitreBrowser
          open={showManualBrowser}
          onClose={() => setShowManualBrowser(false)}
          useCaseId={useCaseId}
        />
      )}
    </div>
  );
}
