'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Clock, Upload, Save, ChevronRight, ChevronDown, HelpCircle, Shield, ListChecks, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/file-upload';
import { useGovernanceLock } from '@/hooks/useGovernanceLock';
import { GovernanceLockModal } from '@/components/GovernanceLockModal';
import { checkAssessmentGate, getRiskLevelBadgeColor } from '@/lib/eu-ai-act-gate';

interface Question {
  id: string;
  questionId: string;
  question: string;
  priority: string;
  answerType: string;
  orderIndex: number;
  answer?: {
    id: string;
    answer: string;
    evidenceFiles: string[];
    status: string;
  };
}

interface Subtopic {
  id: string;
  subtopicId: string;
  title: string;
  description: string;
  orderIndex: number;
  questions: Question[];
}

interface Topic {
  id: string;
  topicId: string;
  title: string;
  description: string;
  orderIndex: number;
  subtopics: Subtopic[];
}

interface Control {
  id: string;
  status: string;
  notes: string;
  evidenceFiles: string[];
  controlStruct: {
    controlId: string;
    title: string;
    description: string;
    category: {
      title: string;
    };
  };
  subcontrols: Subcontrol[];
}

interface Subcontrol {
  id: string;
  status: string;
  notes: string;
  evidenceFiles: string[];
  subcontrolStruct: {
    subcontrolId: string;
    title: string;
    description: string;
  };
}

interface ControlCategory {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  orderIndex: number;
  controls: {
    id: string;
    controlId: string;
    title: string;
    description: string;
    orderIndex: number;
    subcontrols: {
      id: string;
      subcontrolId: string;
      title: string;
      description: string;
      orderIndex: number;
    }[];
  }[];
}

interface Assessment {
  id: string;
  useCaseId: string;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  // Risk Classification Fields
  riskClassificationCompleted: boolean;
  riskLevel: string | null;
  riskLevelRationale: string | null;
  applicableAnnexCategories: string[];
  hasProhibitedPractices: boolean;
  prohibitedPracticesList: string[];
  isSubjectToAct: boolean | null;
  classificationDate: string | null;
  controls?: Control[];
  answers?: {
    id: string;
    questionId: string;
    answer: string;
    evidenceFiles: string[];
    status: string;
  }[];
}

