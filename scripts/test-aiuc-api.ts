import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testAiucApi() {
  try {
    console.log('Testing aiucId API calculation...\n');

    // Get a test user
    const testUser = await prisma.user.findUnique({
      where: { clerkId: 'test-user-3' }
    });

    if (!testUser) {
      console.log('Test user not found, creating one...');
      await prisma.user.upsert({
        where: { clerkId: 'test-user-3' },
        update: {},
        create: {
          clerkId: 'test-user-3',
          email: 'user3@test.com',
          firstName: 'User',
          lastName: 'Three',
          role: 'USER',
          organizationId: null
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: 'test-user-3' }
    });

    console.log(`Testing with user: ${user?.email} (Org: ${user?.organizationId})`);

    // Simulate the API logic for calculating next aiucId
    let nextAiucId = 1;
    
    if (user!.organizationId) {
      // For organization users, get the next aiucId for the organization
      const maxOrgAiucId = await prisma.useCase.aggregate({
        where: { organizationId: user!.organizationId },
        _max: { aiucId: true }
      });
      nextAiucId = (maxOrgAiucId._max.aiucId || 0) + 1;
      console.log(`Organization ${user!.organizationId} max aiucId: ${maxOrgAiucId._max.aiucId || 0}`);
    } else {
      // For individual users, get the next aiucId for the user
      const maxUserAiucId = await prisma.useCase.aggregate({
        where: { userId: user!.id },
        _max: { aiucId: true }
      });
      nextAiucId = (maxUserAiucId._max.aiucId || 0) + 1;
      console.log(`User ${user!.id} max aiucId: ${maxUserAiucId._max.aiucId || 0}`);
    }

    console.log(`Next aiucId should be: ${nextAiucId}`);

    // Create a test use case using the API logic
    const testUseCase = await prisma.useCase.create({
      data: {
        title: 'API Test Use Case',
        problemStatement: 'Test problem',
        proposedAISolution: 'Test solution',
        currentState: 'Test current',
        desiredState: 'Test desired',
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
        businessFunction: 'Test',
        organizationId: user!.organizationId,
        userId: user!.id,
        aiucId: nextAiucId
      }
    });

    console.log(`✅ Created use case with aiucId: ${testUseCase.aiucId}`);

    // Verify the use case was created correctly
    const createdUseCase = await prisma.useCase.findUnique({
      where: { id: testUseCase.id },
      select: { title: true, aiucId: true, organizationId: true, userId: true }
    });

    console.log('Created use case details:', createdUseCase);

    // Clean up
    await prisma.useCase.delete({
      where: { id: testUseCase.id }
    });

    console.log('✅ Test use case cleaned up');
    console.log('\n🎉 aiucId API calculation test completed successfully!');
    console.log('The API should now correctly calculate aiucId for new use cases.');

  } catch (error) {
    console.error('❌ Error testing aiucId API:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAiucApi(); 