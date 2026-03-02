import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('Setting up QZen Admin...');
    
    // Get the first user from Clerk (you'll need to provide the clerkId)
    const clerkId = process.argv[2];
    
    if (!clerkId) {
      console.error('Please provide a Clerk user ID as an argument');
      console.log('Usage: npm run setup-admin <clerk-user-id>');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      console.log('User already exists, updating role to QZEN_ADMIN...');
      await prisma.user.update({
        where: { clerkId },
        data: { role: 'QZEN_ADMIN' },
      });
      console.log('User role updated to QZEN_ADMIN');
    } else {
      console.log('Creating new QZen admin user...');
      await prisma.user.create({
        data: {
          clerkId,
          email: 'admin@qzen.com', // You'll need to update this with actual email
          firstName: 'QZen',
          lastName: 'Admin',
          role: 'QZEN_ADMIN',
        },
      });
      console.log('QZen admin user created successfully');
    }

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin(); 