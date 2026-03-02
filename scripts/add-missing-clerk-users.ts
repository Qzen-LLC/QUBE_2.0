#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';

// Missing users identified from Clerk
const missingUsers = [
  {
    clerkId: 'user_2zulksw3dvAyBQifFWL4d3CTKn1',
    email: 'kramesh06@gmail.com',
    firstName: 'Ramesh',
    lastName: 'Kaluri',
    role: 'QZEN_ADMIN', // Your admin account
    organizationId: null
  },
  {
    clerkId: 'user_31FmDhcKNvj18LazqBzKniU1tqY',
    email: 'spoorthisugoor@gmail.com',
    firstName: 'Spoorthi',
    lastName: 'Sugoor',
    role: 'USER', // Default role for new users
    organizationId: null
  },
  {
    clerkId: 'user_31Fru6QNyKIkuQ8FlLRAQbsQ1Gp',
    email: 'qzenai9@gmail.com',
    firstName: 'QZen',
    lastName: 'AI',
    role: 'USER', // Default role for new users
    organizationId: null
  }
];

async function addMissingUsers() {
  try {
    console.log('🔧 Adding missing Clerk users to database...');
    console.log('⚠️  SAFE MODE: Only adding missing users, no deletions!\n');
    
    let addedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    
    for (const userData of missingUsers) {
      try {
        console.log(`🔍 Checking user: ${userData.email}`);
        
        // Check if user already exists (by email OR clerkId)
        const existingUser = await prismaClient.user.findFirst({
          where: {
            OR: [
              { email: userData.email },
              { clerkId: userData.clerkId }
            ]
          }
        });
        
        if (existingUser) {
          console.log(`✅ User already exists: ${userData.email} (${existingUser.clerkId})`);
          existingCount++;
          
          // Update clerkId if it's different (for cases where email exists but clerkId was missing)
          if (existingUser.clerkId !== userData.clerkId) {
            await prismaClient.user.update({
              where: { id: existingUser.id },
              data: { clerkId: userData.clerkId }
            });
            console.log('[CRUD_LOG] User updated with clerk ID (script):', { id: existingUser.id, email: existingUser.email, clerkId: userData.clerkId, authoredBy: existingUser.id });
            console.log(`🔄 Updated Clerk ID for ${userData.email}`);
          }
        } else {
          // Safe creation using upsert
          const newUser = await prismaClient.user.upsert({
            where: { clerkId: userData.clerkId },
            update: {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role as any
            },
            create: {
              clerkId: userData.clerkId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role as any,
              organizationId: userData.organizationId
            }
          });
          
          console.log('[CRUD_LOG] User upserted (script):', { id: newUser.id, email: newUser.email, role: newUser.role, clerkId: newUser.clerkId, authoredBy: newUser.id });
          console.log(`✅ Added user: ${userData.email} (${userData.role})`);
          addedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${userData.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Added: ${addedCount} users`);
    console.log(`ℹ️  Already existed: ${existingCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    
    // Verify final state
    console.log('\n🔍 Verifying users are now in database:');
    for (const userData of missingUsers) {
      const verifyUser = await prismaClient.user.findUnique({
        where: { clerkId: userData.clerkId }
      });
      
      if (verifyUser) {
        console.log(`✅ Confirmed: ${userData.email} -> ${verifyUser.role}`);
      } else {
        console.log(`❌ Missing: ${userData.email}`);
      }
    }
    
    console.log('\n🎉 Process completed safely - no data was deleted!');
    
  } catch (error) {
    console.error('❌ Error adding missing users:', error);
    throw error;
  } finally {
    await prismaClient.$disconnect();
  }
}

if (require.main === module) {
  addMissingUsers()
    .then(() => {
      console.log('✅ Missing users added successfully');
    })
    .catch((error) => {
      console.error('❌ Process failed:', error);
      process.exit(1);
    });
}

export default addMissingUsers;