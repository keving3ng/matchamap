/**
 * City shortcode mapping for URLs
 * Maps full city names to URL-friendly short codes
 */

export const CITY_SHORTCODES = {
  toronto: 'tor',
  montreal: 'mtl',
  tokyo: 'tyo',
} as const

export const SHORTCODE_TO_CITY = {
  tor: 'toronto',
  mtl: 'montreal',
  tyo: 'tokyo',
} as const

export type CityShortcode = keyof typeof SHORTCODE_TO_CITY
export type CityName = keyof typeof CITY_SHORTCODES

/**
 * Convert city name to shortcode
 */
export function getCityShortcode(city: string): string {
  const normalized = city.toLowerCase() as CityName
  return CITY_SHORTCODES[normalized] || city
}

/**
 * Convert shortcode to city name
 */
export function getCityFromShortcode(shortcode: string): string {
  const normalized = shortcode.toLowerCase() as CityShortcode
  return SHORTCODE_TO_CITY[normalized] || shortcode
}

/**
 * Generate cafe URL path
 * Format: /{city-shortcode}/{cafe-slug}
 */
export function getCafeUrlPath(city: string, slug: string): string {
  const shortcode = getCityShortcode(city)
  return `/${shortcode}/${slug}`
}

/**
 * Parse cafe URL path
 * Returns { city, slug } or null if invalid
 */
export function parseCafeUrlPath(pathname: string): { city: string; slug: string } | null {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length !== 2) {
    return null
  }

  const [shortcode, slug] = parts
  const city = getCityFromShortcode(shortcode)

  return { city, slug }
}

/**
 * Check if a path matches the cafe URL pattern
 */
export function isCafeUrlPath(pathname: string): boolean {
  return parseCafeUrlPath(pathname) !== null
}
