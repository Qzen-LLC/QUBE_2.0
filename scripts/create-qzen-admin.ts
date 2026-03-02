import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function createQzenAdmin() {
  try {
    console.log('🚀 Creating QZen Admin user...');
    
    const user = await prisma.user.create({
      data: {
        clerkId: 'user_kramesh06_admin', // Placeholder Clerk ID
        email: 'Kramesh06@gmail.com',
        firstName: 'Kramesh',
        lastName: 'Admin',
        role: 'QZEN_ADMIN',
        organizationId: null, // QZen admins don't belong to specific orgs
      },
    });

    console.log('✅ QZen Admin user created successfully:');
    console.log({
      id: user.id,
      email: user.email,
      role: user.role,
      clerkId: user.clerkId,
    });

  } catch (error) {
    console.error('❌ Error creating QZen Admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createQzenAdmin();