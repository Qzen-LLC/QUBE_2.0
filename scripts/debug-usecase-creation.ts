import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function debugUseCaseCreation() {
  try {
    console.log('Debugging use case creation and reading...\n');

    // Get the test user
    const user = await prisma.user.findUnique({
      where: { clerkId: 'test-user-3' }
    });

    if (!user) {
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

    const testUser = await prisma.user.findUnique({
      where: { clerkId: 'test-user-3' }
    });

    console.log('Test user details:');
    console.log(`- ID: ${testUser?.id}`);
    console.log(`- Clerk ID: ${testUser?.clerkId}`);
    console.log(`- Email: ${testUser?.email}`);
    console.log(`- Role: ${testUser?.role}`);
    console.log(`- Organization ID: ${testUser?.organizationId}`);

    // Check existing use cases for this user
    console.log('\n--- Existing Use Cases for User ---');
    const existingUseCases = await prisma.useCase.findMany({
      where: { userId: testUser!.id },
      select: { id: true, title: true, aiucId: true, userId: true, organizationId: true }
    });

    console.log(`Found ${existingUseCases.length} use cases for user ${testUser!.id}:`);
    existingUseCases.forEach(uc => {
      console.log(`  - ${uc.title} (aiucId: ${uc.aiucId}, userId: ${uc.userId}, orgId: ${uc.organizationId})`);
    });

    // Check all use cases in the database
    console.log('\n--- All Use Cases in Database ---');
    const allUseCases = await prisma.useCase.findMany({
      select: { id: true, title: true, aiucId: true, userId: true, organizationId: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total use cases in database: ${allUseCases.length}`);
    allUseCases.slice(0, 10).forEach(uc => {
      console.log(`  - ${uc.title} (aiucId: ${uc.aiucId}, userId: ${uc.userId}, orgId: ${uc.organizationId})`);
    });

    // Simulate the API logic for reading use cases
    console.log('\n--- Simulating API Read Logic ---');
    
    // Simulate QZEN_ADMIN (all use cases)
    const adminUseCases = await prisma.useCase.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    console.log(`QZEN_ADMIN would see: ${adminUseCases.length} use cases`);

    // Simulate ORG_ADMIN (organization use cases)
    const orgUseCases = await prisma.useCase.findMany({
      where: { organizationId: testUser!.organizationId },
      orderBy: { updatedAt: 'desc' }
    });
    console.log(`ORG_ADMIN would see: ${orgUseCases.length} use cases (for org ${testUser!.organizationId})`);

    // Simulate USER (user use cases)
    const userUseCases = await prisma.useCase.findMany({
      where: { userId: testUser!.id },
      orderBy: { updatedAt: 'desc' }
    });
    console.log(`USER would see: ${userUseCases.length} use cases (for user ${testUser!.id})`);

    // Create a test use case to see what happens
    console.log('\n--- Creating Test Use Case ---');
    const testUseCase = await prisma.useCase.create({
      data: {
        title: 'Debug Test Use Case',
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
        organizationId: testUser!.organizationId,
        userId: testUser!.id,
        aiucId: (await prisma.useCase.aggregate({
          where: { userId: testUser!.id },
          _max: { aiucId: true }
        }))._max.aiucId! + 1
      }
    });

    console.log(`Created use case: ${testUseCase.title} (aiucId: ${testUseCase.aiucId}, userId: ${testUseCase.userId})`);

    // Check if the new use case appears in the user's list
    const updatedUserUseCases = await prisma.useCase.findMany({
      where: { userId: testUser!.id },
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`\nAfter creation, USER would see: ${updatedUserUseCases.length} use cases`);
    updatedUserUseCases.forEach(uc => {
      console.log(`  - ${uc.title} (aiucId: ${uc.aiucId}, userId: ${uc.userId})`);
    });

    // Clean up
    await prisma.useCase.delete({
      where: { id: testUseCase.id }
    });

    console.log('\n✅ Debug completed successfully!');

  } catch (error) {
    console.error('❌ Error debugging use case creation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

debugUseCaseCreation(); 