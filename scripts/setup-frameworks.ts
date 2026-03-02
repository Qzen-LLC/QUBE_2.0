#!/usr/bin/env tsx

import { seedFrameworks } from '../src/lib/seed-frameworks';

async function main() {
  console.log('Setting up framework data...');
  
  try {
    await seedFrameworks();
    console.log('✅ Framework setup completed successfully!');
  } catch (error) {
    console.error('❌ Framework setup failed:', error);
    process.exit(1);
  }
}

main();