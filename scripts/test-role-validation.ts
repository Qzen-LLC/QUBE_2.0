import { validateUserRole, validateRoleAssignment } from '../src/utils/role-validation';

console.log('🧪 Testing role validation function...\n');

// Test cases
const testCases = [
  { role: 'USER', organizationId: null, expected: 'USER', description: 'User without organization' },
  { role: 'USER', organizationId: 'org-123', expected: 'ORG_USER', description: 'User with organization (should be corrected)' },
  { role: 'ORG_USER', organizationId: 'org-123', expected: 'ORG_USER', description: 'ORG_USER with organization' },
  { role: 'ORG_ADMIN', organizationId: 'org-123', expected: 'ORG_ADMIN', description: 'ORG_ADMIN with organization' },
  { role: 'QZEN_ADMIN', organizationId: null, expected: 'QZEN_ADMIN', description: 'QZEN_ADMIN without organization' },
  { role: 'QZEN_ADMIN', organizationId: 'org-123', expected: 'QZEN_ADMIN', description: 'QZEN_ADMIN with organization (should be corrected)' },
  { role: 'INVALID_ROLE', organizationId: null, expected: 'USER', description: 'Invalid role without organization' },
  { role: 'INVALID_ROLE', organizationId: 'org-123', expected: 'ORG_USER', description: 'Invalid role with organization' },
];

console.log('📋 Test Results:');
console.log('='.repeat(80));

testCases.forEach((testCase, index) => {
  const result = validateUserRole(testCase.role, testCase.organizationId);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'} ${testCase.description}`);
  console.log(`  Input: role="${testCase.role}", organizationId="${testCase.organizationId}"`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});

// Test role assignment validation
console.log('🔍 Testing role assignment validation:');
console.log('='.repeat(80));

const validationTests = [
  { role: 'USER', organizationId: null, shouldBeValid: true },
  { role: 'USER', organizationId: 'org-123', shouldBeValid: false },
  { role: 'ORG_USER', organizationId: null, shouldBeValid: false },
  { role: 'ORG_USER', organizationId: 'org-123', shouldBeValid: true },
  { role: 'ORG_ADMIN', organizationId: null, shouldBeValid: false },
  { role: 'ORG_ADMIN', organizationId: 'org-123', shouldBeValid: true },
  { role: 'QZEN_ADMIN', organizationId: null, shouldBeValid: true },
  { role: 'QZEN_ADMIN', organizationId: 'org-123', shouldBeValid: false },
];

validationTests.forEach((testCase, index) => {
  const result = validateRoleAssignment(testCase.role as any, testCase.organizationId);
  const passed = result.isValid === testCase.shouldBeValid;
  
  console.log(`Validation Test ${index + 1}: ${passed ? '✅' : '❌'}`);
  console.log(`  Input: role="${testCase.role}", organizationId="${testCase.organizationId}"`);
  console.log(`  Expected valid: ${testCase.shouldBeValid}`);
  console.log(`  Got valid: ${result.isValid}`);
  console.log(`  Message: ${result.message}`);
  if (result.correctedRole) {
    console.log(`  Corrected role: ${result.correctedRole}`);
  }
  console.log('');
});

console.log('✅ Role validation tests completed!');
