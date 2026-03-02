'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { MitreTechniqueData } from '@/lib/integrations/types';

interface SecurityTechniqueCardProps {
  technique: MitreTechniqueData;
  selected: boolean;
  onToggle: () => void;
}

export function SecurityTechniqueCard({ technique, selected, onToggle }: SecurityTechniqueCardProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Critical':
        return 'destructive';
      case 'High':
        return 'default';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        selected
          ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-lg'
          : 'hover:shadow-md bg-white dark:bg-gray-900'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">{technique.techniqueId}</span>

                {technique.tactic && (
                  <Badge variant="outline" className="text-xs">
                    {technique.tactic}
                  </Badge>
                )}

                {technique.severity && (
                  <Badge variant={getSeverityColor(technique.severity)} className="text-xs">
                    {technique.severity}
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-foreground text-base">{technique.technique}</h4>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3">{technique.description}</p>

          {/* Expandable Details */}
          <div className="space-y-2">
            {/* Mitigation */}
            {technique.mitigation && technique.mitigation.trim() && (
              <details className="text-sm group">
                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-medium list-none flex items-center gap-1">
                  <svg
                    className="h-4 w-4 transition-transform group-open:rotate-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Mitigation Strategies
                </summary>
                <div className="mt-2 text-muted-foreground pl-6 py-2 border-l-2 border-blue-200 dark:border-blue-800">
                  {technique.mitigation}
                </div>
              </details>
            )}

            {/* Detection */}
            {technique.detection && technique.detection.trim() && (
              <details className="text-sm group">
                <summary className="cursor-pointer text-green-600 dark:text-green-400 hover:underline font-medium list-none flex items-center gap-1">
                  <svg
                    className="h-4 w-4 transition-transform group-open:rotate-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Detection Methods
                </summary>
                <div className="mt-2 text-muted-foreground pl-6 py-2 border-l-2 border-green-200 dark:border-green-800">
                  {technique.detection}
                </div>
              </details>
            )}

            {/* Case Studies */}
            {technique.caseStudies && technique.caseStudies.length > 0 && (
              <div className="flex items-start gap-2 text-sm bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    {technique.caseStudies.length} Real-World Case Stud
{technique.caseStudies.length !== 1 ? 'ies' : 'y'}
                  </span>
                  <div className="mt-1 space-y-1">
                    {technique.caseStudies.slice(0, 3).map((caseStudy, idx) => (
                      <div key={idx}>
                        {caseStudy.url ? (
                          <a
                            href={caseStudy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {caseStudy.name || caseStudy.id || `Case Study ${idx + 1}`}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {caseStudy.name || caseStudy.id || `Case Study ${idx + 1}`}
                          </span>
                        )}
                        {caseStudy.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {caseStudy.description}
                          </p>
                        )}
                      </div>
                    ))}
                    {technique.caseStudies.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{technique.caseStudies.length - 3} more case studies
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {technique.metadata && (
              <div className="flex flex-wrap gap-1">
                {technique.metadata.platforms && technique.metadata.platforms.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Platforms:</span>{' '}
                    {technique.metadata.platforms.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
