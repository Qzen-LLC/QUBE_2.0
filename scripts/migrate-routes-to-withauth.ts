#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const API_DIR = 'src/app/api';

interface RouteFile {
  path: string;
  content: string;
  usesCurrentUser: boolean;
  usesWithAuth: boolean;
}

function findRouteFiles(dir: string): RouteFile[] {
  const files: RouteFile[] = [];
  
  function scanDirectory(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        const content = readFileSync(fullPath, 'utf8');
        files.push({
          path: fullPath,
          content,
          usesCurrentUser: content.includes('currentUser'),
          usesWithAuth: content.includes('withAuth')
        });
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function migrateRouteFile(file: RouteFile): string {
  let content = file.content;
  
  // Skip if already uses withAuth
  if (file.usesWithAuth) {
    console.log(`⏭️  Skipping ${file.path} - already uses withAuth`);
    return content;
  }
  
  // Skip if doesn't use currentUser
  if (!file.usesCurrentUser) {
    console.log(`⏭️  Skipping ${file.path} - no currentUser usage`);
    return content;
  }
  
  console.log(`🔄 Migrating ${file.path}...`);
  
  // Add withAuth import
  if (!content.includes('withAuth')) {
    const importMatch = content.match(/import.*from.*['"]next\/server['"];?/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}\nimport { withAuth } from '@/lib/auth-gateway';`
      );
    }
  }
  
  // Remove currentUser import
  content = content.replace(/import\s*{\s*currentUser\s*}\s*from\s*['"]@clerk\/nextjs\/server['"];?\n?/g, '');
  
  // Replace export async function with export const = withAuth
  content = content.replace(
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*\)\s*{/g,
    'export const $1 = withAuth(async (request, { auth }) => {'
  );
  
  // Replace export async function with parameters
  content = content.replace(
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*request\s*\)\s*{/g,
    'export const $1 = withAuth(async (request, { auth }) => {'
  );
  
  // Replace currentUser() calls
  content = content.replace(
    /const\s+user\s*=\s*await\s+currentUser\(\);\s*\n?\s*if\s*\(\s*!user\s*\)\s*{\s*\n?\s*return\s+NextResponse\.json\(\s*{\s*error:\s*['"]Unauthorized['"]\s*}\s*,\s*{\s*status:\s*401\s*}\s*\);\s*\n?\s*}/g,
    '// auth context is provided by withAuth wrapper'
  );
  
  // Replace user.id with auth.userId
  content = content.replace(/user\.id/g, 'auth.userId!');
  
  // Add withAuth options at the end
  const lastBraceIndex = content.lastIndexOf('}');
  if (lastBraceIndex !== -1) {
    content = content.slice(0, lastBraceIndex) + '}, { requireUser: true });';
  }
  
  return content;
}

function main() {
  console.log('🚀 Starting route migration from currentUser to withAuth...\n');
  
  const routeFiles = findRouteFiles(API_DIR);
  const filesToMigrate = routeFiles.filter(f => f.usesCurrentUser && !f.usesWithAuth);
  
  console.log(`📊 Found ${routeFiles.length} route files:`);
  console.log(`   - ${filesToMigrate.length} need migration (use currentUser, not withAuth)`);
  console.log(`   - ${routeFiles.length - filesToMigrate.length} already migrated or don't need migration\n`);
  
  if (filesToMigrate.length === 0) {
    console.log('✅ No files need migration!');
    return;
  }
  
  console.log('Files to migrate:');
  filesToMigrate.forEach(file => {
    console.log(`   - ${file.path}`);
  });
  console.log('');
  
  // Create backup directory
  const backupDir = 'scripts/backups/route-migration';
  try {
    require('fs').mkdirSync(backupDir, { recursive: true });
  } catch (e) {
    // Directory already exists
  }
  
  let migrated = 0;
  let errors = 0;
  
  for (const file of filesToMigrate) {
    try {
      // Create backup
      const backupPath = join(backupDir, file.path.replace(/\//g, '_'));
      writeFileSync(backupPath, file.content);
      
      // Migrate
      const migratedContent = migrateRouteFile(file);
      writeFileSync(file.path, migratedContent);
      
      migrated++;
      console.log(`✅ Migrated ${file.path}`);
    } catch (error) {
      errors++;
      console.error(`❌ Error migrating ${file.path}:`, error);
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   - ✅ Successfully migrated: ${migrated} files`);
  console.log(`   - ❌ Errors: ${errors} files`);
  console.log(`   - 📁 Backups created in: ${backupDir}`);
  
  if (errors > 0) {
    console.log('\n⚠️  Some files had errors. Please review and fix manually.');
  } else {
    console.log('\n🎉 All files migrated successfully!');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Test the migrated routes');
  console.log('2. Check for any TypeScript errors');
  console.log('3. Update any custom authorization logic');
  console.log('4. Remove backup files when satisfied');
}

if (require.main === module) {
  main();
}

export { migrateRouteFile, findRouteFiles };
