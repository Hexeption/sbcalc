/**
 * Utility functions for input validation and formatting
 */

/**
 * Clamps a number between min and max values
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parse and clamp a numeric input value
 */
export function parseAndClampNumber(
  value: string,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? min : clampNumber(parsed, min, max);
}

/**
 * Format time in seconds to a human-readable string
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

/**
 * Format large numbers with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}
