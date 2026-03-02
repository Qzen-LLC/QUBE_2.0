#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';

async function testGuardrailsDetection() {
  console.log('🔍 Testing Guardrails Detection\n');
  console.log('='.repeat(70));

  try {
    // Get a use case ID from command line or use first one with guardrails
    const useCaseId = process.argv[2];
    
    if (!useCaseId) {
      // Find a use case with guardrails
      const useCaseWithGuardrails = await prismaClient.guardrail.findFirst({
        include: {
          useCase: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!useCaseWithGuardrails) {
        console.log('❌ No guardrails found in database');
        process.exit(1);
      }

      const testUseCaseId = useCaseWithGuardrails.useCaseId;
      console.log(`\n📋 Testing with Use Case: ${useCaseWithGuardrails.useCase.title}`);
      console.log(`   ID: ${testUseCaseId}\n`);
      
      await testGuardrailsForUseCase(testUseCaseId);
    } else {
      await testGuardrailsForUseCase(useCaseId);
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

async function testGuardrailsForUseCase(useCaseId: string) {
  console.log(`\n🔍 Testing guardrails detection for use case: ${useCaseId}\n`);

  // Test 1: Check if guardrails exist in database
  console.log('📊 Test 1: Checking database for guardrails...');
  const allGuardrails = await prismaClient.guardrail.findMany({
    where: { useCaseId },
    include: {
      rules: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`   Found ${allGuardrails.length} guardrail record(s)`);

  if (allGuardrails.length === 0) {
    console.log('   ❌ No guardrails found in database');
    return;
  }

  allGuardrails.forEach((guardrail, index) => {
    console.log(`\n   Guardrail ${index + 1}:`);
    console.log(`   - ID: ${guardrail.id}`);
    console.log(`   - Status: ${guardrail.status}`);
    console.log(`   - Created: ${guardrail.createdAt}`);
    console.log(`   - Has Configuration: ${!!guardrail.configuration}`);
    console.log(`   - Configuration Type: ${typeof guardrail.configuration}`);
    console.log(`   - Rules Count: ${guardrail.rules?.length || 0}`);
    
    if (guardrail.configuration) {
      const config = guardrail.configuration as any;
      if (typeof config === 'object') {
        console.log(`   - Config Keys: ${Object.keys(config).join(', ')}`);
        if (config.rules) {
          console.log(`   - Config Rules Count: ${Array.isArray(config.rules) ? config.rules.length : 'N/A'}`);
        }
        if (config.metadata) {
          console.log(`   - Config Metadata:`, config.metadata);
        }
      }
    }
  });

  // Test 2: Simulate the fetchGuardrails logic
  console.log('\n📊 Test 2: Simulating fetchGuardrails logic...');
  const latestGuardrail = await prismaClient.guardrail.findFirst({
    where: { useCaseId },
    orderBy: { createdAt: 'desc' },
    include: { rules: true }
  });

  if (!latestGuardrail) {
    console.log('   ❌ No guardrail found (should not happen)');
    return;
  }

  console.log(`   ✅ Found latest guardrail: ${latestGuardrail.id}`);
  console.log(`   - Has Configuration: ${!!latestGuardrail.configuration}`);
  console.log(`   - Configuration Type: ${typeof latestGuardrail.configuration}`);

  // Check if configuration is valid
  if (latestGuardrail.configuration && typeof latestGuardrail.configuration === 'object') {
    const config = latestGuardrail.configuration as any;
    console.log(`   ✅ Configuration is valid object`);
    console.log(`   - Keys: ${Object.keys(config).join(', ')}`);
    
    // Check for required fields
    const hasRules = config.rules && (Array.isArray(config.rules) || typeof config.rules === 'object');
    const hasMetadata = config.metadata && typeof config.metadata === 'object';
    
    console.log(`   - Has Rules: ${hasRules}`);
    console.log(`   - Has Metadata: ${hasMetadata}`);
    
    if (hasRules || hasMetadata) {
      console.log(`   ✅ Configuration appears valid`);
    } else {
      console.log(`   ⚠️  Configuration may be empty or invalid`);
    }
  } else {
    console.log(`   ⚠️  Configuration is missing or invalid type`);
    
    // Check if we can reconstruct from rules
    if (latestGuardrail.rules && latestGuardrail.rules.length > 0) {
      console.log(`   ✅ Has ${latestGuardrail.rules.length} rules - can reconstruct configuration`);
    } else {
      console.log(`   ❌ No rules available to reconstruct configuration`);
    }
  }

  // Test 3: Check what the API would return
  console.log('\n📊 Test 3: What would EvaluationContextAggregator return?');
  
  if (latestGuardrail.configuration && typeof latestGuardrail.configuration === 'object') {
    console.log('   ✅ Would return configuration object');
    const config = latestGuardrail.configuration as any;
    if (config.rules) {
      const rulesCount = Array.isArray(config.rules) ? config.rules.length : Object.keys(config.rules || {}).length;
      console.log(`   - Rules in config: ${rulesCount}`);
    }
  } else if (latestGuardrail.rules && latestGuardrail.rules.length > 0) {
    console.log('   ⚠️  Would try to reconstruct from rules');
    console.log(`   - Rules available: ${latestGuardrail.rules.length}`);
  } else {
    console.log('   ❌ Would return null (no guardrails)');
    console.log('   This would cause the "Guardrails Required" error');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary:\n');
  
  const hasValidConfig = latestGuardrail.configuration && typeof latestGuardrail.configuration === 'object';
  const hasRules = latestGuardrail.rules && latestGuardrail.rules.length > 0;
  
  if (hasValidConfig) {
    console.log('✅ Guardrails should be detected correctly');
    console.log('   Configuration exists and is valid');
  } else if (hasRules) {
    console.log('⚠️  Guardrails exist but configuration may need reconstruction');
    console.log('   Rules are available, but configuration field may be empty');
  } else {
    console.log('❌ Guardrails may not be detected');
    console.log('   Configuration is missing and no rules available');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!hasValidConfig && hasRules) {
    console.log('   - Guardrails exist but configuration field is empty');
    console.log('   - Try regenerating guardrails to populate the configuration field');
    console.log('   - Or the system should reconstruct from rules (check fetchGuardrails method)');
  } else if (!hasValidConfig && !hasRules) {
    console.log('   - Guardrails record exists but has no configuration or rules');
    console.log('   - Regenerate guardrails to ensure proper data');
  }
}

testGuardrailsDetection().catch(console.error);


