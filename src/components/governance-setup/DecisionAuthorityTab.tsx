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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Scale, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DecisionAuthority {
  id?: string;
  decisionType: string;
  riskLevel?: string;
  investmentMin?: number;
  investmentMax?: number;
  approverRole: string;
  escalationRole?: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
}

const DECISION_TYPES = [
  { value: 'USE_CASE_APPROVAL', label: 'Use Case Approval' },
  { value: 'POLICY_EXCEPTION', label: 'Policy Exception' },
  { value: 'RISK_ACCEPTANCE', label: 'Risk Acceptance' },
  { value: 'BUDGET_APPROVAL', label: 'Budget Approval' },
  { value: 'VENDOR_SELECTION', label: 'Vendor Selection' },
  { value: 'FRAMEWORK_CHANGE', label: 'Framework Change' },
];

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

interface Props {
  organizationId: string;
  onUpdate: () => void;
  isDarkMode: boolean;
}

export default function DecisionAuthorityTab({ organizationId, onUpdate, isDarkMode }: Props) {
  const [authorities, setAuthorities] = useState<DecisionAuthority[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<DecisionAuthority | null>(null);
  const [formData, setFormData] = useState<Partial<DecisionAuthority>>({
    decisionType: 'USE_CASE_APPROVAL',
    approverRole: '',
    orderIndex: 0,
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAuthorities();
  }, [organizationId]);

  const fetchAuthorities = async () => {
    try {
      const response = await fetch(`/api/governance-setup/decision-authority?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setAuthorities(data);
      }
    } catch (error) {
      console.error('Error fetching decision authorities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/governance-setup/decision-authority', {
        method: editingAuthority?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingAuthority?.id,
          organizationId
        })
      });

      if (!response.ok) throw new Error('Failed to save decision authority');

      await fetchAuthorities();
      onUpdate();
      setShowDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Decision authority saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save decision authority. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this decision authority rule?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/governance-setup/decision-authority/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete decision authority');

      await fetchAuthorities();
      onUpdate();
      toast({
        title: "Success",
        description: "Decision authority deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete decision authority. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDialog = (authority?: DecisionAuthority) => {
    if (authority) {
      setEditingAuthority(authority);
      setFormData(authority);
    } else {
      setEditingAuthority(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      decisionType: 'USE_CASE_APPROVAL',
      approverRole: '',
      orderIndex: 0,
      isActive: true
    });
    setEditingAuthority(null);
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
                  <Scale className="h-5 w-5" />
                  <span>Decision Authority Matrix</span>
                </div>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Define who can approve what based on risk, investment, and decision type
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {authorities.length === 0 ? (
            <div className="text-center py-12">
              <Scale className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No decision authority rules defined yet. Add your first rule to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={isDarkMode ? 'border-gray-700' : ''}>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Decision Type</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Risk Level</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Investment Range</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Approver Role</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Escalation</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authorities.map((authority) => (
                  <TableRow key={authority.id} className={isDarkMode ? 'border-gray-700' : ''}>
                    <TableCell className={isDarkMode ? 'text-gray-200' : ''}>
                      {DECISION_TYPES.find(t => t.value === authority.decisionType)?.label || authority.decisionType}
                    </TableCell>
                    <TableCell>
                      {authority.riskLevel && (
                        <Badge variant={
                          authority.riskLevel === 'CRITICAL' ? 'destructive' :
                          authority.riskLevel === 'HIGH' ? 'default' :
                          'secondary'
                        }>
                          {authority.riskLevel}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-200' : ''}>
                      {authority.investmentMin !== undefined && authority.investmentMax !== undefined
                        ? `$${authority.investmentMin.toLocaleString()} - $${authority.investmentMax.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-200' : ''}>
                      {authority.approverRole}
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-200' : ''}>
                      {authority.escalationRole || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(authority)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => authority.id && handleDelete(authority.id)}
                          disabled={deleting === authority.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : ''} max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : ''}>
              {editingAuthority ? 'Edit Decision Authority' : 'Create Decision Authority Rule'}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Define approval authority based on decision type, risk, and investment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="decisionType" className={isDarkMode ? 'text-gray-200' : ''}>Decision Type</Label>
                <Select
                  value={formData.decisionType}
                  onValueChange={(value) => setFormData({ ...formData, decisionType: value })}
                >
                  <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskLevel" className={isDarkMode ? 'text-gray-200' : ''}>Risk Level (Optional)</Label>
                <Select
                  value={formData.riskLevel ?? '__NONE__'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      riskLevel: value === '__NONE__' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                    <SelectValue placeholder="Select risk level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">None</SelectItem>
                    {RISK_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentMin" className={isDarkMode ? 'text-gray-200' : ''}>
                  Min Investment ($)
                </Label>
                <Input
                  id="investmentMin"
                  type="number"
                  placeholder="0"
                  value={formData.investmentMin || ''}
                  onChange={(e) => setFormData({ ...formData, investmentMin: parseFloat(e.target.value) || undefined })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentMax" className={isDarkMode ? 'text-gray-200' : ''}>
                  Max Investment ($)
                </Label>
                <Input
                  id="investmentMax"
                  type="number"
                  placeholder="1000000"
                  value={formData.investmentMax || ''}
                  onChange={(e) => setFormData({ ...formData, investmentMax: parseFloat(e.target.value) || undefined })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approverRole" className={isDarkMode ? 'text-gray-200' : ''}>Approver Role</Label>
              <Input
                id="approverRole"
                placeholder="e.g., AI Governance Board, CTO, Business Unit Leader"
                value={formData.approverRole}
                onChange={(e) => setFormData({ ...formData, approverRole: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalationRole" className={isDarkMode ? 'text-gray-200' : ''}>
                Escalation Role (Optional)
              </Label>
              <Input
                id="escalationRole"
                placeholder="e.g., CEO, Board of Directors"
                value={formData.escalationRole || ''}
                onChange={(e) => setFormData({ ...formData, escalationRole: e.target.value || undefined })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={isDarkMode ? 'text-gray-200' : ''}>Description</Label>
              <Textarea
                id="description"
                placeholder="Additional context or conditions..."
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
