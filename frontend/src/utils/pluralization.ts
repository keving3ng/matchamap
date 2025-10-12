/**
 * Utility functions for handling pluralization
 */

/**
 * Returns the singular or plural form of a word based on count
 * @param count The number to check
 * @param singular The singular form of the word
 * @param plural The plural form of the word (optional, defaults to singular + 's')
 * @returns The appropriate form of the word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular
  }
  return plural || `${singular}s`
}

/**
 * Returns a formatted string with count and pluralized word
 * @param count The number to display
 * @param singular The singular form of the word
 * @param plural The plural form of the word (optional, defaults to singular + 's')
 * @returns Formatted string like "1 event" or "5 events"
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`
}