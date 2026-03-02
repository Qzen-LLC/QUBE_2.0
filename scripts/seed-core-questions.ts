/**
 * Seed script to mark ~25 foundational questions as `coreQuestion: true`.
 *
 * These core questions are selected across all 7 pillars to provide enough
 * context for the Assessment Expansion Agent to infer answers for the
 * remaining ~370 questions.
 *
 * Usage: npx tsx scripts/seed-core-questions.ts
 */

import { PrismaClient, Stage } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch { /* .env not found, rely on existing env vars */ }

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Core question numbers per pillar (stage)
const CORE_QUESTIONS: Record<string, number[]> = {
  [Stage.REQUIREMENTS]: [1, 2, 3, 20, 31],
  [Stage.TECHNICAL]: [1, 4, 6, 54, 65],
  [Stage.BUSINESS]: [1, 4, 6, 31],
  [Stage.RESPONSIBLE_ETHICAL]: [1, 22, 38],
  [Stage.LEGAL_REGULATORY]: [1, 11, 43],
  [Stage.DATA_READINESS]: [1, 3, 33],
  [Stage.FINOPS]: [59, 69],
};

async function main() {
  console.log('🔧 Seeding core question flags...\n');

  // First, reset all coreQuestion flags to false
  const resetTemplates = await prisma.questionTemplate.updateMany({
    where: { coreQuestion: true },
    data: { coreQuestion: false },
  });
  console.log(`Reset ${resetTemplates.count} template(s) that were previously core.`);

  const resetQuestions = await prisma.question.updateMany({
    where: { coreQuestion: true },
    data: { coreQuestion: false },
  });
  console.log(`Reset ${resetQuestions.count} question(s) that were previously core.\n`);

  let totalMarked = 0;

  for (const [stage, questionNumbers] of Object.entries(CORE_QUESTIONS)) {
    // Update QuestionTemplates
    const templateResult = await prisma.questionTemplate.updateMany({
      where: {
        stage: stage as Stage,
        questionNumber: { in: questionNumbers },
        isInactive: false,
      },
      data: { coreQuestion: true },
    });

    // Update Questions (org-specific copies)
    const questionResult = await prisma.question.updateMany({
      where: {
        stage: stage as Stage,
        questionNumber: { in: questionNumbers },
        isInactive: false,
      },
      data: { coreQuestion: true },
    });

    const count = templateResult.count + questionResult.count;
    totalMarked += count;
    console.log(
      `  ${stage}: marked ${templateResult.count} template(s) + ${questionResult.count} question(s) ` +
      `(target Q#: ${questionNumbers.join(', ')})`
    );
  }

  console.log(`\n✅ Total marked as core: ${totalMarked}`);

  // Verify
  const coreTemplateCount = await prisma.questionTemplate.count({
    where: { coreQuestion: true, isInactive: false },
  });
  const coreQuestionCount = await prisma.question.count({
    where: { coreQuestion: true, isInactive: false },
  });
  console.log(`   Templates with coreQuestion=true: ${coreTemplateCount}`);
  console.log(`   Questions with coreQuestion=true: ${coreQuestionCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding core questions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
