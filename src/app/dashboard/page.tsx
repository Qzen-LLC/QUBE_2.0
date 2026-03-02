'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserContext';
import { Plus, Search, TrendingUp, Zap, DollarSign, Clock, User, X, Eye, Trash2, RefreshCw, AlertTriangle, Users, Building2, Edit as EditIcon, ArrowRight as ArrowRightIcon, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUseCases, useUpdateUseCaseStage, useDeleteUseCase, type MappedUseCase } from '@/hooks/useUseCases';
import OrganizationUserManagement from '@/components/OrganizationUserManagement';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useDroppable,
} from '@dnd-kit/core';

const stages = [
  {
    id: 'discovery',
    title: 'Discovery',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
  {
    id: 'proof-of-value',
    title: 'Proof of Value',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
  {
    id: 'backlog',
    title: 'Backlog',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
  {
    id: 'solution-validation',
    title: 'Solution Validation',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
  {
    id: 'pilot',
    title: 'Pilot',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
  {
    id: 'deployment',
    title: 'Deployment',
    color: 'bg-muted/60 border border-border',
    textColor: 'text-foreground',
    accentColor: 'bg-slate-500',
  },
] as const;

const _STAGE_ORDER = [
  'discovery',
  'proof-of-value',
  'backlog',
  'in-progress',
  'solution-validation',
  'pilot',
  'deployment',
];

const _priorities = {
  CRITICAL: { color: 'bg-red-600 text-white', label: 'Critical' },
  HIGH: { color: 'bg-orange-500 text-white', label: 'High' },
  MEDIUM: { color: 'bg-amber-400 text-zinc-900', label: 'Medium' },
  LOW: { color: 'bg-emerald-500 text-white', label: 'Low' },
} as const;

const getNextStage = (currentStage: string) => {
  const idx = _STAGE_ORDER.indexOf(currentStage);
  return idx >= 0 && idx < _STAGE_ORDER.length - 1 ? _STAGE_ORDER[idx + 1] : currentStage;
};

// Reusable card styling to match enterprise dashboard
const baseCardClass =
  'bg-card border border-border rounded-sm transition-colors hover:border-primary/40';

// Draggable Use Case Card Component
const DraggableUseCaseCard = ({ useCase, onClick, handlePriorityChange, formatAiucId, stripHtmlTags, _priorities, handleDelete, isDeleting }: {
  useCase: MappedUseCase;
  onClick: () => void;
  handlePriorityChange: (useCaseId: string, newPriority: string) => void;
  formatAiucId: (aiucId: string | number | undefined, id: string) => string;
  stripHtmlTags: (html: string) => string;
  _priorities: any;
  handleDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: useCase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get stage styling
  const currentStage = stages.find(stage => stage.id === useCase.stage);
  const stageColor = currentStage?.color || 'bg-card';
  const stageAccentColor = currentStage?.accentColor || 'bg-primary';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${baseCardClass} cursor-pointer relative overflow-hidden`}
      onClick={onClick}
    >
      {/* Stage indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${stageAccentColor}`} />
      <div className="p-3 pt-4 space-y-3">
        {/* Drag handle + title */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-start justify-between group"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 flex-1">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-muted-foreground mb-1 bg-muted px-2 py-0.5 rounded-sm">
                {formatAiucId(useCase.aiucId, useCase.id)}
              </div>
              <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                {useCase.title}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {useCase.priority && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`text-[11px] px-3 py-1.5 rounded-full font-medium cursor-pointer border ${_priorities[useCase.priority as keyof typeof _priorities]?.color || 'bg-muted text-foreground'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {_priorities[useCase.priority as keyof typeof _priorities]?.label ||
                    useCase.priority}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                  <DropdownMenuItem 
                    key={priority} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePriorityChange(useCase.id, priority);
                    }}
                  >
                    {_priorities[priority as keyof typeof _priorities]?.label || priority}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isDeleting) {
                handleDelete(useCase.id);
              }
            }}
            disabled={isDeleting}
            className={`p-1.5 rounded-sm transition-colors ${
              isDeleting 
                ? 'text-muted-foreground cursor-not-allowed' 
                : 'text-destructive hover:bg-destructive/10'
            }`}
            title={isDeleting ? "Deleting..." : "Delete use case"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Creator + date */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 min-w-0">
            {useCase.creator.type === 'user' ? (
              <User className="w-3 h-3 flex-shrink-0" />
            ) : (
              <Building2 className="w-3 h-3 flex-shrink-0" />
            )}
            <span className="truncate font-medium">{useCase.creator.name}</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground/80">
            {useCase.lastUpdated}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Droppable Stage Column Component
const DroppableStageColumn = ({ stage, stageUseCases, children }: {
  stage: typeof stages[number];
  stageUseCases: MappedUseCase[];
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors min-h-[300px] ${
        isOver 
          ? 'bg-primary/5 border-2 border-primary/30 border-dashed rounded-sm' 
          : ''
      }`}
    >
      {isOver && (
        <div className="text-center text-primary text-[11px] font-medium py-3 mb-2 bg-primary/5 border border-primary/20 rounded-sm">
          Drop here to move to {stage.title}
        </div>
      )}
      {children}
    </div>
  );
};

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedUseCase, setSelectedUseCase] = useState<MappedUseCase | null>(null);
  // Compact, professional default layout (removed detailed toggle)
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(''); // '' means All Organizations
  const [selectedBusinessFunction, setSelectedBusinessFunction] = useState<string>(''); // '' means All Business Functions
  const [modalUseCase, setModalUseCase] = useState<MappedUseCase | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deletingUseCaseId, setDeletingUseCaseId] = useState<string | null>(null);
  const [deletedUseCaseIds, setDeletedUseCaseIds] = useState<Set<string>>(new Set());
  
  // Refs for scroll synchronization
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentScrollWidth, setContentScrollWidth] = useState<number | null>(null);
  const boardWidth = (stages.length * 260) + ((stages.length - 1) * 12) + 1; // fallback if measurement not ready
  const widthCompensationPx = 30; // slightly more to fully cover deployment column
  const effectiveWidth = (contentScrollWidth ?? boardWidth) + widthCompensationPx;
  
  // Scroll synchronization handlers
  const handleScrollBarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (contentRef.current) {
      contentRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };
  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollBarRef.current) {
      scrollBarRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Measure actual content width so the top scrollbar track matches exactly
  useEffect(() => {
    const updateWidths = () => {
      if (contentRef.current) {
        setContentScrollWidth(contentRef.current.scrollWidth);
      }
    };
    updateWidths();
    const id = window.setTimeout(updateWidths, 50);
    window.addEventListener('resize', updateWidths);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', updateWidths);
    };
  }, []);
  
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

  // Lock modal state

  // Get user data from context
  const { userData, loading: userLoading, error: userError, refetch: refetchUser } = useUserData();

  // React Query hooks for optimized data fetching
  const { data: useCases = [], error, isLoading, refetch, updateUseCase } = useUseCases();
  console.log('useCases', useCases);
  const updateStageMutation = useUpdateUseCaseStage();
  const deleteUseCaseMutation = useDeleteUseCase();
  

  // Use closestCenter for more reliable drop detection
  const customCollisionDetection = closestCenter;

  // DnD sensors - more permissive for better drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Very low distance for immediate activation
      },
    })
  );

  useEffect(() => {
    // Fetch organizations for the dropdown - only for QZEN_ADMIN users
    const fetchOrganizations = async () => {
      try {
        const res = await fetch('/api/admin/organizations');
        const data = await res.json();
        if (res.ok && Array.isArray(data.organizations)) {
          setOrganizations(data.organizations);
        }
      } catch (err) {
        // fail silently for now
      }
    };
    
    // Only fetch organizations if user is QZEN_ADMIN
    if (userData?.role === 'QZEN_ADMIN') {
      fetchOrganizations();
    }
  }, [userData?.role]);



  // Clear deleted use case IDs on component mount to ensure fresh data
  useEffect(() => {
    setDeletedUseCaseIds(new Set());
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/edit-usecase/${id}`);
  }

  const handleView = (id: string) => {
    router.push(`/view-usecase/${id}`);
  }

  const handleAssess = (id: string) => {
    router.push(`/dashboard/${id}/assess`);
  }

  const handleDelete = async (id: string) => {
    // First confirmation
    if (!confirm('Are you sure you want to delete this use case? This action cannot be undone.')) {
      return;
    }
    
    // Second confirmation
    if (!confirm('This action is irreversible. Are you absolutely certain you want to delete this use case?')) {
      return;
    }

    try {
      // Show loading state
      setDeletingUseCaseId(id);
      setSelectedUseCase(null);
      
      // Add to deleted set immediately for instant UI feedback
      setDeletedUseCaseIds(prev => new Set([...prev, id]));
      
      await deleteUseCaseMutation.mutateAsync(id);
      
      // Close modal if it's open
      if (modalUseCase?.id === id) {
        setIsSheetOpen(false);
        setModalUseCase(null);
      }
      
      // Refetch data to ensure consistency with backend
      await refetch();
      
    } catch (error) {
      console.error('Error deleting use case:', error);
      // Remove from deleted set on error
      setDeletedUseCaseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      if (error instanceof Error) {
        alert(`Failed to delete use case: ${error.message}`);
      } else {
        alert('Failed to delete use case. Please try again.');
      }
    } finally {
      // Clear loading state
      setDeletingUseCaseId(null);
    }
  };

  // Add organization and business function filtering to use cases
  const orgFilteredUseCases = selectedOrgId
    ? useCases.filter((uc: any) => uc.organizationId === selectedOrgId)
    : useCases;
    
  const businessFunctionFilteredUseCases = selectedBusinessFunction
    ? useCases.filter((uc: any) => uc.businessFunction === selectedBusinessFunction)
    : useCases;

  // Apply additive filtering - both organization AND business function filters can be active
  let baseFilteredUseCases = useCases;
  
  if (selectedOrgId) {
    baseFilteredUseCases = baseFilteredUseCases.filter((uc: any) => uc.organizationId === selectedOrgId);
  }
  
  if (selectedBusinessFunction) {
    baseFilteredUseCases = baseFilteredUseCases.filter((uc: any) => uc.businessFunction === selectedBusinessFunction);
  }

  const filteredUseCases = baseFilteredUseCases.filter(useCase => {
    // Skip deleted use cases
    if (deletedUseCaseIds.has(useCase.id)) {
      return false;
    }
    
    const matchesSearch = useCase.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      useCase.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy.toLowerCase() === 'all' ||
      (useCase.priority && useCase.priority.toLowerCase() === filterBy.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  // Helper to check if all required fields are filled
  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    // Remove HTML tags and decode entities
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped;
  };

  // Helper function to format AIUC ID
  const formatAiucId = (aiucId: string | number | undefined, id: string): string => {
    if (aiucId) {
      const aiucIdStr = String(aiucId);
      // If aiucId already has AIUC- prefix, return as is
      if (aiucIdStr.startsWith('AIUC-')) {
        return aiucIdStr;
      }
      // Otherwise add AIUC- prefix
      return `AIUC-${aiucIdStr}`;
    }
    // Fallback to using regular id with AIUC- prefix
    return `AIUC-${id}`;
  };

  // Fix: Only show use cases in the column matching their current stage
  const getUseCasesByStage = (stageId: string) => {
    return filteredUseCases.filter(useCase => useCase.stage === stageId);
  };

  const getOverallScore = (scores: { operational: number, productivity: number, revenue: number }) =>
    ((scores.operational + scores.productivity + scores.revenue) / 3).toFixed(1);

  // Handler to update the stage of a use case
  const handleMoveToStage = async (useCaseId: string, newStage: string) => {
    // Update frontend immediately for instant feedback
    updateUseCase(useCaseId, { stage: newStage });

    // Update local state immediately for better UX
    setSelectedUseCase((prev: MappedUseCase | null) =>
      prev ? { ...prev, stage: newStage } : prev
    );
    setSelectedUseCase(null);
    
    // Update backend
    updateStageMutation.mutateAsync({ useCaseId, newStage })
      .catch((error) => {
        console.error("Unable to update stage", error);
        // Revert the frontend update on error
        if (useCase) {
          updateUseCase(useCaseId, { stage: useCase.stage });
        }
      });
  };

  // Update priority with optimistic UI and rollback on failure
  const handlePriorityChange = async (useCaseId: string, newPriority: string) => {
    const existing = useCases.find((uc: any) => uc.id === useCaseId);
    const prevPriority = existing?.priority;

    // Optimistic UI update
    updateUseCase(useCaseId, { priority: newPriority });
    setModalUseCase((prev) => (prev?.id === useCaseId ? { ...prev, priority: newPriority } : prev));

    try {
      const response = await fetch('/api/update-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, priority: newPriority })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to update priority');
      }
      // Optionally refresh in background to sync with backend later
      // void refetch();
    } catch (err) {
      // Rollback on failure
      if (typeof prevPriority !== 'undefined') {
        updateUseCase(useCaseId, { priority: prevPriority });
        setModalUseCase((prev) => (prev?.id === useCaseId ? { ...prev, priority: prevPriority } : prev));
      }
      alert(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };


  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag started:', event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag ended:', { active: active.id, over: over?.id });
    setActiveId(null);

    if (!over) {
      console.log('No drop target found');
      return;
    }

    const useCaseId = active.id as string;
    const targetId = over.id as string;

    console.log('Drop target:', { useCaseId, targetId });

    // Check if the target is a stage column
    const isTargetStage = stages.some(stage => stage.id === targetId);
    console.log('Is target stage:', isTargetStage);
    
    if (isTargetStage) {
      const useCase = filteredUseCases.find(uc => uc.id === useCaseId);
      console.log('Found use case:', useCase);
      
      if (useCase && useCase.stage !== targetId) {
        console.log('Moving use case from', useCase.stage, 'to', targetId);
        
        // Update frontend immediately for instant feedback
        updateUseCase(useCaseId, { stage: targetId });

        // Update backend
        updateStageMutation.mutateAsync({ useCaseId, newStage: targetId })
          .catch((error) => {
            console.error("Unable to update stage", error);
            // Revert the frontend update on error
            updateUseCase(useCaseId, { stage: useCase.stage });
          });
      } else {
        console.log('Use case not found or already in target stage');
      }
    } else {
      console.log('Target is not a valid stage');
    }
  };



  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className={`${baseCardClass} max-w-md`}>
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">
              Unable to load user data
            </h2>
            <p className="text-xs text-muted-foreground">{userError}</p>
            <Button size="sm" onClick={() => refetchUser()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className={`${baseCardClass} max-w-md`}>
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">
              Unable to load use cases
            </h2>
            <p className="text-xs text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className={`${baseCardClass} max-w-md`}>
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading use cases…' : 'Loading user data…'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push('/new-usecase')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Use Case
              </Button>
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex-shrink-0 mb-3">
          <div className={`bg-card border border-border rounded-sm p-3`}>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or owner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-sm bg-background"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="h-8 px-3 text-xs border border-border rounded-sm bg-background text-foreground"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                {userData?.role === 'QZEN_ADMIN' && (
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="h-8 px-3 text-xs border border-border rounded-sm bg-background text-foreground min-w-[140px]"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={selectedBusinessFunction}
                  onChange={(e) => setSelectedBusinessFunction(e.target.value)}
                  className="h-8 px-3 text-xs border border-border rounded-sm bg-background text-foreground min-w-[140px]"
                >
                  <option value="">All Functions</option>
                  {businessFunctions.map((func) => (
                    <option key={func} value={func}>
                      {func}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className={`${baseCardClass} relative min-h-[520px] flex flex-col`}>
          {deletingUseCaseId && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <Card className={`${baseCardClass} max-w-xs`}>
                <div className="p-4 flex flex-col items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Deleting use case…
                  </p>
                </div>
              </Card>
            </div>
          )}
          
          {/* Top scrollbar */}
          <div
            ref={scrollBarRef}
            className="overflow-x-auto overflow-y-hidden border-b bg-background/70 mb-3"
            onScroll={handleScrollBarScroll}
            style={{ width: '100%', height: 16 }}
          >
            <div
              className="h-3 bg-transparent"
              style={{
                width: effectiveWidth,
                minWidth: '100%',
              }}
            />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="relative w-full">
              <div 
                ref={contentRef}
                className="w-full h-full overflow-x-auto overflow-y-hidden"
                onScroll={handleContentScroll}
                style={{ scrollbarGutter: 'stable both-edges' }}
              >
                <div className="flex gap-4 h-full pr-8">
                  {stages.map((stage, idx) => {
                    const stageUseCases = getUseCasesByStage(stage.id);
                    
                    return (
                      <div key={`column-${stage.id}`} className="flex-shrink-0 flex-1 min-w-[260px]">
                        <DroppableStageColumn stage={stage} stageUseCases={stageUseCases}>
                          {/* Stage header */}
                          <div className="mb-3">
                            <div
                              className={`rounded-sm px-3 py-2 flex items-center justify-between ${stage.color}`}
                            >
                              <div>
                                <div
                                  className={`text-sm font-medium ${stage.textColor}`}
                                >
                                  {stage.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {stageUseCases.length}{' '}
                                  {stageUseCases.length === 1 ? 'item' : 'items'}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded-full">
                                {stageUseCases.length}
                              </div>
                            </div>
                          </div>
                          {/* Stage items */}
                          <div className="space-y-2 min-h-[200px]">
                            <SortableContext
                              id={stage.id}
                              items={stageUseCases.map((uc) => uc.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {stageUseCases.length === 0 ? (
                                <div className="border border-dashed border-border rounded-sm px-3 py-5 text-center text-xs text-muted-foreground">
                                  No items in this stage
                                </div>
                              ) : stageUseCases.map((useCase) => (
                                <DraggableUseCaseCard
                                  key={useCase.id}
                                  useCase={useCase}
                                  onClick={() => { setModalUseCase(useCase); setIsSheetOpen(true); }}
                                  handlePriorityChange={handlePriorityChange}
                                  formatAiucId={formatAiucId}
                                  stripHtmlTags={stripHtmlTags}
                                  _priorities={_priorities}
                                  handleDelete={handleDelete}
                                  isDeleting={deletingUseCaseId === useCase.id}
                                />
                              ))}
                            </SortableContext>
                          </div>
                        </DroppableStageColumn>
                      </div>
                    );
                  })}
                  {/* Right-side spacer to allow full scroll visibility of last column */}
                  <div className="flex-shrink-0 w-6" />
                </div>
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
            {activeId ? (
              (() => {
                const useCase = filteredUseCases.find(uc => uc.id === activeId);
                if (!useCase) return null;
                const currentStage = stages.find(stage => stage.id === useCase.stage);
                const stageColor = currentStage?.color || 'bg-card';
                const stageAccentColor = currentStage?.accentColor || 'bg-primary';
                
                return (
                  <Card
                    className={`${baseCardClass} w-60 shadow-2xl relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 ${stageAccentColor}`}
                    />
                    <div className="p-3 space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                          {formatAiucId(useCase.aiucId, useCase.id)}
                        </div>
                        {useCase.priority && (
                          <span
                            className={`text-[11px] px-3 py-1.5 rounded-full font-medium border ${_priorities[useCase.priority as keyof typeof _priorities]?.color || 'bg-muted text-foreground'}`}
                          >
                            {_priorities[useCase.priority as keyof typeof _priorities]
                              ?.label || useCase.priority}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-sm text-foreground line-clamp-2">
                        {useCase.title}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                        <span className="flex items-center gap-1.5">
                          {useCase.creator.type === 'user' ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Building2 className="w-3 h-3" />
                          )}
                          <span className="truncate font-medium">
                            {useCase.creator.name}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/80">
                          {useCase.lastUpdated}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })()
            ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Sheet for use case actions */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="right"
            className="flex flex-col !p-0 !gap-0 overflow-hidden max-h-screen"
          >
            {modalUseCase && (
              <div className="flex flex-col h-full min-h-0">
                <SheetHeader className="flex-shrink-0 border-b px-4 py-3">
                  <SheetTitle className="text-sm font-semibold">
                    {modalUseCase.title}
                  </SheetTitle>
                  {modalUseCase.description && (
                    <SheetDescription className="text-xs text-muted-foreground mt-1">
                      {stripHtmlTags(modalUseCase.description)}
                    </SheetDescription>
                  )}
                </SheetHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 text-xs">
                  <div className="text-muted-foreground">
                    ID:{' '}
                    <span className="font-mono">
                      {formatAiucId(modalUseCase.aiucId, modalUseCase.id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-primary">
                      <span>Operational:</span>
                      <span className="font-medium">
                        {modalUseCase.scores.operational}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <span>Productivity:</span>
                      <span className="font-medium">
                        {modalUseCase.scores.productivity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span>Revenue:</span>
                      <span className="font-medium">
                        {modalUseCase.scores.revenue}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <span>Overall:</span>
                      <span>{getOverallScore(modalUseCase.scores)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {modalUseCase.creator.type === 'user' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Created by <span className="font-medium">{modalUseCase.creator.name}</span>
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Updated <span className="font-mono">{modalUseCase.lastUpdated}</span>
                  </div>
                </div>
                <SheetFooter className="flex-shrink-0 border-t px-4 py-3 flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleView(modalUseCase.id);
                      setIsSheetOpen(false);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {(() => {
                    // Only show edit button if user is the owner or ORG_ADMIN
                    const isOwner = modalUseCase.userId && userData?.id && modalUseCase.userId === userData.id;
                    const isOrgAdmin = userData?.role === 'ORG_ADMIN';
                    const canEdit = isOwner || isOrgAdmin;
                    
                    return canEdit ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleEdit(modalUseCase.id);
                          setIsSheetOpen(false);
                        }}
                      >
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit Construct
                      </Button>
                    ) : null;
                  })()}
                  {(userData?.role === 'USER' ||
                    userData?.role === 'ORG_ADMIN' ||
                    userData?.role === 'ORG_USER' ||
                    userData?.role === 'QZEN_ADMIN') &&
                    modalUseCase.stage !== 'deployment' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleMoveToStage(
                            modalUseCase.id,
                            getNextStage(modalUseCase.stage)
                          );
                          setIsSheetOpen(false);
                        }}
                        className="whitespace-nowrap"
                      >
                        <ArrowRightIcon className="w-4 h-4 mr-2" />
                        Next Stage
                      </Button>
                    )}
                  {(userData?.role === 'USER' ||
                    userData?.role === 'ORG_ADMIN' ||
                    userData?.role === 'ORG_USER' ||
                    userData?.role === 'QZEN_ADMIN') &&
                    modalUseCase.stage !== 'discovery' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleAssess(modalUseCase.id);
                          setIsSheetOpen(false);
                        }}
                      >
                        Assess
                      </Button>
                    )}
                  <SheetClose asChild>
                    <Button size="sm" variant="secondary">
                      Close
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

    </div>
  );
};

export default Dashboard;