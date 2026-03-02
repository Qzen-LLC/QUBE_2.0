'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, FileText, Lightbulb, TrendingUp, Users, Building } from 'lucide-react';
import type { AiidIncident } from '@/lib/integrations/types';

interface IncidentCardProps {
  incident: AiidIncident;
  rank?: number;
}

export function IncidentCard({ incident, rank }: IncidentCardProps) {
  const getSeverityColor = (severity?: number) => {
    if (severity === undefined) return 'secondary';
    if (severity >= 4) return 'destructive';
    if (severity >= 3) return 'default';
    if (severity >= 2) return 'secondary';
    return 'outline';
  };

  const getSeverityLabel = (severity?: number) => {
    if (severity === undefined) return 'Unknown';
    if (severity >= 4) return `Critical (${severity}/5)`;
    if (severity >= 3) return `High (${severity}/5)`;
    if (severity >= 2) return `Medium (${severity}/5)`;
    return `Low (${severity}/5)`;
  };

  const formatDate = (dateString?: string) => {
    if (dateString) return new Date(dateString).toLocaleDateString();
    return 'Unknown date';
  };

  return (
    <div className="border rounded-lg p-5 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-shadow ml-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">Incident #{incident.incidentId}</span>

              {incident.harmSeverity !== undefined && (
                <Badge variant={getSeverityColor(incident.harmSeverity)} className="text-xs">
                  {getSeverityLabel(incident.harmSeverity)}
                </Badge>
              )}

              {incident.relevanceScore !== undefined && incident.relevanceScore > 0 && (
                <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {incident.relevanceScore}% Match
                </Badge>
              )}

              {incident.date && (
                <Badge variant="outline" className="text-xs">
                  {formatDate(incident.date)}
                </Badge>
              )}
            </div>

            <h4 className="font-semibold text-foreground text-lg mb-2">{incident.title}</h4>

            <p className="text-sm text-muted-foreground line-clamp-3">{incident.description}</p>
          </div>
        </div>

        {/* Harm Types & Failure Causes */}
        {(incident.harmType || incident.failureCause) && (
          <div className="flex flex-wrap gap-2">
            {incident.harmType?.map((harm) => (
              <Badge key={harm} variant="outline" className="text-xs bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
                {harm}
              </Badge>
            ))}
            {incident.failureCause?.slice(0, 3).map((cause) => (
              <Badge key={cause} variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/20">
                {cause}
              </Badge>
            ))}
          </div>
        )}

        {/* Sector & Technology */}
        {(incident.sector || incident.technology) && (
          <div className="flex flex-wrap gap-2">
            {incident.sector?.slice(0, 3).map((sec) => (
              <Badge key={sec} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">
                <Building className="h-3 w-3 mr-1 text-blue-600" />
                {sec}
              </Badge>
            ))}
            {incident.technology?.slice(0, 3).map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/20">
                {tech}
              </Badge>
            ))}
          </div>
        )}

        {/* Entities Involved */}
        {(incident.deployers || incident.developers || incident.harmedParties) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-xs">
            {incident.deployers && incident.deployers.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-muted-foreground min-w-[80px]">Deployer:</span>
                <span className="text-foreground">
                  {incident.deployers.map((d) => d.name).join(', ')}
                </span>
              </div>
            )}
            {incident.developers && incident.developers.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-muted-foreground min-w-[80px]">Developer:</span>
                <span className="text-foreground">
                  {incident.developers.map((d) => d.name).join(', ')}
                </span>
              </div>
            )}
            {incident.harmedParties && incident.harmedParties.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-muted-foreground min-w-[80px]">Harmed:</span>
                <span className="text-foreground">
                  {incident.harmedParties.map((h) => h.name).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Lessons Learned */}
        {incident.lessonsLearned && incident.lessonsLearned.trim() && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-2">
                  Lessons Learned for Your Use Case
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{incident.lessonsLearned}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {incident.reports && incident.reports.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline list-none flex items-center gap-2">
              <svg
                className="h-4 w-4 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <FileText className="h-4 w-4" />
              View {incident.reports.length} Report{incident.reports.length !== 1 ? 's' : ''}
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {incident.reports.slice(0, 10).map((report) => (
                <div
                  key={report.report_number}
                  className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-1"
                      >
                        {report.title || `Report #${report.report_number}`}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {report.date_published && (
                        <div className="text-xs text-muted-foreground">
                          Published: {new Date(report.date_published).toLocaleDateString()}
                        </div>
                      )}
                      {report.authors && report.authors.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          By: {report.authors.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {incident.reports.length > 10 && (
                <div className="text-xs text-muted-foreground pl-3">
                  +{incident.reports.length - 10} more reports
                </div>
              )}
            </div>
          </details>
        )}

        {/* Editor Notes */}
        {incident.editorNotes && incident.editorNotes.trim() && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline list-none flex items-center gap-2">
              <svg
                className="h-4 w-4 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Users className="h-4 w-4" />
              Editor's Analysis
            </summary>
            <div className="mt-2 pl-6">
              <p className="text-sm text-muted-foreground">{incident.editorNotes}</p>
            </div>
          </details>
        )}

        {/* Similar/Dissimilar Incidents Links */}
        {(incident.editorSimilarIncidents || incident.editorDissimilarIncidents) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {incident.editorSimilarIncidents && incident.editorSimilarIncidents.length > 0 && (
              <div>
                Similar incidents:{' '}
                {incident.editorSimilarIncidents.map((id) => (
                  <a
                    key={id}
                    href={`https://incidentdatabase.ai/cite/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mr-2"
                  >
                    #{id}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
