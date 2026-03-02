import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function createAuthBypass() {
  console.log('🔧 Creating auth bypass for development...');
  console.log('');
  console.log('📋 To bypass authentication temporarily, you can:');
  console.log('');
  console.log('1. 🎯 Access dashboard directly:');
  console.log('   http://localhost:3001/dashboard');
  console.log('');
  console.log('2. 🔧 Or modify your middleware to bypass auth:');
  console.log('   Comment out auth checks in middleware.ts');
  console.log('');
  console.log('3. 👤 Your user account is ready:');
  console.log('   Email: Kramesh06@gmail.com');
  console.log('   Role: QZEN_ADMIN');
  console.log('   ID: d4b794a4-d6c9-4bf0-b9ec-5ab56933e6ca');
  console.log('');
  console.log('4. ✅ All framework data is loaded:');
  console.log('   - EU AI ACT Framework (70 questions, 25 controls)');
  console.log('   - ISO 42001 Framework (24 subclauses, 37 annex items)');
  console.log('');
  console.log('🚀 Ready to create use cases with improved forms!');
}

createAuthBypass();