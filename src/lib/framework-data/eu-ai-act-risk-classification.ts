// EU AI Act Risk Classification Questions and Categories
// Based on Articles 5 (Prohibited Practices) and Annex III (High-Risk AI Systems)

export type RiskLevel = 'minimal' | 'limited' | 'high' | 'prohibited';
export type AnswerType = 'boolean' | 'multiple-choice' | 'checkbox-list';

export interface RiskClassificationQuestion {
  id: string;
  step: number;
  stepTitle: string;
  question: string;
  description?: string;
  answerType: AnswerType;
  options?: { value: string; label: string; description?: string }[];
  impactsRisk?: {
    level: RiskLevel;
    condition: (answer: any) => boolean;
  }[];
}

// Article 5: Prohibited AI Practices
export const PROHIBITED_PRACTICES = [
  {
    id: 'subliminal-manipulation',
    label: 'Subliminal Manipulation',
    description: 'AI that deploys subliminal techniques to materially distort behavior causing significant harm',
    article: 'Article 5(1)(a)'
  },
  {
    id: 'vulnerability-exploitation',
    label: 'Vulnerability Exploitation',
    description: 'AI exploiting vulnerabilities of age, disability, or socio-economic situation causing harm',
    article: 'Article 5(1)(b)'
  },
  {
    id: 'social-scoring',
    label: 'Social Scoring by Public Authorities',
    description: 'Evaluation or classification of natural persons by public authorities leading to detrimental treatment',
    article: 'Article 5(1)(c)'
  },
  {
    id: 'realtime-biometric-public',
    label: 'Real-time Remote Biometric Identification in Public Spaces',
    description: 'Real-time biometric identification in publicly accessible spaces (with law enforcement exceptions)',
    article: 'Article 5(1)(d)'
  },
  {
    id: 'emotion-recognition-workplace',
    label: 'Emotion Recognition in Workplace/Education',
    description: 'Emotion recognition systems in workplace or educational institutions (with specific exceptions)',
    article: 'Article 5(1)(f)'
  },
  {
    id: 'predictive-policing',
    label: 'Predictive Policing Based on Profiling',
    description: 'Assessing risk of criminal offense based solely on profiling or personality traits',
    article: 'Article 5(1)(g)'
  }
];

// Annex III: High-Risk AI System Categories
export const HIGH_RISK_CATEGORIES = [
  {
    id: 'biometric',
    title: 'Biometric Identification and Categorization',
    annexSection: 'Annex III, Section 1',
    subcategories: [
      {
        id: 'biometric-identification',
        label: 'Remote Biometric Identification',
        description: 'Systems for remote biometric identification of natural persons'
      },
      {
        id: 'biometric-categorization',
        label: 'Biometric Categorization',
        description: 'Systems for biometric categorization based on sensitive attributes'
      },
      {
        id: 'emotion-recognition',
        label: 'Emotion Recognition',
        description: 'Systems for recognizing or inferring emotions (except medical/safety purposes)'
      }
    ]
  },
  {
    id: 'critical-infrastructure',
    title: 'Critical Infrastructure',
    annexSection: 'Annex III, Section 2',
    subcategories: [
      {
        id: 'water-gas-electricity',
        label: 'Water, Gas, Heating & Electricity',
        description: 'Safety components in management and operation of critical infrastructure'
      },
      {
        id: 'road-traffic',
        label: 'Road Traffic Management',
        description: 'Safety components in road traffic management and operation'
      },
      {
        id: 'aviation-rail-maritime',
        label: 'Aviation, Rail & Maritime Transport',
        description: 'Safety components in supply of water, gas, heating, electricity, and transport'
      }
    ]
  },
  {
    id: 'education-employment',
    title: 'Education and Vocational Training',
    annexSection: 'Annex III, Section 3',
    subcategories: [
      {
        id: 'education-assessment',
        label: 'Educational Assessment',
        description: 'Determining access to educational institutions or assigning students'
      },
      {
        id: 'exam-scoring',
        label: 'Exam Evaluation',
        description: 'Assessing learning outcomes, including exam scoring and proctoring'
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment, Worker Management & Self-Employment',
    annexSection: 'Annex III, Section 4',
    subcategories: [
      {
        id: 'recruitment-hiring',
        label: 'Recruitment and Hiring',
        description: 'CV screening, candidate evaluation, job advertisement targeting'
      },
      {
        id: 'performance-evaluation',
        label: 'Performance Evaluation',
        description: 'Evaluating performance, monitoring, promotion, or termination decisions'
      },
      {
        id: 'task-allocation',
        label: 'Task Allocation',
        description: 'Making decisions on work-related tasks, monitoring work patterns'
      }
    ]
  },
  {
    id: 'essential-services',
    title: 'Access to Essential Private Services',
    annexSection: 'Annex III, Section 5',
    subcategories: [
      {
        id: 'creditworthiness',
        label: 'Credit worthiness Assessment',
        description: 'Evaluating creditworthiness or establishing credit scores'
      },
      {
        id: 'insurance-pricing',
        label: 'Insurance Risk Assessment',
        description: 'Risk assessment and pricing for life and health insurance'
      },
      {
        id: 'emergency-dispatch',
        label: 'Emergency Response Dispatch',
        description: 'Dispatching or prioritizing emergency first response services'
      }
    ]
  },
  {
    id: 'law-enforcement',
    title: 'Law Enforcement',
    annexSection: 'Annex III, Section 6',
    subcategories: [
      {
        id: 'risk-assessment-criminal',
        label: 'Criminal Risk Assessment',
        description: 'Assessing risk of criminal offense or reoffending'
      },
      {
        id: 'polygraph-lie-detection',
        label: 'Polygraph and Lie Detection',
        description: 'Systems for detecting deception by analyzing verbal and non-verbal cues'
      },
      {
        id: 'evidence-evaluation',
        label: 'Evidence Evaluation',
        description: 'Evaluating reliability of evidence in criminal proceedings'
      },
      {
        id: 'crime-analytics',
        label: 'Crime Analytics and Profiling',
        description: 'Assessing, predicting, or profiling criminal behavior based on profiling'
      }
    ]
  },
  {
    id: 'migration-border',
    title: 'Migration, Asylum & Border Control',
    annexSection: 'Annex III, Section 7',
    subcategories: [
      {
        id: 'visa-asylum-assessment',
        label: 'Visa and Asylum Application Assessment',
        description: 'Assisting competent authorities in examining visa, asylum applications'
      },
      {
        id: 'border-risk-assessment',
        label: 'Border Control Risk Assessment',
        description: 'Detecting, recognizing or identifying natural persons for border control'
      },
      {
        id: 'complaint-examination',
        label: 'Complaint Examination',
        description: 'Examining complaints on violations of fundamental rights during border control'
      }
    ]
  },
  {
    id: 'justice-democracy',
    title: 'Administration of Justice & Democratic Processes',
    annexSection: 'Annex III, Section 8',
    subcategories: [
      {
        id: 'legal-research',
        label: 'Legal Research and Interpretation',
        description: 'Assisting judicial authority in researching and interpreting facts and law'
      },
      {
        id: 'election-influence',
        label: 'Election Influence Detection',
        description: 'AI systems influencing outcome of elections or referenda'
      }
    ]
  }
];

// Risk Classification Questions
export const RISK_CLASSIFICATION_QUESTIONS: RiskClassificationQuestion[] = [
  // Step 1: AI System Verification
  {
    id: 'rc-1.1',
    step: 1,
    stepTitle: 'AI System Verification',
    question: 'Is this system an AI system under the EU AI Act definition?',
    description: 'An AI system is defined as a machine-based system that can, for a given set of objectives, generate outputs such as predictions, recommendations, or decisions that influence real or virtual environments (Article 3(1)).',
    answerType: 'multiple-choice',
    options: [
      {
        value: 'yes',
        label: 'Yes, it is an AI system',
        description: 'The system uses machine learning or logic-based approaches to generate outputs'
      },
      {
        value: 'no',
        label: 'No, it is not an AI system',
        description: 'The system uses only traditional rule-based software'
      },
      {
        value: 'unsure',
        label: 'Unsure',
        description: 'Need help determining if this qualifies as an AI system'
      }
    ]
  },
  {
    id: 'rc-1.2',
    step: 1,
    stepTitle: 'AI System Verification',
    question: 'Where will this AI system be used or placed on the market?',
    description: 'The EU AI Act applies to systems placed on the EU market or used in the EU.',
    answerType: 'multiple-choice',
    options: [
      {
        value: 'eu-market',
        label: 'Placed on EU market or used in EU',
        description: 'System will be available to EU users or deployed in EU territory'
      },
      {
        value: 'outside-eu',
        label: 'Only outside the EU',
        description: 'System will not be placed on EU market or used in EU'
      }
    ]
  },
  {
    id: 'rc-1.3',
    step: 1,
    stepTitle: 'AI System Verification',
    question: 'Does any exemption apply to your AI system?',
    description: 'Certain AI systems are exempt from the EU AI Act.',
    answerType: 'checkbox-list',
    options: [
      {
        value: 'military-defense',
        label: 'Military, defense, or national security',
        description: 'System used exclusively for military, defense, or national security purposes'
      },
      {
        value: 'research-only',
        label: 'Research and development only',
        description: 'System used solely for scientific research and development'
      },
      {
        value: 'personal-non-professional',
        label: 'Personal non-professional activity',
        description: 'System used for purely personal and non-professional purposes'
      },
      {
        value: 'none',
        label: 'No exemptions apply',
        description: 'System does not fall under any exemption category'
      }
    ]
  },

  // Step 2: Prohibited Practices
  {
    id: 'rc-2.1',
    step: 2,
    stepTitle: 'Prohibited Practices Check',
    question: 'Does your AI system involve any of these prohibited practices?',
    description: 'Select ALL that apply. If any prohibited practice is selected, your system cannot be deployed in the EU (Article 5).',
    answerType: 'checkbox-list',
    options: PROHIBITED_PRACTICES.map(practice => ({
      value: practice.id,
      label: practice.label,
      description: `${practice.description} (${practice.article})`
    })).concat([
      {
        value: 'none',
        label: 'None of the above',
        description: 'My AI system does not engage in any prohibited practices'
      }
    ])
  },

  // Step 3: High-Risk Categories
  {
    id: 'rc-3.1',
    step: 3,
    stepTitle: 'High-Risk Category Assessment',
    question: 'Select all Annex III categories that apply to your AI system',
    description: 'If any category applies, your system is classified as high-risk and must comply with all EU AI Act requirements.',
    answerType: 'checkbox-list',
    options: HIGH_RISK_CATEGORIES.flatMap(category =>
      category.subcategories.map(sub => ({
        value: sub.id,
        label: `${category.title}: ${sub.label}`,
        description: `${sub.description} (${category.annexSection})`
      }))
    ).concat([
      {
        value: 'none',
        label: 'None of the above',
        description: 'My AI system does not fall under any high-risk category'
      }
    ])
  },

  // Step 4: Transparency Obligations
  {
    id: 'rc-4.1',
    step: 4,
    stepTitle: 'Limited-Risk Assessment',
    question: 'Does your AI system have any of these characteristics requiring transparency obligations?',
    description: 'Systems with these characteristics must meet specific transparency requirements (Article 52).',
    answerType: 'checkbox-list',
    options: [
      {
        value: 'chatbot',
        label: 'Interacts with humans (chatbot, conversational AI)',
        description: 'Users must be informed they are interacting with AI'
      },
      {
        value: 'content-generation',
        label: 'Generates or manipulates content (deepfakes, synthetic media)',
        description: 'Generated content must be clearly labeled as AI-generated'
      },
      {
        value: 'emotion-recognition-limited',
        label: 'Uses emotion recognition (outside prohibited contexts)',
        description: 'Users must be informed about emotion recognition use'
      },
      {
        value: 'biometric-categorization-limited',
        label: 'Uses biometric categorization (outside prohibited contexts)',
        description: 'Users must be informed about biometric categorization'
      },
      {
        value: 'none',
        label: 'None of the above',
        description: 'System has no specific transparency obligations'
      }
    ]
  }
];

// Helper function to calculate risk level
export function calculateRiskLevel(answers: Record<string, any>): {
  riskLevel: RiskLevel;
  rationale: string;
  applicableCategories: string[];
  prohibitedPractices: string[];
  transparencyObligations: string[];
} {
  const result = {
    riskLevel: 'minimal' as RiskLevel,
    rationale: '',
    applicableCategories: [] as string[],
    prohibitedPractices: [] as string[],
    transparencyObligations: [] as string[]
  };

  // Check if it's an AI system at all
  if (answers['rc-1.1'] === 'no') {
    result.rationale = 'System is not classified as an AI system under the EU AI Act definition.';
    return result;
  }

  // Check if outside EU
  if (answers['rc-1.2'] === 'outside-eu') {
    result.rationale = 'System is not placed on the EU market or used in the EU.';
    return result;
  }

  // Check for exemptions
  const exemptions = answers['rc-1.3'] || [];
  if (exemptions.includes('military-defense') || exemptions.includes('research-only') || exemptions.includes('personal-non-professional')) {
    result.rationale = 'System is exempt from EU AI Act (military/defense, research only, or personal use).';
    return result;
  }

  // Check for prohibited practices
  const prohibitedAnswers = answers['rc-2.1'] || [];
  const hasProhibited = prohibitedAnswers.filter((p: string) => p !== 'none');
  if (hasProhibited.length > 0) {
    result.riskLevel = 'prohibited';
    result.prohibitedPractices = hasProhibited;
    result.rationale = `System involves prohibited AI practices: ${hasProhibited.map((id: string) => {
      const practice = PROHIBITED_PRACTICES.find(p => p.id === id);
      return practice ? practice.label : id;
    }).join(', ')}. This system cannot be deployed in the EU.`;
    return result;
  }

  // Check for high-risk categories
  const highRiskAnswers = answers['rc-3.1'] || [];
  const hasHighRisk = highRiskAnswers.filter((c: string) => c !== 'none');
  if (hasHighRisk.length > 0) {
    result.riskLevel = 'high';
    result.applicableCategories = hasHighRisk;
    result.rationale = `System falls under ${hasHighRisk.length} high-risk categor${hasHighRisk.length === 1 ? 'y' : 'ies'} per Annex III. Full EU AI Act compliance required including: conformity assessment, CE marking, EU database registration, and post-market monitoring.`;

    // Also check for transparency obligations
    const transparencyAnswers = answers['rc-4.1'] || [];
    result.transparencyObligations = transparencyAnswers.filter((t: string) => t !== 'none');

    return result;
  }

  // Check for limited-risk (transparency obligations only)
  const transparencyAnswers = answers['rc-4.1'] || [];
  const hasTransparency = transparencyAnswers.filter((t: string) => t !== 'none');
  if (hasTransparency.length > 0) {
    result.riskLevel = 'limited';
    result.transparencyObligations = hasTransparency;
    result.rationale = `System requires transparency obligations per Article 52. Users must be informed about AI interaction, content generation, or biometric processing.`;
    return result;
  }

  // Default to minimal risk
  result.riskLevel = 'minimal';
  result.rationale = 'System is classified as minimal-risk. No specific EU AI Act obligations apply, but voluntary codes of conduct are encouraged.';

  return result;
}
