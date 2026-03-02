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

async function checkAllDataSources() {
  try {
    console.log('🔍 Comprehensive Data Source Check...\n');
    
    // Check all tables that contribute to executive dashboard
    console.log('📊 Table Counts:');
    const useCaseCount = await prisma.useCase.count();
    const finOpsCount = await prisma.finOps.count();
    const approvalCount = await prisma.approval.count();
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    
    console.log(`   Use Cases: ${useCaseCount}`);
    console.log(`   FinOps Records: ${finOpsCount}`);
    console.log(`   Approval Records: ${approvalCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Organizations: ${orgCount}`);
    
    // Check if there are any use cases with null/zero values that might be affecting calculations
    console.log('\n🔍 Detailed Use Case Data:');
    const detailedUseCases = await prisma.useCase.findMany({
      include: {
        finopsData: true,
        Approval: true,
        user: { select: { firstName: true, lastName: true, role: true } },
        organization: { select: { name: true } }
      }
    });
    
    for (const uc of detailedUseCases) {
      console.log(`\n📝 ${uc.title}`);
      console.log(`   AIUC ID: ${uc.aiucId}`);
      console.log(`   Owner: ${uc.user?.firstName} ${uc.user?.lastName} (${uc.user?.role})`);
      console.log(`   Organization: ${uc.organization?.name || 'None'}`);
      console.log(`   Stage: ${uc.stage}`);
      console.log(`   Created: ${uc.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Business Function: ${uc.businessFunction || 'Not set'}`);
      console.log(`   Priority: ${uc.priority || 'Not set'}`);
      
      // Impact scores
      console.log(`   Impact Scores:`);
      console.log(`     Operational: ${uc.operationalImpactScore ?? 'null'}`);
      console.log(`     Productivity: ${uc.productivityImpactScore ?? 'null'}`);
      console.log(`     Revenue: ${uc.revenueImpactScore ?? 'null'}`);
      
      // Complexity and confidence
      console.log(`   Complexity: ${uc.implementationComplexity ?? 'null'}`);
      console.log(`   Confidence: ${uc.confidenceLevel ?? 'null'}%`);
      
      // FinOps data
      if (uc.finopsData) {
        console.log(`   FinOps Data:`);
        console.log(`     Total Investment: $${uc.finopsData.totalInvestment.toLocaleString()}`);
        console.log(`     ROI: ${uc.finopsData.ROI.toFixed(2)}%`);
        console.log(`     Net Value: $${uc.finopsData.netValue.toLocaleString()}`);
        console.log(`     Cumulative Value: $${uc.finopsData.cumValue.toLocaleString()}`);
        console.log(`     Dev Cost: $${uc.finopsData.devCostBase.toLocaleString()}`);
        console.log(`     API Cost: $${uc.finopsData.apiCostBase.toLocaleString()}/month`);
        console.log(`     Infra Cost: $${uc.finopsData.infraCostBase.toLocaleString()}/month`);
        console.log(`     Op Cost: $${uc.finopsData.opCostBase.toLocaleString()}/month`);
        console.log(`     Value Base: $${uc.finopsData.valueBase.toLocaleString()}/month`);
        console.log(`     Growth Rate: ${(uc.finopsData.valueGrowthRate * 100).toFixed(1)}%`);
      } else {
        console.log(`   ❌ No FinOps data`);
      }
      
      // Approval data
      if (uc.Approval) {
        console.log(`   Approval Status:`);
        console.log(`     Governance: ${uc.Approval.governanceStatus || 'pending'}`);
        console.log(`     Risk: ${uc.Approval.riskStatus || 'pending'}`);
        console.log(`     Legal: ${uc.Approval.legalStatus || 'pending'}`);
        console.log(`     Business: ${uc.Approval.businessStatus || 'pending'}`);
      } else {
        console.log(`   ❌ No approval data`);
      }
    }
    
    // Check for any patterns that might indicate dummy data
    console.log('\n🔍 Data Quality Analysis:');
    
    let suspiciousData = 0;
    let realData = 0;
    
    for (const uc of detailedUseCases) {
      // Check for patterns in impact scores
      const scores = [
        uc.operationalImpactScore,
        uc.productivityImpactScore, 
        uc.revenueImpactScore
      ];
      
      // Check if all scores are round numbers or follow suspicious patterns
      const allRoundNumbers = scores.every(score => score !== null && score % 1 === 0);
      const allSameNumber = scores.every(score => score === scores[0]);
      const hasNullScores = scores.some(score => score === null);
      
      if (allSameNumber && scores[0] !== null) {
        console.log(`   ⚠️  ${uc.title}: All impact scores are identical (${scores[0]}) - potentially dummy`);
        suspiciousData++;
      } else if (hasNullScores) {
        console.log(`   ⚠️  ${uc.title}: Has null impact scores - incomplete data`);
        suspiciousData++;
      } else {
        console.log(`   ✅ ${uc.title}: Impact scores look realistic`);
        realData++;
      }
      
      // Check FinOps data for unrealistic values
      if (uc.finopsData) {
        const roi = uc.finopsData.ROI;
        const investment = uc.finopsData.totalInvestment;
        const valueBase = uc.finopsData.valueBase;
        
        if (roi > 1000) {
          console.log(`   ⚠️  ${uc.title}: ROI of ${roi.toFixed(1)}% seems very high - check if realistic`);
        }
        
        if (valueBase >= 1000000) {
          console.log(`   ⚠️  ${uc.title}: Monthly value of $${valueBase.toLocaleString()} is very high - verify if realistic`);
        }
        
        if (investment > 0 && valueBase > 0) {
          const monthlyROI = (valueBase / investment) * 100;
          if (monthlyROI > 100) {
            console.log(`   ⚠️  ${uc.title}: Monthly ROI of ${monthlyROI.toFixed(1)}% seems very optimistic`);
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Realistic data entries: ${realData}`);
    console.log(`   Potentially suspicious entries: ${suspiciousData}`);
    
    if (suspiciousData > realData) {
      console.log('   🚨 WARNING: More suspicious data than realistic data detected!');
      console.log('   💡 Consider reviewing impact scores and FinOps values for realism');
    } else if (realData > 0) {
      console.log('   ✅ Data quality looks good overall');
    }
    
    console.log('\n🎉 Comprehensive data check complete!');
    
  } catch (error) {
    console.error('❌ Error checking data sources:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllDataSources();