'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, Users, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GovernanceBody {
  id?: string;
  name: string;
  type: string;
  description?: string;
  charter?: string;
  mandate?: string;
  scope?: string;
  parentId?: string;
  orderIndex: number;
  isActive: boolean;
  members?: GovernanceRole[];
}

interface GovernanceRole {
  id?: string;
  roleTitle: string;
  roleType: string;
  userId?: string;
  responsibilities?: string;
  isActive: boolean;
}

const BODY_TYPES = [
  { value: 'BOARD', label: 'Board' },
  { value: 'COMMITTEE', label: 'Committee' },
  { value: 'COUNCIL', label: 'Council' },
  { value: 'WORKING_GROUP', label: 'Working Group' },
  { value: 'CENTER_OF_EXCELLENCE', label: 'Center of Excellence' },
];

const ROLE_TYPES = [
  { value: 'EXECUTIVE', label: 'Executive' },
  { value: 'GOVERNANCE_LEAD', label: 'Governance Lead' },
  { value: 'RISK_OFFICER', label: 'Risk Officer' },
  { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
  { value: 'ETHICS_OFFICER', label: 'Ethics Officer' },
  { value: 'TECHNICAL_LEAD', label: 'Technical Lead' },
  { value: 'BUSINESS_REPRESENTATIVE', label: 'Business Representative' },
  { value: 'ADVISOR', label: 'Advisor' },
];

interface Props {
  organizationId: string;
  onUpdate: () => void;
  isDarkMode: boolean;
}

export default function GovernanceStructureTab({ organizationId, onUpdate, isDarkMode }: Props) {
  const [bodies, setBodies] = useState<GovernanceBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBody, setEditingBody] = useState<GovernanceBody | null>(null);
  const [formData, setFormData] = useState<Partial<GovernanceBody>>({
    name: '',
    type: 'COMMITTEE',
    orderIndex: 0,
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBodies();
  }, [organizationId]);

  const fetchBodies = async () => {
    try {
      const response = await fetch(`/api/governance-setup/bodies?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setBodies(data);
      }
    } catch (error) {
      console.error('Error fetching governance bodies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/governance-setup/bodies', {
        method: editingBody?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingBody?.id,
          organizationId
        })
      });

      if (!response.ok) throw new Error('Failed to save governance body');

      await fetchBodies();
      onUpdate();
      setShowDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Governance body saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save governance body. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this governance body?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/governance-setup/bodies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete governance body');

      await fetchBodies();
      onUpdate();
      toast({
        title: "Success",
        description: "Governance body deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete governance body. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDialog = (body?: GovernanceBody) => {
    if (body) {
      setEditingBody(body);
      setFormData(body);
    } else {
      setEditingBody(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'COMMITTEE',
      orderIndex: 0,
      isActive: true
    });
    setEditingBody(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? 'text-white' : ''}>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Governance Bodies</span>
                </div>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Define your governance committees, councils, and working groups
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Body
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bodies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No governance bodies defined yet. Add your first one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bodies.map((body) => (
                <Card key={body.id} className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {body.name}
                          </h3>
                          <Badge variant="outline">
                            {BODY_TYPES.find(t => t.value === body.type)?.label}
                          </Badge>
                          {!body.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {body.description && (
                          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {body.description}
                          </p>
                        )}
                        {body.mandate && (
                          <div className="mt-3">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Mandate:
                            </span>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {body.mandate}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(body)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => body.id && handleDelete(body.id)}
                          disabled={deleting === body.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : ''}>
              {editingBody ? 'Edit Governance Body' : 'Create Governance Body'}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Define the structure and purpose of this governance body
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={isDarkMode ? 'text-gray-200' : ''}>Name</Label>
              <Input
                id="name"
                placeholder="e.g., AI Governance Board"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className={isDarkMode ? 'text-gray-200' : ''}>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={isDarkMode ? 'text-gray-200' : ''}>Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this body's purpose..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mandate" className={isDarkMode ? 'text-gray-200' : ''}>Mandate</Label>
              <Textarea
                id="mandate"
                placeholder="Authority and decision-making power..."
                value={formData.mandate || ''}
                onChange={(e) => setFormData({ ...formData, mandate: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
