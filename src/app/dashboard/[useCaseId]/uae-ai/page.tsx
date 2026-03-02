'use client';

// UAE AI Act Assessment Page with Full Dark Mode Support
// Features:
// - Dynamic dark mode detection and theme switching
// - Responsive color schemes for all UI elements
// - Proper contrast and readability in both light and dark themes

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Clock, Upload, Save, ChevronRight, ChevronDown, Shield, Star, Lock } from 'lucide-react';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/file-upload';
import { uaeAiScoringSystem, getMaturityLevelDetails, getRiskImpactLevelDetails, getScoreLevelDetails } from '@/lib/framework-data/uae-ai-scoring';
import { useGovernanceLock } from '@/hooks/useGovernanceLock';
import { GovernanceLockModal } from '@/components/GovernanceLockModal';

interface ControlInstance {
  id: string;
  implementation: string;
  evidenceFiles: string[];
  score: number;
  notes: string;
  status: string;
  control: {
    controlId: string;
    title: string;
    description: string;
    legalBasis: string;
    evidenceTypes: string[];
  };
}

interface Control {
  id: string;
  controlId: string;
  title: string;
  description: string;
  legalBasis: string;
  evidenceTypes: string[];
  orderIndex: number;
}

interface Assessment {
  id: string;
  useCaseId: string;
  status: string;
  progress: number;
  totalScore: number;
  weightedScore: number;
  maturityLevel: string;
  riskImpactLevel: string;
  createdAt: string;
  updatedAt: string;
  controls: ControlInstance[];
}

