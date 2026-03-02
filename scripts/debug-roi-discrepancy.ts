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

async function debugROIDiscrepancy() {
  try {
    console.log('🔍 Debugging ROI Discrepancy...\n');
    
    const finopsRecord = await prisma.finOps.findFirst({
      include: {
        useCase: {
          select: { title: true, aiucId: true }
        }
      }
    });
    
    if (!finopsRecord) {
      console.log('❌ No FinOps record found');
      return;
    }
    
    console.log(`📊 Current Database Values for ${finopsRecord.useCase.title}:`);
    console.log(`   Dev Cost Base: $${finopsRecord.devCostBase.toLocaleString()}`);
    console.log(`   API Cost Base: $${finopsRecord.apiCostBase.toLocaleString()}/month`);
    console.log(`   Infra Cost Base: $${finopsRecord.infraCostBase.toLocaleString()}/month`);
    console.log(`   Op Cost Base: $${finopsRecord.opCostBase.toLocaleString()}/month`);
    console.log(`   Value Base: $${finopsRecord.valueBase.toLocaleString()}/month`);
    console.log(`   Growth Rate: ${(finopsRecord.valueGrowthRate * 100).toFixed(1)}%`);
    console.log(`   Total Investment: $${finopsRecord.totalInvestment.toLocaleString()}`);
    console.log(`   Cumulative Value: $${finopsRecord.cumValue.toLocaleString()}`);
    console.log(`   Net Value: $${finopsRecord.netValue.toLocaleString()}`);
    console.log(`   ROI: ${finopsRecord.ROI.toFixed(2)}%`);
    
    // Manual calculation using same formula as BudgetPlanning and FinancialDashboard
    console.log('\n🧮 Manual Recalculation (36-month forecast):');
    const FORECAST_MONTHS = 36;
    let cumulativeValue = 0;
    let cumulativeOpCosts = 0;
    
    for (let month = 1; month <= FORECAST_MONTHS; month++) {
      const apiCost = finopsRecord.apiCostBase * Math.pow(1.12, month / 12);
      const infraCost = finopsRecord.infraCostBase * Math.pow(1.05, month / 12);
      const opCost = finopsRecord.opCostBase * Math.pow(1.08, month / 12);
      const totalMonthlyCost = apiCost + infraCost + opCost;
      const monthlyValue = finopsRecord.valueBase * Math.pow(1 + finopsRecord.valueGrowthRate, month / 12);
      
      cumulativeValue += monthlyValue;
      cumulativeOpCosts += totalMonthlyCost;
    }
    
    const calculatedTotalInvestment = finopsRecord.devCostBase + cumulativeOpCosts;
    const calculatedNetValue = cumulativeValue - calculatedTotalInvestment;
    const calculatedROI = calculatedTotalInvestment > 0 ? (calculatedNetValue / calculatedTotalInvestment) * 100 : 0;
    
    console.log(`   Expected Total Investment: $${calculatedTotalInvestment.toLocaleString()}`);
    console.log(`   Expected Cumulative Value: $${cumulativeValue.toLocaleString()}`);
    console.log(`   Expected Net Value: $${calculatedNetValue.toLocaleString()}`);
    console.log(`   Expected ROI: ${calculatedROI.toFixed(2)}%`);
    
    // Compare with stored values
    console.log('\n📊 Comparison (DB vs Calculated):');
    console.log(`   Total Investment: $${finopsRecord.totalInvestment.toLocaleString()} vs $${calculatedTotalInvestment.toLocaleString()} (diff: ${Math.abs(finopsRecord.totalInvestment - calculatedTotalInvestment).toFixed(2)})`);
    console.log(`   Cumulative Value: $${finopsRecord.cumValue.toLocaleString()} vs $${cumulativeValue.toLocaleString()} (diff: ${Math.abs(finopsRecord.cumValue - cumulativeValue).toFixed(2)})`);
    console.log(`   Net Value: $${finopsRecord.netValue.toLocaleString()} vs $${calculatedNetValue.toLocaleString()} (diff: ${Math.abs(finopsRecord.netValue - calculatedNetValue).toFixed(2)})`);
    console.log(`   ROI: ${finopsRecord.ROI.toFixed(2)}% vs ${calculatedROI.toFixed(2)}% (diff: ${Math.abs(finopsRecord.ROI - calculatedROI).toFixed(2)}%)`);
    
    // Check if the issue is with the stored valueBase
    console.log('\n🔍 Investigating Value Base Issue:');
    console.log(`   Current valueBase in DB: $${finopsRecord.valueBase.toLocaleString()}/month`);
    console.log(`   If valueBase was $1,000,000/month (as in screenshot):`);
    
    // Recalculate with $1M value base
    const highValueBase = 1000000;
    cumulativeValue = 0;
    
    for (let month = 1; month <= FORECAST_MONTHS; month++) {
      const monthlyValue = highValueBase * Math.pow(1 + finopsRecord.valueGrowthRate, month / 12);
      cumulativeValue += monthlyValue;
    }
    
    const highValueNetValue = cumulativeValue - calculatedTotalInvestment;
    const highValueROI = calculatedTotalInvestment > 0 ? (highValueNetValue / calculatedTotalInvestment) * 100 : 0;
    
    console.log(`     Cumulative Value: $${cumulativeValue.toLocaleString()}`);
    console.log(`     Net Value: $${highValueNetValue.toLocaleString()}`);
    console.log(`     ROI: ${highValueROI.toFixed(1)}%`);
    
    if (Math.abs(highValueROI - 10838.1) < 1) {
      console.log('   🎯 FOUND THE ISSUE: The screenshot shows results for $1M/month value base!');
      console.log('   📝 Current DB has $10K/month value base, but calculations were done with $1M/month');
    }
    
    console.log('\n💡 Executive Dashboard Impact:');
    console.log('   The executive dashboard shows values based on CURRENT database records');
    console.log('   If financial dashboard shows different values, there may be:');
    console.log('   1. Unsaved changes in the UI');
    console.log('   2. Cached old calculations');
    console.log('   3. Different input parameters being used');
    
  } catch (error) {
    console.error('❌ Error debugging ROI discrepancy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugROIDiscrepancy();