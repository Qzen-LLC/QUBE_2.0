// Simple Node.js script to debug use cases and create test data
// Run with: node debug-usecase.js

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking existing use cases...');
    
    // Check existing use cases
    const useCases = await prisma.useCase.findMany({
      select: {
        id: true,
        title: true,
        stage: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (useCases.length === 0) {
      console.log('❌ No use cases found in database');
      console.log('💡 Creating a test use case...');
      
      // Create a test use case
      const testUseCase = await prisma.useCase.create({
        data: {
          title: "Test AI Chatbot for Customer Service",
          problemStatement: "Customer service response times are too slow",
          proposedAISolution: "Implement an AI-powered chatbot to handle common queries",
          currentState: "Manual customer service only",
          desiredState: "AI-assisted customer service with 24/7 availability",
          primaryStakeholders: ["Customer Service Manager", "IT Director"],
          secondaryStakeholders: ["Customers", "Support Team"],
          successCriteria: ["Reduce response time by 50%", "Handle 80% of queries automatically"],
          problemValidation: "Validated through customer surveys and service metrics",
          solutionHypothesis: "AI chatbot will significantly improve response times",
          keyAssumptions: ["Customers will accept chatbot interactions", "AI can handle common queries"],
          initialROI: "Expected 30% cost reduction in first year",
          confidenceLevel: 7,
          operationalImpactScore: 8,
          productivityImpactScore: 9,
          revenueImpactScore: 6,
          implementationComplexity: 5,
          estimatedTimeline: "6 months",
          requiredResources: "AI platform, training data, development team",
          businessFunction: "Customer Service",
          stage: "proof-of-value",
          priority: "HIGH"
        }
      });
      
      console.log('✅ Created test use case:');
      console.log(`   ID: ${testUseCase.id}`);
      console.log(`   Title: ${testUseCase.title}`);
      console.log(`   URL: http://localhost:3000/dashboard/${testUseCase.id}/iso-42001`);
      
    } else {
      console.log(`✅ Found ${useCases.length} use cases:`);
      useCases.forEach((uc, i) => {
        console.log(`   ${i+1}. ${uc.title} (${uc.stage})`);
        console.log(`      ID: ${uc.id}`);
        console.log(`      URL: http://localhost:3000/dashboard/${uc.id}/iso-42001`);
        console.log('');
      });
    }
    
    // Check ISO 42001 framework tables
    console.log('🔍 Checking ISO 42001 framework setup...');
    
    try {
      const clauseCount = await prisma.iso42001Clause.count();
      const subclauseCount = await prisma.iso42001Subclause.count();
      const annexCategoryCount = await prisma.iso42001AnnexCategory.count();
      const annexItemCount = await prisma.iso42001AnnexItem.count();
      
      console.log('✅ ISO 42001 framework is set up:');
      console.log(`   Clauses: ${clauseCount}`);
      console.log(`   Subclauses: ${subclauseCount}`);
      console.log(`   Annex Categories: ${annexCategoryCount}`);
      console.log(`   Annex Items: ${annexItemCount}`);
      
      if (clauseCount === 0) {
        console.log('⚠️  No clauses found. Run the SQL scripts to set up the framework.');
      }
      
    } catch (error) {
      console.log('❌ ISO 42001 framework tables not found');
      console.log('💡 Run these SQL scripts in order:');
      console.log('   1. iso-42001-fixed-insert.sql');
      console.log('   2. iso-42001-subclauses-fixed.sql');
      console.log('   3. iso-42001-annex-fixed.sql');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);