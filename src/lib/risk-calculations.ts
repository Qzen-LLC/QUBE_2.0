// Risk calculation utilities shared across the application
import { riskRecommendations } from '@/components/riskRecommendations';

export interface StepsData {
  dataReadiness?: {
    dataTypes?: string[];
    dataVolume?: string;
    crossBorderTransfer?: boolean;
    dataUpdate?: string;
    dataRetention?: string;
  };
  riskAssessment?: {
    dataProtection?: {
      jurisdictions?: string[];
    };
    operatingJurisdictions?: any;
    complianceReporting?: string;
    riskTolerance?: string;
    // New fields from actual assessment data
    agentRisks?: {
      goalMisalignment?: number;
      cascadingFailures?: number;
      excessiveAutonomy?: number;
      unexpectedBehavior?: number;
    };
    modelRisks?: {
      dataLeakage?: number;
      modelInversion?: number;
      promptInjection?: number;
      biasAmplification?: number;
      hallucinationRisk?: number;
    };
    technicalRisks?: Array<{ risk: string; impact: string; probability: string }>;
    businessRisks?: Array<{ risk: string; impact: string; probability: string }>;
  };
  technicalFeasibility?: {
    authentication?: string;
    encryption?: string;
    accessControl?: string;
    apiSecurity?: string;
    incidentResponse?: string;
    authMethods?: string[];
    encryptionStandards?: string[];
    monitoringTools?: string[];
  };
  businessFeasibility?: {
    businessCriticality?: string;
    sla?: string;
    disasterRecovery?: string;
    changeManagement?: string;
    systemCriticality?: string;
    failureImpact?: string;
  };
  ethicalImpact?: {
    biasDetection?: string;
    humanOversight?: string;
    transparencyLevel?: string;
    appealProcess?: string;
    biasFairness?: {
      temporalBias?: boolean;
      selectionBias?: boolean;
      geographicBias?: boolean;
      historicalBias?: boolean;
      demographicGaps?: boolean;
      confirmationBias?: boolean;
    };
    aiGovernance?: {
      humanOversightLevel?: string;
      performanceMonitoring?: string[];
    };
    modelCharacteristics?: {
      biasTesting?: string;
      explainabilityLevel?: string;
    };
  };
  vendorAssessment?: {
    thirdPartyDependencies?: string;
    vendorCount?: number;
    vendorCompliance?: string;
  };
}

export interface RiskScore {
  score: number;
  factors: string[];
  infoMessages: string[];
  regulatoryWarnings?: string[];
  recommendations?: string[]; // Actionable recommendations from riskRecommendations.ts
}

export interface RiskCalculationResult {
  chartData: Array<{ month: string; desktop: number }>;
  score: number;
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  formula: string;
  calculation: string;
  regulatoryWarnings: string[];
  dataPrivacyInfo: string[];
  securityInfo: string[];
  operationalInfo: string[];
  ethicalInfo: string[];
  dataPrivacyFactors: string[];
  securityFactors: string[];
  regulatoryFactors: string[];
  ethicalFactors: string[];
  operationalFactors: string[];
  reputationalFactors: string[];
  // Recommendations from riskRecommendations.ts
  dataPrivacyRecommendations: string[];
  securityRecommendations: string[];
  regulatoryRecommendations: string[];
  ethicalRecommendations: string[];
  operationalRecommendations: string[];
  reputationalRecommendations: string[];
}

const calculateDataPrivacyRisk = (stepsData: StepsData): RiskScore => {
  let score = 1; // Base score
  const factors = [];
  const infoMessages: string[] = [];
  const recommendations: string[] = [];
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
  const hasSensitiveData = Array.isArray(stepsData?.dataReadiness?.dataTypes) &&
    stepsData.dataReadiness.dataTypes.some(type => sensitiveTypes.includes(type || ''));

  if (hasSensitiveData) {
    score += weights.sensitiveData;
    factors.push(`Processing sensitive PII (+${weights.sensitiveData})`);

    // Add recommendation for sensitive PII
    const rec = riskRecommendations.technical.find(r => r.riskFactor === 'Sensitive PII');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
  }

  if (stepsData?.dataReadiness?.dataTypes?.includes("Children's Data (under 16)")) {
    infoMessages.push("Children's Data (under 16) detected. Data privacy risk has been flagged as sensitive.");

    // Add COPPA recommendation
    const coppaRec = riskRecommendations.regulatory.find(r => r.riskFactor === "Children's Data (COPPA)");
    if (coppaRec) recommendations.push(`${coppaRec.riskFactor}: ${coppaRec.recommendation}`);

    const childrenRec = riskRecommendations.sectorSpecific.find(r => r.riskFactor === "Children's Data");
    if (childrenRec) recommendations.push(`${childrenRec.riskFactor}: ${childrenRec.recommendation}`);
  }

  if (stepsData?.dataReadiness?.dataTypes?.includes("Biometric Data")) {
    infoMessages.push("Biometric Data detected. Data privacy risk has been flagged as sensitive.");
  }

  if (stepsData?.dataReadiness?.dataTypes?.includes("Health/Medical Records")) {
    const healthRec = riskRecommendations.sectorSpecific.find(r => r.riskFactor === "Healthcare Data");
    if (healthRec) recommendations.push(`${healthRec.riskFactor}: ${healthRec.recommendation}`);

    const phiRec = riskRecommendations.technical.find(r => r.riskFactor === "PHI");
    if (phiRec) recommendations.push(`${phiRec.riskFactor}: ${phiRec.recommendation}`);
  }

  if (stepsData?.dataReadiness?.dataTypes?.includes("Financial Records")) {
    const finRec = riskRecommendations.sectorSpecific.find(r => r.riskFactor === "Financial Data");
    if (finRec) recommendations.push(`${finRec.riskFactor}: ${finRec.recommendation}`);
  }

  if (stepsData?.dataReadiness?.crossBorderTransfer &&
      (!stepsData?.riskAssessment?.dataProtection?.jurisdictions ||
       stepsData?.riskAssessment?.dataProtection?.jurisdictions.length === 0)) {
    infoMessages.push("Cross-border data transfer is required, but no jurisdictions are specified. Please review data protection requirements.");
  }

  if (stepsData?.dataReadiness?.dataVolume === '>1M records') {
    score += weights.largeVolume;
    factors.push(`Large data volume (+${weights.largeVolume})`);
  }

  if (stepsData?.dataReadiness?.crossBorderTransfer) {
    score += weights.crossBorder;
    factors.push(`Cross-border transfer (+${weights.crossBorder})`);
  }

  if (stepsData?.dataReadiness?.dataUpdate === 'Real-time') {
    score += weights.realTime;
    factors.push(`Real-time processing (+${weights.realTime})`);
  }

  if (stepsData?.dataReadiness?.dataRetention === '>5 years') {
    score += weights.retention;
    factors.push(`Long retention period (+${weights.retention})`);
  }

  const jurisdictionCount = stepsData?.riskAssessment?.operatingJurisdictions ?
    Object.keys(stepsData.riskAssessment.operatingJurisdictions).length : 0;

  if (jurisdictionCount > 3) {
    score += weights.multiJurisdiction;
    factors.push(`Multiple jurisdictions (+${weights.multiJurisdiction})`);
  }

  return { score: Math.min(10, Math.round(score)), factors, infoMessages, recommendations };
};

