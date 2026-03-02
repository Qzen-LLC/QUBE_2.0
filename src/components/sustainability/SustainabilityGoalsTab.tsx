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
import { Loader2, Plus, Target, Trash2, Edit, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SustainabilityGoal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED';
  category: string;
}

interface Props {
  organizationId: string;
  isDarkMode: boolean;
  onUpdate: () => void;
}

export default function SustainabilityGoalsTab({ organizationId, isDarkMode, onUpdate }: Props) {
  const [goals, setGoals] = useState<SustainabilityGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SustainabilityGoal | null>(null);
  const [formData, setFormData] = useState<Partial<SustainabilityGoal>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, [organizationId]);

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/sustainability/goals?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Error fetching sustainability goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingGoal?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/sustainability/goals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingGoal?.id,
          organizationId
        })
      });

      if (!response.ok) throw new Error('Failed to save goal');

      await fetchGoals();
      onUpdate();
      setShowDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Sustainability goal saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/sustainability/goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      await fetchGoals();
      onUpdate();
      toast({
        title: "Success",
        description: "Goal deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const openDialog = (goal?: SustainabilityGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData(goal);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({});
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const achieved = goals.filter(g => g.status === 'ACHIEVED').length;
  const onTrack = goals.filter(g => g.status === 'ON_TRACK').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? 'text-white' : ''}>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Sustainability Goals</span>
                </div>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Set and track environmental impact reduction targets
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Goals
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {goals.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-green-600'}`}>
                Achieved
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                {achieved}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                On Track
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                {onTrack}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <CardContent className="p-12 text-center">
              <Target className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No sustainability goals set yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = (goal.currentValue / goal.targetValue) * 100;
            return (
              <Card key={goal.id} className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {goal.title}
                        </h3>
                        <Badge
                          variant={goal.status === 'ACHIEVED' ? 'default' : 'secondary'}
                          className={
                            goal.status === 'ACHIEVED'
                              ? 'bg-green-600'
                              : goal.status === 'ON_TRACK'
                              ? 'bg-blue-600'
                              : goal.status === 'AT_RISK'
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }
                        >
                          {goal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(goal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)} disabled={deleting === goal.id}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Progress: {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          goal.status === 'ACHIEVED'
                            ? 'bg-green-600'
                            : goal.status === 'ON_TRACK'
                            ? 'bg-blue-600'
                            : 'bg-yellow-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : ''}>
              {editingGoal ? 'Edit Goal' : 'Create Sustainability Goal'}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Set targets for reducing environmental impact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={isDarkMode ? 'text-gray-200' : ''}>Title</Label>
              <Input
                id="title"
                placeholder="e.g., Reduce CO₂ by 25%"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={isDarkMode ? 'text-gray-200' : ''}>Description</Label>
              <Textarea
                id="description"
                placeholder="Goal details..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetValue" className={isDarkMode ? 'text-gray-200' : ''}>Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  value={formData.targetValue || ''}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentValue" className={isDarkMode ? 'text-gray-200' : ''}>Current Value</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  value={formData.currentValue || ''}
                  onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className={isDarkMode ? 'text-gray-200' : ''}>Unit</Label>
                <Input
                  id="unit"
                  placeholder="kg CO₂"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate" className={isDarkMode ? 'text-gray-200' : ''}>Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate?.split('T')[0] || ''}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
