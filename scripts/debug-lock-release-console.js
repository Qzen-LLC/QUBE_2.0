// Debug script for lock release functionality
// Copy and paste this into the browser console on the assess dashboard page

console.log('🔒 Lock Release Debug Script Loaded');

// Test lock release function
window.testLockRelease = function() {
  console.log('🔒 Testing lock release...');
  
  // Get the current use case ID from the URL
  const pathParts = window.location.pathname.split('/');
  const useCaseId = pathParts[2]; // /dashboard/[useCaseId]/assess
  
  console.log('🔒 Use Case ID:', useCaseId);
  
  // Test beacon release
  try {
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
  } catch (error) {
    console.error('🔒 Error sending beacon:', error);
  }
  
  // Test fetch release
  fetch('/api/locks/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      useCaseId: useCaseId, 
      lockType: 'EXCLUSIVE', 
      scope: 'ASSESS' 
    })
  })
  .then(response => {
    console.log('🔒 Fetch response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('🔒 Fetch response data:', data);
  })
  .catch(error => {
    console.error('🔒 Fetch error:', error);
  });
};

// Test navigation simulation
window.testNavigation = function() {
  console.log('🔒 Testing navigation...');
  
  // Simulate navigation by changing the URL
  const currentUrl = window.location.href;
  const newUrl = currentUrl.replace('/assess', '/test-navigation');
  
  console.log('🔒 Current URL:', currentUrl);
  console.log('🔒 New URL:', newUrl);
  
  // This should trigger the navigation events
  window.location.href = newUrl;
};

// Test beforeunload event
window.testBeforeUnload = function() {
  console.log('🔒 Testing beforeunload event...');
  
  // Create and dispatch a beforeunload event
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  
  console.log('🔒 Beforeunload event dispatched');
};

// Test pagehide event
window.testPageHide = function() {
  console.log('🔒 Testing pagehide event...');
  
  // Create and dispatch a pagehide event
  const event = new Event('pagehide');
  window.dispatchEvent(event);
  
  console.log('🔒 Pagehide event dispatched');
};

// Test visibility change
window.testVisibilityChange = function() {
  console.log('🔒 Testing visibility change...');
  
  // Simulate page becoming hidden
  Object.defineProperty(document, 'visibilityState', {
    value: 'hidden',
    writable: true
  });
  
  // Create and dispatch a visibilitychange event
  const event = new Event('visibilitychange');
  document.dispatchEvent(event);
  
  console.log('🔒 Visibility change event dispatched');
};

// Check current lock status
window.checkLockStatus = function() {
  console.log('🔒 Checking lock status...');
  
  // Check if there are any active locks in the database
  fetch('/api/get-usecase-details?useCaseId=' + window.location.pathname.split('/')[2])
    .then(response => response.json())
    .then(data => {
      console.log('🔒 Lock info:', data.lockInfo);
      console.log('🔒 Has exclusive lock:', data.lockInfo?.hasExclusiveLock);
      console.log('🔒 Can edit:', data.lockInfo?.canEdit);
    })
    .catch(error => {
      console.error('🔒 Error checking lock status:', error);
    });
};

console.log('🔒 Available functions:');
console.log('  - testLockRelease() - Test lock release API');
console.log('  - testNavigation() - Test navigation simulation');
console.log('  - testBeforeUnload() - Test beforeunload event');
console.log('  - testPageHide() - Test pagehide event');
console.log('  - testVisibilityChange() - Test visibility change event');
console.log('  - checkLockStatus() - Check current lock status');

// Auto-check lock status on load
setTimeout(() => {
  console.log('🔒 Auto-checking lock status...');
  window.checkLockStatus();
}, 1000);
