'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Sparkles,
  FileText,
  Shield,
  AlertTriangle,
  Zap,
  Users,
  DollarSign,
  Settings,
  Info,
  Code
} from 'lucide-react';

interface NewGuardrail {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  description: string;
  rationale: string;
  implementation: {
    platform: string[];
    configuration: any;
    monitoring: any[];
  };
  conditions?: any;
  exceptions?: any;
  isCustom: boolean;
}

interface AddGuardrailModalProps {
  open: boolean;
  onClose: () => void;
  category: 'critical' | 'operational' | 'ethical' | 'economic';
  onAdd: (guardrail: NewGuardrail) => void;
  existingRules?: any[];
}

// Template guardrails for quick selection
const GUARDRAIL_TEMPLATES = {
  critical: [
    {
      name: 'PII Data Protection',
      rule: 'PROTECT_PII_DATA',
      description: 'Prevent exposure of personally identifiable information',
      type: 'data_protection',
      severity: 'critical',
      rationale: 'Required for GDPR/CCPA compliance and user privacy'
    },
    {
      name: 'Prompt Injection Prevention',
      rule: 'PREVENT_PROMPT_INJECTION',
      description: 'Block attempts to manipulate system prompts',
      type: 'content_safety',
      severity: 'critical',
      rationale: 'Prevents unauthorized system manipulation'
    },
    {
      name: 'Human-in-the-Loop',
      rule: 'REQUIRE_HUMAN_APPROVAL',
      description: 'Require human approval for critical decisions',
      type: 'human_oversight',
      severity: 'high',
      rationale: 'Ensures human accountability for high-stakes decisions'
    }
  ],
  operational: [
    {
      name: 'Rate Limiting',
      rule: 'API_RATE_LIMIT',
      description: 'Limit API requests per user/minute',
      type: 'performance',
      severity: 'medium',
      rationale: 'Prevents system overload and ensures fair usage'
    },
    {
      name: 'Response Time Limit',
      rule: 'MAX_RESPONSE_TIME',
      description: 'Ensure responses within acceptable time limits',
      type: 'performance',
      severity: 'high',
      rationale: 'Maintains user experience and system reliability'
    },
    {
      name: 'Token Usage Limit',
      rule: 'TOKEN_USAGE_LIMIT',
      description: 'Cap token consumption per request',
      type: 'cost_control',
      severity: 'medium',
      rationale: 'Controls costs and prevents runaway token usage'
    }
  ],
  ethical: [
    {
      name: 'Bias Detection',
      rule: 'DETECT_BIAS',
      description: 'Monitor and flag potentially biased outputs',
      type: 'bias_mitigation',
      severity: 'high',
      rationale: 'Ensures fairness and prevents discrimination'
    },
    {
      name: 'Content Moderation',
      rule: 'CONTENT_MODERATION',
      description: 'Filter inappropriate or harmful content',
      type: 'content_safety',
      severity: 'high',
      rationale: 'Protects users from harmful content'
    },
    {
      name: 'Transparency Notice',
      rule: 'AI_TRANSPARENCY',
      description: 'Inform users they are interacting with AI',
      type: 'ethical',
      severity: 'medium',
      rationale: 'Ensures informed consent and transparency'
    }
  ],
  economic: [
    {
      name: 'Cost Alert Threshold',
      rule: 'COST_ALERT',
      description: 'Alert when costs exceed threshold',
      type: 'cost_control',
      severity: 'medium',
      rationale: 'Prevents unexpected cost overruns'
    },
    {
      name: 'Budget Cap',
      rule: 'BUDGET_LIMIT',
      description: 'Hard stop when budget is exceeded',
      type: 'cost_control',
      severity: 'critical',
      rationale: 'Enforces budget constraints'
    },
    {
      name: 'Resource Optimization',
      rule: 'OPTIMIZE_RESOURCES',
      description: 'Automatically optimize resource usage',
      type: 'cost_control',
      severity: 'low',
      rationale: 'Reduces operational costs'
    }
  ]
};

