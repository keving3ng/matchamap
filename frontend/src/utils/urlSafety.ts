/**
 * URL safety utilities for validating and sanitizing external URLs
 * Helps prevent XSS and other security issues when constructing URLs
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
 * Sanitizes a location string for use in Google Maps URLs
 * Removes potentially dangerous characters while preserving readability
 * @param location - The location string to sanitize
 * @returns Sanitized location string
 */
function sanitizeLocationForMaps(location: string): string {
  if (!location || typeof location !== 'string') {
    return ''
  }
  
  // Remove potentially dangerous characters but keep normal punctuation
  // Allow letters, numbers, spaces, commas, periods, hyphens, apostrophes
  return location
    .replace(/[^a-zA-Z0-9\s,.\-']/g, '')
    .trim()
    .slice(0, 100) // Limit length to prevent URL issues
}

/**
 * Creates a safe Google Maps search URL
 * @param location - The location to search for
 * @returns Safe Google Maps URL or null if location is invalid
 */
export function createSafeGoogleMapsUrl(location: string): string | null {
  const sanitizedLocation = sanitizeLocationForMaps(location)
  
  if (!sanitizedLocation) {
    console.warn('Invalid location for Google Maps:', location)
    return null
  }
  
  try {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sanitizedLocation)}`
    
    // Validate the constructed URL
    if (!isValidUrl(url)) {
      console.warn('Invalid Google Maps URL constructed:', url)
      return null
    }
    
    return url
  } catch (error) {
    console.warn('Error creating Google Maps URL:', error)
    return null
  }
}