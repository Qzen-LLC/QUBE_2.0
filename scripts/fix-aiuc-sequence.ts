import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixAiucSequence() {
  try {
    console.log('Fixing aiucId sequence...\n');

    // Get the current maximum aiucId
    const maxResult = await prisma.useCase.aggregate({
      _max: {
        aiucId: true
      }
    });

    const maxAiucId = maxResult._max.aiucId || 0;
    const nextAiucId = maxAiucId + 1;

    console.log(`Current maximum aiucId: ${maxAiucId}`);
    console.log(`Next aiucId should be: ${nextAiucId}`);

    // Reset the sequence to the correct next value
    console.log('\nResetting sequence...');
    
    try {
      // Try to reset the sequence using raw SQL
      await prisma.$executeRaw`SELECT setval('usecase_aiucid_seq', ${nextAiucId}, false);`;
      console.log('✅ Sequence reset successfully');
    } catch (error) {
      console.log('Could not reset sequence directly, trying alternative approach...');
      
      // Alternative: Create a temporary use case and delete it to advance the sequence
      try {
        const tempUseCase = await prisma.useCase.create({
          data: {
            title: 'TEMP_FOR_SEQUENCE_FIX',
            problemStatement: 'Temporary use case for sequence fix',
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
            businessFunction: 'Temporary'
          }
        });

        console.log(`Created temporary use case with aiucId: ${tempUseCase.aiucId}`);

        // Delete the temporary use case
        await prisma.useCase.delete({
          where: { id: tempUseCase.id }
        });

        console.log('✅ Sequence advanced by creating and deleting temporary use case');
      } catch (createError) {
        console.error('❌ Could not create temporary use case:', createError);
        throw createError;
      }
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

fixAiucSequence(); 