import { UserRole } from '@/generated/prisma';

/**
 * Validates and corrects user role based on organization membership
 * Users with organizationId should be ORG_USER or ORG_ADMIN, not USER
 */
export function validateUserRole(role: string, organizationId: string | null): UserRole {
  const validRoles = ['QZEN_ADMIN', 'ORG_ADMIN', 'ORG_USER', 'USER'] as const;
  
  // If role is valid, use it
  if (validRoles.includes(role as any)) {
    const userRole = role as UserRole;
    
    // If user has organizationId but is assigned USER role, correct to ORG_USER
    if (organizationId && userRole === 'USER') {
      console.warn(`⚠️ User with organizationId ${organizationId} has USER role, correcting to ORG_USER`);
      return 'ORG_USER';
    }
    
    // If QZEN_ADMIN has organizationId, remove it (QZEN_ADMIN should not have organizationId)
    if (userRole === 'QZEN_ADMIN' && organizationId) {
      console.warn(`⚠️ QZEN_ADMIN with organizationId ${organizationId}, organizationId should be null`);
      // Note: This function only returns the role, organizationId correction should be handled elsewhere
    }
    
    return userRole;
  }
  
  // If role is invalid but user has organizationId, default to ORG_USER
  if (organizationId) {
    console.warn(`⚠️ Invalid role "${role}" for user with organizationId ${organizationId}, defaulting to ORG_USER`);
    return 'ORG_USER';
  }
  
  // If no organizationId and invalid role, default to USER
  console.warn(`⚠️ Invalid role "${role}" for user without organizationId, defaulting to USER`);
  return 'USER';
}

/**
 * Ensures role consistency for users with organizationId
 */
export function ensureRoleConsistency(role: UserRole, organizationId: string | null): UserRole {
  if (organizationId && role === 'USER') {
    console.warn(`⚠️ Correcting USER role to ORG_USER for user with organizationId ${organizationId}`);
    return 'ORG_USER';
  }
  
  return role;
}

/**
 * Validates that the role assignment makes sense for the user's context
 */
export function validateRoleAssignment(role: UserRole, organizationId: string | null): {
  isValid: boolean;
  correctedRole?: UserRole;
  message: string;
} {
  // QZEN_ADMIN should not have organizationId
  if (role === 'QZEN_ADMIN' && organizationId) {
    return {
      isValid: false,
      correctedRole: 'QZEN_ADMIN',
      message: 'QZEN_ADMIN users should not have organizationId'
    };
  }
  
  // ORG_ADMIN and ORG_USER must have organizationId
  if ((role === 'ORG_ADMIN' || role === 'ORG_USER') && !organizationId) {
    return {
      isValid: false,
      correctedRole: 'USER',
      message: 'ORG_ADMIN and ORG_USER must have organizationId'
    };
  }
  
  // USER role should not have organizationId
  if (role === 'USER' && organizationId) {
    return {
      isValid: false,
      correctedRole: 'ORG_USER',
      message: 'Users with organizationId should be ORG_USER or ORG_ADMIN, not USER'
    };
  }
  
  return {
    isValid: true,
    message: 'Role assignment is valid'
  };
}
