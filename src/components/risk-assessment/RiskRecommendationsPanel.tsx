'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Brain,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Download,
  Zap,
  BookOpen,
  Settings2,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type {
  RiskRecommendations,
  AtlasEnrichedRisk,
  AtlasAction,
  AtlasRiskControl,
  AtlasEvaluation,
} from '@/lib/integrations/types';
import { useToast } from '@/hooks/use-toast';

interface RiskRecommendationsPanelProps {
  open: boolean;
  onClose: () => void;
  recommendations: RiskRecommendations;
  useCaseId: string;
}

interface SelectedRisk {
  source: 'atlas';
  sourceId: string;
}

// Severity badge styling
const severityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

// Taxonomy badge colors
const taxonomyColors: Record<string, string> = {
  'ibm-risk-atlas': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'air-2024': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'ailuminate': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'nist-ai-rmf': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'credo-ucf': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  'owasp-llm': 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'granite-guardian': 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  'shieldgemma': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

// Risk Card Component
function AtlasRiskCard({
  risk,
  selected,
  onToggle,
  mitigations,
  controls,
  evaluations,
}: {
  risk: AtlasEnrichedRisk;
  selected: boolean;
  onToggle: () => void;
  mitigations: AtlasAction[];
  controls: AtlasRiskControl[];
  evaluations: AtlasEvaluation[];
}) {
  const [expanded, setExpanded] = useState(false);

  // Get related mitigations, controls, evaluations
  const relatedMitigations = mitigations.filter(
    (m) => risk.relatedActions?.includes(m.id) || m.hasRelatedRisk?.includes(risk.id)
  );
  const relatedControls = controls.filter(
    (c) => risk.relatedControls?.includes(c.id) || c.detectsRisk?.includes(risk.id)
  );
  const relatedEvaluations = evaluations.filter(
    (e) => risk.relatedEvaluations?.includes(e.id) || e.assessesRisk?.includes(risk.id)
  );

  return (
    <Card
      className={`transition-all cursor-pointer ${
        selected
          ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950'
          : 'hover:shadow-md'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1" onClick={onToggle}>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={taxonomyColors[risk.isDefinedByTaxonomy] || 'bg-gray-100'}
              >
                {risk.taxonomyName || risk.isDefinedByTaxonomy}
              </Badge>
              {risk.severity && (
                <Badge variant="secondary" className={severityColors[risk.severity]}>
                  {risk.severity}
                </Badge>
              )}
              {risk.tag && (
                <Badge variant="outline" className="text-xs">
                  {risk.tag}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-semibold">{risk.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{risk.description}</p>

        {/* Related items summary */}
        <div className="flex gap-3 mt-3">
          {relatedMitigations.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Settings2 className="h-3 w-3" />
              {relatedMitigations.length} mitigation(s)
            </div>
          )}
          {relatedControls.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              {relatedControls.length} control(s)
            </div>
          )}
          {relatedEvaluations.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FlaskConical className="h-3 w-3" />
              {relatedEvaluations.length} evaluation(s)
            </div>
          )}
        </div>

        {/* Expandable related items */}
        {(relatedMitigations.length > 0 ||
          relatedControls.length > 0 ||
          relatedEvaluations.length > 0) && (
          <Collapsible open={expanded} onOpenChange={setExpanded} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {expanded ? 'Hide' : 'Show'} related items
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {relatedMitigations.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium flex items-center gap-1 text-teal-600">
                    <Settings2 className="h-3 w-3" />
                    Mitigations
                  </div>
                  {relatedMitigations.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="text-xs text-muted-foreground pl-4 py-1 border-l-2 border-teal-200"
                    >
                      <span className="font-medium">{m.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {relatedControls.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium flex items-center gap-1 text-slate-600">
                    <Shield className="h-3 w-3" />
                    Controls
                  </div>
                  {relatedControls.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="text-xs text-muted-foreground pl-4 py-1 border-l-2 border-slate-200"
                    >
                      <span className="font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {relatedEvaluations.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium flex items-center gap-1 text-purple-600">
                    <FlaskConical className="h-3 w-3" />
                    Evaluations
                  </div>
                  {relatedEvaluations.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="text-xs text-muted-foreground pl-4 py-1 border-l-2 border-purple-200"
                    >
                      <span className="font-medium">{e.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

// Mitigation Card Component
function MitigationCard({ mitigation }: { mitigation: AtlasAction }) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="secondary"
            className={taxonomyColors[mitigation.isDefinedByTaxonomy] || 'bg-gray-100'}
          >
            {mitigation.isDefinedByTaxonomy === 'nist-ai-rmf' ? 'NIST AI RMF' : 'Credo UCF'}
          </Badge>
          {mitigation.aiLifecyclePhase && mitigation.aiLifecyclePhase.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {mitigation.aiLifecyclePhase[0]}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-semibold">{mitigation.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{mitigation.description}</p>
        {mitigation.hasAiActorTask && mitigation.hasAiActorTask.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {mitigation.hasAiActorTask.slice(0, 3).map((task) => (
              <Badge key={task} variant="outline" className="text-xs">
                {task}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Control Card Component
function ControlCard({ control }: { control: AtlasRiskControl }) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="secondary"
            className={taxonomyColors[control.isDefinedByTaxonomy] || 'bg-gray-100'}
          >
            {control.isDefinedByTaxonomy === 'granite-guardian' ? 'Granite Guardian' : 'ShieldGemma'}
          </Badge>
          {control.tag && (
            <Badge variant="outline" className="text-xs">
              {control.tag}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-semibold">{control.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{control.description}</p>
      </CardContent>
    </Card>
  );
}

// Evaluation Card Component
function EvaluationCard({ evaluation }: { evaluation: AtlasEvaluation }) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Benchmark
          </Badge>
          {evaluation.hasLicense && (
            <Badge variant="outline" className="text-xs">
              {evaluation.hasLicense}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {evaluation.name}
          {evaluation.url && (
            <a
              href={evaluation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">
          {evaluation.description || 'Evaluation benchmark for AI system assessment'}
        </p>
      </CardContent>
    </Card>
  );
}

export function RiskRecommendationsPanel({
  open,
  onClose,
  recommendations,
  useCaseId,
}: RiskRecommendationsPanelProps) {
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const { toast } = useToast();

  // Check if we have Atlas data
  const hasAtlasData = recommendations.atlas && recommendations.atlas.risks.length > 0;
  const atlasData = recommendations.atlas;

  // Generate unique key for a risk
  const getRiskKey = (source: string, sourceId: string) => `${source}:${sourceId}`;

  // Toggle risk selection
  const toggleRiskSelection = (sourceId: string) => {
    const key = getRiskKey('atlas', sourceId);
    const newSelected = new Set(selectedRisks);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedRisks(newSelected);
  };

  // Check if a risk is selected
  const isRiskSelected = (sourceId: string) => {
    return selectedRisks.has(getRiskKey('atlas', sourceId));
  };

  // Import selected risks
  const handleImport = async () => {
    if (selectedRisks.size === 0) {
      toast({
        title: 'No risks selected',
        description: 'Please select at least one risk to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // Convert Set to array of { source, sourceId }
      const risksToImport: SelectedRisk[] = Array.from(selectedRisks).map((key) => {
        const [source, sourceId] = key.split(':');
        return { source: source as 'atlas', sourceId };
      });

      const response = await fetch(`/api/risks/${useCaseId}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedRisks: risksToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import risks');
      }

      const result = await response.json();

      setImportSuccess(true);
      toast({
        title: 'Risks imported successfully',
        description: `${result.imported} risk(s) have been added to your use case`,
      });

      // Clear selection after successful import
      setSelectedRisks(new Set());

      // Close panel after short delay
      setTimeout(() => {
        onClose();
        setImportSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error importing risks:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import risks',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI Risk Intelligence
              </DialogTitle>
              <DialogDescription className="mt-2">
                {recommendations.totalRecommendations} risks identified using QUBE AI Risk Data LLM-based analysis
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Analysis Summary */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {recommendations.analysis.isGenAI && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              >
                <Brain className="mr-1 h-3 w-3" />
                Generative AI
              </Badge>
            )}
            {recommendations.analysis.isAgenticAI && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                <Target className="mr-1 h-3 w-3" />
                Agentic AI
              </Badge>
            )}
            {recommendations.analysis.primaryUseCase && (
              <Badge variant="outline">{recommendations.analysis.primaryUseCase}</Badge>
            )}
            {recommendations.analysis.llmConfidence !== undefined && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Zap className="mr-1 h-3 w-3" />
                {Math.round(recommendations.analysis.llmConfidence * 100)}% Confidence
              </Badge>
            )}
          </div>

          {/* Statistics bar */}
          {hasAtlasData && (
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>{atlasData!.risks.length} Risks</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings2 className="h-4 w-4 text-teal-500" />
                <span>{atlasData!.mitigations.length} Mitigations</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-slate-500" />
                <span>{atlasData!.controls.length} Controls</span>
              </div>
              <div className="flex items-center gap-1">
                <FlaskConical className="h-4 w-4 text-purple-500" />
                <span>{atlasData!.evaluations.length} Evaluations</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Tabs for different data types */}
        <Tabs defaultValue="risks" className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="risks" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risks ({atlasData?.risks.length || 0})
            </TabsTrigger>
            <TabsTrigger value="mitigations" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Mitigations ({atlasData?.mitigations.length || 0})
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Controls ({atlasData?.controls.length || 0})
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Evaluations ({atlasData?.evaluations.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Risks Tab */}
          <TabsContent value="risks" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[450px] pr-4">
              {!hasAtlasData ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                  <p>No risks identified for this use case</p>
                  <p className="text-sm mt-2">
                    Complete the assessment to get AI-powered risk recommendations
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {atlasData!.risks.map((risk) => (
                    <AtlasRiskCard
                      key={risk.id}
                      risk={risk}
                      selected={isRiskSelected(risk.id)}
                      onToggle={() => toggleRiskSelection(risk.id)}
                      mitigations={atlasData!.mitigations}
                      controls={atlasData!.controls}
                      evaluations={atlasData!.evaluations}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Mitigations Tab */}
          <TabsContent value="mitigations" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[450px] pr-4">
              {atlasData?.mitigations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Settings2 className="h-12 w-12 mb-4 opacity-50" />
                  <p>No mitigations available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-4">
                    <BookOpen className="inline h-4 w-4 mr-1" />
                    Mitigations from NIST AI RMF (212) and Credo UCF (42) to address identified risks
                  </div>
                  {atlasData?.mitigations.map((mitigation) => (
                    <MitigationCard key={mitigation.id} mitigation={mitigation} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[450px] pr-4">
              {atlasData?.controls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" />
                  <p>No controls available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-4">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Risk controls from Granite Guardian (13) and ShieldGemma (4) for automated detection
                  </div>
                  {atlasData?.controls.map((control) => (
                    <ControlCard key={control.id} control={control} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[450px] pr-4">
              {atlasData?.evaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mb-4 opacity-50" />
                  <p>No evaluations available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-4">
                    <FlaskConical className="inline h-4 w-4 mr-1" />
                    24 benchmarks (TruthfulQA, BBQ, BOLD, etc.) to evaluate and measure AI risks
                  </div>
                  {atlasData?.evaluations.map((evaluation) => (
                    <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer with import button */}
        <DialogFooter className="flex items-center justify-between border-t pt-4 mt-4">
          <div className="text-sm text-muted-foreground">
            {selectedRisks.size} risk(s) selected for import
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || selectedRisks.size === 0 || importSuccess}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : importSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Imported!
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Selected Risks
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
