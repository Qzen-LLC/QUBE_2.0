#!/usr/bin/env npx tsx

import { prismaClient } from '../src/utils/db';
import { uaeAiControls } from '../src/lib/framework-data/uae-ai-controls';

async function seedUaeAiControls() {
  console.log('🚀 Starting UAE AI Controls seeding...');

  try {
    // Clear existing UAE AI control data
    console.log('🧹 Clearing existing UAE AI control data...');
    await prismaClient.uaeAiControlInstance.deleteMany({});
    await prismaClient.uaeAiControl.deleteMany({});

    console.log('📋 Seeding UAE AI controls...');
    
    // Insert UAE AI controls
    for (const control of uaeAiControls) {
      await prismaClient.uaeAiControl.create({
        data: {
          controlId: control.controlId,
          title: control.title,
          description: control.description,
          legalBasis: control.legalBasis,
          evidenceTypes: control.evidenceTypes,
          orderIndex: control.orderIndex
        }
      });
      console.log(`✅ Created control: ${control.controlId} - ${control.title}`);
    }

    console.log('🎉 UAE AI Controls seeding completed successfully!');
    console.log(`📊 Total controls seeded: ${uaeAiControls.length}`);

  } catch (error) {
    console.error('❌ Error seeding UAE AI controls:', error);
    throw error;
  }
}

// Run the seeding function
seedUaeAiControls()
  .then(() => {
    console.log('✅ UAE AI Controls seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ UAE AI Controls seeding failed:', error);
    process.exit(1);
  });