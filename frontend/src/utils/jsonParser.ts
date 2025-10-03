import type { CsvCafe } from './csvParser'

export interface JsonParseResult {
  cafes: CsvCafe[]
  errors: string[]
}

/**
 * Parse and validate JSON export format
 * Accepts the same format as exported by exportCafes endpoint
 */
export function parseJsonToCafes(jsonText: string): JsonParseResult {
  const errors: string[] = []
  const cafes: CsvCafe[] = []

  try {
    const parsed = JSON.parse(jsonText)

    // Check if it's an array
    if (!Array.isArray(parsed)) {
      // Maybe it's wrapped in a "cafes" property
      if (parsed.cafes && Array.isArray(parsed.cafes)) {
        return validateCafes(parsed.cafes)
      }
      errors.push('JSON must be an array of cafes or an object with a "cafes" array')
      return { cafes, errors }
    }

    return validateCafes(parsed)
  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { cafes, errors }
  }
}

/**
 * Validate array of cafes
 */
function validateCafes(data: any[]): JsonParseResult {
  const errors: string[] = []
  const cafes: CsvCafe[] = []

  data.forEach((item, index) => {
    const cafeErrors = validateCafe(item, index)
    if (cafeErrors.length > 0) {
      errors.push(...cafeErrors)
    } else {
      // Convert to CsvCafe format
      cafes.push({
        name: item.name,
        slug: item.slug,
        link: item.link,
        address: item.address,
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        city: item.city?.toLowerCase() || 'toronto',
        ambianceScore: item.ambianceScore,
        chargeForAltMilk: item.chargeForAltMilk,
        quickNote: item.quickNote,
        review: item.review,
        source: item.source,
        hours: item.hours,
        instagram: item.instagram,
        instagramPostLink: item.instagramPostLink,
        tiktokPostLink: item.tiktokPostLink,
        images: item.images,
        drinks: validateDrinks(item.drinks || [], index),
      })
    }
  })

  return { cafes, errors }
}

/**
 * Validate a single cafe object
 */
function validateCafe(cafe: any, index: number): string[] {
  const errors: string[] = []

  // Required fields
  if (!cafe.name || typeof cafe.name !== 'string') {
    errors.push(`Cafe ${index + 1}: Missing or invalid "name" field`)
  }

  if (!cafe.link || typeof cafe.link !== 'string') {
    errors.push(`Cafe ${index + 1}: Missing or invalid "link" field`)
  }

  if (!cafe.quickNote || typeof cafe.quickNote !== 'string') {
    errors.push(`Cafe ${index + 1}: Missing or invalid "quickNote" field`)
  }

  // Slug - will be auto-generated if missing, but validate if present
  if (cafe.slug && typeof cafe.slug !== 'string') {
    errors.push(`Cafe ${index + 1}: Invalid "slug" field (must be string)`)
  }

  // City - default to toronto if missing
  if (cafe.city && typeof cafe.city !== 'string') {
    errors.push(`Cafe ${index + 1}: Invalid "city" field (must be string)`)
  }

  // Optional numeric fields
  if (cafe.latitude !== undefined && typeof cafe.latitude !== 'number') {
    errors.push(`Cafe ${index + 1}: Invalid "latitude" field (must be number)`)
  }

  if (cafe.longitude !== undefined && typeof cafe.longitude !== 'number') {
    errors.push(`Cafe ${index + 1}: Invalid "longitude" field (must be number)`)
  }

  if (cafe.ambianceScore !== undefined && typeof cafe.ambianceScore !== 'number') {
    errors.push(`Cafe ${index + 1}: Invalid "ambianceScore" field (must be number)`)
  }

  if (cafe.chargeForAltMilk !== undefined && typeof cafe.chargeForAltMilk !== 'number') {
    errors.push(`Cafe ${index + 1}: Invalid "chargeForAltMilk" field (must be number)`)
  }

  // Drinks must be an array
  if (cafe.drinks && !Array.isArray(cafe.drinks)) {
    errors.push(`Cafe ${index + 1}: "drinks" must be an array`)
  }

  return errors
}

/**
 * Validate drinks array
 */
function validateDrinks(drinks: any[], cafeIndex: number): any[] {
  return drinks.filter((drink, drinkIndex) => {
    // Required: score
    if (typeof drink.score !== 'number') {
      console.warn(`Cafe ${cafeIndex + 1}, Drink ${drinkIndex + 1}: Missing or invalid "score" field - skipping`)
      return false
    }

    // Optional: name (defaults to "Iced Matcha Latte" if missing)
    if (drink.name && typeof drink.name !== 'string') {
      console.warn(`Cafe ${cafeIndex + 1}, Drink ${drinkIndex + 1}: Invalid "name" field`)
      return false
    }

    return true
  }).map(drink => ({
    name: drink.name || 'Iced Matcha Latte',
    score: drink.score,
    priceAmount: drink.priceAmount ?? null,
    priceCurrency: drink.priceCurrency ?? null,
    gramsUsed: drink.gramsUsed ?? null,
    isDefault: drink.isDefault ?? false,
    notes: drink.notes ?? null,
  }))
}
