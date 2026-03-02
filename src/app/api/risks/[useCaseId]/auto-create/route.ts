import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';
import { calculateRiskScores, type StepsData } from '@/lib/risk-calculations';
import { riskRecommendations, type RiskRecommendation } from '@/components/riskRecommendations';

/**
 * Maps risk factors and warnings to relevant recommendations from riskRecommendations.ts
 * @param category - Risk category (data, technical, regulatory, ethical, operational, business)
 * @param factors - Risk factors identified during assessment
 * @param infoMessages - Additional info messages/warnings
 * @returns Formatted mitigation plan with recommendations
 */
function mapFactorsToRecommendations(
  category: string,
  factors: string[],
  infoMessages: string[]
): string {
  const recommendations: { heading: string; text: string }[] = [];
  // Filter out non-string values and ensure we only work with valid strings
  const allMessages = [...factors, ...infoMessages].filter(msg => msg && typeof msg === 'string');

  // Helper function to check if a message contains a keyword
  const containsKeyword = (message: string, keywords: string[]): boolean => {
    if (!message || typeof message !== 'string') return false;
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  };

  // Helper function to find and add recommendation
  const addRecommendation = (
    categoryKey: keyof typeof riskRecommendations,
    riskFactor: string,
    heading?: string
  ) => {
    const rec = riskRecommendations[categoryKey]?.find(r => r.riskFactor === riskFactor);
    if (rec) {
      recommendations.push({
        heading: heading || rec.riskFactor,
        text: `${rec.description}\n\n${rec.recommendation}`
      });
    }
  };

  // Map based on category
  switch (category) {
    case 'data': // Data Privacy risks
      // Check for GDPR
      if (containsKeyword(allMessages, ['GDPR', 'European Union', 'EU'])) {
        addRecommendation('regulatory', 'GDPR');
      }

      // Check for HIPAA
      if (containsKeyword(allMessages, ['HIPAA', 'Health', 'Medical', 'PHI'])) {
        addRecommendation('regulatory', 'HIPAA');
      }

      // Check for PCI-DSS
      if (containsKeyword(allMessages, ['PCI', 'Payment', 'Financial Records'])) {
        addRecommendation('regulatory', 'PCI-DSS');
      }

      // Check for sensitive PII
      if (containsKeyword(allMessages, ['PII', 'sensitive', 'personal data'])) {
        addRecommendation('technical', 'Sensitive PII');
      }

      // Check for Children's data
      if (containsKeyword(allMessages, ['Children', 'under 16', 'under 13', 'minors'])) {
        addRecommendation('regulatory', "Children's Data (COPPA)");
        addRecommendation('sectorSpecific', "Children's Data");
      }

      // Check for Biometric data
      if (containsKeyword(allMessages, ['Biometric'])) {
        addRecommendation('technical', 'Sensitive PII', 'Biometric Data');
      }

      // Check for cross-border transfer
      if (containsKeyword(allMessages, ['cross-border', 'transfer', 'jurisdiction'])) {
        addRecommendation('regulatory', 'GDPR', 'Cross-Border Data Transfer');
      }
      break;

    case 'technical': // Security risks
      // Check for API security
      if (containsKeyword(allMessages, ['API', 'exposed', 'public access'])) {
        addRecommendation('technical', 'API Security');
      }

      // Check for encryption
      if (containsKeyword(allMessages, ['encryption', 'no encryption'])) {
        addRecommendation('technical', 'Lack of Encryption');
      }

      // Check for authentication
      if (containsKeyword(allMessages, ['authentication', 'weak auth', 'basic'])) {
        addRecommendation('technical', 'Authentication Weakness');
      }

      // Check for authorization
      if (containsKeyword(allMessages, ['authorization', 'access control'])) {
        addRecommendation('technical', 'Authorization Issues');
      }

      // Check for insecure storage
      if (containsKeyword(allMessages, ['storage', 'insecure'])) {
        addRecommendation('technical', 'Insecure Storage');
      }

      // Check for dependencies
      if (containsKeyword(allMessages, ['dependencies', 'outdated', 'vendor'])) {
        addRecommendation('technical', 'Outdated Dependencies');
        addRecommendation('technical', 'Supply Chain Risk');
      }

      // Check for incident response
      if (containsKeyword(allMessages, ['incident response', 'no incident'])) {
        addRecommendation('technical', 'Data Breach');
        addRecommendation('operational', 'No Incident Response Plan');
      }
      break;

    case 'regulatory': // Regulatory risks
      // Check for specific regulations
      if (containsKeyword(allMessages, ['GDPR'])) {
        addRecommendation('regulatory', 'GDPR');
      }

      if (containsKeyword(allMessages, ['HIPAA'])) {
        addRecommendation('regulatory', 'HIPAA');
      }

      if (containsKeyword(allMessages, ['PCI', 'Payment'])) {
        addRecommendation('regulatory', 'PCI-DSS');
      }

      if (containsKeyword(allMessages, ['SOX', 'Financial', 'Sarbanes'])) {
        addRecommendation('regulatory', 'SOX');
      }

      if (containsKeyword(allMessages, ['LGPD', 'Brazil'])) {
        addRecommendation('regulatory', 'LGPD');
      }

      if (containsKeyword(allMessages, ['CCPA', 'California'])) {
        addRecommendation('regulatory', 'CCPA');
      }

      // Check for sector-specific data
      if (containsKeyword(allMessages, ['Health', 'Medical'])) {
        addRecommendation('sectorSpecific', 'Healthcare Data');
      }

      if (containsKeyword(allMessages, ['Financial'])) {
        addRecommendation('sectorSpecific', 'Financial Data');
      }

      if (containsKeyword(allMessages, ['Education', 'Student'])) {
        addRecommendation('sectorSpecific', 'Education Data');
      }
      break;

    case 'ethical': // Ethical risks
      if (containsKeyword(allMessages, ['bias', 'fairness'])) {
        addRecommendation('ethical', 'Model Bias');
        addRecommendation('ethical', 'Fairness');
      }

      if (containsKeyword(allMessages, ['explainability', 'transparency', 'black box'])) {
        addRecommendation('ethical', 'Lack of Explainability');
        addRecommendation('ethical', 'Transparency');
      }

      if (containsKeyword(allMessages, ['oversight', 'human'])) {
        addRecommendation('ethical', 'Lack of Explainability', 'Human Oversight');
      }

      if (containsKeyword(allMessages, ['consent', 'informed'])) {
        addRecommendation('ethical', 'Informed Consent');
      }
      break;

    case 'operational': // Operational risks
      if (containsKeyword(allMessages, ['backup', 'backups'])) {
        addRecommendation('operational', 'Lack of Backups');
      }

      if (containsKeyword(allMessages, ['single point', 'critical', 'mission critical'])) {
        addRecommendation('operational', 'Single Point of Failure');
      }

      if (containsKeyword(allMessages, ['monitoring', 'insufficient'])) {
        addRecommendation('operational', 'Insufficient Monitoring');
      }

      if (containsKeyword(allMessages, ['incident response', 'no incident'])) {
        addRecommendation('operational', 'No Incident Response Plan');
      }

      if (containsKeyword(allMessages, ['disaster recovery', 'DR', 'recovery'])) {
        addRecommendation('operational', 'Disaster Recovery Gaps');
      }

      if (containsKeyword(allMessages, ['training', 'awareness'])) {
        addRecommendation('operational', 'Lack of Training');
      }
      break;

    case 'business': // Reputational risks
      if (containsKeyword(allMessages, ['public', 'public-facing'])) {
        // Public-facing systems need comprehensive security
        addRecommendation('technical', 'API Security');
      }

      if (containsKeyword(allMessages, ['sensitive data', 'exposure'])) {
        addRecommendation('technical', 'Sensitive PII');
      }
      break;
  }

  // Format recommendations
  if (recommendations.length === 0) {
    return '';
  }

  const formattedRecommendations = recommendations.map((rec, index) => {
    return `${index + 1}. ${rec.heading}\n\n${rec.text}`;
  }).join('\n\n---\n\n');

  return formattedRecommendations;
}

// POST /api/risks/[useCaseId]/auto-create - Auto-create risks from assessment data
export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>, auth: any }
) => {
  try {
    // Await params as required by Next.js 15
    const { useCaseId } = await params;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { stepsData } = await request.json();

    // Debug: Log the incoming assessment data in detail
    console.log('[DEBUG] Incoming stepsData FULL DUMP:', JSON.stringify(stepsData, null, 2));
    console.log('[DEBUG] Incoming stepsData Summary:', {
      hasStepsData: !!stepsData,
      stepsDataKeys: stepsData ? Object.keys(stepsData) : [],
      step1Keys: stepsData?.step1 ? Object.keys(stepsData.step1) : [],
      step2Keys: stepsData?.step2 ? Object.keys(stepsData.step2) : [],
      step3Keys: stepsData?.step3 ? Object.keys(stepsData.step3) : [],
      step4Keys: stepsData?.step4 ? Object.keys(stepsData.step4) : [],
      step5Keys: stepsData?.step5 ? Object.keys(stepsData.step5) : [],
      step6Keys: stepsData?.step6 ? Object.keys(stepsData.step6) : [],
      sampleData: {
        dataTypes: stepsData?.step1?.dataTypes,
        userConsent: stepsData?.step2?.userConsent,
        accessControls: stepsData?.step3?.accessControls,
        regulatoryFrameworks: stepsData?.step4?.regulatoryFrameworks,
      }
    });

    const riskResult = calculateRiskScores(stepsData as StepsData);

    // Debug logging to understand what's happening
    console.log('[DEBUG] Risk calculation result:', {
      overallScore: riskResult.score,
      chartDataLength: riskResult.chartData.length,
      chartData: riskResult.chartData.map(d => ({
        category: d.month,
        score: d.desktop,
        meetsThreshold: d.desktop >= 4
      })),
      dataPrivacyScore: riskResult.chartData.find(d => d.month === 'Data Privacy')?.desktop,
      securityScore: riskResult.chartData.find(d => d.month === 'Security')?.desktop,
      regulatoryScore: riskResult.chartData.find(d => d.month === 'Regulatory')?.desktop,
      ethicalScore: riskResult.chartData.find(d => d.month === 'Ethical')?.desktop,
      operationalScore: riskResult.chartData.find(d => d.month === 'Operational')?.desktop,
      reputationalScore: riskResult.chartData.find(d => d.month === 'Reputational')?.desktop,
    });

    // Create individual risks for each detected issue instead of grouping by category
    const risksToCreate = [];

    const categoryMappings = {
      'Data Privacy': 'data',
      'Security': 'technical',
      'Regulatory': 'regulatory',
      'Ethical': 'ethical',
      'Operational': 'operational',
      'Reputational': 'business'
    };

    // Helper function to extract individual risks from factors
    const createIndividualRisks = (
      categoryName: string,
      category: string,
      factors: string[],
      infoMessages: string[],
      recommendations: string[]
    ) => {
      // Parse factors to extract individual risk items with their scores
      factors.forEach((factor) => {
        // Extract risk name and score from factor string
        // Format: "Risk name (X/10) (+Y.Z)" or "Risk name (+Y.Z)"
        const scoreMatch = factor.match(/\((\d+(?:\.\d+)?)\)/);
        const riskScore = scoreMatch ? parseFloat(scoreMatch[1]) : 5;

        // Extract the risk name (everything before the score)
        const riskName = factor.split('(')[0].trim();

        // Determine risk level based on score
        const riskLevel = riskScore >= 8 ? 'Critical' :
                         riskScore >= 6 ? 'High' : 'Medium';

        // Find relevant info message for this risk
        const relatedInfo = infoMessages.find(msg =>
          msg.toLowerCase().includes(riskName.toLowerCase().split(' ')[0])
        ) || '';

        // Generate mitigation plan for this specific risk
        // First try keyword matching from riskRecommendations.ts
        let mitigationPlan = mapFactorsToRecommendations(category, [factor], [relatedInfo]);

        // If no recommendations found from keyword matching, try to find from calculation recommendations
        if (!mitigationPlan && recommendations.length > 0) {
          // Try to match recommendations based on risk keywords
          const riskKeywords = riskName.toLowerCase();
          const relatedRecommendations = recommendations.filter(rec => {
            const recLower = rec.toLowerCase();
            // Match if any word from the risk name appears in the recommendation
            return riskKeywords.split(' ').some(keyword =>
              keyword.length > 3 && recLower.includes(keyword)
            );
          });

          if (relatedRecommendations.length > 0) {
            mitigationPlan = relatedRecommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n\n---\n\n');
          } else {
            // If still no match, provide generic recommendations for the category
            if (recommendations.length > 0) {
              // Use the first recommendation from the category as a fallback
              mitigationPlan = `1. ${recommendations[0]}`;
            }
          }
        }

        risksToCreate.push({
          useCaseId: useCaseId,
          category,
          riskLevel,
          riskScore: Math.min(10, Math.round(riskScore)),
          title: riskName,
          description: relatedInfo || factor,
          impact: riskLevel === 'Critical' ? 'High business impact' :
                  riskLevel === 'High' ? 'Moderate business impact' : 'Low business impact',
          likelihood: riskScore >= 7 ? 'High' :
                     riskScore >= 5 ? 'Medium' : 'Low',
          mitigationPlan: mitigationPlan || undefined,
          sourceType: 'assessment', // Auto-created from assessment data
          sourceId: null, // No external source ID for assessment-generated risks
          createdBy: userRecord.id,
          createdByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown User',
          createdByEmail: userRecord.email,
        });
      });
    };

    // Process each category
    for (const data of riskResult.chartData) {
      console.log(`[DEBUG] Checking category: ${data.month}, score: ${data.desktop}, meets threshold (>=4): ${data.desktop >= 4}`);

      if (data.desktop >= 4) { // Medium risk or higher
        console.log(`[DEBUG] ✓ Processing risks for category: ${data.month} with score ${data.desktop}`);
        const category = categoryMappings[data.month as keyof typeof categoryMappings] || 'technical';

        // Get specific risk factors and info for this category
        let factors: string[] = [];
        let infoMessages: string[] = [];
        let recommendations: string[] = [];

        switch (category) {
          case 'data':
            factors = riskResult.dataPrivacyFactors;
            infoMessages = riskResult.dataPrivacyInfo;
            recommendations = riskResult.dataPrivacyRecommendations || [];
            break;
          case 'technical':
            factors = riskResult.securityFactors;
            infoMessages = riskResult.securityInfo;
            recommendations = riskResult.securityRecommendations || [];
            break;
          case 'regulatory':
            factors = riskResult.regulatoryFactors;
            infoMessages = riskResult.regulatoryWarnings;
            recommendations = riskResult.regulatoryRecommendations || [];
            break;
          case 'ethical':
            factors = riskResult.ethicalFactors;
            infoMessages = riskResult.ethicalInfo;
            recommendations = riskResult.ethicalRecommendations || [];
            break;
          case 'operational':
            factors = riskResult.operationalFactors;
            infoMessages = riskResult.operationalInfo;
            recommendations = riskResult.operationalRecommendations || [];
            break;
          case 'business':
            factors = riskResult.reputationalFactors;
            recommendations = riskResult.reputationalRecommendations || [];
            break;
        }

        // Create individual risks for each factor
        if (factors.length > 0) {
          console.log(`[DEBUG] Creating individual risks for ${data.month}: ${factors.length} factors, ${recommendations.length} recommendations`);
          createIndividualRisks(data.month, category, factors, infoMessages, recommendations);
        }
      }
    }

    console.log(`[DEBUG] Total risks to create: ${risksToCreate.length}`);
    if (risksToCreate.length === 0) {
      console.log('[DEBUG] ⚠️ No risks met the threshold (score >= 4). All risk scores are below Medium.');
    }

    // Create all risks in a transaction
    const risks = await prismaClient.$transaction(
      risksToCreate.map(risk => prismaClient.risk.create({ data: risk }))
    );
    console.log('[CRUD_LOG] Risks auto-created:', { count: risks.length, useCaseId: useCaseId, riskIds: risks.map(r => r.id), authoredBy: userRecord.id });

    return NextResponse.json(risks);
  } catch (error) {
    console.error('Error auto-creating risks:', error);
    return NextResponse.json(
      { error: 'Failed to auto-create risks' },
      { status: 500 }
    );
  }
}, { requireUser: true });