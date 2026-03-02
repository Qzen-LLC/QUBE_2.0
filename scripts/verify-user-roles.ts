import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function verifyUserRoles() {
  console.log('🔍 Verifying user role assignments...\n');
  
  try {
    // Get all users with their details
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 All Users:');
    console.log('='.repeat(100));
    console.log('Name'.padEnd(25) + 'Email'.padEnd(35) + 'Role'.padEnd(12) + 'Org ID'.padEnd(40) + 'Status');
    console.log('='.repeat(100));

    users.forEach(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
      const email = user.email || 'No email';
      const role = user.role;
      const orgId = user.organizationId ? user.organizationId.substring(0, 20) + '...' : 'No Org';
      const status = user.isActive ? 'Active' : 'Inactive';
      
      console.log(
        fullName.padEnd(25) + 
        email.padEnd(35) + 
        role.padEnd(12) + 
        orgId.padEnd(40) + 
        status
      );
    });

    console.log('\n📊 Role Distribution:');
    console.log('='.repeat(50));
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`${role}: ${count} users`);
    });

    console.log('\n📊 Organization Distribution:');
    console.log('='.repeat(50));
    const orgUsers = users.filter(u => u.organizationId).length;
    const nonOrgUsers = users.filter(u => !u.organizationId).length;
    console.log(`Users with organization: ${orgUsers}`);
    console.log(`Users without organization: ${nonOrgUsers}`);

    console.log('\n🔍 Role Validation Check:');
    console.log('='.repeat(50));
    
    let issuesFound = 0;
    users.forEach(user => {
      // Check for role inconsistencies
      if (user.organizationId && user.role === 'USER') {
        console.log(`❌ ${user.email}: Has organizationId but USER role`);
        issuesFound++;
      }
      if (!user.organizationId && (user.role === 'ORG_USER' || user.role === 'ORG_ADMIN')) {
        console.log(`❌ ${user.email}: No organizationId but ${user.role} role`);
        issuesFound++;
      }
      if (user.organizationId && user.role === 'QZEN_ADMIN') {
        console.log(`⚠️ ${user.email}: QZEN_ADMIN with organizationId`);
        issuesFound++;
      }
    });

    if (issuesFound === 0) {
      console.log('✅ All user role assignments are valid!');
    } else {
      console.log(`\nFound ${issuesFound} role assignment issues.`);
    }

  } catch (error) {
    console.error('❌ Error verifying user roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  verifyUserRoles()
    .then(() => {
      console.log('\n✅ User role verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User role verification failed:', error);
      process.exit(1);
    });
}

export { verifyUserRoles };
