'use client'

import { useParams } from "next/navigation";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useUserData } from '@/contexts/UserContext';

type FormData = {
  id?: string;
  aiucId?: number;
  title: string;
  problemStatement: string;
  proposedAISolution: string;
  aiType?: string;
  businessFunction: string;
  executiveSponsor?: string;
  priority: string;
  stage?: string;
  regulatoryFrameworks: string[];
  industryStandards: string[];
};

const REGULATORY_FRAMEWORK_OPTIONS = [
  { value: 'EU AI Act', label: 'EU AI Act' },
  { value: 'UAE AI/GenAI Controls', label: 'UAE AI/GenAI Controls' },
];

const INDUSTRY_STANDARD_OPTIONS = [
  { value: 'ISO 27001', label: 'ISO 27001 (Information Security)' },
  { value: 'ISO/IEC 42001:2023', label: 'ISO/IEC 42001:2023 – AI Management System (AIMS)' },
];

const initialFormData: FormData = {
  title: "",
  problemStatement: "",
  proposedAISolution: "",
  aiType: "",
  businessFunction: "",
  executiveSponsor: "",
  priority: "MEDIUM",
  regulatoryFrameworks: [],
  industryStandards: [],
};

interface OrganizationMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

const EditUseCaseContent = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [useCaseOwnerId, setUseCaseOwnerId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const useCaseId = params["usecase-id"] as string;
  const { userData } = useUserData();

  // Determine if current user can edit
  const canEdit = useMemo(() => {
    if (!userData?.id || !useCaseOwnerId) return false;
    if (userData.role === 'ORG_ADMIN' || userData.role === 'QZEN_ADMIN') return true;
    return userData.id === useCaseOwnerId;
  }, [userData?.id, userData?.role, useCaseOwnerId]);

  const isReadOnly = !canEdit;

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          if (data.organizationId) {
            const orgRes = await fetch(`/api/admin/organizations/${data.organizationId}`);
            if (orgRes.ok) {
              const orgData = await orgRes.json();
              setOrganizationMembers(orgData.organization?.users || []);
            }
          }
        }
      } catch (_error) {
        console.error('Error fetching members:', _error);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Load existing use case
  useEffect(() => {
    if (!useCaseId) return;
    const fetchUseCase = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-usecase?id=${useCaseId}`);
        if (!res.ok) throw new Error('Failed to fetch use case');
        const data = await res.json();
        if (data) {
          setUseCaseOwnerId(data.userId || null);
          setFormData({
            id: data.id,
            aiucId: data.aiucId,
            title: data.title || '',
            problemStatement: data.problemStatement || '',
            proposedAISolution: data.proposedAISolution || '',
            aiType: data.aiType || '',
            businessFunction: data.businessFunction || '',
            executiveSponsor: data.executiveSponsor || '',
            priority: data.priority || 'MEDIUM',
            stage: data.stage,
            regulatoryFrameworks: data.regulatoryFrameworks || [],
            industryStandards: data.industryStandards || [],
          });
        }
      } catch (_error) {
        console.error('Error fetching use case:', _error);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUseCase();
  }, [useCaseId]);

  const handleChange = (field: keyof FormData, val: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCheckboxToggle = (field: 'regulatoryFrameworks' | 'industryStandards', value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const getMemberDisplayName = (member: OrganizationMember) => {
    const name = [member.firstName, member.lastName].filter(Boolean).join(' ');
    return name || member.email;
  };

  const handleSubmit = async () => {
    const invalid: string[] = [];
    if (!formData.title.trim()) invalid.push('title');
    if (!formData.problemStatement.trim()) invalid.push('problemStatement');
    setInvalidFields(invalid);
    setShowError(invalid.length > 0);
    if (invalid.length > 0) return;

    try {
      setSaving(true);
      const body = {
        ...formData,
        stage: formData.stage || 'discovery',
      };

      const res = await fetch("/api/write-usecases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await res.text();
        console.error("Save failed:", errorData);
        alert("Failed to save use case. Please try again.");
      }
    } catch (error) {
      console.error("Error saving use case:", error);
      alert("Unable to save Use Case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading use case...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 dark:bg-gray-900 p-0 sm:p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-0 sm:border sm:mt-6 sm:mb-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8f4fff] via-[#b84fff] to-[#ff4fa3] px-6 py-5">
          <h1 className="text-xl font-bold text-white">
            {formData.aiucId ? `AIUC-${formData.aiucId} — Edit Use Case` : 'Edit Use Case'}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            {isReadOnly ? 'You are viewing this use case in read-only mode.' : 'Update the details of your AI use case.'}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {showError && (
            <div className="text-red-600 dark:text-red-400 text-sm font-medium">
              Please fill in all required fields.
            </div>
          )}

          {/* Use Case Details */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Use Case Details</h2>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-900 dark:text-white">
                Use Case Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. Customer Support Copilot"
                disabled={isReadOnly}
                className={`${invalidFields.includes('title') ? 'border-red-500' : ''} dark:bg-gray-700 dark:text-white dark:border-gray-600 ${isReadOnly ? 'opacity-60' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemStatement" className="text-gray-900 dark:text-white">
                Problem Statement <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                content={formData.problemStatement}
                onChange={(content) => handleChange("problemStatement", content)}
                placeholder="What problem does this AI use case solve?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedAISolution" className="text-gray-900 dark:text-white">
                Proposed AI Solution
              </Label>
              <RichTextEditor
                content={formData.proposedAISolution}
                onChange={(content) => handleChange("proposedAISolution", content)}
                placeholder="Briefly describe the AI approach (e.g. RAG-based chatbot, multi-agent workflow, fine-tuned classifier...)"
              />
            </div>
          </Card>

          {/* Classification */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Classification</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aiType" className="text-gray-900 dark:text-white">AI Type</Label>
                <select
                  id="aiType"
                  value={formData.aiType || ''}
                  onChange={e => handleChange("aiType", e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isReadOnly ? 'opacity-60' : ''}`}
                >
                  <option value="">Select AI type</option>
                  <option value="Gen AI">Gen AI</option>
                  <option value="Agentic AI">Agentic AI</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Traditional ML">Traditional ML</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessFunction" className="text-gray-900 dark:text-white">Business Function</Label>
                <select
                  id="businessFunction"
                  value={formData.businessFunction}
                  onChange={e => handleChange("businessFunction", e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isReadOnly ? 'opacity-60' : ''}`}
                >
                  <option value="">Select a business function</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Product Development">Product Development</option>
                  <option value="Operations">Operations</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="Legal">Legal</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Communications">Communications</option>
                  <option value="Risk & Audit">Risk & Audit</option>
                  <option value="Innovation Office">Innovation Office</option>
                  <option value="ESG">ESG</option>
                  <option value="Data Office">Data Office</option>
                  <option value="PMO">PMO</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-900 dark:text-white">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={e => handleChange("priority", e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isReadOnly ? 'opacity-60' : ''}`}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executiveSponsor" className="text-gray-900 dark:text-white">Executive Sponsor</Label>
                <select
                  id="executiveSponsor"
                  value={formData.executiveSponsor || ''}
                  onChange={e => handleChange("executiveSponsor", e.target.value)}
                  disabled={membersLoading || isReadOnly}
                  className={`w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${isReadOnly ? 'opacity-60' : ''}`}
                >
                  <option value="">Select executive sponsor</option>
                  {organizationMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getMemberDisplayName(member)} {member.email ? `(${member.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Governance & Compliance */}
          <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Governance & Compliance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select the regulatory frameworks and industry standards applicable to this use case.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white font-medium">Regulatory Frameworks</Label>
                {REGULATORY_FRAMEWORK_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 ${isReadOnly ? '' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={formData.regulatoryFrameworks.includes(opt.value)}
                      onChange={() => handleCheckboxToggle('regulatoryFrameworks', opt.value)}
                      disabled={isReadOnly}
                      className={`h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 ${isReadOnly ? 'opacity-60' : ''}`}
                    />
                    <span className={`text-sm text-gray-700 dark:text-gray-300 ${isReadOnly ? 'opacity-60' : ''}`}>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white font-medium">Industry Standards</Label>
                {INDUSTRY_STANDARD_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 ${isReadOnly ? '' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={formData.industryStandards.includes(opt.value)}
                      onChange={() => handleCheckboxToggle('industryStandards', opt.value)}
                      disabled={isReadOnly}
                      className={`h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 ${isReadOnly ? 'opacity-60' : ''}`}
                    />
                    <span className={`text-sm text-gray-700 dark:text-gray-300 ${isReadOnly ? 'opacity-60' : ''}`}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-[#10b981] hover:bg-[#059669] dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditUseCase = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <EditUseCaseContent />
    </Suspense>
  );
};

export default EditUseCase;
