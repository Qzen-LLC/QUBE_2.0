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

async function checkUseCases() {
  console.log('🔍 Checking Use Cases...\n');

  try {
    const useCases = await prisma.useCase.findMany({
      include: {
        assessData: true,
        euAiActAssessments: true,
        iso42001Assessments: true,
        user: {
          select: { email: true, role: true }
        },
        organization: {
          select: { name: true }
        }
      }
    });

    console.log(`📋 Found ${useCases.length} use cases:\n`);

    useCases.forEach((uc, i) => {
      console.log(`${i + 1}. ${uc.title} (AIUC-${uc.aiucId})`);
      console.log(`   Stage: ${uc.stage || 'None'}`);
      console.log(`   Business Function: ${uc.businessFunction || 'None'}`);
      console.log(`   User: ${uc.user?.email} (${uc.user?.role})`);
      console.log(`   Organization: ${uc.organization?.name || 'None'}`);
      
      // Check if assessment data exists
      if (uc.assessData && uc.assessData.stepsData) {
        const stepsData = uc.assessData.stepsData as any;
        console.log(`   Assessment Data: ✅ Available`);
        
        if (stepsData.riskAssessment) {
          console.log(`   Risk Assessment: ✅ Available`);
          if (stepsData.riskAssessment.aiSpecific) {
            const frameworks = Object.entries(stepsData.riskAssessment.aiSpecific)
              .filter(([key, value]) => value === true)
              .map(([key]) => key);
            console.log(`   Regulatory Frameworks: ${frameworks.length > 0 ? frameworks.join(', ') : 'None'}`);
          }
          if (stepsData.riskAssessment.certifications) {
            const standards = Object.entries(stepsData.riskAssessment.certifications)
              .filter(([key, value]) => value === true)
              .map(([key]) => key);
            console.log(`   Industry Standards: ${standards.length > 0 ? standards.join(', ') : 'None'}`);
          }
        } else {
          console.log(`   Risk Assessment: ❌ Missing`);
        }
      } else {
        console.log(`   Assessment Data: ❌ Missing`);
      }
      
      console.log(`   EU AI Act Assessments: ${uc.euAiActAssessments?.length || 0}`);
      console.log(`   ISO 42001 Assessments: ${uc.iso42001Assessments?.length || 0}`);
      console.log('');
    });

    console.log('🔧 Recommendations:');
    if (useCases.length === 0) {
      console.log('1. No use cases found - create use cases first');
    } else {
      const useCasesWithFrameworks = useCases.filter(uc => {
        if (!uc.assessData?.stepsData) return false;
        const stepsData = uc.assessData.stepsData as any;
        const riskAssessment = stepsData.riskAssessment;
        if (!riskAssessment) return false;
        
        const hasAiSpecific = riskAssessment.aiSpecific && 
          Object.values(riskAssessment.aiSpecific).some(v => v === true);
        const hasCertifications = riskAssessment.certifications && 
          Object.values(riskAssessment.certifications).some(v => v === true);
          
        return hasAiSpecific || hasCertifications;
      });

      if (useCasesWithFrameworks.length === 0) {
        console.log('1. Use cases exist but no regulatory frameworks are applied');
        console.log('2. Go to each use case and complete the Risk Assessment step');
        console.log('3. Select regulatory frameworks (EU AI Act, etc.) in the risk assessment');
        console.log('4. Governance page will then show these use cases');
      } else {
        console.log(`1. ${useCasesWithFrameworks.length} use case(s) have frameworks applied`);
        console.log('2. These should appear in governance page');
        console.log('3. Create EU AI Act and ISO 42001 assessments for these use cases');
      }
    }

  } catch (error) {
    console.error('❌ Error checking use cases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkUseCases();
}

export default checkUseCases;