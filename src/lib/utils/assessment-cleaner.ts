/**
 * Assessment Data Cleaner
 *
 * Removes empty/default values from assessment data to reduce token usage
 * and improve LLM prompt relevance. Only passes user-filled fields to LLM.
 */

export interface CleaningOptions {
  preserveExplicitZeros?: boolean;  // Keep zeros that have semantic meaning
  preserveFalse?: boolean;           // Keep explicit false booleans
  logChanges?: boolean;              // Log before/after stats
}

/**
 * Check if a value should be considered "empty" and removed
 */
function isEmpty(value: any, options: CleaningOptions = {}): boolean {
  // Null and undefined are always empty
  if (value === null || value === undefined) return true;

  // Empty strings are empty
  if (value === '') return true;

  // Empty arrays are empty
  if (Array.isArray(value) && value.length === 0) return true;

  // Zero is empty UNLESS we're preserving explicit zeros
  if (value === 0 && !options.preserveExplicitZeros) return true;

  // False is NOT empty if we're preserving booleans
  if (value === false && options.preserveFalse) return false;

  // Objects with no keys are empty
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Recursively clean an object, removing all empty values
 */
function cleanObject(obj: any, options: CleaningOptions = {}): any {
  if (obj === null || obj === undefined) return undefined;

  // Handle arrays - clean each element
  if (Array.isArray(obj)) {
    const cleaned = obj
      .map(item => cleanObject(item, options))
      .filter(item => !isEmpty(item, options));
    return cleaned.length > 0 ? cleaned : undefined;
  }

  // Handle objects - recursively clean each property
  if (typeof obj === 'object') {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip if value is empty
      if (isEmpty(value, options)) continue;

      // Recursively clean nested objects/arrays
      if (typeof value === 'object') {
        const cleanedValue = cleanObject(value, options);
        if (cleanedValue !== undefined && !isEmpty(cleanedValue, options)) {
          cleaned[key] = cleanedValue;
        }
      } else {
        // Primitive value - keep it
        cleaned[key] = value;
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  // Primitive values - return as-is
  return obj;
}

/**
 * Calculate data size statistics
 */
function calculateStats(data: any): { fieldCount: number; charCount: number } {
  const json = JSON.stringify(data);
  const fieldCount = (json.match(/:/g) || []).length;
  const charCount = json.length;
  return { fieldCount, charCount };
}

/**
 * Main function: Clean assessment data for LLM consumption
 */
export function cleanAssessmentData(
  assessmentData: any,
  options: CleaningOptions = {}
): any {
  const defaultOptions: CleaningOptions = {
    preserveExplicitZeros: false,  // Don't preserve zeros by default
    preserveFalse: true,            // Preserve false booleans (they're intentional)
    logChanges: false,
    ...options
  };

  // Calculate before stats
  const beforeStats = calculateStats(assessmentData);

  // Clean the data
  const cleaned = cleanObject(assessmentData, defaultOptions);

  // Calculate after stats
  const afterStats = calculateStats(cleaned);

  // Log if requested
  if (defaultOptions.logChanges) {
    const reduction = Math.round(((beforeStats.charCount - afterStats.charCount) / beforeStats.charCount) * 100);
    console.log('📊 Assessment Data Cleaning Stats:');
    console.log(`  Before: ${beforeStats.fieldCount} fields, ${beforeStats.charCount.toLocaleString()} chars`);
    console.log(`  After:  ${afterStats.fieldCount} fields, ${afterStats.charCount.toLocaleString()} chars`);
    console.log(`  Reduction: ${reduction}% smaller`);
    console.log(`  Removed: ${beforeStats.fieldCount - afterStats.fieldCount} empty fields`);
  }

  return cleaned || {};
}

/**
 * Special handling for specific assessment sections with known defaults
 */
export function cleanWithDefaults(assessmentData: any): any {
  const cleaned = cleanAssessmentData(assessmentData, {
    preserveFalse: true,
    logChanges: true
  });

  // Special handling for risk assessment - keep risks even if marked "None"
  if (assessmentData.riskAssessment) {
    const risks = assessmentData.riskAssessment;

    // Only keep technical risks that aren't "None/None"
    if (risks.technicalRisks && Array.isArray(risks.technicalRisks)) {
      const meaningfulRisks = risks.technicalRisks.filter((r: any) =>
        r && r.probability && r.impact &&
        r.probability !== 'None' && r.impact !== 'None'
      );
      if (meaningfulRisks.length > 0) {
        if (!cleaned.riskAssessment) cleaned.riskAssessment = {};
        cleaned.riskAssessment.technicalRisks = meaningfulRisks;
      }
    }

    // Only keep business risks that aren't "None/None"
    if (risks.businessRisks && Array.isArray(risks.businessRisks)) {
      const meaningfulRisks = risks.businessRisks.filter((r: any) =>
        r && r.probability && r.impact &&
        r.probability !== 'None' && r.impact !== 'None'
      );
      if (meaningfulRisks.length > 0) {
        if (!cleaned.riskAssessment) cleaned.riskAssessment = {};
        cleaned.riskAssessment.businessRisks = meaningfulRisks;
      }
    }
  }

  return cleaned;
}
