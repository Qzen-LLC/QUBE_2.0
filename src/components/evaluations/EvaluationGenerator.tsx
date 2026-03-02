'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Activity,
  Shield,
  Zap,
  Users,
  TrendingUp,
  BarChart3,
  Info,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Sparkles,
  Bot
} from 'lucide-react';

interface EvaluationGeneratorProps {
  useCaseId: string;
  guardrailsConfig?: any;
  assessmentData?: any;
}

interface TestSuite {
  id: string;
  name: string;
  type: string;
  priority: string;
  scenarios: any[];
  scenarioCount?: number;
  coverage: number;
  status?: 'pending' | 'running' | 'passed' | 'failed';
}

interface EvaluationResult {
  dimension: string;
  score: number;
  grade: string;
  trend: 'improving' | 'stable' | 'degrading';
}

const EvaluationGenerator: React.FC<EvaluationGeneratorProps> = ({
  useCaseId,
  guardrailsConfig,
  assessmentData
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evaluationConfig, setEvaluationConfig] = useState<any>(null);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [useAIGeneration, setUseAIGeneration] = useState(true); // Default to AI generation
  const [generationStrategy, setGenerationStrategy] = useState<'comprehensive' | 'targeted' | 'rapid'>('comprehensive');
  const [testIntensity, setTestIntensity] = useState<'light' | 'standard' | 'thorough'>('standard');
  const [agentProgress, setAgentProgress] = useState<Record<string, string>>({}); // Track agent progress
  const [generationPhase, setGenerationPhase] = useState<string>('');
  
  // State to store loaded guardrails config
  const [loadedGuardrailsConfig, setLoadedGuardrailsConfig] = useState<any>(null);
  
  // State to track if we're loading existing data
  const [dataLoading, setDataLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Load existing evaluation and guardrails on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setDataLoading(true);
        // Load existing evaluation
        const evalResponse = await fetch(`/api/evaluations/get?useCaseId=${useCaseId}`, {
          method: 'GET'
        });

        if (evalResponse.ok) {
          const evalData = await evalResponse.json();
          if (evalData.success && evalData.evaluationConfig) {
            setHasExistingData(true);
            const evalConfig = evalData.evaluationConfig;
            setEvaluationConfig(evalConfig);
            setTestSuites(evalConfig.testSuites.map((suite: any) => ({
              ...suite,
              scenarioCount: suite.scenarios.length,
              scenarios: suite.scenarios,
              coverage: suite.coverage?.percentage || 0,
              status: 'pending'
            })));
          } else {
            // No existing evaluation data
            setHasExistingData(false);
          }
        } else {
          // API call failed
          setHasExistingData(false);
        }

        // Load guardrails if not provided as prop
        if (!guardrailsConfig) {
          console.log('🔍 Guardrails config not provided, loading from API...');
          const guardrailsResponse = await fetch(`/api/guardrails/get?useCaseId=${useCaseId}`);
          if (guardrailsResponse.ok) {
            const guardrailsData = await guardrailsResponse.json();
            console.log('🔍 Guardrails API response:', guardrailsData);
            
            // Check if guardrails actually exist and have content
            // If we have a database ID, that means guardrails exist - even if config is empty, we can reconstruct
            const hasGuardrails = guardrailsData.success && 
              guardrailsData.id && // Must have database ID (this confirms guardrails exist)
              (
                // Has guardrails object (even if empty, we can reconstruct)
                guardrailsData.guardrails ||
                // Or has rules in the response
                (guardrailsData.rules && Array.isArray(guardrailsData.rules) && guardrailsData.rules.length > 0)
              );
            
            if (hasGuardrails) {
              // The API returns { guardrails: {...}, id: ... }
              // We need to preserve the full structure or ensure it has the ID
              let loadedConfig = guardrailsData.guardrails || {};
              
              // If guardrailsData.guardrails is the actual config structure, use it
              // Otherwise, wrap it properly
              if (!loadedConfig.guardrails && !loadedConfig.rules && !loadedConfig.metadata) {
                // This might be a nested structure, check if it needs unwrapping
                if (guardrailsData.guardrails?.guardrails) {
                  loadedConfig = guardrailsData.guardrails;
                }
              }
              
              // Add the database ID if available - this is critical for the backend
              if (guardrailsData.id) {
                loadedConfig.id = guardrailsData.id;
              }
              
              console.log('✅ Loaded guardrails config:', {
                hasId: !!loadedConfig.id,
                id: loadedConfig.id,
                hasGuardrails: !!loadedConfig.guardrails,
                hasRules: !!loadedConfig.guardrails?.rules,
                topLevelKeys: Object.keys(loadedConfig)
              });
              setLoadedGuardrailsConfig(loadedConfig);
            } else {
              console.warn('⚠️ Guardrails API returned but no valid guardrails data found');
              console.warn('   - Has ID:', !!guardrailsData.id);
              console.warn('   - Has guardrails object:', !!guardrailsData.guardrails);
              console.warn('   - Guardrails keys:', guardrailsData.guardrails ? Object.keys(guardrailsData.guardrails) : 'none');
              console.warn('   - Rules count:', guardrailsData.rules?.length || 0);
            }
          } else {
            console.warn('⚠️ Failed to load guardrails from API:', guardrailsResponse.status);
          }
        } else {
          console.log('✅ Using guardrails config from props');
        }
      } catch (error) {
        console.log('Error loading existing data:', error);
        setHasExistingData(false);
      } finally {
        // Always set loading to false once we've checked for data
        setDataLoading(false);
      }
    };

    if (useCaseId) {
      loadExistingData();
    } else {
      // No useCaseId, skip loading
      setDataLoading(false);
      setHasExistingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCaseId]); // Only depend on useCaseId to prevent infinite loops

  // Use provided guardrailsConfig or loaded one
  const effectiveGuardrailsConfig = guardrailsConfig || loadedGuardrailsConfig;

  // Show loading page while checking for existing data
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  // Mock test suite icons
  const suiteIcons: Record<string, React.ReactNode> = {
    safety: <Shield className="h-4 w-4" />,
    performance: <Zap className="h-4 w-4" />,
    compliance: <FileText className="h-4 w-4" />,
    ethical: <Users className="h-4 w-4" />,
    cost_efficiency: <TrendingUp className="h-4 w-4" />,
    drift_detection: <Activity className="h-4 w-4" />
  };

  // Poll for job status
  const pollJobStatus = async (jobId: string): Promise<any> => {
    const agents = ['Safety Agent', 'Performance Agent', 'Guardrail Agent'];
    let pollCount = 0;
    const maxPolls = 600; // 10 minutes max (1 second intervals) - LLM generation can take a while
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // Fail after 5 consecutive errors

    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;

          const response = await fetch(`/api/evaluations/job?jobId=${jobId}`);
          
          if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Failed to fetch job status (${response.status})`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
              if (errorData.details) {
                errorMessage += `: ${errorData.details}`;
              }
            } catch (e) {
              // If we can't parse the error, use the status text
              errorMessage = `Failed to fetch job status: ${response.statusText || response.status}`;
            }

            // For authentication errors (401, 403), fail immediately
            if (response.status === 401 || response.status === 403) {
              clearInterval(pollInterval);
              reject(new Error(`Authentication error: ${errorMessage}. Please refresh the page and try again.`));
              return;
            }

            // For other errors, increment consecutive error count
            consecutiveErrors++;
            console.warn(`Error polling job status (attempt ${pollCount}, consecutive errors: ${consecutiveErrors}):`, errorMessage);

            // If we have too many consecutive errors, fail
            if (consecutiveErrors >= maxConsecutiveErrors) {
              clearInterval(pollInterval);
              reject(new Error(`Failed to fetch job status after ${consecutiveErrors} attempts: ${errorMessage}`));
              return;
            }

            // Otherwise, continue polling (might be a transient error)
            return;
          }

          // Reset consecutive error count on success
          consecutiveErrors = 0;

          const data = await response.json();
          const job = data.job;

          if (!job) {
            // If job not found after a few attempts, it might not exist yet
            if (pollCount > 10) {
              clearInterval(pollInterval);
              reject(new Error('Job not found. The job may have been deleted or never created.'));
              return;
            }
            // Otherwise, keep polling (job might be created soon)
            return;
          }

          // Update progress from job
          setProgress(job.progress || 0);
          setGenerationPhase(job.currentStep || 'Processing...');

          // Update agent progress based on job progress
          const progressPercent = job.progress || 0;
          const updatedAgentProgress: Record<string, string> = {};
          agents.forEach((agent, index) => {
            const agentThreshold = ((index + 1) / agents.length) * 80;
            if (progressPercent >= agentThreshold) {
              updatedAgentProgress[agent] = 'completed';
            } else if (progressPercent >= agentThreshold - 25) {
              updatedAgentProgress[agent] = 'analyzing';
            } else {
              updatedAgentProgress[agent] = 'pending';
            }
          });
          setAgentProgress(updatedAgentProgress);

          // Check if job is done
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            resolve(job.result);
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error(job.error || 'Job failed'));
          } else if (job.status === 'pending' && pollCount > 30) {
            // If still pending after 30 seconds, something went wrong with processing
            clearInterval(pollInterval);
            reject(new Error('Job processing did not start. Please try again.'));
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            reject(new Error('Job timed out after 10 minutes. The AI generation is taking longer than expected.'));
          }
        } catch (error) {
          consecutiveErrors++;
          console.error('Error polling job status (attempt', pollCount, '):', error);
          
          // For network errors or other exceptions, don't fail immediately
          if (consecutiveErrors >= maxConsecutiveErrors) {
            clearInterval(pollInterval);
            reject(error instanceof Error ? error : new Error('Failed to poll job status'));
            return;
          }
          
          // If we've reached max polls, fail
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            reject(error instanceof Error ? error : new Error('Failed to poll job status'));
          }
        }
      }, 1000); // Poll every second
    });
  };

  const generateEvaluations = async () => {
    console.log('🎯 Starting generateEvaluations (async job)...');

    // Check if we have guardrails before proceeding
    if (!effectiveGuardrailsConfig) {
      console.error('❌ No guardrails config available');
      alert('Guardrails Required\n\nPlease generate guardrails first on the AI Guardrails tab before creating evaluations.');
      return;
    }

    // Ensure we have a valid ID - this is critical for the backend
    if (!effectiveGuardrailsConfig.id) {
      console.error('❌ Guardrails config exists but missing ID');
      alert('Guardrails configuration is missing ID. Please regenerate guardrails on the AI Guardrails tab.');
      return;
    }

    console.log('✅ Guardrails validation passed');
    console.log('   - ID:', effectiveGuardrailsConfig.id);

    setIsGenerating(true);
    setProgress(0);
    setGenerationPhase('Creating evaluation job...');

    // Initialize agent progress
    const agents = ['Safety Agent', 'Performance Agent', 'Guardrail Agent'];
    const initialProgress: Record<string, string> = {};
    agents.forEach(agent => {
      initialProgress[agent] = 'pending';
    });
    setAgentProgress(initialProgress);

    try {
      // Step 1: Create the job
      console.log('📋 Creating evaluation job...');
      const createResponse = await fetch('/api/evaluations/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId,
          guardrailsId: effectiveGuardrailsConfig.id,
          generationStrategy,
          testIntensity
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create evaluation job');
      }

      const createData = await createResponse.json();
      const jobId = createData.jobId;
      console.log('✅ Job created:', jobId);

      setProgress(5);
      setGenerationPhase('Job queued, starting processing...');

      // Step 2: Trigger processing and start polling simultaneously
      console.log('🚀 Triggering job processing...');

      // Start processing in background (don't await - let it run)
      const processPromise = fetch('/api/evaluations/job/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Process endpoint returned:', data.status);
          return data;
        } else {
          const errorText = await res.text();
          console.error('❌ Process endpoint error:', errorText);
          return null;
        }
      }).catch(err => {
        // Network error or timeout - job might still complete via polling
        console.log('Process request error (may still complete via polling):', err?.message);
        return null;
      });

      // Step 3: Poll for status (runs in parallel with processing)
      console.log('📊 Polling for job status...');

      // Race between polling completion and process completion
      const result = await Promise.race([
        pollJobStatus(jobId),
        processPromise.then(data => {
          // If process completed successfully, return its result
          if (data?.status === 'completed' && data?.evaluationConfig) {
            return {
              evaluationConfig: data.evaluationConfig,
              summary: data.summary
            };
          }
          // Otherwise, let polling continue (return a promise that never resolves)
          return new Promise(() => {});
        })
      ]);

      // Step 4: Handle successful completion
      setProgress(100);
      setGenerationPhase('Generation complete!');

      // Mark all agents as completed
      const completedProgress: Record<string, string> = {};
      agents.forEach(agent => {
        completedProgress[agent] = 'completed';
      });
      setAgentProgress(completedProgress);

      if (result?.evaluationConfig) {
        const evalConfig = result.evaluationConfig;
        setEvaluationConfig(evalConfig);
        setTestSuites(evalConfig.testSuites.map((suite: any) => ({
          ...suite,
          scenarioCount: suite.scenarios.length,
          scenarios: suite.scenarios,
          coverage: suite.coverage?.percentage || 0,
          status: 'pending'
        })));
        console.log('✨ AI Generation Summary:', result.summary);
      }

    } catch (error) {
      console.error('Error generating evaluations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('guardrails')) {
        alert('Guardrails Required\n\nPlease generate guardrails first on the AI Guardrails tab before creating evaluations.');
      } else if (errorMessage.includes('LLM') || errorMessage.includes('OpenAI')) {
        alert('LLM Configuration Required\n\nOpenAI API key is not configured. Please check your environment configuration.');
      } else {
        alert(`Generation Failed\n\n${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
      setGenerationPhase('');
      setTimeout(() => {
        setProgress(0);
        setAgentProgress({});
      }, 1000);
    }
  };

  // Removed runEvaluations function - we only generate test scenarios, not execute them
  /*
  const runEvaluations = async () => {
    if (!evaluationConfig) {
      alert('Evaluation Config Required\n\nPlease generate evaluations first before running them.\n\nThis will create test suites based on your guardrails.');
      return;
    }

    // Alert user about evaluation run
    const confirmed = confirm('Run Evaluations?\n\nThis will execute all test suites against your AI system.\n\nThis process may take several minutes and will consume API credits.\n\nDo you want to continue?');
    if (!confirmed) {
      return;
    }

    setIsRunning(true);
    setProgress(0);

    try {
      // Update all suites to running status
      setTestSuites(prev => prev.map(s => ({ ...s, status: 'running' })));
      
      // Start progress tracking
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);
      
      // Call the real evaluation runner API
      const response = await fetch('/api/evaluations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationConfig,
          environment: {
            name: 'production',
            type: 'production',
            configuration: {
              mockResponses: false,
              deterministicMode: false,
              realData: true,
              aiAgentsEnabled: true
            }
          }
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to run evaluations');
      }

      const executionResult = await response.json();
      
      console.log('🔍 Evaluation execution result:', executionResult);
      console.log('   Test results:', executionResult.testResults);
      console.log('   Scores:', executionResult.scores);
      console.log('   Dimension scores:', executionResult.scores?.dimensionScores);
      console.log('   Overall score:', executionResult.scores?.overallScore);
      console.log('   Recommendations:', executionResult.recommendations);
      
      // Update test suites based on real results
      const testResultsBySuite = new Map<string, any[]>();
      executionResult.testResults.forEach((result: any) => {
        const suiteId = result.testId || result.suiteId; // Handle both testId and suiteId
        if (!testResultsBySuite.has(suiteId)) {
          testResultsBySuite.set(suiteId, []);
        }
        testResultsBySuite.get(suiteId)?.push(result);
      });

      // Update suite statuses based on actual test results
      setTestSuites(prev => prev.map(suite => {
        const suiteResults = testResultsBySuite.get(suite.id) || [];
        const failed = suiteResults.some(r => r.status === 'failed');
        const allPassed = suiteResults.length > 0 && suiteResults.every(r => r.status === 'passed');
        
        return {
          ...suite,
          status: failed ? 'failed' : allPassed ? 'passed' : 'pending'
        };
      }));
      
      // Convert scores to evaluation results format
      const dimensionResults: EvaluationResult[] = Object.entries(executionResult.scores.dimensionScores || {})
        .map(([dimension, scoreData]: [string, any]) => ({
          dimension: dimension.charAt(0).toUpperCase() + dimension.slice(1),
          score: Math.round(scoreData.normalizedScore || scoreData.value || 0),
          grade: scoreData.grade || getGradeFromScore(scoreData.normalizedScore || scoreData.value || 0),
          trend: 'stable' // Could be enhanced with historical data
        }));
      
      console.log('📊 Processed dimension results:', dimensionResults);
      console.log('📊 Overall score:', executionResult.scores.overallScore?.value || 0);
      
      setResults(dimensionResults);
      setOverallScore(executionResult.scores.overallScore?.value || 0);
      
      // Set recommendations from actual evaluation
      if (executionResult.recommendations && executionResult.recommendations.length > 0) {
        setRecommendations(executionResult.recommendations.map((rec: any) => 
          typeof rec === 'string' ? rec : rec.description || rec.text
        ));
      } else {
        // Generate basic recommendations based on scores
        const recs = [];
        const dimensionScores = executionResult.scores.dimensionScores || {};
        
        if (dimensionScores.Safety?.normalizedScore < 90) {
          recs.push('Strengthen safety measures and content filtering');
        }
        if (dimensionScores.Performance?.normalizedScore < 80) {
          recs.push('Optimize model performance and response times');
        }
        if (dimensionScores.Compliance?.normalizedScore < 95) {
          recs.push('Review and enhance compliance controls');
        }
        if (dimensionScores.Ethics?.normalizedScore < 85) {
          recs.push('Implement additional ethical safeguards');
        }
        if (dimensionScores['Cost Efficiency']?.normalizedScore < 70) {
          recs.push('Optimize resource usage for cost efficiency');
        }
        setRecommendations(recs.length > 0 ? recs : ['System meets all evaluation criteria']);
      }
      
      setProgress(100);

      // Persist completed evaluation results
      try {
        console.log('💾 Saving evaluation results to database...');
        console.log('   Overall score:', executionResult.scores?.overallScore?.value);
        console.log('   Dimension scores:', executionResult.scores?.dimensionScores);
        console.log('   Recommendations:', executionResult.recommendations);
        
        await fetch('/api/evaluations/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useCaseId,
            evaluationConfig: { ...(evaluationConfig || {}), id: (evaluationConfig && evaluationConfig.id) || executionResult.evaluationId },
            evaluationResult: {
              results: executionResult.testResults,
              scores: executionResult.scores,
              recommendations: executionResult.recommendations
            }
          })
        });
        console.log('✅ Evaluation results saved successfully');
      } catch (err) {
        console.error('❌ Failed to save evaluation results:', err);
      }
      
    } catch (error) {
      console.error('Error running evaluations:', error);
      alert('Failed to run evaluations. Please check the console for details.');
      // Reset suite statuses on error
      setTestSuites(prev => prev.map(s => ({ ...s, status: 'failed' })));
    } finally {
      setIsRunning(false);
    }
  };
  */

  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const exportResults = async () => {
    if (!evaluationConfig) {
      alert('No test scenarios to export. Please generate evaluations first.');
      return;
    }

    try {
      // Export test scenarios configuration
      const exportData = {
        useCaseId,
        generatedAt: evaluationConfig.createdAt || new Date().toISOString(),
        generationMethod: useAIGeneration ? 'AI-Powered (LLM)' : 'Template-Based',
        strategy: useAIGeneration ? generationStrategy : 'static',
        intensity: useAIGeneration ? testIntensity : 'standard',
        testSuites: testSuites.map(suite => ({
          id: suite.id,
          name: suite.name,
          type: suite.type,
          priority: suite.priority,
          scenarioCount: suite.scenarioCount,
          coverage: suite.coverage,
          scenarios: suite.scenarios
        })),
        totalScenarios: testSuites.reduce((sum, suite) => sum + (suite.scenarioCount || 0), 0),
        metadata: evaluationConfig.metadata || {},
        evaluationCriteria: evaluationConfig.evaluationCriteria || {},
        scoringFramework: evaluationConfig.scoringFramework || {}
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-scenarios-${useCaseId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('✅ Exported test scenarios successfully');
    } catch (error) {
      console.error('Error exporting test scenarios:', error);
      alert('Failed to export test scenarios');
    }
  };

  // Old export function - commented out
  /*
  const exportResultsOld = async () => {
    if (!evaluationConfig || results.length === 0) {
      alert('No results to export');
      return;
    }

    try {
      // Call the export API to get properly formatted results
      const response = await fetch('/api/evaluations/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationConfig,
          results: {
            dimensions: results,
            overallScore,
            recommendations,
            testSuites
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export results');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-results-${useCaseId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting results:', error);
      // Fallback to client-side export
      const exportData = {
        useCaseId,
        timestamp: new Date().toISOString(),
        config: evaluationConfig,
        results,
        overallScore,
        recommendations,
        testSuites
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-results-${useCaseId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  */

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↑';
      case 'degrading': return '↓';
      default: return '→';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const toggleSuiteExpansion = (suiteId: string) => {
    setExpandedSuites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suiteId)) {
        newSet.delete(suiteId);
      } else {
        newSet.add(suiteId);
      }
      return newSet;
    });
  };

  return (
    <>
      <style jsx>{`
        select option {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
        }
        select option:hover {
          background-color: var(--accent) !important;
          color: var(--accent-foreground) !important;
        }
        select option:checked {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
        }
      `}</style>
      <Card>
        <CardContent className="pt-6">
        {/* Banner removed - no longer showing old evaluation data */}
        
        {/* Old evaluation system removed - always use new AI generation */}
        
        {/* AI Generation Settings */}
        {!evaluationConfig && !isGenerating && (
          <div className="mb-6 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold">AI-Powered Test Generation</h3>
                <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Bot className="h-3 w-3 mr-1" />
                  LLM Enhanced
                </Badge>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAIGeneration}
                  onChange={(e) => setUseAIGeneration(e.target.checked)}
                  className="sr-only"
                  disabled
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  useAIGeneration ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    useAIGeneration ? 'translate-x-5' : ''
                  }`} />
                </div>
                <span className="ml-2 text-sm font-medium">
                  AI Mode
                </span>
              </label>
            </div>
            
            {useAIGeneration && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-foreground">Generation Strategy</label>
                    <select
                      value={generationStrategy}
                      onChange={(e) => setGenerationStrategy(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background text-foreground [&>option]:bg-background [&>option]:text-foreground"
                    >
                      <option value="comprehensive">Comprehensive</option>
                      <option value="targeted">Targeted</option>
                      <option value="rapid">Rapid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block text-foreground">Test Intensity</label>
                    <select
                      value={testIntensity}
                      onChange={(e) => setTestIntensity(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background text-foreground [&>option]:bg-background [&>option]:text-foreground"
                    >
                      <option value="light">Light (5-10 tests)</option>
                      <option value="standard">Standard (10-15 tests)</option>
                      <option value="thorough">Thorough (15-20 tests)</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  AI generation creates dynamic, context-aware test scenarios using GPT-4o.
                </div>
                
                {/* Guardrails Status Indicator */}
                {effectiveGuardrailsConfig ? (
                  <Alert className="mt-4 border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Guardrails loaded {effectiveGuardrailsConfig.id ? `(ID: ${effectiveGuardrailsConfig.id.substring(0, 8)}...)` : ''}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      No guardrails found. Please generate guardrails first on the AI Guardrails tab.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Generate Button */}
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={generateEvaluations}
                    disabled={isGenerating || !effectiveGuardrailsConfig}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Test Scenarios
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {isGenerating && (
          <div className="mb-6">
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-pulse" />
                <h3 className="font-semibold">Agent Analysis in Progress</h3>
              </div>
              
              {/* Agent Progress Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {Object.entries(agentProgress).map(([agent, status]) => {
                  const getAgentIcon = (name: string) => {
                    if (name.includes('Risk')) return <AlertTriangle className="h-4 w-4" />;
                    if (name.includes('Compliance')) return <Shield className="h-4 w-4" />;
                    if (name.includes('Ethics')) return <Users className="h-4 w-4" />;
                    if (name.includes('Security')) return <Shield className="h-4 w-4" />;
                    if (name.includes('Business')) return <TrendingUp className="h-4 w-4" />;
                    if (name.includes('Technical') || name.includes('Performance')) return <Zap className="h-4 w-4" />;
                    if (name.includes('Safety')) return <Shield className="h-4 w-4" />;
                    return <Bot className="h-4 w-4" />;
                  };
                  
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'completed': return 'text-green-600';
                      case 'analyzing': return 'text-blue-600';
                      default: return 'text-gray-400';
                    }
                  };
                  
                  return (
                    <div key={agent} className="flex items-center gap-2 p-2 rounded-md bg-white/50 dark:bg-gray-800/50">
                      <div className={`${getStatusColor(status)}`}>
                        {getAgentIcon(agent)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{agent}</div>
                        <div className="text-xs text-muted-foreground">
                          {status === 'completed' ? 'completed' : status === 'analyzing' ? 'analyzing' : 'pending'}
                        </div>
                      </div>
                      <div>
                        {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {status === 'analyzing' && <div className="h-4 w-4" />}
                        {status === 'pending' && <div className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {generationPhase || 'Processing...'}
                  </span>
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {evaluationConfig && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="suites">Test Suites</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{testSuites.length}</div>
                    <p className="text-xs text-muted-foreground">Test Suites</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {testSuites.reduce((sum, s) => sum + (s.scenarioCount || s.scenarios.length), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Test Scenarios</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {Math.round(testSuites.reduce((sum, s) => sum + s.coverage, 0) / testSuites.length)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Average Coverage</p>
                  </CardContent>
                </Card>
              </div>

              {/* Evaluation results will be shown after external execution */}
            </TabsContent>

            <TabsContent value="suites" className="space-y-4">
              {testSuites.map((suite) => {
                const isExpanded = expandedSuites.has(suite.id);
                return (
                  <Card key={suite.id}>
                    <CardContent className="pt-6">
                      <Collapsible open={isExpanded} onOpenChange={() => toggleSuiteExpansion(suite.id)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex items-center justify-center p-0 h-auto">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </div>
                              {suiteIcons[suite.type] || <FileText className="h-4 w-4" />}
                              <div className="text-left">
                                <h4 className="font-semibold">{suite.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {suite.scenarioCount || suite.scenarios.length} scenarios • {Math.round(suite.coverage)}% coverage
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(suite.priority)}>
                                {suite.priority}
                              </Badge>
                              {suite.status && (
                                <div className="flex items-center gap-1">
                                  {suite.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                  {suite.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                                  {suite.status === 'running' && <div className="h-4 w-4" />}
                                  {suite.status === 'pending' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                                  <span className="text-sm capitalize">{suite.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <div className="space-y-3 pl-7">
                            {suite.scenarios && suite.scenarios.map((scenario: any, index: number) => (
                              <Card key={scenario.id || index} className="bg-muted/30">
                                <CardContent className="pt-4 pb-4">
                                  <div className="flex items-start gap-3">
                                    <FlaskConical className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm">{scenario.name}</h5>
                                      <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                                      {scenario.guardrailId && (
                                        <Badge variant="outline" className="mt-2 text-xs">
                                          Tests Guardrail: {scenario.guardrailId}
                                        </Badge>
                                      )}
                                      {scenario.inputs && scenario.inputs.length > 0 && (
                                        <div className="mt-3">
                                          <p className="text-xs font-medium mb-1">Test Inputs:</p>
                                          <div className="space-y-1">
                                            {scenario.inputs.map((input: any, idx: number) => (
                                              <div key={idx} className="text-xs text-muted-foreground">
                                                • {input.type}: {typeof input.value === 'object' ? JSON.stringify(input.value) : input.value}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {scenario.assertions && scenario.assertions.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium mb-1">Assertions:</p>
                                          <div className="space-y-1">
                                            {scenario.assertions.map((assertion: any, idx: number) => (
                                              <div key={idx} className="text-xs text-muted-foreground">
                                                • {assertion.type || 'Check'}: {assertion.description || assertion.condition || 'Validation'}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Results tab removed - tests should be executed externally */}
            {false && (
              <TabsContent value="results" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Tests should be executed externally using the generated test scenarios
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Generate evaluation suites to see AI-powered test recommendations
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!evaluationConfig && !isGenerating && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Generate evaluation suites from your guardrails to test your AI system comprehensively
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default EvaluationGenerator;