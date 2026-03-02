#!/usr/bin/env tsx

import { writeFileSync, readFileSync, existsSync } from 'fs';

const BYPASS_ENV_FILE = '/Users/kaluri/usecase-dashboard/.env.local';
const ENV_FILE = '/Users/kaluri/usecase-dashboard/.env';

function toggleAuthBypass(enable: boolean) {
  console.log(`🔧 ${enable ? 'Enabling' : 'Disabling'} auth bypass...\n`);

  try {
    // Read existing .env file
    let envContent = '';
    if (existsSync(ENV_FILE)) {
      envContent = readFileSync(ENV_FILE, 'utf8');
    }

    // Read or create .env.local
    let localEnvContent = '';
    if (existsSync(BYPASS_ENV_FILE)) {
      localEnvContent = readFileSync(BYPASS_ENV_FILE, 'utf8');
    }

    if (enable) {
      // Add bypass flag to .env.local
      if (!localEnvContent.includes('AUTH_BYPASS')) {
        localEnvContent += '\n# Auth Bypass for Testing\nAUTH_BYPASS=true\nAUTH_BYPASS_USER_ID=mock-test-user-123\n';
        writeFileSync(BYPASS_ENV_FILE, localEnvContent);
        console.log('✅ Auth bypass ENABLED in .env.local');
      } else {
        // Update existing bypass flag
        localEnvContent = localEnvContent.replace(/AUTH_BYPASS=false/g, 'AUTH_BYPASS=true');
        writeFileSync(BYPASS_ENV_FILE, localEnvContent);
        console.log('✅ Auth bypass ENABLED in .env.local');
      }
    } else {
      // Disable bypass flag
      if (localEnvContent.includes('AUTH_BYPASS')) {
        localEnvContent = localEnvContent.replace(/AUTH_BYPASS=true/g, 'AUTH_BYPASS=false');
        writeFileSync(BYPASS_ENV_FILE, localEnvContent);
        console.log('✅ Auth bypass DISABLED in .env.local');
      } else {
        console.log('ℹ️  Auth bypass was not enabled');
      }
    }

    console.log(`
${enable ? '✨ Auth bypass is now ENABLED!' : '🔒 Auth bypass is now DISABLED!'}

${enable ? `The application will use the mock user automatically.
No login required!

Mock User Details:
- ID: mock-test-user-123
- Email: test@example.com
- Role: USER` : 'Normal authentication is restored.'}

⚠️  IMPORTANT: Restart your dev server for changes to take effect:
   Press Ctrl+C to stop, then run: npm run dev

Commands:
- Enable bypass:  npm run auth-bypass:on
- Disable bypass: npm run auth-bypass:off
- Check status:   npm run auth-bypass:status
`);

  } catch (error) {
    console.error('❌ Error toggling auth bypass:', error);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'on') {
  toggleAuthBypass(true);
} else if (command === 'off') {
  toggleAuthBypass(false);
} else if (command === 'status') {
  const localEnvContent = existsSync(BYPASS_ENV_FILE) ? readFileSync(BYPASS_ENV_FILE, 'utf8') : '';
  const isEnabled = localEnvContent.includes('AUTH_BYPASS=true');
  console.log(`\n🔍 Auth Bypass Status: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n`);
} else {
  console.log(`
Usage: 
  tsx scripts/toggle-auth-bypass.ts on     # Enable bypass
  tsx scripts/toggle-auth-bypass.ts off    # Disable bypass
  tsx scripts/toggle-auth-bypass.ts status # Check status
`);
}

export default toggleAuthBypass;