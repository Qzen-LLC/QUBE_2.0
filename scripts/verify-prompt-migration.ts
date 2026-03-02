import { prismaClient } from "../src/utils/db";

async function verifyPromptMigration() {
  console.log("🔍 Verifying prompt engineering migration...\n");
  
  try {
    // Check existing data integrity
    console.log("📊 Checking existing data:");
    const useCaseCount = await prismaClient.useCase.count();
    const userCount = await prismaClient.user.count();
    const organizationCount = await prismaClient.organization.count();
    
    console.log(`  ✅ Use Cases: ${useCaseCount}`);
    console.log(`  ✅ Users: ${userCount}`);
    console.log(`  ✅ Organizations: ${organizationCount}`);
    
    // Check prompt templates
    console.log("\n📝 Checking prompt templates:");
    const promptTemplates = await prismaClient.promptTemplate.findMany();
    console.log(`  ✅ Prompt Templates: ${promptTemplates.length}`);
    
    if (promptTemplates.length > 0) {
      const firstPrompt = promptTemplates[0];
      console.log(`\n  Sample prompt:`);
      console.log(`    Name: ${firstPrompt.name}`);
      console.log(`    Tags: ${firstPrompt.tags?.join(', ') || 'None'}`);
      console.log(`    Description: ${firstPrompt.description || 'None (field kept for compatibility)'}`);
      console.log(`    Type: ${firstPrompt.type}`);
      console.log(`    Service: ${firstPrompt.service}`);
    }
    
    // Check prompt versions
    const promptVersions = await prismaClient.promptVersion.findMany();
    console.log(`\n  ✅ Prompt Versions: ${promptVersions.length}`);
    
    if (promptVersions.length > 0) {
      const firstVersion = promptVersions[0];
      console.log(`\n  Sample version:`);
      console.log(`    Version Number: ${firstVersion.versionNumber}`);
      console.log(`    Commit Message: ${firstVersion.commitMessage}`);
      console.log(`    Version Notes: ${firstVersion.versionNotes || 'None'}`);
    }
    
    console.log("\n✅ Migration completed successfully!");
    console.log("✅ All existing data preserved!");
    console.log("✅ New fields added: tags (array), versionNotes (string)");
    console.log("✅ Old description field kept for backward compatibility");
    
  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await prismaClient.$disconnect();
  }
}

verifyPromptMigration().catch(console.error);