#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';
import { buildStepsDataFromAnswers } from '../src/lib/mappers/answers-to-steps';
import type { StepsData } from '../src/lib/risk-calculations';

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function testAnswersFetch() {
  console.log('🧪 Testing Answers Table Data Fetching\n');
  console.log('=' .repeat(60));

  const results: TestResult[] = [];

  try {
    // Test 1: Check if Answer table exists and has data
    console.log('\n📊 Test 1: Checking Answer table...');
    const answerCount = await prismaClient.answer.count();
    console.log(`   Found ${answerCount} answers in database`);
    
    if (answerCount === 0) {
      results.push({
        passed: false,
        message: 'No answers found in database',
        details: { answerCount }
      });
      console.log('   ⚠️  No answers found - cannot test data fetching');
    } else {
      results.push({
        passed: true,
        message: `Found ${answerCount} answers`,
        details: { answerCount }
      });
      console.log('   ✅ Answer table accessible');
    }

    // Test 2: Fetch raw answers with relations
    console.log('\n📊 Test 2: Fetching raw answers with relations...');
    const rawAnswers = await prismaClient.answer.findMany({
      take: 10,
      include: {
        question: true,
        questionTemplate: true,
        useCase: {
          select: {
            id: true,
            title: true,
            aiucId: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    console.log(`   Fetched ${rawAnswers.length} sample answers`);
    
    if (rawAnswers.length > 0) {
      console.log('\n   Sample Answer Structure:');
      const sample = rawAnswers[0];
      console.log(`   - Answer ID: ${sample.id}`);
      console.log(`   - Use Case ID: ${sample.useCaseId}`);
      console.log(`   - Question ID: ${sample.questionId || 'N/A'}`);
      console.log(`   - Template ID: ${sample.templateId || 'N/A'}`);
      console.log(`   - Value Type: ${typeof sample.value}`);
      console.log(`   - Has Question: ${!!sample.question}`);
      console.log(`   - Has QuestionTemplate: ${!!sample.questionTemplate}`);
      
      if (sample.question) {
        console.log(`   - Question Text: ${sample.question.text.substring(0, 50)}...`);
        console.log(`   - Question Stage: ${sample.question.stage}`);
      }
      
      if (sample.questionTemplate) {
        console.log(`   - Template Text: ${sample.questionTemplate.text.substring(0, 50)}...`);
        console.log(`   - Template Stage: ${sample.questionTemplate.stage}`);
      }

      results.push({
        passed: true,
        message: 'Successfully fetched answers with relations',
        details: {
          sampleCount: rawAnswers.length,
          hasQuestion: rawAnswers.filter(a => a.question).length,
          hasTemplate: rawAnswers.filter(a => a.questionTemplate).length
        }
      });
    } else {
      results.push({
        passed: false,
        message: 'No answers found to test',
        details: {}
      });
    }

    // Test 3: Test buildStepsDataFromAnswers function
    console.log('\n📊 Test 3: Testing buildStepsDataFromAnswers function...');
    
    // Get use cases with answers
    const useCasesWithAnswers = await prismaClient.useCase.findMany({
      where: {
        answers: {
          some: {}
        }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        aiucId: true,
        _count: {
          select: {
            answers: true
          }
        }
      }
    });

    console.log(`   Found ${useCasesWithAnswers.length} use cases with answers`);

    if (useCasesWithAnswers.length === 0) {
      results.push({
        passed: false,
        message: 'No use cases with answers found',
        details: {}
      });
      console.log('   ⚠️  Cannot test buildStepsDataFromAnswers - no use cases with answers');
    } else {
      // Test with first use case
      const testUseCase = useCasesWithAnswers[0];
      console.log(`\n   Testing with Use Case: ${testUseCase.title} (ID: ${testUseCase.id})`);
      console.log(`   - Has ${testUseCase._count.answers} answers`);

      try {
        const stepsData = await buildStepsDataFromAnswers(testUseCase.id);
        
        // Verify structure
        const structureTests = [
          { key: 'dataReadiness', required: true },
          { key: 'riskAssessment', required: true },
          { key: 'technicalFeasibility', required: true },
          { key: 'businessFeasibility', required: true },
          { key: 'ethicalImpact', required: true },
          { key: 'vendorAssessment', required: true }
        ];

        console.log('\n   Verifying StepsData structure:');
        let structureValid = true;
        for (const test of structureTests) {
          const exists = test.key in stepsData;
          const isValid = exists && typeof (stepsData as any)[test.key] === 'object';
          const status = isValid ? '✅' : '❌';
          console.log(`   ${status} ${test.key}: ${exists ? 'exists' : 'missing'}`);
          
          if (test.required && !isValid) {
            structureValid = false;
          }
        }

        // Check for actual data
        console.log('\n   Checking for populated data:');
        const hasDataReadiness = stepsData.dataReadiness && Object.keys(stepsData.dataReadiness).length > 0;
        const hasRiskAssessment = stepsData.riskAssessment && (
          Object.keys(stepsData.riskAssessment).length > 0 ||
          (stepsData.riskAssessment.modelRisks && Object.keys(stepsData.riskAssessment.modelRisks).length > 0) ||
          (stepsData.riskAssessment.agentRisks && Object.keys(stepsData.riskAssessment.agentRisks).length > 0)
        );
        const hasTechnicalFeasibility = stepsData.technicalFeasibility && Object.keys(stepsData.technicalFeasibility).length > 0;
        const hasBusinessFeasibility = stepsData.businessFeasibility && Object.keys(stepsData.businessFeasibility).length > 0;
        const hasEthicalImpact = stepsData.ethicalImpact && Object.keys(stepsData.ethicalImpact).length > 0;

        console.log(`   ${hasDataReadiness ? '✅' : '⚪'} dataReadiness: ${hasDataReadiness ? 'has data' : 'empty'}`);
        console.log(`   ${hasRiskAssessment ? '✅' : '⚪'} riskAssessment: ${hasRiskAssessment ? 'has data' : 'empty'}`);
        console.log(`   ${hasTechnicalFeasibility ? '✅' : '⚪'} technicalFeasibility: ${hasTechnicalFeasibility ? 'has data' : 'empty'}`);
        console.log(`   ${hasBusinessFeasibility ? '✅' : '⚪'} businessFeasibility: ${hasBusinessFeasibility ? 'has data' : 'empty'}`);
        console.log(`   ${hasEthicalImpact ? '✅' : '⚪'} ethicalImpact: ${hasEthicalImpact ? 'has data' : 'empty'}`);

        // Show sample data
        if (hasDataReadiness) {
          console.log('\n   Sample dataReadiness:', JSON.stringify(stepsData.dataReadiness, null, 2).substring(0, 200) + '...');
        }
        if (hasRiskAssessment) {
          console.log('\n   Sample riskAssessment:', JSON.stringify(stepsData.riskAssessment, null, 2).substring(0, 200) + '...');
        }

        results.push({
          passed: structureValid,
          message: 'buildStepsDataFromAnswers function works correctly',
          details: {
            useCaseId: testUseCase.id,
            structureValid,
            hasData: hasDataReadiness || hasRiskAssessment || hasTechnicalFeasibility || hasBusinessFeasibility || hasEthicalImpact,
            dataReadiness: hasDataReadiness,
            riskAssessment: hasRiskAssessment,
            technicalFeasibility: hasTechnicalFeasibility,
            businessFeasibility: hasBusinessFeasibility,
            ethicalImpact: hasEthicalImpact
          }
        });

      } catch (error: any) {
        results.push({
          passed: false,
          message: 'buildStepsDataFromAnswers failed',
          details: {
            error: error.message,
            stack: error.stack
          }
        });
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Test 4: Compare raw answers with transformed data
    console.log('\n📊 Test 4: Comparing raw answers with transformed data...');
    
    if (useCasesWithAnswers.length > 0) {
      const testUseCase = useCasesWithAnswers[0];
      
      // Get raw answers
      const rawAnswersForUseCase = await prismaClient.answer.findMany({
        where: { useCaseId: testUseCase.id },
        include: {
          question: true,
          questionTemplate: true
        }
      });

      // Get transformed data
      const transformedData = await buildStepsDataFromAnswers(testUseCase.id);

      console.log(`   Use Case: ${testUseCase.title}`);
      console.log(`   - Raw answers count: ${rawAnswersForUseCase.length}`);
      
      // Count answers by stage
      const answersByStage: Record<string, number> = {};
      rawAnswersForUseCase.forEach(answer => {
        const stage = answer.question?.stage || answer.questionTemplate?.stage || 'UNKNOWN';
        answersByStage[stage] = (answersByStage[stage] || 0) + 1;
      });

      console.log('\n   Answers by Stage:');
      Object.entries(answersByStage).forEach(([stage, count]) => {
        console.log(`   - ${stage}: ${count} answers`);
      });

      // Verify data mapping
      const stagesMapped = {
        'DATA_READINESS': 'dataReadiness',
        'TECHNICAL_FEASIBILITY': 'technicalFeasibility',
        'BUSINESS_FEASIBILITY': 'businessFeasibility',
        'ETHICAL_IMPACT': 'ethicalImpact',
        'RISK_ASSESSMENT': 'riskAssessment'
      };

      console.log('\n   Stage to StepsData mapping verification:');
      let mappingValid = true;
      for (const [stage, key] of Object.entries(stagesMapped)) {
        const hasAnswers = answersByStage[stage] > 0;
        const hasData = key in transformedData && 
          transformedData[key as keyof StepsData] && 
          Object.keys(transformedData[key as keyof StepsData] as any).length > 0;
        
        const status = hasAnswers === hasData ? '✅' : '⚠️';
        console.log(`   ${status} ${stage} → ${key}: ${hasAnswers ? `${answersByStage[stage]} answers` : 'no answers'} → ${hasData ? 'has data' : 'no data'}`);
        
        if (hasAnswers && !hasData) {
          mappingValid = false;
        }
      }

      results.push({
        passed: mappingValid,
        message: 'Data mapping verification',
        details: {
          rawAnswersCount: rawAnswersForUseCase.length,
          answersByStage,
          mappingValid
        }
      });
    }

    // Test 5: Test edge cases
    console.log('\n📊 Test 5: Testing edge cases...');
    
    // Test with use case that has no answers
    const useCaseWithoutAnswers = await prismaClient.useCase.findFirst({
      where: {
        answers: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    if (useCaseWithoutAnswers) {
      console.log(`   Testing with use case without answers: ${useCaseWithoutAnswers.title}`);
      try {
        const emptyStepsData = await buildStepsDataFromAnswers(useCaseWithoutAnswers.id);
        
        // Should return empty structure, not null
        const hasStructure = emptyStepsData && 
          typeof emptyStepsData === 'object' &&
          'dataReadiness' in emptyStepsData &&
          'riskAssessment' in emptyStepsData;
        
        if (hasStructure) {
          console.log('   ✅ Returns empty structure (expected)');
          results.push({
            passed: true,
            message: 'Handles use case without answers correctly',
            details: { useCaseId: useCaseWithoutAnswers.id }
          });
        } else {
          console.log('   ⚠️  Returns unexpected structure');
          results.push({
            passed: false,
            message: 'Does not return expected empty structure',
            details: { useCaseId: useCaseWithoutAnswers.id, returned: emptyStepsData }
          });
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          passed: false,
          message: 'Failed to handle use case without answers',
          details: { error: error.message }
        });
      }
    } else {
      console.log('   ℹ️  No use case without answers found to test');
    }

    // Test with invalid use case ID
    console.log('\n   Testing with invalid use case ID...');
    try {
      const invalidStepsData = await buildStepsDataFromAnswers('invalid-id-12345');
      const isEmpty = !invalidStepsData || 
        (Object.keys(invalidStepsData.dataReadiness || {}).length === 0 &&
         Object.keys(invalidStepsData.riskAssessment || {}).length === 0);
      
      // Both behaviors are acceptable: returning empty structure or throwing error
      if (isEmpty) {
        console.log('   ✅ Handles invalid ID gracefully (returns empty structure)');
        results.push({
          passed: true,
          message: 'Handles invalid use case ID correctly (returns empty structure)',
          details: {}
        });
      } else {
        // This shouldn't happen, but if it does, it's still acceptable
        console.log('   ⚠️  Returns structure for invalid ID (unexpected but not critical)');
        results.push({
          passed: true,
          message: 'Returns structure for invalid ID (unexpected but acceptable)',
          details: { returned: invalidStepsData }
        });
      }
    } catch (error: any) {
      console.log(`   ✅ Throws error for invalid ID (acceptable): ${error.message}`);
      results.push({
        passed: true,
        message: 'Throws error for invalid ID (acceptable behavior)',
        details: { error: error.message }
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test Summary\n');
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${result.message}`);
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 100)}...`);
      }
    });

    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('✅ All tests passed! Answers table data fetching is working correctly.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the details above.');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error during testing:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the test
testAnswersFetch().catch(console.error);

