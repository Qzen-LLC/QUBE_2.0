'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Building2,
  GraduationCap,
  Shield,
} from 'lucide-react';
import type { ExternalRisk, OwaspRisk } from '@/lib/integrations/types';

interface RiskRecommendationCardProps {
  risk: ExternalRisk | OwaspRisk;
  source: 'ibm' | 'mit' | 'owasp';
  selected: boolean;
  onToggle: () => void;
}

export function RiskRecommendationCard({
  risk,
  source,
  selected,
  onToggle,
}: RiskRecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Check if it's an OWASP risk
  const isOwaspRisk = (risk: ExternalRisk | OwaspRisk): risk is OwaspRisk => {
    return 'rank' in risk && 'mitigation' in risk;
  };

  // Get source icon and color
  const getSourceInfo = () => {
    switch (source) {
      case 'ibm':
        return {
          icon: Building2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          label: 'IBM Risk Atlas',
        };
      case 'mit':
        return {
          icon: GraduationCap,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          label: 'MIT Risk Repository',
        };
      case 'owasp':
        return {
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'OWASP Top 10',
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const SourceIcon = sourceInfo.icon;

  // Get severity info
  const getSeverityInfo = () => {
    if (isOwaspRisk(risk)) {
      const severity = risk.severity;
      switch (severity) {
        case 'Critical':
          return {
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-950/30',
            label: 'Critical',
          };
        case 'High':
          return {
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-950/30',
            label: 'High',
          };
        default:
          return {
            icon: Info,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
            label: 'Medium',
          };
      }
    } else {
      const severity = risk.RiskSeverity;
      switch (severity.toLowerCase()) {
        case 'catastrophic':
        case 'major':
          return {
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-950/30',
            label: severity,
          };
        case 'moderate':
          return {
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-950/30',
            label: severity,
          };
        default:
          return {
            icon: Info,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
            label: severity,
          };
      }
    }
  };

  const severityInfo = getSeverityInfo();
  const SeverityIcon = severityInfo.icon;

  // Render content based on risk type
  const renderRiskContent = () => {
    if (isOwaspRisk(risk)) {
      return (
        <>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Checkbox
                checked={selected}
                onCheckedChange={onToggle}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {risk.id}
                </Badge>
                <Badge className={`${severityInfo.bgColor} ${severityInfo.color} border-0`}>
                  <SeverityIcon className="mr-1 h-3 w-3" />
                  {severityInfo.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Rank #{risk.rank}
                </Badge>
              </div>

              <h4 className="font-semibold text-base mb-2 text-foreground">
                {risk.title}
              </h4>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {risk.description}
              </p>

              <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    {expanded ? 'Show Less' : 'Show More'}
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  {risk.examples && risk.examples.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-foreground">Examples</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {risk.examples.map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {risk.mitigation && risk.mitigation.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-foreground">Mitigation</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {risk.mitigation.map((mitigation, idx) => (
                          <li key={idx}>{mitigation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {risk.realWorldIncidents && risk.realWorldIncidents.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-foreground">Real-World Incidents</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {risk.realWorldIncidents.map((incident, idx) => (
                          <li key={idx}>{incident}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </>
      );
    } else {
      // IBM or MIT risk
      return (
        <>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Checkbox
                checked={selected}
                onCheckedChange={onToggle}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono text-xs">
                  ID: {risk.Id}
                </Badge>
                <Badge className={`${severityInfo.bgColor} ${severityInfo.color} border-0`}>
                  <SeverityIcon className="mr-1 h-3 w-3" />
                  {severityInfo.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {risk.Likelihood}
                </Badge>
              </div>

              <h4 className="font-semibold text-base mb-2 text-foreground">
                {risk.Summary}
              </h4>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {risk.Description}
              </p>

              <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    {expanded ? 'Show Less' : 'Show More'}
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold mb-2 text-foreground">Full Description</h5>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {risk.Description}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold mb-2 text-foreground">Risk Category</h5>
                    <p className="text-sm text-muted-foreground">{risk.RiskCategory}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold mb-1 text-foreground">Severity</h5>
                      <p className="text-sm text-muted-foreground">{risk.RiskSeverity}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold mb-1 text-foreground">Likelihood</h5>
                      <p className="text-sm text-muted-foreground">{risk.Likelihood}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <Card
      className={`${sourceInfo.bgColor} ${sourceInfo.borderColor} ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      } transition-all hover:shadow-md cursor-pointer`}
      onClick={(e) => {
        // Only toggle if not clicking on interactive elements
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          onToggle();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SourceIcon className={`h-4 w-4 ${sourceInfo.color}`} />
          <span className={`text-xs font-semibold ${sourceInfo.color}`}>
            {sourceInfo.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>{renderRiskContent()}</CardContent>
    </Card>
  );
}
