import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixAiucSequenceFinal() {
  try {
    console.log('Fixing aiucId sequence with final approach...\n');

    // Get the current maximum aiucId
    const maxResult = await prisma.useCase.aggregate({
      _max: {
        aiucId: true
      }
    });

    const maxAiucId = maxResult._max.aiucId || 0;
    console.log(`Current maximum aiucId: ${maxAiucId}`);

    // Create a use case with the next aiucId manually
    console.log('\nCreating use case with next aiucId...');
    
    const nextAiucId = maxAiucId + 1;
    const tempUseCase = await prisma.useCase.create({
      data: {
        title: 'TEMP_SEQUENCE_ADVANCE',
        problemStatement: 'Temporary use case to advance sequence',
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
        aiucId: nextAiucId // Manually set to the next value
      }
    });

    console.log(`✅ Created temporary use case with aiucId: ${tempUseCase.aiucId}`);

    // Delete the temporary use case
    await prisma.useCase.delete({
      where: { id: tempUseCase.id }
    });

    console.log('✅ Deleted temporary use case');

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

fixAiucSequenceFinal(); 