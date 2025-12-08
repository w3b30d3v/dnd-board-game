// Utility functions

/**
 * Roll dice notation (e.g., "2d6+3")
 * Returns the individual rolls and total
 */
export function parseDiceNotation(notation: string): {
  count: number;
  sides: number;
  modifier: number;
} {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  return {
    count: parseInt(match[1] ?? '1', 10),
    sides: parseInt(match[2] ?? '6', 10),
    modifier: parseInt(match[3] ?? '0', 10),
  };
}

/**
 * Calculate distance between two grid positions
 * Uses D&D 5e diagonal movement (5ft per diagonal)
 */
export function calculateDistance(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  // D&D 5e uses the larger of the two differences
  // Each cell is 5 feet
  return Math.max(dx, dy) * 5;
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
