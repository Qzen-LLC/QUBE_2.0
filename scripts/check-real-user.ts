import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkRealUser() {
  try {
    console.log('Checking real user data...\n');

    // Get all users to see the current state
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        role: true,
        organizationId: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Clerk ID: ${user.clerkId}, Email: ${user.email}, Role: ${user.role}, Org: ${user.organizationId}`);
    });

    // Check use cases for each user
    console.log('\n--- Use Cases by User ---');
    for (const user of allUsers) {
      const useCases = await prisma.useCase.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, aiucId: true, userId: true, organizationId: true },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`\nUser ${user.email} (${user.role}):`);
      console.log(`  - Database ID: ${user.id}`);
      console.log(`  - Clerk ID: ${user.clerkId}`);
      console.log(`  - Organization: ${user.organizationId}`);
      console.log(`  - Use cases: ${useCases.length}`);
      
      useCases.forEach(uc => {
        console.log(`    - ${uc.title} (aiucId: ${uc.aiucId})`);
      });
    }

    // Check for any use cases without a userId
    console.log('\n--- Use Cases Without User ID ---');
    const orphanedUseCases = await prisma.useCase.findMany({
      where: { userId: null },
      select: { id: true, title: true, aiucId: true, userId: true, organizationId: true }
    });

    console.log(`Found ${orphanedUseCases.length} use cases without userId:`);
    orphanedUseCases.forEach(uc => {
      console.log(`  - ${uc.title} (aiucId: ${uc.aiucId}, orgId: ${uc.organizationId})`);
    });

    // Check for any use cases with organizationId but no userId
    console.log('\n--- Use Cases with Org but No User ID ---');
    const orgUseCasesWithoutUser = await prisma.useCase.findMany({
      where: { 
        organizationId: { not: null },
        userId: null 
      },
      select: { id: true, title: true, aiucId: true, userId: true, organizationId: true }
    });

    console.log(`Found ${orgUseCasesWithoutUser.length} use cases with org but no userId:`);
    orgUseCasesWithoutUser.forEach(uc => {
      console.log(`  - ${uc.title} (aiucId: ${uc.aiucId}, orgId: ${uc.organizationId})`);
    });

    console.log('\n✅ User data check completed!');
    console.log('\nIf you see use cases that should belong to a user but have userId: null,');
    console.log('that might be the cause of the dashboard not showing them.');

  } catch (error) {
    console.error('❌ Error checking real user data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealUser(); 