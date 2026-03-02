'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, X, Download, AlertTriangle, ExternalLink } from 'lucide-react';
import type { RiskRecommendations } from '@/lib/integrations/types';
import { useToast } from '@/hooks/use-toast';

interface SecurityRecommendationsPanelProps {
  open: boolean;
  onClose: () => void;
  recommendations: RiskRecommendations;
  useCaseId: string;
}

export function SecurityRecommendationsPanel({
  open,
  onClose,
  recommendations,
  useCaseId,
}: SecurityRecommendationsPanelProps) {
  const { toast } = useToast();
  const [selectedTechniques, setSelectedTechniques] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  // Group techniques by tactic
  const techniquesByTactic = useMemo(() => {
    const grouped = new Map<string, typeof recommendations.mitre>();

    recommendations.mitre.forEach((technique) => {
      const tactic = technique.tactic || 'Other';
      if (!grouped.has(tactic)) {
        grouped.set(tactic, []);
      }
      grouped.get(tactic)!.push(technique);
    });

    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [recommendations.mitre]);

  // Toggle technique selection
  const toggleTechniqueSelection = (techniqueId: string) => {
    const newSelection = new Set(selectedTechniques);
    if (newSelection.has(techniqueId)) {
      newSelection.delete(techniqueId);
    } else {
      newSelection.add(techniqueId);
    }
    setSelectedTechniques(newSelection);
  };

  // Import selected techniques
  const handleImport = async () => {
    if (selectedTechniques.size === 0) {
      toast({
        title: 'No techniques selected',
        description: 'Please select at least one security technique to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // Transform selected techniques into API format
      const techniquesToImport = Array.from(selectedTechniques).map((techniqueId) => ({
        source: 'mitre',
        sourceId: techniqueId,
      }));

      const response = await fetch(`/api/risks/${useCaseId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRisks: techniquesToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import security techniques');
      }

      const result = await response.json();

      toast({
        title: 'Security Techniques Imported',
        description: `Successfully imported ${result.imported} security technique(s) from MITRE ATLAS`,
      });

      // Clear selection and close
      setSelectedTechniques(new Set());
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import security techniques',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">MITRE ATLAS Security Recommendations</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {recommendations.mitre.length} adversarial techniques identified based on your assessment
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Techniques grouped by tactic */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {techniquesByTactic.map(([tactic, techniques]) => (
            <div key={tactic} className="space-y-3">
              <div className="sticky top-0 bg-background py-2 border-b">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  {tactic}
                  <Badge variant="secondary" className="ml-auto">
                    {techniques.length} technique{techniques.length !== 1 ? 's' : ''}
                  </Badge>
                </h3>
              </div>

              <div className="grid gap-3">
                {techniques.map((technique) => (
                  <div
                    key={technique.techniqueId}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTechniques.has(technique.techniqueId)
                        ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-lg'
                        : 'hover:shadow-md bg-white dark:bg-gray-900'
                    }`}
                    onClick={() => toggleTechniqueSelection(technique.techniqueId)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTechniques.has(technique.techniqueId)}
                        onChange={() => toggleTechniqueSelection(technique.techniqueId)}
                        className="mt-1 h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground font-mono">{technique.techniqueId}</span>
                              {technique.severity && (
                                <Badge
                                  variant={
                                    technique.severity === 'Critical'
                                      ? 'destructive'
                                      : technique.severity === 'High'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {technique.severity}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-foreground">{technique.technique}</h4>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-3">{technique.description}</p>

                        {/* Mitigation */}
                        {technique.mitigation && technique.mitigation.trim() && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-medium">
                              Mitigation Strategies
                            </summary>
                            <p className="mt-2 text-muted-foreground pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                              {technique.mitigation}
                            </p>
                          </details>
                        )}

                        {/* Detection */}
                        {technique.detection && technique.detection.trim() && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-green-600 dark:text-green-400 hover:underline font-medium">
                              Detection Methods
                            </summary>
                            <p className="mt-2 text-muted-foreground pl-4 border-l-2 border-green-200 dark:border-green-800">
                              {technique.detection}
                            </p>
                          </details>
                        )}

                        {/* Case Studies */}
                        {technique.caseStudies && technique.caseStudies.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <AlertTriangle className="h-3 w-3 text-orange-600" />
                            <span className="text-muted-foreground">
                              {technique.caseStudies.length} real-world case stud
{technique.caseStudies.length !== 1 ? 'ies' : 'y'}
                            </span>
                            {technique.caseStudies[0]?.url && (
                              <a
                                href={technique.caseStudies[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {techniquesByTactic.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No MITRE ATLAS techniques recommended for this use case.
              <br />
              Try browsing all techniques manually.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {selectedTechniques.size} security technique{selectedTechniques.size !== 1 ? 's' : ''} selected for import
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedTechniques.size === 0 || importing}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
            >
              {importing ? (
                <>
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Selected Techniques
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
