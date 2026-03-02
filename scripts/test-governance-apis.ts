#!/usr/bin/env tsx

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function testGovernanceAPIs() {
  console.log('🧪 Testing Governance API Data Availability...\n');

  try {
    // Test EU AI Act framework data
    console.log('📊 EU AI Act Framework:');
    const topics = await prisma.euAiActTopic.count();
    const subtopics = await prisma.euAiActSubtopic.count();
    const questions = await prisma.euAiActQuestion.count();
    const controlCategories = await prisma.euAiActControlCategory.count();
    const controls = await prisma.euAiActControlStruct.count();
    const subcontrols = await prisma.euAiActSubcontrolStruct.count();

    console.log(`  ✅ Topics: ${topics}`);
    console.log(`  ✅ Subtopics: ${subtopics}`);
    console.log(`  ✅ Questions: ${questions}`);
    console.log(`  ✅ Control Categories: ${controlCategories}`);
    console.log(`  ✅ Control Structures: ${controls}`);
    console.log(`  ✅ Subcontrol Structures: ${subcontrols}`);

    if (topics === 0) {
      console.log('  ⚠️  EU AI Act framework is empty - run seed scripts');
    }

    // Test ISO 42001 framework data
    console.log('\n📊 ISO 42001 Framework:');
    const clauses = await prisma.iso42001Clause.count();
    const subclauses = await prisma.iso42001Subclause.count();
    const annexCategories = await prisma.iso42001AnnexCategory.count();
    const annexItems = await prisma.iso42001AnnexItem.count();

    console.log(`  ✅ Clauses: ${clauses}`);
    console.log(`  ✅ Subclauses: ${subclauses}`);
    console.log(`  ✅ Annex Categories: ${annexCategories}`);
    console.log(`  ✅ Annex Items: ${annexItems}`);

    if (clauses === 0) {
      console.log('  ⚠️  ISO 42001 framework is empty - run seed scripts');
    }

    // Test sample queries that APIs will use
    console.log('\n🔗 Testing API Queries:');

    // Test topics with relationships
    const topicsWithData = await prisma.euAiActTopic.findMany({
      include: {
        subtopics: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' },
      take: 1
    });

    if (topicsWithData.length > 0) {
      const sampleTopic = topicsWithData[0];
      console.log(`  ✅ Sample Topic: "${sampleTopic.title}"`);
      console.log(`     - Subtopics: ${sampleTopic.subtopics.length}`);
      console.log(`     - Questions: ${sampleTopic.subtopics.reduce((acc, st) => acc + st.questions.length, 0)}`);
    }

    // Test control categories with relationships
    const controlCategoriesWithData = await prisma.euAiActControlCategory.findMany({
      include: {
        controls: {
          include: {
            subcontrols: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' },
      take: 1
    });

    if (controlCategoriesWithData.length > 0) {
      const sampleCategory = controlCategoriesWithData[0];
      console.log(`  ✅ Sample Control Category: "${sampleCategory.title}"`);
      console.log(`     - Controls: ${sampleCategory.controls.length}`);
      console.log(`     - Subcontrols: ${sampleCategory.controls.reduce((acc, c) => acc + c.subcontrols.length, 0)}`);
    }

    // Test ISO 42001 clauses
    const clausesWithData = await prisma.iso42001Clause.findMany({
      include: {
        subclauses: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' },
      take: 1
    });

    if (clausesWithData.length > 0) {
      const sampleClause = clausesWithData[0];
      console.log(`  ✅ Sample ISO Clause: "${sampleClause.title}"`);
      console.log(`     - Subclauses: ${sampleClause.subclauses.length}`);
    }

    // Test ISO 42001 annex
    const annexCategoriesWithData = await prisma.iso42001AnnexCategory.findMany({
      include: {
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' },
      take: 1
    });

    if (annexCategoriesWithData.length > 0) {
      const sampleAnnexCategory = annexCategoriesWithData[0];
      console.log(`  ✅ Sample Annex Category: "${sampleAnnexCategory.title}"`);
      console.log(`     - Items: ${sampleAnnexCategory.items.length}`);
    }

    console.log('\n✨ Data Status Summary:');
    
    if (topics > 0 && clauses > 0) {
      console.log('  🎉 All framework data is available');
      console.log('  🚀 Governance module should work properly');
      console.log('  🔗 API endpoints will return populated data');
    } else {
      console.log('  ⚠️  Framework data is incomplete');
      console.log('  💡 Run: npm run seed-complete-frameworks');
      console.log('  🔄 Then restart your development server');
    }

  } catch (error) {
    console.error('❌ Error testing governance APIs:', error);
    
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.log('\n💡 Framework tables may not exist yet. Run:');
      console.log('   1. npx prisma db push');
      console.log('   2. npm run seed-complete-frameworks');
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testGovernanceAPIs();
}

export default testGovernanceAPIs;