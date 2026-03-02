'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, ShieldAlert, BookOpen, Zap, AlertTriangle, Lock } from 'lucide-react';

export default function ReadOnlySecurityAssessment() {
  return (
    <div className="space-y-8 opacity-75">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-amber-950/20 border-l-4 border-red-500 p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Security Assessment - MITRE ATLAS
            </h2>
            <p className="text-muted-foreground mt-1">
              Identify adversarial tactics and techniques targeting AI systems with MITRE's comprehensive framework
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
        {/* Option 1: AI-Powered Security Recommendations (Disabled) */}
        <Card className="border-red-200 dark:border-red-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/10 dark:to-orange-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  AI-Powered Security Recommendations
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  AI analyzes your assessment to identify relevant adversarial techniques
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">•</span>
                <p>Analyzes your AI system characteristics and architecture</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">•</span>
                <p>Maps to MITRE ATLAS tactics and adversarial techniques</p>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">•</span>
                <p>Provides mitigations and real-world attack case studies</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Edit access required</p>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Manual MITRE ATLAS Browsing (Disabled) */}
        <Card className="border-orange-200 dark:border-orange-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground mb-1">
                  Browse MITRE ATLAS Database
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Manually explore all adversarial techniques and tactics
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-orange-600 font-semibold">•</span>
                <p>Browse 140+ adversarial techniques for AI systems</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-600 font-semibold">•</span>
                <p>Organized across 14 attack tactics from reconnaissance to impact</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-600 font-semibold">•</span>
                <p>Filter by tactic, severity, and real-world case studies</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Edit access required</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MITRE ATLAS Overview */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            MITRE ATLAS Framework for AI Security
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-6">
          {/* MITRE ATLAS Info Card */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                  Adversarial Threat Landscape for AI Systems
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  MITRE ATLAS is a globally accessible knowledge base of adversary tactics and techniques based on
                  real-world attack observations. It complements MITRE ATT&CK specifically for AI/ML systems.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-900">
                    <div className="text-2xl font-bold text-red-600">140+</div>
                    <div className="text-xs text-muted-foreground mt-1">Adversarial Techniques</div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-orange-100 dark:border-orange-900">
                    <div className="text-2xl font-bold text-orange-600">14</div>
                    <div className="text-xs text-muted-foreground mt-1">Attack Tactics</div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-amber-100 dark:border-amber-900">
                    <div className="text-2xl font-bold text-amber-600">25+</div>
                    <div className="text-xs text-muted-foreground mt-1">Real-World Case Studies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Tactics Grid */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Key Adversarial Tactics</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'Reconnaissance', description: 'Gathering AI system information' },
                { name: 'Initial Access', description: 'Gaining access to AI systems' },
                { name: 'ML Attack Staging', description: 'Preparing ML-specific attacks' },
                { name: 'Exfiltration', description: 'Stealing model data and outputs' },
                { name: 'Impact', description: 'Manipulating AI system behavior' },
                { name: 'Defense Evasion', description: 'Avoiding detection mechanisms' },
              ].map((tactic) => (
                <div
                  key={tactic.name}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="font-semibold text-sm text-foreground mb-1">{tactic.name}</div>
                  <div className="text-xs text-muted-foreground">{tactic.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
