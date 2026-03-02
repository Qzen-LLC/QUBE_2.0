'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import type { RiskRecommendations } from '@/lib/integrations/types';
import { IncidentCard } from './IncidentCard';

interface IncidentRecommendationsPanelProps {
  open: boolean;
  onClose: () => void;
  recommendations: RiskRecommendations;
  useCaseId: string;
}

export function IncidentRecommendationsPanel({
  open,
  onClose,
  recommendations,
  useCaseId,
}: IncidentRecommendationsPanelProps) {
  // Get AIID incidents (top 10 from AI Agent)
  const aiidIncidents = useMemo(() => recommendations.aiid || [], [recommendations.aiid]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalIncidents = aiidIncidents.length;
    const incidentsWithHighSeverity = aiidIncidents.filter(
      (inc) => inc.harmSeverity !== undefined && inc.harmSeverity >= 3
    ).length;
    const totalReports = aiidIncidents.reduce((sum, inc) => sum + (inc.reports?.length || 0), 0);

    // Collect unique sectors and technologies
    const sectors = new Set<string>();
    const technologies = new Set<string>();

    aiidIncidents.forEach((inc) => {
      inc.sector?.forEach((s) => sectors.add(s));
      inc.technology?.forEach((t) => technologies.add(t));
    });

    return {
      totalIncidents,
      incidentsWithHighSeverity,
      totalReports,
      uniqueSectors: Array.from(sectors),
      uniqueTechnologies: Array.from(technologies),
    };
  }, [aiidIncidents]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">AI-Discovered Incident Insights</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Top {aiidIncidents.length} most relevant real-world AI failures for your use case
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">Incidents Found</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">{statistics.totalIncidents}</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-muted-foreground">High Severity</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{statistics.incidentsWithHighSeverity}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">Total Reports</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{statistics.totalReports}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground">Avg Relevance</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {aiidIncidents.length > 0
                  ? Math.round(
                      aiidIncidents.reduce((sum, inc) => sum + (inc.relevanceScore || 0), 0) /
                        aiidIncidents.length
                    )
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* Matched Characteristics */}
          {(statistics.uniqueSectors.length > 0 || statistics.uniqueTechnologies.length > 0) && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Matched Characteristics
              </h4>
              <div className="flex flex-wrap gap-2">
                {statistics.uniqueSectors.slice(0, 5).map((sector) => (
                  <Badge key={sector} variant="outline" className="bg-white dark:bg-gray-900">
                    <span className="text-blue-600 mr-1">Sector:</span>
                    {sector}
                  </Badge>
                ))}
                {statistics.uniqueTechnologies.slice(0, 5).map((tech) => (
                  <Badge key={tech} variant="outline" className="bg-white dark:bg-gray-900">
                    <span className="text-purple-600 mr-1">Tech:</span>
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Incidents List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {aiidIncidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No incidents found</p>
              <p className="text-sm">
                The AI Agent couldn't find relevant incidents for your use case. This could mean your AI system
                is exploring new territory!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-1">
                      How to Use These Insights
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Each incident below was selected by our AI Agent based on similarity to your use case. Review
                      the lessons learned, harm types, and failure causes to identify potential risks in your own
                      system. Click on report links to read full documentation.
                    </p>
                  </div>
                </div>
              </div>

              {aiidIncidents.map((incident, index) => (
                <div key={incident.incidentId} className="relative">
                  {/* Ranking Badge */}
                  <div className="absolute -left-2 top-4 z-10">
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg
                      ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                            : index === 2
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                      }
                    `}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <IncidentCard incident={incident} rank={index + 1} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-xs text-muted-foreground">
            <a
              href="https://incidentdatabase.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Powered by AI Incident Database (AIID)
            </a>
            {' • '}
            Data sourced from 3,800+ reports across 800+ incidents
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
