import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixUseCaseOrganizationIds() {
  try {
    console.log('🔧 Fixing Use Case Organization IDs...\n');

    // Find all use cases without organizationId
    const orphanedUseCases = await prisma.useCase.findMany({
      where: {
        organizationId: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            organizationId: true,
            role: true
          }
        }
      }
    });

    console.log(`📊 Found ${orphanedUseCases.length} use cases without organizationId:`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const useCase of orphanedUseCases) {
      console.log(`\n🔍 Processing: ${useCase.title} (aiucId: ${useCase.aiucId})`);
      console.log(`   - userId: ${useCase.userId}`);
      
      if (useCase.user) {
        console.log(`   - User: ${useCase.user.email} (${useCase.user.role})`);
        console.log(`   - User's organizationId: ${useCase.user.organizationId}`);
        
        if (useCase.user.organizationId) {
          // Update the use case with the user's organizationId
          await prisma.useCase.update({
            where: { id: useCase.id },
            data: { organizationId: useCase.user.organizationId }
          });
          
          console.log(`   ✅ Fixed: Assigned organizationId ${useCase.user.organizationId}`);
          fixedCount++;
        } else {
          console.log(`   ⚠️  Skipped: User has no organizationId`);
          skippedCount++;
        }
      } else {
        console.log(`   ⚠️  Skipped: No user found for userId ${useCase.userId}`);
        skippedCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} use cases`);
    console.log(`   ⚠️  Skipped: ${skippedCount} use cases`);

    // Verify the fix
    console.log(`\n🔍 Verification:`);
    const remainingOrphaned = await prisma.useCase.count({
      where: { organizationId: null }
    });
    console.log(`   - Remaining orphaned use cases: ${remainingOrphaned}`);

    // Show organization use case counts
    const orgStats = await prisma.organization.findMany({
      include: {
        _count: {
          select: { useCases: true }
        }
      }
    });

    console.log(`\n🏢 Organization use case counts after fix:`);
    orgStats.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.name}: ${org._count.useCases} use cases`);
    });

  } catch (error) {
    console.error('❌ Error fixing use case organization IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixUseCaseOrganizationIds();
}

export { fixUseCaseOrganizationIds };

