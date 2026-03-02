'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChartRadarDots } from '@/components/ui/radar-chart';
import { ApprovalsRiskSummary } from '@/components/ui/approvals-risk-summary';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { calculateRiskScores } from '@/lib/risk-calculations';

// Import the risk calculation functions from ApprovalsPage
const calculateDataPrivacyRisk = (stepsData: any) => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const weights = {
    sensitiveData: 3,
    largeVolume: 1.5,
    crossBorder: 2,
    realTime: 0.5,
    minorsData: 1,
    retention: 0.5,
    multiJurisdiction: 0.8
  };
  const sensitiveTypes = ['Health/Medical Records', 'Financial Records', 'Biometric Data', "Children's Data (under 16)"];
  const _hasSensitiveData = Array.isArray(stepsData?.dataReadiness?.dataTypes) && stepsData.dataReadiness.dataTypes.some((type: string) => sensitiveTypes.includes(type || ''));
  if (_hasSensitiveData) {
    score += weights.sensitiveData;
    factors.push(`Processing sensitive PII (+${weights.sensitiveData})`);
  }
  if (stepsData?.dataReadiness?.dataTypes?.includes("Children's Data (under 16)")) {
    infoMessages.push("Children's Data (under 16) detected. Data privacy risk has been flagged as sensitive.");
  }
  if (stepsData?.dataReadiness?.dataTypes?.includes("Biometric Data")) {
    infoMessages.push("Biometric Data detected. Data privacy risk has been flagged as sensitive.");
  }
  if (stepsData?.dataReadiness?.crossBorderTransfer && (!stepsData?.riskAssessment?.dataProtection?.jurisdictions || stepsData?.riskAssessment?.dataProtection?.jurisdictions.length === 0)) {
    infoMessages.push("Cross-border data transfer is required, but no jurisdictions are specified. Please review data protection requirements.");
  }
  if (['large', 'vlarge', 'massive'].includes(stepsData?.dataReadiness?.dataVolume ?? '')) {
    score += weights.largeVolume;
    factors.push(`Large data volume >1TB (+${weights.largeVolume})`);
  }
  if (stepsData?.dataReadiness?.crossBorderTransfer == true) {
    score += weights.crossBorder;
    factors.push(`Cross-border transfers (+${weights.crossBorder})`);
  }
  if ((stepsData?.technicalFeasibility?.modelUpdateFrequency || '') === 'Real-time/Continuous') {
    score += weights.realTime;
    factors.push(`Real-time processing (+${weights.realTime})`);
  }
  if (stepsData?.dataReadiness?.dataTypes?.includes("Children's Data (under 16)")) {
    score += weights.minorsData;
    factors.push(`Processing minors data (+${weights.minorsData})`);
  }
  if (stepsData?.dataReadiness?.multiJurisdictionHandling === true) {
    score += weights.multiJurisdiction;
    factors.push(`Multi-jurisdiction handling (+${weights.multiJurisdiction})`);
  }
  if (['3-7years', '7+years'].includes(stepsData?.dataReadiness?.dataRetention ?? '')) {
    score += weights.retention;
    factors.push(`Extended data retention (+${weights.retention})`);
  }
  return {
    score: Math.min(score, 10),
    factors,
    formula: `Base(1) + ${factors.map(f => f.match(/\+(\d+\.?\d*)/)?.[1]).join(' + ')} = ${Math.min(score, 10)}`,
    infoMessages
  };
};

const calculateSecurityRisk = (stepsData: any) => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const weights = {
    publicAPI: 2,
    partnerAPI: 1.5,
    internalAPI: 0.5,
    cloudDeployment: 1,
    hybridDeployment: 0.8,
    integrationComplexity: 0.2,
    authComplexity: 0.5,
    edgeDeployment: 1.2
  };
  switch (stepsData?.technicalFeasibility?.apiSpecs || '') {
    case 'Public API':
      score += weights.publicAPI;
      factors.push(`Public API exposure (+${weights.publicAPI})`);
      break;
    case 'Partner API':
      score += weights.partnerAPI;
      factors.push(`Partner API exposure (+${weights.partnerAPI})`);
      break;
    case 'Internal API only':
      score += weights.internalAPI;
      factors.push(`Internal API exposure (+${weights.internalAPI})`);
      break;
  }
  switch (stepsData?.technicalFeasibility?.deploymentModels || '') {
    case 'Public Cloud':
      score += weights.cloudDeployment;
      factors.push(`Cloud deployment (+${weights.cloudDeployment})`);
      break;
    case 'Hybrid Cloud':
      score += weights.hybridDeployment;
      factors.push(`Hybrid deployment (+${weights.hybridDeployment})`);
      break;
    case 'Edge Computing':
      score += weights.edgeDeployment;
      factors.push(`Edge deployment (+${weights.edgeDeployment})`);
      break;
  }
  const integrationScore = (stepsData?.technicalFeasibility?.integrationPoints?.length || 0) * (stepsData?.technicalFeasibility?.technicalComplexity || 0);
  if (integrationScore > 0) {
    score += integrationScore;
    factors.push(`Multiple integrations (+${integrationScore.toFixed(1)})`);
  }
  if ((stepsData?.businessFeasibility?.userCategories || []).includes('General Public')) {
    score += weights.authComplexity;
    factors.push(`Authentication complexity (+${weights.authComplexity})`);
  }
  if (["Public API", "Partner API"].includes(stepsData?.technicalFeasibility?.apiSpecs || '')) {
    if (!stepsData?.technicalFeasibility?.integrationPoints || stepsData.technicalFeasibility.integrationPoints.length === 0) {
      infoMessages.push("Public or Partner API selected, but no integration points specified. Please ensure security controls are in place.");
    }
  }
  if (["Public Cloud", "Hybrid Cloud"].includes(stepsData?.technicalFeasibility?.deploymentModels || '')) {
    if (!stepsData?.technicalFeasibility?.integrationPoints || stepsData.technicalFeasibility.integrationPoints.length === 0) {
      infoMessages.push("Cloud or Hybrid deployment selected, but no integration points specified. Please ensure security controls are in place.");
    }
  }
  return {
    score: Math.min(score, 10),
    factors,
    formula: `Base(1) + ${factors.map(f => f.match(/\+(\d+\.?\d*)/)?.[1]).join(' + ')} = ${Math.min(score, 10)}`,
    infoMessages
  };
};

