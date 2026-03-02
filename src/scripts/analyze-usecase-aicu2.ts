import { prismaClient } from '@/utils/db';

interface AssessmentReport {
  useCase: any;
  assessments: {
    euAiAct?: any;
    iso42001?: any;
    uaeAi?: any;
    assess?: any;
    risks?: any;
    approval?: any;
    guardrails?: any;
    evaluations?: any;
    finops?: any;
  };
  summary: {
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    riskCount: number;
    guardrailCount: number;
    evaluationCount: number;
  };
}

async function analyzeUseCaseAICU2(): Promise<AssessmentReport> {
  try {
    console.log('🔍 Starting analysis for use case AICU-2...\n');

    // 1. Find the use case with aiucId = 2
    const useCase = await prismaClient.useCase.findFirst({
      where: { aiucId: 2 },
      include: {
        // Include basic relations
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            name: true
          }
        },
        // Include all assessment relations
        euAiActAssessments: {
          include: {
            answers: {
              include: {
                question: true
              }
            },
            controls: {
              include: {
                controlStruct: true,
                subcontrols: {
                  include: {
                    subcontrolStruct: true
                  }
                }
              }
            }
          }
        },
        iso42001Assessments: {
          include: {
            subclauses: {
              include: {
                subclause: true
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
        },
        uaeAiAssessments: {
          include: {
            controls: {
              include: {
                control: true
              }
            }
          }
        },
        assessData: true,
        risks: true,
        Approval: true,
        guardrails: {
          include: {
            rules: true
          }
        },
        evaluations: true,
        finopsData: true
      }
    });

    if (!useCase) {
      console.error('❌ Use case AICU-2 not found in the database');
      process.exit(1);
    }

    console.log('✅ Found use case:', useCase.title);
    console.log('   ID:', useCase.id);
    console.log('   AICU ID:', useCase.aiucId);
    console.log('   Stage:', useCase.stage);
    console.log('   Priority:', useCase.priority);
    console.log('   Business Function:', useCase.businessFunction);
    console.log('   Created:', useCase.createdAt);
    console.log('   Updated:', useCase.updatedAt);
    console.log('\n');

    // 2. Analyze each assessment type
    const assessments: AssessmentReport['assessments'] = {};
    let totalAssessments = 0;
    let completedAssessments = 0;
    let inProgressAssessments = 0;

    // EU AI Act Assessment
    if (useCase.euAiActAssessments) {
      totalAssessments++;
      assessments.euAiAct = {
        id: useCase.euAiActAssessments.id,
        status: useCase.euAiActAssessments.status,
        progress: useCase.euAiActAssessments.progress,
        answersCount: useCase.euAiActAssessments.answers.length,
        controlsCount: useCase.euAiActAssessments.controls.length,
        subcontrolsCount: useCase.euAiActAssessments.controls.reduce(
          (acc, c) => acc + c.subcontrols.length, 0
        ),
        createdAt: useCase.euAiActAssessments.createdAt,
        updatedAt: useCase.euAiActAssessments.updatedAt
      };
      
      if (useCase.euAiActAssessments.status === 'completed') completedAssessments++;
      else if (useCase.euAiActAssessments.status === 'in_progress') inProgressAssessments++;
      
      console.log('📋 EU AI Act Assessment:');
      console.log('   Status:', useCase.euAiActAssessments.status);
      console.log('   Progress:', `${useCase.euAiActAssessments.progress}%`);
      console.log('   Answers:', useCase.euAiActAssessments.answers.length);
      console.log('   Controls:', useCase.euAiActAssessments.controls.length);
      console.log('   Subcontrols:', assessments.euAiAct.subcontrolsCount);
      console.log('');
    }

    // ISO 42001 Assessment
    if (useCase.iso42001Assessments) {
      totalAssessments++;
      assessments.iso42001 = {
        id: useCase.iso42001Assessments.id,
        status: useCase.iso42001Assessments.status,
        progress: useCase.iso42001Assessments.progress,
        subclausesCount: useCase.iso42001Assessments.subclauses.length,
        annexesCount: useCase.iso42001Assessments.annexes.length,
        createdAt: useCase.iso42001Assessments.createdAt,
        updatedAt: useCase.iso42001Assessments.updatedAt
      };
      
      if (useCase.iso42001Assessments.status === 'completed') completedAssessments++;
      else if (useCase.iso42001Assessments.status === 'in_progress') inProgressAssessments++;
      
      console.log('📋 ISO 42001 Assessment:');
      console.log('   Status:', useCase.iso42001Assessments.status);
      console.log('   Progress:', `${useCase.iso42001Assessments.progress}%`);
      console.log('   Subclauses:', useCase.iso42001Assessments.subclauses.length);
      console.log('   Annex Items:', useCase.iso42001Assessments.annexes.length);
      console.log('');
    }

    // UAE AI Assessment
    if (useCase.uaeAiAssessments) {
      totalAssessments++;
      assessments.uaeAi = {
        id: useCase.uaeAiAssessments.id,
        status: useCase.uaeAiAssessments.status,
        progress: useCase.uaeAiAssessments.progress,
        totalScore: useCase.uaeAiAssessments.totalScore,
        weightedScore: useCase.uaeAiAssessments.weightedScore,
        maturityLevel: useCase.uaeAiAssessments.maturityLevel,
        riskImpactLevel: useCase.uaeAiAssessments.riskImpactLevel,
        controlsCount: useCase.uaeAiAssessments.controls.length,
        createdAt: useCase.uaeAiAssessments.createdAt,
        updatedAt: useCase.uaeAiAssessments.updatedAt
      };
      
      if (useCase.uaeAiAssessments.status === 'completed') completedAssessments++;
      else if (useCase.uaeAiAssessments.status === 'in_progress') inProgressAssessments++;
      
      console.log('📋 UAE AI Assessment:');
      console.log('   Status:', useCase.uaeAiAssessments.status);
      console.log('   Progress:', `${useCase.uaeAiAssessments.progress}%`);
      console.log('   Maturity Level:', useCase.uaeAiAssessments.maturityLevel);
      console.log('   Risk Impact Level:', useCase.uaeAiAssessments.riskImpactLevel);
      console.log('   Total Score:', useCase.uaeAiAssessments.totalScore);
      console.log('   Weighted Score:', useCase.uaeAiAssessments.weightedScore);
      console.log('   Controls:', useCase.uaeAiAssessments.controls.length);
      console.log('');
    }

    // Assess Data (Step-by-step assessment)
    if (useCase.assessData) {
      totalAssessments++;
      assessments.assess = {
        useCaseId: useCase.assessData.useCaseId,
        stepsData: useCase.assessData.stepsData,
        createdAt: useCase.assessData.createdAt,
        updatedAt: useCase.assessData.updatedAt
      };
      
      console.log('📋 Assess Data:');
      console.log('   Created:', useCase.assessData.createdAt);
      console.log('   Updated:', useCase.assessData.updatedAt);
      console.log('   Steps Data Available:', !!useCase.assessData.stepsData);
      console.log('');
    }

    // Risks
    if (useCase.risks && useCase.risks.length > 0) {
      assessments.risks = {
        count: useCase.risks.length,
        byCategory: {},
        byLevel: {},
        byStatus: {},
        risks: useCase.risks.map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          riskLevel: r.riskLevel,
          riskScore: r.riskScore,
          status: r.status,
          mitigationStatus: r.mitigationStatus
        }))
      };

      // Group risks by category, level, and status
      useCase.risks.forEach((risk: any) => {
        assessments.risks.byCategory[risk.category] = (assessments.risks.byCategory[risk.category] || 0) + 1;
        assessments.risks.byLevel[risk.riskLevel] = (assessments.risks.byLevel[risk.riskLevel] || 0) + 1;
        assessments.risks.byStatus[risk.status] = (assessments.risks.byStatus[risk.status] || 0) + 1;
      });

      console.log('⚠️ Risks:');
      console.log('   Total:', useCase.risks.length);
      console.log('   By Category:', JSON.stringify(assessments.risks.byCategory));
      console.log('   By Level:', JSON.stringify(assessments.risks.byLevel));
      console.log('   By Status:', JSON.stringify(assessments.risks.byStatus));
      console.log('');
    }

    // Approval Data
    if (useCase.Approval) {
      assessments.approval = {
        id: useCase.Approval.id,
        governance: {
          name: useCase.Approval.governanceName,
          status: useCase.Approval.governanceStatus,
          comment: useCase.Approval.governanceComment
        },
        risk: {
          name: useCase.Approval.riskName,
          status: useCase.Approval.riskStatus,
          comment: useCase.Approval.riskComment
        },
        legal: {
          name: useCase.Approval.legalName,
          status: useCase.Approval.legalStatus,
          comment: useCase.Approval.legalComment
        },
        business: {
          name: useCase.Approval.businessName,
          status: useCase.Approval.businessStatus,
          comment: useCase.Approval.businessComment,
          function: useCase.Approval.businessFunction
        },
        finalQualification: useCase.Approval.finalQualification,
        createdAt: useCase.Approval.createdAt,
        updatedAt: useCase.Approval.updatedAt
      };

      console.log('✅ Approval Status:');
      console.log('   Governance:', useCase.Approval.governanceStatus || 'Not set');
      console.log('   Risk:', useCase.Approval.riskStatus || 'Not set');
      console.log('   Legal:', useCase.Approval.legalStatus || 'Not set');
      console.log('   Business:', useCase.Approval.businessStatus || 'Not set');
      console.log('   Final Qualification:', useCase.Approval.finalQualification || 'Not set');
      console.log('');
    }

    // Guardrails
    if (useCase.guardrails && useCase.guardrails.length > 0) {
      assessments.guardrails = {
        count: useCase.guardrails.length,
        guardrails: useCase.guardrails.map((g: any) => ({
          id: g.id,
          name: g.name,
          status: g.status,
          approach: g.approach,
          confidence: g.confidence,
          rulesCount: g.rules.length,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        }))
      };

      console.log('🛡️ Guardrails:');
      console.log('   Total:', useCase.guardrails.length);
      useCase.guardrails.forEach((g: any) => {
        console.log(`   - ${g.name}: ${g.status} (${g.rules.length} rules)`);
      });
      console.log('');
    }

    // Evaluations
    if (useCase.evaluations && useCase.evaluations.length > 0) {
      assessments.evaluations = {
        count: useCase.evaluations.length,
        evaluations: useCase.evaluations.map((e: any) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt
        }))
      };

      console.log('📊 Evaluations:');
      console.log('   Total:', useCase.evaluations.length);
      console.log('');
    }

    // FinOps Data
    if (useCase.finopsData) {
      assessments.finops = {
        ROI: useCase.finopsData.ROI,
        netValue: useCase.finopsData.netValue,
        totalInvestment: useCase.finopsData.totalInvestment,
        apiCostBase: useCase.finopsData.apiCostBase,
        devCostBase: useCase.finopsData.devCostBase,
        infraCostBase: useCase.finopsData.infraCostBase,
        opCostBase: useCase.finopsData.opCostBase,
        cumOpCost: useCase.finopsData.cumOpCost,
        cumValue: useCase.finopsData.cumValue,
        valueBase: useCase.finopsData.valueBase,
        valueGrowthRate: useCase.finopsData.valueGrowthRate,
        budgetRange: useCase.finopsData.budgetRange
      };

      console.log('💰 FinOps Data:');
      console.log('   ROI:', useCase.finopsData.ROI);
      console.log('   Net Value:', useCase.finopsData.netValue);
      console.log('   Total Investment:', useCase.finopsData.totalInvestment);
      console.log('   Budget Range:', useCase.finopsData.budgetRange);
      console.log('');
    }

    // Create summary
    const summary = {
      totalAssessments,
      completedAssessments,
      inProgressAssessments,
      riskCount: useCase.risks?.length || 0,
      guardrailCount: useCase.guardrails?.length || 0,
      evaluationCount: useCase.evaluations?.length || 0
    };

    console.log('📈 Summary:');
    console.log('   Total Assessments:', totalAssessments);
    console.log('   Completed:', completedAssessments);
    console.log('   In Progress:', inProgressAssessments);
    console.log('   Risks Identified:', summary.riskCount);
    console.log('   Guardrails Configured:', summary.guardrailCount);
    console.log('   Evaluations:', summary.evaluationCount);
    console.log('\n');

    // Create the report
    const report: AssessmentReport = {
      useCase: {
        id: useCase.id,
        aiucId: useCase.aiucId,
        title: useCase.title,
        problemStatement: useCase.problemStatement,
        proposedAISolution: useCase.proposedAISolution,
        businessFunction: useCase.businessFunction,
        stage: useCase.stage,
        priority: useCase.priority,
        confidenceLevel: useCase.confidenceLevel,
        operationalImpactScore: useCase.operationalImpactScore,
        productivityImpactScore: useCase.productivityImpactScore,
        revenueImpactScore: useCase.revenueImpactScore,
        implementationComplexity: useCase.implementationComplexity,
        estimatedTimeline: useCase.estimatedTimeline,
        requiredResources: useCase.requiredResources,
        user: useCase.user,
        organization: useCase.organization,
        createdAt: useCase.createdAt,
        updatedAt: useCase.updatedAt
      },
      assessments,
      summary
    };

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = './aicu2-analysis-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Full report saved to: ${reportPath}`);

    return report;
  } catch (error) {
    console.error('❌ Error analyzing use case:', error);
    throw error;
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the analysis
console.log('='.repeat(60));
console.log('USE CASE AICU-2 COMPREHENSIVE ANALYSIS');
console.log('='.repeat(60));
console.log('');

analyzeUseCaseAICU2()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });