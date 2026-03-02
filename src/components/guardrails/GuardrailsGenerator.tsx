'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EditableGuardrailCard from './EditableGuardrailCard';
import AddGuardrailModal from './AddGuardrailModal';
import { cleanWithDefaults } from '@/lib/utils/assessment-cleaner';
import {
  Shield,
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
  Lock,
  Eye,
  Zap,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  Settings,
  Edit2,
  Plus,
  Save
} from 'lucide-react';

interface Props {
  useCaseId: string;
  assessmentData: any;
  useCase?: any;  // Complete use case object - NEW!
  onComplete?: () => void;
  onGuardrailsGenerated?: (guardrails: any) => void;
}

export default function GuardrailsGenerator({ useCaseId, assessmentData, useCase, onComplete, onGuardrailsGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [guardrails, setGuardrails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [progress, setProgress] = useState(0);
  const [agentStatus, setAgentStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  // New state for interactive editing
  const [editMode, setEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<'critical' | 'operational' | 'ethical' | 'economic'>('critical');
  const [savingChanges, setSavingChanges] = useState(false);
  
  // State to track if we're loading existing data
  const [dataLoading, setDataLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  
  // Use ref to store callback to avoid dependency issues
  const onGuardrailsGeneratedRef = useRef(onGuardrailsGenerated);
  useEffect(() => {
    onGuardrailsGeneratedRef.current = onGuardrailsGenerated;
  }, [onGuardrailsGenerated]);

  // Load existing guardrails on mount
  useEffect(() => {
    const loadExistingGuardrails = async () => {
      try {
        setDataLoading(true);
        const response = await fetch(`/api/guardrails/get?useCaseId=${useCaseId}`);
        if (response.ok) {
          const data = await response.json();
          // Check if guardrails exist (either in guardrails object or rules array)
          const hasData = data.success && (
            (data.guardrails && Object.keys(data.guardrails).length > 0) ||
            (data.rules && Array.isArray(data.rules) && data.rules.length > 0) ||
            data.id // If there's a database ID, data exists
          );
          
          if (hasData) {
            setHasExistingData(true);
            // Use guardrails from data, or create empty structure if only rules exist
            const guardrailData = data.guardrails || { guardrails: { rules: {} } };
            // Add the database ID to the guardrail data
            if (data.id) {
              guardrailData.id = data.id;
            }
            // Ensure all rules have database IDs - prioritize database IDs from the rules array
            if (data.rules && Array.isArray(data.rules) && data.rules.length > 0) {
              // Create a map of database rules by their rule text for quick lookup
              const dbRulesMap = new Map();
              data.rules.forEach((dbRule: any) => {
                // Map by rule text (primary key) and also by ID
                dbRulesMap.set(dbRule.rule, dbRule);
                dbRulesMap.set(dbRule.id, dbRule);
              });
              
              // Update rules with database IDs
              if (guardrailData?.guardrails?.rules) {
                Object.keys(guardrailData.guardrails.rules).forEach(category => {
                  if (Array.isArray(guardrailData.guardrails.rules[category])) {
                    guardrailData.guardrails.rules[category] = guardrailData.guardrails.rules[category].map((rule: any, idx: number) => {
                      // Try to find matching database rule
                      const dbRule = dbRulesMap.get(rule.rule) || dbRulesMap.get(rule.id);
                      return {
                        ...rule,
                        // Always use database ID if available, otherwise generate a fallback
                        id: dbRule?.id || rule.id || `${category}-${rule.rule || idx}-${Date.now()}-${Math.random()}`,
                        status: dbRule?.status || rule.status || 'PENDING'
                      };
                    });
                  }
                });
              }
            } else {
              // Fallback: if no database rules, ensure rules have IDs
              if (guardrailData?.guardrails?.rules) {
                Object.keys(guardrailData.guardrails.rules).forEach(category => {
                  if (Array.isArray(guardrailData.guardrails.rules[category])) {
                    guardrailData.guardrails.rules[category] = guardrailData.guardrails.rules[category].map((rule: any, idx: number) => ({
                      ...rule,
                      id: rule.id || `${category}-${rule.rule || idx}-${Date.now()}-${Math.random()}`,
                      status: rule.status || 'PENDING'
                    }));
                  }
                });
              }
            }
            setGuardrails(guardrailData);
            // Also notify parent component (use ref to avoid dependency issues)
            if (onGuardrailsGeneratedRef.current) {
              onGuardrailsGeneratedRef.current(guardrailData);
            }
          } else {
            // No existing data found
            setHasExistingData(false);
          }
        } else {
          // API call failed or returned no data
          setHasExistingData(false);
        }
      } catch (error) {
        console.error('Error loading existing guardrails:', error);
        setHasExistingData(false);
      } finally {
        // Always set loading to false once we've checked for data
        setDataLoading(false);
      }
    };

    if (useCaseId) {
      loadExistingGuardrails();
    } else {
      // No useCaseId, skip loading
      setDataLoading(false);
      setHasExistingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCaseId]); // Only depend on useCaseId to prevent infinite loops

  const specialists = [
    { id: 'risk', name: 'Risk Analyst', icon: AlertTriangle, color: 'text-red-500' },
    { id: 'compliance', name: 'Compliance Expert', icon: Shield, color: 'text-blue-500' },
    { id: 'ethics', name: 'Ethics Advisor', icon: Users, color: 'text-purple-500' },
    { id: 'security', name: 'Security Architect', icon: Lock, color: 'text-green-500' },
    { id: 'business', name: 'Business Strategist', icon: TrendingUp, color: 'text-orange-500' },
    { id: 'technical', name: 'Technical Optimizer', icon: Zap, color: 'text-yellow-500' }
  ];

  const handleGenerateGuardrails = async () => {
    // Clear all existing data and show loading state
    setGuardrails(null);
    setHasExistingData(false);
    setDataLoading(true);
    setGenerating(true);
    setError(null);
    setProgress(0);
    setActiveTab('all'); // Reset to default tab

    try {
      // Initialize agent statuses
      specialists.forEach(agent => {
        setAgentStatus(prev => ({ ...prev, [agent.id]: 'analyzing' }));
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Clean assessment data before sending - only pass user-filled fields
      console.log('🧹 Cleaning assessment data before sending to API...');
      const cleanedAssessmentData = cleanWithDefaults(assessmentData);
      console.log('✅ Assessment data cleaned - only user-filled fields will be sent');

      // Call API to generate guardrails with CLEANED context
      const response = await fetch('/api/guardrails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId,
          assessmentData: cleanedAssessmentData,  // Send cleaned data
          useCase  // Pass complete use case object
        })
      });

      clearInterval(progressInterval);

      const result = await response.json();
      
      // Check if LLM configuration is required
      if (!response.ok || result.error === 'LLM_CONFIGURATION_REQUIRED') {
        setGenerating(false);
        setError(result.message || 'Failed to generate guardrails');
        if (result.instructions) {
          setError(`${result.message}\n\n${result.instructions}`);
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate guardrails');
      }
      
      // Update agent statuses to complete
      specialists.forEach(agent => {
        setAgentStatus(prev => ({ ...prev, [agent.id]: 'complete' }));
      });

      setProgress(100);
      
      // Ensure all rules have unique IDs and status
      const guardrailData = result;
      if (guardrailData?.guardrails?.rules) {
        Object.keys(guardrailData.guardrails.rules).forEach(category => {
          if (Array.isArray(guardrailData.guardrails.rules[category])) {
            guardrailData.guardrails.rules[category] = guardrailData.guardrails.rules[category].map((rule: any, idx: number) => ({
              ...rule,
              id: rule.id || `${category}-${rule.rule || idx}-${Date.now()}-${Math.random()}`,
              status: rule.status || 'PENDING'
            }));
          }
        });
      }
      
      setGuardrails(guardrailData);
      setHasExistingData(true);
      
      // Notify parent component about generated guardrails
      if (onGuardrailsGeneratedRef.current) {
        onGuardrailsGeneratedRef.current(guardrailData);
      }
      
      // Save guardrails
      console.log('Saving guardrails:', guardrailData);
      const saveResponse = await fetch('/api/guardrails/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId,
          guardrails: guardrailData
        })
      });
      
      if (saveResponse.ok) {
        const saveResult = await saveResponse.json();
        console.log('✅ Save successful:', saveResult);
        // Update the guardrails with the saved ID and rule IDs
        if (saveResult.guardrailId) {
          guardrailData.id = saveResult.guardrailId;

          // Update rules with their database IDs
          if (saveResult.rules && saveResult.rules.length > 0) {
            const rulesMap = new Map();
            saveResult.rules.forEach((dbRule: any) => {
              rulesMap.set(dbRule.rule, dbRule);
            });

            // Update configuration rules with database IDs
            if (guardrailData?.guardrails?.rules) {
              Object.keys(guardrailData.guardrails.rules).forEach(category => {
                if (Array.isArray(guardrailData.guardrails.rules[category])) {
                  guardrailData.guardrails.rules[category] = guardrailData.guardrails.rules[category].map((rule: any) => {
                    const dbRule = rulesMap.get(rule.rule);
                    if (dbRule) {
                      return {
                        ...rule,
                        id: dbRule.id, // Use the actual database ID
                        status: dbRule.status
                      };
                    }
                    return rule;
                  });
                }
              });
            }
          }

          setGuardrails(guardrailData);

          // Update parent with the guardrails that now have IDs
          if (onGuardrailsGeneratedRef.current) {
            onGuardrailsGeneratedRef.current(guardrailData);
          }
        }
      } else {
        const errorText = await saveResponse.text();
        console.error('❌ Failed to save guardrails:', errorText);
        console.error('❌ Response status:', saveResponse.status);
        console.error('❌ Response statusText:', saveResponse.statusText);

        // Show error to user
        setError(`Warning: Guardrails generated but failed to save to database. Error: ${errorText.substring(0, 200)}`);

        // Still show the guardrails in the UI even if save failed
        // User can manually save later
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setHasExistingData(false);
      specialists.forEach(agent => {
        setAgentStatus(prev => ({ ...prev, [agent.id]: 'error' }));
      });
    } finally {
      setGenerating(false);
      setDataLoading(false); // Always set loading to false when done
    }
  };

  const exportGuardrails = async (format: 'json' | 'yaml') => {
    try {
      const response = await fetch(`/api/guardrails/export?useCaseId=${useCaseId}&format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guardrails-${useCaseId}.${format}`;
      a.click();
    } catch (err) {
      setError('Failed to export guardrails');
    }
  };

  // Handler for editing a rule
  const handleRuleEdit = async (rule: any) => {
    try {
      const response = await fetch('/api/guardrails/rules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: rule.id,
          updates: {
            rule: rule.rule,
            description: rule.description,
            severity: rule.severity,
            rationale: rule.rationale,
            implementation: rule.implementation,
            conditions: rule.conditions,
            exceptions: rule.exceptions
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state
        updateLocalRule(rule.id, result.rule);
        setHasUnsavedChanges(true);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update rule');
      }
    } catch (err) {
      setError('Failed to update rule');
    }
  };

  // Handler for approving a rule
  const handleApprove = async (ruleId: string) => {
    console.log('Approving rule:', ruleId);
    try {
      const response = await fetch('/api/guardrails/rules/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId,
          approved: true,
          guardrailId: guardrails?.id,
          useCaseId: useCaseId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Approval successful:', result);
        updateLocalRule(ruleId, { status: 'APPROVED' });
        // Force re-render
        setGuardrails((prev: any) => ({ ...prev }));
      } else {
        // Try to parse error response
        let errorMessage = `Failed to approve rule (${response.status})`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const error = JSON.parse(errorText);
              errorMessage = error.error || error.message || error.details || errorMessage;
              if (error.details) {
                errorMessage += `: ${error.details}`;
              }
            } catch {
              // If not JSON, use the text as error message
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (parseError) {
          // If we can't parse the error, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Approval failed:', { status: response.status, statusText: response.statusText, message: errorMessage });
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve rule';
      console.error('Error approving rule:', err);
      setError(errorMessage);
    }
  };

  // Handler for rejecting a rule
  const handleReject = async (ruleId: string, reason: string) => {
    try {
      const response = await fetch('/api/guardrails/rules/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId,
          approved: false,
          reason,
          guardrailId: guardrails?.id,
          useCaseId: useCaseId
        })
      });

      if (response.ok) {
        const result = await response.json();
        updateLocalRule(ruleId, { status: 'REJECTED', rejectionReason: reason });
        // Force re-render
        setGuardrails((prev: any) => ({ ...prev }));
      } else {
        // Try to parse error response
        let errorMessage = `Failed to reject rule (${response.status})`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const error = JSON.parse(errorText);
              errorMessage = error.error || error.message || error.details || errorMessage;
              if (error.details) {
                errorMessage += `: ${error.details}`;
              }
            } catch {
              // If not JSON, use the text as error message
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (parseError) {
          // If we can't parse the error, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Rejection failed:', { status: response.status, statusText: response.statusText, message: errorMessage });
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject rule';
      console.error('Error rejecting rule:', err);
      setError(errorMessage);
    }
  };

  // Handler for deleting a rule
  const handleDelete = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/guardrails/rules/add?ruleId=${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        removeLocalRule(ruleId);
        setHasUnsavedChanges(true);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete rule');
      }
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  // Handler for adding a new rule
  const handleAddRule = async (rule: any) => {
    try {
      const guardrailId = guardrails.id || `${useCaseId}-guardrails`;
      
      const response = await fetch('/api/guardrails/rules/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardrailId,
          rule
        })
      });

      if (response.ok) {
        const result = await response.json();
        addLocalRule(addModalCategory, result.rule);
        setHasUnsavedChanges(true);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to add rule');
      }
    } catch (err) {
      setError('Failed to add rule');
    }
  };

  // Helper function to update a rule in local state
  const updateLocalRule = (ruleId: string, updates: any) => {
    setGuardrails((prev: any) => {
      const newGuardrails = { ...prev };
      if (newGuardrails.guardrails?.rules) {
        Object.keys(newGuardrails.guardrails.rules).forEach(category => {
          if (Array.isArray(newGuardrails.guardrails.rules[category])) {
            newGuardrails.guardrails.rules[category] = newGuardrails.guardrails.rules[category].map((rule: any) => {
              // Ensure each rule has a unique ID
              if (!rule.id) {
                rule.id = `${category}-${rule.rule}-${Date.now()}-${Math.random()}`;
              }
              return rule.id === ruleId ? { ...rule, ...updates } : rule;
            });
          }
        });
      }
      return newGuardrails;
    });
  };

  // Helper function to remove a rule from local state
  const removeLocalRule = (ruleId: string) => {
    setGuardrails((prev: any) => {
      const newGuardrails = { ...prev };
      if (newGuardrails.guardrails?.rules) {
        Object.keys(newGuardrails.guardrails.rules).forEach(category => {
          if (Array.isArray(newGuardrails.guardrails.rules[category])) {
            newGuardrails.guardrails.rules[category] = newGuardrails.guardrails.rules[category].filter(
              (rule: any) => rule.id !== ruleId
            );
          }
        });
      }
      return newGuardrails;
    });
  };

  // Helper function to add a rule to local state
  const addLocalRule = (category: string, rule: any) => {
    setGuardrails((prev: any) => {
      const newGuardrails = { ...prev };
      if (!newGuardrails.guardrails) {
        newGuardrails.guardrails = { rules: {} };
      }
      if (!newGuardrails.guardrails.rules) {
        newGuardrails.guardrails.rules = {};
      }
      if (!newGuardrails.guardrails.rules[category]) {
        newGuardrails.guardrails.rules[category] = [];
      }
      newGuardrails.guardrails.rules[category].push(rule);
      return newGuardrails;
    });
  };

  // Save all changes
  const handleSaveChanges = async () => {
    setSavingChanges(true);
    try {
      console.log('Manually saving guardrails:', guardrails);
      const response = await fetch('/api/guardrails/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId,
          guardrails
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Manual save result:', result);
        
        // Update the guardrail ID if returned
        if (result.guardrailId && guardrails) {
          guardrails.id = result.guardrailId;
          setGuardrails({ ...guardrails });
        }
        
        setHasUnsavedChanges(false);
        setError(null);
        // Notify parent component
        if (onGuardrailsGenerated) {
          onGuardrailsGenerated(guardrails);
        }
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save changes');
      }
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setSavingChanges(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Show loading page while checking for existing data or regenerating
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {generating ? 'Regenerating guardrails...' : 'Loading guardrails data...'}
          </p>
          {generating && progress > 0 && (
            <div className="w-64 mx-auto mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Status Panel */}
      {generating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Agent Analysis in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specialists.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <agent.icon className={`w-5 h-5 ${agent.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agentStatus[agent.id] || 'waiting'}
                      </p>
                    </div>
                    {getAgentStatusIcon(agentStatus[agent.id])}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      {!guardrails && !generating && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Generate AI Guardrails</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our agentic system will analyze your use case from multiple perspectives to create 
                comprehensive, context-aware guardrails that balance safety with innovation.
              </p>
              <Button 
                onClick={handleGenerateGuardrails} 
                size="lg"
                className="gap-2"
              >
                <Brain className="w-5 h-5" />
                Generate Guardrails
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guardrails Display */}
      {guardrails && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Guardrails</p>
                    <p className="text-2xl font-bold">
                      {guardrails.guardrails?.rules ? 
                        Object.values(guardrails.guardrails.rules).flat().length : 0}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical Rules</p>
                    <p className="text-2xl font-bold text-red-500">
                      {guardrails.guardrails?.rules?.critical?.length || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">
                      {Math.round((guardrails.confidence?.overall || 0) * 100)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Agents Used</p>
                    <p className="text-2xl font-bold">
                      {guardrails.metadata?.agents?.length || 6}
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Guardrails Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Guardrails</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportGuardrails('json')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportGuardrails('yaml')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export YAML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-7 w-full">
                  <TabsTrigger value="all">All Guardrails</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="operational">Operational</TabsTrigger>
                  <TabsTrigger value="ethical">Ethical</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      All Guardrails
                      <Badge className="ml-2" variant="secondary">
                        {guardrails.guardrails?.rules ?
                          Object.values(guardrails.guardrails.rules).flat().filter((r: any) => r).length : 0
                        } rules configured
                      </Badge>
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditMode(!editMode)}
                        variant={editMode ? "default" : "outline"}
                        size="sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {editMode ? 'View Mode' : 'Edit Mode'}
                      </Button>
                      {hasUnsavedChanges && (
                        <Button
                          onClick={handleSaveChanges}
                          disabled={savingChanges}
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savingChanges ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Collect all guardrails from all categories */}
                    {guardrails.guardrails?.rules && (() => {
                      const allRules: any[] = [];

                      // Add rules from standard categories
                      ['critical', 'high', 'medium', 'low', 'operational', 'ethical', 'economic', 'evolutionary'].forEach(category => {
                        if (Array.isArray(guardrails.guardrails.rules[category])) {
                          guardrails.guardrails.rules[category].forEach((rule: any) => {
                            allRules.push({ ...rule, category });
                          });
                        }
                      });

                      // Add rules from byType if it exists
                      if (guardrails.guardrails.rules.byType) {
                        Object.entries(guardrails.guardrails.rules.byType).forEach(([type, rules]: [string, any]) => {
                          if (Array.isArray(rules)) {
                            rules.forEach((rule: any) => {
                              // Avoid duplicates
                              if (!allRules.find((r: any) => r.id === rule.id)) {
                                allRules.push({ ...rule, category: type });
                              }
                            });
                          }
                        });
                      }

                      // Add rules from "all" if it exists
                      if (Array.isArray(guardrails.guardrails.rules.all)) {
                        guardrails.guardrails.rules.all.forEach((rule: any) => {
                          // Avoid duplicates
                          if (!allRules.find((r: any) => r.id === rule.id)) {
                            allRules.push(rule);
                          }
                        });
                      }

                      // Sort by severity
                      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                      allRules.sort((a, b) => {
                        const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] ?? 4;
                        const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] ?? 4;
                        return aSeverity - bSeverity;
                      });

                      return allRules.map((rule: any, idx: number) => (
                        <EditableGuardrailCard
                          key={`all-${rule.id || rule.rule}-${idx}`}
                          rule={{
                            ...rule,
                            id: rule.id || `all-${idx}-${Date.now()}`,
                            status: rule.status || 'PENDING'
                          }}
                          editMode={editMode}
                          onEdit={handleRuleEdit}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onDelete={handleDelete}
                          canEdit={true}
                          canApprove={true}
                        />
                      ));
                    })()}
                  </div>
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>Guardrails Overview</h3>
                    <p>
                      Based on comprehensive analysis of your use case, we've generated {' '}
                      {Object.values(guardrails.guardrails?.rules || {}).flat().length} guardrails
                      across multiple categories to ensure safe and effective AI deployment.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {Object.entries(guardrails.guardrails?.rules || {}).map(([category, rules]: [string, any]) => (
                        <div key={category} className="border rounded-lg p-4">
                          <h4 className="font-semibold capitalize mb-2">{category} Guardrails</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {Array.isArray(rules) ? rules.length : 0} rules configured
                          </p>
                          <div className="space-y-2">
                            {Array.isArray(rules) && rules.slice(0, 3).map((rule: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Badge className={getSeverityColor(rule.severity)}>
                                  {rule.severity}
                                </Badge>
                                <span className="text-sm truncate">{rule.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="critical" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Critical Guardrails</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setAddModalCategory('critical');
                          setShowAddModal(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Guardrail
                      </Button>
                      <Button
                        onClick={() => setEditMode(!editMode)}
                        variant={editMode ? "default" : "outline"}
                        size="sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {editMode ? 'View Mode' : 'Edit Mode'}
                      </Button>
                      {hasUnsavedChanges && (
                        <Button
                          onClick={handleSaveChanges}
                          disabled={savingChanges}
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savingChanges ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {guardrails.guardrails?.rules?.critical?.map((rule: any, idx: number) => (
                      <EditableGuardrailCard
                        key={`critical-${rule.id || rule.rule}-${idx}`}
                        rule={{
                          ...rule, 
                          id: rule.id || `critical-${idx}-${Date.now()}`,
                          status: rule.status || 'PENDING'
                        }}
                        editMode={editMode}
                        onEdit={handleRuleEdit}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        canEdit={true}
                        canApprove={true}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="operational" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Operational Guardrails</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setAddModalCategory('operational');
                          setShowAddModal(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Guardrail
                      </Button>
                      <Button
                        onClick={() => setEditMode(!editMode)}
                        variant={editMode ? "default" : "outline"}
                        size="sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {editMode ? 'View Mode' : 'Edit Mode'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {guardrails.guardrails?.rules?.operational?.map((rule: any, idx: number) => (
                      <EditableGuardrailCard
                        key={`operational-${rule.id || rule.rule}-${idx}`}
                        rule={{
                          ...rule,
                          id: rule.id || `operational-${idx}-${Date.now()}`,
                          status: rule.status || 'PENDING'
                        }}
                        editMode={editMode}
                        onEdit={handleRuleEdit}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        canEdit={true}
                        canApprove={true}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ethical" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Ethical Guardrails</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setAddModalCategory('ethical');
                          setShowAddModal(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Guardrail
                      </Button>
                      <Button
                        onClick={() => setEditMode(!editMode)}
                        variant={editMode ? "default" : "outline"}
                        size="sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {editMode ? 'View Mode' : 'Edit Mode'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {guardrails.guardrails?.rules?.ethical?.map((rule: any, idx: number) => (
                      <EditableGuardrailCard
                        key={`ethical-${rule.id || rule.rule}-${idx}`}
                        rule={{
                          ...rule,
                          id: rule.id || `ethical-${idx}-${Date.now()}`,
                          status: rule.status || 'PENDING'
                        }}
                        editMode={editMode}
                        onEdit={handleRuleEdit}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        canEdit={true}
                        canApprove={true}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Monitoring Strategy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {guardrails.guardrails?.monitoring?.map((monitor: any, idx: number) => (
                            <div key={idx} className="border-l-4 border-blue-500 pl-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{monitor.metric}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Threshold: {monitor.threshold} | Frequency: {monitor.frequency}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {monitor.alerting?.channels?.join(', ')}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="reasoning" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Reasoning & Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Agent Contributions */}
                        <div>
                          <h4 className="font-semibold mb-3">Agent Contributions</h4>
                          <div className="space-y-2">
                            {guardrails.reasoning?.agentContributions?.map((contribution: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{contribution.agent}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {contribution.keyInsights?.join(', ')}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {contribution.proposedRules} rules
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Key Insights */}
                        {guardrails.reasoning?.insights && (
                          <div>
                            <h4 className="font-semibold mb-3">Key Insights</h4>
                            <ul className="space-y-2">
                              {guardrails.reasoning.insights.map((insight: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                                  <span className="text-sm">{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tradeoffs */}
                        {guardrails.reasoning?.tradeoffs && (
                          <div>
                            <h4 className="font-semibold mb-3">Tradeoffs Made</h4>
                            <div className="space-y-2">
                              {guardrails.reasoning.tradeoffs.map((tradeoff: any, idx: number) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                  <p className="text-sm font-medium">{tradeoff.decision}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {tradeoff.rationale}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Uncertainties */}
                        {guardrails.confidence?.uncertainties && (
                          <div>
                            <h4 className="font-semibold mb-3">Areas of Uncertainty</h4>
                            <ul className="space-y-1">
                              {guardrails.confidence.uncertainties.map((uncertainty: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                  <span className="text-sm text-muted-foreground">{uncertainty}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleGenerateGuardrails}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button onClick={onComplete}>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Add Guardrail Modal */}
      <AddGuardrailModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        category={addModalCategory}
        onAdd={handleAddRule}
        existingRules={
          guardrails?.guardrails?.rules?.[addModalCategory] || []
        }
      />
    </div>
  );
}