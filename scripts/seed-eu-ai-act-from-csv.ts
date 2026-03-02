#!/usr/bin/env tsx

/**
 * EU AI Act Complete Seeding Script
 * 
 * This script seeds the complete EU AI Act structure from CSV files:
 * - EuAiActControlStruct_rows.csv (controls)
 * - EuAiActSubcontrolStruct_rows.csv (subcontrols)
 * 
 * Run this script when setting up a new database or restoring EU AI Act data.
 * 
 * Usage: npx tsx scripts/seed-eu-ai-act-from-csv.ts
 */

// Load environment variables
import { readFileSync } from 'fs';
import { join } from 'path';

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

import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedEuAiActFromCSV() {
  try {
    console.log('🌱 Seeding EU AI Act Framework from CSV files...');
    
    // Check if CSV files exist
    const controlsCsvPath = path.join(process.cwd(), 'Downloads', 'EuAiActControlStruct_rows.csv');
    const subcontrolsCsvPath = path.join(process.cwd(), 'Downloads', 'EuAiActSubcontrolStruct_rows.csv');
    
    // Alternative paths for CSV files
    const altControlsCsvPath = '/Users/kaluri/Downloads/EuAiActControlStruct_rows.csv';
    const altSubcontrolsCsvPath = '/Users/kaluri/Downloads/EuAiActSubcontrolStruct_rows.csv';
    
    const controlsPath = fs.existsSync(controlsCsvPath) ? controlsCsvPath : altControlsCsvPath;
    const subcontrolsPath = fs.existsSync(subcontrolsCsvPath) ? subcontrolsCsvPath : altSubcontrolsCsvPath;
    
    if (!fs.existsSync(controlsPath)) {
      console.error('❌ Controls CSV file not found at:', controlsPath);
      console.log('Please ensure EuAiActControlStruct_rows.csv is available');
      return;
    }
    
    if (!fs.existsSync(subcontrolsPath)) {
      console.error('❌ Subcontrols CSV file not found at:', subcontrolsPath);
      console.log('Please ensure EuAiActSubcontrolStruct_rows.csv is available');
      return;
    }
    
    console.log('📁 Using CSV files:');
    console.log(`   Controls: ${controlsPath}`);
    console.log(`   Subcontrols: ${subcontrolsPath}`);
    
    // Step 1: Seed basic categories (if they don't exist)
    console.log('\n📂 Step 1: Ensuring control categories exist...');
    const categories = [
      { categoryId: '1', title: 'AI Literacy and Responsible AI Training', description: 'Establish AI literacy and responsible AI training programs', orderIndex: 1 },
      { categoryId: '2', title: 'Transparency and Provision of Information to Deployers', description: 'Ensure transparency in AI system deployment and information sharing', orderIndex: 2 },
      { categoryId: '3', title: 'Human Oversight', description: 'Establish effective human oversight mechanisms for AI systems', orderIndex: 3 },
      { categoryId: '4', title: 'Corrective Actions and Duty of Information', description: 'Implement corrective actions and information duties', orderIndex: 4 },
      { categoryId: '5', title: 'Responsibilities Along the AI Value Chain', description: 'Define responsibilities across the AI development and deployment value chain', orderIndex: 5 },
      { categoryId: '6', title: 'Risk Management', description: 'Establish comprehensive risk management frameworks', orderIndex: 6 },
      { categoryId: '7', title: 'Data Governance', description: 'Establish data governance frameworks for AI systems', orderIndex: 7 },
      { categoryId: '8', title: 'Technical Documentation', description: 'Document technical aspects of AI systems and their capabilities', orderIndex: 8 },
      { categoryId: '9', title: 'Accuracy and Robustness', description: 'Ensure AI systems are accurate, robust, and secure', orderIndex: 9 },
      { categoryId: '10', title: 'Cybersecurity', description: 'Implement cybersecurity measures for AI systems', orderIndex: 10 },
      { categoryId: '11', title: 'Bias Monitoring', description: 'Identify, monitor, and mitigate bias in AI systems', orderIndex: 11 },
      { categoryId: '12', title: 'Explainability', description: 'Ensure AI systems provide adequate explainability and interpretability', orderIndex: 12 },
      { categoryId: '13', title: 'Post-Market Monitoring', description: 'Monitor AI systems after deployment for ongoing compliance', orderIndex: 13 }
    ];
    
    for (const category of categories) {
      try {
        await prisma.euAiActControlCategory.upsert({
          where: { categoryId: category.categoryId },
          update: {},
          create: {
            id: `category-${category.categoryId}`,
            categoryId: category.categoryId,
            title: category.title,
            description: category.description,
            orderIndex: category.orderIndex
          }
        });
      } catch (error) {
        console.log(`⚠️  Category ${category.categoryId} may already exist`);
      }
    }
    console.log('✅ Control categories ready');
    
    // Step 2: Import Control Structures from CSV
    console.log('\n🎯 Step 2: Importing Control Structures from CSV...');
    const controlsCsvContent = fs.readFileSync(controlsPath, 'utf-8');
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
        // Skip if description contains comma issues (malformed data)
        if (controlData.description.includes('and other critical issues') || 
            controlData.description.includes('and impacts')) {
          console.log(`⚠️  Skipping malformed control: ${controlData.controlId}`);
          continue;
        }
        
        await prisma.euAiActControlStruct.upsert({
          where: { controlId: controlData.controlId },
          update: {
            title: controlData.title,
            description: controlData.description,
            orderIndex: controlData.orderIndex
          },
          create: {
            id: controlData.id,
            controlId: controlData.controlId,
            title: controlData.title,
            description: controlData.description,
            orderIndex: controlData.orderIndex,
            categoryId: controlData.categoryId
          }
        });
        
        controlsImported++;
        
      } catch (error) {
        console.log(`⚠️  Skipped control ${controlData.controlId}:`, error.message);
        controlsSkipped++;
      }
    }
    
    console.log(`✅ Controls processed: ${controlsImported} imported/updated, ${controlsSkipped} skipped`);
    
    // Step 3: Import Subcontrol Structures from CSV
    console.log('\n🔧 Step 3: Importing Subcontrol Structures from CSV...');
    const subcontrolsCsvContent = fs.readFileSync(subcontrolsPath, 'utf-8');
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
        subcontrolsErrors++;
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
          subcontrolsErrors++;
          continue;
        }
        
        await prisma.euAiActSubcontrolStruct.upsert({
          where: { subcontrolId: subcontrolData.subcontrolId },
          update: {
            title: subcontrolData.title,
            description: subcontrolData.description,
            orderIndex: subcontrolData.orderIndex
          },
          create: {
            id: subcontrolData.id,
            subcontrolId: subcontrolData.subcontrolId,
            title: subcontrolData.title,
            description: subcontrolData.description,
            orderIndex: subcontrolData.orderIndex,
            controlId: subcontrolData.controlId
          }
        });
        
        subcontrolsImported++;
        
      } catch (error) {
        subcontrolsErrors++;
      }
    }
    
    console.log(`✅ Subcontrols processed: ${subcontrolsImported} imported/updated, ${subcontrolsErrors} errors`);
    
    // Final verification
    console.log('\n📊 Final Database State:');
    const totalCategories = await prisma.euAiActControlCategory.count();
    const totalControls = await prisma.euAiActControlStruct.count();
    const totalSubcontrols = await prisma.euAiActSubcontrolStruct.count();
    
    console.log(`📂 Categories: ${totalCategories}`);
    console.log(`🎯 Controls: ${totalControls}`);
    console.log(`🔧 Subcontrols: ${totalSubcontrols}`);
    
    console.log('\n🎉 EU AI Act Framework seeded successfully from CSV files!');
    console.log('\n💡 This script can be run again to update data from CSV files.');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedEuAiActFromCSV();
}

export { seedEuAiActFromCSV };