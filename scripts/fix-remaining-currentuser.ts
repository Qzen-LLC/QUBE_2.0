#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  function scanDirectory(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  console.log('🔧 Fixing remaining currentUser() references...\n');
  
  const routeFiles = findRouteFiles('src/app/api');
  let fixed = 0;
  
  for (const file of routeFiles) {
    const content = readFileSync(file, 'utf8');
    
    if (content.includes('currentUser()')) {
      let newContent = content;
      
      // Remove currentUser() calls and auth checks
      newContent = newContent.replace(
        /const\s+user\s*=\s*await\s+currentUser\(\);\s*\n?\s*if\s*\(\s*!user\s*\)\s*{\s*\n?\s*return\s+NextResponse\.json\(\s*{\s*error:\s*['"]No authenticated user found['"]\s*,\s*authenticated:\s*false\s*}\s*,\s*{\s*status:\s*401\s*}\s*\);\s*\n?\s*}/g,
        '// auth context is provided by withAuth wrapper'
      );
      
      newContent = newContent.replace(
        /const\s+user\s*=\s*await\s+currentUser\(\);\s*\n?\s*if\s*\(\s*!user\s*\)\s*{\s*\n?\s*return\s+NextResponse\.json\(\s*{\s*error:\s*['"]Unauthorized['"]\s*}\s*,\s*{\s*status:\s*401\s*}\s*\);\s*\n?\s*}/g,
        '// auth context is provided by withAuth wrapper'
      );
      
      newContent = newContent.replace(
        /const\s+user\s*=\s*await\s+currentUser\(\);\s*\n?\s*if\s*\(\s*!user\s*\)\s*{\s*\n?\s*return\s+NextResponse\.json\(\s*{\s*error:\s*['"]Authentication required['"]\s*}\s*,\s*{\s*status:\s*401\s*}\s*\);\s*\n?\s*}/g,
        '// auth context is provided by withAuth wrapper'
      );
      
      // Replace any remaining user.id with auth.userId
      newContent = newContent.replace(/user\.id/g, 'auth.userId!');
      
      if (newContent !== content) {
        writeFileSync(file, newContent);
        console.log(`✅ Fixed: ${file}`);
        fixed++;
      }
    }
  }
  
  console.log(`\n📊 Fixed ${fixed} files`);
}

main();

