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
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Shield, Edit, Trash2, Save, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EscalationRule {
  id?: string;
  triggerType: string;
  escalateTo: string;
  notifyEmails: string[];
  autoEscalate: boolean;
  description?: string;
  isActive: boolean;
}

const TRIGGER_TYPES = [
  { value: 'RISK_LEVEL', label: 'Risk Level Threshold' },
  { value: 'INVESTMENT_THRESHOLD', label: 'Investment Threshold' },
  { value: 'APPROVAL_TIMEOUT', label: 'Approval Timeout' },
  { value: 'COMPLIANCE_VIOLATION', label: 'Compliance Violation' },
  { value: 'POLICY_EXCEPTION', label: 'Policy Exception Request' },
];

interface Props {
  organizationId: string;
  onUpdate: () => void;
  isDarkMode: boolean;
}

export default function EscalationRulesTab({ organizationId, onUpdate, isDarkMode }: Props) {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [formData, setFormData] = useState<Partial<EscalationRule>>({
    triggerType: 'RISK_LEVEL',
    escalateTo: '',
    notifyEmails: [],
    autoEscalate: true,
    isActive: true
  });
  const [emailInput, setEmailInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, [organizationId]);

  const fetchRules = async () => {
    try {
      const response = await fetch(`/api/governance-setup/escalation-rules?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching escalation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/governance-setup/escalation-rules', {
        method: editingRule?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingRule?.id,
          organizationId
        })
      });

      if (!response.ok) throw new Error('Failed to save escalation rule');

      await fetchRules();
      onUpdate();
      setShowDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Escalation rule saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save escalation rule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this escalation rule?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/governance-setup/escalation-rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete escalation rule');

      await fetchRules();
      onUpdate();
      toast({
        title: "Success",
        description: "Escalation rule deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete escalation rule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDialog = (rule?: EscalationRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      triggerType: 'RISK_LEVEL',
      escalateTo: '',
      notifyEmails: [],
      autoEscalate: true,
      isActive: true
    });
    setEmailInput('');
    setEditingRule(null);
  };

  const addEmail = () => {
    if (emailInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setFormData({
        ...formData,
        notifyEmails: [...(formData.notifyEmails || []), emailInput.trim()]
      });
      setEmailInput('');
    }
  };

  const removeEmail = (index: number) => {
    setFormData({
      ...formData,
      notifyEmails: (formData.notifyEmails || []).filter((_, i) => i !== index)
    });
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
                  <Shield className="h-5 w-5" />
                  <span>Escalation Rules</span>
                </div>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Define automatic escalation triggers and notification rules
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No escalation rules defined yet. Add your first rule to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {TRIGGER_TYPES.find(t => t.value === rule.triggerType)?.label}
                          </h3>
                          {rule.autoEscalate && (
                            <Badge variant="default">Auto-Escalate</Badge>
                          )}
                          {!rule.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Escalate to:
                            </span>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {rule.escalateTo}
                            </span>
                          </div>
                          {rule.notifyEmails.length > 0 && (
                            <div className="flex items-start space-x-2">
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Notify:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {rule.notifyEmails.map((email, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {email}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {rule.description && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rule.id && handleDelete(rule.id)}
                          disabled={deleting === rule.id}
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
              {editingRule ? 'Edit Escalation Rule' : 'Create Escalation Rule'}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Define when and how to escalate decisions or issues
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="triggerType" className={isDarkMode ? 'text-gray-200' : ''}>Trigger Type</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalateTo" className={isDarkMode ? 'text-gray-200' : ''}>Escalate To</Label>
              <Input
                id="escalateTo"
                placeholder="e.g., AI Governance Board, CEO"
                value={formData.escalateTo}
                onChange={(e) => setFormData({ ...formData, escalateTo: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={isDarkMode ? 'text-gray-200' : ''}>Notification Emails</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="email@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Button onClick={addEmail} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.notifyEmails || []).map((email, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : ''} flex items-center space-x-1`}
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => removeEmail(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoEscalate"
                checked={formData.autoEscalate}
                onCheckedChange={(checked) => setFormData({ ...formData, autoEscalate: checked })}
              />
              <Label htmlFor="autoEscalate" className={isDarkMode ? 'text-gray-200' : ''}>
                Auto-escalate when triggered
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={isDarkMode ? 'text-gray-200' : ''}>Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this rule..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
