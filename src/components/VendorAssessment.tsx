'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Save, X, Eye, Trash2, Search, BarChart3, Users } from 'lucide-react';
import { vendorService, type Vendor } from '@/lib/vendorService';
import { useStableRender } from '@/hooks/useStableRender';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Types
interface User {
  id: string;
  name: string;
}

interface VendorAssessmentProps {
  user: User;
}

type ViewMode = 'list' | 'form' | 'dashboard';

const VendorAssessment: React.FC<VendorAssessmentProps> = ({ user: _user }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Use global stable render hook
  const { isReady } = useStableRender();

  const categories = [
    'LLM/Foundation Models',
    'LLM Orchestration',
    'Agentic Frameworks',
    'Conversational AI',
    'Document Intelligence',
    'Code Generation',
    'Content Generation',
    'Analytics & Insights',
    'MLOps Platform',
    'Speech & Audio AI',
    'Robotic Process Automation',
    'Edge AI & IoT',
    'AI Hardware & Infrastructure',
    'Data Labeling & Annotation',
    'AI Testing & Validation',
    'AI Governance & Risk',
    'Other'
  ];

  const assessmentCriteria = {
    'Strategic Alignment': {
      'Use Case Fit': 'Does the vendor\'s solution align with your specific business goals and domain requirements?',
      'Value Proposition': 'Is there demonstrable ROI or competitive advantage?',
      'Customization Ability': 'Can the solution be tailored to your data, workflows, or enterprise architecture?'
    },
    'Model and Technology Evaluation': {
      'Model Transparency': 'Do they use open-source, proprietary, or third-party models? Can they disclose architecture?',
      'Model Performance': 'Accuracy, latency, scalability, and reliability. Support for fine-tuning?',
      'Multimodal Capabilities': 'Support for text, vision, audio as needed for your business'
    },
    'Data Governance & Security': {
      'Data Handling': 'Is customer data used for model training? Is your data isolated or pooled?',
      'Compliance': 'GDPR, HIPAA, SOC 2, ISO 27001, and internal data residency requirements',
      'Security Controls': 'Encryption at rest & transit, API security, access control, incident response',
      'Security Audits & Certifications': 'Has the vendor undergone a recent third-party security audit?',
      'Security Incident History': 'Are there known vulnerabilities or data breaches reported?',
      'Authentication & Access Management': 'Is multi-factor authentication (MFA) required for access?',
      'Access Management & Authorization': 'Does the tool allow administrators to restrict access by role?'
    },
    'Responsible AI & Ethics': {
      'Bias & Fairness Checks': 'Does the provider audit models for demographic or institutional bias?',
      'Explainability': 'Do they provide tools for interpreting model decisions?',
      'Content Moderation': 'Are guardrails in place for harmful, toxic, or hallucinated outputs?',
      'AI Governance': 'Do they have internal ethical boards or review processes?'
    },
    'Integration & Interoperability': {
      'APIs and SDKs': 'Is it easy to integrate with your tech stack (REST, Python, Java)?',
      'Workflow Compatibility': 'Support for CI/CD pipelines, MLOps tools?',
      'Vendor Lock-in Risk': 'How easy is it to migrate your data/models if needed?'
    },
    'Licensing, Pricing & SLAs': {
      'Licensing Terms': 'Clarity around usage rights, model ownership, and retraining',
      'Pricing Model': 'Pay-per-use, seat-based, or flat pricing? Limits on API calls?',
      'Service Level Agreements': 'Uptime guarantees, support responsiveness, penalty clauses'
    },
    'Maturity & Track Record': {
      'Company Stability': 'Funding, customer base, partnerships, and longevity',
      'Case Studies & References': 'Success stories from companies in your domain?',
      'Innovation Roadmap': 'Are they actively evolving and responsive to latest AI advancements?'
    },
    'Regulatory & Legal Considerations': {
      'Model Licensing Restrictions': 'Risk in using open-source models in commercial settings?',
      'IP & Copyright Risks': 'Can they demonstrate outputs don\'t violate copyright/IP?',
      'Liability Clauses': 'Who is responsible for AI misbehavior?',
      'Data Protection Agreements': 'Can the vendor provide a Data Processing Agreement (DPA)?'
    },
    'Operational Excellence & Support': {
      'Documentation Quality': 'How thorough are technical docs, API references, implementation guides?',
      'Developer Experience': 'Quality of SDKs, code examples, onboarding process',
      'Support Tiers': 'Response times, escalation paths, technical account management',
      'Training & Enablement': 'Do they provide training for your team or certification programs?'
    },
    'Performance Monitoring & Observability': {
      'Model Drift Detection': 'Can you monitor for degradation in model performance over time?',
      'Usage Analytics': 'Detailed metrics on API calls, latency, error rates, cost attribution',
      'A/B Testing Support': 'Ability to test different models or configurations',
      'Alerting & Notifications': 'Real-time alerts for performance issues or anomalies'
    },
    'Business Continuity & Risk Management': {
      'Disaster Recovery': 'What are their backup and recovery procedures?',
      'Geographic Redundancy': 'Multi-region deployment options for resilience',
      'Dependency Risks': 'What happens if they lose access to underlying models?',
      'Exit Strategy': 'Data portability, transition assistance, contract termination procedures'
    },
    'Future-Proofing & Scalability': {
      'Model Versioning': 'How do they handle model updates and backwards compatibility?',
      'Scaling Limits': 'Maximum throughput, concurrent users, or data volume limits',
      'Edge Deployment': 'Options for on-premises or edge computing deployment',
      'Multi-tenant Architecture': 'How well does their infrastructure scale with your growth?'
    }
  };


  // Memoize color functions to prevent unnecessary re-renders
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Approved': return 'text-success-700 dark:text-success-400 bg-success-100 dark:bg-success-900/30 border border-success-200 dark:border-success-800';
      case 'Rejected': return 'text-destructive-700 dark:text-destructive-400 bg-destructive-100 dark:bg-destructive-900/30 border border-destructive-200 dark:border-destructive-800';
      case 'On Hold': return 'text-warning-700 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800';
      case 'In Assessment': return 'text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800';
      default: return 'text-muted-foreground bg-muted border border-border';
    }
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 4) return 'text-success-700 dark:text-success-400 bg-success-100 dark:bg-success-900/30 border border-success-200 dark:border-success-800';
    if (score >= 3) return 'text-warning-700 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800';
    if (score >= 2) return 'text-warning-700 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800';
    if (score >= 1) return 'text-destructive-700 dark:text-destructive-400 bg-destructive-100 dark:bg-destructive-900/30 border border-destructive-200 dark:border-destructive-800';
    return 'text-muted-foreground bg-muted border border-border';
  }, []);

  // Memoize filtered vendors to prevent unnecessary re-renders
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory;
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [vendors, filterCategory, searchTerm]);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await vendorService.getVendors();
    if (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
    
    // Debug: Log vendor data to see if approval data is included
    console.log('[VendorAssessment] Loaded vendors:', data);
    if (data && data.length > 0) {
      console.log('[VendorAssessment] First vendor approval data:', data[0].approvals);
      console.log('[VendorAssessment] All vendor IDs:', data.map((v: Vendor) => v.id));
    }
    
    setVendors(data || []);
    setLoading(false);
  };

  const createEmptyVendor = (): Vendor => ({
    id: crypto.randomUUID(),
    name: '',
    category: categories[0],
    website: '',
    contactPerson: '',
    contactEmail: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    overallScore: 0,
    status: 'In Assessment',
    notes: '',
    scores: {},
    comments: {},
    approvals: {
      'Procurement': { status: 'Pending', approvedBy: null, approvedDate: null, comments: '' },
      'Legal': { status: 'Pending', approvedBy: null, approvedDate: null, comments: '' },
      'Governance': { status: 'Pending', approvedBy: null, approvedDate: null, comments: '' },
      'Compliance': { status: 'Pending', approvedBy: null, approvedDate: null, comments: '' }
    }
  });

  const addVendor = () => {
    const newVendor = createEmptyVendor();
    setCurrentVendor(newVendor);
    setIsEditing(true);
    setViewMode('form');
    setActiveTab(0);
  };

  const saveVendor = async () => {
    if (!currentVendor?.name.trim()) {
      alert('Please enter a vendor name');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let result: { data: Vendor | null; error: string | null };
      
      // Check if this is an existing vendor by checking if it exists in our loaded vendors list
      const isExistingVendor = currentVendor.id && vendors.some(v => v.id === currentVendor.id);
      
      console.log('[VendorAssessment] Saving vendor:', {
        id: currentVendor.id,
        name: currentVendor.name,
        website: currentVendor.website,
        category: currentVendor.category,
        contactPerson: currentVendor.contactPerson,
        contactEmail: currentVendor.contactEmail,
        isExistingVendor,
        existsInVendors: vendors.some(v => v.id === currentVendor.id)
      });
      
      console.log('[VendorAssessment] Full vendor object being saved:', currentVendor);
      
      if (isExistingVendor) {
        console.log('[VendorAssessment] Updating existing vendor');
        result = await vendorService.updateVendor(currentVendor.id, currentVendor);
      } else {
        console.log('[VendorAssessment] Creating new vendor');
        result = await vendorService.createVendor(currentVendor);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Get the final vendor ID (either from existing vendor or newly created)
      const finalVendorId = isExistingVendor ? currentVendor.id : result.data?.id;
      
      // Ensure we have a valid vendor ID before proceeding
      if (!finalVendorId) {
        throw new Error('Vendor ID is missing after save operation');
      }

      // Update currentVendor with the final ID if it was a new vendor
      if (!isExistingVendor && result.data) {
        setCurrentVendor(prev => prev ? ({ ...prev, id: result.data!.id }) : null);
      }

      await saveAssessmentScores(finalVendorId);
      await saveApprovalAreas(finalVendorId);
      await loadVendors();
      setIsEditing(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else if (error) {
        setError(String(error));
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAssessmentScores = async (vendorId?: string) => {
    const targetVendorId = vendorId || currentVendor?.id;
    
    if (!targetVendorId) {
      console.error('Error saving assessment scores: No vendor ID available');
      throw new Error('No vendor ID available for saving assessment scores');
    }

    const scores = currentVendor?.scores || {};
    const comments = currentVendor?.comments || {};

    console.log('[VendorAssessment] Saving assessment scores for vendor:', targetVendorId);
    console.log('[VendorAssessment] Scores data:', scores);
    console.log('[VendorAssessment] Comments data:', comments);

    for (const [key, score] of Object.entries(scores)) {
      if (typeof score === 'number' && score > 0) {
        const [category, subcategory] = key.split('-');
        const comment = comments[key] || '';
        
        const { error } = await vendorService.updateAssessmentScore(
          targetVendorId.toString(),
          category,
          subcategory,
          score,
          comment
        );
        
        if (error) {
          console.error(`Error saving score for ${key}:`, error);
          throw new Error(`Failed to save assessment score for ${key}: ${error}`);
        }
      }
    }

    await vendorService.calculateOverallScore(targetVendorId.toString());
  };

  const saveApprovalAreas = async (vendorId?: string) => {
    const targetVendorId = vendorId || currentVendor?.id;
    
    if (!targetVendorId) {
      console.error('Error saving approval areas: No vendor ID available');
      throw new Error('No vendor ID available for saving approval areas');
    }

    console.log('[VendorAssessment] Saving approval areas for vendor:', targetVendorId);
    console.log('[VendorAssessment] Approval data:', currentVendor?.approvals);

    // Update the vendor with the current approval data
    const { error } = await vendorService.updateVendor(targetVendorId.toString(), {
      approvals: currentVendor?.approvals
    });

    if (error) {
      console.error('Error saving approval areas:', error);
      throw new Error(`Failed to save approval areas: ${error}`);
    } else {
      console.log('Approval areas saved successfully');
    }
  };

  const updateScore = (category: string, subcategory: string, score: string) => {
    const key = `${category}-${subcategory}`;
    setCurrentVendor(prev => {
      if (!prev) return null;
      
      const updatedVendor = {
        ...prev,
        scores: { ...prev.scores, [key]: parseInt(score) }
      };
      
      const scores = Object.values(updatedVendor.scores || {});
      const validScores = scores.filter((score): score is number => typeof score === 'number' && score > 0);
      const average = validScores.length > 0 ? 
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0;
      
      return { ...updatedVendor, overallScore: Math.round(average * 10) / 10 };
    });
  };

  const updateComment = (category: string, subcategory: string, comment: string) => {
    const key = `${category}-${subcategory}`;
    setCurrentVendor(prev => prev ? ({
      ...prev,
      comments: { ...prev.comments, [key]: comment }
    }) : null);
  };

  const updateApprovalStatus = (area: string, status: string) => {
    setCurrentVendor(prev => {
      if (!prev) return null;
      
      const updatedApprovals = {
        ...prev.approvals,
        [area]: {
          ...prev.approvals[area as keyof typeof prev.approvals],
          status: status as 'Pending' | 'Approved' | 'Rejected',
          approvedBy: status === 'Approved' ? (prev.approvals[area as keyof typeof prev.approvals].approvedBy || '') : null,
          approvedDate: status === 'Approved' ? (prev.approvals[area as keyof typeof prev.approvals].approvedDate || new Date().toISOString()) : null
        }
      };
      
      // Calculate new vendor status based on approval areas
      const approvalValues = Object.values(updatedApprovals);
      const allApproved = approvalValues.every(approval => approval.status === 'Approved');
      const anyRejected = approvalValues.some(approval => approval.status === 'Rejected');
      
      let newStatus: 'In Assessment' | 'Approved' | 'Rejected' | 'On Hold' = 'In Assessment';
      if (allApproved) {
        newStatus = 'Approved';
      } else if (anyRejected) {
        newStatus = 'Rejected';
      }
      
      return {
        ...prev,
        approvals: updatedApprovals,
        status: newStatus
      };
    });
  };

  const updateApprovalField = (area: string, field: string, value: string) => {
    setCurrentVendor(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        approvals: {
          ...prev.approvals,
          [area]: {
            ...prev.approvals[area as keyof typeof prev.approvals],
            [field]: value
          }
        }
      };
    });
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/delete-vendor?id=${vendorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete vendor');
      setVendors(prev => prev.filter(v => v.id !== vendorId));
    } catch {
      setError('Failed to delete vendor. Please try again.');
      alert('Failed to delete vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderVendorForm = () => {
    if (!currentVendor) return null;

    return (
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Vendor' : 'Vendor Details'}
          </h2>
          <div className="flex gap-2">
            {isEditing && (
              <button
                onClick={saveVendor}
                disabled={loading}
                className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Save size={16} />
                Save
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
            >
              <Edit2 size={16} />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
            >
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-muted/50 p-4 rounded-lg border border-border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Vendor Name</label>
              <input
                type="text"
                value={currentVendor.name}
                onChange={(e) => setCurrentVendor(prev => prev ? { ...prev, name: e.target.value } : null)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={currentVendor.category}
                onChange={(e) => setCurrentVendor(prev => prev ? { ...prev, category: e.target.value } : null)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Website</label>
              <input
                type="url"
                value={currentVendor.website}
                onChange={(e) => {
                  console.log('[VendorAssessment] Website input changed:', e.target.value);
                  setCurrentVendor(prev => prev ? { ...prev, website: e.target.value } : null);
                }}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Assessment Date</label>
              <input
                type="date"
                value={currentVendor.assessmentDate}
                onChange={(e) => setCurrentVendor(prev => prev ? { ...prev, assessmentDate: e.target.value } : null)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Assessment Criteria Tabs */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground border-b border-border pb-2">Assessment Criteria</h3>
          
          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="-mb-px flex flex-wrap">
              {Object.keys(assessmentCriteria).map((category, index) => (
                <button
                  key={category}
                  onClick={() => setActiveTab(index)}
                  className={`mr-2 mb-2 py-2 px-4 text-sm font-medium rounded-t-lg whitespace-nowrap ${
                    activeTab === index
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            {Object.entries(assessmentCriteria).map(([category, subcriteria], index) => (
              <div key={category} className={activeTab === index ? 'block' : 'hidden'}>
                <h4 className="text-lg font-semibold text-foreground mb-4">{category}</h4>
                <div className="space-y-4">
                  {Object.entries(subcriteria).map(([subcategory, description]) => {
                    const key = `${category}-${subcategory}`;
                    const score = currentVendor.scores[key] || 0;
                    const comment = currentVendor.comments[key] || '';
                    
                    return (
                      <div key={subcategory} className="bg-card rounded-lg p-4 border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">{subcategory}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Score:</span>
                            <select
                              value={score}
                              onChange={(e) => updateScore(category, subcategory, e.target.value)}
                              disabled={!isEditing}
                              className="w-20 px-2 py-1 border border-border rounded text-sm focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </div>
                        </div>
                        <textarea
                          value={comment}
                          onChange={(e) => updateComment(category, subcategory, e.target.value)}
                          disabled={!isEditing}
                          placeholder="Add your assessment notes..."
                          className="w-full px-3 py-2 border border-border rounded text-sm focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
                          rows={2}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Areas */}
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-semibold text-foreground border-b border-border pb-2">Approval Workflow</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(currentVendor.approvals).map(([area, approval]) => (
              <div key={area} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">{area}</h4>
                  <Select
                    value={approval.status}
                    onValueChange={(value) => updateApprovalStatus(area, value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-auto min-w-[120px] h-auto px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-primary disabled:opacity-75",
                        approval.status === 'Approved' ? 'bg-success/20 text-foreground border border-success/30' :
                        approval.status === 'Rejected' ? 'bg-destructive/20 text-foreground border border-destructive/30' :
                        'bg-warning/20 text-foreground border border-warning/30'
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {approval.status === 'Approved' && (
                  <div className="space-y-2">
                                          <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Approved By</label>
                        <input
                          type="text"
                          value={approval.approvedBy || ''}
                          onChange={(e) => updateApprovalField(area, 'approvedBy', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Enter approver name"
                          className="w-full px-2 py-1 text-sm border border-border rounded focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
                        />
                      </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Approval Date</label>
                      <input
                        type="date"
                        value={approval.approvedDate ? approval.approvedDate.split('T')[0] : ''}
                        onChange={(e) => updateApprovalField(area, 'approvedDate', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 text-sm border border-border rounded focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Comments</label>
                                      <textarea
                      value={approval.comments}
                      onChange={(e) => updateApprovalField(area, 'comments', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Add approval comments..."
                      className="w-full px-2 py-1 text-sm border border-border rounded focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted bg-card text-foreground"
                      rows={2}
                    />
                </div>
              </div>
            ))}
          </div>
          
          {/* Approval Status Summary */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground mb-1">Overall Approval Status</h4>
                <p className="text-sm text-muted-foreground">
                  {Object.values(currentVendor.approvals).filter(a => a.status === 'Approved').length} of 4 areas approved
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(currentVendor.status)}`}>
                {currentVendor.status}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="mt-8 bg-primary/10 rounded-lg p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Overall Assessment Score</h3>
            <div className={`px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(currentVendor.overallScore)}`}>
              {currentVendor.overallScore.toFixed(1)}/5.0
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVendorList = () => (
    // Vendor Assessment List Component - Dark Mode Enabled
    <div className="bg-card rounded-2xl shadow-sm border border-border">
      <div className="bg-muted/50 p-4 rounded-t-2xl border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={addVendor}
              className="flex items-center gap-2 bg-card text-foreground border border-border hover:bg-muted px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus size={14} />
              Add Vendor
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className="flex items-center gap-2 bg-card text-foreground border border-border hover:bg-muted px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <BarChart3 size={14} />
              Dashboard
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Assessment Date</th>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-muted/30 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-foreground">{vendor.name}</div>
                    <div className="text-xs text-muted-foreground">{vendor.contactEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{vendor.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium rounded-md ${getStatusColor(vendor.status)}`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 text-sm font-semibold rounded-md ${getScoreColor(vendor.overallScore)}`}>
                    {vendor.overallScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{vendor.assessmentDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        console.log('[VendorAssessment] Setting current vendor for view:', vendor);
                        console.log('[VendorAssessment] Vendor approval data:', vendor.approvals);
                        setCurrentVendor(vendor);
                        setViewMode('form');
                        setIsEditing(false);
                        setActiveTab(0);
                      }}
                      className="text-foreground hover:text-primary transition-colors duration-150"
                      title="View Vendor"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        console.log('[VendorAssessment] Setting current vendor for edit:', vendor);
                        console.log('[VendorAssessment] Vendor approval data:', vendor.approvals);
                        setCurrentVendor(vendor);
                        setViewMode('form');
                        setIsEditing(true);
                        setActiveTab(0);
                      }}
                      className="text-foreground hover:text-success transition-colors duration-150"
                      title="Edit Vendor"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="text-foreground hover:text-destructive transition-colors duration-150"
                      title="Delete Vendor"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-16 bg-muted/50">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No vendors found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Get started by adding a new vendor to assess.</p>
          <button
            onClick={addVendor}
            className="flex items-center gap-2 mx-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Plus size={16} />
            Add your first vendor
          </button>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Assessment Dashboard</h2>
        <div className="flex gap-3">
          <button
            onClick={addVendor}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-primary-foreground px-6 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Plus size={16} />
            Add Vendor
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 bg-card text-foreground border border-border hover:bg-muted px-6 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Users size={16} />
            View All Vendors
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-muted/50 p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold text-foreground">{vendors.length}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-success">
                {vendors.filter(v => v.status === 'Approved').length}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-full">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Assessment</p>
              <p className="text-2xl font-bold text-primary">
                {vendors.filter(v => v.status === 'In Assessment').length}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <BarChart3 size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-primary">
                {vendors.length > 0 ? 
                  (vendors.reduce((sum, v) => sum + v.overallScore, 0) / vendors.length).toFixed(1) : 
                  '0.0'
                }
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <BarChart3 size={24} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Vendors by Category Section - always visible */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">Vendors by Category</h3>
        <div className="space-y-4">
          {categories.map(category => {
            const approvedVendors = vendors.filter(v => v.category === category && v.status === 'Approved');
            if (approvedVendors.length === 0) return null;
            return (
              <div key={category} className="mb-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                  <span className="font-medium text-foreground">{category}</span>
                  <span className="text-sm text-success font-semibold">{approvedVendors.length} approved</span>
                </div>
                <ul className="ml-6 mt-3 space-y-2">
                  {approvedVendors.map(vendor => (
                    <li key={vendor.id} className="flex justify-between items-center">
                      <span className="text-foreground">{vendor.name}</span>
                      <span className="text-primary font-medium">Score: {vendor.overallScore.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {/* If no approved vendors in any category, show a message */}
          {categories.every(category => vendors.filter(v => v.category === category && v.status === 'Approved').length === 0) && (
            <div className="text-center text-muted-foreground py-12">No approved vendors by category yet.</div>
          )}
        </div>
      </div>
    </div>
  );

  // Don't render until mounted and data is loaded to prevent hydration mismatch
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('VendorAssessment error:', error);
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
        <div className="text-destructive font-medium">
          Error: {error && error !== "null" && error !== "undefined" ? error : "An unexpected error occurred. Please try again."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {viewMode === 'list' && renderVendorList()}
      {viewMode === 'form' && renderVendorForm()}
      {viewMode === 'dashboard' && renderDashboard()}
    </div>
  );
};

export default React.memo(VendorAssessment);