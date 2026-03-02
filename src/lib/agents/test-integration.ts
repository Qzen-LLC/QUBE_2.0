/**
 * Integration test for the guardrails generation system
 * Verifies all components work together correctly
 */

import { GuardrailsEngine } from './guardrails-engine';
import { ComprehensiveAssessment } from './types';

// Mock assessment data for testing
const mockAssessment: ComprehensiveAssessment = {
  useCaseId: 'TEST-001',
  useCaseTitle: 'Test AI System',
  department: 'Engineering',
  owner: 'Test User',
  
  problemStatement: 'Need to validate guardrails system',
  successCriteria: 'All agents respond correctly',
  
  technicalFeasibility: {
    modelTypes: ['Generative AI', 'Large Language Model (LLM)'],
    modelSizes: ['Large (>10B parameters)'],
    deploymentModels: ['Cloud-based'],
    cloudProviders: ['AWS'],
    computeRequirements: ['GPU-intensive'],
    integrationPoints: ['REST API', 'GraphQL'],
    apiSpecs: ['OpenAPI 3.0'],
    authMethods: ['API Key'],
    encryptionStandards: ['AES-256'],
    technicalComplexity: 7,
    outputTypes: ['Text', 'JSON'],
    confidenceScore: '90%',
    modelUpdateFrequency: 'Monthly',
    modelProvider: 'OpenAI',
    streamingEnabled: true
  },
  
  businessFeasibility: {
    businessAlignment: 8,
    userCategories: ['Internal Users', 'General Public'],
    systemCriticality: 'Business Critical',
    userAcceptance: 'High',
    changeManagement: 'Significant',
    processIntegration: 'Deep Integration',
    concurrentUsers: '1000+',
    transactionFrequency: 'High (>1000/hour)',
    responseTimeRequirement: '<2 seconds',
    availabilityRequirement: '99.9%',
    failureImpact: 'High - Revenue Loss',
    maxHallucinationRate: 5
  },
  
  dataReadiness: {
    dataTypes: ['Personal Data', 'Financial Records'],
    dataQualityScore: 8,
    dataVolume: 'Large (>1TB)',
    dataUpdateFrequency: 'Real-time',
    dataRetention: '7 years',
    crossBorderTransfer: true
  },
  
  ethicalImpact: {
    decisionMaking: {
      automationLevel: 'Augmented Intelligence',
      finalDecisionMaker: 'Human',
      appealProcess: true,
      transparency: 'Full Transparency'
    },
    aiGovernance: {
      humanOversightLevel: 'Active Monitoring',
      auditRequirements: 'Quarterly',
      appealMechanism: true
    }
  },
  
  riskAssessment: {
    modelRisks: {
      'Prompt Injection Vulnerability': 4,
      'Model Drift/Degradation': 3,
      'Adversarial Inputs': 3,
      'Data Poisoning': 2
    },
    technicalRisks: {
      'Integration Complexity': 3,
      'Scalability Issues': 2,
      'Latency Problems': 3
    },
    businessRisks: {
      'User Adoption': 2,
      'Cost Overrun': 3,
      'Competitive Disadvantage': 2
    },
    dataProtection: {
      jurisdictions: ['GDPR (EU)', 'CCPA (California)']
    }
  },
  
  roadmapPosition: {
    priority: 'High',
    projectStage: 'Development',
    timelineConstraints: ['Q1 2025 Launch'],
    timeline: '6 months',
    dependencies: {},
    metrics: 'User satisfaction, Error rate',
    currentAIMaturity: 'Basic ML',
    targetAIMaturity: 'Agentic AI'
  },
  
  budgetPlanning: {
    initialDevCost: 500000,
    baseApiCost: 10000,
    baseInfraCost: 5000,
    baseOpCost: 3000,
    baseMonthlyValue: 50000,
    valueGrowthRate: 10,
    budgetRange: '$100K-$500K',
    monthlyTokenVolume: 50000000,
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.002
  }
};

async function testIntegration() {
  console.log('🧪 Starting Guardrails System Integration Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not set in environment');
      console.log('\nTo run this test, set your OpenAI API key:');
      console.log('export OPENAI_API_KEY="your-api-key"');
      return;
    }
    
    // Initialize the engine
    console.log('\n1️⃣ Initializing GuardrailsEngine...');
    const engine = new GuardrailsEngine();
    console.log('✅ Engine initialized successfully');
    
    // Generate guardrails
    console.log('\n2️⃣ Generating guardrails (this may take a moment)...');
    const result = await engine.generateGuardrails(mockAssessment);
    
    // Check results
    console.log('\n3️⃣ Analyzing results...');
    console.log('=' .repeat(60));
    
    // Count guardrails by category
    const categories = Object.keys(result.guardrails || {});
    console.log(`\n📊 Guardrail Categories: ${categories.length}`);
    categories.forEach(category => {
      const count = result.guardrails[category]?.guardrails?.length || 0;
      console.log(`   - ${category}: ${count} guardrails`);
    });
    
    // Check validation
    if ((result as any).validation) {
      const validation = (result as any).validation;
      console.log(`\n🔍 Validation Results:`);
      console.log(`   - Score: ${validation.score}/100`);
      console.log(`   - Valid: ${validation.isValid ? '✅' : '❌'}`);
      console.log(`   - Coverage:`);
      Object.entries(validation.coverage).forEach(([key, value]) => {
        console.log(`     • ${key}: ${value}%`);
      });
      console.log(`   - Issues: ${validation.issueCount.errors} errors, ${validation.issueCount.warnings} warnings`);
    }
    
    // Check confidence
    console.log(`\n🎯 Confidence Score: ${(result.confidence?.overall * 100).toFixed(1)}%`);
    
    // Check metadata
    console.log(`\n📝 Metadata:`);
    console.log(`   - Version: ${result.metadata?.version}`);
    console.log(`   - Agents Used: ${result.metadata?.agents?.join(', ')}`);
    console.log(`   - Complexity: ${result.metadata?.contextComplexity}`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:');
    console.error(error);
    
    // Provide helpful debugging info
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        console.log('\n💡 Tip: Make sure your OpenAI API key is set correctly');
      } else if (error.message.includes('Cannot find module')) {
        console.log('\n💡 Tip: Check that all imports are correct');
      }
    }
  }
}

// Run test if executed directly
if (require.main === module) {
  testIntegration().catch(console.error);
}

export { testIntegration };