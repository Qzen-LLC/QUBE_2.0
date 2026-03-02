#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';
import { buildStepsDataFromAnswers } from '../src/lib/mappers/answers-to-steps';
import type { StepsData } from '../src/lib/risk-calculations';

interface ConversionTest {
  stage: string;
  answerCount: number;
  mappedFields: string[];
  sampleValues: any;
  issues: string[];
}

async function testAnswersConversion() {
  console.log('🔍 Testing Answers to StepsData Conversion\n');
  console.log('='.repeat(70));

  try {
    // Find a use case with substantial answers
    const useCase = await prismaClient.useCase.findFirst({
      where: {
        answers: {
          some: {}
        }
      },
      include: {
        _count: {
          select: {
            answers: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!useCase) {
      console.log('❌ No use case with answers found');
      process.exit(1);
    }

    console.log(`\n📋 Testing with Use Case: ${useCase.title}`);
    console.log(`   ID: ${useCase.id}`);
    console.log(`   Total Answers: ${useCase._count.answers}\n`);

    // Get all raw answers
    const rawAnswers = await prismaClient.answer.findMany({
      where: { useCaseId: useCase.id },
      include: {
        question: true,
        questionTemplate: true
      }
    });

    console.log(`📊 Raw Answers Analysis:\n`);
    
    // Group answers by stage
    const answersByStage: Record<string, typeof rawAnswers> = {};
    rawAnswers.forEach(answer => {
      const stage = answer.question?.stage || answer.questionTemplate?.stage || 'UNKNOWN';
      if (!answersByStage[stage]) {
        answersByStage[stage] = [];
      }
      answersByStage[stage].push(answer);
    });

    // Get converted data
    const convertedData = await buildStepsDataFromAnswers(useCase.id);

    // Test each stage conversion
    const conversionTests: ConversionTest[] = [];

    // DATA_READINESS
    const dataReadinessAnswers = answersByStage['DATA_READINESS'] || [];
    if (dataReadinessAnswers.length > 0) {
      const test: ConversionTest = {
        stage: 'DATA_READINESS',
        answerCount: dataReadinessAnswers.length,
        mappedFields: [],
        sampleValues: {},
        issues: []
      };

      const converted = convertedData.dataReadiness || {};
      
      // Check what fields should be mapped
      const expectedFields = ['dataTypes', 'dataVolume', 'crossBorderTransfer', 'dataUpdate', 'dataRetention'];
      
      expectedFields.forEach(field => {
        if (field in converted && converted[field as keyof typeof converted]) {
          test.mappedFields.push(field);
          test.sampleValues[field] = converted[field as keyof typeof converted];
        }
      });

      // Check for data types
      dataReadinessAnswers.forEach(answer => {
        const value = answer.value as any;
        const labels = Array.isArray(value?.labels) ? value.labels : [];
        const text = value?.text || '';
        
        const sensitiveTypes = ['Health/Medical Records', 'Financial Records', 'Biometric Data', "Children's Data (under 16)"];
        const hasSensitiveData = labels.some((l: string) => sensitiveTypes.includes(l));
        
        if (hasSensitiveData && !converted.dataTypes?.length) {
          test.issues.push(`Sensitive data types found in answers but not in converted data`);
        }
      });

      conversionTests.push(test);
    }

    // TECHNICAL_FEASIBILITY
    const technicalAnswers = answersByStage['TECHNICAL_FEASIBILITY'] || [];
    if (technicalAnswers.length > 0) {
      const test: ConversionTest = {
        stage: 'TECHNICAL_FEASIBILITY',
        answerCount: technicalAnswers.length,
        mappedFields: [],
        sampleValues: {},
        issues: []
      };

      const converted = convertedData.technicalFeasibility || {};
      const expectedFields = ['authentication', 'encryption', 'accessControl', 'apiSecurity', 'incidentResponse', 'authMethods', 'encryptionStandards', 'monitoringTools'];
      
      expectedFields.forEach(field => {
        if (field in converted && converted[field as keyof typeof converted]) {
          test.mappedFields.push(field);
          test.sampleValues[field] = converted[field as keyof typeof converted];
        }
      });

      conversionTests.push(test);
    }

    // BUSINESS_FEASIBILITY
    const businessAnswers = answersByStage['BUSINESS_FEASIBILITY'] || [];
    if (businessAnswers.length > 0) {
      const test: ConversionTest = {
        stage: 'BUSINESS_FEASIBILITY',
        answerCount: businessAnswers.length,
        mappedFields: [],
        sampleValues: {},
        issues: []
      };

      const converted = convertedData.businessFeasibility || {};
      const expectedFields = ['businessCriticality', 'sla', 'disasterRecovery', 'changeManagement', 'systemCriticality', 'failureImpact'];
      
      expectedFields.forEach(field => {
        if (field in converted && converted[field as keyof typeof converted]) {
          test.mappedFields.push(field);
          test.sampleValues[field] = converted[field as keyof typeof converted];
        }
      });

      conversionTests.push(test);
    }

    // ETHICAL_IMPACT
    const ethicalAnswers = answersByStage['ETHICAL_IMPACT'] || [];
    if (ethicalAnswers.length > 0) {
      const test: ConversionTest = {
        stage: 'ETHICAL_IMPACT',
        answerCount: ethicalAnswers.length,
        mappedFields: [],
        sampleValues: {},
        issues: []
      };

      const converted = convertedData.ethicalImpact || {};
      const expectedFields = ['biasDetection', 'humanOversight', 'transparencyLevel', 'appealProcess', 'biasFairness'];
      
      expectedFields.forEach(field => {
        if (field in converted && converted[field as keyof typeof converted]) {
          test.mappedFields.push(field);
          if (field === 'biasFairness' && typeof converted.biasFairness === 'object') {
            test.sampleValues[field] = Object.keys(converted.biasFairness);
          } else {
            test.sampleValues[field] = converted[field as keyof typeof converted];
          }
        }
      });

      conversionTests.push(test);
    }

    // RISK_ASSESSMENT
    const riskAnswers = answersByStage['RISK_ASSESSMENT'] || [];
    if (riskAnswers.length > 0) {
      const test: ConversionTest = {
        stage: 'RISK_ASSESSMENT',
        answerCount: riskAnswers.length,
        mappedFields: [],
        sampleValues: {},
        issues: []
      };

      const converted = convertedData.riskAssessment || {};
      
      // Check for various risk assessment fields
      if (converted.dataProtection?.jurisdictions) {
        test.mappedFields.push('dataProtection.jurisdictions');
        test.sampleValues['jurisdictions'] = converted.dataProtection.jurisdictions;
      }
      
      if (converted.operatingJurisdictions && Object.keys(converted.operatingJurisdictions).length > 0) {
        test.mappedFields.push('operatingJurisdictions');
        test.sampleValues['operatingJurisdictions'] = Object.keys(converted.operatingJurisdictions);
      }
      
      if (converted.complianceReporting) {
        test.mappedFields.push('complianceReporting');
        test.sampleValues['complianceReporting'] = converted.complianceReporting;
      }
      
      if (converted.riskTolerance) {
        test.mappedFields.push('riskTolerance');
        test.sampleValues['riskTolerance'] = converted.riskTolerance;
      }
      
      if (converted.modelRisks && Object.keys(converted.modelRisks).length > 0) {
        test.mappedFields.push('modelRisks');
        test.sampleValues['modelRisks'] = converted.modelRisks;
      }
      
      if (converted.agentRisks && Object.keys(converted.agentRisks).length > 0) {
        test.mappedFields.push('agentRisks');
        test.sampleValues['agentRisks'] = converted.agentRisks;
      }
      
      if (converted.technicalRisks && Array.isArray(converted.technicalRisks) && converted.technicalRisks.length > 0) {
        test.mappedFields.push('technicalRisks');
        test.sampleValues['technicalRisks'] = converted.technicalRisks.length;
      }
      
      if (converted.businessRisks && Array.isArray(converted.businessRisks) && converted.businessRisks.length > 0) {
        test.mappedFields.push('businessRisks');
        test.sampleValues['businessRisks'] = converted.businessRisks.length;
      }

      conversionTests.push(test);
    }

    // Display results
    console.log('📊 Conversion Analysis by Stage:\n');
    
    let totalIssues = 0;
    let totalMappedFields = 0;
    
    conversionTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.stage}`);
      console.log(`   📝 Answers: ${test.answerCount}`);
      console.log(`   ✅ Mapped Fields: ${test.mappedFields.length} (${test.mappedFields.join(', ')})`);
      
      if (test.mappedFields.length > 0) {
        console.log(`   📋 Sample Values:`);
        Object.entries(test.sampleValues).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            console.log(`      - ${key}: [${value.length} items] ${JSON.stringify(value.slice(0, 3))}${value.length > 3 ? '...' : ''}`);
          } else if (typeof value === 'object' && value !== null) {
            console.log(`      - ${key}: ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
          } else {
            console.log(`      - ${key}: ${value}`);
          }
        });
      } else {
        console.log(`   ⚠️  No fields mapped (answers exist but conversion didn't extract data)`);
        totalIssues++;
      }
      
      if (test.issues.length > 0) {
        console.log(`   ❌ Issues:`);
        test.issues.forEach(issue => {
          console.log(`      - ${issue}`);
          totalIssues++;
        });
      }
      
      totalMappedFields += test.mappedFields.length;
      console.log('');
    });

    // Detailed sample comparison
    console.log('\n🔍 Detailed Sample Comparison:\n');
    
    // Pick a few sample answers and show their conversion
    const sampleAnswers = rawAnswers.slice(0, 5);
    
    sampleAnswers.forEach((answer, idx) => {
      const stage = answer.question?.stage || answer.questionTemplate?.stage || 'UNKNOWN';
      const questionText = answer.question?.text || answer.questionTemplate?.text || 'N/A';
      const value = answer.value as any;
      
      console.log(`Sample ${idx + 1}:`);
      console.log(`  Stage: ${stage}`);
      console.log(`  Question: ${questionText.substring(0, 60)}...`);
      console.log(`  Answer Value: ${JSON.stringify(value).substring(0, 100)}...`);
      
      // Check if this answer was converted
      let foundInConversion = false;
      switch (stage) {
        case 'DATA_READINESS':
          if (convertedData.dataReadiness) {
            const dr = convertedData.dataReadiness;
            const labels = Array.isArray(value?.labels) ? value.labels : [];
            if (labels.some((l: string) => dr.dataTypes?.includes(l))) {
              foundInConversion = true;
              console.log(`  ✅ Found in conversion: dataTypes`);
            }
            if (value?.text && dr.dataVolume === value.text) {
              foundInConversion = true;
              console.log(`  ✅ Found in conversion: dataVolume`);
            }
          }
          break;
        case 'RISK_ASSESSMENT':
          if (convertedData.riskAssessment) {
            const ra = convertedData.riskAssessment;
            const labels = Array.isArray(value?.labels) ? value.labels : [];
            if (labels.some((l: string) => ra.dataProtection?.jurisdictions?.includes(l))) {
              foundInConversion = true;
              console.log(`  ✅ Found in conversion: jurisdictions`);
            }
          }
          break;
      }
      
      if (!foundInConversion) {
        console.log(`  ⚠️  Not clearly mapped in conversion (may be processed differently)`);
      }
      console.log('');
    });

    // Summary
    console.log('='.repeat(70));
    console.log('📊 Conversion Summary:\n');
    console.log(`Total Answers: ${rawAnswers.length}`);
    console.log(`Stages with Answers: ${Object.keys(answersByStage).length}`);
    console.log(`Total Mapped Fields: ${totalMappedFields}`);
    console.log(`Total Issues Found: ${totalIssues}`);
    
    const conversionRate = rawAnswers.length > 0 
      ? ((totalMappedFields / rawAnswers.length) * 100).toFixed(1)
      : 0;
    
    console.log(`\nConversion Coverage:`);
    console.log(`  - Answers processed: ${rawAnswers.length}`);
    console.log(`  - Fields extracted: ${totalMappedFields}`);
    console.log(`  - Note: Not all answers map to fields (some are used for validation, some are arrays, etc.)`);
    
    if (totalIssues === 0 && totalMappedFields > 0) {
      console.log('\n✅ Conversion is working correctly!');
      console.log('   All answers are being processed and relevant data is extracted.');
      process.exit(0);
    } else if (totalMappedFields > 0) {
      console.log('\n⚠️  Conversion is working but has some issues:');
      console.log(`   - ${totalIssues} issue(s) found`);
      console.log('   - Review the details above');
      process.exit(1);
    } else {
      console.log('\n❌ Conversion may not be working correctly:');
      console.log('   - No fields were mapped from answers');
      console.log('   - Check the conversion logic');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error during conversion testing:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the test
testAnswersConversion().catch(console.error);

