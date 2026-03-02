'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Save,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  FileText,
  Code,
  MessageSquare,
  Settings,
  Info
} from 'lucide-react';
import { 
  EntryCategory, 
  DataSource, 
  TestType,
  InputSpecification,
  ExpectedResponse,
  EntryMetadata
} from '@/lib/golden/types';

interface EntryCollectorProps {
  datasetId: string;
  onSave?: (entry: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

const EntryCollector: React.FC<EntryCollectorProps> = ({
  datasetId,
  onSave,
  onCancel,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Input fields
  const [input, setInput] = useState<InputSpecification>({
    prompt: initialData?.input?.prompt || '',
    context: initialData?.input?.context || '',
    systemPrompt: initialData?.input?.systemPrompt || '',
    parameters: initialData?.input?.parameters || {}
  });

  // Expected outputs
  const [expectedOutputs, setExpectedOutputs] = useState<ExpectedResponse[]>(
    initialData?.expectedOutputs || [{
      id: `output-${Date.now()}`,
      content: '',
      type: 'exact',
      isPreferred: true,
      acceptabilityScore: 1.0,
      explanation: ''
    }]
  );

  // Category (part of GoldenEntry, not EntryMetadata)
  const [category, setCategory] = useState<EntryCategory>(
    initialData?.category || 'functional'
  );

  // Metadata
  const [metadata, setMetadata] = useState<Partial<EntryMetadata>>({
    source: initialData?.metadata?.source || 'manual',
    difficulty: initialData?.metadata?.difficulty || 'medium',
    priority: initialData?.metadata?.priority || 'medium',
    testTypes: initialData?.metadata?.testTypes || ['functional'],
    isEdgeCase: initialData?.metadata?.isEdgeCase || false,
    isAdversarial: initialData?.metadata?.isAdversarial || false,
    isRealWorld: initialData?.metadata?.isRealWorld || true,
    tags: initialData?.metadata?.tags || [],
    explanation: initialData?.metadata?.explanation || ''
  });

  // Conversation history for multi-turn
  const [conversationHistory, setConversationHistory] = useState<any[]>(
    initialData?.input?.conversationHistory || []
  );

  const [newTag, setNewTag] = useState('');
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');

  const addExpectedOutput = () => {
    setExpectedOutputs([
      ...expectedOutputs,
      {
        id: `output-${Date.now()}`,
        content: '',
        type: 'semantic',
        isPreferred: false,
        acceptabilityScore: 0.8,
        explanation: ''
      }
    ]);
  };

  const removeExpectedOutput = (index: number) => {
    if (expectedOutputs.length > 1) {
      setExpectedOutputs(expectedOutputs.filter((_, i) => i !== index));
    }
  };

  const updateExpectedOutput = (index: number, updates: Partial<ExpectedResponse>) => {
    const updated = [...expectedOutputs];
    updated[index] = { ...updated[index], ...updates };
    setExpectedOutputs(updated);
  };

  const addConversationTurn = () => {
    setConversationHistory([
      ...conversationHistory,
      { role: 'user', content: '' }
    ]);
  };

  const updateConversationTurn = (index: number, updates: any) => {
    const updated = [...conversationHistory];
    updated[index] = { ...updated[index], ...updates };
    setConversationHistory(updated);
  };

  const removeConversationTurn = (index: number) => {
    setConversationHistory(conversationHistory.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag && !metadata.tags?.includes(newTag)) {
      setMetadata({
        ...metadata,
        tags: [...(metadata.tags || []), newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags?.filter(t => t !== tag) || []
    });
  };

  const addParameter = () => {
    if (paramKey && paramValue) {
      setInput({
        ...input,
        parameters: {
          ...input.parameters,
          [paramKey]: paramValue
        }
      });
      setParamKey('');
      setParamValue('');
    }
  };

  const removeParameter = (key: string) => {
    const { [key]: _, ...rest } = input.parameters || {};
    setInput({ ...input, parameters: rest });
  };

  const validateEntry = (): boolean => {
    if (!input.prompt.trim()) {
      setError('Prompt is required');
      return false;
    }

    if (expectedOutputs.every(o => !o.content.trim())) {
      setError('At least one expected output is required');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setError(null);
    
    if (!validateEntry()) {
      return;
    }

    setSaving(true);
    
    try {
      const entry = {
        datasetId,
        category,
        input: {
          ...input,
          conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined
        },
        expectedOutputs: expectedOutputs.filter(o => o.content.trim()),
        metadata: {
          ...metadata,
          createdBy: 'user', // Would get from auth context
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch('/api/golden/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save entry');
      }

      const result = await response.json();
      setSuccess(true);
      
      if (onSave) {
        onSave(result.entry);
      }

      // Reset form
      setTimeout(() => {
        setInput({ prompt: '', context: '', systemPrompt: '', parameters: {} });
        setExpectedOutputs([{
          id: `output-${Date.now()}`,
          content: '',
          type: 'exact',
          isPreferred: true,
          acceptabilityScore: 1.0,
          explanation: ''
        }]);
        setConversationHistory([]);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Add Golden Dataset Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt *</Label>
              <Textarea
                id="prompt"
                value={input.prompt}
                onChange={(e) => setInput({ ...input, prompt: e.target.value })}
                placeholder="Enter the input prompt..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="context">Context (Optional)</Label>
              <Textarea
                id="context"
                value={input.context || ''}
                onChange={(e) => setInput({ ...input, context: e.target.value })}
                placeholder="Additional context or background information..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
              <Textarea
                id="systemPrompt"
                value={input.systemPrompt || ''}
                onChange={(e) => setInput({ ...input, systemPrompt: e.target.value })}
                placeholder="System-level instructions..."
                className="min-h-[60px]"
              />
            </div>

            {/* Parameters */}
            <div>
              <Label>Parameters (Optional)</Label>
              <div className="space-y-2">
                {Object.entries(input.parameters || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input value={key} disabled className="flex-1" />
                    <Input value={String(value)} disabled className="flex-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeParameter(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={paramKey}
                    onChange={(e) => setParamKey(e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                  />
                  <Button size="sm" onClick={addParameter}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outputs" className="space-y-4">
            <div className="space-y-4">
              {expectedOutputs.map((output, index) => (
                <Card key={output.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Expected Output {index + 1}</Label>
                      <div className="flex items-center gap-2">
                        {output.isPreferred && (
                          <Badge variant="default">Preferred</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExpectedOutput(index)}
                          disabled={expectedOutputs.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={output.content}
                      onChange={(e) => updateExpectedOutput(index, { content: e.target.value })}
                      placeholder="Expected response content..."
                      className="min-h-[100px]"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Response Type</Label>
                        <Select
                          value={output.type}
                          onValueChange={(value) => updateExpectedOutput(index, { type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exact">Exact Match</SelectItem>
                            <SelectItem value="semantic">Semantic Match</SelectItem>
                            <SelectItem value="pattern">Pattern Match</SelectItem>
                            <SelectItem value="contains">Contains Elements</SelectItem>
                            <SelectItem value="structured">Structured</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Acceptability Score</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={output.acceptabilityScore}
                          onChange={(e) => updateExpectedOutput(index, { 
                            acceptabilityScore: parseFloat(e.target.value) 
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Explanation (Optional)</Label>
                      <Input
                        value={output.explanation || ''}
                        onChange={(e) => updateExpectedOutput(index, { explanation: e.target.value })}
                        placeholder="Why is this the expected output?"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button onClick={addExpectedOutput} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Alternative Output
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as EntryCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="edge_case">Edge Case</SelectItem>
                    <SelectItem value="adversarial">Adversarial</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="robustness">Robustness</SelectItem>
                    <SelectItem value="fairness">Fairness</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="user_experience">User Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select
                  value={metadata.difficulty}
                  onValueChange={(value) => setMetadata({ ...metadata, difficulty: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={metadata.priority}
                  onValueChange={(value) => setMetadata({ ...metadata, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Source</Label>
                <Select
                  value={metadata.source as string}
                  onValueChange={(value) => setMetadata({ ...metadata, source: value as DataSource })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="synthetic">Synthetic</SelectItem>
                    <SelectItem value="crowdsourced">Crowdsourced</SelectItem>
                    <SelectItem value="imported">Imported</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flags */}
            <div>
              <Label>Flags</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={metadata.isEdgeCase}
                    onChange={(e) => setMetadata({ ...metadata, isEdgeCase: e.target.checked })}
                  />
                  Edge Case
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={metadata.isAdversarial}
                    onChange={(e) => setMetadata({ ...metadata, isAdversarial: e.target.checked })}
                  />
                  Adversarial
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={metadata.isRealWorld}
                    onChange={(e) => setMetadata({ ...metadata, isRealWorld: e.target.checked })}
                  />
                  Real World
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {metadata.tags?.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>Add</Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Explanation</Label>
              <Textarea
                value={metadata.explanation || ''}
                onChange={(e) => setMetadata({ ...metadata, explanation: e.target.value })}
                placeholder="Explain the purpose or context of this entry..."
                className="min-h-[80px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Multi-turn conversation */}
            <div>
              <Label>Conversation History (for multi-turn)</Label>
              <div className="space-y-2">
                {conversationHistory.map((turn, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={turn.role}
                      onValueChange={(value) => updateConversationTurn(index, { role: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={turn.content}
                      onChange={(e) => updateConversationTurn(index, { content: e.target.value })}
                      placeholder="Message content..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeConversationTurn(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addConversationTurn} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Turn
                </Button>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Advanced options for multi-modal inputs, RAG context, and agent tools will be available in future updates.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Error/Success messages */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4">
            <Check className="h-4 w-4" />
            <AlertDescription>Entry saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryCollector;