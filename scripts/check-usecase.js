// Quick script to check if use case uc-6 exists
// Run with: node check-usecase.js

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkUseCase() {
  try {
    console.log('🔍 Checking use case uc-6...');
    
    const useCase = await prisma.useCase.findUnique({
      where: { id: 'uc-6' },
      select: {
        id: true,
        title: true,
        stage: true,
        createdAt: true
      }
    });
    
    if (useCase) {
      console.log('✅ Use case uc-6 found:');
      console.log('   Title:', useCase.title);
      console.log('   Stage:', useCase.stage);
      console.log('   Created:', useCase.createdAt);
    } else {
      console.log('❌ Use case uc-6 NOT found');
      console.log('');
      console.log('📋 Available use cases:');
      
      const allUseCases = await prisma.useCase.findMany({
        select: {
          id: true,
          title: true,
          stage: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      if (allUseCases.length === 0) {
        console.log('   No use cases found in database');
        console.log('   💡 Create a use case at: /new-usecase');
      } else {
        allUseCases.forEach((uc, i) => {
          console.log(`   ${i+1}. ${uc.id} - ${uc.title} (${uc.stage})`);
          console.log(`      URL: /dashboard/${uc.id}/iso-42001`);
        });
      }
    }
    
    // Also check ISO 42001 framework
    console.log('');
    console.log('🔍 Checking ISO 42001 framework...');
    
    try {
      const [clauseCount, subclauseCount, annexCategoryCount, annexItemCount] = await Promise.all([
        prisma.iso42001Clause.count(),
        prisma.iso42001Subclause.count(),
        prisma.iso42001AnnexCategory.count(),
        prisma.iso42001AnnexItem.count()
      ]);
      
      console.log('✅ Framework table counts:');
      console.log(`   Clauses: ${clauseCount}`);
      console.log(`   Subclauses: ${subclauseCount}`);
      console.log(`   Annex Categories: ${annexCategoryCount}`);
      console.log(`   Annex Items: ${annexItemCount}`);
      
      if (subclauseCount === 0 || annexItemCount === 0) {
        console.log('⚠️  Missing framework data. Run these SQL scripts:');
        if (subclauseCount === 0) console.log('   - iso-42001-subclauses-fixed.sql');
        if (annexItemCount === 0) console.log('   - iso-42001-annex-fixed.sql');
      }
      
    } catch (frameworkError) {
      console.log('❌ Framework tables missing or inaccessible');
      console.log('💡 Run these SQL scripts:');
      console.log('   1. iso-42001-fixed-insert.sql (clauses)');
      console.log('   2. iso-42001-subclauses-fixed.sql (subclauses)');
      console.log('   3. iso-42001-annex-fixed.sql (annex data)');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUseCase();