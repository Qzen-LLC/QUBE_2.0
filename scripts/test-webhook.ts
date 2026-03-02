import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testWebhook() {
  try {
    const testUser = {
      clerkId: 'user_2zmFxk2tQNZE57rMQnhfAoGJOc8',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ORG_ADMIN' as const,
      organizationId: null
    };

    console.log('Testing user creation without organizationId...');
    console.log('User data:', testUser);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: testUser.clerkId },
    });

    if (existingUser) {
      console.log('User already exists, updating...');
      await prisma.user.update({
        where: { clerkId: testUser.clerkId },
        data: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
      });
      console.log('User updated successfully!');
    } else {
      console.log('Creating new user...');
      await prisma.user.create({
        data: {
          clerkId: testUser.clerkId,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
      });
      console.log('User created successfully!');
    }

    // Verify the user was created/updated
    const user = await prisma.user.findUnique({
      where: { clerkId: testUser.clerkId },
      include: {
        organization: true,
      },
    });

    console.log('User in database:', {
      id: user?.id,
      clerkId: user?.clerkId,
      email: user?.email,
      role: user?.role,
      organizationId: user?.organizationId,
      organization: user?.organization,
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhook(); 