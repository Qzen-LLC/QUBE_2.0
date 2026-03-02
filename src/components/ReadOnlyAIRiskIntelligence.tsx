'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, Building2, GraduationCap, Shield, Lock, BookOpen, Zap } from 'lucide-react';

export default function ReadOnlyAIRiskIntelligence() {
  return (
    <div className="space-y-8 opacity-75">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border-l-4 border-purple-500 p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Risk Intelligence
            </h2>
            <p className="text-muted-foreground mt-1">
              Enhance your risk management with AI-curated recommendations from industry-leading databases
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Read Only</span>
          </div>
        </div>
      </div>

      {/* Two Main Options (Read-Only) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: AI-Powered Recommendations (Disabled) */}
        <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/10 dark:to-blue-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  AI-Powered Recommendations
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Let AI analyze your assessment and recommend relevant risks
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-purple-600 font-semibold">•</span>
                <p>AI analyzes your completed assessment answers</p>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-600 font-semibold">•</span>
                <p>Intelligently matches risks from IBM, MIT, and OWASP</p>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-600 font-semibold">•</span>
                <p>Get curated, relevant recommendations quickly</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Edit access required</p>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Manual Database Browsing (Disabled) */}
        <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  Browse All Risk Databases
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Manually explore and select from all available risks
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <p>Browse all 113 IBM Risk Atlas entries</p>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <p>Explore 611 MIT AI Risk Repository items</p>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <p>Review all 10 OWASP Top 10 for LLMs vulnerabilities</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Edit access required</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Sources Overview */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            Available Risk Intelligence Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-6">
          {/* Risk Sources Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* IBM Risk Atlas */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">IBM Risk Atlas</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                113 curated AI risks covering agentic AI, data privacy, generative AI, and security threats
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Agentic AI</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Data Privacy</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">GenAI</span>
              </div>
            </div>

            {/* MIT Risk Repository */}
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-200">MIT AI Risk Repository</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                611 comprehensive risks including societal harm, misinformation, privacy, discrimination, and hallucination
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">Societal Impact</span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">Ethics</span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">Multi-Agent</span>
              </div>
            </div>

            {/* OWASP Top 10 */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900 dark:text-red-200">OWASP Top 10 for LLMs</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                10 critical security vulnerabilities specific to Large Language Models and GenAI applications (2025)
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">Prompt Injection</span>
                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">Data Leakage</span>
                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">LLM Security</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
