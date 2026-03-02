'use client'

import { useParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

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

const getUseCase = async(params: string) => {
    try {
        const res = await fetch(`/api/get-usecase?id=${params}`);
        if (!res.ok) {
            throw new Error('Failed to fetch use case');
        }
        const useCaseData = await res.json();
        return useCaseData;
    } catch (_error) {
        console.error('Error fetching use case:', _error);
        throw _error;
    }
};

interface OrganizationMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

const AIUseCaseToolContent = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const router = useRouter();

  const params = useParams();
  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const userData = await res.json();
          if (userData.organizationId) {
            const orgRes = await fetch(`/api/admin/organizations/${userData.organizationId}`);
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

  // Load existing use case if editing (via query param)
  useEffect(() => {
    const fetchAndFill = async () => {
      const useCaseIdFromParams = params?.id as string | undefined;
      const useCaseId = useCaseIdFromParams;
      if (!useCaseId) return;
      try {
        const data = await getUseCase(useCaseId);
        if (data) {
          setFormData((prev) => ({
            ...prev,
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
          }));
        }
      } catch (_error) {
        console.error('Error fetching use case:', _error);
        setShowError(true);
      }
    };
    fetchAndFill();
  }, [params]);

  const handleChange = (field: keyof FormData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCheckboxToggle = (field: 'regulatoryFrameworks' | 'industryStandards', value: string) => {
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
    // Validate required fields
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

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 dark:bg-gray-900 p-0 sm:p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-0 sm:border sm:mt-6 sm:mb-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8f4fff] via-[#b84fff] to-[#ff4fa3] px-6 py-5">
          <h1 className="text-xl font-bold text-white">
            {formData.aiucId ? `AIUC-${formData.aiucId} — Edit Use Case` : 'New AI Use Case'}
          </h1>
          <p className="text-white/80 text-sm mt-1">Capture the essentials to get your AI use case into the pipeline.</p>
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
                className={`${invalidFields.includes('title') ? 'border-red-500' : ''} dark:bg-gray-700 dark:text-white dark:border-gray-600`}
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
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  disabled={membersLoading}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.regulatoryFrameworks.includes(opt.value)}
                      onChange={() => handleCheckboxToggle('regulatoryFrameworks', opt.value)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white font-medium">Industry Standards</Label>
                {INDUSTRY_STANDARD_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.industryStandards.includes(opt.value)}
                      onChange={() => handleCheckboxToggle('industryStandards', opt.value)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
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
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#10b981] hover:bg-[#059669] dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Submit Use Case'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIUseCaseTool = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AIUseCaseToolContent />
    </Suspense>
  );
};

export default AIUseCaseTool;
