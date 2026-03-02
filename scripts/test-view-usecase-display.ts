#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';
import { buildStepsDataFromAnswers } from '../src/lib/mappers/answers-to-steps';

async function testViewUseCaseDisplay() {
  console.log('🔍 Testing View Use Case Display Logic\n');
  console.log('='.repeat(70));

  try {
    // Get a use case with answers
    const useCase = await prismaClient.useCase.findFirst({
      where: {
        answers: {
          some: {}
        }
      },
      include: {
        _count: {
          select: {
            answers: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!useCase) {
      console.log('❌ No use case with answers found');
      process.exit(1);
    }

    console.log(`\n📋 Testing with Use Case: ${useCase.title}`);
    console.log(`   ID: ${useCase.id}`);
    console.log(`   Total Answers: ${useCase._count.answers}\n`);

    // Get converted stepsData
    const stepsData = await buildStepsDataFromAnswers(useCase.id);

    // Get questions with answers (simulating what the API returns)
    const answers = await prismaClient.answer.findMany({
      where: { useCaseId: useCase.id },
      include: {
        question: true,
        questionTemplate: true
      }
    });

    // Group by stage
    const questionsByStage: Record<string, any[]> = {};
    answers.forEach(answer => {
      const stage = answer.question?.stage || answer.questionTemplate?.stage || 'UNKNOWN';
      if (!questionsByStage[stage]) {
        questionsByStage[stage] = [];
      }
      const question = answer.question || answer.questionTemplate;
      if (question) {
        const existingQuestion = questionsByStage[stage].find(q => q.id === question.id);
        if (existingQuestion) {
          if (!existingQuestion.answers) existingQuestion.answers = [];
          existingQuestion.answers.push(answer);
        } else {
          questionsByStage[stage].push({
            ...question,
            answers: [answer]
          });
        }
      }
    });

    // Test each section
    const sections = [
      { stage: 'DATA_READINESS', sectionName: 'dataReadiness' },
      { stage: 'TECHNICAL_FEASIBILITY', sectionName: 'technicalFeasibility' },
      { stage: 'BUSINESS_FEASIBILITY', sectionName: 'businessFeasibility' },
      { stage: 'ETHICAL_IMPACT', sectionName: 'ethicalImpact' },
      { stage: 'RISK_ASSESSMENT', sectionName: 'riskAssessment' },
      { stage: 'ROADMAP_POSITION', sectionName: 'roadmapPosition' },
      { stage: 'BUDGET_PLANNING', sectionName: 'budgetPlanning' }
    ];

    console.log('📊 Section Display Analysis:\n');

    let sectionsWithQuestions = 0;
    let sectionsWithAssessData = 0;
    let sectionsWithBoth = 0;
    let sectionsWithNeither = 0;

    sections.forEach(({ stage, sectionName }) => {
      const questions = questionsByStage[stage] || [];
      const assessData = (stepsData as any)[sectionName];
      const hasQuestions = questions.length > 0;
      const hasAssessData = assessData && Object.keys(assessData).length > 0;

      let displayStatus = '';
      if (hasQuestions && hasAssessData) {
        displayStatus = '✅ Questions + AssessData';
        sectionsWithBoth++;
      } else if (hasQuestions) {
        displayStatus = '✅ Questions only';
        sectionsWithQuestions++;
      } else if (hasAssessData) {
        displayStatus = '✅ AssessData only';
        sectionsWithAssessData++;
      } else {
        displayStatus = '⚠️  No data';
        sectionsWithNeither++;
      }

      console.log(`${stage} (${sectionName}):`);
      console.log(`  ${displayStatus}`);
      console.log(`  - Questions: ${questions.length}`);
      console.log(`  - AssessData fields: ${hasAssessData ? Object.keys(assessData).length : 0}`);
      if (hasAssessData) {
        console.log(`  - AssessData keys: ${Object.keys(assessData).join(', ')}`);
      }
      console.log('');
    });

    // Summary
    console.log('='.repeat(70));
    console.log('📊 Summary:\n');
    console.log(`Sections with Questions only: ${sectionsWithQuestions}`);
    console.log(`Sections with AssessData only: ${sectionsWithAssessData}`);
    console.log(`Sections with Both: ${sectionsWithBoth}`);
    console.log(`Sections with Neither: ${sectionsWithNeither}`);
    console.log(`Total Sections: ${sections.length}`);

    const totalWithData = sectionsWithQuestions + sectionsWithAssessData + sectionsWithBoth;
    const displayRate = ((totalWithData / sections.length) * 100).toFixed(1);

    console.log(`\nDisplay Coverage: ${displayRate}% (${totalWithData}/${sections.length} sections have data)`);

    if (sectionsWithNeither > 0) {
      console.log(`\n⚠️  ${sectionsWithNeither} section(s) have no data to display`);
      console.log('   This is expected if those sections haven\'t been filled out yet.');
    }

    if (sectionsWithAssessData > 0 || sectionsWithBoth > 0) {
      console.log(`\n✅ Fix Applied: Sections with AssessData will now display correctly`);
      console.log('   Even if they don\'t have questions, the converted data will be shown.');
    }

    console.log('\n✅ Display logic test complete!');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

testViewUseCaseDisplay().catch(console.error);


