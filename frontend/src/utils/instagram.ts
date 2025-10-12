/**
 * Instagram URL utility functions
 * Handles parsing and validation of Instagram URLs and handles
 */

/**
 * Validates if a URL is safe (basic check for http/https protocol)
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Converts an Instagram handle or post link to a full Instagram URL
 * Handles three cases:
 * 1. Full URL (http/https) - validates and returns as-is
 * 2. Instagram handle with @ prefix - converts to profile URL
 * 3. Plain username - converts to profile URL
 *
 * @param image - Instagram handle, username, or full URL
 * @returns Full Instagram URL or null if invalid
 *
 * @example
 * getInstagramUrl('@matchamap') // => 'https://instagram.com/matchamap'
 * getInstagramUrl('matchamap') // => 'https://instagram.com/matchamap'
 * getInstagramUrl('https://instagram.com/p/ABC123') // => 'https://instagram.com/p/ABC123'
 */
export function getInstagramUrl(image: string | null | undefined): string | null {
  if (!image) return null

  // Check if it's already a full URL
  if (image.startsWith('http')) {
    // Validate URL for security
    if (!isValidUrl(image)) {
      console.warn('Invalid URL detected:', image)
      return null
    }
    return image
  }

  // Check if it's an Instagram handle (starts with @)
  if (image.startsWith('@')) {
    const username = image.slice(1) // Remove @ symbol
    // Basic validation: username should only contain alphanumeric, dots, and underscores
    if (!/^[\w.]+$/.test(username)) {
      console.warn('Invalid Instagram username:', username)
      return null
    }
    return `https://instagram.com/${username}`
  }

  // Assume it's a handle without @ prefix
  // Basic validation: username should only contain alphanumeric, dots, and underscores
  if (!/^[\w.]+$/.test(image)) {
    console.warn('Invalid Instagram username:', image)
    return null
  }
  return `https://instagram.com/${image}`
}
