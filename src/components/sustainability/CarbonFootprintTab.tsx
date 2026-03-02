'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, Cloud, TrendingUp, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CarbonFootprint {
  id: string;
  useCaseId: string;
  useCaseName?: string;
  modelName?: string;
  provider?: string;
  trainingEmissions?: number;
  inferenceEmissions?: number;
  totalEmissions?: number;
  energyConsumption?: number;
  computeHours?: number;
  measurementDate: string;
  calculationMethod?: string;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

export default function CarbonFootprintTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [footprints, setFootprints] = useState<CarbonFootprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFootprint, setEditingFootprint] = useState<CarbonFootprint | null>(null);
  const [formData, setFormData] = useState<Partial<CarbonFootprint>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchFootprints();
  }, [organizationId]);

  const fetchFootprints = async () => {
    try {
      const response = await fetch(`/api/sustainability/carbon-footprint?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setFootprints(data);
      }
    } catch (error) {
      console.error('Error fetching carbon footprints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingFootprint?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/sustainability/carbon-footprint', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingFootprint?.id,
          organizationId,
          measurementDate: formData.measurementDate || new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to save carbon footprint');

      await fetchFootprints();
      onUpdate();
      setShowDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Carbon footprint record saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save carbon footprint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this carbon footprint record?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/sustainability/carbon-footprint/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      await fetchFootprints();
      onUpdate();
      toast({
        title: "Success",
        description: "Carbon footprint record deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDialog = (footprint?: CarbonFootprint) => {
    if (footprint) {
      setEditingFootprint(footprint);
      setFormData(footprint);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({});
    setEditingFootprint(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalEmissions = footprints.reduce((sum, f) => sum + (f.totalEmissions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? 'text-white' : ''}>
                <div className="flex items-center space-x-2">
                  <Cloud className="h-5 w-5" />
                  <span>Carbon Footprint Tracking</span>
                </div>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Monitor CO₂ emissions from AI model training and inference
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                Total CO₂ Emissions
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                {totalEmissions.toFixed(2)} kg
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-green-600'}`}>
                Records Tracked
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                {footprints.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-yellow-600'}`}>
                Average per Use Case
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-yellow-900'}`}>
                {footprints.length > 0 ? (totalEmissions / footprints.length).toFixed(2) : '0.00'} kg
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footprint Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {footprints.length === 0 ? (
          <Card className={`col-span-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
            <CardContent className="p-12 text-center">
              <Cloud className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No carbon footprint records yet. Add your first record to start tracking.
              </p>
            </CardContent>
          </Card>
        ) : (
          footprints.map((footprint) => (
            <Card key={footprint.id} className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : ''}`}>
                      {footprint.useCaseName || footprint.useCaseId}
                    </CardTitle>
                    {footprint.modelName && (
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Model: {footprint.modelName}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(footprint)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(footprint.id)} disabled={deleting === footprint.id}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {footprint.provider && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Provider:</span>
                      <Badge variant="outline">{footprint.provider}</Badge>
                    </div>
                  )}
                  {footprint.totalEmissions !== undefined && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Emissions:</span>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {footprint.totalEmissions.toFixed(2)} kg CO₂
                      </span>
                    </div>
                  )}
                  {footprint.trainingEmissions !== undefined && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Training:</span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {footprint.trainingEmissions.toFixed(2)} kg CO₂
                      </span>
                    </div>
                  )}
                  {footprint.inferenceEmissions !== undefined && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inference:</span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {footprint.inferenceEmissions.toFixed(2)} kg CO₂
                      </span>
                    </div>
                  )}
                  {footprint.energyConsumption !== undefined && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Energy:</span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {footprint.energyConsumption.toFixed(2)} kWh
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Measured: {new Date(footprint.measurementDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : ''}>
              {editingFootprint ? 'Edit Carbon Footprint' : 'Add Carbon Footprint Record'}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Record CO₂ emissions from AI model operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="useCaseId" className={isDarkMode ? 'text-gray-200' : ''}>Use Case ID</Label>
              <Input
                id="useCaseId"
                placeholder="use-case-123"
                value={formData.useCaseId || ''}
                onChange={(e) => setFormData({ ...formData, useCaseId: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelName" className={isDarkMode ? 'text-gray-200' : ''}>Model Name</Label>
                <Input
                  id="modelName"
                  placeholder="GPT-4"
                  value={formData.modelName || ''}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider" className={isDarkMode ? 'text-gray-200' : ''}>Provider</Label>
                <Input
                  id="provider"
                  placeholder="OpenAI"
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trainingEmissions" className={isDarkMode ? 'text-gray-200' : ''}>Training Emissions (kg CO₂)</Label>
                <Input
                  id="trainingEmissions"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.trainingEmissions || ''}
                  onChange={(e) => setFormData({ ...formData, trainingEmissions: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inferenceEmissions" className={isDarkMode ? 'text-gray-200' : ''}>Inference Emissions (kg CO₂)</Label>
                <Input
                  id="inferenceEmissions"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.inferenceEmissions || ''}
                  onChange={(e) => setFormData({ ...formData, inferenceEmissions: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="energyConsumption" className={isDarkMode ? 'text-gray-200' : ''}>Energy Consumption (kWh)</Label>
                <Input
                  id="energyConsumption"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.energyConsumption || ''}
                  onChange={(e) => setFormData({ ...formData, energyConsumption: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="computeHours" className={isDarkMode ? 'text-gray-200' : ''}>Compute Hours</Label>
                <Input
                  id="computeHours"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.computeHours || ''}
                  onChange={(e) => setFormData({ ...formData, computeHours: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
