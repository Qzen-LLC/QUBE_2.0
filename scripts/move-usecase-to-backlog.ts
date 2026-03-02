import { prismaClient } from "../src/utils/db";

async function moveUseCaseToBacklog() {
  console.log("📋 Moving a use case to backlog stage for testing...\n");
  
  try {
    // Find a use case in discovery stage
    const useCase = await prismaClient.useCase.findFirst({
      where: {
        stage: 'discovery'
      }
    });

    if (!useCase) {
      console.log("❌ No use cases found in discovery stage");
      
      // Try to find any use case
      const anyUseCase = await prismaClient.useCase.findFirst();
      
      if (anyUseCase) {
        console.log(`Found use case: ${anyUseCase.title}`);
        console.log(`Current stage: ${anyUseCase.stage}`);
        
        // Update to backlog
        const updated = await prismaClient.useCase.update({
          where: { id: anyUseCase.id },
          data: { stage: 'backlog' }
        });
        
        console.log(`✅ Moved use case "${updated.title}" to backlog stage`);
        console.log(`   This use case will now appear in the Use Case Development section`);
      } else {
        console.log("❌ No use cases found in the database");
      }
    } else {
      // Update the use case to backlog stage
      const updated = await prismaClient.useCase.update({
        where: { id: useCase.id },
        data: { stage: 'backlog' }
      });
      console.log('[CRUD_LOG] UseCase moved to backlog (script):', { id: useCase.id, title: useCase.title, stage: updated.stage, authoredBy: useCase.userId });
      console.log(`✅ Successfully moved use case "${updated.title}" to backlog stage`);
      console.log(`   This use case will now appear in the Use Case Development section`);
    }
    
    // Show current stage distribution
    const stageCounts = await prismaClient.useCase.groupBy({
      by: ['stage'],
      _count: true
    });
    
    console.log("\n📊 Current stage distribution:");
    stageCounts.forEach(item => {
      console.log(`   ${item.stage || 'Not set'}: ${item._count} use case(s)`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prismaClient.$disconnect();
  }
}

moveUseCaseToBacklog().catch(console.error);