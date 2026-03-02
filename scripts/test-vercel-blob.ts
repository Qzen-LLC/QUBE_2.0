import { put, del } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// Load .env file
loadEnvFile();

async function testVercelBlob() {
  console.log('🧪 Testing Vercel Blob Integration...\n');

  try {
    // Test 1: Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is not set');
      console.log('Please add BLOB_READ_WRITE_TOKEN to your .env file');
      return;
    }
    console.log('✅ BLOB_READ_WRITE_TOKEN is configured');

    // Test 2: Create a test file
    const testContent = 'This is a test file for Vercel Blob integration';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    
    console.log('📤 Uploading test file...');
    const blob = await put('test/vercel-blob-test.txt', testBlob, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log('✅ File uploaded successfully');
    console.log(`📎 File URL: ${blob.url}`);
    console.log(`📁 File path: ${blob.pathname}`);

    // Test 3: Delete the test file
    console.log('🗑️ Deleting test file...');
    await del(blob.url);
    console.log('✅ File deleted successfully');

    console.log('\n🎉 All Vercel Blob tests passed!');
    console.log('\nYour Vercel Blob integration is working correctly.');
    console.log('You can now use file uploads in the governance dashboard.');

  } catch (error) {
    console.error('❌ Vercel Blob test failed:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure BLOB_READ_WRITE_TOKEN is set correctly');
    console.log('2. Verify your Vercel Blob store is created and active');
    console.log('3. Check your network connection');
  }
}

// Run the test
testVercelBlob();
