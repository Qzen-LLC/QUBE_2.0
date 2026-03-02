import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixUserRoles() {
  console.log('🔧 Starting user role fix...');
  
  try {
    // Find users who have organizationId but are assigned USER role
    const usersToFix = await prisma.user.findMany({
      where: {
        organizationId: {
          not: null
        },
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${usersToFix.length} users with organizationId but USER role`);

    if (usersToFix.length === 0) {
      console.log('✅ No users need to be fixed');
      return;
    }

    // Update these users to ORG_USER role
    const updateResult = await prisma.user.updateMany({
      where: {
        organizationId: {
          not: null
        },
        role: 'USER'
      },
      data: {
        role: 'ORG_USER'
      }
    });

    console.log(`✅ Updated ${updateResult.count} users from USER to ORG_USER role`);

    // Show the updated users
    const updatedUsers = await prisma.user.findMany({
      where: {
        organizationId: {
          not: null
        },
        role: 'ORG_USER'
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 Updated users:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) -> ${user.role}`);
    });

    // Show summary of role distribution
    const roleSummary = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    console.log('\n📊 Role distribution summary:');
    roleSummary.forEach(summary => {
      console.log(`  - ${summary.role}: ${summary._count.id} users`);
    });

    // Show organization vs non-organization users
    const orgUsers = await prisma.user.count({
      where: {
        organizationId: {
          not: null
        }
      }
    });

    const nonOrgUsers = await prisma.user.count({
      where: {
        organizationId: null
      }
    });

    console.log(`\n📊 Organization distribution:`);
    console.log(`  - Users with organization: ${orgUsers}`);
    console.log(`  - Users without organization: ${nonOrgUsers}`);

  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixUserRoles()
    .then(() => {
      console.log('✅ User role fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User role fix failed:', error);
      process.exit(1);
    });
}

export { fixUserRoles };
