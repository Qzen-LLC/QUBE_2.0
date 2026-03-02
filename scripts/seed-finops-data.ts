import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function seedFinOpsData() {
  try {
    console.log('🚀 Starting FinOps data seeding...');
    
    // First, get all use cases that don't have FinOps data
    const useCasesWithoutFinOps = await prisma.useCase.findMany({
      where: {
        finopsData: null
      },
      select: {
        id: true,
        title: true,
        aiucId: true
      }
    });
    
    console.log(`📊 Found ${useCasesWithoutFinOps.length} use cases without FinOps data`);
    
    if (useCasesWithoutFinOps.length === 0) {
      console.log('✅ All use cases already have FinOps data');
      return;
    }
    
    // Generate sample FinOps data for each use case
    const finOpsPromises = useCasesWithoutFinOps.map(async (useCase) => {
      // Generate realistic sample data
      const devCostBase = Math.floor(Math.random() * 100000) + 20000; // $20k-$120k
      const apiCostBase = Math.floor(Math.random() * 50000) + 5000;   // $5k-$55k
      const infraCostBase = Math.floor(Math.random() * 30000) + 10000; // $10k-$40k
      const opCostBase = Math.floor(Math.random() * 20000) + 5000;    // $5k-$25k
      const totalInvestment = devCostBase + apiCostBase + infraCostBase + opCostBase;
      
      const valueBase = Math.floor(Math.random() * 200000) + 50000;   // $50k-$250k
      const valueGrowthRate = (Math.random() * 0.3) + 0.05;          // 5%-35%
      const cumValue = valueBase * (1 + valueGrowthRate) * 3;        // 3 year projection
      const cumOpCost = opCostBase * 3;                              // 3 year op costs
      const netValue = cumValue - totalInvestment - cumOpCost;
      const ROI = ((netValue / totalInvestment) * 100);
      
      const budgetRanges = ['$50K-$100K', '$100K-$250K', '$250K-$500K', '$500K-$1M', '$1M+'];
      const budgetRange = budgetRanges[Math.floor(Math.random() * budgetRanges.length)];
      
      return prisma.finOps.create({
        data: {
          useCaseId: useCase.id,
          ROI: parseFloat(ROI.toFixed(2)),
          netValue: parseFloat(netValue.toFixed(2)),
          apiCostBase: parseFloat(apiCostBase.toFixed(2)),
          cumOpCost: parseFloat(cumOpCost.toFixed(2)),
          cumValue: parseFloat(cumValue.toFixed(2)),
          devCostBase: parseFloat(devCostBase.toFixed(2)),
          infraCostBase: parseFloat(infraCostBase.toFixed(2)),
          opCostBase: parseFloat(opCostBase.toFixed(2)),
          totalInvestment: parseFloat(totalInvestment.toFixed(2)),
          valueBase: parseFloat(valueBase.toFixed(2)),
          valueGrowthRate: parseFloat(valueGrowthRate.toFixed(3)),
          budgetRange: budgetRange
        }
      });
    });
    
    console.log('💰 Creating FinOps data...');
    await Promise.all(finOpsPromises);
    
    console.log(`✅ Successfully created FinOps data for ${useCasesWithoutFinOps.length} use cases`);
    
    // Display summary
    const totalFinOps = await prisma.finOps.count();
    console.log(`📈 Total FinOps records in database: ${totalFinOps}`);
    
  } catch (error) {
    console.error('❌ Error seeding FinOps data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinOpsData();