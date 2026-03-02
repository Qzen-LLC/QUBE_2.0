import { prismaClient } from '@/utils/db';
import { cleanAssessmentData } from '@/lib/utils/assessment-cleaner';
import { buildAssessmentContext, formatContextForPrompt } from '@/lib/assessment/assessment-context-builder';

/**
 * Comprehensive Context Aggregator for Guardrail Generation
 * Collects ALL available data about a use case to provide complete context
 * for intelligent, comprehensive guardrail generation
 */

export interface DeepGuardrailContext {
  // Complete Use Case Core
  useCase: {
    // Identifiers
    id: string;
    aiucId: number;
    organizationId: string | null;
    
    // Core Definition
    title: string;
    problemStatement: string;
    proposedAISolution: string;
    currentState: string;
    desiredState: string;
    
    // Strategic Context
    successCriteria: string;
    keyAssumptions: string;
    problemValidation: string;
    solutionHypothesis: string;
    keyBenefits: string | null;
    
    // Stakeholders
    primaryStakeholders: string[];
    secondaryStakeholders: string[];
    
    // Impact Analysis
    confidenceLevel: number;
    operationalImpactScore: number;
    productivityImpactScore: number;
    revenueImpactScore: number;
    implementationComplexity: number;
    
    // Resources & Timeline
    requiredResources: string;
    estimatedTimeline: string;
    estimatedTimelineMonths: string | null;
    plannedStartDate: string | null;
    initialCost: string | null;
    initialROI: string;
    
    // Metadata
    stage: string | null;
    priority: string | null;
    businessFunction: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  
  // All Core Assessments
  assessments: {
    technical?: any;
    business?: any;
    ethical?: any;
    risk?: any;
    data?: any;
    roadmap?: any;
    budget?: any;
  };

  // Rich assessment context text (real + LLM-inferred answers)
  assessmentContextText?: string;
  
  // Governance & Approvals
  governance: {
    approvals?: {
      governance: {
        name: string | null;
        status: string | null;
        comment: string | null;
      };
      risk: {
        name: string | null;
        status: string | null;
        comment: string | null;
      };
      legal: {
        name: string | null;
        status: string | null;
        comment: string | null;
      };
      business: {
        name: string | null;
        status: string | null;
        comment: string | null;
        businessFunction: string | null;
      };
    };
    finalQualification: string | null;
  };
  
  // Risk Register
  risks: {
    identified: any[];
    mitigationPlans: any[];
    acceptedRisks: string[];
    residualRiskLevel: string;
  };
  
  // Financial Context
  financial?: {
    roi: number;
    netValue: number;
    totalInvestment: number;
    costs: {
      api: number;
      development: number;
      infrastructure: number;
      operational: number;
    };
    valueGrowthRate: number;
    budgetRange: string | null;
  };
  
  // Compliance Frameworks
  compliance: {
    euAiAct?: any;
    iso42001?: any;
    uaeAi?: any;
    hipaa?: any;
    gdpr?: any;
  };
  
  // Organization Context
  organization?: {
    id: string;
    name: string;
    domain: string | null;
    policies: {
      aiEthics: string[];
      dataGovernance: string[];
      riskAppetite: string;
      prohibitedUses: string[];
      requiredSafeguards: string[];
    };
  };
  
  // Environmental Context
  environment: {
    deploymentEnvironment: string;
    integrationSystems: string[];
    dataFlows: {
      sources: string[];
      destinations: string[];
      crossBorder: boolean;
    };
    userBase: {
      internal: number;
      external: number;
      geographic: string[];
    };
    regulatoryJurisdictions: string[];
    industryStandards: string[];
  };
  
  // Metadata
  metadata: {
    generatedAt: Date;
    requestedBy: string;
    version: string;
    assumptions: string[];
    limitations: string[];
  };
}

export class ContextAggregator {
  /**
   * Build complete context for guardrail generation
   * Collects ALL available data about the use case
   */
  async buildCompleteContext(
    useCaseId: string, 
    assessmentData: any,
    requestedBy: string = 'system'
  ): Promise<DeepGuardrailContext> {
    console.log('🔍 Building comprehensive context for use case:', useCaseId);

    // Load all data in parallel for efficiency
    const [
      useCase,
      approval,
      risks,
      financial,
      euAiAct,
      iso42001,
      uaeAi,
      organization,
      assessData,
      assessmentContextResult
    ] = await Promise.all([
      this.loadCompleteUseCase(useCaseId),
      this.loadApprovalContext(useCaseId),
      this.loadRiskRegister(useCaseId),
      this.loadFinancialContext(useCaseId),
      this.loadEuAiActCompliance(useCaseId),
      this.loadIso42001Compliance(useCaseId),
      this.loadUaeAiCompliance(useCaseId),
      this.loadOrganizationContext(useCaseId),
      this.loadAssessmentData(useCaseId),
      buildAssessmentContext(useCaseId).catch((err) => {
        console.warn('⚠️ Could not build assessment context:', err.message);
        return null;
      })
    ]);

    // Build rich assessment context text (real + inferred answers)
    const assessmentContextText = assessmentContextResult
      ? formatContextForPrompt(assessmentContextResult)
      : undefined;

    if (!useCase) {
      throw new Error(`Use case ${useCaseId} not found`);
    }

    // Build the complete context
    const context: DeepGuardrailContext = {
      useCase: {
        id: useCase.id,
        aiucId: useCase.aiucId,
        organizationId: useCase.organizationId,
        title: useCase.title,
        problemStatement: useCase.problemStatement,
        proposedAISolution: useCase.proposedAISolution,
        currentState: useCase.currentState,
        desiredState: useCase.desiredState,
        successCriteria: useCase.successCriteria,
        keyAssumptions: useCase.keyAssumptions,
        problemValidation: useCase.problemValidation,
        solutionHypothesis: useCase.solutionHypothesis,
        keyBenefits: useCase.keyBenefits,
        primaryStakeholders: useCase.primaryStakeholders,
        secondaryStakeholders: useCase.secondaryStakeholders,
        confidenceLevel: useCase.confidenceLevel,
        operationalImpactScore: useCase.operationalImpactScore,
        productivityImpactScore: useCase.productivityImpactScore,
        revenueImpactScore: useCase.revenueImpactScore,
        implementationComplexity: useCase.implementationComplexity,
        requiredResources: useCase.requiredResources,
        estimatedTimeline: useCase.estimatedTimeline,
        estimatedTimelineMonths: useCase.estimatedTimelineMonths,
        plannedStartDate: useCase.plannedStartDate,
        initialCost: useCase.initialCost,
        initialROI: useCase.initialROI,
        stage: useCase.stage,
        priority: useCase.priority,
        businessFunction: useCase.businessFunction,
        createdAt: useCase.createdAt,
        updatedAt: useCase.updatedAt
      },
      
      assessments: this.mergeAssessmentData(assessmentData, assessData),

      assessmentContextText,

      governance: {
        approvals: approval ? {
          governance: {
            name: approval.governanceName,
            status: approval.governanceStatus,
            comment: approval.governanceComment
          },
          risk: {
            name: approval.riskName,
            status: approval.riskStatus,
            comment: approval.riskComment
          },
          legal: {
            name: approval.legalName,
            status: approval.legalStatus,
            comment: approval.legalComment
          },
          business: {
            name: approval.businessName,
            status: approval.businessStatus,
            comment: approval.businessComment,
            businessFunction: approval.businessFunction
          }
        } : undefined,
        finalQualification: approval?.finalQualification || null
      },
      
      risks: {
        identified: risks,
        mitigationPlans: risks.map(r => ({
          riskId: r.id,
          plan: r.mitigationPlan,
          status: r.mitigationStatus,
          owner: r.assignedTo,
          targetDate: r.targetDate
        })),
        acceptedRisks: risks.filter(r => r.status === 'ACCEPTED').map(r => r.id),
        residualRiskLevel: this.calculateResidualRiskLevel(risks)
      },
      
      financial: financial ? {
        roi: financial.ROI,
        netValue: financial.netValue,
        totalInvestment: financial.totalInvestment,
        costs: {
          api: financial.apiCostBase,
          development: financial.devCostBase,
          infrastructure: financial.infraCostBase,
          operational: financial.opCostBase
        },
        valueGrowthRate: financial.valueGrowthRate,
        budgetRange: financial.budgetRange
      } : undefined,
      
      compliance: {
        euAiAct: euAiAct,
        iso42001: iso42001,
        uaeAi: uaeAi,
        hipaa: this.extractHipaaRequirements(assessmentData),
        gdpr: this.extractGdprRequirements(assessmentData)
      },
      
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        policies: this.extractOrganizationPolicies(organization, assessmentData)
      } : undefined,
      
      environment: this.extractEnvironmentalContext(assessmentData, useCase),
      
      metadata: {
        generatedAt: new Date(),
        requestedBy: requestedBy,
        version: '2.0.0',
        assumptions: this.extractAssumptions(useCase, assessmentData),
        limitations: this.extractLimitations(assessmentData)
      }
    };

    // Analyze interconnections and enrich context
    this.analyzeInterconnections(context);
    
    console.log('✅ Complete context built successfully');
    return context;
  }

  /**
   * Load complete use case data
   */
  private async loadCompleteUseCase(useCaseId: string) {
    return await prismaClient.useCase.findUnique({
      where: { id: useCaseId }
    });
  }

  /**
   * Load approval context
   */
  private async loadApprovalContext(useCaseId: string) {
    return await prismaClient.approval.findUnique({
      where: { useCaseId }
    });
  }

  /**
   * Load risk register
   */
  private async loadRiskRegister(useCaseId: string) {
    return await prismaClient.risk.findMany({
      where: { useCaseId },
      orderBy: { riskScore: 'desc' }
    });
  }

  /**
   * Load financial context
   */
  private async loadFinancialContext(useCaseId: string) {
    return await prismaClient.finOps.findUnique({
      where: { useCaseId }
    });
  }

  /**
   * Load EU AI Act compliance assessment
   */
  private async loadEuAiActCompliance(useCaseId: string) {
    const assessment = await prismaClient.euAiActAssessment.findUnique({
      where: { useCaseId },
      include: {
        answers: {
          include: {
            question: {
              include: {
                subtopic: {
                  include: {
                    topic: true
                  }
                }
              }
            }
          }
        },
        controls: {
          include: {
            controlStruct: {
              include: {
                category: true
              }
            },
            subcontrols: {
              include: {
                subcontrolStruct: true
              }
            }
          }
        }
      }
    });

    if (!assessment) return null;

    // Structure the compliance data
    return {
      assessment,
      classification: this.determineEuAiActClassification(assessment),
      requirements: this.extractEuAiActRequirements(assessment),
      gaps: this.identifyEuAiActGaps(assessment)
    };
  }

  /**
   * Load ISO 42001 compliance assessment
   */
  private async loadIso42001Compliance(useCaseId: string) {
    const assessment = await prismaClient.iso42001Assessment.findUnique({
      where: { useCaseId },
      include: {
        subclauses: {
          include: {
            subclause: {
              include: {
                clause: true
              }
            }
          }
        },
        annexes: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!assessment) return null;

    return {
      assessment,
      maturityLevel: this.calculateIso42001Maturity(assessment),
      gaps: this.identifyIso42001Gaps(assessment)
    };
  }

  /**
   * Load UAE AI assessment
   */
  private async loadUaeAiCompliance(useCaseId: string) {
    const assessment = await prismaClient.uaeAiAssessment.findUnique({
      where: { useCaseId },
      include: {
        controls: {
          include: {
            control: true
          }
        }
      }
    });

    if (!assessment) return null;

    return {
      assessment,
      localRequirements: this.extractUaeSpecificRequirements(assessment),
      arabicLanguageSupport: this.checkArabicLanguageRequirement(assessment)
    };
  }

  /**
   * Load organization context
   */
  private async loadOrganizationContext(useCaseId: string) {
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
      select: { organizationId: true }
    });

    if (!useCase?.organizationId) return null;

    return await prismaClient.organization.findUnique({
      where: { id: useCase.organizationId }
    });
  }

  /**
   * Load assessment data from database (now built from Answer records)
   */
  private async loadAssessmentData(useCaseId: string) {
    const { buildStepsDataFromAnswers } = await import('@/lib/mappers/answers-to-steps');
    const stepsData = await buildStepsDataFromAnswers(useCaseId);
    
    // Return in the same format as the old Assess table for compatibility
    return {
      useCaseId,
      stepsData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Merge assessment data from frontend and database
   */
  private mergeAssessmentData(frontendData: any, dbData: any) {
    const merged = {
      technical: frontendData?.technicalFeasibility,
      business: frontendData?.businessFeasibility,
      ethical: frontendData?.ethicalImpact,
      risk: frontendData?.riskAssessment,
      data: frontendData?.dataReadiness,
      roadmap: frontendData?.roadmapPosition,
      budget: frontendData?.budgetPlanning
    };

    // If database has data, merge it (and clean it to remove empty fields)
    if (dbData?.stepsData) {
      const dbSteps = dbData.stepsData as any;
      console.log('🧹 Cleaning assessment data from database before merging...');
      Object.keys(merged).forEach(key => {
        if (!merged[key] && dbSteps[key]) {
          // Clean database data to remove empty fields
          merged[key] = cleanAssessmentData(dbSteps[key], { logChanges: false });
        }
      });
      console.log('✅ Database assessment data cleaned');
    }

    return merged;
  }

  /**
   * Calculate residual risk level
   */
  private calculateResidualRiskLevel(risks: any[]): string {
    const openRisks = risks.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
    const highRisks = openRisks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
    
    if (highRisks.length > 3) return 'critical';
    if (highRisks.length > 1) return 'high';
    if (openRisks.length > 5) return 'medium';
    return 'low';
  }

  /**
   * Extract HIPAA requirements if applicable
   */
  private extractHipaaRequirements(assessmentData: any) {
    const hasHealthData = assessmentData?.dataReadiness?.dataTypes?.includes('Health/Medical Records');
    if (!hasHealthData) return null;

    return {
      phiTypes: ['Medical Records', 'Health Information'],
      safeguards: {
        administrative: ['Access controls', 'Workforce training', 'Risk assessments'],
        physical: ['Facility access controls', 'Device controls'],
        technical: ['Encryption', 'Audit logs', 'Integrity controls']
      },
      breachProtocol: 'Required within 60 days'
    };
  }

  /**
   * Extract GDPR requirements if applicable
   */
  private extractGdprRequirements(assessmentData: any) {
    const hasPersonalData = assessmentData?.dataReadiness?.dataTypes?.includes('Personal Data');
    const euJurisdiction = assessmentData?.riskAssessment?.dataProtection?.jurisdictions?.includes('GDPR (EU)');
    
    if (!hasPersonalData || !euJurisdiction) return null;

    return {
      dataCategories: assessmentData.dataReadiness.dataTypes,
      lawfulBasis: 'Legitimate interest', // This should be determined from assessment
      dpia: assessmentData.riskAssessment?.dataProtection?.dpiaRequired || false,
      transfers: assessmentData.dataReadiness?.crossBorderTransfer || []
    };
  }

  /**
   * Extract organization policies
   */
  private extractOrganizationPolicies(organization: any, assessmentData: any) {
    // This would typically come from organization settings
    // For now, using sensible defaults
    return {
      aiEthics: ['Transparency', 'Accountability', 'Fairness', 'Privacy'],
      dataGovernance: ['Data minimization', 'Purpose limitation', 'Accuracy'],
      riskAppetite: 'moderate',
      prohibitedUses: [
        'No automated decisions without human oversight',
        'No biometric identification without consent',
        'No discriminatory profiling'
      ],
      requiredSafeguards: [
        'Bias detection and mitigation',
        'Incident response procedures',
        'Performance monitoring',
        'Human oversight mechanisms'
      ]
    };
  }

  /**
   * Extract environmental context
   */
  private extractEnvironmentalContext(assessmentData: any, useCase: any) {
    return {
      deploymentEnvironment: assessmentData?.technicalFeasibility?.deploymentModels?.[0] || 'cloud',
      integrationSystems: assessmentData?.technicalFeasibility?.integrationPoints || [],
      dataFlows: {
        sources: assessmentData?.dataReadiness?.dataSources || [],
        destinations: assessmentData?.dataReadiness?.dataDestinations || [],
        crossBorder: assessmentData?.dataReadiness?.crossBorderTransfer === 'Yes'
      },
      userBase: {
        internal: assessmentData?.businessFeasibility?.internalUsers || 0,
        external: assessmentData?.businessFeasibility?.externalUsers || 0,
        geographic: assessmentData?.businessFeasibility?.geographicScope || []
      },
      regulatoryJurisdictions: assessmentData?.riskAssessment?.dataProtection?.jurisdictions || [],
      industryStandards: assessmentData?.riskAssessment?.industryStandards || []
    };
  }

  /**
   * Extract assumptions
   */
  private extractAssumptions(useCase: any, assessmentData: any): string[] {
    const assumptions = [useCase.keyAssumptions];
    
    if (assessmentData?.technicalFeasibility?.assumptions) {
      assumptions.push(...assessmentData.technicalFeasibility.assumptions);
    }
    
    assumptions.push(
      'Current regulatory framework remains stable',
      'User behavior follows expected patterns',
      'Infrastructure can support specified requirements'
    );
    
    return assumptions.filter(Boolean);
  }

  /**
   * Extract limitations
   */
  private extractLimitations(assessmentData: any): string[] {
    const limitations = [];
    
    if (assessmentData?.technicalFeasibility?.limitations) {
      limitations.push(...assessmentData.technicalFeasibility.limitations);
    }
    
    if (assessmentData?.budgetPlanning?.budgetRange === '< $10K') {
      limitations.push('Limited budget constrains advanced features');
    }
    
    if (assessmentData?.dataReadiness?.dataQualityScore < 7) {
      limitations.push('Data quality limitations may affect performance');
    }
    
    return limitations;
  }

  /**
   * Determine EU AI Act classification
   */
  private determineEuAiActClassification(assessment: any): string {
    // This would analyze the assessment answers to determine classification
    // Simplified logic for now
    const hasHighRiskIndicators = assessment.answers?.some((a: any) => 
      a.answer?.toLowerCase().includes('biometric') ||
      a.answer?.toLowerCase().includes('critical infrastructure') ||
      a.answer?.toLowerCase().includes('law enforcement')
    );

    if (hasHighRiskIndicators) return 'high-risk';
    return 'limited-risk';
  }

  /**
   * Extract EU AI Act requirements
   */
  private extractEuAiActRequirements(assessment: any): string[] {
    const requirements = [];
    
    // Based on controls status
    assessment.controls?.forEach((control: any) => {
      if (control.status === 'required' || control.status === 'in_progress') {
        requirements.push(control.controlStruct.title);
      }
    });
    
    return requirements;
  }

  /**
   * Identify EU AI Act gaps
   */
  private identifyEuAiActGaps(assessment: any): string[] {
    const gaps = [];
    
    assessment.controls?.forEach((control: any) => {
      if (control.status === 'pending' || control.status === 'not_started') {
        gaps.push(control.controlStruct.title);
      }
    });
    
    return gaps;
  }

  /**
   * Calculate ISO 42001 maturity
   */
  private calculateIso42001Maturity(assessment: any): string {
    const totalItems = assessment.subclauses?.length || 0;
    const completedItems = assessment.subclauses?.filter((s: any) => 
      s.status === 'complete' || s.status === 'implemented'
    ).length || 0;
    
    const completionRate = totalItems > 0 ? completedItems / totalItems : 0;
    
    if (completionRate >= 0.9) return 'optimized';
    if (completionRate >= 0.7) return 'managed';
    if (completionRate >= 0.5) return 'defined';
    if (completionRate >= 0.3) return 'developing';
    return 'initial';
  }

  /**
   * Identify ISO 42001 gaps
   */
  private identifyIso42001Gaps(assessment: any): string[] {
    const gaps = [];
    
    assessment.subclauses?.forEach((subclause: any) => {
      if (subclause.status === 'pending' || subclause.status === 'not_applicable') {
        gaps.push(subclause.subclause.title);
      }
    });
    
    return gaps;
  }

  /**
   * Extract UAE specific requirements
   */
  private extractUaeSpecificRequirements(assessment: any): string[] {
    return [
      'Local data residency requirements',
      'Arabic language support for public-facing systems',
      'Compliance with UAE data protection laws',
      'Alignment with UAE National AI Strategy 2031'
    ];
  }

  /**
   * Check Arabic language requirement
   */
  private checkArabicLanguageRequirement(assessment: any): boolean {
    // Check if system is public-facing in UAE
    return assessment.controls?.some((c: any) => 
      c.implementation?.includes('public') || 
      c.implementation?.includes('Arabic')
    ) || false;
  }

  /**
   * Analyze interconnections between different aspects
   */
  private analyzeInterconnections(context: DeepGuardrailContext) {
    // Identify hidden relationships
    // Predict emergent risks
    // Find conflicting requirements
    // Detect gaps in coverage
    
    console.log('🔗 Analyzing interconnections in context...');
    
    // Example: High complexity + Mission critical = Need enhanced monitoring
    if (context.useCase.implementationComplexity > 7 && 
        context.assessments.business?.systemCriticality === 'Mission Critical') {
      console.log('⚠️ High complexity + Mission critical detected - enhanced monitoring required');
    }
    
    // Example: Personal data + Cross-border = Need data transfer agreements
    if (context.assessments.data?.dataTypes?.includes('Personal Data') &&
        context.environment.dataFlows.crossBorder) {
      console.log('⚠️ Personal data with cross-border transfer - data transfer agreements required');
    }
    
    // Example: High risk + Low budget = Potential constraint conflict
    if (context.risks.residualRiskLevel === 'high' &&
        context.financial?.budgetRange === '< $10K') {
      console.log('⚠️ High risk with low budget - potential resource constraint');
    }
  }
}