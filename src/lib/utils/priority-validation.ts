/**
 * Valid priority values for use cases
 */
export const VALID_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export type PriorityValue = typeof VALID_PRIORITIES[number];

/**
 * Validates if a priority value is valid
 * @param priority - The priority value to validate
 * @returns true if valid, false otherwise
 */
export function isValidPriority(priority: string): priority is PriorityValue {
  return VALID_PRIORITIES.includes(priority as PriorityValue);
}

/**
 * Validates and processes a priority update for a use case
 * This function contains the core validation logic that can be unit tested
 * 
 * @param priority - The priority value to validate
 * @param existingData - The existing use case data to preserve
 * @returns An object with validation result and updated data
 */
export function validatePriorityUpdate(
  priority: string,
  existingData: { priority?: string | null; [key: string]: any }
): { valid: boolean; error?: string; updatedData?: { priority: string; updatedAt: Date; [key: string]: any } } {
  // Validate priority value
  if (!isValidPriority(priority)) {
    return {
      valid: false,
      error: 'Invalid priority value'
    };
  }

  // Return updated data preserving all existing fields
  return {
    valid: true,
    updatedData: {
      ...existingData,
      priority: priority,
      updatedAt: new Date()
    }
  };
}












