"use client";

import { useState, useEffect } from "react";
import { useUserClient, useAuthClient } from '@/hooks/useAuthClient';
import { useRouter, useSearchParams } from "next/navigation";
import { useStableRender } from "@/hooks/useStableRender";
import { useUserData } from "@/contexts/UserContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  X,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionType, Stage } from "@/generated/prisma";

// Helper functions for labels
const getQuestionTypeLabel = (type: QuestionType) => {
  switch (type) {
    case QuestionType.CHECKBOX: return "Checkbox";
    case QuestionType.RADIO: return "Radio";
    case QuestionType.TEXT: return "Text";
    case QuestionType.TEXT_MINI: return "TextMini";
    case QuestionType.SLIDER: return "Slider";
    case QuestionType.RISK: return "Risk";
    default: return type;
  }
};

const getStageLabel = (stage: Stage) => {
  switch (stage) {
    case Stage.REQUIREMENTS: return "Requirements";
    case Stage.TECHNICAL: return "Technical";
    case Stage.BUSINESS: return "Business";
    case Stage.RESPONSIBLE_ETHICAL: return "Responsible / Ethical";
    case Stage.LEGAL_REGULATORY: return "Legal & Regulatory";
    case Stage.DATA_READINESS: return "Data Readiness";
    case Stage.FINOPS: return "FinOps Assessment";
    default: return stage;
  }
};

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  stage: Stage;
  options: Option[];
  organizationId: string;
  isInactive: boolean;
  orderIndex?: number;
}

interface Option {
  id: string;
  text: string;
  questionId: string;
}

