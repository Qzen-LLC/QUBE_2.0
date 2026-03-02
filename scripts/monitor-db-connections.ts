#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';

async function monitorConnections() {
  try {
    console.log('🔍 Monitoring database connections...');
    
    // Test basic connection
    console.log('1. Testing basic connection...');
    await prismaClient.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection: OK');
    
    // Check connection pool status
    console.log('\n2. Checking connection pool...');
    const result = await prismaClient.$queryRaw`
      SELECT 
        datname,
        numbackends,
        xact_commit,
        xact_rollback,
        blks_read,
        blks_hit
      FROM pg_stat_database 
      WHERE datname = current_database()
    ` as any[];
    
    if (result.length > 0) {
      const stats = result[0];
      console.log('✅ Database stats:');
      console.log(`   Active connections: ${stats.numbackends}`);
      console.log(`   Committed transactions: ${stats.xact_commit}`);
      console.log(`   Rolled back transactions: ${stats.xact_rollback}`);
    }
    
    // Test multiple concurrent connections
    console.log('\n3. Testing concurrent connections...');
    const promises = Array(5).fill(0).map(async (_, i) => {
      try {
        const start = Date.now();
        await prismaClient.user.count();
        const duration = Date.now() - start;
        console.log(`✅ Connection ${i + 1}: ${duration}ms`);
        return true;
      } catch (error) {
        console.log(`❌ Connection ${i + 1} failed:`, error.message);
        return false;
      }
    });
    
    const results = await Promise.all(promises);
    const successCount = results.filter(Boolean).length;
    console.log(`✅ Concurrent test: ${successCount}/5 connections succeeded`);
    
    if (successCount < 5) {
      console.log('\n⚠️  Some connections failed. Consider:');
      console.log('1. Restarting your development server');
      console.log('2. Checking Neon dashboard for connection limits');
      console.log('3. Upgrading to higher Neon tier if needed');
    } else {
      console.log('\n🎉 All connections working properly!');
    }
    
  } catch (error) {
    console.error('❌ Connection monitoring failed:', error);
    
    if (error.message?.includes('too many clients')) {
      console.log('\n💡 Solution: Connection pool exhausted');
      console.log('1. Restart your development server');
      console.log('2. Ensure you close connections properly');
      console.log('3. Consider upgrading your Neon plan');
    }
    
  } finally {
    await prismaClient.$disconnect();
  }
}

monitorConnections();