const calculateRegulatoryRisk = (stepsData: any) => {
  let score = 1;
  const factors = [];
  const weights = {
    GDPR: 3,
    HIPAA: 3,
    PCI: 2.5,
    SOX: 2,
    financialRegs: 2.5,
    aiRegulations: 1.8,
    multiJurisdiction: 1,
    sectorSpecific: 2,
    LGPD: 2.5,
    PIPEDA: 2.5,
    POPI: 2.5,
    APPI: 2.5,
    PrivacyActAU: 2.5,
    PDPA: 2.5
  };
  let regulatoryWarnings: string[] = [];
  let operatingJurisdictions: any = undefined;
  if (stepsData?.riskAssessment && 'operatingJurisdictions' in stepsData.riskAssessment) {
    operatingJurisdictions = (stepsData.riskAssessment as any).operatingJurisdictions;
  } else if (stepsData?.dataReadiness && 'operatingJurisdictions' in stepsData.dataReadiness) {
    operatingJurisdictions = (stepsData.dataReadiness as any).operatingJurisdictions;
  }
  let sectorSpecific = stepsData?.riskAssessment?.sectorSpecific;
  let sectorSpecificStr = typeof sectorSpecific === 'string' ? sectorSpecific : '';
  if (!sectorSpecificStr && typeof sectorSpecific === 'object') {
    sectorSpecificStr = Object.keys(sectorSpecific).find(k => sectorSpecific[k]) || '';
  }
  const dataTypes = stepsData?.dataReadiness?.dataTypes || [];
  const dataProtectionJurisdictions = stepsData?.riskAssessment?.dataProtection?.jurisdictions || [];
  let hasGDPR = dataProtectionJurisdictions.includes('GDPR (EU)');
  let euJurisdictionSelected = operatingJurisdictions && operatingJurisdictions['Europe'] && operatingJurisdictions['Europe']['European Union'];
  if (hasGDPR || euJurisdictionSelected) {
    score += weights.GDPR;
    factors.push(`GDPR compliance required (+${weights.GDPR})`);
    if (euJurisdictionSelected && !hasGDPR) {
      regulatoryWarnings.push('European Union is selected as an operating jurisdiction, but GDPR (EU) is not checked in Data Protection. GDPR risk has been inferred.');
    }
  }
  let hasHIPAA = dataProtectionJurisdictions.includes('HIPAA (Healthcare)') || sectorSpecificStr === 'HIPAA (Healthcare)';
  let usJurisdictionSelected = operatingJurisdictions && operatingJurisdictions['Americas'] && operatingJurisdictions['Americas']['United States (Federal)'];
  let healthcareSector = sectorSpecificStr === 'HIPAA (Healthcare)' || (typeof sectorSpecific === 'object' && sectorSpecific['HIPAA (Healthcare)']);
  if (hasHIPAA || (usJurisdictionSelected && healthcareSector)) {
    score += weights.HIPAA;
    factors.push(`HIPAA compliance required (+${weights.HIPAA})`);
    if (usJurisdictionSelected && healthcareSector && !hasHIPAA) {
      regulatoryWarnings.push('United States (Federal) and Healthcare sector are selected, but HIPAA is not checked. HIPAA risk has been inferred.');
    }
  }
  let hasPCI = dataProtectionJurisdictions.includes('PCI-DSS (Payment Cards)') || sectorSpecificStr === 'PCI-DSS (Payment Cards)';
  let hasFinancialRecords = dataTypes.includes('Financial Records');
  if (hasPCI || hasFinancialRecords) {
    score += weights.PCI;
    factors.push(`PCI-DSS compliance required (+${weights.PCI})`);
    if (hasFinancialRecords && !hasPCI) {
      regulatoryWarnings.push('Financial Records data type is selected, but PCI-DSS is not checked. PCI-DSS risk has been inferred.');
    }
  }
  let hasSOX = dataProtectionJurisdictions.includes('SOX (Financial Reporting)') || sectorSpecificStr === 'SOX (Financial Reporting)' || sectorSpecificStr === 'SOX (Financial Services)';
  let financialSector = sectorSpecificStr === 'SOX (Financial Services)' || sectorSpecificStr === 'SOX (Financial Reporting)';
  if (hasSOX || (usJurisdictionSelected && financialSector)) {
    score += weights.SOX;
    factors.push(`SOX compliance required (+${weights.SOX})`);
    if (usJurisdictionSelected && financialSector && !hasSOX) {
      regulatoryWarnings.push('United States (Federal) and Financial sector are selected, but SOX is not checked. SOX risk has been inferred.');
    }
  }
  if ((hasGDPR || euJurisdictionSelected) && stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel === 'black-box') {
    score += weights.aiRegulations;
    factors.push(`AI Act compliance (+${weights.aiRegulations})`);
  }
  if (dataProtectionJurisdictions.length > 2) {
    score += weights.multiJurisdiction;
    factors.push(`Multi-jurisdiction (+${weights.multiJurisdiction})`);
  }
  return {
    score: Math.min(score, 10),
    factors,
    formula: `Base(1) + ${factors.map(f => f.match(/\+(\d+\.?\d*)/)?.[1]).join(' + ')} = ${Math.min(score, 10)}`,
    regulatoryWarnings
  };
};

