'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, Lightbulb, TrendingDown } from 'lucide-react';
import type { RiskRecommendations } from '@/lib/integrations/types';
import { IncidentRecommendationsPanel } from './incident-learning/IncidentRecommendationsPanel';

export default function IncidentLearning() {
  const params = useParams();
  const useCaseId = params?.useCaseId as string;

  // AI Incident Discovery state
  const [showIncidentsPanel, setShowIncidentsPanel] = useState(false);
  const [incidents, setIncidents] = useState<RiskRecommendations | null>(null);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  // Fetch AI-powered incident recommendations
  const fetchIncidentRecommendations = async () => {
    if (!useCaseId) {
      setIncidentsError('Use case ID not found');
      return;
    }

    setLoadingIncidents(true);
    setIncidentsError(null);

    try {
      // Fetch AIID incidents only (Step 15: Incident Learning)
      const response = await fetch(`/api/risks/${useCaseId}/recommendations?source=incidents`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch incident recommendations');
      }

      const data: RiskRecommendations = await response.json();
      setIncidents(data);
      setShowIncidentsPanel(true);
    } catch (error) {
      console.error('Error fetching incident recommendations:', error);
      setIncidentsError(
        error instanceof Error ? error.message : 'Failed to fetch incident recommendations'
      );
    } finally {
      setLoadingIncidents(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Main AI-Powered Incident Discovery Card */}
      <Card className="border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground mb-1">
                AI-Powered Incident Discovery
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Our AI Agent analyzes your use case and finds the most relevant real-world AI failures
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="text-amber-600 font-semibold">•</span>
              <p>AI Agent understands your complete use case context (AI type, sector, technology)</p>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-600 font-semibold">•</span>
              <p>Searches 800+ incidents from the AI Incident Database (AIID)</p>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-600 font-semibold">•</span>
              <p>Returns top 10 most similar failures with harm severity, sectors, and technologies</p>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-600 font-semibold">•</span>
              <p>Extracts actionable lessons learned specific to your use case</p>
            </div>
          </div>

          {incidentsError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-600 dark:text-red-500">{incidentsError}</p>
            </div>
          )}

          <Button
            onClick={fetchIncidentRecommendations}
            disabled={loadingIncidents}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            size="lg"
          >
            {loadingIncidents ? (
              <>
                Discovering Similar Incidents...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                Discover Relevant AI Failures
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AIID Overview */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            AI Incident Database (AIID) Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-6">
          {/* AIID Info Card */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  Learning from Real-World AI Failures
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The AI Incident Database is a collection of real-world harms and near-harms caused by AI
                  systems. Each incident is thoroughly documented with news reports, academic research, and
                  industry analysis to help prevent similar failures.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-amber-100 dark:border-amber-900">
                    <div className="text-2xl font-bold text-amber-600">800+</div>
                    <div className="text-xs text-muted-foreground mt-1">Documented AI Incidents</div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-orange-100 dark:border-orange-900">
                    <div className="text-2xl font-bold text-orange-600">3,800+</div>
                    <div className="text-xs text-muted-foreground mt-1">News Reports & Research</div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-900">
                    <div className="text-2xl font-bold text-red-600">10+</div>
                    <div className="text-xs text-muted-foreground mt-1">Years of AI Failures</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Incident Categories Grid */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Common AI Failure Categories</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'Bias & Discrimination', description: 'Unfair treatment across demographics' },
                { name: 'Privacy Violations', description: 'Unauthorized data collection or exposure' },
                { name: 'Misinformation', description: 'Spreading false or misleading content' },
                { name: 'Safety Failures', description: 'Physical or psychological harm to users' },
                { name: 'Manipulation', description: 'Deceptive or coercive AI behavior' },
                { name: 'Loss of Control', description: 'AI systems acting beyond intended scope' },
              ].map((category) => (
                <div
                  key={category.name}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="font-semibold text-sm text-foreground mb-1">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why This Matters */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Why Learn from Past Incidents?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                Identify blind spots in your AI system design before deployment
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                Understand how similar AI systems have failed in real-world scenarios
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                Learn specific mitigation strategies from documented cases
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                Prevent repeating mistakes that have already caused harm
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Incident Recommendations Panel (Modal) */}
      {showIncidentsPanel && incidents && (
        <IncidentRecommendationsPanel
          open={showIncidentsPanel}
          onClose={() => setShowIncidentsPanel(false)}
          recommendations={incidents}
          useCaseId={useCaseId}
        />
      )}
    </div>
  );
}