export default function AddGuardrailModal({
  open,
  onClose,
  category,
  onAdd,
  existingRules = []
}: AddGuardrailModalProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Custom guardrail form state
  const [customGuardrail, setCustomGuardrail] = useState<Partial<NewGuardrail>>({
    type: '',
    severity: 'medium',
    rule: '',
    description: '',
    rationale: '',
    implementation: {
      platform: ['all'],
      configuration: {},
      monitoring: []
    },
    isCustom: true
  });
  
  const [monitoringMetric, setMonitoringMetric] = useState({
    metric: '',
    threshold: '',
    frequency: '5m'
  });

  const templates = GUARDRAIL_TEMPLATES[category] || [];
  
  const getCategoryIcon = () => {
    switch (category) {
      case 'critical': return <Shield className="w-5 h-5 text-red-500" />;
      case 'operational': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'ethical': return <Users className="w-5 h-5 text-purple-500" />;
      case 'economic': return <DollarSign className="w-5 h-5 text-green-500" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleAddTemplate = () => {
    if (selectedTemplate) {
      const newGuardrail: NewGuardrail = {
        ...selectedTemplate,
        implementation: {
          platform: ['all'],
          configuration: {},
          monitoring: [{
            metric: `${selectedTemplate.rule.toLowerCase()}_violations`,
            threshold: '0',
            frequency: '1m'
          }]
        },
        isCustom: false
      };
      onAdd(newGuardrail);
      onClose();
    }
  };

  const handleAddCustom = () => {
    if (customGuardrail.rule && customGuardrail.description) {
      const newGuardrail: NewGuardrail = {
        type: customGuardrail.type || category,
        severity: customGuardrail.severity || 'medium',
        rule: customGuardrail.rule,
        description: customGuardrail.description,
        rationale: customGuardrail.rationale || '',
        implementation: customGuardrail.implementation || {
          platform: ['all'],
          configuration: {},
          monitoring: []
        },
        isCustom: true
      };
      onAdd(newGuardrail);
      onClose();
    }
  };

  const handleAddMonitoring = () => {
    if (monitoringMetric.metric && monitoringMetric.threshold) {
      setCustomGuardrail({
        ...customGuardrail,
        implementation: {
          ...customGuardrail.implementation!,
          monitoring: [
            ...(customGuardrail.implementation?.monitoring || []),
            { ...monitoringMetric }
          ]
        }
      });
      setMonitoringMetric({ metric: '', threshold: '', frequency: '5m' });
    }
  };

  const isRuleDuplicate = (ruleName: string) => {
    return existingRules.some(r => r.rule === ruleName);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCategoryIcon()}
            Add {category.charAt(0).toUpperCase() + category.slice(1)} Guardrail
          </DialogTitle>
          <DialogDescription>
            Choose from templates or create a custom guardrail for your use case.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Sparkles className="w-4 h-4 mr-2" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {templates.map((template, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.rule === template.rule
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:border-gray-400'
                    } ${isRuleDuplicate(template.rule) ? 'opacity-50' : ''}`}
                    onClick={() => !isRuleDuplicate(template.rule) && handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      <div className="flex gap-2">
                        <Badge className={
                          template.severity === 'critical' ? 'bg-red-500' :
                          template.severity === 'high' ? 'bg-orange-500' :
                          template.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }>
                          {template.severity}
                        </Badge>
                        {isRuleDuplicate(template.rule) && (
                          <Badge variant="outline">Already exists</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{template.type}</Badge>
                      <span className="text-muted-foreground">• {template.rationale}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {selectedTemplate && (
              <div className="pt-4 border-t">
                <Button onClick={handleAddTemplate} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Selected Template
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule">Rule Name *</Label>
                    <Input
                      id="rule"
                      value={customGuardrail.rule}
                      onChange={(e) => setCustomGuardrail({ ...customGuardrail, rule: e.target.value })}
                      placeholder="e.g., CUSTOM_VALIDATION_RULE"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={customGuardrail.type}
                      onValueChange={(value) => setCustomGuardrail({ ...customGuardrail, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_safety">Content Safety</SelectItem>
                        <SelectItem value="data_protection">Data Protection</SelectItem>
                        <SelectItem value="human_oversight">Human Oversight</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="cost_control">Cost Control</SelectItem>
                        <SelectItem value="bias_mitigation">Bias Mitigation</SelectItem>
                        <SelectItem value="ethical">Ethical</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={customGuardrail.severity}
                    onValueChange={(value: any) => setCustomGuardrail({ ...customGuardrail, severity: value })}
                  >
                    <SelectTrigger id="severity">
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
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={customGuardrail.description}
                    onChange={(e) => setCustomGuardrail({ ...customGuardrail, description: e.target.value })}
                    placeholder="What does this guardrail do?"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="rationale">Rationale</Label>
                  <Textarea
                    id="rationale"
                    value={customGuardrail.rationale}
                    onChange={(e) => setCustomGuardrail({ ...customGuardrail, rationale: e.target.value })}
                    placeholder="Why is this guardrail necessary?"
                    className="min-h-[60px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'openai', 'anthropic', 'google', 'aws', 'azure'].map((platform) => (
                      <Badge
                        key={platform}
                        variant={customGuardrail.implementation?.platform.includes(platform) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const platforms = customGuardrail.implementation?.platform || [];
                          if (platform === 'all') {
                            setCustomGuardrail({
                              ...customGuardrail,
                              implementation: {
                                ...customGuardrail.implementation!,
                                platform: ['all']
                              }
                            });
                          } else {
                            const newPlatforms = platforms.includes(platform)
                              ? platforms.filter(p => p !== platform)
                              : [...platforms.filter(p => p !== 'all'), platform];
                            setCustomGuardrail({
                              ...customGuardrail,
                              implementation: {
                                ...customGuardrail.implementation!,
                                platform: newPlatforms.length ? newPlatforms : ['all']
                              }
                            });
                          }
                        }}
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Monitoring Metrics</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Metric name"
                      value={monitoringMetric.metric}
                      onChange={(e) => setMonitoringMetric({ ...monitoringMetric, metric: e.target.value })}
                    />
                    <Input
                      placeholder="Threshold"
                      value={monitoringMetric.threshold}
                      onChange={(e) => setMonitoringMetric({ ...monitoringMetric, threshold: e.target.value })}
                    />
                    <Select
                      value={monitoringMetric.frequency}
                      onValueChange={(value) => setMonitoringMetric({ ...monitoringMetric, frequency: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Realtime</SelectItem>
                        <SelectItem value="1m">1 minute</SelectItem>
                        <SelectItem value="5m">5 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddMonitoring} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {customGuardrail.implementation?.monitoring && customGuardrail.implementation.monitoring.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {customGuardrail.implementation.monitoring.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Code className="w-4 h-4" />
                          <span>{m.metric}: {m.threshold} ({m.frequency})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleAddCustom} 
                className="w-full"
                disabled={!customGuardrail.rule || !customGuardrail.description}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Guardrail
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}