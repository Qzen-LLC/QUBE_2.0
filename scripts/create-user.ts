import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function createUser() {
  try {
    const clerkId = process.argv[2];
    const email = process.argv[3];
    const role = process.argv[4] || 'USER';
    
    if (!clerkId || !email) {
      console.error('Usage: npm run create-user <clerk-id> <email> [role]');
      console.log('Roles: QZEN_ADMIN, ORG_ADMIN, ORG_USER, USER');
      process.exit(1);
    }

    console.log('Creating user...');
    console.log('Clerk ID:', clerkId);
    console.log('Email:', email);
    console.log('Role:', role);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      console.log('User already exists, updating role...');
      await prisma.user.update({
        where: { clerkId },
        data: { role: role as any },
      });
      console.log('User role updated successfully!');
    } else {
      console.log('Creating new user...');
      await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName: 'Test',
          lastName: 'User',
          role: role as any,
        },
      });
      console.log('User created successfully!');
    }

    // Verify the user was created/updated
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    console.log('User in database:', {
      id: user?.id,
      clerkId: user?.clerkId,
      email: user?.email,
      role: user?.role,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser(); 