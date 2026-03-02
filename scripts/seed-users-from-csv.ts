#!/usr/bin/env tsx

/**
 * User Import Script from CSV
 * 
 * This script imports users from User_rows.csv and adds missing entries to the user table
 * Uses upsert operations to handle existing users gracefully
 * 
 * Usage: npm run seed-users-from-csv
 */

// Load environment variables
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('Warning: Could not load .env file');
}

import { PrismaClient } from '@/generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedUsersFromCSV() {
  try {
    console.log('👥 Seeding Users from CSV file...');
    
    // Check if CSV file exists
    const usersCsvPath = '/Users/kaluri/Downloads/User_rows.csv';
    
    if (!fs.existsSync(usersCsvPath)) {
      console.error('❌ Users CSV file not found at:', usersCsvPath);
      console.log('Please ensure User_rows.csv is available');
      return;
    }
    
    console.log('📁 Using CSV file:', usersCsvPath);
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(usersCsvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    if (lines.length < 2) {
      console.error('❌ CSV file appears to be empty or invalid');
      return;
    }
    
    // Parse header to understand column structure
    const headers = lines[0].split(',');
    console.log('📋 CSV Headers:', headers);
    
    let usersImported = 0;
    let usersUpdated = 0;
    let usersSkipped = 0;
    let usersErrors = 0;
    
    // Check current users in database
    console.log('\n🔍 Checking current users in database...');
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true, clerkId: true }
    });
    console.log(`📊 Found ${existingUsers.length} existing users`);
    
    // Parse CSV more carefully - handle quoted fields and empty values
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      
      return result;
    };
    
    // Process each user (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 8) {
        console.log(`⚠️  Skipping malformed line ${i}: insufficient columns`);
        usersErrors++;
        continue;
      }
      
      const userData = {
        id: values[0],
        clerkId: values[1],
        email: values[2],
        firstName: values[3],
        lastName: values[4],
        role: values[5] as 'QZEN_ADMIN' | 'ORG_ADMIN' | 'ORG_USER' | 'USER',
        organizationId: values[6] || null, // Empty string becomes null
        isActive: values[7] === 'true',
        createdAt: values[8] ? new Date(values[8]) : new Date(),
        updatedAt: values[9] ? new Date(values[9]) : new Date()
      };
      
      try {
        // Validate required fields
        if (!userData.id || !userData.clerkId || !userData.email || !userData.firstName || !userData.lastName) {
          console.log(`⚠️  Skipping user with missing required fields: ${userData.email}`);
          usersErrors++;
          continue;
        }
        
        // Validate role
        const validRoles = ['QZEN_ADMIN', 'ORG_ADMIN', 'ORG_USER', 'USER'];
        if (!validRoles.includes(userData.role)) {
          console.log(`⚠️  Skipping user with invalid role: ${userData.email} (${userData.role})`);
          usersErrors++;
          continue;
        }
        
        // Check if organization exists (if organizationId is specified)
        if (userData.organizationId) {
          const orgExists = await prisma.organization.findUnique({
            where: { id: userData.organizationId }
          });
          
          if (!orgExists) {
            console.log(`⚠️  Organization ${userData.organizationId} not found for user ${userData.email}, setting to null`);
            userData.organizationId = null;
          }
        }
        
        // Use upsert to handle existing users
        const result = await prisma.user.upsert({
          where: { id: userData.id },
          update: {
            clerkId: userData.clerkId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            organizationId: userData.organizationId,
            isActive: userData.isActive,
            updatedAt: userData.updatedAt
          },
          create: {
            id: userData.id,
            clerkId: userData.clerkId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            organizationId: userData.organizationId,
            isActive: userData.isActive,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          }
        });
        
        // Check if this was an insert or update
        const wasExisting = existingUsers.some(u => u.id === userData.id);
        if (wasExisting) {
          console.log(`🔄 Updated user: ${userData.email} (${userData.firstName} ${userData.lastName})`);
          usersUpdated++;
        } else {
          console.log(`✅ Imported user: ${userData.email} (${userData.firstName} ${userData.lastName})`);
          usersImported++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error.message);
        usersErrors++;
      }
    }
    
    // Final statistics
    console.log(`\n📊 Users Import Summary:`);
    console.log(`✅ Successfully imported (new): ${usersImported} users`);
    console.log(`🔄 Successfully updated (existing): ${usersUpdated} users`);
    console.log(`❌ Errors: ${usersErrors} users`);
    
    // Final verification
    console.log('\n📈 Final Database State:');
    const totalUsers = await prisma.user.count();
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log('📋 Users by Role:');
    usersByRole.forEach(roleGroup => {
      console.log(`   ${roleGroup.role}: ${roleGroup._count.role} users`);
    });
    
    console.log('\n🎉 User import from CSV completed successfully!');
    console.log('\n💡 This script can be run again to update users from CSV file.');
    
  } catch (error) {
    console.error('❌ User seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedUsersFromCSV();
}

export { seedUsersFromCSV };