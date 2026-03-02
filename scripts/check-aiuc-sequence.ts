import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkAiucSequence() {
  try {
    console.log('Checking aiucId sequence...\n');

    // Get all use cases ordered by aiucId
    const useCases = await prisma.useCase.findMany({
      select: {
        id: true,
        title: true,
        aiucId: true,
        createdAt: true
      },
      orderBy: {
        aiucId: 'asc'
      }
    });

    console.log(`Total use cases: ${useCases.length}`);
    
    if (useCases.length > 0) {
      console.log('\nCurrent aiucId values:');
      useCases.forEach((uc, index) => {
        console.log(`${index + 1}. aiucId: ${uc.aiucId}, Title: ${uc.title}`);
      });

      // Check for gaps
      const gaps = [];
      for (let i = 1; i < useCases.length; i++) {
        const expected = useCases[i - 1].aiucId + 1;
        const actual = useCases[i].aiucId;
        if (actual !== expected) {
          gaps.push({
            position: i,
            expected: expected,
            actual: actual,
            gap: actual - expected
          });
        }
      }

      if (gaps.length > 0) {
        console.log('\n⚠️  Gaps found in aiucId sequence:');
        gaps.forEach(gap => {
          console.log(`  Position ${gap.position}: Expected ${gap.expected}, got ${gap.actual} (gap of ${gap.gap})`);
        });
      } else {
        console.log('\n✅ No gaps found in aiucId sequence');
      }

      // Check the next expected aiucId
      const maxAiucId = Math.max(...useCases.map(uc => uc.aiucId));
      const nextExpected = maxAiucId + 1;
      console.log(`\nNext expected aiucId: ${nextExpected}`);
    } else {
      console.log('No use cases found. Next aiucId should be 1.');
    }

    // Check the database sequence
    console.log('\n--- Database Sequence Info ---');
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          last_value,
          is_called,
          min_value,
          max_value,
          start_value,
          increment
        FROM usecase_aiucid_seq;
      `;
      console.log('Sequence info:', result);
    } catch (error) {
      console.log('Could not query sequence directly:', error);
    }

  } catch (error) {
    console.error('❌ Error checking aiucId sequence:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAiucSequence(); 