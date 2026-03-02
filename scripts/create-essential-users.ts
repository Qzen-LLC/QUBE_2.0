import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function createEssentialUsers() {
  try {
    console.log('👥 Creating essential users...');
    
    // Create main admin user
    const adminUser = await prisma.user.create({
      data: {
        clerkId: 'user_kramesh06_admin',
        email: 'Kramesh06@gmail.com',
        firstName: 'Kramesh',
        lastName: 'Admin',
        role: 'QZEN_ADMIN',
        organizationId: null,
      },
    });

    console.log('✅ Created QZEN Admin:', {
      email: adminUser.email,
      role: adminUser.role,
      id: adminUser.id,
    });

    // You can add more users here if needed
    // Example:
    // const orgAdmin = await prisma.user.create({
    //   data: {
    //     clerkId: 'user_org_admin',
    //     email: 'admin@company.com',
    //     firstName: 'Org',
    //     lastName: 'Admin',
    //     role: 'ORG_ADMIN',
    //     organizationId: null, // Set this if you have an organization
    //   },
    // });

    console.log('🎉 Essential users created successfully!');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEssentialUsers();