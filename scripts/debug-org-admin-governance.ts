import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function debugOrgAdminGovernance() {
  try {
    console.log('🔍 Debugging Organization Admin Governance Access...\n');

    // Find all organization admins
    const orgAdmins = await prisma.user.findMany({
      where: {
        role: 'ORG_ADMIN'
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${orgAdmins.length} organization admins:`);
    orgAdmins.forEach((admin, i) => {
      console.log(`   ${i + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
      console.log(`      - Role: ${admin.role}`);
      console.log(`      - OrganizationId: ${admin.organizationId}`);
      console.log(`      - Organization: ${admin.organization?.name || 'None'}`);
      console.log('');
    });

    // Check use cases for each organization
    const organizations = await prisma.organization.findMany({
      include: {
        useCases: {
          select: {
            id: true,
            title: true,
            aiucId: true,
            userId: true,
            organizationId: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`🏢 Organizations and their use cases:`);
    organizations.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.name} (ID: ${org.id})`);
      console.log(`      - Use Cases: ${org.useCases.length}`);
      org.useCases.forEach((uc, j) => {
        console.log(`        ${j + 1}. ${uc.title} (aiucId: ${uc.aiucId}, userId: ${uc.userId})`);
      });
      console.log('');
    });

    // Test the governance data query for each org admin
    for (const admin of orgAdmins) {
      console.log(`🧪 Testing governance data access for ${admin.email}:`);
      
      if (!admin.organizationId) {
        console.log(`   ❌ Admin has no organizationId - this is the problem!`);
        continue;
      }

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

      console.log(`   ✅ Found ${useCases.length} use cases for organization ${admin.organizationId}`);
      
      if (useCases.length === 0) {
        console.log(`   ⚠️  No use cases found for this organization`);
      } else {
        console.log(`   📋 Use cases:`);
        useCases.forEach((uc, i) => {
          console.log(`      ${i + 1}. ${uc.title} (aiucId: ${uc.aiucId})`);
          console.log(`         - Has assessData: ${!!uc.assessData}`);
          console.log(`         - Has answers: ${uc.answers.length}`);
        });
      }
      console.log('');
    }

    // Check if there are any use cases without organizationId
    const orphanedUseCases = await prisma.useCase.findMany({
      where: {
        organizationId: null
      },
      select: {
        id: true,
        title: true,
        aiucId: true,
        userId: true,
        organizationId: true
      }
    });

    if (orphanedUseCases.length > 0) {
      console.log(`⚠️  Found ${orphanedUseCases.length} use cases without organizationId:`);
      orphanedUseCases.forEach((uc, i) => {
        console.log(`   ${i + 1}. ${uc.title} (aiucId: ${uc.aiucId}, userId: ${uc.userId})`);
      });
    }

    console.log('\n🔧 Recommendations:');
    console.log('1. Ensure all ORG_ADMIN users have a valid organizationId');
    console.log('2. Ensure all use cases have a valid organizationId');
    console.log('3. Check if the governance page is calling the correct API endpoint');
    console.log('4. Verify that the user is properly authenticated');

  } catch (error) {
    console.error('❌ Error debugging organization admin governance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugOrgAdminGovernance();
}

export { debugOrgAdminGovernance };

