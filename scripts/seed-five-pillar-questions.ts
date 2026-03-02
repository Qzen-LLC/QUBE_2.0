#!/usr/bin/env tsx

/**
 * Seed Five-Pillar Assessment Questions
 *
 * Seeds QuestionTemplate records across 7 assessment pillars with support for:
 * - Multiple question types (TEXT, RADIO, CHECKBOX, SLIDER, TEXT_MINI)
 * - Question deactivation (isInactive flag)
 * - Quick Assessment subset (quickAssessment flag)
 * - Option templates for RADIO/CHECKBOX/SLIDER types
 *
 * Pillars:
 * - Pillar 0: Requirements
 * - Pillar 1: Technical
 * - Pillar 2: Business
 * - Pillar 3: Responsible / Ethical
 * - Pillar 4: Legal & Regulatory
 * - Pillar 5: Data Readiness
 * - Pillar 6: FinOps
 *
 * Usage: npx tsx scripts/seed-five-pillar-questions.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.log('Warning: Could not load .env file');
}

import { PrismaClient, Stage } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface QuestionData {
  questionNumber: number;
  subCategory: string;
  text: string;
  aiAutomationTier: number;
  aiAgentGuidance: string;
  type?: string;
  options?: string[];
  isInactive?: boolean;
  quickAssessment?: boolean;
}

const PILLAR_CONFIG: { file: string; stage: Stage; label: string }[] = [
  { file: 'pillar-0-requirements.json', stage: Stage.REQUIREMENTS, label: 'Pillar 0: Requirements' },
  { file: 'pillar-1-technical.json', stage: Stage.TECHNICAL, label: 'Pillar 1: Technical' },
  { file: 'pillar-2-business.json', stage: Stage.BUSINESS, label: 'Pillar 2: Business' },
  { file: 'pillar-3-responsible-ethical.json', stage: Stage.RESPONSIBLE_ETHICAL, label: 'Pillar 3: Responsible / Ethical' },
  { file: 'pillar-4-legal-regulatory.json', stage: Stage.LEGAL_REGULATORY, label: 'Pillar 4: Legal & Regulatory' },
  { file: 'pillar-5-data-readiness.json', stage: Stage.DATA_READINESS, label: 'Pillar 5: Data Readiness' },
  { file: 'pillar-6-finops.json', stage: Stage.FINOPS, label: 'Pillar 6: FinOps' },
];

async function seedPillarQuestions() {
  console.log('Seeding Five-Pillar Assessment Questions...\n');

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalDeactivated = 0;
  let totalWithOptions = 0;
  let totalQuickAssessment = 0;

  for (const pillar of PILLAR_CONFIG) {
    const filePath = join(process.cwd(), 'scripts', 'data', pillar.file);
    const questions: QuestionData[] = JSON.parse(readFileSync(filePath, 'utf8'));

    console.log(`${pillar.label}: ${questions.length} questions`);

    let created = 0;
    let updated = 0;
    let deactivated = 0;
    let withOptions = 0;
    let quickCount = 0;

    for (const q of questions) {
      const questionType = q.type || 'TEXT';
      const isInactive = q.isInactive === true;
      const quickAssessment = q.quickAssessment === true;

      if (isInactive) deactivated++;
      if (quickAssessment) quickCount++;

      // Check if a template already exists for this stage + questionNumber
      const existing = await prisma.questionTemplate.findFirst({
        where: {
          stage: pillar.stage,
          questionNumber: q.questionNumber,
        },
      });

      if (existing) {
        // Update existing template
        await prisma.questionTemplate.update({
          where: { id: existing.id },
          data: {
            text: q.text,
            type: questionType as any,
            subCategory: q.subCategory,
            aiAutomationTier: q.aiAutomationTier,
            aiAgentGuidance: q.aiAgentGuidance,
            orderIndex: q.questionNumber,
            isInactive,
            quickAssessment,
          },
        });

        // Handle option templates: delete old ones and create new if options provided
        await prisma.optionTemplate.deleteMany({
          where: { questionTemplateId: existing.id },
        });

        if (q.options && q.options.length > 0) {
          await prisma.optionTemplate.createMany({
            data: q.options.map(text => ({
              text,
              questionTemplateId: existing.id,
            })),
          });
          withOptions++;
        }

        updated++;
      } else {
        // Create new template
        const newTemplate = await prisma.questionTemplate.create({
          data: {
            text: q.text,
            type: questionType as any,
            stage: pillar.stage,
            subCategory: q.subCategory,
            aiAutomationTier: q.aiAutomationTier,
            aiAgentGuidance: q.aiAgentGuidance,
            questionNumber: q.questionNumber,
            orderIndex: q.questionNumber,
            isInactive,
            quickAssessment,
          },
        });

        // Create option templates if provided
        if (q.options && q.options.length > 0) {
          await prisma.optionTemplate.createMany({
            data: q.options.map(text => ({
              text,
              questionTemplateId: newTemplate.id,
            })),
          });
          withOptions++;
        }

        created++;
      }
    }

    console.log(`   Created: ${created}, Updated: ${updated}, Deactivated: ${deactivated}, With options: ${withOptions}, Quick: ${quickCount}`);
    totalCreated += created;
    totalUpdated += updated;
    totalDeactivated += deactivated;
    totalWithOptions += withOptions;
    totalQuickAssessment += quickCount;
  }

  console.log(`\nDone! Total: ${totalCreated} created, ${totalUpdated} updated, ${totalDeactivated} deactivated, ${totalWithOptions} with options, ${totalQuickAssessment} quick assessment`);
}

async function main() {
  try {
    // First, mark all old question templates (without questionNumber) as inactive
    const oldTemplates = await prisma.questionTemplate.updateMany({
      where: {
        questionNumber: null,
      },
      data: {
        isInactive: true,
      },
    });
    console.log(`Marked ${oldTemplates.count} old question templates as inactive\n`);

    await seedPillarQuestions();

    // Verify counts
    const counts = await prisma.questionTemplate.groupBy({
      by: ['stage'],
      where: { isInactive: false },
      _count: true,
    });

    console.log('\nVerification — Active question templates by stage:');
    for (const c of counts) {
      console.log(`   ${c.stage}: ${c._count}`);
    }

    const total = counts.reduce((sum, c) => sum + c._count, 0);
    console.log(`   TOTAL ACTIVE: ${total}`);

    // Quick assessment count
    const quickCounts = await prisma.questionTemplate.groupBy({
      by: ['stage'],
      where: { isInactive: false, quickAssessment: true },
      _count: true,
    });

    console.log('\nQuick Assessment questions by stage:');
    for (const c of quickCounts) {
      console.log(`   ${c.stage}: ${c._count}`);
    }

    const quickTotal = quickCounts.reduce((sum, c) => sum + c._count, 0);
    console.log(`   TOTAL QUICK: ${quickTotal}`);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
