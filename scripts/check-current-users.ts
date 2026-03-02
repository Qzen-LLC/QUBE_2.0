import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function checkCurrentUsers() {
  try {
    console.log('👥 Checking current users in Neon database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        clerkId: true,
        createdAt: true,
      }
    });

    console.log(`📊 Found ${users.length} users:`);
    
    if (users.length > 0) {
      console.table(users);
    } else {
      console.log('ℹ️  No users found in database');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUsers();