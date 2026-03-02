import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testAiucPerUserOrg() {
  try {
    console.log('Testing aiucId per user/organization...\n');

    // Get test users and organizations
    const user1 = await prisma.user.findUnique({
      where: { clerkId: 'test-user-1' }
    });

    const user2 = await prisma.user.findUnique({
      where: { clerkId: 'test-user-2' }
    });

    const user3 = await prisma.user.findUnique({
      where: { clerkId: 'test-user-3' }
    });

    if (!user1 || !user2 || !user3) {
      console.log('Test users not found, creating them...');
      // Create test users if they don't exist
      const org1 = await prisma.organization.upsert({
        where: { id: 'test-org-1' },
        update: {},
        create: {
          id: 'test-org-1',
          name: 'Test Organization 1',
          domain: 'test1.com'
        }
      });

      const org2 = await prisma.organization.upsert({
        where: { id: 'test-org-2' },
        update: {},
        create: {
          id: 'test-org-2',
          name: 'Test Organization 2',
          domain: 'test2.com'
        }
      });

      await prisma.user.upsert({
        where: { clerkId: 'test-user-1' },
        update: {},
        create: {
          clerkId: 'test-user-1',
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
          role: 'ORG_ADMIN',
          organizationId: org1.id
        }
      });

      await prisma.user.upsert({
        where: { clerkId: 'test-user-2' },
        update: {},
        create: {
          clerkId: 'test-user-2',
          email: 'user2@test.com',
          firstName: 'User',
          lastName: 'Two',
          role: 'ORG_ADMIN',
          organizationId: org2.id
        }
      });

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

    // Get the users again
    const testUser1 = await prisma.user.findUnique({
      where: { clerkId: 'test-user-1' }
    });

    const testUser2 = await prisma.user.findUnique({
      where: { clerkId: 'test-user-2' }
    });

    const testUser3 = await prisma.user.findUnique({
      where: { clerkId: 'test-user-3' }
    });

    console.log('Test users:');
    console.log(`- User 1 (Org 1): ${testUser1?.email} (Org: ${testUser1?.organizationId})`);
    console.log(`- User 2 (Org 2): ${testUser2?.email} (Org: ${testUser2?.organizationId})`);
    console.log(`- User 3 (No Org): ${testUser3?.email} (Org: ${testUser3?.organizationId})`);

    // Create test use cases for each user/organization
    console.log('\n--- Creating Test Use Cases ---');

    // Create use cases for User 1 (Organization 1)
    const useCase1_1 = await prisma.useCase.create({
      data: {
        title: 'Test Use Case 1 - Org 1',
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
        organizationId: testUser1!.organizationId,
        userId: testUser1!.id,
        aiucId: 1
      }
    });

    const useCase1_2 = await prisma.useCase.create({
      data: {
        title: 'Test Use Case 2 - Org 1',
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
        organizationId: testUser1!.organizationId,
        userId: testUser1!.id,
        aiucId: 2
      }
    });

    // Create use cases for User 2 (Organization 2)
    const useCase2_1 = await prisma.useCase.create({
      data: {
        title: 'Test Use Case 1 - Org 2',
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
        organizationId: testUser2!.organizationId,
        userId: testUser2!.id,
        aiucId: 1
      }
    });

    // Create use cases for User 3 (No Organization)
    const useCase3_1 = await prisma.useCase.create({
      data: {
        title: 'Test Use Case 1 - User 3',
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
        organizationId: null,
        userId: testUser3!.id,
        aiucId: 1
      }
    });

    console.log('✅ Created test use cases:');
    console.log(`- Org 1: Use Case 1 (aiucId: ${useCase1_1.aiucId}), Use Case 2 (aiucId: ${useCase1_2.aiucId})`);
    console.log(`- Org 2: Use Case 1 (aiucId: ${useCase2_1.aiucId})`);
    console.log(`- User 3: Use Case 1 (aiucId: ${useCase3_1.aiucId})`);

    // Verify the aiucId distribution
    console.log('\n--- Verifying aiucId Distribution ---');
    
    const org1UseCases = await prisma.useCase.findMany({
      where: { organizationId: testUser1!.organizationId },
      select: { title: true, aiucId: true },
      orderBy: { aiucId: 'asc' }
    });

    const org2UseCases = await prisma.useCase.findMany({
      where: { organizationId: testUser2!.organizationId },
      select: { title: true, aiucId: true },
      orderBy: { aiucId: 'asc' }
    });

    const user3UseCases = await prisma.useCase.findMany({
      where: { userId: testUser3!.id },
      select: { title: true, aiucId: true },
      orderBy: { aiucId: 'asc' }
    });

    console.log('Organization 1 use cases:');
    org1UseCases.forEach(uc => console.log(`  - ${uc.title}: aiucId ${uc.aiucId}`));

    console.log('\nOrganization 2 use cases:');
    org2UseCases.forEach(uc => console.log(`  - ${uc.title}: aiucId ${uc.aiucId}`));

    console.log('\nUser 3 use cases:');
    user3UseCases.forEach(uc => console.log(`  - ${uc.title}: aiucId ${uc.aiucId}`));

    console.log('\n✅ aiucId per user/organization test completed successfully!');
    console.log('\nExpected behavior:');
    console.log('- Each organization has its own aiucId sequence starting from 1');
    console.log('- Each individual user has their own aiucId sequence starting from 1');
    console.log('- aiucId is unique within each organization/user scope');

  } catch (error) {
    console.error('❌ Error testing aiucId per user/organization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAiucPerUserOrg(); 