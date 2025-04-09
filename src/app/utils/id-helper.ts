/**
 * Helper utilities for handling IDs consistently throughout the application
 */

/**
 * Ensures an ID value is converted to a number if it's a string
 * @param id The ID to normalize (can be string, number, or undefined/null)
 * @returns A numeric ID or null if input was null/undefined
 */
export function normalizeId(id: string | number | null | undefined): number | null {
  if (id === null || id === undefined) {
    return null;
  }
  
  if (typeof id === 'number') {
    return id;
  }
  
  // Try to convert string to number
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    console.warn(`Failed to convert ID "${id}" to a number`);
    return null;
  }
  
  return numericId;
}

/**
 * Checks if an ID value is valid (not null, undefined, or NaN)
 * @param id The ID to check
 * @returns Boolean indicating if the ID is valid
 */
export function isValidId(id: string | number | null | undefined): boolean {
  if (id === null || id === undefined) {
    return false;
  }
  
  if (typeof id === 'number') {
    return !isNaN(id);
  }
  
  // Check if string can be converted to a valid number
  return !isNaN(parseInt(id, 10));
}

/**
 * Safe way to convert any ID type to a string representation
 * @param id The ID to stringify
 * @returns String representation of the ID or empty string if invalid
 */
export function idToString(id: string | number | null | undefined): string {
  if (id === null || id === undefined) {
    return '';
  }
  
  return id.toString();
} 