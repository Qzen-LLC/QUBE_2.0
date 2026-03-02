export const uaeAiScoringSystem = {
  scoreLevels: [
    {
      value: 0,
      label: "Non-Compliant",
      description: "No control in place, or major gaps",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-300"
    },
    {
      value: 1,
      label: "Partial",
      description: "Control exists but is informal, incomplete, or not documented",
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-800",
      borderColor: "border-orange-300"
    },
    {
      value: 2,
      label: "Compliant",
      description: "Control fully implemented and documented",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-300"
    },
    {
      value: 3,
      label: "Best Practice",
      description: "Control implemented, monitored, and optimized beyond regulatory minimum",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-300"
    }
  ],
  
  riskImpactLevels: [
    {
      level: "low",
      label: "Low Impact AI",
      weight: 1,
      description: "AI systems with minimal risk to individuals or society",
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      level: "significant",
      label: "Significant Impact AI", 
      weight: 2,
      description: "AI systems with moderate risk requiring enhanced controls",
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700"
    },
    {
      level: "critical",
      label: "Critical Impact AI",
      weight: 3,
      description: "High-risk AI systems requiring comprehensive governance",
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    }
  ],

  maturityLevels: [
    {
      level: "high_risk",
      label: "High Risk",
      scoreRange: { min: 0, max: 59 },
      description: "Immediate remediation required; deployment may need to pause",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      recommendations: [
        "Immediate action required to address critical gaps",
        "Consider pausing AI system deployment until remediation",
        "Engage legal and compliance teams for urgent review",
        "Prioritize high-impact controls for immediate implementation"
      ]
    },
    {
      level: "moderate",
      label: "Moderate Risk",
      scoreRange: { min: 60, max: 84 },
      description: "Gaps exist; remediation needed in parallel with deployment",
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-800",
      recommendations: [
        "Address identified gaps while maintaining deployment schedule",
        "Implement additional monitoring and oversight measures",
        "Develop remediation timeline with clear milestones",
        "Regular review and progress monitoring required"
      ]
    },
    {
      level: "mature",
      label: "Mature",
      scoreRange: { min: 85, max: 100 },
      description: "Compliant and future-ready; continuous monitoring",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      recommendations: [
        "Maintain current control effectiveness through monitoring",
        "Consider pursuing best practice enhancements",
        "Share successful practices across organization",
        "Prepare for evolving regulatory requirements"
      ]
    }
  ]
};

export const calculateMaturityScore = (
  controlScores: { controlId: string; score: number }[],
  riskImpactLevel: 'low' | 'significant' | 'critical'
): {
  totalScore: number;
  weightedScore: number;
  percentage: number;
  maturityLevel: string;
} => {
  // Get the weight multiplier based on risk impact level
  const weightMultiplier = uaeAiScoringSystem.riskImpactLevels.find(
    level => level.level === riskImpactLevel
  )?.weight || 1;

  // Calculate total raw score (sum of individual scores)
  const totalRawScore = controlScores.reduce((sum, control) => sum + control.score, 0);
  
  // Calculate maximum possible raw score (14 controls × 3 max score each)
  const maxRawScore = 14 * 3;
  
  // Calculate weighted score (multiply by weight and divide by number of controls)
  const weightedScore = (totalRawScore * weightMultiplier) / controlScores.length;
  
  // Calculate percentage based on weighted maximum possible score
  const maxWeightedScore = 3 * weightMultiplier;
  const percentage = (weightedScore / maxWeightedScore) * 100;

  // Determine maturity level based on percentage
  let maturityLevel = 'high_risk';
  for (const level of uaeAiScoringSystem.maturityLevels) {
    if (percentage >= level.scoreRange.min && percentage <= level.scoreRange.max) {
      maturityLevel = level.level;
      break;
    }
  }

  return {
    totalScore: totalRawScore,
    weightedScore: Math.round(weightedScore * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    maturityLevel
  };
};

export const getMaturityLevelDetails = (level: string) => {
  return uaeAiScoringSystem.maturityLevels.find(ml => ml.level === level);
};

export const getRiskImpactLevelDetails = (level: string) => {
  return uaeAiScoringSystem.riskImpactLevels.find(ril => ril.level === level);
};

export const getScoreLevelDetails = (score: number) => {
  return uaeAiScoringSystem.scoreLevels.find(sl => sl.value === score);
};