const calculateSecurityRisk = (stepsData: StepsData): RiskScore => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const recommendations: string[] = [];
  const weights = {
    weakAuth: 2,
    noEncryption: 3,
    publicAccess: 2,
    noIncidentResponse: 1.5,
    vendorRisk: 1,
    modelRisk: 0.3, // Per model risk point (scale 1-10)
    agentRisk: 0.3  // Per agent risk point (scale 1-10)
  };

  // Check model risks from riskAssessment
  if (stepsData?.riskAssessment?.modelRisks) {
    const modelRisks = stepsData.riskAssessment.modelRisks;

    if (modelRisks.dataLeakage && modelRisks.dataLeakage >= 5) {
      const riskScore = (modelRisks.dataLeakage - 1) * weights.modelRisk;
      score += riskScore;
      factors.push(`Data leakage risk (${modelRisks.dataLeakage}/10) (+${riskScore.toFixed(1)})`);
      const rec = riskRecommendations.technical.find(r => r.riskFactor === 'Data Breach');
      if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
    }

    if (modelRisks.promptInjection && modelRisks.promptInjection >= 5) {
      const riskScore = (modelRisks.promptInjection - 1) * weights.modelRisk;
      score += riskScore;
      factors.push(`Prompt injection risk (${modelRisks.promptInjection}/10) (+${riskScore.toFixed(1)})`);
      infoMessages.push("Prompt injection vulnerabilities detected. Implement input validation and sanitization.");
    }

    if (modelRisks.modelInversion && modelRisks.modelInversion >= 5) {
      const riskScore = (modelRisks.modelInversion - 1) * weights.modelRisk;
      score += riskScore;
      factors.push(`Model inversion risk (${modelRisks.modelInversion}/10) (+${riskScore.toFixed(1)})`);
    }
  }

  // Check agent risks from riskAssessment
  if (stepsData?.riskAssessment?.agentRisks) {
    const agentRisks = stepsData.riskAssessment.agentRisks;

    if (agentRisks.excessiveAutonomy && agentRisks.excessiveAutonomy >= 5) {
      const riskScore = (agentRisks.excessiveAutonomy - 1) * weights.agentRisk;
      score += riskScore;
      factors.push(`Excessive agent autonomy (${agentRisks.excessiveAutonomy}/10) (+${riskScore.toFixed(1)})`);
      infoMessages.push("High agent autonomy requires robust oversight and safety mechanisms.");
    }

    if (agentRisks.unexpectedBehavior && agentRisks.unexpectedBehavior >= 5) {
      const riskScore = (agentRisks.unexpectedBehavior - 1) * weights.agentRisk;
      score += riskScore;
      factors.push(`Unexpected behavior risk (${agentRisks.unexpectedBehavior}/10) (+${riskScore.toFixed(1)})`);
    }
  }

  if (stepsData?.technicalFeasibility?.authentication === 'Basic' ||
      stepsData?.technicalFeasibility?.authentication === 'None') {
    score += weights.weakAuth;
    factors.push(`Weak authentication (+${weights.weakAuth})`);

    // Add authentication recommendation
    const rec = riskRecommendations.technical.find(r => r.riskFactor === 'Authentication Weakness');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
  }

  if (stepsData?.technicalFeasibility?.encryption === 'None') {
    score += weights.noEncryption;
    factors.push(`No encryption (+${weights.noEncryption})`);
    infoMessages.push("No encryption detected. This significantly increases security risk.");

    // Add encryption recommendation
    const rec = riskRecommendations.technical.find(r => r.riskFactor === 'Lack of Encryption');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
  }

  if (stepsData?.technicalFeasibility?.accessControl === 'Public') {
    score += weights.publicAccess;
    factors.push(`Public access (+${weights.publicAccess})`);

    // Add API security recommendation
    const rec = riskRecommendations.technical.find(r => r.riskFactor === 'API Security');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);

    // Add authorization recommendation
    const authzRec = riskRecommendations.technical.find(r => r.riskFactor === 'Authorization Issues');
    if (authzRec) recommendations.push(`${authzRec.riskFactor}: ${authzRec.recommendation}`);
  }

  if (stepsData?.technicalFeasibility?.incidentResponse === 'None') {
    score += weights.noIncidentResponse;
    factors.push(`No incident response (+${weights.noIncidentResponse})`);

    // Add data breach recommendation
    const rec = riskRecommendations.technical.find(r => r.riskFactor === 'Data Breach');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
  }

  if (stepsData?.vendorAssessment?.vendorCount && stepsData.vendorAssessment.vendorCount > 5) {
    score += weights.vendorRisk;
    factors.push(`Multiple vendors (+${weights.vendorRisk})`);

    // Add supply chain recommendation
    const rec = riskRecommendations.technical.find(r => r.riskFactor === 'Supply Chain Risk');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);

    const depRec = riskRecommendations.technical.find(r => r.riskFactor === 'Outdated Dependencies');
    if (depRec) recommendations.push(`${depRec.riskFactor}: ${depRec.recommendation}`);
  }

  return { score: Math.min(10, Math.round(score)), factors, infoMessages, recommendations };
};

const calculateRegulatoryRisk = (stepsData: StepsData): RiskScore => {
  let score = 1;
  const factors = [];
  const regulatoryWarnings: string[] = [];
  const recommendations: string[] = [];
  const weights = {
    multiJurisdiction: 2,
    lowCompliance: 3,
    highRiskTolerance: 1.5,
    gdpr: 2,
    hipaa: 2.5,
    finra: 2
  };

  const jurisdictionCount = stepsData?.riskAssessment?.operatingJurisdictions ?
    Object.values(stepsData.riskAssessment.operatingJurisdictions)
      .flat()
      .filter(Boolean).length : 0;

  if (jurisdictionCount > 5) {
    score += weights.multiJurisdiction;
    factors.push(`Complex multi-jurisdiction (+${weights.multiJurisdiction})`);
  }

  if (stepsData?.riskAssessment?.complianceReporting === 'Minimal') {
    score += weights.lowCompliance;
    factors.push(`Minimal compliance reporting (+${weights.lowCompliance})`);
  }

  if (stepsData?.riskAssessment?.riskTolerance === 'High') {
    score += weights.highRiskTolerance;
    factors.push(`High risk tolerance (+${weights.highRiskTolerance})`);
  }

  // Check for specific regulations
  const hasEU = stepsData?.riskAssessment?.operatingJurisdictions?.Europe?.['European Union'];
  const hasHealthData = stepsData?.dataReadiness?.dataTypes?.includes('Health/Medical Records');
  const hasFinancialData = stepsData?.dataReadiness?.dataTypes?.includes('Financial Records');

  if (hasEU) {
    score += weights.gdpr;
    factors.push(`GDPR compliance required (+${weights.gdpr})`);
    regulatoryWarnings.push("EU operations require GDPR compliance");

    // Add GDPR recommendation
    const rec = riskRecommendations.regulatory.find(r => r.riskFactor === 'GDPR');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
  }

  if (hasHealthData) {
    score += weights.hipaa;
    factors.push(`HIPAA compliance required (+${weights.hipaa})`);
    regulatoryWarnings.push("Health data requires HIPAA compliance");

    // Add HIPAA recommendation
    const rec = riskRecommendations.regulatory.find(r => r.riskFactor === 'HIPAA');
    if (rec) recommendations.push(`${rec.riskFactor}: ${rec.recommendation}`);
  }

  if (hasFinancialData) {
    score += weights.finra;
    factors.push(`Financial regulations apply (+${weights.finra})`);
    regulatoryWarnings.push("Financial data subject to additional regulations");

    // Add PCI-DSS and SOX recommendations
    const pciRec = riskRecommendations.regulatory.find(r => r.riskFactor === 'PCI-DSS');
    if (pciRec) recommendations.push(`${pciRec.riskFactor}: ${pciRec.recommendation}`);

    const soxRec = riskRecommendations.regulatory.find(r => r.riskFactor === 'SOX');
    if (soxRec) recommendations.push(`${soxRec.riskFactor}: ${soxRec.recommendation}`);
  }

  return {
    score: Math.min(10, Math.round(score)),
    factors,
    infoMessages: [],
    regulatoryWarnings,
    recommendations
  };
};

const calculateEthicalRisk = (stepsData: StepsData): RiskScore => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const recommendations: string[] = [];
  const weights = {
    noBiasDetection: 2,
    noHumanOversight: 2.5,
    lowTransparency: 1.5,
    noAppealProcess: 1,
    biasType: 0.5 // Per bias type detected
  };

  // Check for bias types
  if (stepsData?.ethicalImpact?.biasFairness) {
    const biasTypes = stepsData.ethicalImpact.biasFairness;
    const detectedBiases = [];

    if (biasTypes.temporalBias) detectedBiases.push('Temporal bias');
    if (biasTypes.selectionBias) detectedBiases.push('Selection bias');
    if (biasTypes.geographicBias) detectedBiases.push('Geographic bias');
    if (biasTypes.historicalBias) detectedBiases.push('Historical bias');
    if (biasTypes.demographicGaps) detectedBiases.push('Demographic gaps');
    if (biasTypes.confirmationBias) detectedBiases.push('Confirmation bias');

    if (detectedBiases.length > 0) {
      const biasScore = detectedBiases.length * weights.biasType;
      score += biasScore;
      factors.push(`${detectedBiases.length} bias types detected (+${biasScore.toFixed(1)})`);
      infoMessages.push(`Bias concerns: ${detectedBiases.join(', ')}`);

      // Add bias and fairness recommendations
      const biasRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Model Bias');
      if (biasRec) recommendations.push(`${biasRec.riskFactor}: ${biasRec.recommendation}`);

      const fairnessRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Fairness');
      if (fairnessRec) recommendations.push(`${fairnessRec.riskFactor}: ${fairnessRec.recommendation}`);
    }
  }

  if (stepsData?.ethicalImpact?.biasDetection === 'None') {
    score += weights.noBiasDetection;
    factors.push(`No bias detection (+${weights.noBiasDetection})`);
    infoMessages.push("No bias detection mechanism in place. Consider implementing fairness measures.");

    // Add bias and fairness recommendations
    const biasRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Model Bias');
    if (biasRec) recommendations.push(`${biasRec.riskFactor}: ${biasRec.recommendation}`);

    const fairnessRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Fairness');
    if (fairnessRec) recommendations.push(`${fairnessRec.riskFactor}: ${fairnessRec.recommendation}`);
  }

  if (stepsData?.ethicalImpact?.humanOversight === 'None') {
    score += weights.noHumanOversight;
    factors.push(`No human oversight (+${weights.noHumanOversight})`);
  }

  if (stepsData?.ethicalImpact?.transparencyLevel === 'Low') {
    score += weights.lowTransparency;
    factors.push(`Low transparency (+${weights.lowTransparency})`);

    // Add explainability and transparency recommendations
    const explainRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Lack of Explainability');
    if (explainRec) recommendations.push(`${explainRec.riskFactor}: ${explainRec.recommendation}`);

    const transRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Transparency');
    if (transRec) recommendations.push(`${transRec.riskFactor}: ${transRec.recommendation}`);
  }

  if (stepsData?.ethicalImpact?.appealProcess === 'None') {
    score += weights.noAppealProcess;
    factors.push(`No appeal process (+${weights.noAppealProcess})`);

    // Add informed consent recommendation
    const consentRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Informed Consent');
    if (consentRec) recommendations.push(`${consentRec.riskFactor}: ${consentRec.recommendation}`);
  }

  return { score: Math.min(10, Math.round(score)), factors, infoMessages, recommendations };
};

const calculateOperationalRisk = (stepsData: StepsData): RiskScore => {
  let score = 1;
  const factors = [];
  const infoMessages: string[] = [];
  const recommendations: string[] = [];
  const weights = {
    missionCritical: 3,
    highSLA: 2,
    noDisasterRecovery: 2.5,
    poorChangeManagement: 1.5,
    agentRisk: 0.4 // Per agent risk point (increased to ensure scores >= 5 trigger medium risk)
  };

  // Check for cascading failures and goal misalignment from agent risks
  if (stepsData?.riskAssessment?.agentRisks) {
    const agentRisks = stepsData.riskAssessment.agentRisks;

    if (agentRisks.cascadingFailures && agentRisks.cascadingFailures >= 5) {
      const riskScore = (agentRisks.cascadingFailures - 1) * weights.agentRisk;
      score += riskScore;
      factors.push(`Cascading failure risk (${agentRisks.cascadingFailures}/10) (+${riskScore.toFixed(1)})`);
      infoMessages.push("Agent cascading failure risk detected. Implement circuit breakers and fallback mechanisms.");
    }

    if (agentRisks.goalMisalignment && agentRisks.goalMisalignment >= 5) {
      const riskScore = (agentRisks.goalMisalignment - 1) * weights.agentRisk;
      score += riskScore;
      factors.push(`Goal misalignment risk (${agentRisks.goalMisalignment}/10) (+${riskScore.toFixed(1)})`);
      infoMessages.push("Agent goal misalignment detected. Ensure proper alignment with business objectives.");
    }
  }

  if (stepsData?.businessFeasibility?.businessCriticality === 'Mission Critical') {
    score += weights.missionCritical;
    factors.push(`Mission critical system (+${weights.missionCritical})`);
    infoMessages.push("Mission critical system identified. Ensure robust operational controls.");

    // Add single point of failure recommendation
    const spofRec = riskRecommendations.operational.find(r => r.riskFactor === 'Single Point of Failure');
    if (spofRec) recommendations.push(`${spofRec.riskFactor}: ${spofRec.recommendation}`);

    // Add monitoring recommendation
    const monRec = riskRecommendations.operational.find(r => r.riskFactor === 'Insufficient Monitoring');
    if (monRec) recommendations.push(`${monRec.riskFactor}: ${monRec.recommendation}`);
  }

  if (stepsData?.businessFeasibility?.sla === '99.99%') {
    score += weights.highSLA;
    factors.push(`High availability requirement (+${weights.highSLA})`);

    // Add backup recommendation
    const backupRec = riskRecommendations.operational.find(r => r.riskFactor === 'Lack of Backups');
    if (backupRec) recommendations.push(`${backupRec.riskFactor}: ${backupRec.recommendation}`);
  }

  if (stepsData?.businessFeasibility?.disasterRecovery === 'None') {
    score += weights.noDisasterRecovery;
    factors.push(`No disaster recovery (+${weights.noDisasterRecovery})`);

    // Add disaster recovery recommendation
    const drRec = riskRecommendations.operational.find(r => r.riskFactor === 'Disaster Recovery Gaps');
    if (drRec) recommendations.push(`${drRec.riskFactor}: ${drRec.recommendation}`);

    // Add incident response recommendation
    const irRec = riskRecommendations.operational.find(r => r.riskFactor === 'No Incident Response Plan');
    if (irRec) recommendations.push(`${irRec.riskFactor}: ${irRec.recommendation}`);
  }

  if (stepsData?.businessFeasibility?.changeManagement === 'Ad-hoc') {
    score += weights.poorChangeManagement;
    factors.push(`Ad-hoc change management (+${weights.poorChangeManagement})`);

    // Add training recommendation
    const trainRec = riskRecommendations.operational.find(r => r.riskFactor === 'Lack of Training');
    if (trainRec) recommendations.push(`${trainRec.riskFactor}: ${trainRec.recommendation}`);
  }

  return { score: Math.min(10, Math.round(score)), factors, infoMessages, recommendations };
};

const calculateReputationRisk = (stepsData: StepsData): RiskScore => {
  let score = 1;
  const factors = [];
  const recommendations: string[] = [];
  const weights = {
    publicFacing: 1.5,
    sensitiveData: 2,
    lowTransparency: 1,
    multipleVendors: 0.5
  };

  if (stepsData?.technicalFeasibility?.accessControl === 'Public') {
    score += weights.publicFacing;
    factors.push(`Public-facing system (+${weights.publicFacing})`);

    // Add API security recommendation for public systems
    const apiRec = riskRecommendations.technical.find(r => r.riskFactor === 'API Security');
    if (apiRec) recommendations.push(`${apiRec.riskFactor}: ${apiRec.recommendation}`);
  }

  const sensitiveTypes = ['Health/Medical Records', 'Financial Records', 'Biometric Data', "Children's Data (under 16)"];
  const hasSensitiveData = Array.isArray(stepsData?.dataReadiness?.dataTypes) &&
    stepsData.dataReadiness.dataTypes.some(type => sensitiveTypes.includes(type || ''));

  if (hasSensitiveData) {
    score += weights.sensitiveData;
    factors.push(`Sensitive data exposure risk (+${weights.sensitiveData})`);

    // Add sensitive PII recommendation
    const piiRec = riskRecommendations.technical.find(r => r.riskFactor === 'Sensitive PII');
    if (piiRec) recommendations.push(`${piiRec.riskFactor}: ${piiRec.recommendation}`);
  }

  if (stepsData?.ethicalImpact?.transparencyLevel === 'Low') {
    score += weights.lowTransparency;
    factors.push(`Low transparency (+${weights.lowTransparency})`);

    // Add transparency recommendation
    const transRec = riskRecommendations.ethical.find(r => r.riskFactor === 'Transparency');
    if (transRec) recommendations.push(`${transRec.riskFactor}: ${transRec.recommendation}`);
  }

  if (stepsData?.vendorAssessment?.vendorCount && stepsData.vendorAssessment.vendorCount > 3) {
    score += weights.multipleVendors;
    factors.push(`Third-party dependency (+${weights.multipleVendors})`);

    // Add supply chain recommendation
    const supplyRec = riskRecommendations.technical.find(r => r.riskFactor === 'Supply Chain Risk');
    if (supplyRec) recommendations.push(`${supplyRec.riskFactor}: ${supplyRec.recommendation}`);
  }

  return { score: Math.min(10, Math.round(score)), factors, infoMessages: [], recommendations };
};

export const calculateRiskScores = (stepsData: StepsData): RiskCalculationResult => {
  // Check if Gen AI use case
  const modelTypes = stepsData?.technicalFeasibility?.modelTypes || [];
  const isGenAI = Array.isArray(modelTypes) && (
    modelTypes.some((type: string) => 
      typeof type === 'string' && (
        type.includes("Generative AI") ||
        type.includes("Large Language Model") ||
        type.includes("LLM") ||
        type.includes("Multi-modal")
      )
    )
  );

  // Regulatory and data-focused weights (adjusted for Gen AI if applicable)
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
    { month: "Data Privacy", desktop: dataPrivacyRisk.score },
    { month: "Security", desktop: securityRisk.score },
    { month: "Regulatory", desktop: regulatoryRisk.score },
    { month: "Ethical", desktop: ethicalRisk.score },
    { month: "Operational", desktop: operationalRisk.score },
    { month: "Reputational", desktop: reputationRisk.score }
  ];
  
  // Calculate weighted average (GenAI uses adjusted weights but no separate GenAI score yet)
  const weightedScore = 
    dataPrivacyRisk.score * weights.dataPrivacy + 
    securityRisk.score * weights.security + 
    regulatoryRisk.score * weights.regulatory + 
    ethicalRisk.score * weights.ethical + 
    operationalRisk.score * weights.operational + 
    reputationRisk.score * weights.reputational;

  // Determine risk tier
  let riskTier: 'low' | 'medium' | 'high' | 'critical';
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
    formula: isGenAI ? 
      `(0.20×${dataPrivacyRisk.score} + 0.15×${securityRisk.score} + 0.25×${regulatoryRisk.score} + 0.10×${ethicalRisk.score} + 0.10×${operationalRisk.score} + 0.05×${reputationRisk.score})` :
      `(0.25×${dataPrivacyRisk.score} + 0.20×${securityRisk.score} + 0.30×${regulatoryRisk.score} + 0.10×${ethicalRisk.score} + 0.10×${operationalRisk.score} + 0.05×${reputationRisk.score})`,
    calculation: isGenAI ? 
      `(0.20×Privacy + 0.15×Security + 0.25×Regulatory + 0.10×Ethical + 0.10×Operational + 0.05×Reputational)` :
      `(0.25×Privacy + 0.20×Security + 0.30×Regulatory + 0.10×Ethical + 0.10×Operational + 0.05×Reputational)`,
    regulatoryWarnings: regulatoryRisk.regulatoryWarnings || [],
    dataPrivacyInfo: dataPrivacyRisk.infoMessages,
    securityInfo: securityRisk.infoMessages,
    operationalInfo: operationalRisk.infoMessages,
    ethicalInfo: ethicalRisk.infoMessages,
    dataPrivacyFactors: dataPrivacyRisk.factors,
    securityFactors: securityRisk.factors,
    regulatoryFactors: regulatoryRisk.factors,
    ethicalFactors: ethicalRisk.factors,
    operationalFactors: operationalRisk.factors,
    reputationalFactors: reputationRisk.factors,
    // Include recommendations from each risk calculation
    dataPrivacyRecommendations: dataPrivacyRisk.recommendations || [],
    securityRecommendations: securityRisk.recommendations || [],
    regulatoryRecommendations: regulatoryRisk.recommendations || [],
    ethicalRecommendations: ethicalRisk.recommendations || [],
    operationalRecommendations: operationalRisk.recommendations || [],
    reputationalRecommendations: reputationRisk.recommendations || []
  };
};

// Helper function to convert risk score to risk level
export const getRiskLevel = (score: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  if (score >= 8) return 'Critical';
  if (score >= 6) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};

// Helper function to get risk category scores from steps data
export const getRiskCategoryScores = (stepsData: StepsData) => {
  const result = calculateRiskScores(stepsData);
  return {
    technical: result.chartData.find(d => d.month === "Security")?.desktop || 0,
    business: result.chartData.find(d => d.month === "Operational")?.desktop || 0,
    data: result.chartData.find(d => d.month === "Data Privacy")?.desktop || 0,
    ethical: result.chartData.find(d => d.month === "Ethical")?.desktop || 0,
    operational: result.chartData.find(d => d.month === "Operational")?.desktop || 0,
    regulatory: result.chartData.find(d => d.month === "Regulatory")?.desktop || 0,
  };
};