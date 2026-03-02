import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function checkDuplicateUsers() {
  try {
    console.log('🔍 Checking for duplicate users...');
    
    // Check for duplicate clerkIds
    const duplicateClerkIds = await prisma.$queryRaw`
      SELECT "clerkId", COUNT(*) as count
      FROM "User"
      WHERE "clerkId" IS NOT NULL
      GROUP BY "clerkId"
      HAVING COUNT(*) > 1
    `;
    
    if (Array.isArray(duplicateClerkIds) && duplicateClerkIds.length > 0) {
      console.log('❌ Found duplicate clerkIds:');
      duplicateClerkIds.forEach((item: any) => {
        console.log(`   ${item.clerkId}: ${item.count} occurrences`);
      });
      
      // Get details of duplicate users
      for (const item of duplicateClerkIds) {
        const users = await prisma.user.findMany({
          where: { clerkId: item.clerkId },
          orderBy: { createdAt: 'asc' }
        });
        
        console.log(`\n📋 Details for ${item.clerkId}:`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Created: ${user.createdAt}`);
        });
      }
    } else {
      console.log('✅ No duplicate clerkIds found');
    }
    
    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM "User"
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `;
    
    if (Array.isArray(duplicateEmails) && duplicateEmails.length > 0) {
      console.log('\n❌ Found duplicate emails:');
      duplicateEmails.forEach((item: any) => {
        console.log(`   ${item.email}: ${item.count} occurrences`);
      });
    } else {
      console.log('\n✅ No duplicate emails found');
    }
    
    // Show total user count
    const totalUsers = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);
    
  } catch (error) {
    console.error('❌ Error checking duplicate users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateUsers();
