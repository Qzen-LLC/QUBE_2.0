'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GovernanceCharter {
  id?: string;
  mission?: string;
  vision?: string;
  principles: string[];
  objectives: string[];
  scope?: string;
  mandate?: string;
  reviewCycle?: string;
  approvedBy?: string;
  approvedAt?: string;
  version: number;
  isActive: boolean;
}

interface Props {
  organizationId: string;
  onUpdate: () => void;
  isDarkMode: boolean;
}

export default function GovernanceCharterTab({ organizationId, onUpdate, isDarkMode }: Props) {
  const [charter, setCharter] = useState<GovernanceCharter>({
    principles: [],
    objectives: [],
    version: 1,
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPrinciple, setNewPrinciple] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCharter();
  }, [organizationId]);

  const fetchCharter = async () => {
    try {
      const response = await fetch(`/api/governance-setup/charter?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setCharter(data);
        }
      }
    } catch (error) {
      console.error('Error fetching charter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/governance-setup/charter', {
        method: charter.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...charter,
          organizationId
        })
      });

      if (!response.ok) throw new Error('Failed to save charter');

      const saved = await response.json();
      setCharter(saved);
      onUpdate();
      toast({
        title: "Charter Saved",
        description: "Your governance charter has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save charter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addPrinciple = () => {
    if (newPrinciple.trim()) {
      setCharter({
        ...charter,
        principles: [...charter.principles, newPrinciple.trim()]
      });
      setNewPrinciple('');
    }
  };

  const removePrinciple = (index: number) => {
    setCharter({
      ...charter,
      principles: charter.principles.filter((_, i) => i !== index)
    });
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setCharter({
        ...charter,
        objectives: [...charter.objectives, newObjective.trim()]
      });
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setCharter({
      ...charter,
      objectives: charter.objectives.filter((_, i) => i !== index)
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
          <CardTitle className={isDarkMode ? 'text-white' : ''}>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Governance Charter</span>
            </div>
          </CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Define your organization's AI governance mission, vision, and core principles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mission */}
          <div className="space-y-2">
            <Label htmlFor="mission" className={isDarkMode ? 'text-gray-200' : ''}>
              Mission Statement
            </Label>
            <Textarea
              id="mission"
              placeholder="Our mission for AI governance..."
              value={charter.mission || ''}
              onChange={(e) => setCharter({ ...charter, mission: e.target.value })}
              rows={3}
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Vision */}
          <div className="space-y-2">
            <Label htmlFor="vision" className={isDarkMode ? 'text-gray-200' : ''}>
              Vision Statement
            </Label>
            <Textarea
              id="vision"
              placeholder="Our vision for responsible AI..."
              value={charter.vision || ''}
              onChange={(e) => setCharter({ ...charter, vision: e.target.value })}
              rows={3}
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Core Principles */}
          <div className="space-y-3">
            <Label className={isDarkMode ? 'text-gray-200' : ''}>
              Core Governance Principles
            </Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add a principle (e.g., Transparency, Accountability...)"
                value={newPrinciple}
                onChange={(e) => setNewPrinciple(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPrinciple()}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
              <Button onClick={addPrinciple} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {charter.principles.map((principle, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : ''} flex items-center space-x-1`}
                >
                  <span>{principle}</span>
                  <button
                    onClick={() => removePrinciple(index)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Strategic Objectives */}
          <div className="space-y-3">
            <Label className={isDarkMode ? 'text-gray-200' : ''}>
              Strategic Objectives
            </Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add an objective..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
              <Button onClick={addObjective} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {charter.objectives.map((objective, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : ''} flex items-center space-x-1`}
                >
                  <span>{objective}</span>
                  <button
                    onClick={() => removeObjective(index)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label htmlFor="scope" className={isDarkMode ? 'text-gray-200' : ''}>
              Governance Scope
            </Label>
            <Textarea
              id="scope"
              placeholder="Define the scope of your AI governance..."
              value={charter.scope || ''}
              onChange={(e) => setCharter({ ...charter, scope: e.target.value })}
              rows={3}
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Mandate */}
          <div className="space-y-2">
            <Label htmlFor="mandate" className={isDarkMode ? 'text-gray-200' : ''}>
              Governance Mandate
            </Label>
            <Textarea
              id="mandate"
              placeholder="Define the authority and mandate of your governance bodies..."
              value={charter.mandate || ''}
              onChange={(e) => setCharter({ ...charter, mandate: e.target.value })}
              rows={3}
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Review Cycle */}
          <div className="space-y-2">
            <Label htmlFor="reviewCycle" className={isDarkMode ? 'text-gray-200' : ''}>
              Review Cycle
            </Label>
            <Input
              id="reviewCycle"
              placeholder="e.g., Quarterly, Annually"
              value={charter.reviewCycle || ''}
              onChange={(e) => setCharter({ ...charter, reviewCycle: e.target.value })}
              className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Charter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