export default function EuAiActAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const useCaseId = params.useCaseId as string;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [controlCategories, setControlCategories] = useState<ControlCategory[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'controls'>('assessment');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // Lock management system
  const {
    lockInfo,
    isLocked,
    canEdit,
    acquireLock,
    releaseLock,
    refreshLockStatus,
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

  useEffect(() => {
    fetchAssessmentData();
  }, [useCaseId]);

  // Lock management effects
  useEffect(() => {
    console.log('🔒 Lock management effect:', { 
      lockInfo, 
      canEdit, 
      lockLoading, 
      isLockModalOpen,
      lockDetails: lockInfo?.lockDetails,
      isOwnedByCurrentUser: lockInfo?.lockDetails?.isOwnedByCurrentUser
    });
    
    // Show lock modal if user doesn't have edit access
    if (lockInfo && !canEdit && !lockLoading) {
      console.log('🔒 Showing lock modal - user cannot edit');
      setIsLockModalOpen(true);
    }
    
    // Auto-acquire lock if user can edit but doesn't have a lock
    if (lockInfo && canEdit && !lockInfo.hasLock && !lockLoading) {
      console.log('🔒 Auto-acquiring lock for user');
      handleStartAssessment();
    }
    
    // Note: We don't auto-close the modal when user has edit access
    // because they might have manually opened it to see lock info
  }, [lockInfo, canEdit, lockLoading]);

  // Auto-refresh lock status
  useEffect(() => {
    if (useCaseId) {
      const interval = setInterval(() => {
        refreshLockStatus();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [useCaseId, refreshLockStatus]);

  // Monitor assessment state changes for debugging
  useEffect(() => {
    if (assessment) {
      console.log('ASSESSMENT STATE CHANGED:', {
        totalControls: assessment.controls?.length || 0,
        controlsWithFiles: assessment.controls?.filter(c => c.evidenceFiles?.length > 0).length || 0,
        controlIds: assessment.controls?.map(c => c.controlStruct?.controlId) || [],
        detailedControls: assessment.controls?.map(c => ({
          id: c.id,
          controlId: c.controlStruct?.controlId,
          evidenceFilesCount: c.evidenceFiles?.length || 0,
          evidenceFiles: c.evidenceFiles || []
        })) || []
      });
    }
  }, [assessment]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!useCaseId) {
        setError('Use case ID is missing. Please navigate from the dashboard.');
        setLoading(false);
        return;
      }

      console.log('EU AI Act - Fetching assessment data for useCaseId:', useCaseId);
      
      const [topicsResponse, controlCategoriesResponse, assessmentResponse] = await Promise.all([
        fetch('/api/eu-ai-act/topics', { cache: 'no-store' }),
        fetch('/api/eu-ai-act/control-categories', { cache: 'no-store' }),
        fetch(`/api/eu-ai-act/assessment/by-usecase/${useCaseId}`, { cache: 'no-store' })
      ]);

      console.log('EU AI Act - API responses:', {
        topics: topicsResponse.status,
        controlCategories: controlCategoriesResponse.status,
        assessment: assessmentResponse.status
      });

      // Handle topics response
      if (!topicsResponse.ok) {
        const errorData = await topicsResponse.json().catch(() => ({ error: 'Failed to fetch topics' }));
        throw new Error(`Failed to fetch topics: ${errorData.error || topicsResponse.statusText}`);
      }

      // Handle control categories response
      if (!controlCategoriesResponse.ok) {
        const errorData = await controlCategoriesResponse.json().catch(() => ({ error: 'Failed to fetch control categories' }));
        throw new Error(`Failed to fetch control categories: ${errorData.error || controlCategoriesResponse.statusText}`);
      }

      // Handle assessment response separately to provide better error messages
      if (!assessmentResponse.ok) {
        const errorData = await assessmentResponse.json().catch(() => ({ error: 'Failed to fetch assessment' }));
        
        console.error('EU AI Act - Assessment API error:', {
          status: assessmentResponse.status,
          statusText: assessmentResponse.statusText,
          errorData
        });
        
        if (assessmentResponse.status === 403) {
          setError(`Access denied: ${errorData.error || 'You do not have permission to access this assessment'}`);
          setLoading(false);
          return;
        } else if (assessmentResponse.status === 404) {
          setError(`Use case not found: ${errorData.message || errorData.error || 'The use case does not exist or you do not have access to it'}`);
          setLoading(false);
          return;
        } else {
          throw new Error(`API Error (${assessmentResponse.status}): ${errorData.error || errorData.message || 'Failed to fetch assessment data'}`);
        }
      }

      const topicsData = await topicsResponse.json();
      const controlCategoriesData = await controlCategoriesResponse.json();
      const assessmentData = await assessmentResponse.json();

      // Check if framework tables are available
      if (topicsData.length === 0 && controlCategoriesData.length === 0) {
        setError('EU AI ACT framework tables need to be set up. Please run the database setup scripts to enable full functionality.');
        setLoading(false);
        return;
      }
      
      // If assessment is not available, it means the use case doesn't exist
      if (assessmentData.status === 'not_available') {
        setError('Use case not found. Please ensure you are accessing a valid use case from the dashboard.');
        setLoading(false);
        return;
      }

      // Check if we need to redirect to risk classification
      const gateCheck = checkAssessmentGate(assessmentData);
      if (gateCheck.shouldRedirectToClassification) {
        console.log('🚪 Redirecting to risk classification - not yet completed');
        navigateWithLockRetention(`/dashboard/${useCaseId}/eu-ai-act/risk-classification`);
        return;
      }

      // Merge saved answers from assessment into topics structure (O(n) with Map)
      const answerByQuestionId = new Map<string, any>();
      if (Array.isArray(assessmentData.answers)) {
        for (const ans of assessmentData.answers) {
          if (ans?.questionId) answerByQuestionId.set(ans.questionId, ans);
        }
      }

      const topicsWithAnswers = topicsData.map((topic: Topic) => ({
        ...topic,
        subtopics: topic.subtopics.map((subtopic: Subtopic) => ({
          ...subtopic,
          questions: subtopic.questions.map((question: Question) => {
            const savedAnswer = answerByQuestionId.get(question.questionId);
            return {
              ...question,
              answer: savedAnswer
                ? {
                    id: savedAnswer.id,
                    answer: savedAnswer.answer || '',
                    evidenceFiles: savedAnswer.evidenceFiles || [],
                    status: savedAnswer.status || 'pending',
                  }
                : undefined,
            };
          }),
        })),
      }));

      setTopics(topicsWithAnswers);
      setControlCategories(controlCategoriesData);
      
      console.log('INITIAL DATA LOAD - Assessment controls:', {
        totalControls: assessmentData.controls?.length || 0,
        controlsWithFiles: assessmentData.controls?.filter((c: any) => c.evidenceFiles?.length > 0).length || 0,
        sampleControl: assessmentData.controls?.[0] ? {
          id: assessmentData.controls[0].id,
          controlId: assessmentData.controls[0].controlStruct?.controlId,
          evidenceFiles: assessmentData.controls[0].evidenceFiles
        } : null
      });
      
      setAssessment(assessmentData);

      // Expand first topic by default
      if (topicsWithAnswers.length > 0) {
        setExpandedTopics(new Set([topicsWithAnswers[0].topicId]));
        if (topicsWithAnswers[0].subtopics.length > 0) {
          setExpandedSubtopics(new Set([topicsWithAnswers[0].subtopics[0].subtopicId]));
        }
      }

      // Expand first control category by default
      if (controlCategoriesData.length > 0) {
        setExpandedCategories(new Set([controlCategoriesData[0].categoryId]));
      }
    } catch (err) {
      console.error('EU AI Act - Error fetching assessment data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching assessment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    console.log('🔒 handleAnswerChange called:', { questionId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing answer change');
      return; // Prevent changes if user doesn't have edit access
    }
    
    setTopics(prevTopics => 
      prevTopics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(subtopic => ({
          ...subtopic,
          questions: subtopic.questions.map(question => 
            question.questionId === questionId 
              ? { 
                  ...question, 
                  answer: { 
                    ...question.answer,
                    id: question.answer?.id || '',
                    answer,
                    evidenceFiles: question.answer?.evidenceFiles || [],
                    status: answer.trim() ? 'completed' : 'pending'
                  }
                }
              : question
          )
        }))
      }))
    );
  };

  const handleEvidenceChange = async (questionId: string, evidenceFiles: string[]) => {
    // Find the current question to detect removed files
    const currentQuestion = findQuestionById(questionId);
    const currentFiles = currentQuestion?.answer?.evidenceFiles || [];
    const removedFiles = currentFiles.filter(file => !evidenceFiles.includes(file));
    
    // Update local state immediately
    setTopics(prevTopics => 
      prevTopics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(subtopic => ({
          ...subtopic,
          questions: subtopic.questions.map(question => 
            question.questionId === questionId 
              ? { 
                  ...question, 
                  answer: { 
                    ...question.answer,
                    id: question.answer?.id || '',
                    answer: question.answer?.answer || '',
                    evidenceFiles,
                    status: (question.answer?.answer?.trim() || evidenceFiles.length > 0) ? 'completed' : 'pending'
                  }
                }
              : question
          )
        }))
      }))
    );

    // Auto-save the evidence files
    if (assessment) {
      // Add to saving set
      setSavingFiles(prev => new Set(prev).add(`question-${questionId}`));
      
      try {
        const question = findQuestionById(questionId);
        const response = await fetch(`/api/eu-ai-act/answer/${assessment.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            answer: question?.answer?.answer || '',
            evidenceFiles
          }),
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to save evidence files');
        }

        await updateAssessmentProgress();
        
        // Delete removed files from server
        for (const removedFile of removedFiles) {
          try {
            await fetch('/api/upload/delete', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileUrl: removedFile }),
              cache: 'no-store'
            });
          } catch (fileDeleteErr) {
            console.error('Failed to delete file from server:', removedFile, fileDeleteErr);
            // Don't fail the whole operation if file deletion fails
          }
        }
        
        // Clear any existing errors on successful save
        if (error) {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to auto-save evidence files:', err);
        setError('Failed to save evidence files. Please try saving manually.');
      } finally {
        // Remove from saving set
        setSavingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(`question-${questionId}`);
          return newSet;
        });
      }
    }
  };

  const handleSaveAnswer = async (questionId: string) => {
    const question = findQuestionById(questionId);
    if (!question || !assessment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/eu-ai-act/answer/${assessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer: question.answer?.answer || '',
          evidenceFiles: question.answer?.evidenceFiles || []
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to save answer');
      }

      const savedAnswer = await response.json();
      setTopics(prevTopics => 
        prevTopics.map(topic => ({
          ...topic,
          subtopics: topic.subtopics.map(subtopic => ({
            ...subtopic,
            questions: subtopic.questions.map(q => 
              q.questionId === questionId 
                ? { ...q, answer: savedAnswer }
                : q
            )
          }))
        }))
      );

      await updateAssessmentProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answer');
    } finally {
      setSaving(false);
    }
  };

  // Lock management functions
  const handleStartAssessment = async () => {
    const success = await acquireLock();
    if (success) {
      setIsLockModalOpen(false);
      // Lock acquired successfully, user can now edit
    }
    return success;
  };

  const handleCloseLockModal = async () => {
    console.log('🔒 [EU-AI-ACT] handleCloseLockModal called, checking lock status...');
    console.log('🔒 [EU-AI-ACT] canEdit:', canEdit, 'lockInfo:', lockInfo);
    
    try {
      // Release lock if we have one
      if (lockInfo?.hasLock && canEdit) {
        console.log('🔒 [EU-AI-ACT] Releasing EXCLUSIVE lock before closing modal...');
        await releaseLock();
        console.log('🔒 [EU-AI-ACT] Lock released successfully');
      } else {
        console.log('🔒 [EU-AI-ACT] No exclusive lock to release');
      }
      
      setIsLockModalOpen(false);
      
      // If user can't edit, redirect back to governance dashboard
      if (!canEdit) {
        console.log('🔒 [EU-AI-ACT] Navigating back to governance dashboard...');
        router.push('/dashboard/governance');
      }
      // If user can edit, they can continue working on the assessment
      // The modal will close and they can continue editing
    } catch (error) {
      console.error('🔒 [EU-AI-ACT] Error releasing lock during modal close:', error);
      // Close modal and navigate anyway even if lock release fails
      setIsLockModalOpen(false);
      if (!canEdit) {
        router.push('/dashboard/governance');
      }
    }
  };

  const handleContinueEditing = () => {
    setIsLockModalOpen(false);
    // User wants to continue editing, just close the modal
    // They already have edit access, so they can continue working
  };

  const handleReleaseLock = async () => {
    console.log('🔒 handleReleaseLock called, releasing lock...');
    try {
      await releaseLock();
      console.log('🔒 Lock released successfully');
      
      // Refresh lock status after release
      await refreshLockStatus();
      
      // Close modal if it's open
      if (isLockModalOpen) {
        setIsLockModalOpen(false);
      }
      
      console.log('🔒 Lock release process completed');
    } catch (error) {
      console.error('🔒 Failed to release lock:', error);
    }
  };

  const updateAssessmentProgress = async () => {
    const totalQuestions = topics.reduce((total, topic) => 
      total + topic.subtopics.reduce((subTotal, subtopic) => 
        subTotal + subtopic.questions.length, 0), 0);
    
    const answeredQuestions = topics.reduce((total, topic) => 
      total + topic.subtopics.reduce((subTotal, subtopic) => 
        subTotal + subtopic.questions.filter(q => q.answer?.answer?.trim()).length, 0), 0);

    const totalControls = controlCategories.reduce((total, category) => 
      total + category.controls.reduce((controlTotal, control) => 
        controlTotal + 1 + control.subcontrols.length, 0), 0);
    
    const implementedControls = assessment?.controls?.reduce((total, control) => {
      let count = 0;
      if (control.status === 'implemented' || control.status === 'reviewed') count++;
      count += control.subcontrols?.filter(sc => sc.status === 'implemented' || sc.status === 'reviewed').length || 0;
      return total + count;
    }, 0) || 0;

    const totalItems = totalQuestions + totalControls;
    const completedItems = answeredQuestions + implementedControls;
    
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    console.log('Progress Calculation:', {
      totalQuestions,
      answeredQuestions,
      totalControls,
      implementedControls,
      totalItems,
      completedItems,
      progress: Math.round(progress)
    });

    try {
      await fetch(`/api/eu-ai-act/assessment/${assessment?.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
        cache: 'no-store'
      });

      setAssessment(currentAssessment => {
        if (!currentAssessment) return currentAssessment;
        return { ...currentAssessment, progress };
      });
      
      // Force refresh governance dashboard if it's open
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('governance-refresh'));
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const findQuestionById = (questionId: string): Question | null => {
    for (const topic of topics) {
      for (const subtopic of topic.subtopics) {
        const question = subtopic.questions.find(q => q.questionId === questionId);
        if (question) return question;
      }
    }
    return null;
  };

  const toggleTopic = (topicId: string) => {
    if (expandedTopics.has(topicId)) {
      // If clicking on an open topic, close it
      setExpandedTopics(new Set());
    } else {
      // If clicking on a closed topic, close all others and open this one
      setExpandedTopics(new Set([topicId]));
      
      // Scroll to the topic after state update
      setTimeout(() => {
        const element = document.getElementById(`topic-${topicId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  const toggleSubtopic = (subtopicId: string) => {
    if (expandedSubtopics.has(subtopicId)) {
      // If clicking on an open subtopic, close it
      setExpandedSubtopics(new Set());
    } else {
      // If clicking on a closed subtopic, close all others and open this one
      setExpandedSubtopics(new Set([subtopicId]));
      
      // Scroll to the subtopic after state update
      setTimeout(() => {
        const element = document.getElementById(`subtopic-${subtopicId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.has(categoryId)) {
      // If clicking on an open category, close it
      setExpandedCategories(new Set());
    } else {
      // If clicking on a closed category, close all others and open this one
      setExpandedCategories(new Set([categoryId]));
      
      // Scroll to the category after state update
      setTimeout(() => {
        const element = document.getElementById(`category-${categoryId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  const handleControlStatusChange = (controlId: string, status: string, notes: string) => {
    if (!assessment) return;

    // Find existing control or create a new one in state
    const existingControl = assessment.controls?.find(c => c.controlStruct.controlId === controlId);
    
    if (existingControl) {
      // Update existing control
      const updatedControls = assessment.controls?.map(control => 
        control.controlStruct.controlId === controlId 
          ? { ...control, status, notes }
          : control
      ) || [];
      setAssessment({ ...assessment, controls: updatedControls });
    } else {
      // Create new control in state (will be saved to DB when user clicks save)
      const newControl = {
        id: `temp-${controlId}`,
        status,
        notes,
        evidenceFiles: [],
        controlStruct: {
          controlId,
          title: '',
          description: '',
          category: {
            title: ''
          }
        },
        subcontrols: []
      };
      setAssessment({ 
        ...assessment, 
        controls: [...(assessment.controls || []), newControl] 
      });
    }
  };

  const handleSubcontrolStatusChange = (controlId: string, subcontrolId: string, status: string, notes: string) => {
    if (!assessment) return;

    // Find existing control
    const existingControl = assessment.controls?.find(c => c.controlStruct.controlId === controlId);
    
    if (existingControl) {
      // Find existing subcontrol or create a new one
      const existingSubcontrol = existingControl.subcontrols?.find(sc => sc.subcontrolStruct.subcontrolId === subcontrolId);
      
      if (existingSubcontrol) {
        // Update existing subcontrol
        const updatedControls = assessment.controls?.map(control => 
          control.controlStruct.controlId === controlId 
            ? { 
                ...control, 
                subcontrols: control.subcontrols?.map(subcontrol => 
                  subcontrol.subcontrolStruct.subcontrolId === subcontrolId
                    ? { ...subcontrol, status, notes }
                    : subcontrol
                ) || []
              }
            : control
        ) || [];
        setAssessment({ ...assessment, controls: updatedControls });
      } else {
        // Create new subcontrol in state
        const newSubcontrol = {
          id: `temp-${subcontrolId}`,
          status,
          notes,
          evidenceFiles: [],
          subcontrolStruct: {
            subcontrolId,
            title: '',
            description: ''
          }
        };
        const updatedControls = assessment.controls?.map(control => 
          control.controlStruct.controlId === controlId 
            ? { 
                ...control, 
                subcontrols: [...(control.subcontrols || []), newSubcontrol] 
              }
            : control
        ) || [];
        setAssessment({ ...assessment, controls: updatedControls });
      }
    }
  };

  const handleControlEvidenceChange = async (controlId: string, evidenceFiles: string[]) => {
    console.log('handleControlEvidenceChange START:', { controlId, evidenceFiles });
    if (!assessment) return;

    const existingControl = assessment.controls?.find(c => c.controlStruct.controlId === controlId);
    const currentFiles = existingControl?.evidenceFiles || [];
    const removedFiles = currentFiles.filter(file => !evidenceFiles.includes(file));
    
    console.log('Control state before update:', {
      existingControl: existingControl ? {
        id: existingControl.id,
        controlId: existingControl.controlStruct?.controlId,
        evidenceFiles: existingControl.evidenceFiles
      } : null,
      currentFiles,
      newFiles: evidenceFiles,
      removedFiles
    });
    
    // Update local state immediately for better UX with forced re-render
    setAssessment(prevAssessment => {
      if (!prevAssessment) return prevAssessment;
      
      const existingControlIndex = prevAssessment.controls?.findIndex(c => c.controlStruct?.controlId === controlId) ?? -1;
      
      if (existingControlIndex >= 0) {
        // Update existing control
        const updatedControls = [...(prevAssessment.controls || [])];
        updatedControls[existingControlIndex] = {
          ...updatedControls[existingControlIndex],
          evidenceFiles: [...evidenceFiles] // Ensure new array reference
        };
        
        console.log('State Update - existing control:', {
          controlId,
          controlIndex: existingControlIndex,
          newFiles: evidenceFiles,
          updatedControl: updatedControls[existingControlIndex]
        });
        
        return {
          ...prevAssessment,
          controls: updatedControls,
          // Add timestamp to force re-render
          lastUpdated: Date.now()
        };
      } else {
        // Create new control
        const newControl = {
          id: `temp-${controlId}`,
          status: 'pending',
          notes: '',
          evidenceFiles: [...evidenceFiles], // Ensure new array reference
          controlStruct: {
            controlId,
            title: '',
            description: '',
            category: { title: '' }
          },
          subcontrols: []
        };
        
        console.log('State Update - new control:', {
          controlId,
          newControl,
          evidenceFiles
        });
        
        return {
          ...prevAssessment,
          controls: [...(prevAssessment.controls || []), newControl],
          // Add timestamp to force re-render
          lastUpdated: Date.now()
        };
      }
    });

    // Auto-save the evidence files
    setSavingFiles(prev => new Set(prev).add(`control-${controlId}`));
    
    try {
      const response = await fetch(`/api/eu-ai-act/control/${assessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlId,
          status: existingControl?.status || 'pending',
          notes: existingControl?.notes || '',
          evidenceFiles
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save control evidence files');
      }

      const savedControl = await response.json();
      console.log('API Response - savedControl:', {
        id: savedControl.id,
        controlId: savedControl.controlStruct?.controlId,
        evidenceFiles: savedControl.evidenceFiles,
        subcontrols: savedControl.subcontrols?.length || 0
      });
      
      // Update the local state with the saved control using functional update to avoid stale closure
      setAssessment(currentAssessment => {
        if (!currentAssessment) return currentAssessment;
        
        const controlExists = currentAssessment.controls?.some(c => c.controlStruct?.controlId === controlId);
        let updatedControls: typeof currentAssessment.controls;
        
        if (controlExists) {
          // Update existing control - merge with existing data to preserve any fields not in API response
          updatedControls = currentAssessment.controls?.map(control => 
            control.controlStruct?.controlId === controlId 
              ? {
                  ...control, // Preserve existing control data
                  ...savedControl, // Overlay API response
                  controlStruct: control.controlStruct // Preserve the original controlStruct
                }
              : control
          ) || [];
        } else {
          // Add new control
          updatedControls = [...(currentAssessment.controls || []), savedControl];
        }
        
        console.log('API State update - merging with current state:', {
          controlId,
          savedControlFiles: savedControl.evidenceFiles,
          currentControlsCount: currentAssessment.controls?.length || 0,
          updatedControlsCount: updatedControls.length,
          finalControlFiles: updatedControls.find(c => c.controlStruct?.controlId === controlId)?.evidenceFiles
        });
        
        return {
          ...currentAssessment,
          controls: updatedControls,
          lastUpdated: Date.now()
        };
      });
      
      await updateAssessmentProgress();
      
      // Delete removed files from server
      for (const removedFile of removedFiles) {
        try {
          await fetch('/api/upload/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: removedFile }),
            cache: 'no-store'
          });
        } catch (fileDeleteErr) {
          console.error('Failed to delete file from server:', removedFile, fileDeleteErr);
          // Don't fail the whole operation if file deletion fails
        }
      }
      
      
      // Clear any existing errors on successful save
      if (error) {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to auto-save control evidence:', err);
      setError('Failed to save evidence files. Please try saving manually.');
      
      // Revert local state on API failure
      setAssessment(prevAssessment => {
        if (!prevAssessment) return prevAssessment;
        
        if (existingControl) {
          const revertedControls = prevAssessment.controls?.map(control => 
            control.controlStruct.controlId === controlId 
              ? { ...control, evidenceFiles: [...currentFiles] }
              : control
          ) || [];
          return { ...prevAssessment, controls: revertedControls, lastUpdated: Date.now() };
        } else {
          // Remove the temporary control we added
          const revertedControls = prevAssessment.controls?.filter(c => 
            !(c.id === `temp-${controlId}` && c.controlStruct.controlId === controlId)
          ) || [];
          return { ...prevAssessment, controls: revertedControls, lastUpdated: Date.now() };
        }
      });
    } finally {
      setSavingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(`control-${controlId}`);
        return newSet;
      });
    }
  };

  const handleSubcontrolEvidenceChange = async (controlId: string, subcontrolId: string, evidenceFiles: string[]) => {
    if (!assessment) return;

    const existingControl = assessment.controls?.find(c => c.controlStruct.controlId === controlId);
    const existingSubcontrol = existingControl?.subcontrols?.find(sc => sc.subcontrolStruct.subcontrolId === subcontrolId);
    const currentFiles = existingSubcontrol?.evidenceFiles || [];
    const removedFiles = currentFiles.filter(file => !evidenceFiles.includes(file));
    
    if (existingControl) {
      // Update local state immediately with forced re-render
      setAssessment(prevAssessment => {
        if (!prevAssessment) return prevAssessment;
        
        const controlIndex = prevAssessment.controls?.findIndex(c => c.controlStruct?.controlId === controlId) ?? -1;
        if (controlIndex < 0) return prevAssessment;
        
        const updatedControls = [...(prevAssessment.controls || [])];
        const targetControl = updatedControls[controlIndex];
        
        if (existingSubcontrol) {
          // Update existing subcontrol
          const subcontrolIndex = targetControl.subcontrols?.findIndex(sc => sc.subcontrolStruct?.subcontrolId === subcontrolId) ?? -1;
          if (subcontrolIndex >= 0) {
            const updatedSubcontrols = [...(targetControl.subcontrols || [])];
            updatedSubcontrols[subcontrolIndex] = {
              ...updatedSubcontrols[subcontrolIndex],
              evidenceFiles: [...evidenceFiles] // Ensure new array reference
            };
            
            updatedControls[controlIndex] = {
              ...targetControl,
              subcontrols: updatedSubcontrols
            };
            
                    console.log('State Update - existing subcontrol:', {
          controlId,
          subcontrolId,
          subcontrolIndex,
          newFiles: evidenceFiles
        });
          }
        } else {
          // Create new subcontrol with evidence files
          const newSubcontrol = {
            id: `temp-${subcontrolId}`,
            status: 'pending',
            notes: '',
            evidenceFiles: [...evidenceFiles], // Ensure new array reference
            subcontrolStruct: {
              subcontrolId,
              title: '',
              description: ''
            }
          };
          
          updatedControls[controlIndex] = {
            ...targetControl,
            subcontrols: [...(targetControl.subcontrols || []), newSubcontrol]
          };
          
                  console.log('State Update - new subcontrol:', {
          controlId,
          subcontrolId,
          newSubcontrol,
          evidenceFiles
        });
        }
        
        return {
          ...prevAssessment,
          controls: updatedControls,
          // Add timestamp to force re-render
          lastUpdated: Date.now()
        };
      });

      // Auto-save the subcontrol evidence files
      setSavingFiles(prev => new Set(prev).add(`subcontrol-${subcontrolId}`));
      
      try {
        // First ensure the parent control exists and is saved
        if (!existingControl.id.startsWith('temp-')) {
          const response = await fetch(`/api/eu-ai-act/subcontrol/${assessment.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              controlId: existingControl.controlStruct.controlId, // Use structural controlId, not DB ID
              subcontrolId,
              status: existingSubcontrol?.status || 'pending',
              notes: existingSubcontrol?.notes || '',
              evidenceFiles
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save subcontrol evidence files');
          }

          const savedSubcontrol = await response.json();

          // Update the control with the saved subcontrol using functional update
          setAssessment(currentAssessment => {
            if (!currentAssessment) return currentAssessment;
            
            const updatedControls = currentAssessment.controls?.map(control => 
              control.controlStruct?.controlId === existingControl.controlStruct.controlId 
                ? {
                    ...control,
                    subcontrols: [
                      ...(control.subcontrols?.filter(sc => sc.subcontrolStruct?.subcontrolId !== subcontrolId) || []),
                      savedSubcontrol
                    ]
                  }
                : control
            ) || [];
            
                    console.log('API Subcontrol update - merging with current state:', {
          controlId,
          subcontrolId,
          savedSubcontrolFiles: savedSubcontrol.evidenceFiles
        });
            
            return {
              ...currentAssessment,
              controls: updatedControls,
              lastUpdated: Date.now()
            };
          });

          await updateAssessmentProgress();
          
          // Delete removed files from server
          for (const removedFile of removedFiles) {
            try {
              await fetch('/api/upload/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: removedFile })
              });
            } catch (fileDeleteErr) {
              console.error('Failed to delete file from server:', removedFile, fileDeleteErr);
              // Don't fail the whole operation if file deletion fails
            }
          }
          
          // Clear any existing errors on successful save
          if (error) {
            setError(null);
          }
        } else {
          // If parent control is not saved yet, save it first
          const controlResponse = await fetch(`/api/eu-ai-act/control/${assessment.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              controlId: existingControl.controlStruct.controlId,
              status: existingControl.status || 'pending',
              notes: existingControl.notes || '',
              evidenceFiles: existingControl.evidenceFiles || []
            }),
            cache: 'no-store'
          });

          if (!controlResponse.ok) {
            throw new Error('Failed to save parent control');
          }

          const savedControl = await controlResponse.json();
          
          // Now save the subcontrol
          const subcontrolResponse = await fetch(`/api/eu-ai-act/subcontrol/${assessment.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              controlId: existingControl.controlStruct.controlId,
              subcontrolId,
              status: existingSubcontrol?.status || 'pending',
              notes: existingSubcontrol?.notes || '',
              evidenceFiles
            })
          });

          if (!subcontrolResponse.ok) {
            throw new Error('Failed to save subcontrol evidence files');
          }

          const savedSubcontrol = await subcontrolResponse.json();

          // Update the assessment with the saved control that includes the subcontrol using functional update
          setAssessment(currentAssessment => {
            if (!currentAssessment) return currentAssessment;
            
            const controlWithSubcontrol = {
              ...savedControl,
              subcontrols: [
                ...(savedControl.subcontrols || []).filter((sc: any) => sc.subcontrolStruct?.subcontrolId !== subcontrolId),
                savedSubcontrol
              ]
            };
            
            const updatedControls = currentAssessment.controls?.filter(c => c.controlStruct?.controlId !== existingControl.controlStruct.controlId) || [];
            updatedControls.push(controlWithSubcontrol);
            
                    console.log('API New Subcontrol update - merging with current state:', {
          controlId,
          subcontrolId,
          savedSubcontrolFiles: savedSubcontrol.evidenceFiles
        });
            
            return {
              ...currentAssessment,
              controls: updatedControls,
              lastUpdated: Date.now()
            };
          });

          await updateAssessmentProgress();
          
          // Delete removed files from server
          for (const removedFile of removedFiles) {
            try {
              await fetch('/api/upload/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: removedFile })
              });
            } catch (fileDeleteErr) {
              console.error('Failed to delete file from server:', removedFile, fileDeleteErr);
              // Don't fail the whole operation if file deletion fails
            }
          }
          
          // Clear any existing errors on successful save
          if (error) {
            setError(null);
          }
        }
      } catch (err) {
        console.error('Failed to auto-save subcontrol evidence:', err);
        setError('Failed to save evidence files. Please try saving manually.');
        
        // Revert local state on API failure
        setAssessment(prevAssessment => {
          if (!prevAssessment) return prevAssessment;
          
          if (existingSubcontrol) {
            const revertedControls = prevAssessment.controls?.map(control => 
              control.controlStruct.controlId === controlId 
                ? { 
                    ...control, 
                    subcontrols: control.subcontrols?.map(subcontrol => 
                      subcontrol.subcontrolStruct.subcontrolId === subcontrolId
                        ? { ...subcontrol, evidenceFiles: [...currentFiles] }
                        : subcontrol
                    ) || []
                  }
                : control
            ) || [];
            return { ...prevAssessment, controls: revertedControls, lastUpdated: Date.now() };
          } else {
            // Remove the temporary subcontrol we added
            const revertedControls = prevAssessment.controls?.map(control => 
              control.controlStruct.controlId === controlId 
                ? { 
                    ...control, 
                    subcontrols: control.subcontrols?.filter(sc => 
                      !(sc.id === `temp-${subcontrolId}` && sc.subcontrolStruct.subcontrolId === subcontrolId)
                    ) || []
                  }
                : control
            ) || [];
            return { ...prevAssessment, controls: revertedControls, lastUpdated: Date.now() };
          }
        });
      } finally {
        setSavingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(`subcontrol-${subcontrolId}`);
          return newSet;
        });
      }
    }
  };

  const handleSaveControl = async (controlId: string) => {
    const control = assessment?.controls?.find(c => c.controlStruct.controlId === controlId);
    if (!control || !assessment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/eu-ai-act/control/${assessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlId,
          status: control.status,
          notes: control.notes,
          evidenceFiles: control.evidenceFiles
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to save control');
      }

      const savedControl = await response.json();

      // Update the local state with the saved control
      const updatedControls = assessment.controls?.map(control => 
        control.controlStruct?.controlId === controlId 
          ? savedControl
          : control
      ) || [];
      
      // If this is a new control, add it
      if (!assessment.controls?.some(c => c.controlStruct?.controlId === controlId)) {
        updatedControls.push(savedControl);
      }
      
      setAssessment({ ...assessment, controls: updatedControls });

      await updateAssessmentProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save control');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubcontrol = async (controlId: string, subcontrolId: string) => {
    const control = assessment?.controls?.find(c => c.controlStruct.controlId === controlId);
    const subcontrol = control?.subcontrols?.find(sc => sc.subcontrolStruct.subcontrolId === subcontrolId);
    if (!subcontrol || !assessment || !control) return;

    setSaving(true);
    try {
      // First ensure the parent control is saved if it's temporary
      if (control.id.startsWith('temp-')) {
        const controlResponse = await fetch(`/api/eu-ai-act/control/${assessment.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlId: control.controlStruct.controlId,
            status: control.status || 'pending',
            notes: control.notes || '',
            evidenceFiles: control.evidenceFiles || []
          }),
          cache: 'no-store'
        });

        if (!controlResponse.ok) {
          throw new Error('Failed to save parent control');
        }

        const savedControl = await controlResponse.json();
        
        // Update the assessment with the saved control
        const updatedControls = assessment.controls?.filter(c => c.controlStruct.controlId !== controlId) || [];
        updatedControls.push(savedControl);
        setAssessment({ ...assessment, controls: updatedControls });
      }

      const response = await fetch(`/api/eu-ai-act/subcontrol/${assessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlId: controlId, // Use structural controlId
          subcontrolId,
          status: subcontrol.status,
          notes: subcontrol.notes,
          evidenceFiles: subcontrol.evidenceFiles
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subcontrol');
      }

      const savedSubcontrol = await response.json();

      // Update the control with the saved subcontrol using functional update
      setAssessment(currentAssessment => {
        if (!currentAssessment) return currentAssessment;
        
        const updatedControls = currentAssessment.controls?.map(control => 
          control.controlStruct?.controlId === controlId 
            ? {
                ...control,
                subcontrols: [
                  ...(control.subcontrols?.filter(sc => sc.subcontrolStruct?.subcontrolId !== subcontrolId) || []),
                  savedSubcontrol
                ]
              }
            : control
        ) || [];
        
        console.log('API Save Subcontrol update - merging with current state:', {
          controlId,
          subcontrolId,
          savedSubcontrolFiles: savedSubcontrol.evidenceFiles
        });
        
        return {
          ...currentAssessment,
          controls: updatedControls,
          lastUpdated: Date.now()
        };
      });

      await updateAssessmentProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subcontrol');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return isDarkMode ? 'bg-red-950/50 text-red-300 border-red-800' : 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return isDarkMode ? 'bg-yellow-950/50 text-yellow-300 border-yellow-800' : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return isDarkMode ? 'bg-green-950/50 text-green-300 border-green-800' : 'bg-green-100 text-green-800 border-green-300';
      default: return isDarkMode ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'implemented': return 'bg-success/20 text-success border-success/30';
      case 'reviewed': return 'bg-primary/20 text-primary border-primary/30';
      case 'pending': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (question: Question) => {
    if (question.answer?.answer?.trim()) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    if (question.priority.toLowerCase() === 'high') {
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const getControlStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'implemented': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'reviewed': return <CheckCircle className="w-5 h-5 text-primary" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading EU AI ACT Assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-full flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAssessmentData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full">
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-dark"
                onClick={async () => {
                  console.log('🔒 [EU-AI-ACT] Back to Governance button clicked, releasing lock...');
                  try {
                    // Release lock if we have one
                    if (lockInfo?.hasLock && canEdit) {
                      console.log('🔒 [EU-AI-ACT] Releasing EXCLUSIVE lock before navigation...');
                      await releaseLock();
                      console.log('🔒 [EU-AI-ACT] Lock released successfully');
                    } else {
                      console.log('🔒 [EU-AI-ACT] No exclusive lock to release');
                    }
                    
                    // Navigate back to governance
                    console.log('🔒 [EU-AI-ACT] Navigating back to governance dashboard...');
                    router.push('/dashboard/governance');
                  } catch (error) {
                    console.error('🔒 [EU-AI-ACT] Error releasing lock during navigation:', error);
                    // Navigate anyway even if lock release fails
                    router.push('/dashboard/governance');
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Governance
              </Button>
              
            </div>
            
            {assessment && (
              <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-foreground">Assessment Progress</h2>
                      {assessment.riskClassificationCompleted && assessment.riskLevel && (
                        <>
                          <Badge className={`${getRiskLevelBadgeColor(assessment.riskLevel)} border`}>
                            {assessment.riskLevel.toUpperCase()} RISK
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateWithLockRetention(`/dashboard/${useCaseId}/eu-ai-act/risk-classification`)}
                            className="text-xs"
                          >
                            View/Edit Classification
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Complete all required questions and controls to ensure compliance</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={assessment.status === 'completed' ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}
                  >
                    {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(assessment.progress)}% Complete</span>
                  </div>
                  <Progress value={assessment.progress} className="h-2" />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Tabs */}
          <div className="mb-8">
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="px-6 py-4 border-b border-border">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('assessment')}
                    className={`${
                      activeTab === 'assessment'
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                    } px-4 py-2 rounded-lg border font-medium text-sm transition-colors flex items-center gap-2`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Assessment Questions
                    <span className="text-xs bg-card px-2 py-1 rounded-full">
                      {topics.reduce((total, topic) => total + topic.subtopics.reduce((subTotal, subtopic) => subTotal + subtopic.questions.length, 0), 0)}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('controls')}
                    className={`${
                      activeTab === 'controls'
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                    } px-4 py-2 rounded-lg border font-medium text-sm transition-colors flex items-center gap-2`}
                  >
                    <Shield className="w-4 h-4" />
                    Compliance Controls
                    <span className="text-xs bg-card px-2 py-1 rounded-full">
                      {controlCategories.reduce((total, category) => 
                        total + category.controls.reduce((controlTotal, control) => 
                          controlTotal + 1 + control.subcontrols.length, 0), 0)}
                    </span>
                  </button>
                </nav>
              </div>
              
              {/* Tab Content Header */}
              <div className="px-6 py-4 bg-muted/50">
                {activeTab === 'assessment' ? (
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Assessment Questions</h3>
                      <p className="text-sm text-muted-foreground">Answer all questions to demonstrate compliance with EU AI ACT requirements</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="bg-success/20 p-2 rounded-lg">
                      <Shield className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Compliance Controls</h3>
                      <p className="text-sm text-muted-foreground">Implement and document required controls for AI system governance</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assessment Content */}
          <div className="space-y-6">
            {activeTab === 'assessment' && topics.map((topic) => (
              <Card key={topic.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader 
                  id={`topic-${topic.topicId}`}
                  className="cursor-pointer bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 transition-all duration-200"
                  onClick={() => toggleTopic(topic.topicId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg">
                        {topic.orderIndex}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{topic.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">{topic.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedTopics.has(topic.topicId) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedTopics.has(topic.topicId) && (
                  <CardContent className="p-0">
                    {topic.subtopics.map((subtopic) => (
                      <div key={subtopic.id} className="border-t border-border">
                        <div 
                          id={`subtopic-${subtopic.subtopicId}`}
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleSubtopic(subtopic.subtopicId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-muted rounded-lg p-2">
                                <ListChecks className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{subtopic.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{subtopic.description}</p>
                              </div>
                            </div>
                            {expandedSubtopics.has(subtopic.subtopicId) ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {expandedSubtopics.has(subtopic.subtopicId) && (
                          <div className="px-6 pb-6 space-y-6">
                            {subtopic.questions.map((question) => (
                              <div key={question.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                                <div className="space-y-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                      {getStatusIcon(question)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Badge 
                                          variant="outline" 
                                          className={`${getPriorityColor(question.priority)} text-xs font-medium`}
                                        >
                                          {question.priority} Priority
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-mono">
                                          ID: {question.questionId}
                                        </span>
                                      </div>
                                      <p className="text-foreground font-medium text-base leading-relaxed mb-4">
                                        {question.question}
                                      </p>
                                      
                                      <div className="bg-muted/50 p-4 rounded-lg">
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                          Your Answer
                                        </label>
                                        <textarea
                                          value={question.answer?.answer || ''}
                                          onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
                                          placeholder={canEdit ? "Provide your detailed answer here..." : "Assessment is locked by another user"}
                                          className="w-full p-3 border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                          rows={4}
                                          disabled={!canEdit}
                                        />
                                        
                                        <div className="mt-4">
                                          <div className="relative">
                                            <FileUpload
                                              label="Evidence Files"
                                              value={question.answer?.evidenceFiles || []}
                                              onChange={(files) => handleEvidenceChange(question.questionId, files)}
                                              maxFiles={5}
                                              maxSize={10}
                                              disabled={!canEdit || savingFiles.has(`question-${question.questionId}`)}
                                              useCaseId={params.useCaseId as string}
                                              frameworkType="eu-ai-act"
                                            />
                                            {savingFiles.has(`question-${question.questionId}`) && (
                                              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Saving...
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                          <div className="flex items-center gap-4">
                                            <div className="text-xs text-muted-foreground">
                                              {question.answer?.answer?.length || 0} characters
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() => handleSaveAnswer(question.questionId)}
                                            disabled={!canEdit || saving}
                                            size="sm"
                                            className="flex items-center gap-2"
                                          >
                                            <Save className="w-4 h-4" />
                                            {saving ? 'Saving...' : 'Save'}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}

            {activeTab === 'controls' && controlCategories.length === 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Control Categories Not Available</h3>
                      <p className="text-muted-foreground mt-2">
                        The EU AI Act control categories have not been set up yet. 
                        Please run the framework setup script to populate the control data.
                      </p>
                      <p className="text-sm text-muted-foreground mt-4">
                        Run: <code className="bg-muted px-2 py-1 rounded text-foreground">npx tsx scripts/setup-frameworks.ts</code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'controls' && controlCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader 
                  id={`category-${category.categoryId}`}
                  className={`cursor-pointer transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-green-950/30 to-emerald-950/30 hover:from-green-950/50 hover:to-emerald-950/50' 
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
                  }`}
                  onClick={() => toggleCategory(category.categoryId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg">
                        {category.categoryId}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{category.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">{category.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(category.categoryId) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedCategories.has(category.categoryId) && (
                  <CardContent className="p-0">
                    {category.controls.map((control) => {
                      const assessmentControl = assessment?.controls?.find(
                        c => c.controlStruct?.controlId === control.controlId
                      );
                      
                            console.log(`UI RENDER - Control ${control.controlId}:`, {
        hasAssessmentControl: !!assessmentControl,
        evidenceFiles: assessmentControl?.evidenceFiles || [],
        evidenceFilesLength: (assessmentControl?.evidenceFiles || []).length
      });
                      
                      return (
                        <div key={control.id} className="border-t border-border">
                          <div className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                  {getControlStatusIcon(assessmentControl?.status || 'pending')}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium text-foreground">{control.controlId}: {control.title}</h4>
                                    <Badge 
                                      variant="outline" 
                                      className={getStatusColor(assessmentControl?.status || 'pending')}
                                    >
                                      {assessmentControl?.status || 'Pending'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-4">{control.description}</p>
                                  
                                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-foreground mb-2">
                                        Implementation Status
                                      </label>
                                      <select
                                        value={assessmentControl?.status || 'pending'}
                                        onChange={(e) => handleControlStatusChange(control.controlId, e.target.value, assessmentControl?.notes || '')}
                                        className="w-full p-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="implemented">Implemented</option>
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-foreground mb-2">
                                        Implementation Notes
                                      </label>
                                      <textarea
                                        value={assessmentControl?.notes || ''}
                                        onChange={(e) => handleControlStatusChange(control.controlId, assessmentControl?.status || 'pending', e.target.value)}
                                        placeholder="Document how this control is implemented..."
                                        className="w-full p-3 border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        rows={3}
                                      />
                                    </div>
                                    
                                    <div className="mt-4">
                                      <div className="relative">
                                        <FileUpload
                                          label="Evidence Files"
                                          value={assessmentControl?.evidenceFiles || []}
                                          onChange={(files) => handleControlEvidenceChange(control.controlId, files)}
                                          maxFiles={5}
                                          maxSize={10}
                                          disabled={!canEdit || savingFiles.has(`control-${control.controlId}`)}
                                          useCaseId={params.useCaseId as string}
                                          frameworkType="eu-ai-act"
                                        />
                                        {savingFiles.has(`control-${control.controlId}`) && (
                                          <div className="absolute top-0 right-0 bg-success text-success-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Saving...
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-end pt-3 border-t border-border">
                                      <Button
                                        onClick={() => handleSaveControl(control.controlId)}
                                        disabled={!canEdit || saving}
                                        size="sm"
                                        className="flex items-center gap-2"
                                      >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Saving...' : 'Save'}
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Subcontrols */}
                                  {control.subcontrols.length > 0 && (
                                    <div className="mt-6 space-y-4">
                                      <h5 className="text-sm font-medium text-foreground">Subcontrols</h5>
                                      {control.subcontrols.map((subcontrol) => {
                                        const assessmentSubcontrol = assessmentControl?.subcontrols?.find(
                                          sc => sc.subcontrolStruct.subcontrolId === subcontrol.subcontrolId
                                        );
                                        
                                        return (
                                          <div key={subcontrol.id} className="bg-card border border-border rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                              <div className="flex-shrink-0 mt-1">
                                                {getControlStatusIcon(assessmentSubcontrol?.status || 'pending')}
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <h6 className="font-medium text-foreground">{subcontrol.subcontrolId}: {subcontrol.title}</h6>
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`text-xs ${getStatusColor(assessmentSubcontrol?.status || 'pending')}`}
                                                  >
                                                    {assessmentSubcontrol?.status || 'Pending'}
                                                  </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">{subcontrol.description}</p>
                                                
                                                <div className="space-y-3">
                                                  <div>
                                                    <select
                                                      value={assessmentSubcontrol?.status || 'pending'}
                                                      onChange={(e) => handleSubcontrolStatusChange(control.controlId, subcontrol.subcontrolId, e.target.value, assessmentSubcontrol?.notes || '')}
                                                      className="w-full p-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                                      disabled={!canEdit}
                                                    >
                                                      <option value="pending">Pending</option>
                                                      <option value="reviewed">Reviewed</option>
                                                      <option value="implemented">Implemented</option>
                                                    </select>
                                                  </div>
                                                  
                                                  <div>
                                                    <textarea
                                                      value={assessmentSubcontrol?.notes || ''}
                                                      onChange={(e) => handleSubcontrolStatusChange(control.controlId, subcontrol.subcontrolId, assessmentSubcontrol?.status || 'pending', e.target.value)}
                                                      placeholder={canEdit ? "Implementation notes..." : "Assessment is locked by another user"}
                                                      className="w-full p-2 border border-input rounded-lg text-sm resize-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                                      rows={2}
                                                      disabled={!canEdit}
                                                    />
                                                  </div>
                                                  
                                                  <div>
                                                    <div className="relative">
                                                      <FileUpload
                                                        label="Evidence Files"
                                                        value={assessmentSubcontrol?.evidenceFiles || []}
                                                        onChange={(files) => handleSubcontrolEvidenceChange(control.controlId, subcontrol.subcontrolId, files)}
                                                        maxFiles={5}
                                                        maxSize={10}
                                                        disabled={!canEdit || savingFiles.has(`subcontrol-${subcontrol.subcontrolId}`)}
                                                        useCaseId={params.useCaseId as string}
                                                        frameworkType="eu-ai-act"
                                                      />
                                                      {savingFiles.has(`subcontrol-${subcontrol.subcontrolId}`) && (
                                                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                          <Loader2 className="w-3 h-3 animate-spin" />
                                                          Saving...
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex justify-end">
                                                    <Button
                                                      onClick={() => handleSaveSubcontrol(control.controlId, subcontrol.subcontrolId)}
                                                      disabled={!canEdit || saving}
                                                      size="sm"
                                                      variant="outline"
                                                    >
                                                      <Save className="w-3 h-3 mr-1" />
                                                      Save
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Lock Management Modal */}
      <GovernanceLockModal
        isOpen={isLockModalOpen}
        onClose={handleCloseLockModal}
        lockInfo={lockInfo}
        framework="GOVERNANCE_EU_AI_ACT"
        useCaseId={useCaseId}
        useCaseName={`AIUC-${useCaseId}`}
        onAcquireLock={handleStartAssessment}
        onReleaseLock={handleReleaseLock}
        loading={lockLoading}
      />
    </div>
  );
}