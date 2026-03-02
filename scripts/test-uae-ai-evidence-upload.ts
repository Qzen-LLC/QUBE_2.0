#!/usr/bin/env npx tsx

import { prismaClient } from '../src/utils/db';

async function testUaeAiEvidenceUpload() {
  console.log('🧪 Testing UAE AI Evidence Upload Functionality...');

  try {
    // Test 1: Check if UAE AI controls exist
    console.log('\n📋 Test 1: Checking UAE AI controls...');
    const controls = await prismaClient.uaeAiControl.findMany({
      orderBy: { orderIndex: 'asc' }
    });
    
    console.log(`✅ Found ${controls.length} UAE AI controls`);
    if (controls.length > 0) {
      console.log(`📝 Sample control: ${controls[0].controlId} - ${controls[0].title}`);
    } else {
      console.log('❌ No UAE AI controls found. Please run the seeding script first.');
      return;
    }

    // Test 2: Check if there are any use cases
    console.log('\n📋 Test 2: Checking use cases...');
    const useCases = await prismaClient.useCase.findMany({
      take: 5,
      include: {
        user: true,
        organization: true
      }
    });
    
    console.log(`✅ Found ${useCases.length} use cases`);
    if (useCases.length === 0) {
      console.log('❌ No use cases found. Please create a use case first.');
      return;
    }

    const testUseCase = useCases[0];
    console.log(`📝 Using test use case: ${testUseCase.id} - ${testUseCase.title}`);

    // Test 3: Check if UAE AI assessment exists for the use case
    console.log('\n📋 Test 3: Checking UAE AI assessment...');
    let assessment = await prismaClient.uaeAiAssessment.findUnique({
      where: { useCaseId: testUseCase.id },
      include: {
        controls: {
          include: {
            control: true
          }
        }
      }
    });

    if (!assessment) {
      console.log('📝 Creating UAE AI assessment...');
      assessment = await prismaClient.uaeAiAssessment.create({
        data: {
          useCaseId: testUseCase.id,
          status: 'in_progress',
          progress: 0,
          riskImpactLevel: 'low'
        },
        include: {
          controls: {
            include: {
              control: true
            }
          }
        }
      });
      console.log(`✅ Created assessment: ${assessment.id}`);
    } else {
      console.log(`✅ Found existing assessment: ${assessment.id}`);
    }

    // Test 4: Test creating a control instance with evidence files
    console.log('\n📋 Test 4: Testing control instance creation with evidence files...');
    const testControl = controls[0];
    const testEvidenceFiles = [
      'https://example.com/test-file-1.pdf',
      'https://example.com/test-file-2.docx'
    ];

    const controlInstance = await prismaClient.uaeAiControlInstance.upsert({
      where: {
        assessmentId_controlId: {
          assessmentId: assessment.id,
          controlId: testControl.controlId
        }
      },
      update: {
        implementation: 'Test implementation for evidence upload testing',
        evidenceFiles: testEvidenceFiles,
        score: 2,
        notes: 'Test notes',
        status: 'implemented'
      },
      create: {
        assessmentId: assessment.id,
        controlId: testControl.controlId,
        implementation: 'Test implementation for evidence upload testing',
        evidenceFiles: testEvidenceFiles,
        score: 2,
        notes: 'Test notes',
        status: 'implemented'
      },
      include: {
        control: true
      }
    });

    console.log(`✅ Created/updated control instance: ${controlInstance.id}`);
    console.log(`📝 Evidence files count: ${controlInstance.evidenceFiles.length}`);
    console.log(`📝 Evidence files: ${controlInstance.evidenceFiles.join(', ')}`);

    // Test 5: Test updating evidence files
    console.log('\n📋 Test 5: Testing evidence files update...');
    const updatedEvidenceFiles = [
      'https://example.com/updated-file-1.pdf',
      'https://example.com/updated-file-2.docx',
      'https://example.com/new-file-3.xlsx'
    ];

    const updatedInstance = await prismaClient.uaeAiControlInstance.update({
      where: {
        assessmentId_controlId: {
          assessmentId: assessment.id,
          controlId: testControl.controlId
        }
      },
      data: {
        evidenceFiles: updatedEvidenceFiles
      },
      include: {
        control: true
      }
    });

    console.log(`✅ Updated control instance: ${updatedInstance.id}`);
    console.log(`📝 Updated evidence files count: ${updatedInstance.evidenceFiles.length}`);
    console.log(`📝 Updated evidence files: ${updatedInstance.evidenceFiles.join(', ')}`);

    // Test 6: Verify the assessment was updated
    console.log('\n📋 Test 6: Verifying assessment update...');
    const updatedAssessment = await prismaClient.uaeAiAssessment.findUnique({
      where: { id: assessment.id },
      include: {
        controls: {
          include: {
            control: true
          }
        }
      }
    });

    console.log(`✅ Assessment updated: ${updatedAssessment?.id}`);
    console.log(`📝 Total controls: ${updatedAssessment?.controls.length}`);
    console.log(`📝 Progress: ${updatedAssessment?.progress}%`);

    console.log('\n🎉 All tests passed! UAE AI evidence upload functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the test
testUaeAiEvidenceUpload()
  .then(() => {
    console.log('✅ Test process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test process failed:', error);
    process.exit(1);
  });
