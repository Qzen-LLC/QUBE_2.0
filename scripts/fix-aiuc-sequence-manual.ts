import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixAiucSequenceManual() {
  try {
    console.log('Fixing aiucId sequence manually...\n');

    // Get all use cases ordered by aiucId
    const useCases = await prisma.useCase.findMany({
      select: {
        id: true,
        title: true,
        aiucId: true
      },
      orderBy: {
        aiucId: 'asc'
      }
    });

    console.log(`Total use cases: ${useCases.length}`);
    
    // Find the actual gaps
    const gaps = [];
    for (let i = 1; i <= 25; i++) {
      const exists = useCases.some(uc => uc.aiucId === i);
      if (!exists) {
        gaps.push(i);
      }
    }

    console.log(`Found ${gaps.length} gaps in sequence:`, gaps);

    if (gaps.length > 0) {
      console.log('\nCreating temporary use cases to fill gaps...');
      
      for (const gapAiucId of gaps) {
        try {
          const tempUseCase = await prisma.useCase.create({
            data: {
              title: `TEMP_GAP_FILLER_${gapAiucId}`,
              problemStatement: `Temporary use case to fill gap ${gapAiucId}`,
              proposedAISolution: 'Temporary',
              currentState: 'Temporary',
              desiredState: 'Temporary',
              primaryStakeholders: ['Temporary'],
              secondaryStakeholders: ['Temporary'],
              successCriteria: ['Temporary'],
              problemValidation: 'Temporary',
              solutionHypothesis: 'Temporary',
              keyAssumptions: ['Temporary'],
              initialROI: 'Temporary',
              confidenceLevel: 1,
              operationalImpactScore: 1,
              productivityImpactScore: 1,
              revenueImpactScore: 1,
              implementationComplexity: 1,
              estimatedTimeline: 'Temporary',
              requiredResources: 'Temporary',
              businessFunction: 'Temporary',
              aiucId: gapAiucId // Manually set the aiucId
            }
          });

          console.log(`✅ Created temporary use case with aiucId: ${tempUseCase.aiucId}`);
        } catch (error) {
          console.log(`❌ Failed to create use case for aiucId ${gapAiucId}:`, error);
        }
      }

      console.log('\nDeleting temporary use cases...');
      
      // Delete all temporary use cases
      const deletedCount = await prisma.useCase.deleteMany({
        where: {
          title: {
            startsWith: 'TEMP_GAP_FILLER_'
          }
        }
      });

      console.log(`✅ Deleted ${deletedCount.count} temporary use cases`);
    }

    // Verify the fix
    console.log('\n--- Verifying Fix ---');
    const testUseCase = await prisma.useCase.create({
      data: {
        title: 'TEST_SEQUENCE_FIX',
        problemStatement: 'Test use case for sequence verification',
        proposedAISolution: 'Test',
        currentState: 'Test',
        desiredState: 'Test',
        primaryStakeholders: ['Test'],
        secondaryStakeholders: ['Test'],
        successCriteria: ['Test'],
        problemValidation: 'Test',
        solutionHypothesis: 'Test',
        keyAssumptions: ['Test'],
        initialROI: 'Test',
        confidenceLevel: 1,
        operationalImpactScore: 1,
        productivityImpactScore: 1,
        revenueImpactScore: 1,
        implementationComplexity: 1,
        estimatedTimeline: 'Test',
        requiredResources: 'Test',
        businessFunction: 'Test'
      }
    });

    console.log(`✅ Test use case created with aiucId: ${testUseCase.aiucId}`);

    // Clean up the test use case
    await prisma.useCase.delete({
      where: { id: testUseCase.id }
    });

    console.log('✅ Test use case cleaned up');
    console.log('\n🎉 aiucId sequence has been fixed!');
    console.log('You should now be able to create new use cases without the unique constraint error.');

  } catch (error) {
    console.error('❌ Error fixing aiucId sequence:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAiucSequenceManual(); 