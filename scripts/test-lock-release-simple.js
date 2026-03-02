// Simple test script for lock release
// Copy and paste this into the browser console on the assess dashboard page

console.log('🔒 Simple Lock Release Test Script Loaded');

// Get the current use case ID from the URL
const pathParts = window.location.pathname.split('/');
const useCaseId = pathParts[2]; // /dashboard/[useCaseId]/assess

console.log('🔒 Use Case ID:', useCaseId);

// Test function to release lock
function testLockRelease() {
  console.log('🔒 Testing lock release...');
  
  // Method 1: Use global function if available
  if (window.__releaseLockOnNavigation) {
    console.log('🔒 Using global release function...');
    window.__releaseLockOnNavigation();
    return;
  }
  
  // Method 2: Use beacon
  console.log('🔒 Using beacon method...');
  const data = new FormData();
  data.append('useCaseId', useCaseId);
  data.append('lockType', 'EXCLUSIVE');
  data.append('scope', 'ASSESS');
  
  const result = navigator.sendBeacon('/api/locks/release', data);
  console.log('🔒 Beacon result:', result);
  
  if (result) {
    console.log('✅ Lock release beacon sent successfully');
  } else {
    console.log('❌ Lock release beacon failed');
  }
}

// Test function to check lock status
function checkLockStatus() {
  console.log('🔒 Checking lock status...');
  
  fetch('/api/get-usecase-details?useCaseId=' + useCaseId)
    .then(response => response.json())
    .then(data => {
      console.log('🔒 Lock info:', data.lockInfo);
      console.log('🔒 Has exclusive lock:', data.lockInfo?.hasExclusiveLock);
      console.log('🔒 Can edit:', data.lockInfo?.canEdit);
    })
    .catch(error => {
      console.error('🔒 Error checking lock status:', error);
    });
}

// Test function to simulate navigation
function testNavigation() {
  console.log('🔒 Testing navigation...');
  
  // Try to trigger the beforeunload event
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  
  console.log('🔒 Beforeunload event dispatched');
}

// Make functions available globally
window.testLockRelease = testLockRelease;
window.checkLockStatus = checkLockStatus;
window.testNavigation = testNavigation;

console.log('🔒 Available functions:');
console.log('  - testLockRelease() - Test lock release');
console.log('  - checkLockStatus() - Check current lock status');
console.log('  - testNavigation() - Test navigation events');

// Auto-check lock status
setTimeout(() => {
  console.log('🔒 Auto-checking lock status...');
  checkLockStatus();
}, 1000);
