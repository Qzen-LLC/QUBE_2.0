#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function fixDatabaseConnections() {
  try {
    console.log('🔧 Fixing database connection issues...');
    
    // Read current .env file
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    // Find DATABASE_URL line
    const lines = envContent.split('\n');
    let updatedLines = [];
    let foundDatabaseUrl = false;
    
    for (const line of lines) {
      if (line.startsWith('DATABASE_URL=')) {
        foundDatabaseUrl = true;
        const currentUrl = line.substring('DATABASE_URL='.length);
        
        // Check if it already has connection pooling
        if (currentUrl.includes('connection_limit')) {
          console.log('✅ Connection pooling already configured');
          updatedLines.push(line);
        } else {
          // Add connection pooling parameters
          const separator = currentUrl.includes('?') ? '&' : '?';
          const pooledUrl = `${currentUrl}${separator}connection_limit=10&pool_timeout=20&pgbouncer=true`;
          updatedLines.push(`DATABASE_URL=${pooledUrl}`);
          console.log('✅ Added connection pooling parameters');
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    if (!foundDatabaseUrl) {
      console.log('❌ DATABASE_URL not found in .env file');
      return;
    }
    
    // Write updated .env file
    writeFileSync(envPath, updatedLines.join('\n'));
    console.log('✅ Updated .env file with connection pooling');
    
    console.log('\n🔄 Recommended actions:');
    console.log('1. Restart your development server');
    console.log('2. Monitor for connection errors');
    console.log('3. Consider upgrading to Neon Pro for more connections if needed');
    
  } catch (error) {
    console.error('❌ Error fixing database connections:', error);
  }
}

fixDatabaseConnections();