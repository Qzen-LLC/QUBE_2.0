import { PrismaClient } from '@/generated/prisma';
import fs from 'fs';

const prisma = new PrismaClient();

async function importCompleteStructure() {
  try {
    console.log('🚀 Starting complete EU AI Act structure import...');
    
    // Step 1: Import Control Structures
    console.log('\n📋 Step 1: Importing Control Structures...');
    const controlsCsvPath = '/Users/kaluri/Downloads/EuAiActControlStruct_rows.csv';
    const controlsCsvContent = fs.readFileSync(controlsCsvPath, 'utf-8');
    const controlsLines = controlsCsvContent.split('\n');
    
    let controlsImported = 0;
    let controlsSkipped = 0;
    
    // Process each control (skip header)
    for (let i = 1; i < controlsLines.length; i++) {
      const line = controlsLines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length < 6) continue;
      
      const controlData = {
        id: values[0],
        controlId: values[1],
        title: values[2].replace(/^"|"$/g, ''),
        description: values[3].replace(/^"|"$/g, ''),
        orderIndex: parseInt(values[4]) || 1,
        categoryId: values[5]
      };
      
      try {
        // Check if control already exists
        const existing = await prisma.euAiActControlStruct.findUnique({
          where: { controlId: controlData.controlId }
        });
        
        if (existing) {
          console.log(`⚠️  Control ${controlData.controlId} already exists`);
          controlsSkipped++;
          continue;
        }
        
        // Check if parent category exists
        const parentCategory = await prisma.euAiActControlCategory.findUnique({
          where: { categoryId: controlData.categoryId }
        });
        
        if (!parentCategory) {
          console.log(`❌ Category ${controlData.categoryId} not found for control ${controlData.controlId}`);
          continue;
        }
        
        // Create the control
        await prisma.euAiActControlStruct.create({
          data: {
            id: controlData.id,
            controlId: controlData.controlId,
            title: controlData.title,
            description: controlData.description,
            orderIndex: controlData.orderIndex,
            categoryId: controlData.categoryId
          }
        });
        
        console.log(`✅ Imported control: ${controlData.controlId} - ${controlData.title}`);
        controlsImported++;
        
      } catch (error) {
        console.error(`❌ Error importing control ${controlData.controlId}:`, error);
      }
    }
    
    console.log(`\n📊 Controls Import Summary:`);
    console.log(`✅ Successfully imported: ${controlsImported} controls`);
    console.log(`⚠️  Skipped (already exist): ${controlsSkipped} controls`);
    
    // Step 2: Import Subcontrol Structures
    console.log('\n📋 Step 2: Importing Subcontrol Structures...');
    const subcontrolsCsvPath = '/Users/kaluri/Downloads/EuAiActSubcontrolStruct_rows.csv';
    const subcontrolsCsvContent = fs.readFileSync(subcontrolsCsvPath, 'utf-8');
    const subcontrolsLines = subcontrolsCsvContent.split('\n');
    
    let subcontrolsImported = 0;
    let subcontrolsSkipped = 0;
    let subcontrolsErrors = 0;
    
    // Parse CSV more carefully - handle quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      
      return result;
    };
    
    // Process each subcontrol (skip header)
    for (let i = 1; i < subcontrolsLines.length; i++) {
      const line = subcontrolsLines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 6) {
        console.log(`⚠️  Skipping malformed line ${i}: ${line}`);
        continue;
      }
      
      const subcontrolData = {
        id: values[0],
        subcontrolId: values[1],
        title: values[2].replace(/^"|"$/g, ''),
        description: values[3].replace(/^"|"$/g, ''),
        orderIndex: parseInt(values[4]) || 1,
        controlId: values[5]
      };
      
      try {
        // Check if parent control exists
        const parentControl = await prisma.euAiActControlStruct.findUnique({
          where: { controlId: subcontrolData.controlId }
        });
        
        if (!parentControl) {
          console.log(`⚠️  Parent control ${subcontrolData.controlId} not found for ${subcontrolData.subcontrolId}`);
          subcontrolsErrors++;
          continue;
        }
        
        // Check if subcontrol already exists
        const existing = await prisma.euAiActSubcontrolStruct.findUnique({
          where: { subcontrolId: subcontrolData.subcontrolId }
        });
        
        if (existing) {
          console.log(`⚠️  Subcontrol ${subcontrolData.subcontrolId} already exists`);
          subcontrolsSkipped++;
          continue;
        }
        
        // Create the subcontrol
        await prisma.euAiActSubcontrolStruct.create({
          data: {
            id: subcontrolData.id,
            subcontrolId: subcontrolData.subcontrolId,
            title: subcontrolData.title,
            description: subcontrolData.description,
            orderIndex: subcontrolData.orderIndex,
            controlId: subcontrolData.controlId
          }
        });
        
        console.log(`✅ Imported subcontrol: ${subcontrolData.subcontrolId} - ${subcontrolData.title}`);
        subcontrolsImported++;
        
      } catch (error) {
        console.error(`❌ Error importing subcontrol ${subcontrolData.subcontrolId}:`, error);
        subcontrolsErrors++;
      }
    }
    
    console.log(`\n📊 Subcontrols Import Summary:`);
    console.log(`✅ Successfully imported: ${subcontrolsImported} subcontrols`);
    console.log(`⚠️  Skipped (already exist): ${subcontrolsSkipped} subcontrols`);
    console.log(`❌ Errors: ${subcontrolsErrors} subcontrols`);
    
    // Step 3: Final verification
    console.log('\n📈 Final Database State:');
    const totalCategories = await prisma.euAiActControlCategory.count();
    const totalControls = await prisma.euAiActControlStruct.count();
    const totalSubcontrols = await prisma.euAiActSubcontrolStruct.count();
    
    console.log(`📂 Categories: ${totalCategories}`);
    console.log(`🎯 Controls: ${totalControls}`);
    console.log(`🔧 Subcontrols: ${totalSubcontrols}`);
    
    // Show controls per category
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
    
    console.log('\n📋 Controls per Category:');
    categories.forEach(category => {
      const totalControlsInCategory = category.controls.length;
      const totalSubcontrolsInCategory = category.controls.reduce((sum, control) => sum + control.subcontrols.length, 0);
      console.log(`   ${category.categoryId}: ${category.title} - ${totalControlsInCategory} controls, ${totalSubcontrolsInCategory} subcontrols`);
    });
    
    console.log('\n🎉 Complete EU AI Act structure import finished!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importCompleteStructure();