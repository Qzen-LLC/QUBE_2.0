/**
 * Quick script to check guardrails in database for a specific use case
 */

// Use the project's Prisma client location
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkGuardrails() {
  try {
    const useCaseId = process.argv[2] || '7b1fcfed-b650-4870-a8c1-e12db2084a55';

    console.log(`\n🔍 Checking guardrails for use case: ${useCaseId}\n`);

    // First, check ALL guardrails in the database to see what exists
    const allGuardrails = await prisma.guardrail.findMany({
      select: {
        id: true,
        useCaseId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 Recent guardrails in database (last 10):`);
    if (allGuardrails.length === 0) {
      console.log('   (None found - database is empty)');
    } else {
      allGuardrails.forEach((g, idx) => {
        const isMatch = g.useCaseId === useCaseId ? '✅ MATCH' : '';
        console.log(`   ${idx + 1}. ID: ${g.id}`);
        console.log(`       Use Case: ${g.useCaseId} ${isMatch}`);
        console.log(`       Created: ${g.createdAt.toISOString()}`);
        console.log();
      });
    }
    console.log();

    // Find all guardrails for this use case
    const guardrails = await prisma.guardrail.findMany({
      where: { useCaseId },
      include: { rules: true },
      orderBy: { createdAt: 'desc' }
    });

    if (guardrails.length === 0) {
      console.log('❌ NO GUARDRAILS FOUND for this specific use case');
      console.log('\n✅ Solution: Go to the "AI Guardrails" tab and generate guardrails\n');
      return;
    }

    console.log(`✅ Found ${guardrails.length} guardrail record(s)\n`);

    guardrails.forEach((g, idx) => {
      console.log(`\n📋 Guardrail Record #${idx + 1}:`);
      console.log(`   ID: ${g.id}`);
      console.log(`   Created: ${g.createdAt}`);
      console.log(`   Status: ${g.status}`);
      console.log(`   Has configuration: ${!!g.configuration}`);
      console.log(`   Configuration type: ${typeof g.configuration}`);
      console.log(`   Number of rules: ${g.rules?.length || 0}`);

      if (g.configuration) {
        const config = g.configuration;
        if (config.guardrails?.rules) {
          const ruleCategories = Object.keys(config.guardrails.rules);
          const totalRules = Object.values(config.guardrails.rules)
            .filter(r => Array.isArray(r))
            .reduce((sum, rules) => sum + rules.length, 0);
          console.log(`   Configuration structure: guardrails.rules`);
          console.log(`   Categories: ${ruleCategories.join(', ')}`);
          console.log(`   Total rules in config: ${totalRules}`);
        } else if (config.rules) {
          const ruleCategories = Object.keys(config.rules);
          const totalRules = Object.values(config.rules)
            .filter(r => Array.isArray(r))
            .reduce((sum, rules) => sum + rules.length, 0);
          console.log(`   Configuration structure: rules (direct)`);
          console.log(`   Categories: ${ruleCategories.join(', ')}`);
          console.log(`   Total rules in config: ${totalRules}`);
        } else {
          console.log(`   ⚠️  Configuration exists but has unexpected structure`);
          console.log(`   Configuration keys: ${Object.keys(config).join(', ')}`);
        }
      } else {
        console.log(`   ⚠️  Configuration is NULL or missing`);
      }

      if (g.rules && g.rules.length > 0) {
        const rulesByType = {};
        g.rules.forEach(rule => {
          rulesByType[rule.type] = (rulesByType[rule.type] || 0) + 1;
        });
        console.log(`   Rules by type:`, rulesByType);
      }
    });

    // Show diagnosis
    const latest = guardrails[0];
    console.log('\n\n📊 DIAGNOSIS:');

    if (!latest.configuration && (!latest.rules || latest.rules.length === 0)) {
      console.log('❌ PROBLEM: Guardrail record exists but has NO configuration and NO rules');
      console.log('✅ SOLUTION: Regenerate guardrails on the "AI Guardrails" tab');
    } else if (!latest.configuration && latest.rules && latest.rules.length > 0) {
      console.log('⚙️  FIXABLE: Configuration is missing but rules exist');
      console.log('✅ The system should automatically reconstruct configuration from rules');
      console.log('   If evaluation still fails, check server console logs for details');
    } else if (latest.configuration) {
      console.log('✅ GOOD: Configuration exists');
      console.log('   If evaluation still fails, check server console for detailed logs');
    }

    console.log('\n');

  } catch (error) {
    console.error('Error checking guardrails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGuardrails();
