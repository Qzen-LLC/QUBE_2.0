#!/usr/bin/env tsx

// Load environment variables manually
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

async function checkGovernanceData() {
  console.log('🔍 Checking Governance Data...\n');

  try {
    // Check use cases
    console.log('📋 Use Cases:');
    const useCases = await prisma.useCase.findMany({
      select: {
        aiucId: true,
        title: true,
        stage: true,
        organization: {
          select: { name: true }
        }
      }
    });
    
    if (useCases.length === 0) {
      console.log('❌ No use cases found in database');
      console.log('   This is why governance page shows "No Governance Data Found"');
      console.log('   Need to create use cases first.');
    } else {
      console.log(`✅ Found ${useCases.length} use cases:`);
      useCases.forEach((uc, i) => {
        console.log(`   ${i + 1}. ${uc.title} (${uc.stage || 'No Stage'}) - Org: ${uc.organization?.name || 'Unknown'}`);
      });
    }

    // Check EU AI Act data
    console.log('\n🇪🇺 EU AI Act Framework:');
    const euTopics = await prisma.euAiActTopic.count();
    const euQuestions = await prisma.euAiActQuestion.count();
    const euAssessments = await prisma.euAiActAssessment.count();
    
    console.log(`   Topics: ${euTopics}`);
    console.log(`   Questions: ${euQuestions}`);
    console.log(`   Assessments: ${euAssessments}`);

    // Check ISO 42001 data
    console.log('\n🏢 ISO 42001 Framework:');
    const isoClauses = await prisma.iso42001Clause.count();
    const isoAssessments = await prisma.iso42001Assessment.count();
    
    console.log(`   Clauses: ${isoClauses}`);
    console.log(`   Assessments: ${isoAssessments}`);

    // Check organizations
    console.log('\n🏢 Organizations:');
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        useCases: {
          select: {
            aiucId: true,
            title: true
          }
        }
      }
    });
    
    if (orgs.length === 0) {
      console.log('❌ No organizations found');
    } else {
      console.log(`✅ Found ${orgs.length} organizations:`);
      orgs.forEach((org, i) => {
        console.log(`   ${i + 1}. ${org.name} (${org.useCases.length} use cases)`);
      });
    }

    // Check users
    console.log('\n👤 Users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        organization: {
          select: { name: true }
        }
      }
    });
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.role}) - Org: ${user.organization?.name || 'None'}`);
    });

    console.log('\n🔧 Recommendations:');
    if (useCases.length === 0) {
      console.log('1. Create use cases first - governance shows compliance for existing use cases');
      console.log('2. Then run EU AI Act and ISO 42001 assessments on those use cases');
      console.log('3. Governance page will then show the compliance data');
    } else {
      console.log('1. Use cases exist, check if assessments are created');
      console.log('2. Navigate to specific use cases and run assessments');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkGovernanceData();
}

export default checkGovernanceData;