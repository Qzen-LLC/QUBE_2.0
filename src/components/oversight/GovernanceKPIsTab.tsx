'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, TrendingUp, TrendingDown, Minus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GovernanceKPI {
  id: string;
  name: string;
  description?: string;
  category: string;
  target: number;
  current?: number;
  unit?: string;
  trend?: string;
  status: string;
  measurementDate: string;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

const KPI_CATEGORIES = [
  { value: 'RISK_MANAGEMENT', label: 'Risk Management' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'TRAINING', label: 'Training & Competency' },
  { value: 'SUSTAINABILITY', label: 'Sustainability' },
];

const KPI_STATUS = [
  { value: 'ON_TRACK', label: 'On Track', color: 'bg-green-600' },
  { value: 'AT_RISK', label: 'At Risk', color: 'bg-yellow-600' },
  { value: 'OFF_TRACK', label: 'Off Track', color: 'bg-red-600' },
];

export default function GovernanceKPIsTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [kpis, setKpis] = useState<GovernanceKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingKPI, setEditingKPI] = useState<GovernanceKPI | null>(null);
  const [formData, setFormData] = useState<Partial<GovernanceKPI>>({});
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    fetchKPIs();
  }, [organizationId]);

  const fetchKPIs = async () => {
    try {
      const response = await fetch(`/api/oversight/kpis?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingKPI?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/oversight/kpis', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingKPI?.id,
          organizationId,
          measurementDate: formData.measurementDate || new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to save KPI');

      await fetchKPIs();
      onUpdate();
      setShowDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "KPI saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save KPI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/oversight/kpis/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete KPI');

      await fetchKPIs();
      onUpdate();
      toast({
        title: "Success",
        description: "KPI deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete KPI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDialog = (kpi?: GovernanceKPI) => {
    if (kpi) {
      setEditingKPI(kpi);
      setFormData(kpi);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({ category: 'RISK_MANAGEMENT', status: 'ON_TRACK' });
    setEditingKPI(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredKPIs = filterCategory === 'ALL'
    ? kpis
    : kpis.filter(kpi => kpi.category === filterCategory);

  const onTrackCount = kpis.filter(k => k.status === 'ON_TRACK').length;
  const atRiskCount = kpis.filter(k => k.status === 'AT_RISK').length;
  const offTrackCount = kpis.filter(k => k.status === 'OFF_TRACK').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? 'text-white' : ''}>Governance KPIs</CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Track key performance indicators across governance dimensions
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add KPI
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-green-600'}`}>
                On Track
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                {onTrackCount}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-yellow-600'}`}>
                At Risk
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-yellow-900'}`}>
                {atRiskCount}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-red-600'}`}>
                Off Track
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-red-900'}`}>
                {offTrackCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filterCategory === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('ALL')}
            >
              All
            </Button>
            {KPI_CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKPIs.map((kpi) => {
          const progress = kpi.current !== undefined && kpi.target
            ? (kpi.current / kpi.target) * 100
            : 0;

          const statusConfig = KPI_STATUS.find(s => s.value === kpi.status);
          const TrendIcon = kpi.trend === 'UP' ? TrendingUp : kpi.trend === 'DOWN' ? TrendingDown : Minus;

          return (
            <Card key={kpi.id} className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : ''}`}>
                      {kpi.name}
                    </CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {KPI_CATEGORIES.find(c => c.value === kpi.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(kpi)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(kpi.id)} disabled={deleting === kpi.id}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpi.description && (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {kpi.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {kpi.current !== undefined ? kpi.current : '-'}
                        {kpi.unit && <span className="text-sm ml-1">{kpi.unit}</span>}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Target: {kpi.target}{kpi.unit}
                      </p>
                    </div>
                    {kpi.trend && (
                      <TrendIcon className={`h-6 w-6 ${
                        kpi.trend === 'UP' ? 'text-green-600' :
                        kpi.trend === 'DOWN' ? 'text-red-600' :
                        'text-gray-400'
                      }`} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusConfig?.color || 'bg-blue-600'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <Badge variant="secondary" className={statusConfig?.color}>
                      {statusConfig?.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : ''}>
              {editingKPI ? 'Edit KPI' : 'Create Governance KPI'}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Define and track key performance indicators
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={isDarkMode ? 'text-gray-200' : ''}>KPI Name</Label>
              <Input
                id="name"
                placeholder="e.g., Policy Compliance Rate"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className={isDarkMode ? 'text-gray-200' : ''}>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target" className={isDarkMode ? 'text-gray-200' : ''}>Target</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  value={formData.target || ''}
                  onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current" className={isDarkMode ? 'text-gray-200' : ''}>Current</Label>
                <Input
                  id="current"
                  type="number"
                  step="0.01"
                  value={formData.current || ''}
                  onChange={(e) => setFormData({ ...formData, current: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className={isDarkMode ? 'text-gray-200' : ''}>Unit</Label>
                <Input
                  id="unit"
                  placeholder="%"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={isDarkMode ? 'text-gray-200' : ''}>Description</Label>
              <Textarea
                id="description"
                placeholder="KPI details..."
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
              {saving ? 'Saving...' : 'Save KPI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
