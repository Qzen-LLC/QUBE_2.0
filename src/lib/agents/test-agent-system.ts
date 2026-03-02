#!/usr/bin/env node

/**
 * Test script to verify the updated agent system generates real guardrails using LLM
 * This script simulates the guardrail generation process with sample assessment data
 */

import { TechnicalOptimizerAgent } from './specialists/TechnicalOptimizerAgent';
import { ComplianceExpertAgent } from './specialists/ComplianceExpertAgent';
import { EthicsAnalystAgent } from './specialists/EthicsAdvisorAgent';
import { RiskAnalystAgent } from './specialists/RiskAnalystAgent';
import { SecurityExpertAgent } from './specialists/SecurityArchitectAgent';
import { BusinessStrategistAgent } from './specialists/BusinessStrategistAgent';

// Sample assessment data for testing
const sampleAssessment = {
  useCaseTitle: 'Customer Service AI Assistant',
  problemStatement: 'High volume of repetitive customer inquiries leading to long wait times',
  proposedSolution: 'Deploy an AI-powered chatbot to handle common customer queries',
  successCriteria: 'Reduce average response time by 70% and improve customer satisfaction scores',
  
  technicalFeasibility: {
    modelTypes: ['Large Language Model (LLM)', 'Natural Language Processing (NLP)'],
    modelProvider: 'OpenAI',
    modelSize: 'Large (>10B parameters)',
    deploymentModels: ['Cloud', 'Multi-region'],
    scalingRequirements: 'Auto-scaling based on traffic',
    technicalComplexity: 7,
    integrationPoints: ['CRM System', 'Knowledge Base', 'Ticketing System'],
    latencyRequirements: '<2 seconds',
    throughputRequirements: '1000 requests/minute',
    monitoringTools: ['Datadog', 'CloudWatch'],
    loggingStrategy: 'Centralized logging with ELK stack'
  },
  
  riskAssessment: {
    riskLevel: 'Medium',
    dataProtection: {
      jurisdictions: ['GDPR (EU)', 'CCPA (California)']
    },
    technicalRisks: ['Model hallucination', 'Data privacy concerns'],
    businessRisks: ['Customer trust', 'Brand reputation'],
    ethicalRisks: ['Bias in responses', 'Transparency']
  },
  
  ethicalImpact: {
    biasAnalysis: {
      historicalBias: true,
      demographicGaps: ['Age groups', 'Language proficiency'],
      mitigationStrategies: ['Diverse training data', 'Regular bias audits']
    },
    modelEthics: {
      explainability: 'Partial',
      biasTesting: true,
      fairnessMetrics: ['Demographic parity', 'Equal opportunity']
    },
    decisionMaking: {
      automationLevel: 'Human-in-the-loop',
      decisionTypes: ['Information provision', 'Basic troubleshooting'],
      impactLevel: 'Medium'
    },
    aiGovernance: {
      humanOversightLevel: 'Active monitoring',
      performanceMonitoring: true,
      auditFrequency: 'Quarterly'
    }
  },
  
  dataReadiness: {
    dataTypes: ['Customer Messages', 'Support Tickets', 'Product Documentation'],
    dataQuality: 'High',
    dataVolume: 'Large (>1TB)',
    dataSources: ['CRM', 'Support System', 'Knowledge Base']
  },
  
  businessFeasibility: {
    systemCriticality: 'Business Critical',
    genAIUseCase: 'Customer Support Automation',
    userCategories: ['Customers', 'Support Agents'],
    userVolume: '50,000+ daily users',
    stakeholderGroups: ['Customer Service', 'IT', 'Legal', 'Marketing']
  }
};

async function testAgent(AgentClass: any, agentName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${agentName}`);
  console.log('='.repeat(60));
  
  try {
    const agent = new AgentClass();
    const context = { assessment: sampleAssessment };
    
    console.log(`\n🔄 Processing with ${agentName}...`);
    const response = await agent.analyzeAndPropose(context);
    
    console.log(`\n✅ ${agentName} Response:`);
    console.log(`  - Guardrails Generated: ${response.guardrails.length}`);
    console.log(`  - Insights: ${response.insights.length}`);
    console.log(`  - Concerns: ${response.concerns.length}`);
    console.log(`  - Recommendations: ${response.recommendations.length}`);
    console.log(`  - Confidence: ${(response.confidence * 100).toFixed(1)}%`);
    
    if (response.guardrails.length > 0) {
      console.log('\n📋 Sample Guardrails:');
      response.guardrails.slice(0, 2).forEach(g => {
        console.log(`  • ${g.rule}: ${g.description}`);
      });
    }
    
    if (response.insights.length > 0) {
      console.log('\n💡 Insights:');
      response.insights.slice(0, 2).forEach(i => {
        console.log(`  • ${i}`);
      });
    }
    
    return response;
  } catch (error) {
    console.error(`❌ Error testing ${agentName}:`, error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Agent System Test');
  console.log('================================');
  console.log('This test will verify that all agents generate real guardrails using LLM');
  
  const agents = [
    { Class: TechnicalOptimizerAgent, name: 'Technical Optimizer Agent' },
    { Class: ComplianceExpertAgent, name: 'Compliance Expert Agent' },
    { Class: EthicsAnalystAgent, name: 'Ethics Analyst Agent' },
    { Class: RiskAnalystAgent, name: 'Risk Analyst Agent' },
    { Class: SecurityExpertAgent, name: 'Security Expert Agent' },
    { Class: BusinessStrategistAgent, name: 'Business Strategist Agent' }
  ];
  
  const results = [];
  
  for (const { Class, name } of agents) {
    const result = await testAgent(Class, name);
    results.push({ name, success: result !== null, guardrails: result?.guardrails.length || 0 });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  let totalGuardrails = 0;
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.name}: ${r.guardrails} guardrails`);
    totalGuardrails += r.guardrails;
  });
  
  console.log(`\n📊 Total Guardrails Generated: ${totalGuardrails}`);
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} agents tested successfully`);
  
  if (successCount === results.length && totalGuardrails > 0) {
    console.log('\n🎉 SUCCESS: All agents are generating real guardrails using LLM!');
  } else if (totalGuardrails === 0) {
    console.log('\n⚠️  WARNING: No guardrails were generated. Check OpenAI API configuration.');
  } else {
    console.log('\n⚠️  Some agents failed. Please check the errors above.');
  }
}

// Only run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };