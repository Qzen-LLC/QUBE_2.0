'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingUp, Zap, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReadOnlyAssessmentDisplay from '@/components/ReadOnlyAssessmentDisplay';
import ReadOnlyFinancialDashboard from '@/components/ReadOnlyFinancialDashboard';
import ReadOnlyApprovalsDashboard from '@/components/ReadOnlyApprovalsDashboard';

interface UseCaseDetails {
  id: string;
  title: string;
  aiucId: number;
  problemStatement: string;
  proposedAISolution: string;
  keyBenefits: string;
  primaryStakeholders: string[];
  secondaryStakeholders: string[];
  successCriteria: string;
  problemValidation: string;
  solutionHypothesis: string;
  keyAssumptions: string;
  initialROI: string;
  confidenceLevel: number;
  operationalImpactScore: number;
  productivityImpactScore: number;
  revenueImpactScore: number;
  implementationComplexity: number;
  estimatedTimeline: string;
  requiredResources: string;
  businessFunction: string;
  stage?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  answers?: Array<{
    id: string;
    value: string;
    rawValue?: any;
    question?: {
      id: string;
      text: string;
      type: string;
      stage?: string;
    };
    questionTemplate?: {
      id: string;
      text: string;
      type: string;
      stage?: string;
    };
  }>;
  assessData?: {
    stepsData: {
      technicalFeasibility?: Record<string, unknown>;
      businessFeasibility?: Record<string, unknown>;
      ethicalImpact?: Record<string, unknown>;
      riskAssessment?: Record<string, unknown>;
      dataReadiness?: Record<string, unknown>;
      roadmapPosition?: Record<string, unknown>;
      budgetPlanning?: Record<string, unknown>;
    };
  };
}

