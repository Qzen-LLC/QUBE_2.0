/**
 * Field Mapper for Gen AI and Agentic AI Assessment Fields
 * 
 * This utility transforms between the flat UI component structure
 * and the nested type definition structure, ensuring backward compatibility
 * while properly capturing all Gen AI and Agentic AI fields.
 */

import { ComprehensiveAssessment } from '@/lib/agents/types';

/**
 * Maps UI component fields to the ComprehensiveAssessment type structure
 * Used when saving assessment data to the database
 */
export function mapUIToTypeDefinition(uiData: any): Partial<ComprehensiveAssessment> {
  const mapped: any = {
    ...uiData,
  };

  // Map Technical Feasibility Gen AI fields
  if (uiData.technicalFeasibility) {
    const tech = uiData.technicalFeasibility;
    
    mapped.technicalFeasibility = {
      ...tech,
      // Map plural to singular for model provider
      modelProvider: tech.modelProviders?.[0] || tech.modelProvider,
      
      // Map context window
      contextWindowSize: parseContextWindow(tech.contextWindow),
      
      // Map token usage
      tokenUsage: tech.avgInputTokens || tech.avgOutputTokens || tech.expectedRequestsPerDay ? {
        estimatedDaily: tech.expectedRequestsPerDay || 0,
        estimatedMonthly: (tech.expectedRequestsPerDay || 0) * 30,
        peakHourly: Math.ceil((tech.expectedRequestsPerDay || 0) / 24),
      } : undefined,
      
      // Map RAG Architecture
      ragArchitecture: tech.vectorDatabases?.length || tech.embeddingModel ? {
        vectorDatabase: tech.vectorDatabases?.[0] || '',
        embeddingModel: tech.embeddingModel || '',
        chunkSize: tech.chunkSize || 512,
        overlapSize: tech.overlapSize || 50,
        retrievalTopK: tech.retrievalTopK || 5,
        chunkingStrategy: tech.chunkingStrategy || '',
        retrievalStrategies: tech.retrievalStrategies || [],
      } : undefined,
      
      // Map Agent Architecture
      agentArchitecture: tech.agentPattern || '',
      agentCapabilities: [
        ...(tech.agentAutonomy ? [tech.agentAutonomy] : []),
        ...(tech.memoryTypes || []),
      ],
      orchestrationPattern: tech.orchestrationPattern || '',
      memoryManagement: tech.memoryTypes?.join(', ') || '',
      toolIntegrations: tech.toolCategories || [],
      functionCalling: tech.toolCategories?.length > 0,
      streamingEnabled: tech.responseFormats?.includes('Streaming') || false,
      batchProcessing: tech.responseFormats?.includes('Batch') || false,
      cacheStrategy: tech.cacheStrategy || '',
      fallbackModels: tech.fallbackModels || [],
      monitoringTools: tech.monitoringTools || [],
      promptEngineeringReqs: tech.promptEngineeringReqs || [],
    };
  }

  // Map Business Feasibility Gen AI fields
  if (uiData.businessFeasibility) {
    const biz = uiData.businessFeasibility;
    
    mapped.businessFeasibility = {
      ...biz,
      // These fields already match the type definition
      genAIUseCase: biz.genAIUseCase,
      interactionPattern: biz.interactionPattern,
      userInteractionModes: biz.userInteractionModes,
      successMetrics: biz.successMetrics,
      minAcceptableAccuracy: biz.minAcceptableAccuracy,
      maxHallucinationRate: biz.maxHallucinationRate,
      minResponseRelevance: biz.minResponseRelevance || biz.requiredResponseRelevance,
      maxLatency: biz.maxLatency,
      contentQualityThreshold: biz.contentQualityThreshold,
      userSatisfactionTarget: biz.userSatisfactionTarget,
    };
  }

  // Map Ethical Impact Gen AI fields
  if (uiData.ethicalImpact) {
    const ethical = uiData.ethicalImpact;
    
    mapped.ethicalImpact = {
      ...ethical,
      // Content generation fields already match
      contentGeneration: ethical.contentGeneration,
      agentBehavior: ethical.agentBehavior,
    };
  }

  // Map Budget Planning Gen AI fields
  if (uiData.budgetPlanning) {
    const budget = uiData.budgetPlanning;
    
    mapped.budgetPlanning = {
      ...budget,
      // Token pricing fields
      inputTokenPrice: budget.inputTokenPrice,
      outputTokenPrice: budget.outputTokenPrice,
      embeddingTokenPrice: budget.embeddingTokenPrice,
      finetuningTokenPrice: budget.finetuningTokenPrice,
      monthlyTokenVolume: budget.monthlyTokenVolume,
      peakTokenVolume: budget.peakTokenVolume,
      tokenOptimizationTarget: budget.tokenOptimizationTarget,
      optimizationStrategies: budget.optimizationStrategies || [],
      vectorDbCost: budget.vectorDbCost,
      gpuInferenceCost: budget.gpuInferenceCost,
      monitoringToolsCost: budget.monitoringToolsCost,
      safetyApiCost: budget.safetyApiCost,
      backupModelCost: budget.backupModelCost,
    };
  }

  // Map Data Readiness Gen AI fields
  if (uiData.dataReadiness) {
    const data = uiData.dataReadiness;
    
    mapped.dataReadiness = {
      ...data,
      // Training data fields
      trainingDataTypes: data.trainingDataTypes,
      instructionClarityScore: data.instructionClarityScore,
      responseQualityScore: data.responseQualityScore,
      diversityScore: data.diversityScore || data.diversityIndex,
      biasScore: data.biasScore || data.toxicityScore,
      trainingDataSize: data.trainingDataSize,
      finetuningRequired: data.finetuningRequired,
      syntheticDataUsage: data.syntheticDataUsage,
      promptEngineering: data.promptEngineering || [],
      knowledgeSources: data.knowledgeSources || [],
      knowledgeUpdateFrequency: data.knowledgeUpdateFrequency || data.updateFrequency,
      contextSources: data.contextSources || [],
      // Additional fields that might be missing
      versionControl: data.versionControl,
      factVerificationProcess: data.factVerificationProcess,
      updateStrategy: data.updateStrategy,
    };
  }

  // Map Risk Assessment Gen AI fields
  if (uiData.riskAssessment) {
    const risk = uiData.riskAssessment;
    
    mapped.riskAssessment = {
      ...risk,
      modelRisks: risk.modelRisks,
      agentRisks: risk.agentRisks,
      dependencyRisks: risk.dependencyRisks || [],
      vendorLockIn: risk.vendorLockIn,
      apiStability: risk.apiStability,
      costOverrun: risk.costOverrun,
    };
  }

  // Map Roadmap Position fields
  if (uiData.roadmapPosition) {
    const roadmap = uiData.roadmapPosition;
    
    mapped.roadmapPosition = {
      ...roadmap,
      // Ensure all fields are captured
      milestoneCriteria: roadmap.milestoneCriteria || [],
      successIndicators: roadmap.successIndicators || [],
    };
  }

  // Ensure all assessment steps are included
  const requiredSteps = [
    'technicalFeasibility',
    'businessFeasibility',
    'ethicalImpact',
    'riskAssessment',
    'dataReadiness',
  ];

  // Add any missing steps with empty objects to ensure structure consistency
  requiredSteps.forEach(step => {
    if (!mapped[step]) {
      mapped[step] = uiData[step] || {};
    }
  });

  // Add metadata for tracking
  mapped.metadata = {
    ...uiData.metadata,
    lastUpdated: new Date().toISOString(),
    version: '1.0',
    stepsCompleted: Object.keys(uiData).filter(key => 
      requiredSteps.includes(key) && uiData[key] && Object.keys(uiData[key]).length > 0
    ),
  };

  return mapped;
}

