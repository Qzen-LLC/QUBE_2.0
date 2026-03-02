// Build StepsData from formatted QnA (shape from /api/get-assess-questions or /api/get-assess-question-templates)
export interface QnAItem {
  id: string;
  text: string;
  type: string;
  stage: string;
  options: Array<{ id: string; text: string; questionId: string }>;
  answers: Array<{ id: string; value: string; questionId: string; optionId?: string }>;
}

export interface StepsData {
  dataReadiness?: any;
  legalRegulatory?: any;
  technical?: any;
  business?: any;
  responsibleEthical?: any;
  finops?: any;
  requirements?: any;
  vendorAssessment?: any;
}

const norm = (s: any) => String(s || '').trim();

export function buildStepsDataFromQnA(items: QnAItem[]): StepsData {
  const steps: StepsData = {
    dataReadiness: {},
    legalRegulatory: { dataProtection: {}, operatingJurisdictions: {} },
    technical: {},
    business: {},
    responsibleEthical: {},
    finops: {},
    requirements: {},
    vendorAssessment: {}
  };

  const setIfMatch = (src: any, key: string, value: string, patterns: string[]) => {
    if (patterns.some(p => value.toLowerCase().includes(p))) src[key] = value;
  };

  for (const q of items || []) {
    const stage = String(q.stage || '').toUpperCase();
    const qText = norm(q.text).toLowerCase();
    const labels: string[] = (q.answers || []).map(a => norm(a.value));

    if (stage === 'DATA_READINESS') {
      for (const label of labels) {
        (steps.dataReadiness as any).dataTypes = (steps.dataReadiness as any).dataTypes || [];
        if (/record|biometric|child|financial|health|pii|personal/i.test(label)) (steps.dataReadiness as any).dataTypes.push(label);
        if (/cross\s*-?border|cross border|international transfer/i.test(label) || qText.includes('cross-border')) (steps.dataReadiness as any).crossBorderTransfer = true;
        setIfMatch(steps.dataReadiness, 'dataVolume', label, ['record', 'volume', 'gb', 'tb', 'mb']);
        setIfMatch(steps.dataReadiness, 'dataUpdate', label, ['real-time', 'realtime', 'batch', 'daily', 'weekly', 'hourly']);
        setIfMatch(steps.dataReadiness, 'dataRetention', label, ['year', 'month', 'retention']);
      }
    }

    if (stage === 'LEGAL_REGULATORY') {
      for (const label of labels) {
        if (/eu\b|europe|us\b|usa|uae|gcc|apac|emea|apj|gdpr|uk|india|singapore|canada/i.test(label) || qText.includes('jurisdiction')) {
          const region = 'General';
          (steps.legalRegulatory as any).operatingJurisdictions[region] = (steps.legalRegulatory as any).operatingJurisdictions[region] || [];
          (steps.legalRegulatory as any).operatingJurisdictions[region].push(label);
        }
        setIfMatch(steps.legalRegulatory, 'complianceReporting', label, ['minimal', 'basic', 'enhanced', 'comprehensive', 'reporting']);
        setIfMatch(steps.legalRegulatory, 'riskTolerance', label, ['low', 'medium', 'high']);
        if (/gdpr|hipaa|finra|pci/i.test(label)) {
          (steps.legalRegulatory as any).dataProtection = (steps.legalRegulatory as any).dataProtection || {};
          (steps.legalRegulatory as any).dataProtection.jurisdictions = (steps.legalRegulatory as any).dataProtection.jurisdictions || [];
          (steps.legalRegulatory as any).dataProtection.jurisdictions.push(label);
        }
      }
    }

    if (stage === 'TECHNICAL') {
      for (const label of labels) {
        setIfMatch(steps.technical, 'authentication', label, ['basic', 'oauth', 'none', 'mfa', 'sso']);
        setIfMatch(steps.technical, 'encryption', label, ['encryption', 'none', 'aes', 'tls', 'at rest', 'in transit']);
        setIfMatch(steps.technical, 'accessControl', label, ['public', 'private', 'role', 'rbac']);
        setIfMatch(steps.technical, 'incidentResponse', label, ['incident', 'ir plan', 'none']);
        setIfMatch(steps.technical, 'apiSecurity', label, ['api']);
        // Extract Model Type for GenAI detection
        if (/model\s*type|generative|llm|large language|multi-modal/i.test(qText)) {
          (steps.technical as any).modelTypes = (steps.technical as any).modelTypes || [];
          if (!(steps.technical as any).modelTypes.includes(label)) {
            (steps.technical as any).modelTypes.push(label);
          }
        }
      }
    }

    if (stage === 'BUSINESS') {
      for (const label of labels) {
        setIfMatch(steps.business, 'businessCriticality', label, ['mission critical', 'business critical', 'critical']);
        setIfMatch(steps.business, 'sla', label, ['99.999', '99.99', '99.9', 'sla']);
        setIfMatch(steps.business, 'disasterRecovery', label, ['dr', 'disaster', 'none', 'rpo', 'rto']);
        setIfMatch(steps.business, 'changeManagement', label, ['change', 'ad-hoc', 'structured', 'itil']);
      }
    }

    if (stage === 'RESPONSIBLE_ETHICAL') {
      for (const label of labels) {
        setIfMatch(steps.responsibleEthical, 'biasDetection', label, ['bias', 'none']);
        setIfMatch(steps.responsibleEthical, 'humanOversight', label, ['oversight', 'none', 'human-in-the-loop']);
        setIfMatch(steps.responsibleEthical, 'transparencyLevel', label, ['transparency', 'low', 'medium', 'high']);
        setIfMatch(steps.responsibleEthical, 'appealProcess', label, ['appeal', 'none']);
      }
    }

    if (/vendor|third[-\s]?party/i.test(qText)) {
      const count = labels.map(l => parseInt(l, 10)).find(n => !isNaN(n));
      if (typeof count === 'number') (steps.vendorAssessment as any).vendorCount = count;
    }
  }

  return steps;
}


