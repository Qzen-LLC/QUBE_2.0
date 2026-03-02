'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  Building2, 
  Brain, 
  CheckCircle2, 
  Heart,
  FileCheck
} from 'lucide-react';

interface BacklogProps {
  useCaseId: string;
  useCase: {
    requirementsReviewStatus?: string | null;
    technicalReviewStatus?: string | null;
    businessReviewStatus?: string | null;
    responsibleEthicalReviewStatus?: string | null;
    legalRegulatoryReviewStatus?: string | null;
    dataReadinessReviewStatus?: string | null;
    finopsReviewStatus?: string | null;
  };
}

interface Guardrail {
  id: string;
  status: string;
  name: string;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  rules?: Array<{
    id: string;
    status: string;
    rule: string;
    type: string;
  }>;
}

interface Risk {
  id: string;
  title: string;
  category: string;
  riskLevel: string;
  riskScore: number;
  status: string;
  description: string;
}

interface ApprovalData {
  governanceName?: string | null;
  governanceComment?: string | null;
  governanceRating?: number | null;
  governanceConditions?: string[] | null;
  riskName?: string | null;
  riskComment?: string | null;
  riskRating?: number | null;
  riskConditions?: string[] | null;
  legalName?: string | null;
  legalComment?: string | null;
  legalRating?: number | null;
  legalConditions?: string[] | null;
  businessName?: string | null;
  businessComment?: string | null;
  businessRating?: number | null;
  businessConditions?: string[] | null;
  aiGovernanceName?: string | null;
  aiGovernanceComment?: string | null;
  aiGovernanceRating?: number | null;
  aiGovernanceConditions?: string[] | null;
  modelValidationName?: string | null;
  modelValidationComment?: string | null;
  modelValidationRating?: number | null;
  modelValidationConditions?: string[] | null;
  aiEthicsName?: string | null;
  aiEthicsComment?: string | null;
  aiEthicsRating?: number | null;
  aiEthicsConditions?: string[] | null;
}

export default function Backlog({ useCaseId, useCase }: BacklogProps) {
  const [guardrails, setGuardrails] = useState<Guardrail[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [importedRisks, setImportedRisks] = useState<Risk[]>([]);
  const [approvals, setApprovals] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch guardrails
        const guardrailsRes = await fetch(`/api/guardrails/get?useCaseId=${useCaseId}`);
        if (guardrailsRes.ok) {
          const guardrailsData = await guardrailsRes.json();
          console.log('[Backlog] Guardrails data:', { 
            success: guardrailsData.success, 
            hasGuardrails: !!guardrailsData.guardrails,
            status: guardrailsData.status,
            id: guardrailsData.id,
            rulesCount: guardrailsData.rules?.length || 0
          });
          
          if (guardrailsData.success && guardrailsData.guardrails) {
            const guardrail = guardrailsData.guardrails;
            // The API returns status at the top level, and rules are in guardrailsData.rules
            // Also check if guardrail has status field directly
            const guardrailStatus = guardrailsData.status || guardrail.status || 'draft';
            const guardrailId = guardrailsData.id || guardrail.id;
            const guardrailName = guardrailsData.name || guardrail.name || 'Guardrails Configuration';
            
            console.log('[Backlog] Processing guardrail:', {
              id: guardrailId,
              status: guardrailStatus,
              name: guardrailName,
              approvedAt: guardrailsData.approvedAt || guardrail.approvedAt,
              approvedBy: guardrailsData.approvedBy || guardrail.approvedBy
            });
            
            // Process rules from the API response
            let processedRules: any[] = [];
            if (guardrailsData.rules && Array.isArray(guardrailsData.rules)) {
              // Rules come as database records with status
              processedRules = guardrailsData.rules.map((rule: any) => ({
                id: rule.id,
                status: rule.status,
                rule: rule.rule,
                type: rule.type,
                severity: rule.severity,
                description: rule.description
              }));
            } else if (guardrail.guardrails?.rules) {
              // Rules might be nested in the guardrails structure
              Object.keys(guardrail.guardrails.rules).forEach(category => {
                if (Array.isArray(guardrail.guardrails.rules[category])) {
                  processedRules.push(...guardrail.guardrails.rules[category].map((r: any) => ({
                    id: r.id,
                    status: r.status,
                    rule: r.rule,
                    type: r.type || category,
                    severity: r.severity,
                    description: r.description
                  })));
                }
              });
            }
            
            console.log('[Backlog] Processed rules count:', processedRules.length);
            console.log('[Backlog] Approved rules:', processedRules.filter(r => r.status === 'APPROVED').length);
            
            setGuardrails([{
              id: guardrailId,
              status: guardrailStatus,
              name: guardrailName,
              approvedAt: guardrailsData.approvedAt || guardrail.approvedAt,
              approvedBy: guardrailsData.approvedBy || guardrail.approvedBy,
              rules: processedRules
            }]);
          }
        }

        // Fetch risks
        const risksRes = await fetch(`/api/risks/${useCaseId}`);
        if (risksRes.ok) {
          const risksData = await risksRes.json();
          const allRisks = Array.isArray(risksData) ? risksData : [];
          
          // Separate imported risks from AI Risk Intelligence (atlas source) from other risks
          const atlasRisks = allRisks.filter((r: any) => r.sourceType === 'atlas');
          const otherRisks = allRisks.filter((r: any) => r.sourceType !== 'atlas');
          
          setImportedRisks(atlasRisks);
          setRisks(otherRisks);
        }

        // Fetch approvals
        const approvalsRes = await fetch(`/api/read-approvals?useCaseId=${useCaseId}`);
        if (approvalsRes.ok) {
          const approvalsData = await approvalsRes.json();
          setApprovals(approvalsData);
        }
      } catch (error) {
        console.error('Error fetching backlog data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (useCaseId) {
      fetchData();
    }
  }, [useCaseId]);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get rule status badge styling
  const getRuleStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading backlog data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guardrails */}
      <Card>
        <CardHeader>
          <CardTitle>Guardrails</CardTitle>
        </CardHeader>
        <CardContent>
          {guardrails.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No guardrails found for this use case
            </div>
          ) : (
            <div className="space-y-4">
              {guardrails.map((guardrail) => {
                const allRules = guardrail.rules || [];
                const approvedRules = allRules.filter((r: any) => r.status === 'APPROVED');
                const pendingRules = allRules.filter((r: any) => r.status === 'PENDING' || r.status === 'DRAFT');
                const rejectedRules = allRules.filter((r: any) => r.status === 'REJECTED');
                
                return (
                  <div key={guardrail.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{guardrail.name || 'Guardrails Configuration'}</h4>
                      <Badge className={getStatusBadge(guardrail.status)}>
                        {guardrail.status || 'DRAFT'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {guardrail.approvedAt && (
                        <div>
                          Approved on: {new Date(guardrail.approvedAt).toLocaleDateString()}
                          {guardrail.approvedBy && ` by ${guardrail.approvedBy}`}
                        </div>
                      )}
                      {!guardrail.approvedAt && guardrail.status === 'DRAFT' && (
                        <div>Created: {new Date().toLocaleDateString()}</div>
                      )}
                    </div>
                    {allRules.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-foreground mb-2">
                          Rules ({allRules.length} total: {approvedRules.length} approved, {pendingRules.length} pending, {rejectedRules.length} rejected)
                        </div>
                        <div className="space-y-2">
                          {allRules.map((rule: any) => (
                            <div key={rule.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium">{rule.type || 'General'}</div>
                                <Badge className={getRuleStatusBadge(rule.status)} variant="outline">
                                  {rule.status || 'PENDING'}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground">{rule.rule}</div>
                              {rule.description && (
                                <div className="text-xs text-muted-foreground mt-1">{rule.description}</div>
                              )}
                              {rule.severity && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Severity: {rule.severity}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {allRules.length === 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        No rules defined for this guardrail configuration
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {importedRisks.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No risk recommendations from AI Risk Intelligence found
            </div>
          ) : (
            <div className="space-y-4">
              {importedRisks.map((risk) => (
                <div key={risk.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{risk.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge 
                        className={
                          risk.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          risk.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          risk.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }
                      >
                        {risk.riskLevel}
                      </Badge>
                      <Badge variant="outline">{risk.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Category: {risk.category}</span>
                    <span>Score: {risk.riskScore.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No security recommendations found
            </div>
          ) : (
            <div className="space-y-4">
              {risks.map((risk) => (
                <div key={risk.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{risk.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge 
                        className={
                          risk.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          risk.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          risk.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }
                      >
                        {risk.riskLevel}
                      </Badge>
                      <Badge variant="outline">{risk.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Category: {risk.category}</span>
                    <span>Score: {risk.riskScore.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Conditions Section - Grouped by approval type */}
      {approvals && (() => {
        // Define approval types with their icons and colors
        const approvalTypes = [
          {
            key: 'governance',
            label: 'Governance',
            conditions: approvals.governanceConditions,
            icon: ShieldCheck,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800'
          },
          {
            key: 'risk',
            label: 'Risk Management',
            conditions: approvals.riskConditions,
            icon: AlertTriangle,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            borderColor: 'border-orange-200 dark:border-orange-800'
          },
          {
            key: 'legal',
            label: 'Legal',
            conditions: approvals.legalConditions,
            icon: Scale,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800'
          },
          {
            key: 'business',
            label: 'Business Function',
            conditions: approvals.businessConditions,
            icon: Building2,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800'
          },
          {
            key: 'aiGovernance',
            label: 'AI Governance',
            conditions: approvals.aiGovernanceConditions,
            icon: Brain,
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
            borderColor: 'border-indigo-200 dark:border-indigo-800'
          },
          {
            key: 'modelValidation',
            label: 'Model Validation',
            conditions: approvals.modelValidationConditions,
            icon: CheckCircle2,
            color: 'text-teal-600 dark:text-teal-400',
            bgColor: 'bg-teal-50 dark:bg-teal-900/20',
            borderColor: 'border-teal-200 dark:border-teal-800'
          },
          {
            key: 'aiEthics',
            label: 'AI Ethics',
            conditions: approvals.aiEthicsConditions,
            icon: Heart,
            color: 'text-pink-600 dark:text-pink-400',
            bgColor: 'bg-pink-50 dark:bg-pink-900/20',
            borderColor: 'border-pink-200 dark:border-pink-800'
          }
        ];

        // Filter to only show approval types that have conditions
        const approvalTypesWithConditions = approvalTypes.filter(
          type => type.conditions && Array.isArray(type.conditions) && type.conditions.length > 0
        );

        // Count total conditions
        const totalConditions = approvalTypesWithConditions.reduce(
          (sum, type) => sum + (type.conditions?.length || 0),
          0
        );

        if (totalConditions === 0) {
          return null;
        }

        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Approval Conditions</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {totalConditions} {totalConditions === 1 ? 'condition' : 'conditions'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalTypesWithConditions.map((type) => {
                  const Icon = type.icon;
                  const conditions = type.conditions?.filter(c => c && c.trim()) || [];
                  
                  return (
                    <div
                      key={type.key}
                      className={`rounded-lg border-2 ${type.borderColor} ${type.bgColor} p-4 transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-md ${type.bgColor} ${type.borderColor} border`}>
                          <Icon className={`h-5 w-5 ${type.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{type.label}</h4>
                          <p className="text-xs text-muted-foreground">
                            {conditions.length} {conditions.length === 1 ? 'condition' : 'conditions'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 ml-11">
                        {conditions.map((condition, index) => (
                          <div
                            key={`${type.key}-condition-${index}`}
                            className="flex items-start gap-2 p-2 rounded-md bg-background/50 border border-border/50"
                          >
                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current mt-2.5 opacity-60" />
                            <p className="text-sm text-foreground leading-relaxed flex-1">
                              {condition}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

