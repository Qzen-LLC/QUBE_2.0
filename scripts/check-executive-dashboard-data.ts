#!/usr/bin/env tsx

// Load environment variables
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('Warning: Could not load .env file');
}

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function checkExecutiveDashboardData() {
  try {
    console.log('🔍 Checking Executive Dashboard Data Sources...\n');
    
    // Check use cases
    const useCases = await prisma.useCase.findMany({
      select: {
        id: true,
        title: true,
        aiucId: true,
        stage: true,
        businessFunction: true,
        operationalImpactScore: true,
        productivityImpactScore: true,
        revenueImpactScore: true,
        implementationComplexity: true,
        confidenceLevel: true,
        priority: true,
        finopsData: {
          select: {
            totalInvestment: true,
            ROI: true,
            cumValue: true,
            netValue: true,
            devCostBase: true,
            infraCostBase: true,
            opCostBase: true,
            apiCostBase: true
          }
        },
        Approval: {
          select: {
            governanceStatus: true,
            riskStatus: true,
            legalStatus: true,
            businessStatus: true
          }
        }
      }
    });
    
    console.log(`📊 Total Use Cases: ${useCases.length}`);
    
    if (useCases.length === 0) {
      console.log('⚠️  No use cases found - Executive Dashboard will show zero values');
      return;
    }
    
    // Analyze the data to identify dummy vs real values
    console.log('\n📋 Use Case Analysis:');
    
    let realDataCount = 0;
    let potentialDummyCount = 0;
    let hasFinOpsData = 0;
    let hasApprovalData = 0;
    
    const stages = new Map<string, number>();
    const businessFunctions = new Map<string, number>();
    const priorities = new Map<string, number>();
    
    for (const uc of useCases) {
      console.log(`\n🎯 ${uc.title} (AIUC-${uc.aiucId})`);
      console.log(`   Stage: ${uc.stage}`);
      console.log(`   Business Function: ${uc.businessFunction || 'Not specified'}`);
      console.log(`   Priority: ${uc.priority || 'Not specified'}`);
      console.log(`   Impact Scores: Op=${uc.operationalImpactScore}, Prod=${uc.productivityImpactScore}, Rev=${uc.revenueImpactScore}`);
      console.log(`   Complexity: ${uc.implementationComplexity}, Confidence: ${uc.confidenceLevel}%`);
      
      // Count stages
      stages.set(uc.stage, (stages.get(uc.stage) || 0) + 1);
      
      // Count business functions
      if (uc.businessFunction) {
        businessFunctions.set(uc.businessFunction, (businessFunctions.get(uc.businessFunction) || 0) + 1);
      }
      
      // Count priorities
      if (uc.priority) {
        priorities.set(uc.priority, (priorities.get(uc.priority) || 0) + 1);
      }
      
      // Check for FinOps data
      if (uc.finopsData) {
        hasFinOpsData++;
        console.log(`   FinOps: Investment=$${uc.finopsData.totalInvestment?.toLocaleString()}, ROI=${uc.finopsData.ROI?.toFixed(1)}%, Net Value=$${uc.finopsData.netValue?.toLocaleString()}`);
        
        // Check if this looks like dummy data (very round numbers or unrealistic values)
        const investment = uc.finopsData.totalInvestment || 0;
        const roi = uc.finopsData.ROI || 0;
        
        if (investment > 0 && roi > 0) {
          // Check for patterns indicating real vs dummy data
          if (roi > 5000 || investment % 1000 === 0 && investment > 100000) {
            console.log('   ⚠️  Potentially dummy/test FinOps data (very high ROI or round numbers)');
            potentialDummyCount++;
          } else {
            realDataCount++;
          }
        }
      } else {
        console.log('   ❌ No FinOps data');
      }
      
      // Check for approval data
      if (uc.Approval) {
        hasApprovalData++;
        console.log(`   Approvals: Gov=${uc.Approval.governanceStatus || 'pending'}, Risk=${uc.Approval.riskStatus || 'pending'}, Legal=${uc.Approval.legalStatus || 'pending'}, Business=${uc.Approval.businessStatus || 'pending'}`);
      } else {
        console.log('   ❌ No approval data');
      }
    }
    
    // Summary analysis
    console.log('\n📈 Executive Dashboard Data Summary:');
    console.log(`   Total Use Cases: ${useCases.length}`);
    console.log(`   Use Cases with FinOps data: ${hasFinOpsData}/${useCases.length} (${((hasFinOpsData/useCases.length)*100).toFixed(1)}%)`);
    console.log(`   Use Cases with Approval data: ${hasApprovalData}/${useCases.length} (${((hasApprovalData/useCases.length)*100).toFixed(1)}%)`);
    console.log(`   Potentially real financial data: ${realDataCount}`);
    console.log(`   Potentially dummy/test data: ${potentialDummyCount}`);
    
    console.log('\n📊 Data Distribution:');
    console.log('   Stages:');
    for (const [stage, count] of stages.entries()) {
      console.log(`     ${stage}: ${count} use cases`);
    }
    
    console.log('   Business Functions:');
    for (const [func, count] of businessFunctions.entries()) {
      console.log(`     ${func}: ${count} use cases`);
    }
    
    if (priorities.size > 0) {
      console.log('   Priorities:');
      for (const [priority, count] of priorities.entries()) {
        console.log(`     ${priority}: ${count} use cases`);
      }
    }
    
    // Calculate what the executive dashboard will show
    console.log('\n🎯 Executive Dashboard Calculations:');
    
    const totalFinOpsInvestment = useCases.reduce((sum, uc) => sum + (uc.finopsData?.totalInvestment || 0), 0);
    const totalFinOpsValue = useCases.reduce((sum, uc) => sum + (uc.finopsData?.cumValue || 0), 0);
    const avgROI = hasFinOpsData > 0 ? useCases.reduce((sum, uc) => sum + (uc.finopsData?.ROI || 0), 0) / hasFinOpsData : 0;
    
    const avgOperational = useCases.reduce((sum, uc) => sum + (uc.operationalImpactScore || 0), 0) / useCases.length;
    const avgProductivity = useCases.reduce((sum, uc) => sum + (uc.productivityImpactScore || 0), 0) / useCases.length;
    const avgRevenue = useCases.reduce((sum, uc) => sum + (uc.revenueImpactScore || 0), 0) / useCases.length;
    const overallScore = (avgOperational + avgProductivity + avgRevenue) / 3;
    
    const avgComplexity = useCases.reduce((sum, uc) => sum + (uc.implementationComplexity || 0), 0) / useCases.length;
    const avgConfidence = useCases.reduce((sum, uc) => sum + (uc.confidenceLevel || 0), 0) / useCases.length;
    
    console.log(`   Portfolio Score: ${overallScore.toFixed(1)}/10`);
    console.log(`   Avg Complexity: ${avgComplexity.toFixed(1)}/10`);
    console.log(`   Avg Confidence: ${avgConfidence.toFixed(0)}%`);
    console.log(`   Total Investment: $${totalFinOpsInvestment.toLocaleString()}`);
    console.log(`   Projected Value: $${totalFinOpsValue.toLocaleString()}`);
    console.log(`   Average ROI: ${avgROI.toFixed(1)}%`);
    console.log(`   Net Value: $${(totalFinOpsValue - totalFinOpsInvestment).toLocaleString()}`);
    
    // Risk assessment
    let lowRisk = 0, mediumRisk = 0, highRisk = 0;
    let quickWins = 0, highImpactLowComplexity = 0;
    
    for (const uc of useCases) {
      const complexity = uc.implementationComplexity || 0;
      const confidence = uc.confidenceLevel || 0;
      const avgImpact = ((uc.operationalImpactScore || 0) + (uc.productivityImpactScore || 0) + (uc.revenueImpactScore || 0)) / 3;
      
      // Risk calculation (from API logic)
      if (complexity >= 7 && confidence <= 40) highRisk++;
      else if (complexity >= 4 || confidence <= 60) mediumRisk++;
      else lowRisk++;
      
      // Strategic metrics
      if (complexity <= 3 && avgImpact >= 7) quickWins++;
      if (complexity <= 5 && avgImpact >= 8) highImpactLowComplexity++;
    }
    
    console.log(`   Risk Distribution: Low=${lowRisk}, Medium=${mediumRisk}, High=${highRisk}`);
    console.log(`   Quick Wins: ${quickWins}`);
    console.log(`   High Impact Low Complexity: ${highImpactLowComplexity}`);
    
    // Data quality assessment
    console.log('\n🔍 Data Quality Assessment:');
    if (potentialDummyCount > realDataCount) {
      console.log('   ⚠️  WARNING: More potentially dummy/test data than real data detected');
      console.log('   📝 Consider reviewing FinOps data for realistic values');
    } else if (realDataCount > 0) {
      console.log('   ✅ Good mix of realistic financial data detected');
    } else {
      console.log('   ❌ No realistic financial data detected - dashboard may show test values');
    }
    
    if (hasFinOpsData < useCases.length / 2) {
      console.log('   ⚠️  Less than 50% of use cases have FinOps data');
    }
    
    if (hasApprovalData < useCases.length / 2) {
      console.log('   ⚠️  Less than 50% of use cases have approval data');
    }
    
    console.log('\n🎉 Executive Dashboard Data Check Complete!');
    
  } catch (error) {
    console.error('❌ Error checking executive dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExecutiveDashboardData();