"use client";
import React, { useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import { ChartRadarDots } from "@/components/ui/radar-chart";
import { ApprovalsRiskSummary } from "@/components/ui/approvals-risk-summary"
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { AlertTriangle, CheckCircle2, XCircle, Plus, X } from "lucide-react";
import { useUserData } from "@/contexts/UserContext";

// Conditions Component - simplified to allow adding, editing, and removing conditions
// Conditions are saved when "Save Draft" or "Complete Assessment" is clicked
interface ConditionsSectionProps {
  conditions: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
  disabled: boolean;
  useCaseId: string;
  conditionFieldName: string; // e.g., "governanceConditions", "riskConditions", etc.
}

const ConditionsSection = React.memo(({ 
  conditions, 
  onAdd, 
  onRemove, 
  onUpdate, 
  disabled,
  useCaseId,
  conditionFieldName
}: ConditionsSectionProps) => {
  // Local state - completely independent
  const [localValues, setLocalValues] = React.useState<string[]>(conditions);
  const onUpdateRef = React.useRef(onUpdate);
  const focusedIndexRef = React.useRef<number | null>(null);
  const isInternalUpdateRef = React.useRef(false);

  // Keep callback ref updated
  React.useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Sync local state only when conditions change externally
  React.useEffect(() => {
    // Don't sync if we're currently updating internally or if any input is focused
    if (!isInternalUpdateRef.current && focusedIndexRef.current === null) {
      setLocalValues(prev => {
        // Check if length changed
        if (conditions.length !== prev.length) {
          return [...conditions];
        }
        // Check if any values differ
        const hasChanges = conditions.some((val, idx) => val !== prev[idx]);
        if (hasChanges) {
          return [...conditions];
        }
        return prev;
      });
    }
  }, [conditions]);

  // Handle input change - only update local and parent state, no auto-save
  const handleChange = React.useCallback((index: number, value: string) => {
    isInternalUpdateRef.current = true;
    
    // Update local state immediately
    setLocalValues(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      
      // Schedule parent update after render (not during render)
      setTimeout(() => {
        onUpdateRef.current(index, value);
        isInternalUpdateRef.current = false;
      }, 0);
      
      return newValues;
    });
  }, []);

  // Handle focus
  const handleFocus = React.useCallback((index: number) => {
    focusedIndexRef.current = index;
  }, []);

  // Handle blur - just update parent state, no save
  const handleBlur = React.useCallback((index: number) => {
    focusedIndexRef.current = null;
    const value = localValues[index] || '';
    
    // Update parent state only (no auto-save)
    setTimeout(() => {
      onUpdateRef.current(index, value);
    }, 0);
  }, [localValues]);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="mb-3">
        <Label className="text-sm font-semibold text-foreground mb-1 block">Conditions</Label>
      </div>
      <div className="space-y-2">
        {localValues.map((condition, index) => (
          <div key={`condition-${index}`} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={localValues[index] || ''}
                onChange={(e) => handleChange(index, e.target.value)}
                onFocus={() => handleFocus(index)}
                onBlur={() => handleBlur(index)}
                placeholder={`Condition ${index + 1}`}
                disabled={disabled}
                className="flex-1"
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (focusedIndexRef.current === index) {
                  focusedIndexRef.current = null;
                }
                // Remove from local state
                const newValues = localValues.filter((_, i) => i !== index);
                setLocalValues(newValues);
                onRemove(index);
              }}
              disabled={disabled}
              className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label={`Remove condition ${index + 1}`}
              title="Remove condition"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newValues = [...localValues, ""];
            setLocalValues(newValues);
            onAdd();
          }}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>
    </div>
  );
});

ConditionsSection.displayName = 'ConditionsSection';

interface QnAProps {
  id: any;
  text: any;
  stage: any;
  type: any;
  options: OptionProps[];
  answers: AnswerProps[];
}

interface OptionProps {
  id: string;
  text: string;
  questionId: string;
}

interface AnswerProps {
  id: string;
  value: any;
  questionId: string;
}

const statusOptions = ["Approved", "Rejected", "Pending"];
const businessFunctions = [
  'Sales',
  'Marketing',
  'Product Development',
  'Operations',
  'Customer Support',
  'HR',
  'Finance',
  'IT',
  'Legal',
  'Procurement',
  'Facilities',
  'Strategy',
  'Communications',
  'Risk & Audit',
  'Innovation Office',
  'ESG',
  'Data Office',
  'PMO'
];

interface Risk {
  id: string;
  category: string;
  title?: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  likelihood?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';
  riskScore: number;
  description: string;
  mitigationPlan?: string;
  mitigationStrategy?: string;
  createdAt: string;
  updatedAt: string;
  sourceType?: string;
  sourceId?: string;
}

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'Critical':
      return 'bg-red-500 text-white';
    case 'High':
      return 'bg-orange-500 text-white';
    case 'Medium':
      return 'bg-yellow-500 text-white';
    case 'Low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'CLOSED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const getAnswer = (qnAData: QnAProps[] | null, stage: string, text: string) => {
  if (!qnAData || !Array.isArray(qnAData)) {
    // console.log(`[getAnswer] qnAData is null or not an array for "${text}"`);
    return null;
  }
  
  const q = qnAData.find(q => q.stage === stage && q.text === text);
  
  if (!q) {
    // console.log(`[getAnswer] ❌ Question NOT FOUND - Stage: "${stage}", Text: "${text}"`);
    // Show similar questions in this stage to help debug
    const stageQuestions = qnAData.filter(q => q.stage === stage);
    if (stageQuestions.length > 0) {
      // console.log(`  Available questions in ${stage}:`, stageQuestions.slice(0, 5).map(q => q.text));
    }
    return null;
  }
  
  if (!q.answers || q.answers.length === 0) {
    // console.log(`[getAnswer] ✓ Question FOUND but NO ANSWERS - Stage: "${stage}", Text: "${text}", Type: ${q.type}`);
    return null;
  }
  
  const val = q.answers.map(a => a.value).filter(Boolean);
  
  // For multi-select types (CHECKBOX, TEXT, TEXT_MINI), return array of all values
  // For single-select types (RADIO, SELECT, SLIDER), return single value
  const result = (q.type === 'CHECKBOX' || q.type === 'TEXT' || q.type === 'TEXT_MINI') ? val : val[0];
  
  console.log(`[getAnswer] ✓✓ Question FOUND with ANSWERS - "${text}" [${q.type}]:`, result);
  return result;
};

interface ApprovalsPageProps {
  useCase?: {
    title?: string;
    department?: string;
    owner?: string;
    aiucId?: number;
    stage?: string;
    organizationId?: string;
    problemStatement?: string;
    proposedAISolution?: string;
    requirementsReviewStatus?: string | null;
    technicalReviewStatus?: string | null;
    businessReviewStatus?: string | null;
    responsibleEthicalReviewStatus?: string | null;
    legalRegulatoryReviewStatus?: string | null;
    dataReadinessReviewStatus?: string | null;
    finopsReviewStatus?: string | null;
    governanceApprover?: string | null;
    riskApprover?: string | null;
    legalApprover?: string | null;
    businessOwner?: string | null;
  };
}

const ApprovalsPage = forwardRef<any, ApprovalsPageProps>(({ useCase }, ref) => {
  const params = useParams();
  const useCaseId = params.useCaseId as string;
  const router = useRouter();
  const { userData } = useUserData();

  // Debug: Log useCase and userData when they change
  useEffect(() => {
    console.log('[ApprovalsPage] useCase data:', {
      governanceApprover: useCase?.governanceApprover,
      riskApprover: useCase?.riskApprover,
      legalApprover: useCase?.legalApprover,
      businessOwner: useCase?.businessOwner,
      fullUseCase: useCase
    });
    console.log('[ApprovalsPage] userData:', {
      id: userData?.id,
      email: userData?.email,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      role: userData?.role
    });
  }, [useCase, userData]);
  const [form, setForm] = useState({
    governanceName: "",
    governanceStatus: "",
    governanceComment: "",
    governanceRating: 0,
    governanceConditions: [] as string[],
    riskName: "",
    riskStatus: "",
    riskComment: "",
    riskRating: 0,
    riskConditions: [] as string[],
    legalName: "",
    legalStatus: "",
    legalComment: "",
    legalRating: 0,
    legalConditions: [] as string[],
    businessFunction: "",
    businessName: "",
    businessStatus: "",
    businessComment: "",
    businessRating: 0,
    businessConditions: [] as string[],
    finalQualification: "",
    // AI-specific approval fields
    aiGovernanceName: "",
    aiGovernanceStatus: "",
    aiGovernanceComment: "",
    aiGovernanceRating: 0,
    aiGovernanceConditions: [] as string[],
    modelValidationName: "",
    modelValidationStatus: "",
    modelValidationComment: "",
    modelValidationRating: 0,
    modelValidationConditions: [] as string[],
    aiEthicsName: "",
    aiEthicsStatus: "",
    aiEthicsComment: "",
    aiEthicsRating: 0,
    aiEthicsConditions: [] as string[],
  });
  const [_loading, setLoading] = useState(false);
  const [_saving, setSaving] = useState(false);
  const [_error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Chart and financial data state
  const [chartData, setChartData] = useState<{ month: string; desktop: number }[]>([]);
  const [riskApi, setRiskApi] = useState<any>(null);
  const [finops, setFinops] = useState<any>(null);
  const [qnAData, setQnAData] = useState<any>(null);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<number, string>>({});

  // Helper function to check if current user is the approver for a section
  // Checks both the approver name (from form) and approver ID (from use case)
  const isCurrentUserApprover = useCallback((
    approverName: string | null | undefined, 
    approverId: string | null | undefined
  ): boolean => {
    // If userData is not loaded yet, return false (will be recalculated when data loads)
    if (!userData || !userData.id) {
      return false;
    }
    
    const userId = userData.id.trim();
    if (!userId) {
      return false;
    }
    
    // PRIMARY CHECK: If approver ID matches current user ID (most reliable)
    if (approverId && approverId.trim() !== '') {
      const approverIdTrimmed = approverId.trim();
      // Compare both as strings, case-insensitive
      const matches = approverIdTrimmed.toLowerCase() === userId.toLowerCase();
      if (matches) {
        console.log('[ApprovalsPage] ✅ ID match found:', { 
          approverId: approverIdTrimmed, 
          userId: userId,
          exactMatch: approverIdTrimmed === userId,
          caseInsensitiveMatch: true
        });
        return true;
      } else {
        console.log('[ApprovalsPage] ❌ ID mismatch:', { 
          approverId: approverIdTrimmed, 
          userId: userId, 
          exactMatch: approverIdTrimmed === userId,
          caseInsensitiveMatch: false,
          approverIdLength: approverIdTrimmed.length,
          userIdLength: userId.length
        });
        // If we have an approver ID and it doesn't match, don't check name - return false
        return false;
      }
    }
    
    // SECONDARY CHECK: Only check name if NO approver ID was provided
    // If approver name is provided, check if it matches current user
    if (approverName && approverName.trim() !== '') {
      const approverNameTrimmed = approverName.trim();
      const userEmail = (userData.email || '').toLowerCase();
      const userFullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim().toLowerCase();
      const userFirstName = (userData.firstName || '').toLowerCase();
      const userLastName = (userData.lastName || '').toLowerCase();
      const approverNameLower = approverNameTrimmed.toLowerCase();
      
      // Check if approver name is a user ID match
      if (approverNameTrimmed === userId) {
        return true;
      }
      
      // Check if approver name matches any of: full name, email, first name, last name
      if (approverNameLower === userFullName ||
          approverNameLower === userEmail ||
          approverNameLower === userFirstName ||
          approverNameLower === userLastName ||
          approverNameLower.includes(userEmail) ||
          userFullName.includes(approverNameLower) ||
          approverNameLower.includes(userFullName)) {
        return true;
      }
    }
    
    return false;
  }, [userData]);

  // Check if user is admin (can edit all sections)
  const isAdmin = useMemo(() => {
    return userData?.role === 'QZEN_ADMIN' || userData?.role === 'ORG_ADMIN';
  }, [userData?.role]);

  // Helper to check if a section can be edited by current user
  // NOTE: Only the assigned approver can edit - admins do NOT have special edit access
  const canEditSection = useCallback((
    approverName: string | null | undefined,
    approverId: string | null | undefined
  ): boolean => {
    // If userData is not loaded yet, don't allow editing (wait for data to load)
    if (!userData || !userData.id) {
      console.log('[ApprovalsPage] canEditSection: UserData not loaded, returning false');
      return false;
    }
    
    // Check if an approver is assigned
    const hasApprover = (approverName && approverName.trim() !== '') || (approverId && approverId.trim() !== '');
    
    // If no approver is set, only admins can edit (to set the approver)
    if (!hasApprover) {
      console.log('[ApprovalsPage] canEditSection: No approver set, only admins can edit');
      return false;
    }
    
    // Check if current user is the assigned approver
    const result = isCurrentUserApprover(approverName, approverId);
    console.log('[ApprovalsPage] canEditSection result:', {
      approverName: approverName || '(empty)',
      approverId: approverId || '(empty)',
      userId: userData.id,
      hasApproverId: !!approverId,
      hasApproverName: !!approverName,
      result,
      willAllowEdit: result
    });
    return result;
  }, [isCurrentUserApprover, userData]);

  // Compute edit permissions for each section - these update when userData or useCase changes
  // IMPORTANT: We prioritize the approver ID from useCase (most reliable), and only use form name as fallback if ID is not available
  // Use useMemo to ensure values are properly computed and cached
  const canEditGovernance = useMemo(() => {
    // If we have an approver ID, use that (most reliable). Only use name as fallback if no ID.
    const approverId = useCase?.governanceApprover || null;
    const approverName = approverId ? null : (form.governanceName || null);
    return canEditSection(approverName, approverId);
  }, [canEditSection, useCase?.governanceApprover, form.governanceName, userData?.id]);
  
  const canEditRisk = useMemo(() => {
    const approverId = useCase?.riskApprover || null;
    const approverName = approverId ? null : (form.riskName || null);
    return canEditSection(approverName, approverId);
  }, [canEditSection, useCase?.riskApprover, form.riskName, userData?.id]);
  
  const canEditLegal = useMemo(() => {
    const approverId = useCase?.legalApprover || null;
    const approverName = approverId ? null : (form.legalName || null);
    return canEditSection(approverName, approverId);
  }, [canEditSection, useCase?.legalApprover, form.legalName, userData?.id]);
  
  const canEditBusiness = useMemo(() => {
    const approverId = useCase?.businessOwner || null;
    const approverName = approverId ? null : (form.businessName || null);
    return canEditSection(approverName, approverId);
  }, [canEditSection, useCase?.businessOwner, form.businessName, userData?.id]);

  // Debug: Log edit permissions with detailed comparison
  useEffect(() => {
    if (userData?.id) {
      console.log('[ApprovalsPage] 🔍 Detailed Edit Permission Check:', {
        userId: userData.id,
        userEmail: userData.email,
        userRole: userData.role,
        isAdmin: isAdmin,
        permissions: {
          governance: {
            canEdit: canEditGovernance,
            approverId: useCase?.governanceApprover,
            approverIdMatches: useCase?.governanceApprover?.toLowerCase() === userData.id.toLowerCase(),
            formName: form.governanceName
          },
          risk: {
            canEdit: canEditRisk,
            approverId: useCase?.riskApprover,
            approverIdMatches: useCase?.riskApprover?.toLowerCase() === userData.id.toLowerCase(),
            formName: form.riskName
          },
          legal: {
            canEdit: canEditLegal,
            approverId: useCase?.legalApprover,
            approverIdMatches: useCase?.legalApprover?.toLowerCase() === userData.id.toLowerCase(),
            formName: form.legalName
          },
          business: {
            canEdit: canEditBusiness,
            approverId: useCase?.businessOwner,
            approverIdMatches: useCase?.businessOwner?.toLowerCase() === userData.id.toLowerCase(),
            formName: form.businessName
          }
        }
      });
    }
  }, [canEditGovernance, canEditRisk, canEditLegal, canEditBusiness, userData, useCase, form, isAdmin]);
  
  // Debug: Log edit permissions for all sections
  useEffect(() => {
    if (userData?.id) {
      console.log('[ApprovalsPage] 📊 Edit Permissions Summary:', {
        userId: userData.id,
        userEmail: userData.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        isAdmin,
        governance: {
          canEdit: canEditGovernance,
          approverId: useCase?.governanceApprover || '(not set)',
          approverName: form.governanceName || '(not set)',
          idMatch: useCase?.governanceApprover?.toLowerCase() === userData.id.toLowerCase(),
          hasApprover: !!(useCase?.governanceApprover || form.governanceName)
        },
        risk: {
          canEdit: canEditRisk,
          approverId: useCase?.riskApprover || '(not set)',
          approverName: form.riskName || '(not set)',
          idMatch: useCase?.riskApprover?.toLowerCase() === userData.id.toLowerCase(),
          hasApprover: !!(useCase?.riskApprover || form.riskName)
        },
        legal: {
          canEdit: canEditLegal,
          approverId: useCase?.legalApprover || '(not set)',
          approverName: form.legalName || '(not set)',
          idMatch: useCase?.legalApprover?.toLowerCase() === userData.id.toLowerCase(),
          hasApprover: !!(useCase?.legalApprover || form.legalName)
        },
        business: {
          canEdit: canEditBusiness,
          approverId: useCase?.businessOwner || '(not set)',
          approverName: form.businessName || '(not set)',
          idMatch: useCase?.businessOwner?.toLowerCase() === userData.id.toLowerCase(),
          hasApprover: !!(useCase?.businessOwner || form.businessName)
        }
      });
    }
  }, [canEditGovernance, canEditRisk, canEditLegal, canEditBusiness, userData, isAdmin, useCase, form]);
  
  const canEditAIGovernance = useMemo(() => 
    canEditSection(form.aiGovernanceName, null),
    [canEditSection, form.aiGovernanceName]
  );
  
  const canEditModelValidation = useMemo(() => 
    canEditSection(form.modelValidationName, null),
    [canEditSection, form.modelValidationName]
  );
  
  const canEditAIEthics = useMemo(() => 
    canEditSection(form.aiEthicsName, null),
    [canEditSection, form.aiEthicsName]
  );

  const assessmentStages = [
    { id: 0, name: 'Requirements', status: useCase?.requirementsReviewStatus },
    { id: 1, name: 'Technical', status: useCase?.technicalReviewStatus },
    { id: 2, name: 'Business', status: useCase?.businessReviewStatus },
    { id: 3, name: 'Responsible / Ethical', status: useCase?.responsibleEthicalReviewStatus },
    { id: 4, name: 'Legal & Regulatory', status: useCase?.legalRegulatoryReviewStatus },
    { id: 5, name: 'Data Readiness', status: useCase?.dataReadinessReviewStatus },
    { id: 6, name: 'FinOps Assessment', status: useCase?.finopsReviewStatus },
  ];


  const getStatusBadge = (status: string | null | undefined, reviewerName?: string) => {
    const reviewStatus = status || 'NOT_READY_FOR_REVIEW';
    if (reviewStatus === 'READY_FOR_REVIEW') {
      return (
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            READY FOR REVIEW
          </Badge>
          {reviewerName && (
            <span className="text-xs text-muted-foreground">Reviewed by: {reviewerName}</span>
          )}
        </div>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        NOT READY FOR REVIEW
      </Badge>
    );
  };

  // Fetch financial data
  useEffect(() => {
    if (!useCaseId) 
      return;
    fetch(`/api/get-finops?id=${useCaseId}&_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setFinops(data[0]);
      });
  }, [useCaseId]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Use different API based on whether the USE CASE belongs to an organization
        // This allows QZEN_ADMIN to access both org and non-org use cases appropriately
        const useCaseHasOrg = !!useCase?.organizationId;
        const apiEndpoint = useCaseHasOrg 
          ? `/api/get-assess-questions?useCaseId=${useCaseId}`
          : `/api/get-assess-question-templates?useCaseId=${useCaseId}`;
        
        console.log('[ApprovalsPage] Fetching questions from:', apiEndpoint, { 
          useCaseHasOrg, 
          organizationId: useCase?.organizationId 
        });
        
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        
        console.log('[ApprovalsPage] Fetched questions data:', data);
        
        // Debug: Log all questions to see structure
        if (Array.isArray(data) && data.length > 0) {
          console.log('[ApprovalsPage] All questions by stage:');
          const stages = [...new Set(data.map((q: any) => q.stage))];
          stages.forEach(stage => {
            const stageQuestions = data.filter((q: any) => q.stage === stage);
            console.log(`\n${stage} (${stageQuestions.length} questions):`);
            stageQuestions.forEach((q: any) => {
              console.log(`  - "${q.text}" [${q.type}]`);
            });
          });
        }
        
        setQnAData(data);
        
      } catch (error) {
        console.error('[ApprovalsPage] Error fetching questions:', error);
      }
    };

    // Only fetch questions once we have loaded the use case
    if (useCaseId && useCase) {
      fetchQuestions();
    }
  }, [useCaseId, useCase]);

  // Fetch risks for this use case
  useEffect(() => {
    if (!useCaseId) return;
    (async () => {
      try {
        const res = await fetch(`/api/risks/${useCaseId}`);
        if (res.ok) {
          const risksData = await res.json();
          setRisks(Array.isArray(risksData) ? risksData : []);
        }
      } catch (error) {
        console.error('[ApprovalsPage] Error fetching risks:', error);
        setRisks([]);
      }
    })();
  }, [useCaseId]);

  // Track if form has been initialized to prevent overwriting user input (use ref to avoid re-renders)
  const formInitializedRef = useRef(false);

  useEffect(() => {
    if (!useCaseId || formInitializedRef.current) return;
    setLoading(true);
    fetch(`/api/read-approvals?useCaseId=${useCaseId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('[ApprovalsPage] Loaded approval data from API:', {
          hasData: !!data,
          conditions: data ? {
            governance: data.governanceConditions,
            risk: data.riskConditions,
            legal: data.legalConditions,
            business: data.businessConditions,
            aiGovernance: data.aiGovernanceConditions,
            modelValidation: data.modelValidationConditions,
            aiEthics: data.aiEthicsConditions,
          } : null
        });
        
        if (data) {
          // Normalize all values to ensure they're never null/undefined (prevents controlled/uncontrolled input errors)
          // Also auto-fill approver names from useCase if not in approval data
          setForm(prev => {
            const normalizedForm = {
              ...prev,
              governanceName: data.governanceName || prev.governanceName || useCase?.governanceApprover || "",
              governanceStatus: data.governanceStatus || prev.governanceStatus || "",
              governanceComment: data.governanceComment || prev.governanceComment || "",
              governanceRating: data.governanceRating ?? prev.governanceRating ?? 0,
              governanceConditions: Array.isArray(data.governanceConditions) ? data.governanceConditions : (prev.governanceConditions || []),
              riskName: data.riskName || prev.riskName || useCase?.riskApprover || "",
              riskStatus: data.riskStatus || prev.riskStatus || "",
              riskComment: data.riskComment || prev.riskComment || "",
              riskRating: data.riskRating ?? prev.riskRating ?? 0,
              riskConditions: Array.isArray(data.riskConditions) ? data.riskConditions : (prev.riskConditions || []),
              legalName: data.legalName || prev.legalName || useCase?.legalApprover || "",
              legalStatus: data.legalStatus || prev.legalStatus || "",
              legalComment: data.legalComment || prev.legalComment || "",
              legalRating: data.legalRating ?? prev.legalRating ?? 0,
              legalConditions: Array.isArray(data.legalConditions) ? data.legalConditions : (prev.legalConditions || []),
              businessFunction: data.businessFunction || prev.businessFunction || "",
              businessName: data.businessName || prev.businessName || useCase?.businessOwner || "",
              businessStatus: data.businessStatus || prev.businessStatus || "",
              businessComment: data.businessComment || prev.businessComment || "",
              businessRating: data.businessRating ?? prev.businessRating ?? 0,
              businessConditions: Array.isArray(data.businessConditions) ? data.businessConditions : (prev.businessConditions || []),
              aiGovernanceName: data.aiGovernanceName || prev.aiGovernanceName || "",
              aiGovernanceStatus: data.aiGovernanceStatus || prev.aiGovernanceStatus || "",
              aiGovernanceComment: data.aiGovernanceComment || prev.aiGovernanceComment || "",
              aiGovernanceRating: data.aiGovernanceRating ?? prev.aiGovernanceRating ?? 0,
              aiGovernanceConditions: Array.isArray(data.aiGovernanceConditions) ? data.aiGovernanceConditions : (prev.aiGovernanceConditions || []),
              modelValidationName: data.modelValidationName || prev.modelValidationName || "",
              modelValidationStatus: data.modelValidationStatus || prev.modelValidationStatus || "",
              modelValidationComment: data.modelValidationComment || prev.modelValidationComment || "",
              modelValidationRating: data.modelValidationRating ?? prev.modelValidationRating ?? 0,
              modelValidationConditions: Array.isArray(data.modelValidationConditions) ? data.modelValidationConditions : (prev.modelValidationConditions || []),
              aiEthicsName: data.aiEthicsName || prev.aiEthicsName || "",
              aiEthicsStatus: data.aiEthicsStatus || prev.aiEthicsStatus || "",
              aiEthicsComment: data.aiEthicsComment || prev.aiEthicsComment || "",
              aiEthicsRating: data.aiEthicsRating ?? prev.aiEthicsRating ?? 0,
              aiEthicsConditions: Array.isArray(data.aiEthicsConditions) ? data.aiEthicsConditions : (prev.aiEthicsConditions || []),
            };
            
            console.log('[ApprovalsPage] Setting form with normalized conditions:', {
              governance: normalizedForm.governanceConditions,
              risk: normalizedForm.riskConditions,
              legal: normalizedForm.legalConditions,
              business: normalizedForm.businessConditions,
              aiGovernance: normalizedForm.aiGovernanceConditions,
              modelValidation: normalizedForm.modelValidationConditions,
              aiEthics: normalizedForm.aiEthicsConditions,
            });
            
            return normalizedForm;
          });
        } else {
          // If no approval data exists, auto-fill from useCase only if form is empty
          setForm(prev => ({
            ...prev,
            governanceName: prev.governanceName || useCase?.governanceApprover || "",
            riskName: prev.riskName || useCase?.riskApprover || "",
            legalName: prev.legalName || useCase?.legalApprover || "",
            businessName: prev.businessName || useCase?.businessOwner || "",
          }));
        }
        formInitializedRef.current = true;
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [useCaseId, useCase]);


  // Helper function to fetch user name from user ID
  const fetchUserName = useCallback(async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return "";
    
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const firstName = data.user?.firstName || "";
        const lastName = data.user?.lastName || "";
        const email = data.user?.email || "";
        
        // Return full name if available, otherwise email, otherwise empty
        if (firstName || lastName) {
          return `${firstName} ${lastName}`.trim();
        }
        return email;
      }
    } catch (error) {
      console.error(`[ApprovalsPage] Error fetching user ${userId}:`, error);
    }
    return "";
  }, []);

  // Auto-fill approver names from useCase (fetch actual user names from IDs)
  // Only run once when form is initialized, not on every form change
  useEffect(() => {
    if (!useCase || !formInitializedRef.current) return;
    
    const fetchAndSetNames = async () => {
      const updates: any = {};
      
      // Helper to check if a value looks like a UUID (approver ID)
      const isUUID = (value: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
      };
      
      // Always fetch names when approver IDs are present
      // Replace form value if it's empty, is a UUID, or matches the approver ID
      if (useCase.governanceApprover) {
        const currentValue = form.governanceName || '';
        if (!currentValue || isUUID(currentValue) || currentValue === useCase.governanceApprover) {
          const name = await fetchUserName(useCase.governanceApprover);
          if (name) updates.governanceName = name;
        }
      }
      if (useCase.riskApprover) {
        const currentValue = form.riskName || '';
        if (!currentValue || isUUID(currentValue) || currentValue === useCase.riskApprover) {
          const name = await fetchUserName(useCase.riskApprover);
          if (name) updates.riskName = name;
        }
      }
      if (useCase.legalApprover) {
        const currentValue = form.legalName || '';
        if (!currentValue || isUUID(currentValue) || currentValue === useCase.legalApprover) {
          const name = await fetchUserName(useCase.legalApprover);
          if (name) updates.legalName = name;
        }
      }
      if (useCase.businessOwner) {
        const currentValue = form.businessName || '';
        if (!currentValue || isUUID(currentValue) || currentValue === useCase.businessOwner) {
          const name = await fetchUserName(useCase.businessOwner);
          if (name) updates.businessName = name;
        }
      }
      
      // Update form with fetched names
      if (Object.keys(updates).length > 0) {
        console.log('[ApprovalsPage] Auto-filling approver names:', updates);
        setForm(prev => ({ ...prev, ...updates }));
      }
    };
    
    fetchAndSetNames();
  }, [useCase, fetchUserName, form.governanceName, form.riskName, form.legalName, form.businessName]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      // Get the latest form state to ensure we have all updates
      const formDataToSave = {
        useCaseId,
        ...form,
        // Explicitly ensure all condition arrays are arrays
        governanceConditions: Array.isArray(form.governanceConditions) ? form.governanceConditions.filter(c => c && c.trim() !== '') : [],
        riskConditions: Array.isArray(form.riskConditions) ? form.riskConditions.filter(c => c && c.trim() !== '') : [],
        legalConditions: Array.isArray(form.legalConditions) ? form.legalConditions.filter(c => c && c.trim() !== '') : [],
        businessConditions: Array.isArray(form.businessConditions) ? form.businessConditions.filter(c => c && c.trim() !== '') : [],
        aiGovernanceConditions: Array.isArray(form.aiGovernanceConditions) ? form.aiGovernanceConditions.filter(c => c && c.trim() !== '') : [],
        modelValidationConditions: Array.isArray(form.modelValidationConditions) ? form.modelValidationConditions.filter(c => c && c.trim() !== '') : [],
        aiEthicsConditions: Array.isArray(form.aiEthicsConditions) ? form.aiEthicsConditions.filter(c => c && c.trim() !== '') : [],
      };
      
      // Log what we're saving
      console.log('[ApprovalsPage] Saving form data:', {
        useCaseId,
        conditions: {
          governance: formDataToSave.governanceConditions,
          risk: formDataToSave.riskConditions,
          legal: formDataToSave.legalConditions,
          business: formDataToSave.businessConditions,
          aiGovernance: formDataToSave.aiGovernanceConditions,
          modelValidation: formDataToSave.modelValidationConditions,
          aiEthics: formDataToSave.aiEthicsConditions,
        }
      });
      
      const response = await fetch("/api/write-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToSave),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const savedData = await response.json();
      console.log('[ApprovalsPage] Save successful:', {
        savedConditions: {
          governance: savedData.governanceConditions,
          risk: savedData.riskConditions,
          legal: savedData.legalConditions,
          business: savedData.businessConditions,
          aiGovernance: savedData.aiGovernanceConditions,
          modelValidation: savedData.modelValidationConditions,
          aiEthics: savedData.aiEthicsConditions,
        }
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('[ApprovalsPage] Save error:', error);
      setError(error.message || "Failed to save");
      setTimeout(() => setError("") , 3000);
    }
    setSaving(false);
  };

  // Section-specific saving states
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionSuccess, setSectionSuccess] = useState<string | null>(null);

  // Save individual section
  const handleSaveSection = async (section: 'governance' | 'risk' | 'legal' | 'business') => {
    setSavingSection(section);
    setError("");
    try {
      const sectionData: Record<string, any> = { useCaseId };
      
      if (section === 'governance') {
        sectionData.governanceName = form.governanceName;
        sectionData.governanceStatus = form.governanceStatus;
        sectionData.governanceComment = form.governanceComment;
        sectionData.governanceConditions = Array.isArray(form.governanceConditions) ? form.governanceConditions.filter(c => c && c.trim() !== '') : [];
      } else if (section === 'risk') {
        sectionData.riskName = form.riskName;
        sectionData.riskStatus = form.riskStatus;
        sectionData.riskComment = form.riskComment;
        sectionData.riskConditions = Array.isArray(form.riskConditions) ? form.riskConditions.filter(c => c && c.trim() !== '') : [];
      } else if (section === 'legal') {
        sectionData.legalName = form.legalName;
        sectionData.legalStatus = form.legalStatus;
        sectionData.legalComment = form.legalComment;
        sectionData.legalConditions = Array.isArray(form.legalConditions) ? form.legalConditions.filter(c => c && c.trim() !== '') : [];
      } else if (section === 'business') {
        sectionData.businessName = form.businessName;
        sectionData.businessFunction = form.businessFunction;
        sectionData.businessStatus = form.businessStatus;
        sectionData.businessComment = form.businessComment;
        sectionData.businessConditions = Array.isArray(form.businessConditions) ? form.businessConditions.filter(c => c && c.trim() !== '') : [];
      }

      const response = await fetch("/api/write-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setSectionSuccess(section);
      setTimeout(() => setSectionSuccess(null), 3000);
    } catch (error: any) {
      console.error(`[ApprovalsPage] Save ${section} error:`, error);
      setError(error.message || "Failed to save");
      setTimeout(() => setError(""), 3000);
    }
    setSavingSection(null);
  };

  const handleComplete = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Check for missing assessment fields
      // const missingFields = getMissingAssessmentFields(qnAData ?? []);
      // if (missingFields.length > 0) {
      //   setError(`Please complete the following fields before completing assessment:\n${missingFields.join('\n')}`);
      //   setSaving(false);
      //   return;
      // }

      // Save approval data first
      await handleSave();
      
      // Update the assessment status
      // const response = await fetch(`/api/post-stepdata`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     useCaseId,
      //     assessData: {
      //       metadata: {
      //         status: "completed",
      //         completedAt: new Date().toISOString(),
      //         approvals: form
      //       }
      //     }
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to update assessment status");
      // }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/${useCaseId}`);
      }, 1000);
    } catch (error) {
      console.error('Error completing assessment:', error);
      setError(error instanceof Error ? error.message : "Failed to complete assessment");
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ handleComplete }));

  // Helper for formatting
  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string') val = parseFloat(val);
    return val ? val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : "$0";
  };

  // Derived risk groups
  const aiRisks = risks.filter(r => r.sourceType === 'atlas');
  const securityRisks = risks.filter(r => r.sourceType === 'mitre');
  const otherRisks = risks.filter(r => r.sourceType !== 'atlas' && r.sourceType !== 'mitre');

  // Helpers for heatmap rendering (per-use-case)
  const renderHeatmap = (risksForHeatmap: Risk[]) => {
    const heatmapData = [
      { severity: 'Critical', likelihood: 'High', risks: [] as Risk[] },
      { severity: 'Critical', likelihood: 'Medium', risks: [] as Risk[] },
      { severity: 'Critical', likelihood: 'Low', risks: [] as Risk[] },
      { severity: 'High', likelihood: 'High', risks: [] as Risk[] },
      { severity: 'High', likelihood: 'Medium', risks: [] as Risk[] },
      { severity: 'High', likelihood: 'Low', risks: [] as Risk[] },
      { severity: 'Medium', likelihood: 'High', risks: [] as Risk[] },
      { severity: 'Medium', likelihood: 'Medium', risks: [] as Risk[] },
      { severity: 'Medium', likelihood: 'Low', risks: [] as Risk[] },
      { severity: 'Low', likelihood: 'High', risks: [] as Risk[] },
      { severity: 'Low', likelihood: 'Medium', risks: [] as Risk[] },
      { severity: 'Low', likelihood: 'Low', risks: [] as Risk[] },
    ];

    const normalizeLikelihood = (likelihood?: string | null): string | null => {
      if (!likelihood) return null;
      const lower = likelihood.trim().toLowerCase();
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
      return null;
    };

    const normalizeSeverity = (severity?: string | null): string | null => {
      if (!severity) return null;
      const lower = severity.trim().toLowerCase();
      if (lower === 'critical') return 'Critical';
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
      return null;
    };

    risksForHeatmap.forEach(risk => {
      const sev = normalizeSeverity(risk.riskLevel);
      const lik = normalizeLikelihood(risk.likelihood);
      if (!sev || !lik) return;
      const cell = heatmapData.find(d => d.severity === sev && d.likelihood === lik);
      if (cell) cell.risks.push(risk);
    });

    const maxCount = Math.max(...heatmapData.map(d => d.risks.length), 1);
    const getCellColor = (count: number, severity: string) => {
      if (count === 0) return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };
      const intensity = maxCount > 0 ? count / maxCount : 0;
      if (severity === 'Critical') {
        if (intensity >= 0.7) return { bg: 'bg-red-700 dark:bg-red-800', text: 'text-white' };
        if (intensity >= 0.4) return { bg: 'bg-red-600 dark:bg-red-700', text: 'text-white' };
        if (intensity >= 0.2) return { bg: 'bg-red-500 dark:bg-red-600', text: 'text-white' };
        return { bg: 'bg-red-400 dark:bg-red-500', text: 'text-white' };
      }
      if (severity === 'High') {
        if (intensity >= 0.7) return { bg: 'bg-orange-700 dark:bg-orange-800', text: 'text-white' };
        if (intensity >= 0.4) return { bg: 'bg-orange-600 dark:bg-orange-700', text: 'text-white' };
        if (intensity >= 0.2) return { bg: 'bg-orange-500 dark:bg-orange-600', text: 'text-white' };
        return { bg: 'bg-orange-400 dark:bg-orange-500', text: 'text-white' };
      }
      if (severity === 'Medium') {
        if (intensity >= 0.7) return { bg: 'bg-yellow-600 dark:bg-yellow-700', text: 'text-white' };
        if (intensity >= 0.4) return { bg: 'bg-yellow-500 dark:bg-yellow-600', text: 'text-white' };
        if (intensity >= 0.2) return { bg: 'bg-yellow-400 dark:bg-yellow-500', text: 'text-white' };
        return { bg: 'bg-yellow-300 dark:bg-yellow-400', text: 'text-gray-800 dark:text-gray-900' };
      }
      if (intensity >= 0.7) return { bg: 'bg-green-600 dark:bg-green-700', text: 'text-white' };
      if (intensity >= 0.4) return { bg: 'bg-green-500 dark:bg-green-600', text: 'text-white' };
      if (intensity >= 0.2) return { bg: 'bg-green-400 dark:bg-green-500', text: 'text-white' };
      return { bg: 'bg-green-300 dark:bg-green-400', text: 'text-gray-800 dark:text-gray-900' };
    };

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Heatmap (this use case)
          </CardTitle>
          <CardDescription className="text-xs">Severity vs likelihood for imported risks.</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-1.5">
            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-medium text-center">
              <div></div>
              <div className="text-muted-foreground">Low</div>
              <div className="text-muted-foreground">Medium</div>
              <div className="text-muted-foreground">High</div>
            </div>
            {['Critical', 'High', 'Medium', 'Low'].map(severity => (
              <div key={severity} className="grid grid-cols-4 gap-1.5">
                <div className="flex items-center text-[10px] font-medium text-muted-foreground">{severity}</div>
                {['Low', 'Medium', 'High'].map(likelihood => {
                  const cell = heatmapData.find(d => d.severity === severity && d.likelihood === likelihood);
                  const count = cell?.risks.length || 0;
                  const colors = getCellColor(count, severity);
                  return (
                    <div
                      key={likelihood}
                      className={`${colors.bg} ${colors.text} rounded-sm h-10 flex items-center justify-center text-xs transition-all`}
                      title={`${severity} / ${likelihood}: ${count} risk(s)`}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border text-center">
              Darker cells indicate higher concentration of risks.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRiskCard = (risk: Risk) => (
    <Card 
      key={risk.id} 
      className="border-l-4 bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors rounded-md p-4" 
      style={{
        borderLeftColor: risk.riskLevel === 'Critical' ? '#ef4444' :
          risk.riskLevel === 'High' ? '#f97316' :
          risk.riskLevel === 'Medium' ? '#eab308' : '#22c55e'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={`${getRiskLevelColor(risk.riskLevel)} text-xs px-2 py-0.5`}>
              {risk.riskLevel}
            </Badge>
            <Badge className={`${getStatusColor(risk.status)} text-xs px-2 py-0.5`}>
              {risk.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
              Score: {risk.riskScore}/10
            </span>
            {risk.sourceType && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {risk.sourceType === 'mitre' ? 'MITRE ATLAS' :
                 risk.sourceType === 'atlas' ? 'QUBE AI Risk Data' :
                 risk.sourceType === 'owasp' ? 'OWASP' :
                 risk.sourceType === 'ibm' ? 'IBM' :
                 risk.sourceType === 'mit' ? 'MIT' :
                 risk.sourceType === 'aiid' ? 'AIID' : risk.sourceType}
              </Badge>
            )}
          </div>
          <h4 className="text-base font-semibold text-foreground mb-1">
            {risk.title || 'Risk'}
          </h4>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {risk.category}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {risk.description}
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full">
        {/* Problem Statement */}
        {!useCase ? (
          <div className="mb-6 text-muted-foreground">Loading use case summary...</div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 text-foreground">Problem Statement</h2>
              <div 
                className="text-foreground mb-4"
                dangerouslySetInnerHTML={{ 
                  __html: useCase.problemStatement && typeof useCase.problemStatement === 'string' && useCase.problemStatement.trim() 
                    ? useCase.problemStatement 
                    : '<span class="text-muted-foreground">Not specified</span>'
                }}
              />
              <h2 className="text-xl font-bold mb-2 text-foreground">Proposed Solution</h2>
              <div 
                className="text-foreground"
                dangerouslySetInnerHTML={{ 
                  __html: useCase.proposedAISolution && typeof useCase.proposedAISolution === 'string' && useCase.proposedAISolution.trim() 
                    ? useCase.proposedAISolution 
                    : '<span class="text-muted-foreground">Not specified</span>'
                }}
              />
            </div>
            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="flex flex-col items-center justify-center p-6">
                <div className="text-2xl font-bold text-destructive">{formatCurrency(finops?.totalInvestment ?? 0)}</div>
                <div className="text-muted-foreground mt-1">Total Investment</div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(finops?.cumValue ?? 0)}</div>
                <div className="text-muted-foreground mt-1">Total Value Generated</div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                <div className="text-2xl font-bold text-blue-600">{typeof finops?.ROI === 'number' ? `${finops.ROI.toFixed(1)}%` : '0%'}</div>
                <div className="text-muted-foreground mt-1">Net ROI</div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                <div className="text-2xl font-bold text-green-600">{typeof finops?.breakEvenMonth === 'number' ? `${finops.breakEvenMonth} months` : 'N/A'}</div>
                <div className="text-muted-foreground mt-1">Payback Period</div>
              </Card>
            </div>
          </>
        )}
        {_error && (
          <div className="text-red-500 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="whitespace-pre-line">{_error}</div>
          </div>
        )}
        {success && (
          <div className="text-green-600 mb-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            Assessment completed successfully! Redirecting...
          </div>
        )}
        {/* Assessment Stages Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Assessment Stages Review Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessmentStages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{stage.name}</span>
                  </div>
                  {getStatusBadge(stage.status, reviewerNames[stage.id])}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Risks Display Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[#9461fd]">Identified Risks</h2>
          {risks.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <p className="text-muted-foreground">No risks identified for this use case.</p>
              </div>
            </Card>
          ) : (
            <>
              {renderHeatmap(risks)}

              {/* AI Risk Intelligence (Atlas) */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">AI Risk Intelligence</h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {aiRisks.length} risks
                  </Badge>
                </div>
                {aiRisks.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No AI Risk Intelligence risks imported yet.
                    </p>
                  </Card>
                ) : (
                  aiRisks.map(renderRiskCard)
                )}
              </div>

              {/* Security Assessment (MITRE) */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Security Assessment (MITRE)</h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {securityRisks.length} risks
                  </Badge>
                </div>
                {securityRisks.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No Security Assessment risks imported yet.
                    </p>
                  </Card>
                ) : (
                  securityRisks.map(renderRiskCard)
                )}
              </div>

              {/* Other risks */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Other Risks</h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {otherRisks.length} risks
                  </Badge>
                </div>
                {otherRisks.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No additional risks recorded.
                    </p>
                  </Card>
                ) : (
                  otherRisks.map(renderRiskCard)
                )}
              </div>
            </>
          )}
        </div>
        {/* Approvals Section */}
        <h2 className="text-2xl font-bold mb-8 text-[#9461fd]">Approvals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Governance */}
          <Card className={`mb-6 p-6 ${!canEditGovernance ? 'opacity-80 border-muted' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Governance</h3>
              {!canEditGovernance && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">View Only</Badge>
              )}
            </div>
            <input
              type="text"
              placeholder="Approver Name" 
              value={form.governanceName || ""} 
              readOnly
              disabled
              className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-2 opacity-70 cursor-not-allowed bg-muted"
            />
            <div className="mb-4">
              <Label htmlFor="governance-status" className="text-sm font-medium text-foreground mb-2 block">
                Status
              </Label>
              <select 
                id="governance-status"
                value={form.governanceStatus || ""} 
                onChange={e => setForm(f => ({ ...f, governanceStatus: e.target.value }))} 
                disabled={canEditGovernance === false}
                className={`w-full border rounded px-3 py-2 bg-background text-foreground ${canEditGovernance === false ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
              >
                <option value="">Select Status</option>
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <Label htmlFor="governance-comment" className="text-sm font-medium text-foreground mb-2 block">
                Comments
              </Label>
              <Textarea
                id="governance-comment"
                placeholder="Enter your comments or feedback..." 
                value={form.governanceComment || ""} 
                onChange={e => setForm(f => ({ ...f, governanceComment: e.target.value }))}
                disabled={canEditGovernance === false}
                className="min-h-[100px] resize-y"
              />
            </div>
            <ConditionsSection
              conditions={form.governanceConditions || []}
              onAdd={() => {
                setForm(f => {
                  const newConditions = [...(f.governanceConditions || []), ""];
                  console.log('[ApprovalsPage] Adding governance condition, new array:', newConditions);
                  return { ...f, governanceConditions: newConditions };
                });
              }}
              onRemove={(index) => {
                setForm(f => {
                  const newConditions = (f.governanceConditions || []).filter((_, i) => i !== index);
                  console.log('[ApprovalsPage] Removing governance condition', index, 'new array:', newConditions);
                  return { ...f, governanceConditions: newConditions };
                });
              }}
              onUpdate={(index, value) => {
                setForm(f => {
                  const newConditions = (f.governanceConditions || []).map((c, i) => i === index ? value : c);
                  console.log('[ApprovalsPage] Updating governance condition', index, 'to:', value, 'new array:', newConditions);
                  return { ...f, governanceConditions: newConditions };
                });
              }}
              disabled={!canEditGovernance}
              useCaseId={useCaseId}
              conditionFieldName="governanceConditions"
            />
            {canEditGovernance && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('governance')}
                  disabled={savingSection === 'governance'}
                  disabled={savingSection === 'governance'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingSection === 'governance' ? 'Saving...' : 'Save'}
                </Button>
                {sectionSuccess === 'governance' && (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                )}
              </div>
            )}
          </Card>
          {/* Risk Management */}
          <Card className={`mb-6 p-6 ${!canEditRisk ? 'opacity-80 border-muted' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Risk Management</h3>
              {!canEditRisk && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">View Only</Badge>
              )}
            </div>
            <input
              type="text"
              placeholder="Approver Name" 
              value={form.riskName || ""} 
              readOnly
              disabled
              className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-2 opacity-70 cursor-not-allowed bg-muted"
            />
            <div className="mb-4">
              <Label htmlFor="risk-status" className="text-sm font-medium text-foreground mb-2 block">
                Status
              </Label>
              <select 
                id="risk-status"
                value={form.riskStatus || ""} 
                onChange={e => {
                  console.log('[ApprovalsPage] Risk Status onChange triggered:', e.target.value, 'canEditRisk:', canEditRisk);
                  setForm(f => ({ ...f, riskStatus: e.target.value }));
                }}
                disabled={canEditRisk === false}
                className={`w-full border rounded px-3 py-2 bg-background text-foreground ${canEditRisk === false ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
              >
                <option value="">Select Status</option>
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <Label htmlFor="risk-comment" className="text-sm font-medium text-foreground mb-2 block">
                Comments
              </Label>
              <Textarea
                id="risk-comment"
                placeholder="Enter your comments or feedback..." 
                value={form.riskComment || ""} 
                onChange={e => {
                  console.log('[ApprovalsPage] Risk Comment onChange triggered:', e.target.value, 'canEditRisk:', canEditRisk);
                  setForm(f => ({ ...f, riskComment: e.target.value }));
                }}
                disabled={canEditRisk === false}
                onFocus={() => console.log('[ApprovalsPage] Risk Comment textarea focused, canEditRisk:', canEditRisk)}
                className="min-h-[100px] resize-y"
              />
            </div>
            <ConditionsSection
              conditions={form.riskConditions || []}
              onAdd={() => setForm(f => ({ ...f, riskConditions: [...(f.riskConditions || []), ""] }))}
              onRemove={(index) => setForm(f => ({ ...f, riskConditions: (f.riskConditions || []).filter((_, i) => i !== index) }))}
              onUpdate={(index, value) => setForm(f => ({ 
                ...f, 
                riskConditions: (f.riskConditions || []).map((c, i) => i === index ? value : c)
              }))}
              disabled={!canEditRisk}
              useCaseId={useCaseId}
              conditionFieldName="riskConditions"
            />
            {canEditRisk && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('risk')}
                  disabled={savingSection === 'risk'}
                  disabled={savingSection === 'risk'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingSection === 'risk' ? 'Saving...' : 'Save'}
                </Button>
                {sectionSuccess === 'risk' && (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                )}
              </div>
            )}
          </Card>
          {/* Legal */}
          <Card className={`mb-6 p-6 ${!canEditLegal ? 'opacity-80 border-muted' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Legal</h3>
              {!canEditLegal && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">View Only</Badge>
              )}
            </div>
            <Input 
              placeholder="Approver Name" 
              value={form.legalName || ""} 
              readOnly
              disabled
              className="mb-2 opacity-70 cursor-not-allowed bg-muted"
            />
            <div className="mb-4">
              <Label htmlFor="legal-status" className="text-sm font-medium text-foreground mb-2 block">
                Status
              </Label>
              <select 
                id="legal-status"
                value={form.legalStatus || ""} 
                onChange={e => setForm(f => ({ ...f, legalStatus: e.target.value }))} 
                disabled={canEditLegal === false}
                className={`w-full border rounded px-3 py-2 bg-background text-foreground ${canEditLegal === false ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
              >
                <option value="">Select Status</option>
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <Label htmlFor="legal-comment" className="text-sm font-medium text-foreground mb-2 block">
                Comments
              </Label>
              <Textarea
                id="legal-comment"
                placeholder="Enter your comments or feedback..." 
                value={form.legalComment || ""} 
                onChange={e => setForm(f => ({ ...f, legalComment: e.target.value }))}
                disabled={canEditLegal === false}
                className="min-h-[100px] resize-y"
              />
            </div>
            <ConditionsSection
              conditions={form.legalConditions || []}
              onAdd={() => setForm(f => ({ ...f, legalConditions: [...(f.legalConditions || []), ""] }))}
              onRemove={(index) => setForm(f => ({ ...f, legalConditions: (f.legalConditions || []).filter((_, i) => i !== index) }))}
              onUpdate={(index, value) => setForm(f => ({ 
                ...f, 
                legalConditions: (f.legalConditions || []).map((c, i) => i === index ? value : c)
              }))}
              disabled={!canEditLegal}
              useCaseId={useCaseId}
              conditionFieldName="legalConditions"
            />
            {canEditLegal && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('legal')}
                  disabled={savingSection === 'legal'}
                  disabled={savingSection === 'legal'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingSection === 'legal' ? 'Saving...' : 'Save'}
                </Button>
                {sectionSuccess === 'legal' && (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                )}
              </div>
            )}
          </Card>
          {/* Business Function */}
          <Card className={`mb-6 p-6 ${!canEditBusiness ? 'opacity-80 border-muted' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Business Function</h3>
              {!canEditBusiness && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">View Only</Badge>
              )}
            </div>
            <Input 
              placeholder="Approver Name" 
              value={form.businessName || ""} 
              readOnly
              disabled
              className="mb-4 opacity-70 cursor-not-allowed bg-muted"
            />
            <div className="mb-4">
              <Label htmlFor="business-function" className="text-sm font-medium text-foreground mb-2 block">
                Business Function
              </Label>
              <select 
                id="business-function"
                value={form.businessFunction || ""} 
                onChange={e => setForm(f => ({ ...f, businessFunction: e.target.value }))} 
                disabled={canEditBusiness === false}
                className={`w-full border rounded px-3 py-2 bg-background text-foreground ${canEditBusiness === false ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
              >
                <option value="">Select Function</option>
                {businessFunctions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <Label htmlFor="business-status" className="text-sm font-medium text-foreground mb-2 block">
                Status
              </Label>
              <select 
                id="business-status"
                value={form.businessStatus || ""} 
                onChange={e => setForm(f => ({ ...f, businessStatus: e.target.value }))} 
                disabled={canEditBusiness === false}
                className={`w-full border rounded px-3 py-2 bg-background text-foreground ${canEditBusiness === false ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
              >
                <option value="">Select Status</option>
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <Label htmlFor="business-comment" className="text-sm font-medium text-foreground mb-2 block">
                Comments
              </Label>
              <Textarea
                id="business-comment"
                placeholder="Enter your comments or feedback..." 
                value={form.businessComment || ""} 
                onChange={e => {
                  console.log('[ApprovalsPage] Business Comment onChange triggered:', e.target.value, 'canEditBusiness:', canEditBusiness);
                  setForm(f => ({ ...f, businessComment: e.target.value }));
                }}
                disabled={canEditBusiness === false}
                onFocus={() => console.log('[ApprovalsPage] Business Comment textarea focused, canEditBusiness:', canEditBusiness)}
                className="min-h-[100px] resize-y"
              />
            </div>
            <ConditionsSection
              conditions={form.businessConditions || []}
              onAdd={() => setForm(f => ({ ...f, businessConditions: [...(f.businessConditions || []), ""] }))}
              onRemove={(index) => setForm(f => ({ ...f, businessConditions: (f.businessConditions || []).filter((_, i) => i !== index) }))}
              onUpdate={(index, value) => setForm(f => ({ 
                ...f, 
                businessConditions: (f.businessConditions || []).map((c, i) => i === index ? value : c)
              }))}
              disabled={!canEditBusiness}
              useCaseId={useCaseId}
              conditionFieldName="businessConditions"
            />
            {canEditBusiness && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('business')}
                  disabled={savingSection === 'business'}
                  disabled={savingSection === 'business'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingSection === 'business' ? 'Saving...' : 'Save'}
                </Button>
                {sectionSuccess === 'business' && (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                )}
              </div>
            )}
          </Card>
        </div>

         {/* AI-Specific Approvals Section */}
         {(() => {
          const aiModelTypes = getAnswer(qnAData, 'TECHNICAL_FEASIBILITY', 'Model Type') || [];
          return Array.isArray(aiModelTypes) && (
            aiModelTypes.includes("Generative AI") || 
            aiModelTypes.includes("Large Language Model (LLM)") ||
            aiModelTypes.includes("Multi-modal Models")
          );
        })() && (
          <>
            <h3 className="text-xl font-bold mb-4 text-purple-600 dark:text-purple-400">AI-Specific Approvals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Governance */}
              <Card className="mb-6 p-6">
                <h3 className="font-semibold text-lg mb-4">AI Governance</h3>
                <Input 
                  placeholder="Approver Name" 
                  value={form.aiGovernanceName} 
                  readOnly
                  disabled
                  className="mb-2 opacity-70 cursor-not-allowed bg-muted"
                />
                <div className="mb-4">
                  <Label htmlFor="ai-governance-status" className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </Label>
                  <select 
                    id="ai-governance-status"
                    value={form.aiGovernanceStatus} 
                    onChange={e => setForm(f => ({ ...f, aiGovernanceStatus: e.target.value }))} 
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <Label htmlFor="ai-governance-comment" className="text-sm font-medium text-foreground mb-2 block">
                    Comments
                  </Label>
                  <Textarea
                    id="ai-governance-comment"
                    placeholder="Enter your comments or feedback..." 
                    value={form.aiGovernanceComment} 
                    onChange={e => setForm(f => ({ ...f, aiGovernanceComment: e.target.value }))}
                    className="min-h-[100px] resize-y"
                  />
                </div>
                <ConditionsSection
                  conditions={form.aiGovernanceConditions || []}
                  onAdd={() => setForm(f => ({ ...f, aiGovernanceConditions: [...(f.aiGovernanceConditions || []), ""] }))}
                  onRemove={(index) => setForm(f => ({ ...f, aiGovernanceConditions: (f.aiGovernanceConditions || []).filter((_, i) => i !== index) }))}
                  onUpdate={(index, value) => setForm(f => ({ 
                    ...f, 
                    aiGovernanceConditions: (f.aiGovernanceConditions || []).map((c, i) => i === index ? value : c)
                  }))}
                  disabled={!canEditAIGovernance}
                  useCaseId={useCaseId}
                  conditionFieldName="aiGovernanceConditions"
                />
              </Card>
              
              {/* Model Validation */}
              <Card className="mb-6 p-6">
                <h3 className="font-semibold text-lg mb-4">Model Validation</h3>
                <Input 
                  placeholder="Approver Name" 
                  value={form.modelValidationName} 
                  readOnly
                  disabled
                  className="mb-2 opacity-70 cursor-not-allowed bg-muted"
                />
                <div className="mb-4">
                  <Label htmlFor="model-validation-status" className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </Label>
                  <select 
                    id="model-validation-status"
                    value={form.modelValidationStatus} 
                    onChange={e => setForm(f => ({ ...f, modelValidationStatus: e.target.value }))} 
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <Label htmlFor="model-validation-comment" className="text-sm font-medium text-foreground mb-2 block">
                    Comments
                  </Label>
                  <Textarea
                    id="model-validation-comment"
                    placeholder="Enter your comments or feedback..." 
                    value={form.modelValidationComment} 
                    onChange={e => setForm(f => ({ ...f, modelValidationComment: e.target.value }))}
                    className="min-h-[100px] resize-y"
                  />
                </div>
                <ConditionsSection
                  conditions={form.modelValidationConditions || []}
                  onAdd={() => setForm(f => ({ ...f, modelValidationConditions: [...(f.modelValidationConditions || []), ""] }))}
                  onRemove={(index) => setForm(f => ({ ...f, modelValidationConditions: (f.modelValidationConditions || []).filter((_, i) => i !== index) }))}
                  onUpdate={(index, value) => setForm(f => ({ 
                    ...f, 
                    modelValidationConditions: (f.modelValidationConditions || []).map((c, i) => i === index ? value : c)
                  }))}
                  disabled={!canEditModelValidation}
                  useCaseId={useCaseId}
                  conditionFieldName="modelValidationConditions"
                />
              </Card>
              
              {/* AI Ethics Review */}
              <Card className="mb-6 p-6 md:col-span-2">
                <h3 className="font-semibold text-lg mb-4">AI Ethics Review</h3>
                <Input 
                  placeholder="Approver Name" 
                  value={form.aiEthicsName} 
                  readOnly
                  disabled
                  className="mb-2 opacity-70 cursor-not-allowed bg-muted"
                />
                <div className="mb-4">
                  <Label htmlFor="ai-ethics-status" className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </Label>
                  <select 
                    id="ai-ethics-status"
                    value={form.aiEthicsStatus} 
                    onChange={e => setForm(f => ({ ...f, aiEthicsStatus: e.target.value }))} 
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <Label htmlFor="ai-ethics-comment" className="text-sm font-medium text-foreground mb-2 block">
                    Comments
                  </Label>
                  <Textarea
                    id="ai-ethics-comment"
                    placeholder="Enter your comments or feedback..." 
                    value={form.aiEthicsComment} 
                    onChange={e => setForm(f => ({ ...f, aiEthicsComment: e.target.value }))}
                    className="min-h-[100px] resize-y"
                  />
                </div>
                <ConditionsSection
                  conditions={form.aiEthicsConditions || []}
                  onAdd={() => setForm(f => ({ ...f, aiEthicsConditions: [...(f.aiEthicsConditions || []), ""] }))}
                  onRemove={(index) => setForm(f => ({ ...f, aiEthicsConditions: (f.aiEthicsConditions || []).filter((_, i) => i !== index) }))}
                  onUpdate={(index, value) => setForm(f => ({ 
                    ...f,
                    aiEthicsConditions: (f.aiEthicsConditions || []).map((c, i) => i === index ? value : c)
                  }))}
                  disabled={!canEditAIEthics}
                  useCaseId={useCaseId}
                  conditionFieldName="aiEthicsConditions"
                />
              </Card>
            </div>
          </>
        )}
    </div>
  );
});

ApprovalsPage.displayName = 'ApprovalsPage';

export default ApprovalsPage; 