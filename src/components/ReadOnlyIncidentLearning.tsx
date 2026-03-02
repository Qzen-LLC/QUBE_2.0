'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, Lightbulb, TrendingDown, Lock } from 'lucide-react';

export default function ReadOnlyIncidentLearning() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 border-l-4 border-amber-500 p-6 rounded-2xl shadow-md opacity-75">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Incident Learning - AI Failures Database (Read-Only)
            </h2>
            <p className="text-muted-foreground mt-1">
              This assessment is locked. Incident learning features are view-only.
            </p>
          </div>
        </div>
      </div>

      {/* Main AI-Powered Incident Discovery Card */}
      <Card className="border-amber-200 dark:border-amber-800 shadow-lg opacity-75">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground mb-1">
                AI-Powered Incident Discovery (Locked)
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

          <Button disabled className="w-full" size="lg">
            <Lock className="mr-2 h-5 w-5" />
            Locked - Assessment is Read-Only
          </Button>
        </CardContent>
      </Card>

      {/* AIID Overview */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-md opacity-75">
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
    </div>
  );
}
