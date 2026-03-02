import { PrismaClient } from '@/generated/prisma';
import { QuestionType, Stage } from '@/generated/prisma';

const prisma = new PrismaClient();

// Define the data structure to hold questions and their options
const budgetData = [
  // --- Core Budget & Value (RADIO/TEXT) ---
  {
    questionText: 'Budget Range',
    type: QuestionType.RADIO,
    options: [
      '< $100K',
      '$100K - $500K',
      '$500K - $1M',
      '$1M - $5M',
      '> $5M',
    ],
    budgetOrderIndex: 1,
  },
  { questionText: 'Initial Dev Cost', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 2 },
  { questionText: 'Monthly API Cost', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 3 },
  { questionText: 'Monthly Infrastructure', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 4 },
  { questionText: 'Monthly Operations', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 5 },
  { questionText: 'Monthly Value Generated', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 6 },
  { questionText: 'Value Growth Rate (%)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 7 },

  // --- Token Economics (TEXT/CHECKBOX) ---
  { questionText: 'Input Token Price ($/1K tokens)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 8 },
  { questionText: 'Output Token Price ($/1K tokens)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 9 },
  { questionText: 'Embedding Token Price ($/1K tokens)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 10 },
  { questionText: 'Fine-tuning Token Price ($/1K tokens)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 11 },
  { questionText: 'Monthly Token Budget ($)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 12 },
  { questionText: 'Avg Tokens per User/Month', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 13 },
  { questionText: 'Peak Token Usage (tokens/min)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 14 },
  {
    questionText: 'Optimization Strategies',
    type: QuestionType.CHECKBOX,
    options: [
      'Prompt Compression',
      'Response Caching',
      'Model Routing',
      'Batch Processing',
      'Context Window Management',
      'Semantic Caching',
      'Token Budgeting',
      'Fallback Models',
    ],
    budgetOrderIndex: 15,
  },

  // --- Gen AI Infrastructure Costs (TEXT) ---
  { questionText: 'Vector Database Cost ($/month)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 16 },
  { questionText: 'GPU/Inference Cost ($/month)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 17 },
  { questionText: 'Monitoring Tools ($/month)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 18 },
  { questionText: 'Safety/Moderation APIs ($/month)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 19 },
  { questionText: 'Backup Model Cost ($/month)', type: QuestionType.TEXT_MINI, options: [], budgetOrderIndex: 20 },
];

async function main() {
  console.log('Start seeding Budget QuestionTemplates...');

  for (const group of budgetData) {
    // 1. Create the QuestionTemplate record
    const question = await prisma.questionTemplate.create({
      data: {
        text: group.questionText,
        type: group.type,
        stage: Stage.BUDGET_PLANNING,
        isInactive: false,
        // Set the ordering index for the BUDGET stage
        budgetOrderIndex: group.budgetOrderIndex,
      },
    }).catch(e => {
        if (e.code === 'P2002') {
             console.log(`Skipping existing QuestionTemplate: ${group.questionText} (Already exists)`);
             return null;
        }
        throw e;
    });

    if (!question) continue;

    console.log(`Created QuestionTemplate: ${question.text} (${question.id})`);

    // 2. Create the OptionTemplate records ONLY if options exist
    if (group.options.length > 0) {
      const optionPromises = group.options.map(optionText =>
        prisma.optionTemplate.create({
          data: {
            text: optionText,
            questionTemplateId: question.id,
          },
        }).catch(e => {
            if (e.code === 'P2002') {
                 console.log(`Skipping existing option: ${optionText} for question ${question.text} (Already exists)`);
            } else {
                 console.error(`Creation failed for option ${optionText}:`, e);
            }
            return null;
        })
      );

      await Promise.all(optionPromises);
    }
  }

  console.log('Budget QuestionTemplates and OptionTemplates seeding complete. 💰');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });