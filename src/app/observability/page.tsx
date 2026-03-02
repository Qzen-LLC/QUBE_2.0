'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  BarChart3,
  Bot,
  Clock,
  DollarSign,
  Eye,
  Hash,
  Info,
  RefreshCw,
  TrendingUp,
  Zap,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface TraceSession {
  id: string;
  useCaseTitle: string;
  type: 'guardrails' | 'evaluation';
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  totalLLMCalls: number;
  totalTokens: number;
  totalCost: number;
  agentsInvolved: string[];
  langsmithUrl?: string;
}

export default function ObservabilityDashboard() {
  const [sessions, setSessions] = useState<TraceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TraceSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch sessions from API
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/observability/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  // Only use real sessions from API
  const displaySessions = sessions;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">LLM Observability Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and analyze your multi-agent system performance with LangSmith integration
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{displaySessions.length}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total LLM Calls</p>
                <p className="text-2xl font-bold">
                  {displaySessions.reduce((sum, s) => sum + s.totalLLMCalls, 0)}
                </p>
              </div>
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">
                  {displaySessions.reduce((sum, s) => sum + s.totalTokens, 0).toLocaleString()}
                </p>
              </div>
              <Hash className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">
                  {formatCost(displaySessions.reduce((sum, s) => sum + s.totalCost, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Sessions
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchSessions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displaySessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(session.status)}
                      <h3 className="font-semibold">{session.useCaseTitle}</h3>
                      <Badge variant={session.type === 'guardrails' ? 'default' : 'secondary'}>
                        {session.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(session.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {session.totalLLMCalls} calls
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {session.totalTokens.toLocaleString()} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCost(session.totalCost)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">
                        Agents: {session.agentsInvolved.join(', ')}
                      </span>
                    </div>
                  </div>
                  {session.langsmithUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(session.langsmithUrl, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View in LangSmith
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {displaySessions.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No observability sessions yet. Generate AI guardrails or evaluations to start tracking LLM calls and agent interactions with LangSmith.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Selected Session Details */}
      {selectedSession && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Session Details: {selectedSession.useCaseTitle}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSession(null)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Session Information</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Session ID:</dt>
                    <dd className="text-sm font-mono">{selectedSession.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Type:</dt>
                    <dd className="text-sm">{selectedSession.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Status:</dt>
                    <dd className="text-sm">{selectedSession.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Start Time:</dt>
                    <dd className="text-sm">{new Date(selectedSession.startTime).toLocaleString()}</dd>
                  </div>
                  {selectedSession.endTime && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">End Time:</dt>
                      <dd className="text-sm">{new Date(selectedSession.endTime).toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Performance Metrics</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Duration:</dt>
                    <dd className="text-sm">{formatDuration(selectedSession.duration)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">LLM Calls:</dt>
                    <dd className="text-sm">{selectedSession.totalLLMCalls}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Total Tokens:</dt>
                    <dd className="text-sm">{selectedSession.totalTokens.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Total Cost:</dt>
                    <dd className="text-sm">{formatCost(selectedSession.totalCost)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Agents Involved:</dt>
                    <dd className="text-sm">{selectedSession.agentsInvolved.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {selectedSession.langsmithUrl && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="default"
                  onClick={() => window.open(selectedSession.langsmithUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Trace in LangSmith
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}