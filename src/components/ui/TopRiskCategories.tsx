'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, Shield, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

interface RiskCategory {
  name: string;
  level: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend?: 'increasing' | 'decreasing' | 'stable';
}

interface TopRiskCategoriesProps {
  categories: string[];
  className?: string;
}

const getRiskIcon = (index: number) => {
  const icons = [Zap, AlertTriangle, Shield, Activity, TrendingUp];
  return icons[index % icons.length];
};

const getRiskColor = (index: number) => {
  // Use neutral colors for all risk categories
  return 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-600';
};

const getRiskSeverity = (index: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (index === 0) return 'critical';
  if (index === 1) return 'high';
  if (index === 2) return 'medium';
  return 'low';
};

const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
  switch (severity) {
    case 'critical':
      return 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-600';
    case 'high':
      return 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-600';
    case 'medium':
      return 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-600';
    case 'low':
      return 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-600';
    default:
      return 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-600';
  }
};

export default function TopRiskCategories({ categories, className = '' }: TopRiskCategoriesProps) {
  return (
    <Card className={`bg-card border border-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
          <CardTitle className="text-lg font-medium text-foreground">Top Risk Categories</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Most critical risk areas requiring immediate attention
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category, index) => {
            const Icon = getRiskIcon(index);
            const severity = getRiskSeverity(index);
            const riskColor = getRiskColor(index);
            const severityColor = getSeverityColor(severity);
            
            return (
              <div 
                key={category} 
                className="group flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/30 rounded-lg border border-border/30 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Risk Rank Icon */}
                  <div className={`w-8 h-8 ${riskColor} rounded-lg flex items-center justify-center border transition-all duration-200`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Risk Information */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {category}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-1 rounded-md border ${severityColor}`}
                      >
                        {severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Risk Level</span>
                      <span className="font-medium text-foreground">#{index + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {categories.length} risk categories identified
            </span>
            
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
