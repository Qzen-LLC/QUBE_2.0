import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testVendorSeparation() {
  try {
    console.log('Testing vendor separation functionality...\n');

    // Create test organizations
    const org1 = await prisma.organization.upsert({
      where: { id: 'test-org-1' },
      update: {},
      create: {
        id: 'test-org-1',
        name: 'Test Organization 1',
        domain: 'test1.com'
      }
    });

    const org2 = await prisma.organization.upsert({
      where: { id: 'test-org-2' },
      update: {},
      create: {
        id: 'test-org-2',
        name: 'Test Organization 2',
        domain: 'test2.com'
      }
    });

    // Create test users
    const user1 = await prisma.user.upsert({
      where: { clerkId: 'test-user-1' },
      update: {},
      create: {
        clerkId: 'test-user-1',
        email: 'user1@test.com',
        firstName: 'User',
        lastName: 'One',
        role: 'ORG_ADMIN',
        organizationId: org1.id
      }
    });

    const user2 = await prisma.user.upsert({
      where: { clerkId: 'test-user-2' },
      update: {},
      create: {
        clerkId: 'test-user-2',
        email: 'user2@test.com',
        firstName: 'User',
        lastName: 'Two',
        role: 'ORG_ADMIN',
        organizationId: org2.id
      }
    });

    const user3 = await prisma.user.upsert({
      where: { clerkId: 'test-user-3' },
      update: {},
      create: {
        clerkId: 'test-user-3',
        email: 'user3@test.com',
        firstName: 'User',
        lastName: 'Three',
        role: 'USER',
        organizationId: null
      }
    });

    // Create test vendors for different organizations and users
    const vendor1 = await prisma.vendor.upsert({
      where: { id: 'test-vendor-1' },
      update: {},
      create: {
        id: 'test-vendor-1',
        name: 'Vendor 1 - Org 1',
        category: 'LLM/Foundation Models',
        organizationId: org1.id,
        userId: null
      }
    });

    const vendor2 = await prisma.vendor.upsert({
      where: { id: 'test-vendor-2' },
      update: {},
      create: {
        id: 'test-vendor-2',
        name: 'Vendor 2 - Org 2',
        category: 'LLM Orchestration',
        organizationId: org2.id,
        userId: null
      }
    });

    const vendor3 = await prisma.vendor.upsert({
      where: { id: 'test-vendor-3' },
      update: {},
      create: {
        id: 'test-vendor-3',
        name: 'Vendor 3 - User 3',
        category: 'Agentic Frameworks',
        organizationId: null,
        userId: user3.id
      }
    });

    console.log('Created test data:');
    console.log('- Organization 1:', org1.name);
    console.log('- Organization 2:', org2.name);
    console.log('- User 1 (Org 1):', user1.email);
    console.log('- User 2 (Org 2):', user2.email);
    console.log('- User 3 (No Org):', user3.email);
    console.log('- Vendor 1 (Org 1):', vendor1.name);
    console.log('- Vendor 2 (Org 2):', vendor2.name);
    console.log('- Vendor 3 (User 3):', vendor3.name);

    // Test filtering by organization
    console.log('\n--- Testing Organization Filtering ---');
    
    const org1Vendors = await prisma.vendor.findMany({
      where: { organizationId: org1.id }
    });
    console.log(`Org 1 vendors: ${org1Vendors.length} (${org1Vendors.map(v => v.name).join(', ')})`);

    const org2Vendors = await prisma.vendor.findMany({
      where: { organizationId: org2.id }
    });
    console.log(`Org 2 vendors: ${org2Vendors.length} (${org2Vendors.map(v => v.name).join(', ')})`);

    // Test filtering by user
    console.log('\n--- Testing User Filtering ---');
    
    const user3Vendors = await prisma.vendor.findMany({
      where: { userId: user3.id }
    });
    console.log(`User 3 vendors: ${user3Vendors.length} (${user3Vendors.map(v => v.name).join(', ')})`);

    // Test all vendors (QZEN_ADMIN view)
    console.log('\n--- Testing All Vendors (QZEN_ADMIN) ---');
    
    const allVendors = await prisma.vendor.findMany();
    console.log(`All vendors: ${allVendors.length} (${allVendors.map(v => v.name).join(', ')})`);

    console.log('\n✅ Vendor separation test completed successfully!');
    console.log('\nExpected behavior:');
    console.log('- Org 1 users should only see Vendor 1');
    console.log('- Org 2 users should only see Vendor 2');
    console.log('- User 3 should only see Vendor 3');
    console.log('- QZEN_ADMIN should see all vendors');

  } catch (error) {
    console.error('❌ Error testing vendor separation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testVendorSeparation(); 