// Sortable Question Component
const SortableQuestion = ({ question, isPending, currentOperationStatus, reorderMode, handleToggleInactive, openEditDialog, handleDeleteQuestion }: {
  question: Question;
  isPending: boolean;
  currentOperationStatus: string;
  reorderMode: boolean;
  handleToggleInactive: (id: string, currentStatus: boolean) => void;
  openEditDialog: (question: Question) => void;
  handleDeleteQuestion: (id: string, text: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-xl p-6 hover:shadow-md transition-all duration-200 ${
        isPending 
          ? 'border-yellow-300 bg-yellow-50/50' 
          : currentOperationStatus === 'error'
          ? 'border-red-300 bg-red-50/50'
          : 'border-border'
      } ${reorderMode ? 'cursor-move' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            {reorderMode && (
              <div 
                className="flex items-center justify-center w-6 h-6 text-muted-foreground cursor-move"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-foreground">
              {question.text}
            </h3>
            {isPending && (
              <Badge variant="outline" className="px-3 py-1 rounded-full border-yellow-300 text-yellow-700 bg-yellow-100">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </Badge>
            )}
            {currentOperationStatus === 'error' && (
              <Badge variant="outline" className="px-3 py-1 rounded-full border-red-300 text-red-700 bg-red-100">
                <AlertCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
            {question.isInactive && (
              <Badge variant="outline" className="px-3 py-1 rounded-full border-orange-300 text-orange-700 bg-orange-100">
                <X className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
            <Badge variant="secondary" className="px-3 py-1 rounded-full">
              {getQuestionTypeLabel(question.type)}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 rounded-full">
              {getStageLabel(question.stage)}
            </Badge>
          </div>
        
          {question.options.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Options:
              </p>
              <div className="flex flex-wrap gap-2">
                {question.type === QuestionType.RISK ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Probability:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {question.options
                          .filter(opt => opt.text.startsWith('pro:'))
                          .map((option, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="px-2 py-1 text-xs"
                            >
                              {option.text.replace('pro:', '')}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Impact:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {question.options
                          .filter(opt => opt.text.startsWith('imp:'))
                          .map((option, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="px-2 py-1 text-xs"
                            >
                              {option.text.replace('imp:', '')}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  question.options.map((option, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="px-2 py-1 text-xs"
                    >
                      {option.text}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleInactive(question.id, question.isInactive)}
            disabled={isPending || reorderMode}
            className={`border-border hover:bg-muted disabled:opacity-50 ${
              question.isInactive 
                ? 'text-orange-600 border-orange-300 hover:bg-orange-50' 
                : 'text-green-600 border-green-300 hover:bg-green-50'
            }`}
          >
            {question.isInactive ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Deactivate
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(question)}
            disabled={isPending || reorderMode}
            className="border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteQuestion(question.id, question.text)}
            disabled={isPending || reorderMode}
            className="border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

interface NewQuestion {
  text: string;
  type: QuestionType;
  stage: Stage;
  options: string[];
}

export default function ConfigureQuestionsPage() {
  const { user, isLoaded } = useUserClient();
  const { isSignedIn } = useAuthClient();
  const { userData } = useUserData();
  const router = useRouter();
  const { isReady } = useStableRender();
  const searchParams = useSearchParams();
  
  // Get organizationId from URL params for QZEN_ADMIN users
  const orgIdFromUrl = searchParams.get('orgId');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>("all");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState<NewQuestion>({
    text: "",
    type: QuestionType.TEXT,
    stage: Stage.REQUIREMENTS,
    options: [""],
  });

  const [editQuestion, setEditQuestion] = useState<NewQuestion>({
    text: "",
    type: QuestionType.TEXT,
    stage: Stage.REQUIREMENTS,
    options: [""],
  });

  // RISK question specific states
  const [newRiskOptions, setNewRiskOptions] = useState({
    probability: ["LOW", "MEDIUM", "HIGH"],
    impact: ["LOW", "MEDIUM", "HIGH"]
  });
  
  const [editRiskOptions, setEditRiskOptions] = useState({
    probability: ["LOW", "MEDIUM", "HIGH"],
    impact: ["LOW", "MEDIUM", "HIGH"]
  });
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Map<string, 'add' | 'edit' | 'delete'>>(new Map());
  const [operationStatus, setOperationStatus] = useState<Map<string, 'pending' | 'success' | 'error'>>(new Map());
  const [reorderMode, setReorderMode] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Determine which organizationId to use
  const organizationId = userData?.role === 'QZEN_ADMIN' ? orgIdFromUrl : userData?.organizationId;

  // Helper function to generate temporary ID for optimistic updates
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to perform background operation with retry
  const performBackgroundOperation = async (
    operationId: string,
    operation: () => Promise<any>,
    onSuccess: () => void,
    onError: (error: string) => void,
    maxRetries: number = 3
  ) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await operation();
        setOperationStatus(prev => new Map(prev).set(operationId, 'success'));
        onSuccess();
        
        // Remove from pending operations after a delay
        setTimeout(() => {
          setPendingOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(operationId);
            return newMap;
          });
          setOperationStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(operationId);
            return newMap;
          });
        }, 2000);
        
        return;
      } catch (error: any) {
        retries++;
        if (retries >= maxRetries) {
          setOperationStatus(prev => new Map(prev).set(operationId, 'error'));
          onError(error.message || 'Operation failed');
          
          // Remove from pending operations after showing error
          setTimeout(() => {
            setPendingOperations(prev => {
              const newMap = new Map(prev);
              newMap.delete(operationId);
              return newMap;
            });
            setOperationStatus(prev => {
              const newMap = new Map(prev);
              newMap.delete(operationId);
              return newMap;
            });
          }, 5000);
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
  };

  const fetchQuestions = async () => {
    if (!organizationId) {
      setError("Organization ID not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/questions`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch questions");
      }
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Filter questions based on selected stage
  useEffect(() => {
    if (selectedStage === "all") {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(q => q.stage === selectedStage);
      // Sort by order index for the selected stage
      filtered.sort((a, b) => {
        const orderA = getOrderIndex(a, selectedStage as Stage);
        const orderB = getOrderIndex(b, selectedStage as Stage);
        return orderA - orderB;
      });
      setFilteredQuestions(filtered);
    }
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [questions, selectedStage]);

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      setError("Question text is required");
      return;
    }

    if (!organizationId) {
      setError("Organization ID not found");
      return;
    }

    // Prepare the data to send
    let dataToSend = { ...newQuestion };
    
    // For RISK questions, combine probability and impact options with prefixes
    if (newQuestion.type === QuestionType.RISK) {
      const probabilityOptions = newRiskOptions.probability.filter(opt => opt.trim());
      const impactOptions = newRiskOptions.impact.filter(opt => opt.trim());
      
      if (probabilityOptions.length === 0 || impactOptions.length === 0) {
        setError("Both probability and impact options are required for risk questions");
        return;
      }
      
      // Create combined options with prefixes
      dataToSend.options = [
        ...probabilityOptions.map(opt => `pro:${opt.trim()}`),
        ...impactOptions.map(opt => `imp:${opt.trim()}`)
      ];
    }

    // Generate temporary ID for optimistic update
    const tempId = generateTempId();
    const operationId = `add_${tempId}`;

    // Create optimistic question object
    const optimisticQuestion: Question = {
      id: tempId,
      text: dataToSend.text,
      type: dataToSend.type,
      stage: dataToSend.stage,
      organizationId: organizationId,
      isInactive: false,
      options: dataToSend.options.map(opt => ({
        id: `temp_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: opt,
        questionId: tempId
      }))
    };

    // Optimistically add the question to the UI
    setQuestions(prev => [optimisticQuestion, ...prev]);
    setPendingOperations(prev => new Map(prev).set(operationId, 'add'));
    setOperationStatus(prev => new Map(prev).set(operationId, 'pending'));

    // Clear form and close dialog immediately
    setNewQuestion({
      text: "",
      type: QuestionType.TEXT,
      stage: Stage.REQUIREMENTS,
      options: [""],
    });
    setNewRiskOptions({
      probability: ["LOW", "MEDIUM", "HIGH"],
      impact: ["LOW", "MEDIUM", "HIGH"]
    });
    setIsAddDialogOpen(false);
    setError(null);
    setSuccess("Question added! Processing in background...");

    // Perform background operation
    performBackgroundOperation(
      operationId,
      async () => {
        const response = await fetch(`/api/organizations/${organizationId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to create question");
        }

        // Replace optimistic question with real one
        setQuestions(prev => prev.map(q => q.id === tempId ? data.question : q));
      },
      () => {
        setSuccess("Question created successfully!");
      },
      (error) => {
        // Rollback optimistic update
        setQuestions(prev => prev.filter(q => q.id !== tempId));
        setError(`Failed to create question: ${error}`);
      }
    );
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion || !editQuestion.text.trim()) {
      setError("Question text is required");
      return;
    }

    if (!organizationId) {
      setError("Organization ID not found");
      return;
    }

    // Prepare the data to send
    let dataToSend = { ...editQuestion };
    
    // For RISK questions, combine probability and impact options with prefixes
    if (editQuestion.type === QuestionType.RISK) {
      const probabilityOptions = editRiskOptions.probability.filter(opt => opt.trim());
      const impactOptions = editRiskOptions.impact.filter(opt => opt.trim());
      
      if (probabilityOptions.length === 0 || impactOptions.length === 0) {
        setError("Both probability and impact options are required for risk questions");
        return;
      }
      
      // Create combined options with prefixes
      dataToSend.options = [
        ...probabilityOptions.map(opt => `pro:${opt.trim()}`),
        ...impactOptions.map(opt => `imp:${opt.trim()}`)
      ];
    }

    const operationId = `edit_${editingQuestion.id}`;
    const originalQuestion = questions.find(q => q.id === editingQuestion.id);

    // Store original question for rollback
    if (!originalQuestion) {
      setError("Question not found");
      return;
    }

    // Create optimistic question object
    const optimisticQuestion: Question = {
      ...originalQuestion,
      text: dataToSend.text,
      type: dataToSend.type,
      stage: dataToSend.stage,
      options: dataToSend.options.map(opt => ({
        id: `temp_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: opt,
        questionId: editingQuestion.id
      }))
    };

    // Optimistically update the question in the UI
    setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? optimisticQuestion : q));
    setPendingOperations(prev => new Map(prev).set(operationId, 'edit'));
    setOperationStatus(prev => new Map(prev).set(operationId, 'pending'));

    // Close dialog immediately
    setEditingQuestion(null);
    setIsEditDialogOpen(false);
    setError(null);
    setSuccess("Question updated! Processing in background...");

    // Perform background operation
    performBackgroundOperation(
      operationId,
      async () => {
        const response = await fetch(`/api/organizations/${organizationId}/questions/${editingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to update question");
        }

        // Replace optimistic question with real one
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? data.question : q));
      },
      () => {
        setSuccess("Question updated successfully!");
      },
      (error) => {
        // Rollback optimistic update
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? originalQuestion : q));
        setError(`Failed to update question: ${error}`);
      }
    );
  };

  const handleDeleteQuestion = async (questionId: string, questionText: string) => {
    if (!confirm(`Are you sure you want to delete "${questionText}"? This action cannot be undone.`)) {
      return;
    }

    if (!organizationId) {
      setError("Organization ID not found");
      return;
    }

    const operationId = `delete_${questionId}`;
    const originalQuestion = questions.find(q => q.id === questionId);

    // Store original question for rollback
    if (!originalQuestion) {
      setError("Question not found");
      return;
    }

    // Optimistically remove the question from the UI
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    setPendingOperations(prev => new Map(prev).set(operationId, 'delete'));
    setOperationStatus(prev => new Map(prev).set(operationId, 'pending'));

    setError(null);
    setSuccess("Question deleted! Processing in background...");

    // Perform background operation
    performBackgroundOperation(
      operationId,
      async () => {
        const response = await fetch(`/api/organizations/${organizationId}/questions/${questionId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to delete question");
        }
      },
      () => {
        setSuccess("Question deleted successfully!");
      },
      (error) => {
        // Rollback optimistic update
        setQuestions(prev => [...prev, originalQuestion].sort((a, b) => a.text.localeCompare(b.text)));
        setError(`Failed to delete question: ${error}`);
      }
    );
  };

  const handleToggleInactive = async (questionId: string, currentStatus: boolean) => {
    if (!organizationId) {
      setError("Organization ID not found");
      return;
    }

    const operationId = `toggle_${questionId}`;
    const originalQuestion = questions.find(q => q.id === questionId);

    if (!originalQuestion) {
      setError("Question not found");
      return;
    }

    // Optimistically update the question status
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isInactive: !currentStatus } : q
    ));
    setPendingOperations(prev => new Map(prev).set(operationId, 'edit'));
    setOperationStatus(prev => new Map(prev).set(operationId, 'pending'));

    setError(null);
    setSuccess(`Question ${!currentStatus ? 'deactivated' : 'activated'}! Processing in background...`);

    // Perform background operation
    performBackgroundOperation(
      operationId,
      async () => {
        const response = await fetch(`/api/organizations/${organizationId}/questions/${questionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isInactive: !currentStatus }),
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to update question status");
        }

        // Update with real data
        setQuestions(prev => prev.map(q => q.id === questionId ? data.question : q));
      },
      () => {
        setSuccess(`Question ${!currentStatus ? 'deactivated' : 'activated'} successfully!`);
      },
      (error) => {
        // Rollback optimistic update
        setQuestions(prev => prev.map(q => q.id === questionId ? originalQuestion : q));
        setError(`Failed to update question status: ${error}`);
      }
    );
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setEditQuestion({
      text: question.text,
      type: question.type,
      stage: question.stage,
      options: question.options.length > 0 ? question.options.map(o => o.text) : [""],
    });
    
    // Handle RISK question options
    if (question.type === QuestionType.RISK) {
      const probabilityOptions: string[] = [];
      const impactOptions: string[] = [];
      
      question.options.forEach(option => {
        if (option.text.startsWith('pro:')) {
          probabilityOptions.push(option.text.replace('pro:', ''));
        } else if (option.text.startsWith('imp:')) {
          impactOptions.push(option.text.replace('imp:', ''));
        }
      });
      
      setEditRiskOptions({
        probability: probabilityOptions.length > 0 ? probabilityOptions : ["LOW", "MEDIUM", "HIGH"],
        impact: impactOptions.length > 0 ? impactOptions : ["LOW", "MEDIUM", "HIGH"]
      });
    } else {
      setEditRiskOptions({
        probability: ["LOW", "MEDIUM", "HIGH"],
        impact: ["LOW", "MEDIUM", "HIGH"]
      });
    }
    
    setIsEditDialogOpen(true);
  };

  const addOption = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditQuestion(prev => ({
        ...prev,
        options: [...prev.options, ""]
      }));
    } else {
      setNewQuestion(prev => ({
        ...prev,
        options: [...prev.options, ""]
      }));
    }
  };

  const removeOption = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    } else {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditQuestion(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => i === index ? value : opt)
      }));
    } else {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => i === index ? value : opt)
      }));
    }
  };

  const updateRiskOption = (type: 'probability' | 'impact', index: number, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditRiskOptions(prev => ({
        ...prev,
        [type]: prev[type].map((opt, i) => i === index ? value : opt)
      }));
    } else {
      setNewRiskOptions(prev => ({
        ...prev,
        [type]: prev[type].map((opt, i) => i === index ? value : opt)
      }));
    }
  };

  const addRiskOption = (type: 'probability' | 'impact', isEdit: boolean = false) => {
    if (isEdit) {
      setEditRiskOptions(prev => ({
        ...prev,
        [type]: [...prev[type], ""]
      }));
    } else {
      setNewRiskOptions(prev => ({
        ...prev,
        [type]: [...prev[type], ""]
      }));
    }
  };

  const removeRiskOption = (type: 'probability' | 'impact', index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditRiskOptions(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    } else {
      setNewRiskOptions(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  const needsOptions = (type: QuestionType) => {
    return type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK;
  };

  const clearFilter = () => {
    setSelectedStage("all");
  };

  // Helper function to get order index for a specific stage
  const getOrderIndex = (question: Question, stage: Stage) => {
    return question.orderIndex || 0;
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && selectedStage !== "all") {
      const oldIndex = filteredQuestions.findIndex((item) => item.id === active.id);
      const newIndex = filteredQuestions.findIndex((item) => item.id === over.id);

      // Check if both items are in the current page for visual feedback
      const oldPageIndex = paginatedQuestions.findIndex((item) => item.id === active.id);
      const newPageIndex = paginatedQuestions.findIndex((item) => item.id === over.id);

      // Update local state optimistically
      const newQuestions = arrayMove(filteredQuestions, oldIndex, newIndex);
      setFilteredQuestions(newQuestions);

      // Update the order indices for the selected stage
      const stage = selectedStage as Stage;
      const operationId = `reorder_${Date.now()}`;
      
      setPendingOperations(prev => new Map(prev).set(operationId, 'edit'));
      setOperationStatus(prev => new Map(prev).set(operationId, 'pending'));

      try {
        // Update order indices for all questions in the new order
        const updatePromises = newQuestions.map((question, index) => {
          const orderField = getOrderFieldName(stage);
          return fetch(`/api/organizations/${organizationId}/questions/${question.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [orderField]: index }),
          });
        });

        await Promise.all(updatePromises);
        
        setOperationStatus(prev => new Map(prev).set(operationId, 'success'));
        setSuccess("Questions reordered successfully!");
        
        // Update the main questions list with the new order indices
        setQuestions(prev => prev.map(q => {
          const updatedQ = newQuestions.find(nq => nq.id === q.id);
          if (updatedQ) {
            const orderField = getOrderFieldName(stage);
            const newOrderIndex = newQuestions.indexOf(updatedQ);
            return { ...q, [orderField]: newOrderIndex };
          }
          return q;
        }));
      } catch (error) {
        setOperationStatus(prev => new Map(prev).set(operationId, 'error'));
        setError(`Failed to reorder questions: ${error}`);
        
        // Revert optimistic update by restoring original order
        setFilteredQuestions(filteredQuestions);
      } finally {
        setPendingOperations(prev => {
          const newMap = new Map(prev);
          newMap.delete(operationId);
          return newMap;
        });
      }
    }
  };

  // Helper function to get order field name for a stage
  const getOrderFieldName = (stage: Stage) => {
    return 'orderIndex';
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isReady && organizationId) {
      fetchQuestions();
    }
  }, [isReady, organizationId]);

  // Now we can do conditional returns after all hooks
  if (!isReady || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication and role
  if (!isSignedIn || !user) {
    router.push("/sign-in");
    return null;
  }

  // Wait for userData to be loaded before doing role validation
  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Updated access control to allow both ORG_ADMIN and QZEN_ADMIN
  if (userData.role !== "QZEN_ADMIN" && userData.role !== "ORG_ADMIN") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              You don't have permission to access question configuration.
            </p>
            <p className="text-muted-foreground mb-4">
              Your role: {userData.role || "Unknown"}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For QZEN_ADMIN users, check if organizationId is provided
  if (userData.role === "QZEN_ADMIN" && !organizationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Organization Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              Please select an organization to configure questions for.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For ORG_ADMIN users, check if they have an organization
  if (userData.role === "ORG_ADMIN" && !userData.organizationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Organization Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              Your user account is not associated with an organization.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="flex-shrink-0 mt-1 hover:bg-muted"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground leading-tight">
                  Configure Questions
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Manage assessment questions for your organization
                </p>
                {userData.role === 'QZEN_ADMIN' && organizationId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Managing questions for organization: {organizationId}
                  </p>
                )}
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 bg-white text-foreground border-2 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700 dark:hover:border-neutral-500 font-medium">
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Add New Question
                  </DialogTitle>
                  <DialogDescription>
                    Create a new assessment question for your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="questionText">Question Text *</Label>
                    <Textarea
                      id="questionText"
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Enter your question here..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="questionType">Question Type *</Label>
                      <Select
                        value={newQuestion.type}
                        onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value as QuestionType }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
                          <SelectItem value={QuestionType.TEXT_MINI}>Text Mini</SelectItem>
                          <SelectItem value={QuestionType.CHECKBOX}>Checkbox</SelectItem>
                          <SelectItem value={QuestionType.RADIO}>Radio</SelectItem>
                          <SelectItem value={QuestionType.SLIDER}>Slider</SelectItem>
                          <SelectItem value={QuestionType.RISK}>Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="questionStage">Assessment Stage *</Label>
                      <Select
                        value={newQuestion.stage}
                        onValueChange={(value) => setNewQuestion(prev => ({ ...prev, stage: value as Stage }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Stage.REQUIREMENTS}>Requirements</SelectItem>
                          <SelectItem value={Stage.TECHNICAL}>Technical</SelectItem>
                          <SelectItem value={Stage.BUSINESS}>Business</SelectItem>
                          <SelectItem value={Stage.RESPONSIBLE_ETHICAL}>Responsible / Ethical</SelectItem>
                          <SelectItem value={Stage.LEGAL_REGULATORY}>Legal & Regulatory</SelectItem>
                          <SelectItem value={Stage.DATA_READINESS}>Data Readiness</SelectItem>
                          <SelectItem value={Stage.FINOPS}>FinOps Assessment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {needsOptions(newQuestion.type) && (
                    <div>
                      {newQuestion.type === QuestionType.RISK ? (
                        <div className="space-y-6">
                          {/* Probability Options */}
                          <div>
                            <Label>Probability Options *</Label>
                            <div className="space-y-2 mt-1">
                              {newRiskOptions.probability.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateRiskOption('probability', index, e.target.value, false)}
                                    placeholder={`Probability option ${index + 1}`}
                                    className="flex-1"
                                  />
                                  {newRiskOptions.probability.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => removeRiskOption('probability', index, false)}
                                      className="shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addRiskOption('probability', false)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Probability Option
                              </Button>
                            </div>
                          </div>

                          {/* Impact Options */}
                          <div>
                            <Label>Impact Options *</Label>
                            <div className="space-y-2 mt-1">
                              {newRiskOptions.impact.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateRiskOption('impact', index, e.target.value, false)}
                                    placeholder={`Impact option ${index + 1}`}
                                    className="flex-1"
                                  />
                                  {newRiskOptions.impact.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => removeRiskOption('impact', index, false)}
                                      className="shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addRiskOption('impact', false)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Impact Option
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label>Options *</Label>
                          <div className="space-y-2 mt-1">
                            {newQuestion.options.map((option, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, e.target.value, false)}
                                  placeholder={`Option ${index + 1}`}
                                  className="flex-1"
                                />
                                {newQuestion.options.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeOption(index, false)}
                                    className="shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addOption(false)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddQuestion}
                    disabled={actionLoading === "add" || !newQuestion.text.trim()}
                  >
                    {actionLoading === "add" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Add Question
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-success font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive font-medium">{error}</span>
          </div>
        )}

        {/* Questions Table */}
        <Card className="bg-card border border-border shadow-sm rounded-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Assessment Questions
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage all questions used in your organization's assessments
                </CardDescription>
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="stageFilter" className="text-sm font-medium">
                    Filter by Stage:
                  </Label>
                </div>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value={Stage.REQUIREMENTS}>Requirements</SelectItem>
                    <SelectItem value={Stage.TECHNICAL}>Technical</SelectItem>
                    <SelectItem value={Stage.BUSINESS}>Business</SelectItem>
                    <SelectItem value={Stage.RESPONSIBLE_ETHICAL}>Responsible / Ethical</SelectItem>
                    <SelectItem value={Stage.LEGAL_REGULATORY}>Legal & Regulatory</SelectItem>
                    <SelectItem value={Stage.DATA_READINESS}>Data Readiness</SelectItem>
                    <SelectItem value={Stage.FINOPS}>FinOps Assessment</SelectItem>
                  </SelectContent>
                </Select>
                {selectedStage !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilter}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </Button>
                )}
                
                {/* Reorder Mode Toggle */}
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                  <Button
                    variant={reorderMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReorderMode(!reorderMode)}
                    disabled={selectedStage === "all"}
                    className={`flex items-center gap-1 ${
                      selectedStage === "all" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    {reorderMode ? "Exit Reorder" : "Reorder Mode"}
                  </Button>
                  {selectedStage === "all" && (
                    <div className="text-xs text-muted-foreground">
                      Select a stage to reorder questions
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {selectedStage === "all" ? "No Questions Yet" : "No Questions Found"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {selectedStage === "all" 
                    ? "Create your first assessment question to get started."
                    : `No questions found for ${getStageLabel(selectedStage as Stage)}. Try selecting a different stage or create a new question.`
                  }
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-white text-foreground border border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700 px-5 py-2.5 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredQuestions.length)} of {filteredQuestions.length} questions
                    {selectedStage !== "all" && ` for ${getStageLabel(selectedStage as Stage)}`}
                  </span>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredQuestions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {paginatedQuestions.map((question) => {
                        const isPending = Array.from(pendingOperations.entries()).some(([opId, op]) => 
                          (op === 'add' && opId.includes(question.id)) ||
                          (op === 'edit' && opId.includes(question.id)) ||
                          (op === 'delete' && opId.includes(question.id))
                        );
                        const currentOperationStatus = Array.from(operationStatus.entries()).find(([opId, status]) => 
                          opId.includes(question.id)
                        )?.[1] || 'success';

                        return (
                          <SortableQuestion
                            key={question.id}
                            question={question}
                            isPending={isPending}
                            currentOperationStatus={currentOperationStatus}
                            reorderMode={reorderMode}
                            handleToggleInactive={handleToggleInactive}
                            openEditDialog={openEditDialog}
                            handleDeleteQuestion={handleDeleteQuestion}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Question Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Question
              </DialogTitle>
              <DialogDescription>
                Update the question details and options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="editQuestionText">Question Text *</Label>
                <Textarea
                  id="editQuestionText"
                  value={editQuestion.text}
                  onChange={(e) => setEditQuestion(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter your question here..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editQuestionType">Question Type *</Label>
                  <Select
                    value={editQuestion.type}
                    onValueChange={(value) => setEditQuestion(prev => ({ ...prev, type: value as QuestionType }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
                      <SelectItem value={QuestionType.CHECKBOX}>Checkbox</SelectItem>
                      <SelectItem value={QuestionType.RADIO}>Radio</SelectItem>
                      <SelectItem value={QuestionType.SLIDER}>Slider</SelectItem>
                      <SelectItem value={QuestionType.RISK}>Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="editQuestionStage">Assessment Stage *</Label>
                  <Select
                    value={editQuestion.stage}
                    onValueChange={(value) => setEditQuestion(prev => ({ ...prev, stage: value as Stage }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Stage.REQUIREMENTS}>Requirements</SelectItem>
                      <SelectItem value={Stage.TECHNICAL}>Technical</SelectItem>
                      <SelectItem value={Stage.BUSINESS}>Business</SelectItem>
                      <SelectItem value={Stage.RESPONSIBLE_ETHICAL}>Responsible / Ethical</SelectItem>
                      <SelectItem value={Stage.LEGAL_REGULATORY}>Legal & Regulatory</SelectItem>
                      <SelectItem value={Stage.DATA_READINESS}>Data Readiness</SelectItem>
                      <SelectItem value={Stage.FINOPS}>FinOps Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {needsOptions(editQuestion.type) && (
                <div>
                  {editQuestion.type === QuestionType.RISK ? (
                    <div className="space-y-6">
                      {/* Probability Options */}
                      <div>
                        <Label>Probability Options *</Label>
                        <div className="space-y-2 mt-1">
                          {editRiskOptions.probability.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateRiskOption('probability', index, e.target.value, true)}
                                placeholder={`Probability option ${index + 1}`}
                                className="flex-1"
                              />
                              {editRiskOptions.probability.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeRiskOption('probability', index, true)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addRiskOption('probability', true)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Probability Option
                          </Button>
                        </div>
                      </div>

                      {/* Impact Options */}
                      <div>
                        <Label>Impact Options *</Label>
                        <div className="space-y-2 mt-1">
                          {editRiskOptions.impact.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateRiskOption('impact', index, e.target.value, true)}
                                placeholder={`Impact option ${index + 1}`}
                                className="flex-1"
                              />
                              {editRiskOptions.impact.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeRiskOption('impact', index, true)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addRiskOption('impact', true)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Impact Option
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Options *</Label>
                      <div className="space-y-2 mt-1">
                        {editQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value, true)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1"
                            />
                            {editQuestion.options.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeOption(index, true)}
                                className="shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addOption(true)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditQuestion}
                disabled={actionLoading === "edit" || !editQuestion.text.trim()}
              >
                {actionLoading === "edit" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Update Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}