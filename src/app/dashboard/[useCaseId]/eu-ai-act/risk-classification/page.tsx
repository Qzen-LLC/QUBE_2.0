'use client';

import React, { use, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RISK_CLASSIFICATION_QUESTIONS, calculateRiskLevel, RiskLevel } from '@/lib/framework-data/eu-ai-act-risk-classification';
import { useGovernanceLock } from '@/hooks/useGovernanceLock';
import { GovernanceLockModal } from '@/components/GovernanceLockModal';

interface RiskClassificationPageProps {
  params: Promise<{
    useCaseId: string;
  }>;
}

export default function RiskClassificationPage({ params }: RiskClassificationPageProps) {
  const router = useRouter();
  const { useCaseId } = use(params);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [classification, setClassification] = useState<any>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const {
    lockInfo,
    canEdit,
    acquireLock,
    releaseLock,
    markLockForNavigation,
    loading: lockLoading,
    error: lockError
  } = useGovernanceLock(useCaseId, 'GOVERNANCE_EU_AI_ACT');

  const navigateWithLockRetention = useCallback((path: string, retain = true) => {
    if (retain) {
      markLockForNavigation();
    }
    router.push(path);
  }, [markLockForNavigation, router]);

  const totalSteps = 4;
  const currentStepQuestions = RISK_CLASSIFICATION_QUESTIONS.filter(q => q.step === currentStep);
  const isReadOnly = !canEdit;
  const readOnlyBannerText = useMemo(() => {
    if (!isReadOnly || lockLoading) return null;
    if (lockInfo?.lockDetails?.isOwnedByCurrentUser) return null;
    if (lockInfo?.lockDetails?.acquiredBy) {
      return `${lockInfo.lockDetails.acquiredBy} is currently working on this EU AI Act assessment.\nYou can review answers in read-only mode until they release the lock.`;
    }
    return 'Another team member is currently working on this EU AI Act assessment. You can review answers in read-only mode until the lock is released.';
  }, [isReadOnly, lockInfo, lockLoading]);
  const useCaseName = assessment?.useCase?.title ?? 'Selected Use Case';
  const lockModal = (
    <GovernanceLockModal
      isOpen={isLockModalOpen}
      onClose={() => setIsLockModalOpen(false)}
      lockInfo={lockInfo}
      framework="GOVERNANCE_EU_AI_ACT"
      useCaseId={useCaseId}
      useCaseName={useCaseName}
      onAcquireLock={acquireLock}
      onReleaseLock={releaseLock}
      loading={lockLoading}
    />
  );


  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Load assessment and existing answers
  useEffect(() => {
    fetchAssessment();
  }, [useCaseId]);

  useEffect(() => {
    if (lockLoading) {
      return;
    }

    if (lockInfo?.canEdit) {
      if (!lockInfo.hasLock) {
        acquireLock();
      } else {
        setIsLockModalOpen(false);
      }
    } else if (lockInfo) {
      setIsLockModalOpen(true);
    }
  }, [lockInfo, lockLoading, acquireLock]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/eu-ai-act/risk-classification/by-usecase/${useCaseId}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Risk Classification Data:', {
          id: data.id,
          riskClassificationCompleted: data.riskClassificationCompleted,
          riskLevel: data.riskLevel,
          answersCount: data.riskClassificationAnswers?.length || 0
        });
        setAssessment(data);

        // Load existing answers
        const existingAnswers: Record<string, any> = {};
        if (data.riskClassificationAnswers && data.riskClassificationAnswers.length > 0) {
          data.riskClassificationAnswers.forEach((ans: any) => {
            try {
              existingAnswers[ans.questionId] = JSON.parse(ans.answer);
            } catch (e) {
              existingAnswers[ans.questionId] = ans.answer;
            }
          });
          setAnswers(existingAnswers);
          console.log('📝 Loaded existing answers:', Object.keys(existingAnswers));
        }

        // If already completed, show result
        if (data.riskClassificationCompleted) {
          console.log('✅ Classification completed, showing result page');
          const result = calculateRiskLevel(existingAnswers);
          console.log('🎯 Calculated result:', result);
          setClassification(result);
          setShowResult(true);
        } else {
          console.log('⏳ Classification not completed, showing wizard');
        }
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (questionId: string, answer: any) => {
    if (!assessment || isReadOnly) return;

    try {
      await fetch(`/api/eu-ai-act/risk-classification/${assessment.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
        cache: 'no-store'
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: any) => {
    if (isReadOnly) {
      setIsLockModalOpen(true);
      return;
    }

    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    await saveAnswer(questionId, answer);
  };

  const handleNext = () => {
    if (isReadOnly) {
      setIsLockModalOpen(true);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeClassification();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeClassification = async () => {
    if (!assessment || isReadOnly) {
      if (isReadOnly) {
        setIsLockModalOpen(true);
      }
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/eu-ai-act/risk-classification/${assessment.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setClassification(data.classification);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error completing classification:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (isReadOnly) {
      return false;
    }

    // Check if all questions in current step are answered
    return currentStepQuestions.every(q => {
      const answer = answers[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    if (isDarkMode) {
      switch (level) {
        case 'prohibited': return 'bg-red-950/50 text-red-300 border-red-800';
        case 'high': return 'bg-orange-950/50 text-orange-300 border-orange-800';
        case 'limited': return 'bg-yellow-950/50 text-yellow-300 border-yellow-800';
        case 'minimal': return 'bg-green-950/50 text-green-300 border-green-800';
        default: return 'bg-gray-800 text-gray-300 border-gray-700';
      }
    } else {
      switch (level) {
        case 'prohibited': return 'bg-red-100 text-red-800 border-red-300';
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'limited': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'minimal': return 'bg-green-100 text-green-800 border-green-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
      }
    }
  };

  const getRiskLevelIcon = (level: RiskLevel) => {
    if (isDarkMode) {
      switch (level) {
        case 'prohibited': return <AlertCircle className="h-8 w-8 text-red-400" />;
        case 'high': return <AlertCircle className="h-8 w-8 text-orange-400" />;
        case 'limited': return <Info className="h-8 w-8 text-yellow-400" />;
        case 'minimal': return <CheckCircle2 className="h-8 w-8 text-green-400" />;
        default: return <Info className="h-8 w-8 text-gray-400" />;
      }
    } else {
      switch (level) {
        case 'prohibited': return <AlertCircle className="h-8 w-8 text-red-600" />;
        case 'high': return <AlertCircle className="h-8 w-8 text-orange-600" />;
        case 'limited': return <Info className="h-8 w-8 text-yellow-600" />;
        case 'minimal': return <CheckCircle2 className="h-8 w-8 text-green-600" />;
        default: return <Info className="h-8 w-8 text-gray-600" />;
      }
    }
  };

  if (loading) {
    return (
      <>
        {lockModal}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading risk classification...</p>
          </div>
        </div>
      </>
    );
  }

  // Show result page if classification is complete
  if (showResult && classification) {
    return (
      <>
        {lockModal}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className={`p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {getRiskLevelIcon(classification.riskLevel)}
            </div>
            <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : ''}`}>Risk Classification Complete</h1>
            <div className={`inline-block px-6 py-3 rounded-lg border-2 text-xl font-semibold ${getRiskLevelColor(classification.riskLevel)}`}>
              {classification.riskLevel.toUpperCase()} RISK
            </div>
          </div>

          <div className={`border-t pt-6 mb-6 ${isDarkMode ? 'border-gray-700' : ''}`}>
            <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : ''}`}>Classification Summary</h2>
            <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{classification.rationale}</p>
          </div>

          {classification.prohibitedPractices.length > 0 && (
            <div className={`${isDarkMode ? 'bg-red-950/30 border-red-800' : 'bg-red-50 border-red-500'} border-l-4 p-4 mb-6`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>⚠️ Prohibited Practices Detected</h3>
              <ul className={`list-disc list-inside ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                {classification.prohibitedPractices.map((practice: string) => (
                  <li key={practice}>{practice}</li>
                ))}
              </ul>
              <p className={`mt-2 font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>This system cannot be deployed in the EU.</p>
            </div>
          )}

          {classification.applicableCategories.length > 0 && (
            <div className={`${isDarkMode ? 'bg-orange-950/30 border-orange-800' : 'bg-orange-50 border-orange-500'} border-l-4 p-4 mb-6`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>📋 Applicable High-Risk Categories</h3>
              <ul className={`list-disc list-inside ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                {classification.applicableCategories.map((cat: string) => (
                  <li key={cat}>{cat}</li>
                ))}
              </ul>
            </div>
          )}

          {classification.transparencyObligations.length > 0 && (
            <div className={`${isDarkMode ? 'bg-yellow-950/30 border-yellow-800' : 'bg-yellow-50 border-yellow-500'} border-l-4 p-4 mb-6`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>ℹ️ Transparency Obligations</h3>
              <ul className={`list-disc list-inside ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                {classification.transparencyObligations.map((obl: string) => (
                  <li key={obl}>{obl}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : ''}`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : ''}`}>Next Steps</h3>
            {classification.riskLevel === 'prohibited' && (
              <div className={isDarkMode ? 'text-red-300' : 'text-red-800'}>
                <p className="mb-2">Your AI system involves prohibited practices and cannot be deployed in the EU.</p>
                <p>Consider redesigning the system to remove prohibited practices.</p>
              </div>
            )}

            {classification.riskLevel === 'high' && (
              <div className={isDarkMode ? 'text-orange-300' : 'text-orange-800'}>
                <p className="mb-4">Your AI system is classified as high-risk. You must complete:</p>
                <ul className="list-decimal list-inside space-y-2 mb-4">
                  <li>Full Assessment (70 questions)</li>
                  <li>Compliance Controls Implementation (170 controls)</li>
                  <li>Conformity Assessment (Article 43)</li>
                  <li>CE Marking (Article 48)</li>
                  <li>EU Database Registration (Article 71)</li>
                  <li>Post-Market Monitoring (Article 72)</li>
                </ul>
                <Button
                  onClick={() => navigateWithLockRetention(`/dashboard/${useCaseId}/eu-ai-act`)}
                  className="w-full"
                >
                  Start Full Assessment
                </Button>
              </div>
            )}

            {classification.riskLevel === 'limited' && (
              <div className={isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}>
                <p className="mb-2">Your AI system requires transparency obligations only.</p>
                <p className="mb-4">Ensure users are informed about AI interaction, content generation, or biometric processing.</p>
                <Button
                  onClick={() => navigateWithLockRetention(`/dashboard/${useCaseId}/eu-ai-act`)}
                  variant="outline"
                  className="w-full"
                >
                  View Transparency Requirements
                </Button>
              </div>
            )}

            {classification.riskLevel === 'minimal' && (
              <div className={isDarkMode ? 'text-green-300' : 'text-green-800'}>
                <p className="mb-2">Your AI system is classified as minimal risk.</p>
                <p className="mb-4">No specific EU AI Act obligations apply, but voluntary codes of conduct are encouraged.</p>
                <Button
                  onClick={() => navigateWithLockRetention(`/dashboard/${useCaseId}/eu-ai-act`)}
                  variant="outline"
                  className="w-full"
                >
                  Return to EU AI Act
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                setShowResult(false);
                setCurrentStep(1);
              }}
              variant="ghost"
            >
              ← Revise Classification
            </Button>
          </div>
        </Card>
      </div>
      </>
    );
  }

  // Show wizard
  return (
    <>
      {lockModal}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="mb-4">
          <Button
            onClick={() => navigateWithLockRetention(`/dashboard/${useCaseId}/eu-ai-act`)}
            variant="ghost"
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to EU AI Act
          </Button>
        </div>

        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : ''}`}>EU AI Act Risk Classification</h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Complete this assessment to determine your AI system's risk level and compliance requirements (5-10 minutes)
        </p>
      </div>

      {lockError && (
        <div className={`mb-6 rounded-md border p-4 ${isDarkMode ? 'border-red-800 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-800'}`}>
          Failed to check lock status. Refresh the page or try again later.
        </div>
      )}

      {readOnlyBannerText && (
        <div className={`mb-6 rounded-md border p-4 whitespace-pre-line ${isDarkMode ? 'border-amber-800 bg-amber-950/30 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {readOnlyBannerText}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((step) => {
            // Check if step is completed (has answers for all questions in that step)
            const stepQuestions = RISK_CLASSIFICATION_QUESTIONS.filter(q => q.step === step);
            const isStepComplete = stepQuestions.every(q => {
              const answer = answers[q.id];
              return answer !== undefined && answer !== null && answer !== '' &&
                     (Array.isArray(answer) ? answer.length > 0 : true);
            });

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                      step < currentStep || (step === currentStep && isStepComplete)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : step === currentStep
                        ? isDarkMode
                          ? 'bg-gray-800 text-blue-400 border-blue-600'
                          : 'bg-white text-blue-600 border-blue-600'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-500 border-gray-600'
                          : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {step < currentStep || (step === currentStep && isStepComplete) ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      step
                    )}
                  </div>
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-sm mt-3">
          <span className={`text-center ${currentStep === 1 ? 'text-blue-600 font-medium' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Verification</span>
          <span className={`text-center ${currentStep === 2 ? 'text-blue-600 font-medium' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Prohibited</span>
          <span className={`text-center ${currentStep === 3 ? 'text-blue-600 font-medium' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>High-Risk</span>
          <span className={`text-center ${currentStep === 4 ? 'text-blue-600 font-medium' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Limited-Risk</span>
        </div>
      </div>

      {/* Questions Card */}
      <Card className={`p-8 mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : ''}`}>
            Step {currentStep} of {totalSteps}: {currentStepQuestions[0]?.stepTitle}
          </h2>
        </div>

        {currentStepQuestions.map((question) => (
          <div key={question.id} className="mb-8">
            <label className={`block text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : ''}`}>{question.question}</label>
            {question.description && (
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{question.description}</p>
            )}

            {question.answerType === 'multiple-choice' && question.options && (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-4 border-2 rounded-lg transition-all ${
                      answers[question.id] === option.value
                        ? isDarkMode 
                          ? 'border-blue-500 bg-blue-950/30' 
                          : 'border-blue-600 bg-blue-50'
                        : isDarkMode
                          ? 'border-gray-700 bg-gray-900/50 hover:border-blue-600'
                          : 'border-gray-200 hover:border-blue-300'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={answers[question.id] === option.value}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="mt-1 mr-3"
                      disabled={isReadOnly || saving}
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{option.label}</div>
                      {option.description && (
                        <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{option.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {question.answerType === 'checkbox-list' && question.options && (
              <div className="space-y-3">
                {question.options.map((option) => {
                  const currentAnswers = answers[question.id] || [];
                  const isChecked = currentAnswers.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`flex items-start p-4 border-2 rounded-lg transition-all ${
                        isChecked
                          ? isDarkMode 
                            ? 'border-blue-500 bg-blue-950/30' 
                            : 'border-blue-600 bg-blue-50'
                          : isDarkMode
                            ? 'border-gray-700 bg-gray-900/50 hover:border-blue-600'
                            : 'border-gray-200 hover:border-blue-300'
                      } ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isReadOnly || saving}
                        onChange={(e) => {
                          let newAnswers = [...currentAnswers];
                          if (e.target.checked) {
                            // Handle "none" option - clear all others
                            if (option.value === 'none') {
                              newAnswers = ['none'];
                            } else {
                              // Remove "none" if it was selected
                              newAnswers = newAnswers.filter(a => a !== 'none');
                              newAnswers.push(option.value);
                            }
                          } else {
                            newAnswers = newAnswers.filter(a => a !== option.value);
                          }
                          handleAnswerChange(question.id, newAnswers);
                        }}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{option.label}</div>
                        {option.description && (
                          <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{option.description}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          variant="outline"
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={isReadOnly || !canProceed() || saving || lockLoading}
        >
          {currentStep === totalSteps ? (
            saving ? 'Completing...' : 'Complete Classification'
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
    </>
  );
}
