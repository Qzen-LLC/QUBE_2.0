#!/usr/bin/env tsx

import { prismaClient } from '../src/utils/db';

// Organization data extracted from user references
const organizationsData = [
  {
    id: '22ecfcfe-9f3d-420d-b191-1cdaa7bef68e',
    name: 'PSG Tech',
    domain: 'psgtech.ac.in',
    isActive: true
  },
  {
    id: 'org-1',
    name: 'ACME Corporation',
    domain: 'acme.com',
    isActive: true
  },
  {
    id: 'org-2',
    name: 'Globex Corporation',
    domain: 'globex.com',
    isActive: true
  },
  {
    id: 'org-3',
    name: 'Tech Startup Inc',
    domain: 'techstart.com',
    isActive: true
  },
  {
    id: 'org-4',
    name: 'Global Industries',
    domain: 'globalind.com',
    isActive: true
  },
  {
    id: 'test-org-1',
    name: 'Test Organization 1',
    domain: 'test-org-1.com',
    isActive: true
  },
  {
    id: 'test-org-2',
    name: 'Test Organization 2',
    domain: 'test-org-2.com',
    isActive: true
  }
];

async function restoreOrganizations() {
  try {
    console.log('🏢 Starting organization restoration...');
    
    // Clear existing organizations
    console.log('🧹 Clearing existing organizations...');
    await prismaClient.organization.deleteMany({});
    
    console.log(`📥 Restoring ${organizationsData.length} organizations...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const org of organizationsData) {
      try {
        await prismaClient.organization.create({
          data: {
            id: org.id,
            name: org.name,
            domain: org.domain,
            isActive: org.isActive
          }
        });
        
        console.log(`✅ Restored organization: ${org.name} (${org.domain})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to restore organization ${org.name}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Organization Restoration Summary:');
    console.log(`✅ Successfully restored: ${successCount} organizations`);
    console.log(`❌ Failed: ${errorCount} organizations`);
    
    // Verify organizations
    const allOrgs = await prismaClient.organization.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true
      }
    });
    
    console.log('\n🏢 Restored Organizations:');
    allOrgs.forEach(org => {
      console.log(`   ${org.name} - ${org.domain} (${org.isActive ? 'Active' : 'Inactive'})`);
    });
    
    console.log('\n🎉 Organization restoration completed!');
    
  } catch (error) {
    console.error('❌ Organization restoration failed:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

restoreOrganizations();