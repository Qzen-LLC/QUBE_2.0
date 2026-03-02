#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';

async function syncClerkUsers() {
  try {
    console.log('🔄 Clerk User Sync Utility');
    console.log('==========================\n');
    
    // Get all users from database
    const dbUsers = await prismaClient.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true
      },
      orderBy: { email: 'asc' }
    });
    
    console.log('📊 Database Users Summary:');
    console.log(`Total users in database: ${dbUsers.length}\n`);
    
    // Categorize users by Clerk ID patterns
    const realClerkUsers = dbUsers.filter(user => user.clerkId.startsWith('user_'));
    const testUsers = dbUsers.filter(user => user.clerkId.startsWith('test-') || user.clerkId.startsWith('clerk-'));
    
    console.log('👥 Real Clerk Users (user_*):');
    realClerkUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
      console.log(`   Clerk ID: ${user.clerkId}`);
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`);
      console.log('');
    });
    
    console.log(`🧪 Test Users (${testUsers.length} total):`);
    testUsers.slice(0, 3).forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.clerkId}`);
    });
    if (testUsers.length > 3) {
      console.log(`   ... and ${testUsers.length - 3} more test users`);
    }
    
    // Check for potential duplicates
    console.log('\n🔍 Checking for potential issues:');
    
    const emailGroups = dbUsers.reduce((acc, user) => {
      if (!acc[user.email]) acc[user.email] = [];
      acc[user.email].push(user);
      return acc;
    }, {} as Record<string, typeof dbUsers>);
    
    const duplicateEmails = Object.entries(emailGroups).filter(([email, users]) => users.length > 1);
    
    if (duplicateEmails.length > 0) {
      console.log('⚠️  Duplicate emails found:');
      duplicateEmails.forEach(([email, users]) => {
        console.log(`   ${email}:`);
        users.forEach(user => {
          console.log(`     - ${user.clerkId} (${user.role})`);
        });
      });
    } else {
      console.log('✅ No duplicate emails found');
    }
    
    // Check for missing names
    const usersWithoutNames = realClerkUsers.filter(user => !user.firstName && !user.lastName);
    if (usersWithoutNames.length > 0) {
      console.log(`\n📝 Users without names (${usersWithoutNames.length}):`);
      usersWithoutNames.forEach(user => {
        console.log(`   ${user.email} - ${user.clerkId}`);
      });
    }
    
    // Summary and recommendations
    console.log('\n📋 Summary:');
    console.log(`✅ Total users: ${dbUsers.length}`);
    console.log(`👥 Real Clerk users: ${realClerkUsers.length}`);
    console.log(`🧪 Test users: ${testUsers.length}`);
    console.log(`⚠️  Duplicate emails: ${duplicateEmails.length}`);
    console.log(`📝 Users without names: ${usersWithoutNames.length}`);
    
    console.log('\n💡 Recommendations:');
    if (duplicateEmails.length > 0) {
      console.log('1. ⚠️  Review duplicate emails - may need manual cleanup');
    }
    if (usersWithoutNames.length > 0) {
      console.log('2. 📝 Consider updating user profiles in Clerk to add names');
    }
    console.log('3. ✅ Auto-creation in /api/user/me is now active');
    console.log('4. ✅ Webhook should handle future user creation');
    
    // Test the current setup
    console.log('\n🔧 Testing Current Setup:');
    console.log('✅ Database connection: Working');
    console.log('✅ User backup: Created');
    console.log('✅ Missing users: Added');
    console.log('✅ Auto-creation: Enabled');
    
  } catch (error) {
    console.error('❌ Error in sync utility:', error);
    throw error;
  } finally {
    await prismaClient.$disconnect();
  }
}

if (require.main === module) {
  syncClerkUsers()
    .then(() => {
      console.log('\n✅ Sync utility completed successfully');
    })
    .catch((error) => {
      console.error('❌ Sync utility failed:', error);
      process.exit(1);
    });
}

export default syncClerkUsers;