import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function comprehensiveFixUseCaseOrganizationIds() {
  try {
    console.log('🔧 Comprehensive Fix for Use Case Organization IDs...\n');

    // Strategy 1: Fix use cases with userId but no organizationId
    console.log('📋 Strategy 1: Fixing use cases with userId but no organizationId');
    const useCasesWithUser = await prisma.useCase.findMany({
      where: {
        organizationId: null,
        userId: { not: null }
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

    let fixedCount = 0;
    for (const useCase of useCasesWithUser) {
      if (useCase.user && useCase.user.organizationId) {
        await prisma.useCase.update({
          where: { id: useCase.id },
          data: { organizationId: useCase.user.organizationId }
        });
        console.log(`   ✅ Fixed: ${useCase.title} -> Org: ${useCase.user.organizationId}`);
        fixedCount++;
      }
    }
    console.log(`   📊 Fixed ${fixedCount} use cases with user organizationId\n`);

    // Strategy 2: For use cases with null userId, try to infer organization from similar use cases
    console.log('📋 Strategy 2: Handling use cases with null userId');
    const useCasesWithNullUser = await prisma.useCase.findMany({
      where: {
        organizationId: null,
        userId: null
      }
    });

    console.log(`   📊 Found ${useCasesWithNullUser.length} use cases with null userId`);
    
    // For now, we'll leave these as-is since we can't reliably determine their organization
    // In a real scenario, you might want to:
    // 1. Ask the admin to manually assign them
    // 2. Create a default organization for orphaned use cases
    // 3. Delete them if they're test data

    // Strategy 3: Verify the fix
    console.log('📋 Strategy 3: Verification');
    const remainingOrphaned = await prisma.useCase.count({
      where: { organizationId: null }
    });
    console.log(`   📊 Remaining orphaned use cases: ${remainingOrphaned}`);

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

    // Strategy 4: Test organization admin access
    console.log('\n📋 Strategy 4: Testing organization admin access');
    const orgAdmins = await prisma.user.findMany({
      where: { role: 'ORG_ADMIN' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { useCases: true }
            }
          }
        }
      }
    });

    for (const admin of orgAdmins) {
      if (admin.organizationId && admin.organization) {
        console.log(`   👤 ${admin.email} (${admin.organization.name})`);
        console.log(`      - Can see ${admin.organization._count.useCases} use cases`);
        
        // Test the actual query that governance data API uses
        const useCases = await prisma.useCase.findMany({
          where: { organizationId: admin.organizationId },
          include: {
            assessData: true,
            answers: {
              include: {
                question: {
                  select: {
                    text: true,
                    type: true,
                  }
                },
                questionTemplate: {
                  select: {
                    text: true,
                    type: true,
                  }
                }
              }
            }
          }
        });
        
        console.log(`      - Governance query returns ${useCases.length} use cases`);
        useCases.forEach((uc, i) => {
          console.log(`        ${i + 1}. ${uc.title} (has assessData: ${!!uc.assessData}, answers: ${uc.answers.length})`);
        });
      }
    }

    console.log('\n✅ Comprehensive fix completed!');
    console.log('\n🔧 Next steps:');
    console.log('1. Organization admins should now be able to see governance data for their organization');
    console.log('2. Use cases with null userId may need manual assignment or cleanup');
    console.log('3. Test the governance page with organization admin accounts');

  } catch (error) {
    console.error('❌ Error in comprehensive fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  comprehensiveFixUseCaseOrganizationIds();
}

export { comprehensiveFixUseCaseOrganizationIds };

