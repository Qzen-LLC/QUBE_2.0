import { prismaClient } from '@/utils/db';

async function getGuardrailDetails() {
  try {
    // Get the use case
    const useCase = await prismaClient.useCase.findFirst({
      where: { aiucId: 2 }
    });

    if (!useCase) {
      console.log('Use case AICU-2 not found');
      return;
    }

    // Get the latest guardrail configuration
    const latestGuardrail = await prismaClient.guardrail.findFirst({
      where: { useCaseId: useCase.id },
      orderBy: { createdAt: 'desc' },
      include: {
        rules: true
      }
    });

    if (!latestGuardrail) {
      console.log('No guardrails found for this use case');
      return;
    }

    console.log('\n===========================================');
    console.log('LATEST GUARDRAIL CONFIGURATION FOR AICU-2');
    console.log('===========================================\n');
    console.log('Guardrail ID:', latestGuardrail.id);
    console.log('Name:', latestGuardrail.name);
    console.log('Status:', latestGuardrail.status);
    console.log('Approach:', latestGuardrail.approach);
    console.log('Confidence:', latestGuardrail.confidence);
    console.log('Created:', latestGuardrail.createdAt);
    console.log('\n');

    // Parse and display the configuration
    const config = latestGuardrail.configuration as any;
    
    if (config?.guardrails?.rules) {
      console.log('GUARDRAIL RULES BY CATEGORY:');
      console.log('=============================\n');
      
      const categories = Object.keys(config.guardrails.rules);
      let totalRules = 0;
      
      categories.forEach(category => {
        const rules = config.guardrails.rules[category];
        if (Array.isArray(rules) && rules.length > 0) {
          console.log(`\n📋 ${category.toUpperCase()} (${rules.length} rules):`);
          console.log('-'.repeat(50));
          
          rules.forEach((rule: any, index: number) => {
            totalRules++;
            console.log(`\n${index + 1}. ${rule.rule || rule.name}`);
            console.log(`   Severity: ${rule.severity}`);
            console.log(`   Type: ${rule.type || category}`);
            if (rule.description) {
              console.log(`   Description: ${rule.description}`);
            }
            if (rule.rationale) {
              console.log(`   Rationale: ${rule.rationale}`);
            }
            if (rule.implementation) {
              console.log(`   Implementation:`, JSON.stringify(rule.implementation, null, 2).split('\n').map(l => '     ' + l).join('\n').trim());
            }
          });
        }
      });
      
      console.log('\n\n===========================================');
      console.log(`TOTAL RULES: ${totalRules}`);
      console.log('===========================================\n');
    }

    // Also check if there are database rules
    if (latestGuardrail.rules && latestGuardrail.rules.length > 0) {
      console.log('\nDATABASE RULES:');
      console.log('================\n');
      latestGuardrail.rules.forEach((rule: any) => {
        console.log(`- ${rule.rule} (${rule.type}) - ${rule.severity} - Status: ${rule.status}`);
      });
    }

    // Save detailed report
    const fs = await import('fs/promises');
    await fs.writeFile(
      './aicu2-guardrails-detail.json', 
      JSON.stringify({
        guardrailId: latestGuardrail.id,
        configuration: config,
        rules: latestGuardrail.rules
      }, null, 2)
    );
    
    console.log('\n✅ Detailed guardrails saved to: aicu2-guardrails-detail.json');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

getGuardrailDetails();