const ViewUseCasePage = () => {
  const params = useParams();
  const router = useRouter();
  const useCaseId = params.useCaseId as string;
  const [useCase, setUseCase] = useState<UseCaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  // External sections data
  const [guardrailsConfig, setGuardrailsConfig] = useState<any | null>(null);
  const [guardrailsInfo, setGuardrailsInfo] = useState<any | null>(null);
  const [approvalsData, setApprovalsData] = useState<any | null>(null);
  const [finopsData, setFinopsData] = useState<any | null>(null);
  const [questionsData, setQuestionsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchUseCaseDetails = async () => {
      try {
        const response = await fetch(`/api/get-usecase-details?useCaseId=${useCaseId}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          // Try to parse error response
          let errorMessage = 'Failed to fetch use case details';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = `Failed to fetch use case details (${response.status} ${response.statusText})`;
          }
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            errorMessage
          });
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setUseCase(data);
        
        // Debug: Log assessData structure
        if (data.assessData?.stepsData) {
          console.log('🔍 [DEBUG] assessData.stepsData keys:', Object.keys(data.assessData.stepsData));
          Object.entries(data.assessData.stepsData).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              console.log(`🔍 [DEBUG] ${key}:`, Object.keys(value as any).length, 'fields');
            }
          });
        }
        
        // Also check if answers are included
        if (data.answers) {
          console.log('🔍 [DEBUG] UseCase has', data.answers.length, 'answers directly');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load use case details';
        setError(errorMessage);
        console.error('Error fetching use case details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (useCaseId) {
      fetchUseCaseDetails();
    }
  }, [useCaseId]);

  // Load external sections: guardrails, evaluations, golden datasets, questions
  useEffect(() => {
    if (!useCaseId) return;
    // Guardrails
    fetch(`/api/guardrails/get?useCaseId=${useCaseId}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) {
          setGuardrailsInfo(data);
          if (data.guardrails) setGuardrailsConfig(data.guardrails);
        }
      })
      .catch(() => {});
    // Approvals data
    fetch(`/api/read-approvals?useCaseId=${useCaseId}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setApprovalsData(data);
      })
      .catch(() => {});
    // Financial data
    fetch(`/api/get-finops?id=${useCaseId}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        console.log('🔍 [DEBUG] Finops API Response:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('🔍 [DEBUG] Setting finopsData to:', data[0]);
          setFinopsData(data[0]);
        } else {
          console.log('🔍 [DEBUG] No finops data found or empty array');
        }
      })
      .catch((error) => {
        console.error('🔍 [DEBUG] Error fetching finops data:', error);
      });
    // Questions with answers
    fetch(`/api/get-assess-questions?useCaseId=${useCaseId}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          // Filter to only questions with answers
          const questionsWithAnswers = data.filter((q: any) => q.answers && q.answers.length > 0);
          console.log('🔍 [DEBUG] Questions with answers:', questionsWithAnswers.length, 'total');
          console.log('🔍 [DEBUG] Questions by stage:', 
            questionsWithAnswers.reduce((acc: any, q: any) => {
              acc[q.stage] = (acc[q.stage] || 0) + 1;
              return acc;
            }, {})
          );
          setQuestionsData(questionsWithAnswers);
        }
      })
      .catch((error) => {
        console.error('🔍 [DEBUG] Error fetching questions:', error);
      });
  }, [useCaseId]);

  // Note: Auto-evaluation runs have been disabled in view mode
  // Evaluations should only be run explicitly by users, not automatically
  // This prevents unwanted evaluation runs when viewing use cases

  const getOverallScore = () => {
    if (!useCase) return 0;
    return ((useCase.operationalImpactScore + useCase.productivityImpactScore + useCase.revenueImpactScore) / 3).toFixed(1);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to filter out empty/false/0 values from technical feasibility data
  const filterTechnicalFeasibilityData = (data: Record<string, unknown> | undefined) => {
    if (!data) return {};
    
    const filtered: Record<string, unknown> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip if value is falsy, empty array, or 0
      if (value === false || value === null || value === undefined || 
          value === '' || value === 0 || 
          (Array.isArray(value) && value.length === 0)) {
        return;
      }
      
      // Handle nested objects - recursively filter them
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedFiltered = filterTechnicalFeasibilityData(value as Record<string, unknown>);
        // Only include the nested object if it has meaningful content
        if (Object.keys(nestedFiltered).length > 0) {
          const readableKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          filtered[readableKey] = nestedFiltered;
        }
        return;
      }
      
      // Convert key to readable format
      const readableKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      filtered[readableKey] = value;
    });
    
    return filtered;
  };

  // Helper function to format field values for display
  const formatFieldValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      // Check if array contains objects
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        // Handle array of objects - format each object as key-value pairs
        return value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            const formattedPairs = Object.entries(obj)
              .filter(([_, val]) => val !== null && val !== undefined && val !== '' && val !== 0)
              .map(([key, val]) => {
                const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                return `${readableKey}: ${val}`;
              });
            return formattedPairs.join(', ');
          }
          return String(item);
        }).join('; ');
      }
      // Handle simple arrays
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects by formatting them as key-value pairs
      const obj = value as Record<string, unknown>;
      const formattedPairs = Object.entries(obj)
        .filter(([_, val]) => val !== null && val !== undefined && val !== '' && val !== 0)
        .map(([key, val]) => {
          const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
          if (Array.isArray(val)) {
            return `${readableKey}: ${formatFieldValue(val)}`;
          }
          if (typeof val === 'object' && val !== null) {
            return `${readableKey}: ${formatFieldValue(val)}`;
          }
          return `${readableKey}: ${val}`;
        });
      return formattedPairs.join('; ');
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  };

  // Toggle dropdown section - collapse one section when another is opened
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const isCurrentlyOpen = prev[sectionId];
      
      if (isCurrentlyOpen) {
        // If clicking on an open section, close it
        return {
          ...prev,
          [sectionId]: false
        };
      } else {
        // If clicking on a closed section, close all others and open this one
        // Scroll to the section after state update
        setTimeout(() => {
          const element = document.getElementById(`section-${sectionId}`);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100); // Small delay to ensure DOM is updated
        
        return {
          [sectionId]: true
        };
      }
    });
  };

  // Helper function to build questions from useCase answers as fallback
  const buildQuestionsFromAnswers = (): any[] => {
    if (!useCase?.answers || useCase.answers.length === 0) return [];
    
    const questionsMap = new Map<string, any>();
    
    useCase.answers.forEach((answer: any) => {
      const question = answer.question || answer.questionTemplate;
      if (!question) return;
      
      const questionId = question.id;
      if (!questionsMap.has(questionId)) {
        questionsMap.set(questionId, {
          id: questionId,
          text: question.text,
          type: question.type,
          stage: question.stage,
          answers: []
        });
      }
      
      const q = questionsMap.get(questionId)!;
      // Format answer value based on type
      const answerValue = answer.value;
      let formattedValue = '';
      
      if (answerValue) {
        if (answerValue.labels && Array.isArray(answerValue.labels)) {
          formattedValue = answerValue.labels.join(', ');
        } else if (answerValue.text) {
          formattedValue = answerValue.text;
        } else if (typeof answerValue === 'string') {
          formattedValue = answerValue;
        } else {
          formattedValue = JSON.stringify(answerValue);
        }
      }
      
      if (formattedValue) {
        q.answers.push({
          id: answer.id,
          value: formattedValue,
          questionId: questionId
        });
      }
    });
    
    return Array.from(questionsMap.values()).filter(q => q.answers.length > 0);
  };

  // Helper function to get questions by stage
  const getQuestionsByStage = (stage: string): any[] => {
    // First try questionsData from API
    let filtered = questionsData.filter((q: any) => q.stage === stage);
    
    // If no questions found, try building from useCase answers
    if (filtered.length === 0 && useCase?.answers) {
      const fallbackQuestions = buildQuestionsFromAnswers();
      filtered = fallbackQuestions.filter((q: any) => q.stage === stage);
      
      if (filtered.length > 0) {
        console.log(`[ViewUseCase] Using fallback questions for stage: ${stage} (${filtered.length} found)`);
      }
    }
    
    // Debug logging
    if (filtered.length === 0 && (questionsData.length > 0 || (useCase?.answers && useCase.answers.length > 0))) {
      console.log(`[ViewUseCase] No questions found for stage: ${stage}`);
      if (questionsData.length > 0) {
        console.log(`[ViewUseCase] Available stages from API:`, [...new Set(questionsData.map((q: any) => q.stage))]);
      }
      if (useCase?.answers) {
        const stagesFromAnswers = [...new Set(useCase.answers.map((a: any) => (a.question || a.questionTemplate)?.stage).filter(Boolean))];
        console.log(`[ViewUseCase] Available stages from answers:`, stagesFromAnswers);
      }
    }
    
    return filtered;
  };

  // Helper function to format answer value for display
  const formatAnswerValue = (question: any): string => {
    if (!question.answers || question.answers.length === 0) {
      // Try to get raw answer value if available
      if (question.rawAnswerValue) {
        if (typeof question.rawAnswerValue === 'object') {
          return JSON.stringify(question.rawAnswerValue);
        }
        return String(question.rawAnswerValue);
      }
      return 'Not answered';
    }
    
    const answers = question.answers;
    
    // For TEXT and SLIDER type questions
    if (question.type === 'TEXT' || question.type === 'SLIDER' || question.type === 'TEXT_MINI') {
      const value = answers[0]?.value;
      if (value) return value;
      // Fallback to raw value if formatted value is missing
      if (answers[0]?.rawValue) return String(answers[0].rawValue);
      return 'Not answered';
    }
    
    // For CHECKBOX type questions (multiple selections)
    if (question.type === 'CHECKBOX') {
      const values = answers.map((a: any) => a.value).filter(Boolean);
      if (values.length > 0) return values.join(', ');
      return 'Not answered';
    }
    
    // For RADIO type questions (single selection)
    if (question.type === 'RADIO') {
      const value = answers[0]?.value;
      if (value) return value;
      return 'Not answered';
    }
    
    // For RISK type questions (probability and impact)
    if (question.type === 'RISK') {
      const probability = answers.find((a: any) => a.value && (a.value.startsWith('pro:') || a.value.includes('Probability')))?.value.replace('pro:', '').replace('Probability:', '').trim() || '';
      const impact = answers.find((a: any) => a.value && (a.value.startsWith('imp:') || a.value.includes('Impact')))?.value.replace('imp:', '').replace('Impact:', '').trim() || '';
      if (probability && impact) {
        return `Probability: ${probability}, Impact: ${impact}`;
      }
      const allValues = answers.map((a: any) => a.value).filter(Boolean);
      if (allValues.length > 0) return allValues.join(', ');
      return 'Not answered';
    }
    
    // Default: join all answer values
    const allValues = answers.map((a: any) => a.value).filter(Boolean);
    if (allValues.length > 0) return allValues.join(', ');
    return 'Not answered';
  };

  // Helper function to get assessment data from multiple possible locations (fallback for old data)
  const getAssessmentData = (sectionName: string): Record<string, unknown> | undefined => {
    if (!useCase?.assessData) return undefined;
    
    // Try the expected location first: assessData.stepsData.sectionName
    if (useCase.assessData.stepsData && typeof useCase.assessData.stepsData === 'object') {
      const stepsData = useCase.assessData.stepsData as Record<string, unknown>;
      if (stepsData[sectionName]) {
        return stepsData[sectionName] as Record<string, unknown>;
      }
    }
    
    // Fallback: check if data is directly in assessData
    if (useCase.assessData && typeof useCase.assessData === 'object') {
      const assessData = useCase.assessData as Record<string, unknown>;
      if (assessData[sectionName]) {
        return assessData[sectionName] as Record<string, unknown>;
      }
    }
    
    return undefined;
  };

  // Helper function to render assessment section data (questions first, then fallback to assessData)
  const renderAssessmentSection = (stage: string, sectionName: string) => {
    // First, try to get questions with answers
    const questions = getQuestionsByStage(stage);
    
    // Get assessData as fallback
    const assessmentData = getAssessmentData(sectionName);
    const filteredData = assessmentData ? filterTechnicalFeasibilityData(assessmentData) : {};
    const hasAssessData = assessmentData && Object.keys(filteredData).length > 0;
    
    // If we have questions with answers, show those
    if (questions.length > 0) {
      return (
        <div className="space-y-3">
          {questions.map((question: any) => (
            <div key={question.id} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{question.text}</span>
              <div className="text-sm text-muted-foreground bg-card p-2 rounded border">
                {formatAnswerValue(question)}
              </div>
            </div>
          ))}
          {/* Also show assessData if available (as additional context) */}
          {hasAssessData && (
            <>
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Additional Assessment Data</h4>
                {Object.entries(filteredData).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1 mb-3">
                    <span className="text-sm font-medium text-foreground">{key}:</span>
                    <div className="text-sm text-muted-foreground bg-card p-2 rounded border">
                      {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                        <div className="space-y-1">
                          {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                            <div key={nestedKey} className="flex justify-between">
                              <span className="font-medium">{nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}:</span>
                              <span>{formatFieldValue(nestedValue)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        formatFieldValue(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    
    // If no questions but we have assessData, show that
    if (hasAssessData) {
      return (
        <div className="space-y-3">
          {Object.entries(filteredData).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{key}:</span>
              <div className="text-sm text-muted-foreground bg-card p-2 rounded border">
                {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                  <div className="space-y-1">
                    {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                      <div key={nestedKey} className="flex justify-between">
                        <span className="font-medium">{nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}:</span>
                        <span>{formatFieldValue(nestedValue)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  formatFieldValue(value)
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // No data available
    const sectionDisplayName = sectionName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    return (
      <p className="text-sm text-muted-foreground italic">
        No {sectionDisplayName.toLowerCase()} data available.
      </p>
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <Card className="p-6 mb-6 bg-card border-border">
      <div className="flex items-center mb-4">
        {icon}
        <h2 className="text-xl font-semibold text-foreground ml-2">{title}</h2>
      </div>
      {children}
    </Card>
  );

  const _renderField = (label: string, value: string | number | string[] | undefined, type: 'text' | 'array' | 'score' = 'text') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {type === 'array' && Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span key={index} className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-sm">
              {item}
            </span>
          ))}
        </div>
      ) : type === 'score' ? (
        <div className="flex items-center">
          <span className="text-2xl font-bold text-primary">{value}</span>
          <span className="text-muted-foreground ml-2">/ 10</span>
        </div>
      ) : (
        <p className="text-foreground bg-muted p-3 rounded-lg">
          {value !== undefined && value !== null && value !== "" ? value : "Not specified"}
        </p>
      )}
    </div>
  );

  // Helper for array rendering
  const renderArray = (items: string[] | undefined, label: string) => {
    if (!items || items.length === 0) return <span className="text-muted-foreground italic">No {label.toLowerCase()} recorded.</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={index} className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-sm">
            {item}
          </span>
        ))}
      </div>
    );
  };

  // Helper for risk rendering
  const _renderRiskList = (risks: Record<string, unknown>[] | string | undefined, label: string) => {
    if (Array.isArray(risks)) {
      if (risks.length === 0) return <p className="text-muted-foreground italic">No {label.toLowerCase()} recorded.</p>;
      return (
        <div className="space-y-2">
          {risks.map((riskObj, idx) => (
            <div key={idx} className="bg-destructive/10 dark:bg-destructive/20 p-3 rounded-md">
              {typeof riskObj.risk === 'string' || typeof riskObj.risk === 'number' ? (
                <div><strong>Risk:</strong> {riskObj.risk}</div>
              ) : null}
              {typeof riskObj.impact === 'string' || typeof riskObj.impact === 'number' ? (
                <div><strong>Impact:</strong> {riskObj.impact}</div>
              ) : null}
              {typeof riskObj.probability === 'string' || typeof riskObj.probability === 'number' ? (
                <div><strong>Probability:</strong> {riskObj.probability}</div>
              ) : null}
            </div>
          ))}
        </div>
      );
    } else if (typeof risks === 'string') {
      return <p className="text-foreground bg-muted p-3 rounded-lg">{risks}</p>;
    } else {
      return <p className="text-muted-foreground italic">No {label.toLowerCase()} recorded.</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground">Loading use case details...</p>
        </div>
      </div>
    );
  }

  if (error || !useCase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || 'Use case not found'}</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto bg-card rounded-xl shadow-lg overflow-hidden border border-border">
        {/* Header */}
        <div className="px-8 py-5 bg-card border-b border-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5 flex-1">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-2 p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="bg-muted px-3 py-1.5 rounded-md font-semibold text-muted-foreground text-sm">
              AIUC-{useCase.aiucId}
            </span>
            <h1 className="text-lg font-semibold text-foreground">
              {useCase.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3.5 py-1.5 rounded-full text-sm font-medium border ${
              useCase.priority === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              useCase.priority === 'medium' ? 'bg-success/10 text-success border-success/20' :
              'bg-warning/10 text-warning border-warning/20'
            }`}>
              {useCase.priority?.toUpperCase() || 'MEDIUM'} Priority
            </span>
            <span className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
              {useCase.stage || 'proof-of-value'}
            </span>
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="flex items-center gap-2.5 px-8 py-2 bg-muted/50 border-b border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium">Created:</span>
              <span>{formatDate(useCase.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Updated:</span>
              <span>{formatDate(useCase.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">By:</span>
              <span>
                {useCase.user ? 
                  (() => {
                    const fullName = `${useCase.user.firstName || ''} ${useCase.user.lastName || ''}`.trim();
                    return fullName || useCase.user.email || 'Not specified';
                  })() 
                  : 'Not specified'
                }
              </span>
            </div>
          </div>
          <div className="flex items-center ml-auto gap-4">
            <span className="text-sm font-medium text-muted-foreground">Use Case Profile</span>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-background shadow-sm">
                  {useCase.operationalImpactScore || 'B'}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Operational</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-background shadow-sm">
                  {useCase.productivityImpactScore || 'B'}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Productivity</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-background shadow-sm">
                  {useCase.revenueImpactScore || 'B'}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Business</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Table */}
        <div className="mx-5 my-5 bg-muted rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-muted/70 px-5 py-3 text-left font-medium text-sm text-foreground border-r border-border">
                  Business Function
                </th>
                <th className="bg-muted/70 px-5 py-3 text-left font-medium text-sm text-foreground border-r border-border">
                  Primary Stakeholders
                </th>
                <th className="bg-muted/70 px-5 py-3 text-left font-medium text-sm text-foreground border-r border-border">
                  Secondary Stakeholders
                </th>
                <th className="bg-muted/70 px-5 py-3 text-left font-medium text-sm text-foreground border-r border-border">
                  Planned Start Date
                </th>
                <th className="bg-muted/70 px-5 py-3 text-left font-medium text-sm text-foreground border-r border-border">
                  Estimated Timelines
                </th>
                <th className="bg-muted/70 px-5 py-3 text-left font-medium text-sm text-foreground">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-5 py-3 text-sm text-foreground bg-card border-r border-border">
                  {useCase.businessFunction || 'Legal'}
                </td>
                <td className="px-5 py-3 text-sm text-foreground bg-card border-r border-border">
                  {useCase.primaryStakeholders?.join(', ') || 'General Counsel, Legal Operations Manager'}
                </td>
                <td className="px-5 py-3 text-sm text-foreground bg-card border-r border-border">
                  {useCase.secondaryStakeholders?.join(', ') || 'Procurement, Finance, Compliance'}
                </td>
                <td className="px-5 py-3 text-sm text-foreground bg-card border-r border-border">
                  Q2 2024
                </td>
                <td className="px-5 py-3 text-sm text-foreground bg-card border-r border-border">
                  {useCase.estimatedTimeline || '3-4 months'}
                </td>
                <td className="px-5 py-3 text-sm text-foreground bg-card">
                  {useCase.priority === 'high' ? 'High' : useCase.priority === 'medium' ? 'Medium' : 'Low'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Content */}
        <div className={`flex flex-col gap-5 px-5 pb-5 min-w-0 ${
          expandedSections.financial || expandedSections.approvals
            ? 'lg:flex-col'
            : 'lg:flex-row'
        }`}>
          {/* Left Panel */}
          <div className={`flex flex-col gap-5 min-w-0 ${
            expandedSections.financial || expandedSections.approvals
              ? 'w-full'
              : 'w-full lg:w-1/2'
          }`}>
                         {/* Problem Statement */}
             <div className="bg-muted/30 rounded-lg p-5 border border-border w-full box-border overflow-x-hidden">
               <style dangerouslySetInnerHTML={{__html: `
                 .problem-statement-content,
                 .problem-statement-content * {
                   word-break: break-word !important;
                   overflow-wrap: anywhere !important;
                   max-width: 100% !important;
                   white-space: normal !important;
                   width: 100% !important;
                   box-sizing: border-box !important;
                 }
               `}} />
               <h2 className="text-[15px] font-semibold mb-3 text-foreground">Problem Statement:</h2>
               <div 
                 className="problem-statement-content text-sm leading-relaxed text-foreground break-words min-w-0 w-full"
                 style={{ 
                   wordBreak: 'break-word', 
                   overflowWrap: 'anywhere', 
                   maxWidth: '100%', 
                   overflowX: 'hidden',
                   overflowY: 'visible',
                   boxSizing: 'border-box',
                   width: '100%'
                 }}
                 dangerouslySetInnerHTML={{ __html: useCase.problemStatement || 'Legal teams are overwhelmed with reviewing large volumes of contracts—NDAs, MSAs, SLAs, procurement documents—each containing clauses that may pose risks, require negotiation, or violate internal policy.' }}
               />
             </div>

             {/* Proposed Solution */}
             <div className="bg-muted/30 rounded-lg p-5 border border-border w-full box-border overflow-x-hidden">
               <style dangerouslySetInnerHTML={{__html: `
                 .proposed-solution-content,
                 .proposed-solution-content * {
                   word-break: break-word !important;
                   overflow-wrap: anywhere !important;
                   max-width: 100% !important;
                   white-space: normal !important;
                   width: 100% !important;
                   box-sizing: border-box !important;
                 }
               `}} />
               <h2 className="text-[15px] font-semibold mb-3 text-foreground">Proposed Solution:</h2>
               <div 
                 className="proposed-solution-content text-sm leading-relaxed text-foreground break-words min-w-0 w-full"
                 style={{ 
                   wordBreak: 'break-word', 
                   overflowWrap: 'anywhere', 
                   maxWidth: '100%', 
                   overflowX: 'hidden',
                   overflowY: 'visible',
                   boxSizing: 'border-box',
                   width: '100%'
                 }}
                 dangerouslySetInnerHTML={{ __html: useCase.proposedAISolution || 'Legal teams are overwhelmed with reviewing large volumes of contracts—NDAs, MSAs, SLAs, procurement documents—each containing clauses that may pose risks, require negotiation, or violate internal policy.' }}
               />
             </div>

             {/* Key Benefits */}
             <div className="bg-muted/30 rounded-lg p-5 border border-border w-full box-border overflow-x-hidden">
               <style dangerouslySetInnerHTML={{__html: `
                 .key-benefits-content,
                 .key-benefits-content * {
                   word-break: break-word !important;
                   overflow-wrap: anywhere !important;
                   max-width: 100% !important;
                   white-space: normal !important;
                   width: 100% !important;
                   box-sizing: border-box !important;
                 }
               `}} />
               <h2 className="text-[15px] font-semibold mb-3 text-foreground">Key Benefits</h2>
               <div 
                 className="key-benefits-content text-sm leading-relaxed text-foreground break-words min-w-0 w-full"
                 style={{ 
                   wordBreak: 'break-word', 
                   overflowWrap: 'anywhere', 
                   maxWidth: '100%', 
                   overflowX: 'hidden',
                   overflowY: 'visible',
                   boxSizing: 'border-box',
                   width: '100%'
                 }}
                 dangerouslySetInnerHTML={{ __html: useCase.keyBenefits || 'Legal teams are overwhelmed with reviewing large volumes of contracts—NDAs, MSAs, SLAs, procurement documents—each containing clauses that may pose risks, require negotiation, or violate internal policy.' }}
               />
             </div>

             {/* Success Criteria */}
             <div className="bg-muted/30 rounded-lg p-5 border border-border w-full box-border overflow-x-hidden">
               <style dangerouslySetInnerHTML={{__html: `
                 .success-criteria-content,
                 .success-criteria-content * {
                   word-break: break-word !important;
                   overflow-wrap: anywhere !important;
                   max-width: 100% !important;
                   white-space: normal !important;
                   width: 100% !important;
                   box-sizing: border-box !important;
                 }
               `}} />
               <h2 className="text-[15px] font-semibold mb-3 text-foreground">Success Criteria</h2>
               <div 
                 className="success-criteria-content text-sm leading-relaxed text-foreground break-words min-w-0 w-full"
                 style={{ 
                   wordBreak: 'break-word', 
                   overflowWrap: 'anywhere', 
                   maxWidth: '100%', 
                   overflowX: 'hidden',
                   overflowY: 'visible',
                   boxSizing: 'border-box',
                   width: '100%'
                 }}
                 dangerouslySetInnerHTML={{ __html: useCase.successCriteria || 'Legal teams are overwhelmed with reviewing large volumes of contracts—NDAs, MSAs, SLAs, procurement documents—each containing clauses that may pose risks, require negotiation, or violate internal policy.' }}
               />
             </div>

             {/* Key Assumption */}
             <div className="bg-muted/30 rounded-lg p-5 border border-border w-full box-border overflow-x-hidden">
               <style dangerouslySetInnerHTML={{__html: `
                 .key-assumption-content,
                 .key-assumption-content * {
                   word-break: break-word !important;
                   overflow-wrap: anywhere !important;
                   max-width: 100% !important;
                   white-space: normal !important;
                   width: 100% !important;
                   box-sizing: border-box !important;
                 }
               `}} />
               <h2 className="text-[15px] font-semibold mb-3 text-foreground">Key Assumption</h2>
               <div 
                 className="key-assumption-content text-sm leading-relaxed text-foreground break-words min-w-0 w-full"
                 style={{ 
                   wordBreak: 'break-word', 
                   overflowWrap: 'anywhere', 
                   maxWidth: '100%', 
                   overflowX: 'hidden',
                   overflowY: 'visible',
                   boxSizing: 'border-box',
                   width: '100%'
                 }}
                 dangerouslySetInnerHTML={{ __html: useCase.keyAssumptions || 'Legal teams are overwhelmed with reviewing large volumes of contracts—NDAs, MSAs, SLAs, procurement documents—each containing clauses that may pose risks, require negotiation, or violate internal policy.' }}
               />
             </div>
          </div>

          {/* Right Panel */}
          <div className={`${
            expandedSections.financial || expandedSections.approvals
              ? 'w-full'
              : 'w-full lg:w-1/2'
          }`}>
            <div className="bg-muted rounded-lg overflow-hidden">
              <div className="space-y-0">
                 {/* Requirements Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-requirements"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('requirements')}
                   >
                     <span>Requirements</span>
                     {expandedSections.requirements ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.requirements && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('REQUIREMENTS', 'requirements')}
                     </div>
                   )}
                 </div>
                 {/* Technical Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-technical"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('technical')}
                   >
                     <span>Technical</span>
                     {expandedSections.technical ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.technical && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('TECHNICAL', 'technical')}
                     </div>
                   )}
                 </div>
                 {/* Business Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-business"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('business')}
                   >
                     <span>Business</span>
                     {expandedSections.business ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.business && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('BUSINESS', 'business')}
                     </div>
                   )}
                 </div>
                 {/* Responsible / Ethical Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-responsibleEthical"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('responsibleEthical')}
                   >
                     <span>Responsible / Ethical</span>
                     {expandedSections.responsibleEthical ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.responsibleEthical && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('RESPONSIBLE_ETHICAL', 'responsibleEthical')}
                     </div>
                   )}
                 </div>
                 {/* Legal & Regulatory Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-legalRegulatory"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('legalRegulatory')}
                   >
                     <span>Legal & Regulatory</span>
                     {expandedSections.legalRegulatory ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.legalRegulatory && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('LEGAL_REGULATORY', 'legalRegulatory')}
                     </div>
                   )}
                 </div>

                 {/* Data Readiness Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-dataReadiness"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('dataReadiness')}
                   >
                     <span>Data Readiness</span>
                     {expandedSections.dataReadiness ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.dataReadiness && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('DATA_READINESS', 'dataReadiness')}
                     </div>
                   )}
                 </div>

                 {/* FinOps Assessment Dropdown */}
                 <div className="border-b border-border">
                   <div
                     id="section-finops"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('finops')}
                   >
                     <span>FinOps Assessment</span>
                     {expandedSections.finops ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.finops && (
                     <div className="px-5 py-4 bg-muted/30 border-t border-border">
                       {renderAssessmentSection('FINOPS', 'finops')}
                     </div>
                   )}
                 </div>
                 {/* Financial Dashboard Button */}
                 <div className="border-b border-border">
                   <div 
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('financial')}
                   >
                     <span>Financial Dashboard</span>
                     <ChevronRight className="h-4 w-4 text-muted-foreground" />
                   </div>
                 </div>

                 {/* Approvals Button */}
                 <div className="border-b border-border">
                   <div 
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('approvals')}
                   >
                     <span>Approvals</span>
                     <ChevronRight className="h-4 w-4 text-muted-foreground" />
                   </div>
                 </div>

                 {/* AI Guardrails Dropdown */}
                 <div className="border-b border-border">
                   <div 
                     id="section-aiGuardrails"
                     className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                     onClick={() => toggleSection('aiGuardrails')}
                   >
                     <span>AI Guardrails</span>
                     {expandedSections.aiGuardrails ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                   </div>
                   {expandedSections.aiGuardrails && (
                    <div className="px-5 py-4 bg-muted/30 border-t border-border">
                      {(() => {
                        // Prefer structured API data for friendly rendering
                        if (guardrailsInfo && (guardrailsConfig || guardrailsInfo.rules)) {
                          const cfg = guardrailsConfig || guardrailsInfo.guardrails || {};
                          const meta = guardrailsInfo.metadata || {};
                          const status = guardrailsInfo.status || cfg.status || '—';
                          const confidence = (guardrailsInfo.confidence ?? cfg.confidence) ?? '—';
                          const version = cfg.version || cfg.guardrails?.version || cfg?.version;
                          const agents = cfg.agents || cfg.guardrails?.agents;
                          const generatedAt = meta.updatedAt || meta.createdAt;
                          const rulesByCategory = cfg.guardrails?.rules || cfg.rules || {};

                          // Build a normalized rules array grouped by category
                          const categories = Object.keys(rulesByCategory);

                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-card border rounded p-3">
                                  <div className="text-xs text-muted-foreground">Version</div>
                                  <div className="text-sm font-medium">{version || '—'}</div>
                                </div>
                                <div className="bg-card border rounded p-3">
                                  <div className="text-xs text-muted-foreground">Generated</div>
                                  <div className="text-sm font-medium">{generatedAt ? formatFieldValue(generatedAt) : '—'}</div>
                                </div>
                                <div className="bg-card border rounded p-3">
                                  <div className="text-xs text-muted-foreground">Status</div>
                                  <div className="text-sm font-medium">{status || '—'}</div>
                                </div>
                                <div className="bg-card border rounded p-3">
                                  <div className="text-xs text-muted-foreground">Confidence</div>
                                  <div className="text-sm font-medium">{confidence ?? '—'}</div>
                                </div>
                              </div>

                              {Array.isArray(agents) && agents.length > 0 && (
                                <div className="bg-card border rounded p-3">
                                  <div className="text-xs text-muted-foreground mb-1">Agents</div>
                                  <div className="flex flex-wrap gap-2">
                                    {agents.map((a: any, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded">
                                        {String(a)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Rules grouped by category */}
                              {categories.length > 0 ? (
                                <div className="space-y-5">
                                  {categories.map(category => {
                                    const rules = Array.isArray(rulesByCategory[category]) ? rulesByCategory[category] : [];
                                    if (rules.length === 0) return null;
                                    return (
                                      <div key={category}>
                                        <div className="text-sm font-semibold mb-2 capitalize">{category}</div>
                                        <div className="space-y-2">
                                          {rules.map((rule: any, idx: number) => (
                                            <div key={rule.id || idx} className="bg-card border rounded p-3">
                                              <div className="flex items-center justify-between gap-3">
                                                <div className="font-medium text-sm truncate">{rule.rule || rule.name || 'Rule'}</div>
                                                {rule.severity && (
                                                  <span className="text-xs px-2 py-0.5 rounded bg-muted">{String(rule.severity)}</span>
                                                )}
                                              </div>
                                              {rule.description && (
                                                <div className="text-sm text-muted-foreground mt-1">{rule.description}</div>
                                              )}
                                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                {rule.type && <span className="px-2 py-0.5 bg-muted rounded">{String(rule.type)}</span>}
                                                {rule.status && <span className="px-2 py-0.5 bg-muted rounded">{String(rule.status)}</span>}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No guardrail rules available.</p>
                              )}
                            </div>
                          );
                        }

                        // Fallback to generic renderer using assessData key if API data not present
                        const guardrailsSource = guardrailsConfig || getAssessmentData('aiGuardrails');
                        const guardrailsData = filterTechnicalFeasibilityData(guardrailsSource);
                        const entries = Object.entries(guardrailsData);
                        if (entries.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground italic">
                              No AI guardrails configured.
                            </p>
                          );
                        }
                        return (
                          <div className="space-y-3">
                            {entries.map(([key, value]) => (
                              <div key={key} className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-foreground">{key}:</span>
                                <div className="text-sm text-muted-foreground bg-card p-2 rounded border">
                                  {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                                    <div className="space-y-1">
                                      {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                                        <div key={nestedKey} className="flex justify-between">
                                          <span className="font-medium">{nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}:</span>
                                          <span>{formatFieldValue(nestedValue)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    formatFieldValue(value)
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                 </div>

               </div>
            </div>
          </div>
        </div>

        {/* Financial Dashboard - Full Width Section */}
        {expandedSections.financial && (
          <div className="px-5 pb-5">
            <div className="bg-muted rounded-lg overflow-hidden">
              <div 
                id="section-financial"
                className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between border-b border-border"
                onClick={() => toggleSection('financial')}
              >
                <span>Financial Dashboard</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-muted/30">
                <ReadOnlyFinancialDashboard 
                  data={finopsData ? {
                    initialDevCost: finopsData.devCostBase || 0,
                    baseApiCost: finopsData.apiCostBase || 0,
                    baseInfraCost: finopsData.infraCostBase || 0,
                    baseOpCost: finopsData.opCostBase || 0,
                    baseMonthlyValue: finopsData.valueBase || 0,
                    valueGrowthRate: finopsData.valueGrowthRate || 0,
                    budgetRange: finopsData.budgetRange || '',
                    inputTokenPrice: finopsData.inputTokenPrice || 0,
                    outputTokenPrice: finopsData.outputTokenPrice || 0,
                    embeddingTokenPrice: finopsData.embeddingTokenPrice || 0,
                    finetuningTokenPrice: finopsData.finetuningTokenPrice || 0,
                    monthlyTokenBudget: finopsData.monthlyTokenBudget || 0,
                    avgTokensPerUser: finopsData.avgTokensPerUser || 0,
                    peakTokenUsage: finopsData.peakTokenUsage || 0,
                    optimizationStrategies: finopsData.optimizationStrategies || [],
                    vectorDbCost: finopsData.vectorDbCost || 0,
                    gpuInferenceCost: finopsData.gpuInferenceCost || 0,
                    monitoringToolsCost: finopsData.monitoringToolsCost || 0,
                    safetyApiCost: finopsData.safetyApiCost || 0,
                    backupModelCost: finopsData.backupModelCost || 0
                  } : undefined} 
                  finopsData={finopsData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Approvals Dashboard - Full Width Section */}
        {expandedSections.approvals && (
          <div className="px-5 pb-5">
            <div className="bg-muted rounded-lg overflow-hidden">
              <div 
                id="section-approvals"
                className="px-5 py-4 bg-card text-[15px] text-foreground cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between border-b border-border"
                onClick={() => toggleSection('approvals')}
              >
                <span>Approvals Dashboard</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-muted/30">
                <ReadOnlyApprovalsDashboard 
                  useCaseData={useCase} 
                  finopsData={finopsData}
                  approvalsData={approvalsData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewUseCasePage; 