export default function UaeAiAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const useCaseId = params.useCaseId as string;
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
    loading: lockLoading,
    error: lockError
  } = useGovernanceLock(useCaseId, 'GOVERNANCE_UAE_AI');

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

  const [controls, setControls] = useState<Control[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'controls' | 'maturity'>('controls');
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());
  const [savingControls, setSavingControls] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssessmentData();
  }, [useCaseId]);

  // Cleanup: Release lock when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      if (lockInfo?.hasLock && canEdit) {
        try {
          const data = new FormData();
          data.append('useCaseId', useCaseId);
          data.append('lockType', 'EXCLUSIVE');
          data.append('scope', 'GOVERNANCE_UAE_AI');
          navigator.sendBeacon('/api/locks/release', data);
        } catch (e) {
          // noop
        }
      }
    };
  }, [useCaseId, lockInfo?.hasLock, canEdit]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const [controlsResponse, assessmentResponse] = await Promise.all([
        fetch('/api/uae-ai/controls'),
        fetch(`/api/uae-ai/assessment/by-usecase/${useCaseId}`)
      ]);

      if (!controlsResponse.ok || !assessmentResponse.ok) {
        throw new Error(`Failed to fetch UAE AI assessment data`);
      }

      const controlsData = await controlsResponse.json();
      const assessmentData = await assessmentResponse.json();

      setControls(controlsData);
      setAssessment(assessmentData);

      // Expand first control by default
      if (controlsData.length > 0) {
        setExpandedControls(new Set([controlsData[0].controlId]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleControlImplementationChange = (controlId: string, implementation: string) => {
    if (!canEdit) return;
    if (!assessment) return;

    const existingInstance = assessment.controls.find(c => c.control.controlId === controlId);
    
    let updatedControls;
    if (existingInstance) {
      updatedControls = assessment.controls.map(c => 
        c.control.controlId === controlId 
          ? { ...c, implementation, status: implementation.trim() ? 'implemented' : 'pending' }
          : c
      );
    } else {
      const control = controls.find(c => c.controlId === controlId);
      if (control) {
        const newInstance = {
          id: `temp-${controlId}`,
          implementation,
          evidenceFiles: [],
          score: 0,
          notes: '',
          status: implementation.trim() ? 'implemented' : 'pending',
          control: {
            controlId: control.controlId,
            title: control.title,
            description: control.description,
            legalBasis: control.legalBasis,
            evidenceTypes: control.evidenceTypes
          }
        };
        updatedControls = [...assessment.controls, newInstance];
      } else {
        return;
      }
    }

    setAssessment({ ...assessment, controls: updatedControls });
  };

  const handleControlScoreChange = async (controlId: string, score: number) => {
    if (!canEdit) return;
    if (!assessment) return;

    setSavingControls(prev => new Set(prev).add(controlId));

    try {
      const existingInstance = assessment.controls.find(c => c.control.controlId === controlId);
      
      const response = await fetch(`/api/uae-ai/control-instance/${assessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlId,
          implementation: existingInstance?.implementation || '',
          evidenceFiles: existingInstance?.evidenceFiles || [],
          score,
          notes: existingInstance?.notes || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save control score');
      }

      const savedInstance = await response.json();
      
      // Update local state
      setAssessment(currentAssessment => {
        if (!currentAssessment) return currentAssessment;
        
        const updatedControls = currentAssessment.controls.map(c => 
          c.control.controlId === controlId ? { ...c, ...savedInstance, control: c.control } : c
        );
        
        return { ...currentAssessment, controls: updatedControls };
      });

      // Refresh assessment to get updated scores
      await fetchAssessmentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save score');
    } finally {
      setSavingControls(prev => {
        const newSet = new Set(prev);
        newSet.delete(controlId);
        return newSet;
      });
    }
  };

  const handleEvidenceChange = async (controlId: string, evidenceFiles: string[]) => {
    console.log('🔄 handleEvidenceChange START:', { controlId, evidenceFiles });
    if (!canEdit) return;
    if (!assessment) return;

    const existingInstance = assessment.controls.find(c => c.control.controlId === controlId);
    const currentFiles = existingInstance?.evidenceFiles || [];
    const removedFiles = currentFiles.filter(file => !evidenceFiles.includes(file));
    
    console.log('📊 Control state before update:', {
      existingInstance: existingInstance ? {
        id: existingInstance.id,
        controlId: existingInstance.control?.controlId,
        evidenceFiles: existingInstance.evidenceFiles
      } : null,
      currentFiles,
      newFiles: evidenceFiles,
      removedFiles
    });
    
    // Update local state immediately for better UX with forced re-render
    setAssessment(prevAssessment => {
      if (!prevAssessment) return prevAssessment;
      
      const controlIndex = prevAssessment.controls.findIndex(c => c.control?.controlId === controlId);
      if (controlIndex < 0) {
        // Create new control instance if it doesn't exist
        const control = controls.find(c => c.controlId === controlId);
        if (control) {
          const newInstance = {
            id: `temp-${controlId}`,
            implementation: '',
            evidenceFiles: [...evidenceFiles], // Ensure new array reference
            score: 0,
            notes: '',
            status: 'pending',
            control: {
              controlId: control.controlId,
              title: control.title,
              description: control.description,
              legalBasis: control.legalBasis,
              evidenceTypes: control.evidenceTypes
            }
          };
          
          console.log('🔧 State Update - new control instance:', {
            controlId,
            newInstance,
            evidenceFiles
          });
          
          return {
            ...prevAssessment,
            controls: [...prevAssessment.controls, newInstance],
            lastUpdated: Date.now()
          };
        }
        return prevAssessment;
      }
      
      // Update existing control
      const updatedControls = [...prevAssessment.controls];
      updatedControls[controlIndex] = {
        ...updatedControls[controlIndex],
        evidenceFiles: [...evidenceFiles] // Ensure new array reference
      };
      
      console.log('🔧 State Update - existing control:', {
        controlId,
        controlIndex,
        newFiles: evidenceFiles
      });
      
      return {
        ...prevAssessment,
        controls: updatedControls,
        lastUpdated: Date.now()
      };
    });

    // Auto-save the evidence files
    setSavingFiles(prev => new Set(prev).add(`control-${controlId}`));
    
    try {
      // First ensure the control exists and is saved
      if (!existingInstance || existingInstance.id.startsWith('temp-')) {
        // Save the control first if it doesn't exist
        const controlResponse = await fetch(`/api/uae-ai/control-instance/${assessment.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlId,
            implementation: existingInstance?.implementation || '',
            evidenceFiles,
            score: existingInstance?.score || 0,
            notes: existingInstance?.notes || ''
          })
        });

        if (!controlResponse.ok) {
          throw new Error('Failed to save control evidence files');
        }

        const savedInstance = await controlResponse.json();

        // Update the control with the saved instance using functional update
        setAssessment(currentAssessment => {
          if (!currentAssessment) return currentAssessment;
          
          const updatedControls = currentAssessment.controls.map(control => 
            control.control?.controlId === controlId 
              ? { ...control, ...savedInstance, control: control.control }
              : control
          );
          
          console.log('✅ API Control update - merging with current state:', {
            controlId,
            savedInstanceFiles: savedInstance.evidenceFiles
          });
          
          return {
            ...currentAssessment,
            controls: updatedControls,
            lastUpdated: Date.now()
          };
        });
      } else {
        // Update existing control
        const response = await fetch(`/api/uae-ai/control-instance/${assessment.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlId,
            implementation: existingInstance.implementation || '',
            evidenceFiles,
            score: existingInstance.score || 0,
            notes: existingInstance.notes || ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save evidence files');
        }

        const savedInstance = await response.json();
        
        // Update local state
        setAssessment(currentAssessment => {
          if (!currentAssessment) return currentAssessment;
          
          const updatedControls = currentAssessment.controls.map(c => 
            c.control?.controlId === controlId ? { ...c, ...savedInstance, control: c.control } : c
          );
          
          return { ...currentAssessment, controls: updatedControls };
        });
      }
      
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
    } catch (err) {
      console.error('Error saving evidence files:', err);
      
      // Revert local state on error
      setAssessment(prevAssessment => {
        if (!prevAssessment) return prevAssessment;
        
        if (existingInstance) {
          const revertedControls = prevAssessment.controls.map(control => 
            control.control?.controlId === controlId 
              ? { ...control, evidenceFiles: [...currentFiles] }
              : control
          );
          return { ...prevAssessment, controls: revertedControls, lastUpdated: Date.now() };
        } else {
          // Remove the temporary control we added
          const revertedControls = prevAssessment.controls.filter(c => 
            !(c.id === `temp-${controlId}` && c.control?.controlId === controlId)
          );
          return { ...prevAssessment, controls: revertedControls, lastUpdated: Date.now() };
        }
      });
      
      setError(err instanceof Error ? err.message : 'Failed to save evidence');
    } finally {
      setSavingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(`control-${controlId}`);
        return newSet;
      });
    }
  };

  const handleRiskImpactLevelChange = async (newLevel: string) => {
    if (!canEdit) return;
    if (!assessment) return;

    try {
      const response = await fetch(`/api/uae-ai/assessment/${assessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskImpactLevel: newLevel })
      });

      if (!response.ok) {
        throw new Error('Failed to update risk impact level');
      }

      const updatedAssessment = await response.json();
      setAssessment(updatedAssessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update risk level');
    }
  };

  const handleSaveControl = async (controlId: string) => {
    if (!canEdit) return;
    const controlInstance = assessment?.controls.find(c => c.control.controlId === controlId);
    if (!controlInstance || !assessment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/uae-ai/control-instance/${assessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlId,
          implementation: controlInstance.implementation,
          evidenceFiles: controlInstance.evidenceFiles,
          score: controlInstance.score,
          notes: controlInstance.notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save implementation');
      }

      await fetchAssessmentData(); // Refresh to get updated scores
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save implementation');
    } finally {
      setSaving(false);
    }
  };

  const toggleControl = (controlId: string) => {
    const newExpanded = new Set(expandedControls);
    if (newExpanded.has(controlId)) {
      newExpanded.delete(controlId);
    } else {
      newExpanded.add(controlId);
    }
    setExpandedControls(newExpanded);
  };

  const findControlInstance = (controlId: string) => {
    return assessment?.controls.find(c => c.control.controlId === controlId);
  };

  const getStatusIcon = (status: string, hasImplementation: boolean) => {
    if (hasImplementation) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const maturityDetails = assessment ? getMaturityLevelDetails(assessment.maturityLevel) : null;
  const riskDetails = assessment ? getRiskImpactLevelDetails(assessment.riskImpactLevel) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading UAE AI Assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
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
                  try {
                    if (lockInfo?.hasLock && canEdit) {
                      await releaseLock();
                    }
                  } finally {
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
                <div>
                  <h2 className="text-lg font-semibold text-foreground">UAE AI/GenAI Controls Assessment</h2>
                  <p className="text-sm text-muted-foreground">Compliance with UAE AI regulations and guidelines</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={riskDetails?.bgColor + ' ' + riskDetails?.textColor}
                  >
                    {riskDetails?.label}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={maturityDetails?.bgColor + ' ' + maturityDetails?.textColor}
                  >
                    {maturityDetails?.label}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Progress</div>
                    <div className="text-2xl font-bold text-foreground">{Math.round(assessment.progress)}%</div>
                    <Progress value={assessment.progress} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Weighted Score</div>
                    <div className="text-2xl font-bold text-foreground">{assessment.weightedScore}</div>
                    <div className="text-xs text-muted-foreground">out of {riskDetails?.weight ? riskDetails.weight * 3 : 3}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Risk Impact Level</div>
                    <Select value={assessment.riskImpactLevel} onValueChange={handleRiskImpactLevelChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uaeAiScoringSystem.riskImpactLevels.map(level => (
                          <SelectItem key={level.level} value={level.level}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-${level.color}-500`}></div>
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('controls')}
                  className={`${
                    activeTab === 'controls'
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  } px-4 py-2 rounded-lg border font-medium text-sm transition-colors flex items-center gap-2`}
                >
                  <Shield className="w-4 h-4" />
                  Control Areas
                  <span className="text-xs opacity-75">({controls.length} controls)</span>
                </button>
                <button
                  onClick={() => setActiveTab('maturity')}
                  className={`${
                    activeTab === 'maturity'
                      ? 'bg-accent/20 text-accent-foreground border-accent/30'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  } px-4 py-2 rounded-lg border font-medium text-sm transition-colors flex items-center gap-2`}
                >
                  <Star className="w-4 h-4" />
                  Maturity Scorecard
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'controls' && controls.map((control) => {
            const instance = findControlInstance(control.controlId);
            const isCompleted = !!instance?.implementation?.trim();
            
            return (
              <Card key={control.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader 
                  className="cursor-pointer bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 transition-all duration-200"
                  onClick={() => toggleControl(control.controlId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg">
                        {control.controlId.split('-')[2]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <CardTitle className="text-lg text-foreground">{control.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {control.controlId}
                          </Badge>
                          {isCompleted && (
                            <Badge className="bg-success/20 text-success text-xs">
                              Implemented
                            </Badge>
                          )}
                          {instance && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-warning" />
                              <span className="text-sm font-medium">{instance.score}/3</span>
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">{control.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(instance?.status || 'pending', isCompleted)}
                      {expandedControls.has(control.controlId) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedControls.has(control.controlId) && (
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Legal Basis */}
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Legal/Regulatory Basis:</h5>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{control.legalBasis}</p>
                      </div>

                      {/* Evidence Types */}
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">Required Evidence Types:</h5>
                        <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                          {control.evidenceTypes.map((evidence, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                              <span>{evidence}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Implementation and Scoring */}
                      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-semibold text-foreground">
                            Implementation Details
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Score:</span>
                            <Select 
                              value={instance?.score?.toString() || "0"} 
                              onValueChange={(value) => handleControlScoreChange(control.controlId, parseInt(value))}
                              disabled={!canEdit || savingControls.has(control.controlId)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {uaeAiScoringSystem.scoreLevels.map(level => (
                                  <SelectItem key={level.value} value={level.value.toString()}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{level.value}</span>
                                      <span className="text-xs text-muted-foreground">({level.label})</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {savingControls.has(control.controlId) && (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            )}
                          </div>
                        </div>

                        <textarea
                          value={instance?.implementation || ''}
                          onChange={(e) => handleControlImplementationChange(control.controlId, e.target.value)}
                          placeholder={canEdit ? `Describe how this control is implemented in your organization...

• What specific measures are in place?
• Who is responsible for this control?
• What processes and procedures exist?
• How is effectiveness monitored?` : 'Assessment is locked by another user'}
                          className="w-full p-3 border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                          rows={5}
                          disabled={!canEdit}
                        />
                        
                        <div className="mt-4">
                          <div className="relative">
                            <FileUpload
                              label="Evidence Files"
                              value={instance?.evidenceFiles || []}
                              onChange={(files) => handleEvidenceChange(control.controlId, files)}
                              maxFiles={5}
                              maxSize={10}
                              disabled={!canEdit || savingFiles.has(`control-${control.controlId}`)}
                              useCaseId={params.useCaseId as string}
                              frameworkType="uae-ai"
                            />
                            {savingFiles.has(`control-${control.controlId}`) && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground">
                            {instance?.implementation?.length || 0} characters
                          </div>
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
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {activeTab === 'maturity' && assessment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  UAE AI Maturity Scorecard
                </CardTitle>
                <CardDescription>
                  Compliance maturity assessment based on control implementation scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Maturity */}
                  <div className={`p-6 rounded-lg ${maturityDetails?.bgColor}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold ${maturityDetails?.textColor}`}>
                        Overall Maturity: {maturityDetails?.label}
                      </h3>
                      <div className={`text-2xl font-bold ${maturityDetails?.textColor}`}>
                        {Math.round((assessment.weightedScore / (riskDetails?.weight ? riskDetails.weight * 3 : 3)) * 100)}%
                      </div>
                    </div>
                    <p className={`text-sm ${maturityDetails?.textColor} mb-4`}>
                      {maturityDetails?.description}
                    </p>
                    {maturityDetails?.recommendations && (
                      <div>
                        <h4 className={`text-sm font-semibold ${maturityDetails?.textColor} mb-2`}>
                          Recommendations:
                        </h4>
                        <ul className={`text-sm ${maturityDetails?.textColor} space-y-1`}>
                          {maturityDetails.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Control Scores */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Individual Control Scores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {controls.map(control => {
                        const instance = findControlInstance(control.controlId);
                        const scoreDetails = getScoreLevelDetails(instance?.score || 0);
                        return (
                          <div key={control.id} className="p-4 border border-border rounded-lg bg-card">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-foreground">{control.title}</span>
                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded text-xs ${scoreDetails?.bgColor} ${scoreDetails?.textColor}`}>
                                  {scoreDetails?.label}
                                </div>
                                <span className="font-bold text-foreground">{instance?.score || 0}/3</span>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${scoreDetails?.color === 'red' ? 'bg-red-500' : 
                                  scoreDetails?.color === 'orange' ? 'bg-orange-500' :
                                  scoreDetails?.color === 'green' ? 'bg-green-500' : 'bg-gray-500'}`}
                                style={{ width: `${((instance?.score || 0) / 3) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Lock Management Modal */}
      <GovernanceLockModal
        isOpen={isLockModalOpen}
        onClose={async () => {
          if (lockInfo?.hasLock && canEdit) {
            try { await releaseLock(); } catch {}
          }
          setIsLockModalOpen(false);
        }}
        lockInfo={lockInfo}
        framework="GOVERNANCE_UAE_AI"
        useCaseId={useCaseId}
        useCaseName={`AIUC-${useCaseId}`}
        onAcquireLock={async () => { const ok = await acquireLock(); if (ok) setIsLockModalOpen(false); return ok; }}
        onReleaseLock={async () => { await releaseLock(); await refreshLockStatus(); setIsLockModalOpen(false); }}
        loading={lockLoading}
      />
    </div>
  );
}