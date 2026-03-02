import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function checkControls() {
  try {
    console.log('🔍 Checking EU AI Act controls and subcontrols...');
    
    // Get all control categories
    const categories = await prisma.euAiActControlCategory.findMany({
      include: {
        controls: {
          include: {
            subcontrols: true
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });
    
    console.log(`📊 Found ${categories.length} control categories`);
    
    let totalControls = 0;
    let totalSubcontrols = 0;
    
    categories.forEach(category => {
      console.log(`\n📂 Category: ${category.title} (${category.categoryId})`);
      console.log(`   Controls: ${category.controls.length}`);
      
      category.controls.forEach(control => {
        console.log(`   - Control ${control.controlId}: ${control.title}`);
        console.log(`     Subcontrols: ${control.subcontrols.length}`);
        totalSubcontrols += control.subcontrols.length;
        
        if (control.subcontrols.length > 0) {
          control.subcontrols.forEach(sub => {
            console.log(`       * ${sub.subcontrolId}: ${sub.title}`);
          });
        }
      });
      
      totalControls += category.controls.length;
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Categories: ${categories.length}`);
    console.log(`   Total Controls: ${totalControls}`);
    console.log(`   Total Subcontrols: ${totalSubcontrols}`);
    
    // Check which controls are missing subcontrols or have very few
    console.log(`\n⚠️  Controls with 0-2 subcontrols:`);
    categories.forEach(category => {
      category.controls.forEach(control => {
        if (control.subcontrols.length <= 2) {
          console.log(`   - ${control.controlId}: ${control.title} (${control.subcontrols.length} subcontrols)`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkControls();