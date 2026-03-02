import React from 'react';
import ReadOnlyTechnicalFeasibility from './ReadOnlyTechnicalFeasibility';
import ReadOnlyBusinessFeasibility from './ReadOnlyBusinessFeasibility';
import ReadOnlyEthicalImpact from './ReadOnlyEthicalImpact';
import ReadOnlyRiskAssessment from './ReadOnlyRiskAssessment';
import ReadOnlyDataReadiness from './ReadOnlyDataReadiness';
import ReadOnlyRoadmapPosition from './ReadOnlyRoadmapPosition';
import ReadOnlyBudgetPlanning from './ReadOnlyBudgetPlanning';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, DollarSign, Shield, AlertTriangle, FileText, Calendar, TrendingUp } from 'lucide-react';

interface ReadOnlyAssessmentDisplayProps {
  assessData: {
    stepsData: {
      technicalFeasibility?: Record<string, unknown>;
      businessFeasibility?: Record<string, unknown>;
      ethicalImpact?: Record<string, unknown>;
      riskAssessment?: Record<string, unknown>;
      dataReadiness?: Record<string, unknown>;
      roadmapPosition?: Record<string, unknown>;
      budgetPlanning?: Record<string, unknown>;
    };
  };
}

const ReadOnlyAssessmentDisplay: React.FC<ReadOnlyAssessmentDisplayProps> = ({ assessData }) => {
  if (!assessData?.stepsData) {
    return <div className="text-gray-500 italic">No assessment data available</div>;
  }

  const { stepsData } = assessData;

  return (
    <div className="space-y-8">
      {/* Technical Feasibility */}
      {stepsData.technicalFeasibility && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <Brain className="w-6 h-6 text-blue-500" />
            <CardTitle>Technical Feasibility Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyTechnicalFeasibility data={stepsData.technicalFeasibility as {
              modelTypes: string[];
              modelSizes: string[];
              deploymentModels: string[];
              cloudProviders: string[];
              computeRequirements: string[];
              integrationPoints: string[];
              apiSpecs: string[];
              authMethods: string[];
              encryptionStandards: string[];
              technicalComplexity: number;
              outputTypes: string[];
              confidenceScore: string;
              modelUpdateFrequency: string;
            }} />
          </CardContent>
        </Card>
      )}

      {/* Business Feasibility */}
      {stepsData.businessFeasibility && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <CardTitle>Business Feasibility Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyBusinessFeasibility data={stepsData.businessFeasibility as {
              strategicAlignment: number;
              marketOpportunity: string;
              stakeholder: {
                exec: boolean;
                endUser: boolean;
                it: boolean;
              };
              annualSavings: string;
              efficiencyGain: number;
              paybackPeriod: number;
              availabilityRequirement: string;
              responseTimeRequirement: string;
              concurrentUsers: string;
              revenueImpactType: string;
              estimatedFinancialImpact: string;
              userCategories: string[];
              systemCriticality: string;
              failureImpact: string;
              executiveSponsorLevel: string;
              stakeholderGroups: string[];
            }} />
          </CardContent>
        </Card>
      )}

      {/* Ethical Impact */}
      {stepsData.ethicalImpact && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-purple-500" />
            <CardTitle>Ethical Impact Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyEthicalImpact data={stepsData.ethicalImpact as {
              biasFairness: {
                historicalBias: boolean;
                demographicGaps: boolean;
                geographicBias: boolean;
                selectionBias: boolean;
                confirmationBias: boolean;
                temporalBias: boolean;
              };
              privacySecurity: {
                dataMinimization: boolean;
                consentManagement: boolean;
                dataAnonymization: boolean;
              };
              decisionMaking: {
                automationLevel: string;
                decisionTypes: string[];
              };
              modelCharacteristics: {
                explainabilityLevel: string;
                biasTesting: string;
              };
              aiGovernance: {
                humanOversightLevel: string;
                performanceMonitoring: string[];
              };
              ethicalConsiderations: {
                potentialHarmAreas: string[];
                vulnerablePopulations: string[];
              };
            }} />
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {stepsData.riskAssessment && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyRiskAssessment data={stepsData.riskAssessment as {
              technicalRisks: { risk: string; probability: string; impact: string }[];
              businessRisks: { risk: string; probability: string; impact: string }[];
            }} />
          </CardContent>
        </Card>
      )}

      {/* Data Readiness */}
      {stepsData.dataReadiness && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-cyan-500" />
            <CardTitle>Data Readiness Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyDataReadiness data={stepsData.dataReadiness as {
              dataTypes: string[];
              dataVolume: string;
              growthRate: string;
              numRecords: string;
              primarySources: string[];
              dataQualityScore: number;
              dataCompleteness: number;
              dataAccuracyConfidence: number;
              dataFreshness: string;
              dataSubjectLocations: string;
              dataStorageLocations: string;
              dataProcessingLocations: string;
              crossBorderTransfer: boolean;
              dataLocalization: string;
              dataRetention: string;
            }} />
          </CardContent>
        </Card>
      )}

      {/* Roadmap Position */}
      {stepsData.roadmapPosition && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            <CardTitle>Roadmap Position Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyRoadmapPosition data={stepsData.roadmapPosition as {
              priority: string;
              projectStage: string;
              timelineConstraints: string[];
              timeline: string;
              dependencies: {
                dataPlatform: boolean;
                security: boolean;
                hiring: boolean;
              };
              metrics: string;
            }} />
          </CardContent>
        </Card>
      )}

      {/* Budget Planning */}
      {stepsData.budgetPlanning && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-yellow-500" />
            <CardTitle>Budget Planning Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyBudgetPlanning data={stepsData.budgetPlanning as {
              initialDevCost: number;
              baseApiCost: number;
              baseInfraCost: number;
              baseOpCost: number;
              baseMonthlyValue: number;
              valueGrowthRate: number;
              budgetRange: string;
              error?: string;
              loading?: boolean;
            }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReadOnlyAssessmentDisplay; 