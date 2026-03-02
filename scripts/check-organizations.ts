#!/usr/bin/env tsx

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

const prisma = new PrismaClient();

async function checkOrganizations() {
  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, domain: true }
    });
    
    console.log('🏢 Current organizations in database:');
    console.log(`Found ${orgs.length} organizations:`);
    orgs.forEach(org => {
      console.log(`  - ${org.id}: ${org.name} (${org.domain})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizations();