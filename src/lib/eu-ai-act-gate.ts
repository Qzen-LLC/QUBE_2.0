// EU AI Act Risk Classification Gate Logic

export type RiskLevel = 'minimal' | 'limited' | 'high' | 'prohibited';

export interface GateCheckResult {
  canAccessAssessment: boolean;
  canAccessControls: boolean;
  shouldRedirectToClassification: boolean;
  message: string;
  requiresFullCompliance: boolean;
  nextStepUrl?: string;
}

export function checkAssessmentGate(assessment: {
  riskClassificationCompleted: boolean;
  riskLevel: string | null;
} | null): GateCheckResult {
  // No assessment exists yet
  if (!assessment) {
    return {
      canAccessAssessment: false,
      canAccessControls: false,
      shouldRedirectToClassification: true,
      message: 'Please complete the risk classification first to determine your compliance requirements.',
      requiresFullCompliance: false
    };
  }

  // Risk classification not completed
  if (!assessment.riskClassificationCompleted) {
    return {
      canAccessAssessment: false,
      canAccessControls: false,
      shouldRedirectToClassification: true,
      message: 'Complete the risk classification to determine which requirements apply to your AI system.',
      requiresFullCompliance: false
    };
  }

  const riskLevel = assessment.riskLevel as RiskLevel;

  // Prohibited system
  if (riskLevel === 'prohibited') {
    return {
      canAccessAssessment: false,
      canAccessControls: false,
      shouldRedirectToClassification: false,
      message: '⚠️ This AI system involves prohibited practices and cannot be deployed in the EU. No compliance assessment is needed as deployment is not permitted.',
      requiresFullCompliance: false
    };
  }

  // High-risk system - full compliance required
  if (riskLevel === 'high') {
    return {
      canAccessAssessment: true,
      canAccessControls: true,
      shouldRedirectToClassification: false,
      message: 'Your AI system is classified as high-risk. Complete all 70 assessment questions and 170 compliance controls.',
      requiresFullCompliance: true
    };
  }

  // Limited-risk system - transparency only
  if (riskLevel === 'limited') {
    return {
      canAccessAssessment: false,
      canAccessControls: false,
      shouldRedirectToClassification: false,
      message: 'ℹ️ Your AI system requires transparency obligations only (Article 52). No full assessment needed.',
      requiresFullCompliance: false,
      nextStepUrl: '/transparency-requirements'
    };
  }

  // Minimal-risk system
  if (riskLevel === 'minimal') {
    return {
      canAccessAssessment: false,
      canAccessControls: false,
      shouldRedirectToClassification: false,
      message: '✅ Your AI system is minimal-risk. No EU AI Act compliance obligations apply. Voluntary best practices are encouraged.',
      requiresFullCompliance: false
    };
  }

  // Default fallback
  return {
    canAccessAssessment: false,
    canAccessControls: false,
    shouldRedirectToClassification: true,
    message: 'Please complete the risk classification assessment.',
    requiresFullCompliance: false
  };
}

export function getRiskLevelBadgeColor(riskLevel: string | null): string {
  switch (riskLevel) {
    case 'prohibited':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'limited':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'minimal':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
