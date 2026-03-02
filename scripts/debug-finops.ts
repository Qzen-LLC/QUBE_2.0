import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function debugFinOps() {
  try {
    console.log('🔍 Debugging FinOps data...');
    
    // Check total use cases
    const totalUseCases = await prisma.useCase.count();
    console.log(`📊 Total use cases: ${totalUseCases}`);
    
    // Check total FinOps records
    const totalFinOps = await prisma.finOps.count();
    console.log(`💰 Total FinOps records: ${totalFinOps}`);
    
    // Get use cases with their FinOps data
    const useCasesWithFinOps = await prisma.useCase.findMany({
      include: {
        finopsData: true
      },
      take: 5
    });
    
    console.log('\n📋 Sample use cases with FinOps data:');
    useCasesWithFinOps.forEach((uc, index) => {
      console.log(`${index + 1}. ${uc.title} (${uc.aiucId})`);
      console.log(`   FinOps: ${uc.finopsData ? 'Yes' : 'No'}`);
      if (uc.finopsData) {
        console.log(`   ROI: ${uc.finopsData.ROI}%`);
        console.log(`   Total Investment: $${uc.finopsData.totalInvestment}`);
      }
      console.log('');
    });
    
    // Check use cases in relevant stages
    const relevantStages = [
      'backlog',
      'in-progress', 
      'solution-validation',
      'pilot',
      'deployment',
      'operational'
    ];
    
    const useCasesInRelevantStages = await prisma.useCase.findMany({
      where: {
        stage: {
          in: relevantStages
        }
      },
      include: {
        finopsData: true
      }
    });
    
    console.log(`🎯 Use cases in relevant stages: ${useCasesInRelevantStages.length}`);
    console.log(`💼 Use cases with FinOps data in relevant stages: ${useCasesInRelevantStages.filter(uc => uc.finopsData).length}`);
    
  } catch (error) {
    console.error('❌ Error debugging FinOps:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFinOps();