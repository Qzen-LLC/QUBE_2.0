import { prismaClient } from '@/utils/db';
import { euAiActTopics } from './framework-data/eu-ai-act-topics';
import { euAiActControlCategories } from './framework-data/eu-ai-act-controls';
import { iso42001Clauses } from './framework-data/iso-42001-clauses';
import { iso42001AnnexCategories } from './framework-data/iso-42001-annex';

export async function seedFrameworks() {
  console.log('Starting framework seeding...');

  try {
    // Seed EU AI ACT Topics
    console.log('Seeding EU AI ACT Topics...');
    for (const topic of euAiActTopics) {
      await prismaClient.euAiActTopic.upsert({
        where: { topicId: topic.topicId },
        update: {
          title: topic.title,
          description: topic.description,
          orderIndex: topic.orderIndex,
        },
        create: {
          topicId: topic.topicId,
          title: topic.title,
          description: topic.description,
          orderIndex: topic.orderIndex,
        },
      });

      // Seed subtopics
      for (const subtopic of topic.subtopics) {
        await prismaClient.euAiActSubtopic.upsert({
          where: { subtopicId: subtopic.subtopicId },
          update: {
            title: subtopic.title,
            description: subtopic.description,
            orderIndex: subtopic.orderIndex,
            topicId: topic.topicId,
          },
          create: {
            subtopicId: subtopic.subtopicId,
            title: subtopic.title,
            description: subtopic.description,
            orderIndex: subtopic.orderIndex,
            topicId: topic.topicId,
          },
        });

        // Seed questions
        for (const question of subtopic.questions) {
          await prismaClient.euAiActQuestion.upsert({
            where: { questionId: question.questionId },
            update: {
              question: question.question,
              priority: question.priority,
              answerType: question.answerType,
              orderIndex: question.orderIndex,
              subtopicId: subtopic.subtopicId,
            },
            create: {
              questionId: question.questionId,
              question: question.question,
              priority: question.priority,
              answerType: question.answerType,
              orderIndex: question.orderIndex,
              subtopicId: subtopic.subtopicId,
            },
          });
        }
      }
    }

    // Seed EU AI ACT Control Categories
    console.log('Seeding EU AI ACT Control Categories...');
    for (const category of euAiActControlCategories) {
      await prismaClient.euAiActControlCategory.upsert({
        where: { categoryId: category.categoryId },
        update: {
          title: category.title,
          description: category.description,
          orderIndex: category.orderIndex,
        },
        create: {
          categoryId: category.categoryId,
          title: category.title,
          description: category.description,
          orderIndex: category.orderIndex,
        },
      });

      // Seed controls
      for (const control of category.controls) {
        await prismaClient.euAiActControlStruct.upsert({
          where: { controlId: control.controlId },
          update: {
            title: control.title,
            description: control.description,
            orderIndex: control.orderIndex,
            categoryId: category.categoryId,
          },
          create: {
            controlId: control.controlId,
            title: control.title,
            description: control.description,
            orderIndex: control.orderIndex,
            categoryId: category.categoryId,
          },
        });

        // Seed subcontrols
        for (const subcontrol of control.subcontrols) {
          await prismaClient.euAiActSubcontrolStruct.upsert({
            where: { subcontrolId: subcontrol.subcontrolId },
            update: {
              title: subcontrol.title,
              description: subcontrol.description,
              orderIndex: subcontrol.orderIndex,
              controlId: control.controlId,
            },
            create: {
              subcontrolId: subcontrol.subcontrolId,
              title: subcontrol.title,
              description: subcontrol.description,
              orderIndex: subcontrol.orderIndex,
              controlId: control.controlId,
            },
          });
        }
      }
    }

    // Seed ISO 42001 Clauses
    console.log('Seeding ISO 42001 Clauses...');
    for (const clause of iso42001Clauses) {
      await prismaClient.iso42001Clause.upsert({
        where: { clauseId: clause.clauseId },
        update: {
          title: clause.title,
          description: clause.description,
          orderIndex: clause.orderIndex,
        },
        create: {
          clauseId: clause.clauseId,
          title: clause.title,
          description: clause.description,
          orderIndex: clause.orderIndex,
        },
      });

      // Seed subclauses
      for (const subclause of clause.subclauses) {
        await prismaClient.iso42001Subclause.upsert({
          where: { subclauseId: subclause.subclauseId },
          update: {
            title: subclause.title,
            summary: subclause.summary,
            questions: subclause.questions,
            evidenceExamples: subclause.evidenceExamples,
            orderIndex: subclause.orderIndex,
            clauseId: clause.clauseId,
          },
          create: {
            subclauseId: subclause.subclauseId,
            title: subclause.title,
            summary: subclause.summary,
            questions: subclause.questions,
            evidenceExamples: subclause.evidenceExamples,
            orderIndex: subclause.orderIndex,
            clauseId: clause.clauseId,
          },
        });
      }
    }

    // Seed ISO 42001 Annex Categories
    console.log('Seeding ISO 42001 Annex Categories...');
    for (const category of iso42001AnnexCategories) {
      await prismaClient.iso42001AnnexCategory.upsert({
        where: { categoryId: category.categoryId },
        update: {
          title: category.title,
          description: category.description,
          orderIndex: category.orderIndex,
        },
        create: {
          categoryId: category.categoryId,
          title: category.title,
          description: category.description,
          orderIndex: category.orderIndex,
        },
      });

      // Seed annex items
      for (const item of category.items) {
        await prismaClient.iso42001AnnexItem.upsert({
          where: { itemId: item.itemId },
          update: {
            title: item.title,
            description: item.description,
            guidance: item.guidance,
            orderIndex: item.orderIndex,
            categoryId: category.categoryId,
          },
          create: {
            itemId: item.itemId,
            title: item.title,
            description: item.description,
            guidance: item.guidance,
            orderIndex: item.orderIndex,
            categoryId: category.categoryId,
          },
        });
      }
    }

    console.log('Framework seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding frameworks:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedFrameworks()
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prismaClient.$disconnect();
    });
}