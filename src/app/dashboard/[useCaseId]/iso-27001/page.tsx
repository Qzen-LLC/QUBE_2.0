"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Save,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/ui/file-upload";
import { useGovernanceLock } from '@/hooks/useGovernanceLock';
import { GovernanceLockModal } from '@/components/GovernanceLockModal';

interface SubclauseInstance {
  id: string;
  implementation: string;
  evidenceFiles: string[];
  status: string;
  subclause: {
    subclauseId: string;
    title: string;
    summary: string;
    questions: string[];
    evidenceExamples: string[];
  };
}

interface AnnexInstance {
  id: string;
  implementation: string;
  evidenceFiles: string[];
  status: string;
  item: {
    itemId: string;
    title: string;
    description: string;
    guidance: string;
    category: {
      title: string;
    };
  };
}

interface Clause {
  id: string;
  clauseId: string;
  title: string;
  description: string;
  orderIndex: number;
  subclauses: {
    id: string;
    subclauseId: string;
    title: string;
    summary: string;
    questions: string[];
    evidenceExamples: string[];
    orderIndex: number;
  }[];
}

interface AnnexCategory {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  orderIndex: number;
  items: {
    id: string;
    itemId: string;
    title: string;
    description: string;
    guidance: string;
    orderIndex: number;
  }[];
}

interface Assessment {
  id: string;
  useCaseId: string;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  subclauses: SubclauseInstance[];
  annexes: AnnexInstance[];
}

export default function Iso27001AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const useCaseId = params.useCaseId as string;

  const [clauses, setClauses] = useState<Clause[]>([]);
  const [annexCategories, setAnnexCategories] = useState<AnnexCategory[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"clauses" | "annex">("clauses");
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(
    new Set()
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set());
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
  } = useGovernanceLock(useCaseId, 'GOVERNANCE_ISO_27001');

  // Add debounce mechanism to prevent duplicate API calls (only for subclauses now)
  const [pendingEvidenceChanges, setPendingEvidenceChanges] = useState<
    Map<string, NodeJS.Timeout>
  >(new Map());

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchAssessmentData();
  }, [useCaseId]);

  // Cleanup: Release lock when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Release lock when component unmounts
      if (lockInfo?.hasLock && canEdit) {
        console.log('🔒 Component unmounting, releasing lock...');
        // Use sendBeacon for reliable delivery during navigation
        const data = new FormData();
        data.append('useCaseId', useCaseId);
        data.append('lockType', 'EXCLUSIVE');
        data.append('scope', 'GOVERNANCE_ISO_27001');
        
        try {
          navigator.sendBeacon('/api/locks/release', data);
          console.log('🔒 Lock release beacon sent');
        } catch (error) {
          console.error('🔒 Failed to send lock release beacon:', error);
        }
      }
    };
  }, [useCaseId, lockInfo?.hasLock, canEdit]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      pendingEvidenceChanges.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [pendingEvidenceChanges]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const [clausesResponse, annexResponse, assessmentResponse] =
        await Promise.all([
          fetch("/api/iso-27001/clauses"),
          fetch("/api/iso-27001/annex"),
          fetch(`/api/iso-27001/assessment/by-usecase/${useCaseId}`),
        ]);

      if (!clausesResponse.ok || !annexResponse.ok) {
        throw new Error(
          `Failed to fetch framework data: ${clausesResponse.status} ${annexResponse.status}`
        );
      }

      // Debug the responses
      console.log('ISO 27001 Debug - API Responses:', {
        clausesResponse: { ok: clausesResponse.ok, status: clausesResponse.status },
        annexResponse: { ok: annexResponse.ok, status: annexResponse.status },
        assessmentResponse: { ok: assessmentResponse.ok, status: assessmentResponse.status }
      });

      // Handle assessment response separately to provide better error messages
      if (!assessmentResponse.ok) {
        console.error('ISO 27001 Debug - Assessment response not ok:', {
          status: assessmentResponse.status,
          statusText: assessmentResponse.statusText
        });
        
        const errorData = await assessmentResponse.json();
        console.error('ISO 27001 Debug - Assessment error data:', errorData);
        
        if (assessmentResponse.status === 404) {
          setError(
            `${errorData.message || "Use case not found"}\n\nSuggestions:\n• ${
              errorData.suggestions?.join("\n• ") || "Check the use case ID"
            }`
          );
          return;
        } else if (assessmentResponse.status === 503) {
          setError(
            `${errorData.message || "Service unavailable"}\n\nSuggestions:\n• ${
              errorData.suggestions?.join("\n• ") || "Contact support"
            }`
          );
          return;
        } else {
          throw new Error(
            `API Error: ${
              errorData.message || "Failed to fetch assessment data"
            }`
          );
        }
      }

      const clausesData = await clausesResponse.json();
      const annexData = await annexResponse.json();
      const assessmentData = await assessmentResponse.json();

      // Debug logging
      console.log("ISO 27001 Debug - Clauses loaded:", {
        clausesCount: clausesData.length,
        firstClause: clausesData[0]?.clauseId,
        firstClauseSubclauses: clausesData[0]?.subclauses?.length || 0,
      });

      // Check if framework tables are available
      if (clausesData.length === 0) {
        setError(
          "ISO 27001 framework tables need to be set up. Please run the database setup scripts to enable full functionality."
        );
        return;
      }

      // Handle different error types from the API
      if (assessmentData.status === "not_available") {
        if (assessmentData.error === "USE_CASE_NOT_FOUND") {
          setError(
            `${
              assessmentData.message
            }\n\nSuggestions:\n• ${assessmentData.suggestions?.join("\n• ")}`
          );
        } else {
          setError(
            "Use case not found. Please ensure you are accessing a valid use case from the dashboard."
          );
        }
        return;
      }

      if (assessmentData.status === "framework_missing") {
        setError(
          `${
            assessmentData.message
          }\n\nSuggestions:\n• ${assessmentData.suggestions?.join("\n• ")}`
        );
        return;
      }

      if (assessmentData.status === "error") {
        setError(
          `Database error: ${assessmentData.message}\n\nDetails: ${assessmentData.details}`
        );
        return;
      }

      setClauses(clausesData);
      setAnnexCategories(annexData);
      setAssessment(assessmentData);

      // Expand first clause by default
      if (clausesData.length > 0) {
        setExpandedClauses(new Set([clausesData[0].clauseId]));
      }

      // Expand first annex category by default
      if (annexData.length > 0) {
        setExpandedCategories(new Set([annexData[0].categoryId]));
      }
    } catch (err) {
      console.error("Error fetching ISO 27001 assessment data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading the assessment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubclauseImplementationChange = (
    subclauseId: string,
    implementation: string
  ) => {
    console.log('🔒 handleSubclauseImplementationChange called:', { subclauseId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing subclause implementation change');
      return; // Prevent changes if user doesn't have edit access
    }
    
    if (!assessment) return;

    console.log("ISO 27001 Debug - Implementation change:", {
      subclauseId,
      implementationLength: implementation.length,
      currentAssessmentSubclauses: assessment.subclauses.length,
    });

    // Check if instance already exists
    const existingInstance = assessment.subclauses.find(
      (sc) => sc.subclause.subclauseId === subclauseId
    );

    let updatedSubclauses;
    if (existingInstance) {
      // Update existing instance
      updatedSubclauses = assessment.subclauses.map((sc) =>
        sc.subclause.subclauseId === subclauseId
          ? {
              ...sc,
              implementation,
              status: implementation.trim() ? "implemented" : "pending",
            }
          : sc
      );
    } else {
      // Create new instance (temporary, will be saved to DB when user clicks Save)
      const newInstance = {
        id: `temp-${subclauseId}`,
        implementation,
        evidenceFiles: [],
        status: implementation.trim() ? "implemented" : "pending",
        subclause: {
          subclauseId,
          title: "", // Will be filled when saved
          summary: "",
          questions: [],
          evidenceExamples: [],
        },
      };
      updatedSubclauses = [...assessment.subclauses, newInstance];
    }

    setAssessment({ ...assessment, subclauses: updatedSubclauses });
  };

  const handleAnnexImplementationChange = (
    itemId: string,
    implementation: string
  ) => {
    console.log('🔒 handleAnnexImplementationChange called:', { itemId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing annex implementation change');
      return; // Prevent changes if user doesn't have edit access
    }
    
    if (!assessment) return;

    console.log("ISO 27001 Debug - Annex implementation change:", {
      itemId,
      implementationLength: implementation.length,
      currentAssessmentAnnexes: assessment.annexes.length,
    });

    // Check if instance already exists
    const existingInstance = assessment.annexes.find(
      (ann) => ann.item.itemId === itemId
    );

    let updatedAnnexes;
    if (existingInstance) {
      // Update existing instance
      updatedAnnexes = assessment.annexes.map((ann) =>
        ann.item.itemId === itemId
          ? {
              ...ann,
              implementation,
              status: implementation.trim() ? "implemented" : "pending",
            }
          : ann
      );
    } else {
      // Create new instance (temporary, will be saved to DB when user clicks Save)
      const newInstance = {
        id: `temp-${itemId}`,
        implementation,
        evidenceFiles: [],
        status: implementation.trim() ? "implemented" : "pending",
        item: {
          itemId,
          title: "", // Will be filled when saved
          description: "",
          guidance: "",
          categoryId: "",
          category: { title: "" }, // Add required category property
        },
      };
      updatedAnnexes = [...assessment.annexes, newInstance];
    }

    setAssessment({ ...assessment, annexes: updatedAnnexes });
  };

  const handleSaveSubclause = async (subclauseId: string) => {
    console.log('🔒 handleSaveSubclause called:', { subclauseId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing subclause save');
      return; // Prevent changes if user doesn't have edit access
    }
    
    const subclauseInstance = assessment?.subclauses.find(
      (sc) => sc.subclause.subclauseId === subclauseId
    );
    if (!subclauseInstance || !assessment) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/iso-27001/subclause/${assessment.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subclauseId,
            implementation: subclauseInstance.implementation,
            evidenceFiles: subclauseInstance.evidenceFiles,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save subclause");
      }

      const savedInstance = await response.json();

      // Update local state with the saved instance
      setAssessment((currentAssessment) => {
        if (!currentAssessment) return currentAssessment;

        const updatedSubclauses = currentAssessment.subclauses.map((sc) =>
          sc.subclause.subclauseId === subclauseId
            ? { ...sc, ...savedInstance, subclause: sc.subclause }
            : sc
        );

        return {
          ...currentAssessment,
          subclauses: updatedSubclauses,
          lastUpdated: Date.now(),
        };
      });

      await updateProgress();

      // Clear any existing errors on successful save
      if (error) {
        setError(null);
      }
    } catch (error) {
      console.error("Error saving subclause:", error);
      setError(error instanceof Error ? error.message : "Failed to save subclause");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnex = async (itemId: string) => {
    console.log('🔒 handleSaveAnnex called:', { itemId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing annex save');
      return; // Prevent changes if user doesn't have edit access
    }
    
    const annexInstance = assessment?.annexes.find(
      (ann) => ann.item.itemId === itemId
    );
    if (!annexInstance || !assessment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/iso-27001/annex/${assessment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          implementation: annexInstance.implementation,
          evidenceFiles: annexInstance.evidenceFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save annex");
      }

      const savedInstance = await response.json();

      // Update local state with the saved instance
      setAssessment((currentAssessment) => {
        if (!currentAssessment) return currentAssessment;

        const updatedAnnexes = currentAssessment.annexes.map((ann) =>
          ann.item.itemId === itemId
            ? { ...ann, ...savedInstance, item: ann.item }
            : ann
        );

        return {
          ...currentAssessment,
          annexes: updatedAnnexes,
          lastUpdated: Date.now(),
        };
      });

      await updateProgress();

      // Clear any existing errors on successful save
      if (error) {
        setError(null);
      }
    } catch (error) {
      console.error("Error saving annex:", error);
      setError(error instanceof Error ? error.message : "Failed to save annex");
    } finally {
      setSaving(false);
    }
  };

  const handleSubclauseEvidenceChange = (
    subclauseId: string,
    evidenceFiles: string[]
  ) => {
    console.log('🔒 handleSubclauseEvidenceChange called:', { subclauseId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing subclause evidence change');
      return; // Prevent changes if user doesn't have edit access
    }
    
    if (!assessment) return;

    const existingInstance = assessment.subclauses.find(
      (sc) => sc.subclause.subclauseId === subclauseId
    );

    // Update local state only - no auto-save
    setAssessment((prevAssessment) => {
      if (!prevAssessment) return prevAssessment;

      if (existingInstance) {
        const updatedSubclauses = prevAssessment.subclauses.map((sc) =>
          sc.subclause.subclauseId === subclauseId
            ? { ...sc, evidenceFiles: [...evidenceFiles] } // Ensure new array reference
            : sc
        );

        console.log("ISO State Update - existing subclause:", {
          subclauseId,
          newFiles: evidenceFiles,
          updatedInstance: updatedSubclauses.find(
            (sc) => sc.subclause.subclauseId === subclauseId
          ),
        });

        return {
          ...prevAssessment,
          subclauses: updatedSubclauses,
          lastUpdated: Date.now(), // Force re-render
        };
      } else {
        // Instance doesn't exist yet, we'll create it in the API call
        console.log(
          "ISO State Update - no existing instance for:",
          subclauseId
        );
        return prevAssessment;
      }
    });
  };

  const handleAnnexEvidenceChange = (
    itemId: string,
    evidenceFiles: string[]
  ) => {
    console.log('🔒 handleAnnexEvidenceChange called:', { itemId, canEdit, hasLock: lockInfo?.hasLock });
    if (!canEdit) {
      console.log('🔒 User cannot edit, preventing annex evidence change');
      return; // Prevent changes if user doesn't have edit access
    }
    
    if (!assessment) return;

    const existingInstance = assessment.annexes.find(
      (ann) => ann.item.itemId === itemId
    );

    // Update local state only - no auto-save
    setAssessment((prevAssessment) => {
      if (!prevAssessment) return prevAssessment;

      if (existingInstance) {
        const updatedAnnexes = prevAssessment.annexes.map((ann) =>
          ann.item.itemId === itemId
            ? { ...ann, evidenceFiles: [...evidenceFiles] } // Ensure new array reference
            : ann
        );

        console.log("🔧 ISO State Update - existing annex:", {
          itemId,
          newFiles: evidenceFiles,
          updatedInstance: updatedAnnexes.find(
            (ann) => ann.item.itemId === itemId
          ),
        });

        return {
          ...prevAssessment,
          annexes: updatedAnnexes,
          lastUpdated: Date.now(), // Force re-render
        };
      } else {
        // Instance doesn't exist yet, we'll create it in the API call
        console.log(
          "🔧 ISO State Update - no existing annex instance for:",
          itemId
        );
        return prevAssessment;
      }
    });
  };

  const updateProgress = async () => {
    if (!assessment) return;

    try {
      const totalSubclauses = clauses.reduce(
        (total, clause) => total + clause.subclauses.length,
        0
      );
      const totalAnnexItems = annexCategories.reduce(
        (total, category) => total + category.items.length,
        0
      );

      const completedSubclauses = assessment.subclauses.filter(
        (sub) => sub.status === "implemented"
      ).length;
      const completedAnnexItems = assessment.annexes.filter(
        (annex) => annex.status === "implemented"
      ).length;

      const totalItems = totalSubclauses + totalAnnexItems;
      const completedItems = completedSubclauses + completedAnnexItems;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const response = await fetch(
        `/api/iso-27001/assessment/${assessment.id}/progress`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ progress }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      const updatedAssessment = await response.json();
      setAssessment((prev) =>
        prev ? { ...prev, progress: updatedAssessment.progress } : prev
      );
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const toggleClause = (clauseId: string) => {
    if (expandedClauses.has(clauseId)) {
      // If clicking on an open clause, close it
      setExpandedClauses(new Set());
      console.log("ISO 27001 Debug - Collapsed clause:", clauseId);
    } else {
      // If clicking on a closed clause, close all others and open this one
      setExpandedClauses(new Set([clauseId]));
      console.log("ISO 27001 Debug - Expanded clause:", clauseId);
      
      // Scroll to the clause after state update
      setTimeout(() => {
        const element = document.getElementById(`clause-${clauseId}`);
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

  const getStatusIcon = (status: string, hasImplementation: boolean) => {
    if (hasImplementation) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const findSubclauseInstance = (subclauseId: string) => {
    const instance = assessment?.subclauses.find(
      (sc) => sc.subclause.subclauseId === subclauseId
    );
    console.log("ISO 27001 Debug - findSubclauseInstance:", {
      subclauseId,
      found: !!instance,
      isTemporary: instance?.id?.startsWith("temp-"),
      assessmentSubclausesCount: assessment?.subclauses?.length || 0,
    });
    return instance;
  };

  const findAnnexInstance = (itemId: string) => {
    return assessment?.annexes.find((ann) => ann.item.itemId === itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading ISO 27001 Assessment...
          </p>
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
                  console.log('🔒 [ISO-27001] Back to Governance button clicked, releasing lock...');
                  try {
                    // Release lock if we have one
                    if (lockInfo?.hasLock && canEdit) {
                      console.log('🔒 [ISO-27001] Releasing EXCLUSIVE lock before navigation...');
                      await releaseLock();
                      console.log('🔒 [ISO-27001] Lock released successfully');
                    } else {
                      console.log('🔒 [ISO-27001] No exclusive lock to release');
                    }
                    
                    // Navigate back to governance
                    console.log('🔒 [ISO-27001] Navigating back to governance dashboard...');
                    router.push('/dashboard/governance');
                  } catch (error) {
                    console.error('🔒 [ISO-27001] Error releasing lock during navigation:', error);
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
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Assessment Progress
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Implement Information Security Management System requirements
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      assessment.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                        : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"
                    }
                  >
                    {assessment.status === "completed"
                      ? "Completed"
                      : "In Progress"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(assessment.progress)}% Complete</span>
                  </div>
                  <Progress value={assessment.progress} className="h-2" />
                  {/* Debug progress info */}
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <div>Progress Details:</div>
                    <div>
                      • Main Clauses:{" "}
                      {clauses.reduce(
                        (total, clause) => total + clause.subclauses.length,
                        0
                      )}{" "}
                      requirements
                    </div>
                    <div>
                      • Annex A:{" "}
                      {annexCategories.reduce(
                        (total, category) => total + category.items.length,
                        0
                      )}{" "}
                      controls
                    </div>
                    <div>
                      • Total:{" "}
                      {clauses.reduce(
                        (total, clause) => total + clause.subclauses.length,
                        0
                      ) +
                        annexCategories.reduce(
                          (total, category) => total + category.items.length,
                          0
                        )}{" "}
                      items
                    </div>
                    <div>
                      • Completed:{" "}
                      {assessment.subclauses.filter((sc) =>
                        sc.implementation?.trim()
                      ).length +
                        assessment.annexes.filter((ann) =>
                          ann.implementation?.trim()
                        ).length}{" "}
                      items
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
                  onClick={() => setActiveTab("clauses")}
                  className={`${
                    activeTab === "clauses"
                      ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  } px-4 py-2 rounded-lg border font-medium text-sm transition-colors flex items-center gap-2`}
                >
                  <div className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {clauses.length}
                  </div>
                  Main Clauses
                  <span className="text-xs opacity-75">
                    (
                    {clauses.reduce(
                      (total, clause) => total + clause.subclauses.length,
                      0
                    )}{" "}
                    requirements)
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("annex")}
                  className={`${
                    activeTab === "annex"
                      ? "bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-700"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  } px-4 py-2 rounded-lg border font-medium text-sm transition-colors flex items-center gap-2`}
                >
                  <div className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {annexCategories.length}
                  </div>
                  Annex A Controls
                  <span className="text-xs opacity-75">
                    (
                    {annexCategories.reduce(
                      (total, category) => total + category.items.length,
                      0
                    )}{" "}
                    controls)
                  </span>
                </button>
              </nav>
            </div>

            {/* Tab Content Header */}
            <div className="px-6 py-4 bg-muted/50">
              {activeTab === "clauses" ? (
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/20 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      ISO 27001 Main Clauses
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Implement the core requirements of the Information Security
                      Management System standard
                    </p>
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-800 dark:text-gray-200">
                      <strong>How to edit:</strong> Click on any clause header
                      to expand it, then fill in the implementation details for
                      each subclause requirement.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 dark:bg-teal-900/20 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Annex A Control Objectives
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Additional controls to support the Information Security Management System
                      implementation
                    </p>
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-800 dark:text-gray-200">
                      <strong>How to edit:</strong> Click on any category header
                      to expand it, then fill in the implementation details for
                      each control objective.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Content */}
        <div className="space-y-6">
          {activeTab === "clauses" &&
            clauses.map((clause) => {
              const completedSubclauses = clause.subclauses.filter((sc) => {
                const instance = findSubclauseInstance(sc.subclauseId);
                return instance?.implementation?.trim();
              }).length;

              return (
                <Card
                  key={clause.id}
                  className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader
                    id={`clause-${clause.clauseId}`}
                    className={`cursor-pointer transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gradient-to-r from-emerald-950/30 to-emerald-900/30 hover:from-emerald-950/50 hover:to-emerald-900/50"
                        : "bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200"
                    }`}
                    onClick={() => toggleClause(clause.clauseId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg">
                          {clause.clauseId}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <CardTitle className="text-lg text-foreground">
                              {clause.title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                                {clause.subclauses.length} requirements
                              </span>
                              {completedSubclauses > 0 && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                                  {completedSubclauses} completed
                                </span>
                              )}
                            </div>
                          </div>
                          <CardDescription className="text-sm text-muted-foreground">
                            {clause.description}
                          </CardDescription>
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-32 bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      (completedSubclauses /
                                        clause.subclauses.length) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <span>
                                {Math.round(
                                  (completedSubclauses /
                                    clause.subclauses.length) *
                                    100
                                )}
                                % complete
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedClauses.has(clause.clauseId) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedClauses.has(clause.clauseId) && (
                    <CardContent className="p-0">
                      {clause.subclauses.map((subclause, index) => {
                        const instance = findSubclauseInstance(
                          subclause.subclauseId
                        );
                        const isCompleted = !!instance?.implementation?.trim();

                        return (
                          <div
                            key={subclause.id}
                            className="border-t border-border last:border-b"
                          >
                            <div className="p-6 hover:bg-muted/50 transition-colors">
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0">
                                    <div
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                        isCompleted
                                          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                      }`}
                                    >
                                      {subclause.subclauseId}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getStatusIcon(
                                        instance?.status || "pending",
                                        isCompleted
                                      )}
                                      <h4 className="font-semibold text-foreground text-base">
                                        {subclause.title}
                                      </h4>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          isCompleted
                                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {isCompleted ? "Completed" : "Pending"}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                      {subclause.summary}
                                    </p>

                                    {subclause.questions.length > 0 && (
                                      <div className="mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                          <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                                            <div className="w-4 h-4 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs">
                                                ?
                                              </span>
                                            </div>
                                            Key Questions to Consider:
                                          </h5>
                                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                            {subclause.questions.map(
                                              (question, idx) => (
                                                <li
                                                  key={idx}
                                                  className="flex items-start gap-2"
                                                >
                                                  <span className="text-blue-600 dark:text-blue-400 mt-1">
                                                    •
                                                  </span>
                                                  <span>{question}</span>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      </div>
                                    )}

                                    {subclause.evidenceExamples.length > 0 && (
                                      <div className="mb-4">
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                          <h5 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-amber-600" />
                                            Evidence Examples:
                                          </h5>
                                          <ul className="text-sm text-amber-800 space-y-1">
                                            {subclause.evidenceExamples.map(
                                              (example, idx) => (
                                                <li
                                                  key={idx}
                                                  className="flex items-start gap-2"
                                                >
                                                  <span className="text-amber-600 mt-1">
                                                    •
                                                  </span>
                                                  <span>{example}</span>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      </div>
                                    )}

                                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                                      <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                          Implementation Details
                                          <span className="ml-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                                            Editable
                                          </span>
                                        </label>
                                        <textarea
                                          value={instance?.implementation || ""}
                                          onChange={(e) => {
                                            console.log(
                                              "ISO 27001 Debug - Textarea onChange:",
                                              {
                                                subclauseId:
                                                  subclause.subclauseId,
                                                value: e.target.value,
                                                instanceExists: !!instance,
                                              }
                                            );
                                            handleSubclauseImplementationChange(
                                              subclause.subclauseId,
                                              e.target.value
                                            );
                                          }}
                                          onFocus={() => {
                                            console.log(
                                              "ISO 27001 Debug - Textarea onFocus:",
                                              {
                                                subclauseId:
                                                  subclause.subclauseId,
                                                instanceExists: !!instance,
                                                currentValue:
                                                  instance?.implementation ||
                                                  "",
                                              }
                                            );
                                          }}
                                          placeholder={canEdit ? `Describe how this requirement is implemented in your organization...

• What processes are in place?
• Who is responsible?
• What documentation exists?
• How is compliance monitored?` : "Assessment is locked by another user"}
                                          className="w-full p-3 border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                          rows={5}
                                          disabled={!canEdit}
                                        />
                                      </div>

                                      <div className="mt-4">
                                        <div className="relative">
                                          <FileUpload
                                            label="Evidence Files"
                                            value={
                                              instance?.evidenceFiles || []
                                            }
                                            onChange={(files) =>
                                              handleSubclauseEvidenceChange(
                                                subclause.subclauseId,
                                                files
                                              )
                                            }
                                            maxFiles={5}
                                            maxSize={10}
                                            disabled={!canEdit || savingFiles.has(
                                              `subclause-${subclause.subclauseId}`
                                            )}
                                            useCaseId={
                                              params.useCaseId as string
                                            }
                                            frameworkType="iso-27001"
                                          />
                                          {savingFiles.has(
                                            `subclause-${subclause.subclauseId}`
                                          ) && (
                                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                              Saving...
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <div className="flex items-center gap-4">
                                          <div className="text-xs text-muted-foreground">
                                            {instance?.implementation?.length ||
                                              0}{" "}
                                            characters
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() =>
                                            handleSaveSubclause(
                                              subclause.subclauseId
                                            )
                                          }
                                          disabled={!canEdit || saving}
                                          size="sm"
                                          className={`flex items-center gap-2 transition-colors ${
                                            isCompleted
                                              ? "bg-green-600 hover:bg-green-700"
                                              : "bg-emerald-600 hover:bg-emerald-700"
                                          }`}
                                        >
                                          <Save className="w-4 h-4" />
                                          {saving ? "Saving..." : "Save"}
                                        </Button>
                                      </div>
                                    </div>
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
              );
            })}

          {activeTab === "annex" &&
            annexCategories.map((category) => {
              const completedItems = category.items.filter((item) => {
                const instance = findAnnexInstance(item.itemId);
                return instance?.implementation?.trim();
              }).length;

              return (
                <Card
                  key={category.id}
                  className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader
                    id={`category-${category.categoryId}`}
                    className={`cursor-pointer transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gradient-to-r from-teal-950/30 to-teal-900/30 hover:from-teal-950/50 hover:to-teal-900/50"
                        : "bg-gradient-to-r from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200"
                    }`}
                    onClick={() => toggleCategory(category.categoryId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-xl w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg">
                          {category.categoryId.replace("A.", "")}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <CardTitle className="text-lg text-foreground">
                              {category.title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-full font-medium">
                                {category.items.length} controls
                              </span>
                              {completedItems > 0 && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                                  {completedItems} completed
                                </span>
                              )}
                            </div>
                          </div>
                          <CardDescription className="text-sm text-muted-foreground">
                            {category.description}
                          </CardDescription>
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-32 bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      (completedItems / category.items.length) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <span>
                                {Math.round(
                                  (completedItems / category.items.length) * 100
                                )}
                                % complete
                              </span>
                            </div>
                          </div>
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
                      {category.items.map((item, index) => {
                        const instance = findAnnexInstance(item.itemId);
                        const isCompleted = !!instance?.implementation?.trim();

                        return (
                          <div
                            key={item.id}
                            className="border-t border-border last:border-b"
                          >
                            <div className="p-6 hover:bg-muted/50 transition-colors">
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0">
                                    <div
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                                        isCompleted
                                          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                      }`}
                                    >
                                      {item.itemId.split(".").pop()}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getStatusIcon(
                                        instance?.status || "pending",
                                        isCompleted
                                      )}
                                      <h4 className="font-semibold text-foreground text-base">
                                        {item.title}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-muted"
                                      >
                                        {item.itemId}
                                      </Badge>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          isCompleted
                                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {isCompleted ? "Completed" : "Pending"}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                      {item.description}
                                    </p>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                                      <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs">
                                            i
                                          </span>
                                        </div>
                                        Implementation Guidance:
                                      </h5>
                                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                        {item.guidance}
                                      </p>
                                    </div>

                                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                                      <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                          Implementation Details
                                        </label>
                                        <textarea
                                          value={instance?.implementation || ""}
                                          onChange={(e) =>
                                            handleAnnexImplementationChange(
                                              item.itemId,
                                              e.target.value
                                            )
                                          }
                                          placeholder={canEdit ? `Describe how this control is implemented in your organization...

• What specific measures are in place?
• Who is responsible for this control?
• What processes and procedures exist?
• How is effectiveness monitored?` : "Assessment is locked by another user"}
                                          className="w-full p-3 border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                          rows={5}
                                          disabled={!canEdit}
                                        />
                                      </div>

                                      <div className="mt-4">
                                        <div className="relative">
                                          <FileUpload
                                            label="Evidence Files"
                                            value={
                                              instance?.evidenceFiles || []
                                            }
                                            onChange={(files) =>
                                              handleAnnexEvidenceChange(
                                                item.itemId,
                                                files
                                              )
                                            }
                                            maxFiles={5}
                                            maxSize={10}
                                            disabled={!canEdit}
                                            useCaseId={
                                              params.useCaseId as string
                                            }
                                            frameworkType="iso-27001"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <div className="flex items-center gap-4">
                                          <div className="text-xs text-muted-foreground">
                                            {instance?.implementation?.length ||
                                              0}{" "}
                                            characters
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() =>
                                            handleSaveAnnex(item.itemId)
                                          }
                                          disabled={!canEdit || saving}
                                          size="sm"
                                          className={`flex items-center gap-2 transition-colors ${
                                            isCompleted
                                              ? "bg-green-600 hover:bg-green-700"
                                              : "bg-teal-600 hover:bg-teal-700"
                                          }`}
                                        >
                                          <Save className="w-4 h-4" />
                                          {saving ? "Saving..." : "Save"}
                                        </Button>
                                      </div>
                                    </div>
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
              );
            })}
        </div>
      </div>

      {/* Lock Management Modal */}
      <GovernanceLockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        lockInfo={lockInfo}
        framework="GOVERNANCE_ISO_27001"
        useCaseId={useCaseId}
        useCaseName={`AIUC-${useCaseId}`}
        onAcquireLock={() => acquireLock()}
        onReleaseLock={() => releaseLock()}
        loading={lockLoading}
      />
    </div>
  );
}