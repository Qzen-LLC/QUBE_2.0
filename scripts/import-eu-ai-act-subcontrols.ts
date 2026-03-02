import { PrismaClient } from '@/generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importSubcontrols() {
  try {
    console.log('🚀 Starting EU AI Act subcontrols import...');
    
    // Read the CSV file
    const csvPath = '/Users/kaluri/Downloads/EuAiActSubcontrolStruct_rows.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`📊 Found ${lines.length - 1} subcontrols in CSV`);
    
    // Check current database state
    const existingSubcontrols = await prisma.euAiActSubcontrolStruct.findMany({
      select: { subcontrolId: true }
    });
    console.log(`🗄️  Current subcontrols in database: ${existingSubcontrols.length}`);
    
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length < 6) continue;
      
      const subcontrolData = {
        id: values[0],
        subcontrolId: values[1],
        title: values[2].replace(/"/g, ''), // Remove quotes
        description: values[3].replace(/"/g, ''),
        orderIndex: parseInt(values[4]),
        controlId: values[5]
      };
      
      try {
        // Check if subcontrol already exists
        const existing = await prisma.euAiActSubcontrolStruct.findUnique({
          where: { subcontrolId: subcontrolData.subcontrolId }
        });
        
        if (existing) {
          console.log(`⚠️  Subcontrol ${subcontrolData.subcontrolId} already exists, skipping`);
          skippedCount++;
          continue;
        }
        
        // Check if the parent control exists
        const parentControl = await prisma.euAiActControlStruct.findUnique({
          where: { controlId: subcontrolData.controlId }
        });
        
        if (!parentControl) {
          console.log(`❌ Parent control ${subcontrolData.controlId} not found for subcontrol ${subcontrolData.subcontrolId}`);
          errorCount++;
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
        importedCount++;
        
      } catch (error) {
        console.error(`❌ Error importing subcontrol ${subcontrolData.subcontrolId}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} subcontrols`);
    console.log(`⚠️  Skipped (already exist): ${skippedCount} subcontrols`);
    console.log(`❌ Errors: ${errorCount} subcontrols`);
    
    // Verify final count
    const finalCount = await prisma.euAiActSubcontrolStruct.count();
    console.log(`🗄️  Total subcontrols in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importSubcontrols();