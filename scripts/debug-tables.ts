#!/usr/bin/env tsx

// Load environment variables manually
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

async function debugTables() {
  console.log('🔍 Checking available Prisma tables...\n');

  // Check what methods are available on prisma client
  console.log('📋 Available Prisma methods:');
  const methods = Object.getOwnPropertyNames(prisma).filter(name => 
    !name.startsWith('_') && 
    !name.startsWith('$') && 
    typeof (prisma as any)[name] === 'object'
  );
  methods.forEach(method => console.log(`  - ${method}`));

  // Try to count use cases using different possible names
  const possibleNames = ['useCase', 'aiUseCase', 'UseCase', 'AiUseCase'];
  
  for (const name of possibleNames) {
    try {
      if ((prisma as any)[name]) {
        const count = await (prisma as any)[name].count();
        console.log(`\n✅ Found table '${name}' with ${count} records`);
        
        if (count > 0) {
          const sample = await (prisma as any)[name].findFirst();
          console.log(`   Sample record keys:`, Object.keys(sample));
        }
      }
    } catch (error) {
      console.log(`\n❌ Table '${name}' not accessible: ${error.message}`);
    }
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  debugTables();
}

export default debugTables;