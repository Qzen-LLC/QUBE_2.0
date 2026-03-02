#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function backupUserData() {
  try {
    console.log('🛡️  Creating backup of current user data...');
    
    // Get all current users
    const users = await prismaClient.user.findMany({
      include: {
        organization: true
      }
    });
    
    // Get all organizations
    const organizations = await prismaClient.organization.findMany();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      totalOrganizations: organizations.length,
      users,
      organizations
    };
    
    // Create backup file
    const backupFileName = `user-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupPath = join(process.cwd(), 'scripts', 'backups', backupFileName);
    
    // Ensure backup directory exists
    const { mkdirSync, existsSync } = await import('fs');
    const backupDir = join(process.cwd(), 'scripts', 'backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    
    writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Backup created successfully!');
    console.log(`📁 File: ${backupFileName}`);
    console.log(`📊 Backed up: ${users.length} users, ${organizations.length} organizations`);
    
    // Show summary
    console.log('\n📋 Current Users Summary:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Clerk: ${user.clerkId}`);
    });
    
    console.log('\n🛡️  Data is safely backed up before any changes!');
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prismaClient.$disconnect();
  }
}

if (require.main === module) {
  backupUserData()
    .then((backupPath) => {
      console.log(`\n✅ Backup complete: ${backupPath}`);
    })
    .catch((error) => {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    });
}

export default backupUserData;