/**
 * Maps type definition fields back to UI component structure
 * Used when loading assessment data from the database
 */
export function mapTypeDefinitionToUI(typeData: any): any {
  const mapped: any = {
    ...typeData,
  };

  // Map Technical Feasibility fields back to UI
  if (typeData.technicalFeasibility) {
    const tech = typeData.technicalFeasibility;
    
    mapped.technicalFeasibility = {
      ...tech,
      // Map singular to plural for UI
      modelProviders: tech.modelProvider ? [tech.modelProvider] : (tech.modelProviders || []),
      
      // Map context window size to string
      contextWindow: tech.contextWindowSize ? `${tech.contextWindowSize}K` : (tech.contextWindow || ''),
      
      // Map token usage to flat structure
      avgInputTokens: tech.tokenUsage?.estimatedDaily ? Math.floor(tech.tokenUsage.estimatedDaily * 0.7) : tech.avgInputTokens,
      avgOutputTokens: tech.tokenUsage?.estimatedDaily ? Math.floor(tech.tokenUsage.estimatedDaily * 0.3) : tech.avgOutputTokens,
      expectedRequestsPerDay: tech.tokenUsage?.estimatedDaily || tech.expectedRequestsPerDay,
      
      // Map RAG Architecture to flat structure
      vectorDatabases: tech.ragArchitecture?.vectorDatabase ? [tech.ragArchitecture.vectorDatabase] : (tech.vectorDatabases || []),
      embeddingModel: tech.ragArchitecture?.embeddingModel || tech.embeddingModel,
      embeddingDimensions: tech.ragArchitecture?.embeddingDimensions || tech.embeddingDimensions,
      chunkingStrategy: tech.ragArchitecture?.chunkingStrategy || tech.chunkingStrategy,
      retrievalStrategies: tech.ragArchitecture?.retrievalStrategies || tech.retrievalStrategies || [],
      
      // Map Agent Architecture to flat structure
      agentPattern: tech.agentArchitecture || tech.agentPattern,
      agentAutonomy: tech.agentCapabilities?.[0] || tech.agentAutonomy,
      memoryTypes: tech.memoryManagement?.split(', ').filter(Boolean) || tech.memoryTypes || [],
      orchestrationPattern: tech.orchestrationPattern,
      toolCategories: tech.toolIntegrations || tech.toolCategories || [],
      
      // Preserve backward compatibility
      responseFormats: tech.responseFormats || [],
      multimodalCapabilities: tech.multimodalCapabilities || [],
    };
  }

  // Business Feasibility fields mostly match already
  if (typeData.businessFeasibility) {
    const biz = typeData.businessFeasibility;
    mapped.businessFeasibility = {
      ...biz,
      // Map minResponseRelevance back to UI field name if needed
      requiredResponseRelevance: biz.minResponseRelevance || biz.requiredResponseRelevance,
    };
  }

  return mapped;
}

/**
 * Helper function to parse context window strings
 */
function parseContextWindow(contextWindow: string | undefined): number | undefined {
  if (!contextWindow) return undefined;
  
  // Parse strings like "4K", "8K", "128K", "200K+"
  const match = contextWindow.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return undefined;
}

/**
 * Checks if the data structure is using the old format
 */
export function isLegacyFormat(data: any): boolean {
  // Check for presence of flat structure fields that don't exist in new format
  return !!(
    data.technicalFeasibility?.modelProviders ||
    data.technicalFeasibility?.vectorDatabases ||
    data.technicalFeasibility?.agentPattern
  );
}

/**
 * Ensures backward compatibility by detecting and converting legacy formats
 */
export function ensureCompatibility(data: any): any {
  if (isLegacyFormat(data)) {
    // Data is already in UI format, no conversion needed for display
    return data;
  }
  
  // Data is in type definition format, convert to UI format
  return mapTypeDefinitionToUI(data);
}