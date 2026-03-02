/**
 * Test script to verify real AI evaluation functionality
 * Run this to test the AI agent endpoints
 */

const testRealAIEvaluation = async () => {
  console.log('🧪 Testing Real AI Evaluation System...\n');

  const baseUrl = 'http://localhost:3000';
  
  // Test data
  const testInput = "This is a test input for AI evaluation";
  const testScenario = "test-safety-scenario-001";
  
  const agents = [
    { name: 'General', endpoint: '/api/agents/general-evaluate' },
    { name: 'Safety', endpoint: '/api/agents/safety-evaluate' },
    { name: 'Performance', endpoint: '/api/agents/performance-evaluate' },
    { name: 'Compliance', endpoint: '/api/agents/compliance-evaluate' },
    { name: 'Ethics', endpoint: '/api/agents/ethics-evaluate' }
  ];

  for (const agent of agents) {
    try {
      console.log(`Testing ${agent.name} Agent...`);
      
      const response = await fetch(`${baseUrl}${agent.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real test, you'd need proper authentication
          // For now, this will test the endpoint structure
        },
        body: JSON.stringify({
          input: testInput,
          scenario: testScenario,
          testType: agent.name.toLowerCase()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${agent.name} Agent: ${result.content}`);
        console.log(`   - Tokens: ${result.tokens}`);
        console.log(`   - Cost: $${result.cost?.toFixed(4) || 'N/A'}`);
        console.log(`   - Confidence: ${(result.confidence * 100)?.toFixed(1) || 'N/A'}%`);
      } else {
        const error = await response.json();
        console.log(`❌ ${agent.name} Agent failed: ${error.error}`);
      }
    } catch (error) {
      console.log(`❌ ${agent.name} Agent error: ${error.message}`);
    }
    console.log('');
  }

  // Test evaluation runner with real AI
  console.log('Testing Evaluation Runner with Real AI...');
  try {
    const evaluationConfig = {
      id: 'test-eval-001',
      testSuites: [{
        id: 'test-suite-001',
        type: 'safety',
        scenarios: [{
          id: 'test-scenario-001',
          inputs: [{ type: 'prompt', value: testInput }],
          expectedOutputs: [{ type: 'threshold', value: 1000 }],
          assertions: [{ type: 'content_safety', expected: true }],
          metrics: [{ name: 'latency', type: 'gauge' }]
        }]
      }]
    };

    const response = await fetch(`${baseUrl}/api/evaluations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evaluationConfig,
        environment: {
          name: 'production',
          type: 'production',
          configuration: {
            mockResponses: false,  // Use real AI agents
            deterministicMode: false,
            realData: true,
            aiAgentsEnabled: true
          }
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Evaluation Runner with Real AI:');
      console.log(`   - Status: ${result.status}`);
      console.log(`   - Duration: ${result.duration}ms`);
      console.log(`   - Tests run: ${result.testResults?.length || 0}`);
      console.log(`   - Overall score: ${result.scores?.overallScore?.value?.toFixed(1) || 'N/A'}`);
    } else {
      const error = await response.json();
      console.log(`❌ Evaluation Runner failed: ${error.error}`);
    }
  } catch (error) {
    console.log(`❌ Evaluation Runner error: ${error.message}`);
  }

  console.log('\n🎯 Real AI Evaluation Test Complete!');
  console.log('\nTo use real AI evaluation in the UI:');
  console.log('1. Go to the Evaluation Generator');
  console.log('2. Generate evaluations for a use case');
  console.log('3. Select "Real AI Agents" radio button');
  console.log('4. Click "Run Evaluations (Real AI)"');
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testRealAIEvaluation().catch(console.error);
} else {
  // Browser environment
  testRealAIEvaluation().catch(console.error);
}
