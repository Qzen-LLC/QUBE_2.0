import { PrismaClient } from '../src/generated/prisma';
import { createClerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function debugUserAPI() {
  try {
    console.log('🔍 Debugging User API Issues...\n');

    // 1. Check database connection
    console.log('1. Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }

    // 2. Check if users exist in database
    console.log('\n2. Checking users in database...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
      take: 10,
    });

    console.log(`Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, Clerk ID: ${user.clerkId}, Email: ${user.email}, Role: ${user.role}`);
    });

    // 3. Check organizations
    console.log('\n3. Checking organizations...');
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
      },
      take: 5,
    });

    console.log(`Found ${organizations.length} organizations:`);
    organizations.forEach((org, index) => {
      console.log(`  ${index + 1}. ID: ${org.id}, Name: ${org.name}, Domain: ${org.domain}`);
    });

    // 4. Test API endpoint (if running locally)
    console.log('\n4. Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/test-user');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint accessible');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ API endpoint returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Could not reach API endpoint (server might not be running)');
      console.log('Error:', error);
    }

    // 5. Provide instructions for fixing issues
    console.log('\n5. Troubleshooting Guide:');
    console.log('\nIf the 404 error persists:');
    console.log('1. Make sure you are signed in to Clerk');
    console.log('2. Check if your user exists in the database:');
    console.log('   - Run: npm run check-current-users');
    console.log('3. If user doesn\'t exist, create it:');
    console.log('   - Get your Clerk ID from the browser console or Clerk dashboard');
    console.log('   - Run: npm run create-user <clerk-id> <email> [role]');
    console.log('4. Test the API:');
    console.log('   - Visit: http://localhost:3000/api/test-user');

    console.log('\nIf the Clerk deprecation warning persists:');
    console.log('1. Make sure you\'re using the updated docker-compose.yml');
    console.log('2. Restart your development server');
    console.log('3. Clear browser cache');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserAPI();

