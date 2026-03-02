import { prismaClient } from '@/utils/db';
import type { StepsData } from '@/lib/risk-calculations';

type AnswerRecord = {
  id: string;
  value: any;
  question?: {
    id: string;
    text: string;
    type: string;
    stage: string;
  } | null;
  questionTemplate?: {
    id: string;
    text: string;
    type: string;
    stage: string;
  } | null;
};

function getStage(a: AnswerRecord): string {
  return a.question?.stage || a.questionTemplate?.stage || '';
}

function getText(a: AnswerRecord): string {
  return a.question?.text || a.questionTemplate?.text || '';
}

function getLabels(a: AnswerRecord): string[] {
  const v = a.value || {};
  if (Array.isArray(v.labels)) return v.labels as string[];
  if (typeof v.text === 'string') return [v.text];
  return [];
}

function parseNumeric(labelOrText: string): number | undefined {
  const m = labelOrText.match(/(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
}

function truthyFromLabels(labels: string[], ...keywords: string[]): boolean {
  const hay = labels.map(l => l.toLowerCase());
  return keywords.some(k => hay.some(h => h.includes(k.toLowerCase())));
}

export async function buildStepsDataFromAnswers(useCaseId: string): Promise<StepsData> {
  const answers = await prismaClient.answer.findMany({
    where: { useCaseId },
    include: {
      question: true,
      questionTemplate: true,
    },
  }) as unknown as AnswerRecord[];

  const steps: StepsData = {
    dataReadiness: {},
    riskAssessment: {
      dataProtection: {},
      operatingJurisdictions: {},
      modelRisks: {},
      agentRisks: {},
      technicalRisks: [],
      businessRisks: [],
    },
    technicalFeasibility: {},
    businessFeasibility: {},
    ethicalImpact: { biasFairness: {} as any },
    vendorAssessment: {},
  } as unknown as StepsData;

  const sensitiveTypeCatalog = new Set([
    'Health/Medical Records',
    'Financial Records',
    'Biometric Data',
    "Children's Data (under 16)",
  ]);

  for (const a of answers) {
    const stage = getStage(a);
    const qtext = getText(a);
    const labels = getLabels(a);

    // DATA READINESS
    if (stage.includes('DATA') || /data readiness/i.test(stage) || /data readiness/i.test(qtext)) {
      // Data types
      for (const lbl of labels) {
        if (sensitiveTypeCatalog.has(lbl)) {
          steps.dataReadiness = steps.dataReadiness || {};
          steps.dataReadiness.dataTypes = Array.from(new Set([...(steps.dataReadiness.dataTypes || []), lbl]));
        }
      }
      // Volume
      if (/volume|records/i.test(qtext) || labels.some(l => /records/i.test(l))) {
        const volume = labels.find(l => /records|\bMB\b|\bGB\b|\bTB\b|<|>/i.test(l));
        if (volume) steps.dataReadiness = { ...(steps.dataReadiness || {}), dataVolume: volume };
      }
      // Cross-border transfer
      if (/cross[- ]?border/i.test(qtext) || truthyFromLabels(labels, 'cross-border', 'cross border', 'outside')) {
        steps.dataReadiness = { ...(steps.dataReadiness || {}), crossBorderTransfer: true };
      }
      // Update frequency
      if (/update|frequency/i.test(qtext)) {
        const freq = labels.find(l => /real[- ]?time|batch|daily|hourly/i.test(l));
        if (freq) steps.dataReadiness = { ...(steps.dataReadiness || {}), dataUpdate: freq };
      }
      // Retention
      if (/retention/i.test(qtext) || labels.some(l => /year|month/i.test(l))) {
        const retention = labels.find(l => /year|month/i.test(l));
        if (retention) steps.dataReadiness = { ...(steps.dataReadiness || {}), dataRetention: retention };
      }
    }

    // TECHNICAL / SECURITY
    if (stage.includes('TECH') || /technical/i.test(stage) || /security|auth|encrypt|access/i.test(qtext)) {
      const tf = steps.technicalFeasibility = steps.technicalFeasibility || {} as any;
      if (/authentication/i.test(qtext)) {
        const val = labels.find(l => /(none|basic|oauth|saml|oidc)/i.test(l));
        if (val) tf.authentication = val;
      }
      if (/encryption/i.test(qtext)) {
        const val = labels.find(l => /(none|aes|rsa|tls|https)/i.test(l));
        if (val) tf.encryption = val;
        const standards = labels.filter(l => /(aes|rsa|tls|https|kms)/i.test(l));
        if (standards.length) tf.encryptionStandards = standards;
      }
      if (/access control|exposure|visibility/i.test(qtext)) {
        const val = labels.find(l => /(public|partner|internal)/i.test(l));
        if (val) tf.accessControl = /public/i.test(val) ? 'Public' : /partner/i.test(val) ? 'Partner' : 'Internal';
      }
      if (/incident response|response plan/i.test(qtext)) {
        const val = labels.find(l => /(none|basic|mature)/i.test(l));
        if (val) tf.incidentResponse = val;
      }
      if (/api security|security controls/i.test(qtext)) {
        const val = labels.find(l => /(waf|rate limit|apikey|oauth|mfa)/i.test(l));
        if (val) tf.apiSecurity = val;
      }
      if (/monitoring|observability|siem/i.test(qtext)) {
        const tools = labels.filter(l => /(siem|xdr|monitor|alert|audit)/i.test(l));
        if (tools.length) tf.monitoringTools = tools;
      }
      if (/auth method/i.test(qtext)) {
        const methods = labels.filter(l => /(oauth|saml|oidc|apikey)/i.test(l));
        if (methods.length) tf.authMethods = methods;
      }
    }

    // LEGAL & REGULATORY / RISK ASSESSMENT (MODEL/AGENT RISKS, JURISDICTIONS, COMPLIANCE)
    if (stage.includes('LEGAL') || stage.includes('REGULATORY') || /legal|regulatory/i.test(stage)) {
      const ra = steps.riskAssessment = steps.riskAssessment || ({} as any);
      const v = a.value || {};
      // Operating jurisdictions (flat or nested)
      if (/jurisdiction|region|country/i.test(qtext) || labels.some(l => /europe|asia|americas|africa|oceania|union/i.test(l))) {
        for (const lbl of labels) {
          const parts = lbl.split(':').map(s => s.trim());
          if (parts.length === 2) {
            const [region, country] = parts;
            ra.operatingJurisdictions[region] = ra.operatingJurisdictions[region] || {};
            (ra.operatingJurisdictions[region] as any)[country] = true;
          } else {
            ra.dataProtection = ra.dataProtection || {};
            ra.dataProtection.jurisdictions = Array.from(new Set([...(ra.dataProtection.jurisdictions || []), lbl]));
          }
        }
      }
      if (/compliance reporting/i.test(qtext)) {
        const val = labels.find(l => /(minimal|standard|enhanced)/i.test(l));
        if (val) ra.complianceReporting = /minimal/i.test(val) ? 'Minimal' : /enhanced/i.test(val) ? 'Enhanced' : 'Standard';
      }
      if (/risk tolerance/i.test(qtext)) {
        const val = labels.find(l => /(low|medium|high)/i.test(l));
        if (val) ra.riskTolerance = /high/i.test(val) ? 'High' : /medium/i.test(val) ? 'Medium' : 'Low';
      }
      // Model risks sliders or encoded labels
      const setModel = (key: keyof NonNullable<StepsData['riskAssessment']>['modelRisks'], val?: number) => {
        if (val === undefined) return;
        ra.modelRisks = ra.modelRisks || {};
        (ra.modelRisks as any)[key] = Math.max(1, Math.min(10, Math.round(val)));
      };
      const setAgent = (key: keyof NonNullable<StepsData['riskAssessment']>['agentRisks'], val?: number) => {
        if (val === undefined) return;
        ra.agentRisks = ra.agentRisks || {};
        (ra.agentRisks as any)[key] = Math.max(1, Math.min(10, Math.round(val)));
      };
      // Try to parse numeric from text answers too
      if (/data leakage/i.test(qtext)) setModel('dataLeakage', parseNumeric(labels[0] || ''));
      if (/model inversion/i.test(qtext)) setModel('modelInversion', parseNumeric(labels[0] || ''));
      if (/prompt injection/i.test(qtext)) setModel('promptInjection', parseNumeric(labels[0] || ''));
      if (/bias amplification/i.test(qtext)) setModel('biasAmplification', parseNumeric(labels[0] || ''));
      if (/hallucination/i.test(qtext)) setModel('hallucinationRisk', parseNumeric(labels[0] || ''));
      if (/goal misalignment/i.test(qtext)) setAgent('goalMisalignment', parseNumeric(labels[0] || ''));
      if (/cascading failure/i.test(qtext)) setAgent('cascadingFailures', parseNumeric(labels[0] || ''));
      if (/excessive autonomy/i.test(qtext)) setAgent('excessiveAutonomy', parseNumeric(labels[0] || ''));
      if (/unexpected behavior/i.test(qtext)) setAgent('unexpectedBehavior', parseNumeric(labels[0] || ''));
      // Risks list (prob/impact pairs not handled here)
      if (a.question?.type === 'RISK' && v?.labels && v?.optionIds) {
        // Already stored elsewhere for UI; optional advanced mapping could go here
      }
    }

    // RESPONSIBLE / ETHICAL
    if (stage.includes('RESPONSIBLE') || stage.includes('ETHIC') || /ethical|responsible/i.test(stage)) {
      const ei = steps.ethicalImpact = steps.ethicalImpact || ({} as any);
      if (/bias detection/i.test(qtext)) {
        const val = labels.find(l => /(none|basic|automated|comprehensive)/i.test(l));
        if (val) ei.biasDetection = /none/i.test(val) ? 'None' : val;
      }
      if (/human oversight/i.test(qtext)) {
        const val = labels.find(l => /(none|limited|present|strong)/i.test(l));
        if (val) ei.humanOversight = /none/i.test(val) ? 'None' : val;
      }
      if (/transparency/i.test(qtext)) {
        const val = labels.find(l => /(low|medium|high)/i.test(l));
        if (val) ei.transparencyLevel = /low/i.test(val) ? 'Low' : /high/i.test(val) ? 'High' : 'Medium';
      }
      if (/appeal process/i.test(qtext)) {
        const val = labels.find(l => /(none|available|formal)/i.test(l));
        if (val) ei.appealProcess = /none/i.test(val) ? 'None' : val;
      }
      if (/bias type|fairness/i.test(qtext)) {
        ei.biasFairness = ei.biasFairness || {};
        for (const lbl of labels) {
          if (/temporal/i.test(lbl)) ei.biasFairness.temporalBias = true;
          if (/selection/i.test(lbl)) ei.biasFairness.selectionBias = true;
          if (/geographic/i.test(lbl)) ei.biasFairness.geographicBias = true;
          if (/historical/i.test(lbl)) ei.biasFairness.historicalBias = true;
          if (/demographic/i.test(lbl)) ei.biasFairness.demographicGaps = true;
        }
      }
    }

    // BUSINESS
    if (stage.includes('BUSINESS') || /business/i.test(stage)) {
      const bf = steps.businessFeasibility = steps.businessFeasibility || ({} as any);
      if (/business criticality/i.test(qtext)) {
        const val = labels.find(l => /(low|medium|high|critical)/i.test(l));
        if (val) bf.businessCriticality = val;
      }
      if (/sla|service level/i.test(qtext)) {
        const val = labels.find(l => /(none|standard|premium)/i.test(l));
        if (val) bf.sla = val;
      }
      if (/disaster recovery/i.test(qtext)) {
        const val = labels.find(l => /(none|basic|advanced)/i.test(l));
        if (val) bf.disasterRecovery = val;
      }
      if (/change management/i.test(qtext)) {
        const val = labels.find(l => /(ad-hoc|defined|managed)/i.test(l));
        if (val) bf.changeManagement = val;
      }
      if (/system criticality/i.test(qtext)) {
        const val = labels.find(l => /(low|medium|high|critical)/i.test(l));
        if (val) bf.systemCriticality = val;
      }
      if (/failure impact/i.test(qtext)) {
        const val = labels.find(l => /(low|medium|high|severe)/i.test(l));
        if (val) bf.failureImpact = val;
      }
    }

    // VENDOR ASSESSMENT
    if (/vendor|third[- ]?party/i.test(qtext)) {
      const count = labels.map(parseNumeric).find(n => typeof n === 'number');
      if (typeof count === 'number') {
        (steps as any).vendorAssessment = { ...(steps as any).vendorAssessment, vendorCount: count };
      }
    }
  }

  return steps;
}

export async function buildStepsDataForUseCases(useCaseIds: string[]): Promise<Record<string, StepsData>> {
  const result: Record<string, StepsData> = {};
  for (const id of useCaseIds) {
    result[id] = await buildStepsDataFromAnswers(id);
  }
  return result;
}


