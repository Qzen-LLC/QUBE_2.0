'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  FlaskConical,
  ExternalLink,
  X,
  Loader2,
  FileText,
  Tag,
} from 'lucide-react';

interface RiskDetailPanelProps {
  riskId: string | null;
  open: boolean;
  onClose: () => void;
}

interface RiskDetails {
  risk: {
    id: string;
    name: string;
    description: string;
    isDefinedByTaxonomy: string;
    taxonomyName?: string;
    tags?: string[];
    riskGroupDetails?: Array<{ id: string; name: string }>;
  };
  relatedItems: {
    mitigations: Array<{
      id: string;
      name: string;
      description?: string;
      isDefinedByTaxonomy?: string;
    }>;
    controls: Array<{
      id: string;
      name: string;
      description?: string;
      isDefinedByTaxonomy?: string;
    }>;
    evaluations: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  };
  counts: {
    mitigations: number;
    controls: number;
    evaluations: number;
  };
}

export function RiskDetailPanel({ riskId, open, onClose }: RiskDetailPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<RiskDetails | null>(null);

  useEffect(() => {
    if (open && riskId) {
      fetchRiskDetails(riskId);
    } else {
      setDetails(null);
      setError(null);
    }
  }, [open, riskId]);

  const fetchRiskDetails = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/qube-ai-nexus/risks/${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk details');
      }
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      console.error('Error fetching risk details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load risk details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-semibold line-clamp-2">
                {loading ? 'Loading...' : details?.risk?.name || 'Risk Details'}
              </SheetTitle>
              {details?.risk && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {details.risk.taxonomyName || details.risk.isDefinedByTaxonomy}
                  </Badge>
                  {details.risk.riskGroupDetails?.map((group) => (
                    <Badge key={group.id} variant="secondary" className="text-xs">
                      {group.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && details && (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="details" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Details
              </TabsTrigger>
              <TabsTrigger value="mitigations" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mitigations ({details.counts.mitigations})
              </TabsTrigger>
              <TabsTrigger value="controls" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Controls ({details.counts.controls})
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="text-xs">
                <FlaskConical className="h-3 w-3 mr-1" />
                Evals ({details.counts.evaluations})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 py-4">
              {/* Details Tab */}
              <TabsContent value="details" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{details.risk.description}</p>
                </div>

                {details.risk.tags && details.risk.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {details.risk.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Source</h4>
                  <p className="text-sm">
                    {details.risk.taxonomyName || details.risk.isDefinedByTaxonomy}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Risk ID</h4>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {details.risk.id}
                  </code>
                </div>
              </TabsContent>

              {/* Mitigations Tab */}
              <TabsContent value="mitigations" className="mt-0 space-y-3">
                {details.relatedItems.mitigations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No specific mitigations found for this risk</p>
                  </div>
                ) : (
                  details.relatedItems.mitigations.map((mitigation) => (
                    <div
                      key={mitigation.id}
                      className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-sm">{mitigation.name}</h5>
                          {mitigation.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                              {mitigation.description}
                            </p>
                          )}
                          {mitigation.isDefinedByTaxonomy && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {mitigation.isDefinedByTaxonomy}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Controls Tab */}
              <TabsContent value="controls" className="mt-0 space-y-3">
                {details.relatedItems.controls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No specific controls found for this risk</p>
                  </div>
                ) : (
                  details.relatedItems.controls.map((control) => (
                    <div
                      key={control.id}
                      className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-sm">{control.name}</h5>
                          {control.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                              {control.description}
                            </p>
                          )}
                          {control.isDefinedByTaxonomy && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {control.isDefinedByTaxonomy}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Evaluations Tab */}
              <TabsContent value="evaluations" className="mt-0 space-y-3">
                {details.relatedItems.evaluations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FlaskConical className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No specific evaluations/benchmarks found for this risk</p>
                  </div>
                ) : (
                  details.relatedItems.evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="border rounded-lg p-3 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-start gap-2">
                        <FlaskConical className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-sm">{evaluation.name}</h5>
                          {evaluation.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                              {evaluation.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
