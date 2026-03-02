import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

async function seedQuestionsFromTemplates() {
  const templates = await prisma.questionTemplate.findMany({
    include: { optionTemplates: true },
  });

  for (const template of templates) {
    // Step 2: Create a Question from this template
    const question = await prisma.question.create({
      data: {
        text: template.text,
        type: template.type,
        templateId: template.id,
        // Step 3: Copy OptionTemplates into Options
        options: {
          create: template.optionTemplates.map((opt) => ({
            text: opt.text,
          })),
        },
      },
      include: { options: true },
    });

    console.log(
      `Created Question: ${question.text} (from template: ${template.text})`
    );
    for (const opt of question.options) {
      console.log(`   ↳ Option: ${opt.text}`);
    }
  }
}

async function main() {
  await seedQuestionsFromTemplates();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
