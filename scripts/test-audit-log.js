#!/usr/bin/env node

// Test script for the audit log service
// This script tests the CRUD log interception and Loki forwarding

console.log("🧪 Testing Audit Log Service...");

// Test various CRUD log formats
console.log('[CRUD_LOG] UseCase created:', { 
  id: 'test-123', 
  title: 'Test Use Case', 
  aiucId: 1, 
  createdAt: new Date().toISOString(), authoredBy: 'test-user-123' 
});

console.log('[CRUD_LOG] User updated:', { 
  id: 'user-456', 
  email: 'test@example.com', 
  role: 'USER', 
  updatedAt: new Date().toISOString(), authoredBy: 'test-user-123' 
});

console.log('[CRUD_LOG] Risk deleted:', { 
  id: 'risk-789', 
  useCaseId: 'test-123', authoredBy: 'test-user-123' 
});

console.log('[CRUD_LOG] FinOps data upserted:', { 
  useCaseId: 'test-123', 
  ROI: 150, 
  netValue: 50000, 
  totalInvestment: 25000, authoredBy: 'test-user-123' 
});

// Test non-CRUD logs (should not be sent to Loki)
console.log('This is a regular log message');
console.error('This is an error message');
console.warn('This is a warning message');

// Test CRUD logs with different entities
console.log('[CRUD_LOG] Vendor created:', { 
  id: 'vendor-001', 
  name: 'Test Vendor', 
  category: 'AI Platform', authoredBy: 'test-user-123' 
});

console.log('[CRUD_LOG] Assessment progress updated:', { 
  id: 'assessment-001', 
  progress: 75, 
  status: 'in_progress', authoredBy: 'test-user-123' 
});

console.log('[CRUD_LOG] Prompt Template created:', { 
  id: 'prompt-001', 
  name: 'Test Prompt', 
  type: 'completion', authoredBy: 'test-user-123' 
});

console.log("✅ Audit log tests completed!");
console.log("Check Loki at http://localhost:3100 for the audit logs");
console.log("Check Grafana at http://localhost:3000 for visualization"); 