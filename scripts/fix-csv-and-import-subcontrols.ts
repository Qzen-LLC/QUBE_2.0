import { PrismaClient } from '@/generated/prisma';
import fs from 'fs';

const prisma = new PrismaClient();

async function fixAndImportSubcontrols() {
  try {
    console.log('🚀 Starting proper subcontrols import...');
    
    // First, let's see which existing controls need more subcontrols
    const existingControls = await prisma.euAiActControlStruct.findMany({
      include: {
        subcontrols: true
      },
      orderBy: { controlId: 'asc' }
    });
    
    console.log('📊 Existing controls and their subcontrol counts:');
    existingControls.forEach(control => {
      console.log(`   ${control.controlId}: ${control.title} (${control.subcontrols.length} subcontrols)`);
    });
    
    // Read and properly parse the CSV
    const csvPath = '/Users/kaluri/Downloads/EuAiActSubcontrolStruct_rows.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
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
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 6) {
        console.log(`⚠️  Skipping malformed line ${i}: ${line}`);
        continue;
      }
      
      const subcontrolData = {
        id: values[0],
        subcontrolId: values[1],
        title: values[2].replace(/^"|"$/g, ''), // Remove surrounding quotes
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
          continue;
        }
        
        // Check if subcontrol already exists
        const existing = await prisma.euAiActSubcontrolStruct.findUnique({
          where: { subcontrolId: subcontrolData.subcontrolId }
        });
        
        if (existing) {
          console.log(`⚠️  Subcontrol ${subcontrolData.subcontrolId} already exists`);
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
        
        console.log(`✅ Created: ${subcontrolData.subcontrolId} - ${subcontrolData.title}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error creating ${subcontrolData.subcontrolId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Final Summary:`);
    console.log(`✅ Successfully created: ${successCount} subcontrols`);
    console.log(`❌ Errors: ${errorCount} subcontrols`);
    
    // Show final counts per control
    const finalControls = await prisma.euAiActControlStruct.findMany({
      include: {
        subcontrols: true
      },
      orderBy: { controlId: 'asc' }
    });
    
    console.log('\n📊 Final subcontrol counts:');
    finalControls.forEach(control => {
      console.log(`   ${control.controlId}: ${control.subcontrols.length} subcontrols`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAndImportSubcontrols();