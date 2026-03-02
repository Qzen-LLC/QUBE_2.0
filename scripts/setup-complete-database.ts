#!/usr/bin/env tsx

/**
 * Complete Database Setup Script
 * 
 * This script sets up the complete database with all required data:
 * - EU AI Act framework (from CSV)
 * - ISO 42001 framework (if available)
 * - Default admin users
 * - Basic organizations
 * 
 * Usage: npm run setup-complete-database
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
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedEuAiActFromCSV } from './seed-eu-ai-act-from-csv';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setupCompleteDatabase() {
  try {
    console.log('🚀 Setting up complete database...\n');
    
    // Step 1: Generate Prisma client
    console.log('📦 Step 1: Generating Prisma client...');
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npx prisma generate', (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error('Error generating Prisma client:', error);
          reject(error);
          return;
        }
        console.log('✅ Prisma client generated');
        resolve(stdout);
      });
    });
    
    // Step 2: Push database schema
    console.log('\n🗄️  Step 2: Pushing database schema...');
    await new Promise((resolve, reject) => {
      exec('npx prisma db push', (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error('Error pushing database schema:', error);
          reject(error);
          return;
        }
        console.log('✅ Database schema pushed');
        resolve(stdout);
      });
    });
    
    // Step 3: Seed EU AI Act framework from CSV
    console.log('\n🇪🇺 Step 3: Seeding EU AI Act framework...');
    await seedEuAiActFromCSV();
    
    // Step 4: Seed ISO 42001 framework (if script exists)
    console.log('\n📋 Step 4: Seeding ISO 42001 framework...');
    try {
      await new Promise((resolve, reject) => {
        exec('npm run seed-complete-iso-42001-data', (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.log('⚠️  ISO 42001 seeding not available or failed');
            resolve(stdout);
            return;
          }
          console.log('✅ ISO 42001 framework seeded');
          resolve(stdout);
        });
      });
    } catch (error) {
      console.log('⚠️  ISO 42001 seeding skipped');
    }
    
    // Step 5: Create default admin user
    console.log('\n👤 Step 5: Creating default admin user...');
    try {
      await prisma.user.upsert({
        where: { email: 'admin@qzen.com' },
        update: {},
        create: {
          id: 'default-admin-id',
          clerkId: 'default-admin-clerk',
          email: 'admin@qzen.com',
          firstName: 'QZen',
          lastName: 'Admin',
          role: 'QZEN_ADMIN',
          isActive: true
        }
      });
      console.log('✅ Default admin user created/verified');
    } catch (error) {
      console.log('⚠️  Default admin user creation skipped (may already exist)');
    }
    
    // Step 6: Final verification
    console.log('\n📊 Final Database Verification:');
    
    const counts = await Promise.all([
      prisma.euAiActControlCategory.count(),
      prisma.euAiActControlStruct.count(),
      prisma.euAiActSubcontrolStruct.count(),
      prisma.user.count(),
      prisma.organization.count()
    ]);
    
    console.log(`📂 EU AI Act Categories: ${counts[0]}`);
    console.log(`🎯 EU AI Act Controls: ${counts[1]}`);
    console.log(`🔧 EU AI Act Subcontrols: ${counts[2]}`);
    console.log(`👥 Users: ${counts[3]}`);
    console.log(`🏢 Organizations: ${counts[4]}`);
    
    console.log('\n🎉 Complete database setup finished!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update Clerk webhook URL if needed');
    console.log('   2. Test user authentication');
    console.log('   3. Verify EU AI Act governance section loads all controls');
    console.log('\n💡 To restore this setup later, run: npm run setup-complete-database');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupCompleteDatabase();
}

export { setupCompleteDatabase };