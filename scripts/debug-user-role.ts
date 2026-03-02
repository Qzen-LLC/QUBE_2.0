import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUserRole() {
  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('All users with roles:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}): ${user.role} in org: ${user.organization?.name || 'No org'}`);
    });

    // Count users by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    console.log('\nRole distribution:');
    roleCounts.forEach(count => {
      console.log(`- ${count.role}: ${count._count.role} users`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserRole(); 