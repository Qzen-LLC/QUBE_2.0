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

async function checkFinOpsCalculations() {
  try {
    console.log('🔍 Checking FinOps calculations...\n');
    
    // Get all FinOps records with their use cases
    const finopsRecords = await prisma.finOps.findMany({
      include: {
        useCase: {
          select: {
            id: true,
            title: true,
            aiucId: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${finopsRecords.length} FinOps records:`);
    
    if (finopsRecords.length === 0) {
      console.log('⚠️  No FinOps records found in database');
      return;
    }
    
    // Check each record for calculation accuracy
    for (const record of finopsRecords) {
      console.log(`\n🎯 Use Case: ${record.useCase.title} (AIUC-${record.useCase.aiucId})`);
      console.log('   Base values:');
      console.log(`     Dev Cost: $${record.devCostBase.toLocaleString()}`);
      console.log(`     API Cost: $${record.apiCostBase.toLocaleString()}/month`);
      console.log(`     Infra Cost: $${record.infraCostBase.toLocaleString()}/month`);
      console.log(`     Op Cost: $${record.opCostBase.toLocaleString()}/month`);
      console.log(`     Value Base: $${record.valueBase.toLocaleString()}/month`);
      console.log(`     Growth Rate: ${(record.valueGrowthRate * 100).toFixed(1)}%`);
      
      console.log('   Calculated values (36-month forecast):');
      console.log(`     Total Investment: $${record.totalInvestment.toLocaleString()}`);
      console.log(`     Cumulative Op Cost: $${record.cumOpCost.toLocaleString()}`);
      console.log(`     Cumulative Value: $${record.cumValue.toLocaleString()}`);
      console.log(`     Net Value: $${record.netValue.toLocaleString()}`);
      console.log(`     ROI: ${record.ROI.toFixed(1)}%`);
      
      // Verify calculations manually
      const FORECAST_MONTHS = 36;
      let cumulativeValue = 0;
      let cumulativeOpCosts = 0;
      
      for (let month = 1; month <= FORECAST_MONTHS; month++) {
        const apiCost = record.apiCostBase * Math.pow(1.12, month / 12);
        const infraCost = record.infraCostBase * Math.pow(1.05, month / 12);
        const opCost = record.opCostBase * Math.pow(1.08, month / 12);
        const totalMonthlyCost = apiCost + infraCost + opCost;
        const monthlyValue = record.valueBase * Math.pow(1 + record.valueGrowthRate, month / 12);
        
        cumulativeValue += monthlyValue;
        cumulativeOpCosts += totalMonthlyCost;
      }
      
      const calculatedTotalInvestment = record.devCostBase + cumulativeOpCosts;
      const calculatedNetValue = cumulativeValue - calculatedTotalInvestment;
      const calculatedROI = calculatedTotalInvestment > 0 ? (calculatedNetValue / calculatedTotalInvestment) * 100 : 0;
      
      console.log('   Manual verification:');
      console.log(`     Expected Total Investment: $${calculatedTotalInvestment.toLocaleString()}`);
      console.log(`     Expected Cumulative Op Cost: $${cumulativeOpCosts.toLocaleString()}`);
      console.log(`     Expected Cumulative Value: $${cumulativeValue.toLocaleString()}`);
      console.log(`     Expected Net Value: $${calculatedNetValue.toLocaleString()}`);
      console.log(`     Expected ROI: ${calculatedROI.toFixed(1)}%`);
      
      // Check for discrepancies
      const totalInvestmentDiff = Math.abs(record.totalInvestment - calculatedTotalInvestment);
      const cumOpCostDiff = Math.abs(record.cumOpCost - cumulativeOpCosts);
      const cumValueDiff = Math.abs(record.cumValue - cumulativeValue);
      const netValueDiff = Math.abs(record.netValue - calculatedNetValue);
      const roiDiff = Math.abs(record.ROI - calculatedROI);
      
      console.log('   Discrepancies:');
      if (totalInvestmentDiff > 1) {
        console.log(`     ❌ Total Investment: ${totalInvestmentDiff.toFixed(2)} difference`);
      } else {
        console.log('     ✅ Total Investment: Match');
      }
      
      if (cumOpCostDiff > 1) {
        console.log(`     ❌ Cumulative Op Cost: ${cumOpCostDiff.toFixed(2)} difference`);
      } else {
        console.log('     ✅ Cumulative Op Cost: Match');
      }
      
      if (cumValueDiff > 1) {
        console.log(`     ❌ Cumulative Value: ${cumValueDiff.toFixed(2)} difference`);
      } else {
        console.log('     ✅ Cumulative Value: Match');
      }
      
      if (netValueDiff > 1) {
        console.log(`     ❌ Net Value: ${netValueDiff.toFixed(2)} difference`);
      } else {
        console.log('     ✅ Net Value: Match');
      }
      
      if (roiDiff > 0.1) {
        console.log(`     ❌ ROI: ${roiDiff.toFixed(2)}% difference`);
      } else {
        console.log('     ✅ ROI: Match');
      }
    }
    
    console.log('\n📈 FinOps Calculation Check Complete!');
    
  } catch (error) {
    console.error('❌ Error checking calculations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinOpsCalculations();