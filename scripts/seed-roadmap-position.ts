import { PrismaClient } from '@/generated/prisma';
import { QuestionType, Stage } from '@/generated/prisma';

const prisma = new PrismaClient();

// Define the data structure to hold questions and their options
const roadmapData = [
  // --- Strategic Positioning ---
  {
    questionText: 'Project Priority',
    type: QuestionType.RADIO,
    options: ['high', 'medium', 'low'],
    roadmapOrderIndex: 1,
  },
  {
    questionText: 'Current Project Stage',
    type: QuestionType.RADIO,
    options: [
      'Ideation/Planning',
      'Proof of Concept',
      'Pilot/Testing',
      'Production Rollout',
      'Operational/Mature',
    ],
    roadmapOrderIndex: 2,
  },
  // --- Timeline Planning ---
  {
    questionText: 'Timeline Constraints',
    type: QuestionType.CHECKBOX,
    options: [
      'No Specific Timeline',
      '3-6 months',
      '6-12 months',
      '12-24 months',
      '> 24 months',
    ],
    roadmapOrderIndex: 3,
  },
  {
    questionText: 'Recommended Timeline',
    type: QuestionType.RADIO,
    options: ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'],
    roadmapOrderIndex: 4,
  },
  // --- Dependencies & Success Metrics ---
  {
    questionText: 'Project Dependencies',
    type: QuestionType.CHECKBOX,
    options: ['Data Platform Ready', 'Security Framework', 'Team Hiring'],
    roadmapOrderIndex: 5,
  },
  {
    questionText: 'Success Metrics',
    type: QuestionType.TEXT,
    options: [], // TEXT area has no options
    roadmapOrderIndex: 6,
  },
  // --- AI Maturity Progression ---
  {
    questionText: 'Current AI Maturity',
    type: QuestionType.RADIO,
    options: [
      'No AI/Traditional Systems',
      'Rule-based Automation',
      'Basic ML Models',
      'Advanced ML',
      'Basic Gen AI',
      'Advanced Gen AI',
      'Agentic AI',
    ],
    roadmapOrderIndex: 7,
  },
  {
    questionText: 'Target AI Maturity',
    type: QuestionType.RADIO,
    options: [
      'No AI/Traditional Systems',
      'Rule-based Automation',
      'Basic ML Models',
      'Advanced ML',
      'Basic Gen AI',
      'Advanced Gen AI',
      'Agentic AI',
    ],
    roadmapOrderIndex: 8,
  },
  {
    questionText: 'Evolution Path',
    type: QuestionType.CHECKBOX,
    options: [
      'Increase Autonomy Gradually',
      'Expand Tool Access',
      'Add Multi-agent Coordination',
      'Enhance Memory Systems',
      'Improve Reasoning Capabilities',
      'Add Human-in-the-loop Features',
      'Implement Continuous Learning',
    ],
    roadmapOrderIndex: 9,
  },
];

async function main() {
  console.log('Start seeding Roadmap QuestionTemplates...');

  for (const group of roadmapData) {
    // 1. Create the QuestionTemplate record
    const question = await prisma.questionTemplate.create({
      data: {
        text: group.questionText,
        type: group.type,
        stage: Stage.ROADMAP_POSITION,
        isInactive: false,
        // Set the ordering index for the ROADMAP stage
        roadmapOrderIndex: group.roadmapOrderIndex,
      },
      // Error handling moved to catch block
    }).catch(e => {
        // If the question already exists (unique constraint violation), skip and log
        if (e.code === 'P2002') {
             console.log(`Skipping existing QuestionTemplate: ${group.questionText} (Already exists)`);
             return null;
        }
        throw e;
    });

    if (!question) continue; // Skip option creation if question failed to create/was skipped

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
            // Log if creation fails (e.g., due to previous runs/unique index collision)
            if (e.code === 'P2002') {
                 console.log(`Skipping existing option: ${optionText} for question ${question.text} (Already exists)`);
            } else {
                 console.error(`Creation failed for option ${optionText}:`, e);
            }
            return null;
        })
      );

      // Execute all option creations
      await Promise.all(optionPromises);
    }
  }

  console.log('Roadmap QuestionTemplates and OptionTemplates seeding complete. 🚀');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });