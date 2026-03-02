'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useDecisionRouting } from "@/hooks/useDecisionRouting";

interface Props {
  organizationId: string;
  isDarkMode: boolean;
}

const DECISION_TYPES = [
  { value: 'USE_CASE_APPROVAL', label: 'Use Case Approval' },
  { value: 'BUDGET_APPROVAL', label: 'Budget Approval' },
  { value: 'POLICY_EXCEPTION', label: 'Policy Exception' },
  { value: 'RISK_ACCEPTANCE', label: 'Risk Acceptance' },
  { value: 'VENDOR_APPROVAL', label: 'Vendor Approval' },
];

const RISK_LEVELS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function DecisionRoutingDemo({ organizationId, isDarkMode }: Props) {
  const [decisionType, setDecisionType] = useState('USE_CASE_APPROVAL');
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [routingResult, setRoutingResult] = useState<any>(null);
  const { previewRouting, loading } = useDecisionRouting();

  const handlePreviewRouting = async () => {
    try {
      const result = await previewRouting(
        decisionType,
        organizationId,
        riskLevel || undefined,
        investmentAmount ? parseFloat(investmentAmount) : undefined
      );
      setRoutingResult(result);
    } catch (error) {
      console.error('Error previewing routing:', error);
    }
  };

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardHeader>
        <CardTitle className={isDarkMode ? 'text-white' : ''}>
          Decision Routing Simulator
        </CardTitle>
        <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
          Test how decisions are routed based on your decision authority matrix
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={isDarkMode ? 'text-gray-200' : ''}>Decision Type</Label>
            <Select value={decisionType} onValueChange={setDecisionType}>
              <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DECISION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={isDarkMode ? 'text-gray-200' : ''}>Risk Level (Optional)</Label>
            <Select
              value={riskLevel === '' ? '__NONE__' : riskLevel}
              onValueChange={(value) => setRiskLevel(value === '__NONE__' ? '' : value)}
            >
              <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                <SelectValue placeholder="Select risk level..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">None</SelectItem>
                {RISK_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={isDarkMode ? 'text-gray-200' : ''}>Investment Amount (Optional)</Label>
            <Input
              type="number"
              placeholder="e.g., 50000"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>
        </div>

        <Button
          onClick={handlePreviewRouting}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Simulate Routing
            </>
          )}
        </Button>

        {routingResult && (
          <div className={`mt-6 p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : ''}`}>
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Routing Result
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Approver Role:
                </span>
                <Badge variant="default" className="ml-2">
                  {routingResult.approverRole}
                </Badge>
              </div>

              {routingResult.escalationRole && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Escalation Role:
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {routingResult.escalationRole}
                  </Badge>
                </div>
              )}

              {routingResult.requiresEscalation && (
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                        Auto-Escalation Triggered
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        {routingResult.escalationReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {routingResult.matchedRule && (
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
                }`}>
                  <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Matched Rule:
                  </p>
                  <div className="space-y-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      <strong>Decision Type:</strong> {routingResult.matchedRule.decisionType}
                    </p>
                    {routingResult.matchedRule.description && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {routingResult.matchedRule.description}
                      </p>
                    )}
                    {routingResult.matchedRule.riskLevel && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <strong>Risk Level:</strong> {routingResult.matchedRule.riskLevel}
                      </p>
                    )}
                    {(routingResult.matchedRule.investmentMin !== null || routingResult.matchedRule.investmentMax !== null) && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <strong>Investment Range:</strong>{' '}
                        ${routingResult.matchedRule.investmentMin || 0} - ${routingResult.matchedRule.investmentMax || '∞'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!routingResult.matchedRule && (
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                    No matching rule found. Using default routing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