const calculateEthicalRisk = (stepsData: any) => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const weights = {
    automatedDecisions: 2,
    biasRisk: 1.3,
    transparencyGap: 0.5,
    vulnerableGroups: 1,
    noHumanOversight: 1.5,
    discriminationPotential: 1.2
  };
  if (['Fully Automated', 'Autonomous'].includes(stepsData?.ethicalImpact?.decisionMaking?.automationLevel ?? '')) {
    score += weights.automatedDecisions;
    factors.push(`Automated decision-making (+${weights.automatedDecisions})`);
  }
  if ((stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting || '') === 'No Testing Planned' || 
      (stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting || '') === 'basic-statistical') {
    score += weights.biasRisk;
    factors.push(`Potential bias in outcomes (+${weights.biasRisk})`);
  }
  if ((stepsData?.ethicalImpact?.modelCharacteristics?.explainabilityLevel || '') === 'black-box') {
    score += weights.transparencyGap;
    factors.push(`Limited explainability (+${weights.transparencyGap})`);
  }
  if ((stepsData?.businessFeasibility?.userCategories || []).includes('Minors/Children')) {
    score += weights.vulnerableGroups;
    factors.push(`Affects vulnerable groups (+${weights.vulnerableGroups})`);
  }
  if ((stepsData?.ethicalImpact?.aiGovernance?.humanOversightLevel || '') === 'fully-autonomous') {
    score += weights.noHumanOversight;
    factors.push(`No human oversight (+${weights.noHumanOversight})`);
  }
  if ((stepsData?.businessFeasibility?.userCategories || []).includes('Minors/Children')) {
    if (!stepsData?.ethicalImpact?.modelCharacteristics?.biasTesting || stepsData.ethicalImpact.modelCharacteristics.biasTesting === 'No Testing Planned') {
      infoMessages.push("Minors/Children are users, but no bias testing is planned. Please review ethical risk.");
    }
  }
  if ((stepsData?.ethicalImpact?.decisionMaking?.automationLevel || '') === 'Fully Automated' && (!stepsData?.ethicalImpact?.aiGovernance?.humanOversightLevel || stepsData.ethicalImpact.aiGovernance.humanOversightLevel === 'fully-autonomous')) {
    infoMessages.push("Fully Automated decision-making selected with no human oversight. Please review ethical risk.");
  }
  return {
    score: Math.min(score, 10),
    factors,
    formula: `Base(1) + ${factors.map(f => f.match(/\+(\d+\.?\d*)/)?.[1]).join(' + ')} = ${Math.min(score, 10)}`,
    infoMessages
  };
};

const calculateOperationalRisk = (stepsData: any) => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const weights = {
    missionCritical: 3,
    highCritical: 2,
    complexityHigh: 1.9,
    complexityMedium: 1,
    severeDowntime: 1,
    catastrophicFailure: 1.5,
    limitedRedundancy: 0.5,
    continuousUpdates: 0.8
  };
  if ((stepsData?.businessFeasibility?.systemCriticality || '') === 'Mission Critical') {
    score += weights.missionCritical;
    factors.push(`Business critical system (+${weights.missionCritical})`);
  }
  const complexityIndicators = (stepsData?.technicalFeasibility?.integrationPoints?.length || 0) + (stepsData?.technicalFeasibility?.modelTypes?.length || 0);
  if (complexityIndicators > 5) {
    score += weights.complexityHigh;
    factors.push(`High complexity (+${weights.complexityHigh})`);
  } else if (complexityIndicators > 3) {
    score += weights.complexityMedium;
    factors.push(`Medium complexity (+${weights.complexityMedium})`);
  }
  if ((stepsData?.businessFeasibility?.failureImpact || '') === 'Catastrophic/Life Safety') {
    score += weights.severeDowntime;
    factors.push(`Downtime impact severe (+${weights.severeDowntime})`);
  }
  if ((stepsData?.businessFeasibility?.failureImpact || '') === 'Catastrophic/Life Safety') {
    score += weights.catastrophicFailure;
    factors.push(`Catastrophic failure risk (+${weights.catastrophicFailure})`);
  }
  if (stepsData?.technicalFeasibility?.deploymentModels?.includes('On-Premise')) {
    score += weights.limitedRedundancy;
    factors.push(`Limited redundancy (+${weights.limitedRedundancy})`);
  }
  if ((stepsData?.businessFeasibility?.systemCriticality || '') === 'Mission Critical') {
    if (!stepsData?.technicalFeasibility?.deploymentModels || !stepsData.technicalFeasibility.deploymentModels.includes('On-Premise')) {
      infoMessages.push("Mission Critical system selected, but no redundancy or failover specified. Please review operational risk mitigation.");
    }
  }
  if ((stepsData?.businessFeasibility?.failureImpact || '') === 'Catastrophic/Life Safety') {
    infoMessages.push("Catastrophic/Life Safety failure impact selected. Please ensure mitigation strategies are documented.");
  }
  return {
    score: Math.min(score, 10),
    factors,
    formula: `Base(1) + ${factors.map(f => f.match(/\+(\d+\.?\d*)/)?.[1]).join(' + ')} = ${Math.min(score, 10)}`,
    infoMessages
  };
};

const calculateReputationRisk = (stepsData: any) => {
  let score = 1;
  const factors = [];
  const weights = {
    publicFacing: 2,
    socialMedia: 1.5,
    trustCritical: 1,
    brandImpact: 0.5,
    minorsInvolved: 1.2,
    financialTrust: 1.3,
    healthcareTrust: 1.4
  };
  if ((stepsData?.businessFeasibility?.userCategories || []).includes('General Public')) {
    score += weights.publicFacing;
    factors.push(`Public-facing system (+${weights.publicFacing})`);
  }
  if (stepsData?.businessFeasibility?.userCategories?.includes('Customers') &&
      stepsData?.businessFeasibility?.systemCriticality !== 'Non-Critical') {
    score += weights.socialMedia;
    factors.push(`Social media amplification (+${weights.socialMedia})`);
  }
  if (typeof stepsData?.riskAssessment?.sectorSpecific === 'string' && stepsData.riskAssessment.sectorSpecific === 'SOX (Financial Reporting)') {
    score += weights.trustCritical;
    factors.push(`Trust-critical decisions (+${weights.trustCritical})`);
  }
  if ((stepsData?.businessFeasibility?.failureImpact || '') !== 'Minimal/No Impact') {
    score += weights.brandImpact;
    factors.push(`Brand impact potential (+${weights.brandImpact})`);
  }
  return {
    score: Math.min(score, 10),
    factors,
    formula: `Base(1) + ${factors.map(f => f.match(/\+(\d+\.?\d*)/)?.[1]).join(' + ')} = ${Math.min(score, 10)}`
  };
};

const RiskCalculation = (stepsData: any) => {
  const isGenAI = stepsData?.technicalFeasibility?.modelTypes && (
    stepsData.technicalFeasibility.modelTypes.includes("Generative AI") ||
    stepsData.technicalFeasibility.modelTypes.includes("Large Language Model (LLM)") ||
    stepsData.technicalFeasibility.modelTypes.includes("Multi-modal Models")
  );
  const weights = isGenAI ? {
    dataPrivacy: 0.20,
    security: 0.15,
    regulatory: 0.25,
    ethical: 0.10,
    operational: 0.10,
    reputational: 0.05,
    genAI: 0.15
  } : {
    dataPrivacy: 0.25,
    security: 0.20,
    regulatory: 0.30,
    ethical: 0.10,
    operational: 0.10,
    reputational: 0.05
  };
  const dataPrivacyRisk = calculateDataPrivacyRisk(stepsData);
  const securityRisk = calculateSecurityRisk(stepsData);
  const regulatoryRisk = calculateRegulatoryRisk(stepsData);
  const ethicalRisk = calculateEthicalRisk(stepsData);
  const operationalRisk = calculateOperationalRisk(stepsData);
  const reputationRisk = calculateReputationRisk(stepsData);
  const chartData = [
    {month: "Data Privacy", desktop: dataPrivacyRisk.score},
    {month: "Security", desktop: securityRisk.score},
    {month: "Regulatory", desktop: regulatoryRisk.score},
    {month: "Ethical", desktop: ethicalRisk.score},
    {month: "Operational", desktop: operationalRisk.score},
    {month: "Reputational", desktop: reputationRisk.score}
  ];
  const weightedScore = dataPrivacyRisk.score * weights.dataPrivacy + 
    securityRisk.score * weights.security + 
    regulatoryRisk.score * weights.regulatory + 
    ethicalRisk.score * weights.ethical + 
    operationalRisk.score * weights.operational + 
    reputationRisk.score * weights.reputational;
  let riskTier: string;
  if (weightedScore >= 8) {
    riskTier = 'critical';
  } else if (weightedScore >= 6) {
    riskTier = 'high';
  } else if (weightedScore >= 4) {
    riskTier = 'medium';
  } else {
    riskTier = 'low';
  }
  return {
    chartData,
    score: parseFloat(weightedScore.toFixed(1)),
    riskTier,
    formula: `(0.25×${dataPrivacyRisk.score} + 0.20×${securityRisk.score} + 0.30×${regulatoryRisk.score} + 0.10×${ethicalRisk.score} + 0.10×${operationalRisk.score} + 0.05×${reputationRisk.score})`,
    calculation: `(0.25×Privacy + 0.20×Security + 0.30×Regulatory + 0.10×Ethical + 0.10×Operational + 0.05×Reputational)`,
    regulatoryWarnings: regulatoryRisk.regulatoryWarnings,
    dataPrivacyInfo: dataPrivacyRisk.infoMessages,
    securityInfo: securityRisk.infoMessages,
    operationalInfo: operationalRisk.infoMessages,
    ethicalInfo: ethicalRisk.infoMessages,
    dataPrivacyFactors: dataPrivacyRisk.factors,
    securityFactors: securityRisk.factors,
    regulatoryFactors: regulatoryRisk.factors,
    ethicalFactors: ethicalRisk.factors,
    operationalFactors: operationalRisk.factors,
    reputationalFactors: reputationRisk.factors
  };
};

interface ReadOnlyApprovalsDashboardProps {
  useCaseData?: any;
  finopsData?: any;
  approvalsData?: any;
}

const ReadOnlyApprovalsDashboard: React.FC<ReadOnlyApprovalsDashboardProps> = ({ 
  useCaseData, 
  finopsData, 
  approvalsData 
}) => {
  const [chartData, setChartData] = useState<{ month: string; desktop: number }[]>([]);
  const [riskResult, setRiskResult] = useState<any>(null);

  useEffect(() => {
    if (useCaseData?.assessData?.stepsData) {
      // Use the unified risk calculation from the library to ensure consistency
      const result = calculateRiskScores(useCaseData.assessData.stepsData);
      setChartData(result.chartData);
      setRiskResult(result);
    }
  }, [useCaseData]);

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string') val = parseFloat(val);
    return val ? val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : "$0";
  };

  if (!useCaseData) {
    return (
      <div className="space-y-8 p-6">
        <div className="text-center text-muted-foreground">
          No use case data available for approvals dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Risk Radar Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 text-foreground">Risk Radar Chart</h2>
          <ChartRadarDots chartData={chartData} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col items-center justify-center p-6">
          <div className="text-2xl font-bold text-destructive">{formatCurrency(finopsData?.totalInvestment ?? 0)}</div>
          <div className="text-muted-foreground mt-1">Total Investment</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(finopsData?.cumValue ?? 0)}</div>
          <div className="text-muted-foreground mt-1">Total Value Generated</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <div className="text-2xl font-bold text-green-600">{typeof finopsData?.breakEvenMonth === 'number' ? `${finopsData.breakEvenMonth} months` : 'N/A'}</div>
          <div className="text-muted-foreground mt-1">Payback Period</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <div className="text-2xl font-bold text-blue-600">{typeof finopsData?.ROI === 'number' ? `${finopsData.ROI.toFixed(1)}%` : '0%'}</div>
          <div className="text-muted-foreground mt-1">Net ROI</div>
        </Card>
      </div>

      {/* Overall Risk Score */}
      {riskResult && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 text-foreground">Overall Risk Score</h2>
          <ApprovalsRiskSummary
            score={riskResult.score}
            riskTier={riskResult.riskTier as 'critical' | 'high' | 'medium' | 'low'}
            trend="increasing"
            criticalCount={riskResult.chartData.filter((d: any) => d.desktop >= 8).length}
            highCount={riskResult.chartData.filter((d: any) => d.desktop >= 6 && d.desktop < 8).length}
            mediumCount={riskResult.chartData.filter((d: any) => d.desktop >= 4 && d.desktop < 6).length}
          />
        </div>
      )}

      {/* Risk Action Summary */}
      {riskResult && (
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <InformationCircleIcon className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">Risk Action Summary</span>
          </div>
          <div className="space-y-3">
            {[...riskResult.chartData]
              .sort((a: any, b: any) => b.desktop - a.desktop)
              .slice(0, 3)
              .map((risk: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="font-semibold min-w-0 flex-shrink-0">{risk.month} Risk ({risk.desktop}/10):</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {risk.desktop >= 8 ? 'Critical - Immediate action required' :
                     risk.desktop >= 4 ? 'Monitor this area' :
                     'No immediate action required'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Approvals Section */}
      {approvalsData && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-2xl font-bold mb-6 text-[#9461fd]">Approvals</h2>
          
          {/* Helper function to check if a field has meaningful value */}
          {(() => {
            const hasValue = (value: any) => {
              return value && value.toString().trim() !== '' && value.toString().trim() !== 'null' && value.toString().trim() !== 'undefined';
            };

            const hasAnyApprovalData = hasValue(approvalsData.finalQualification) ||
              hasValue(approvalsData.governanceName) || hasValue(approvalsData.governanceStatus) || hasValue(approvalsData.governanceComment) ||
              hasValue(approvalsData.riskName) || hasValue(approvalsData.riskStatus) || hasValue(approvalsData.riskComment) ||
              hasValue(approvalsData.legalName) || hasValue(approvalsData.legalStatus) || hasValue(approvalsData.legalComment) ||
              hasValue(approvalsData.businessFunction) || hasValue(approvalsData.businessName) || hasValue(approvalsData.businessStatus) || hasValue(approvalsData.businessComment);

            if (!hasAnyApprovalData) {
              return (
                <div className="text-center text-muted-foreground py-8">
                  No approval data has been entered yet.
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Final Usecase Qualification */}
                {hasValue(approvalsData.finalQualification) && (
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Final Usecase Qualification</h3>
                    <div className="text-foreground bg-muted rounded px-3 py-2">
                      {approvalsData.finalQualification}
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Governance */}
                  {(hasValue(approvalsData.governanceName) || hasValue(approvalsData.governanceStatus) || hasValue(approvalsData.governanceComment)) && (
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Governance</h3>
                      <div className="space-y-3">
                        {hasValue(approvalsData.governanceName) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Approver Name</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.governanceName}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.governanceStatus) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.governanceStatus}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.governanceComment) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Comments</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.governanceComment}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Risk Management */}
                  {(hasValue(approvalsData.riskName) || hasValue(approvalsData.riskStatus) || hasValue(approvalsData.riskComment)) && (
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Risk Management</h3>
                      <div className="space-y-3">
                        {hasValue(approvalsData.riskName) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Approver Name</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.riskName}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.riskStatus) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.riskStatus}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.riskComment) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Comments</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.riskComment}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Legal */}
                  {(hasValue(approvalsData.legalName) || hasValue(approvalsData.legalStatus) || hasValue(approvalsData.legalComment)) && (
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Legal</h3>
                      <div className="space-y-3">
                        {hasValue(approvalsData.legalName) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Approver Name</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.legalName}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.legalStatus) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.legalStatus}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.legalComment) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Comments</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.legalComment}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Business Function */}
                  {(hasValue(approvalsData.businessFunction) || hasValue(approvalsData.businessName) || hasValue(approvalsData.businessStatus) || hasValue(approvalsData.businessComment)) && (
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Business Function</h3>
                      <div className="space-y-3">
                        {hasValue(approvalsData.businessFunction) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Function</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.businessFunction}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.businessName) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Approver Name</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.businessName}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.businessStatus) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.businessStatus}
                            </div>
                          </div>
                        )}
                        {hasValue(approvalsData.businessComment) && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Comments</label>
                            <div className="text-foreground bg-muted rounded px-3 py-2">
                              {approvalsData.businessComment}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ReadOnlyApprovalsDashboard;
