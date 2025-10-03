export interface CsvCafe {
  // Core fields
  name: string
  slug: string
  link: string
  address?: string
  latitude: number
  longitude: number
  city: string

  // Optional cafe fields
  ambianceScore?: number
  chargeForAltMilk?: number
  quickNote: string
  review?: string
  source?: string
  hours?: string
  instagram?: string
  instagramPostLink?: string
  tiktokPostLink?: string
  images?: string

  // Drinks for this cafe
  drinks: CsvDrink[]
}

export interface CsvDrink {
  name?: string | null // Optional - defaults to "Iced Matcha Latte"
  score: number // Required
  priceAmount?: number | null // Optional
  priceCurrency?: string | null // Optional
  gramsUsed?: number | null
  isDefault: boolean
  notes?: string | null
}

export interface ParseResult {
  cafes: CsvCafe[]
  errors: string[]
}

/**
 * Header mapping - maps various header names to our internal field names
 */
const headerMappings: Record<string, string[]> = {
  // Cafe fields
  'name': ['name'],
  'link': ['link', 'google maps url', 'url'],
  'city': ['city', 'location'],
  'quick_note': ['quick note', 'quick_note', 'note'],
  'review': ['review', 'description'],
  'source': ['source'],
  'ambiance_score': ['ambiance', 'ambiance_score', 'ambiance score'],
  'charge_for_alt_milk': ['charge for alternative milk', 'alt milk charge', 'charge_for_alt_milk'],
  'instagram': ['instagram', 'ig'],
  'instagram_post_link': ['ig post link', 'instagram_post_link', 'instagram post'],
  'tiktok_post_link': ['tiktok post link', 'tiktok_post_link', 'tiktok'],
  'grams': ['grams', 'grams_used', 'drink_grams_used', 'grams used'],

  // Drink fields
  'drink_name': ['drink name', 'drink_name', 'drink'],
  'drink_score': ['score', 'drink_score', 'drink score', 'rating'],
  'drink_price_amount': ['price', 'drink_price', 'price_amount', 'cost'],
}

/**
 * Generate a URL-safe slug from a cafe name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Normalize a header string for matching
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim()
}

/**
 * Map CSV headers to internal field names
 */
function mapHeaders(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  csvHeaders.forEach((csvHeader) => {
    const normalized = normalizeHeader(csvHeader)
    let matched = false

    // Check each internal field to see if this CSV header matches
    for (const [internalField, aliases] of Object.entries(headerMappings)) {
      if (aliases.some(alias => normalizeHeader(alias) === normalized)) {
        mapping[internalField] = csvHeader
        matched = true
        break
      }
    }

    // If no mapping found, use the normalized version directly as fallback
    if (!matched) {
      mapping[normalized] = csvHeader
    }
  })

  return mapping
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current.trim())

  return result
}

/**
 * Parse CSV with cafe and drink data
 * Format: Cafe fields on first row, drinks on subsequent rows (cafe fields blank)
 */
export function parseCsvToCafes(csvText: string): ParseResult {
  const errors: string[] = []
  const cafes: CsvCafe[] = []

  // Parse CSV respecting quoted fields
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    errors.push('CSV must have at least a header and one data row')
    return { cafes, errors }
  }

  const csvHeaders = parseCsvLine(lines[0])
  const headerMap = mapHeaders(csvHeaders)

  // Note: We don't validate required headers here since some will be auto-generated
  // (slug, latitude, longitude) from the Google Maps link

  let currentCafe: CsvCafe | null = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCsvLine(line)
    const row: Record<string, string> = {}

    // Map values using the CSV headers
    csvHeaders.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // Helper to get value by internal field name
    const getValue = (field: string): string => {
      const csvHeader = headerMap[field]
      return csvHeader ? row[csvHeader] || '' : ''
    }

    // Check if this is a new cafe (link is present = new cafe, since link is unique)
    const link = getValue('link')
    if (link) {
      // Save previous cafe if exists
      if (currentCafe) {
        cafes.push(currentCafe)
      }

      const name = getValue('name')
      const city = getValue('city')
      // Fall back to review if quick_note is empty
      const quickNote = getValue('quick_note') || getValue('review')

      // Validate required cafe fields (we'll skip slug, lat, lng for now - will be enriched later)
      if (!name || !city || !quickNote) {
        errors.push(`Row ${i + 1}: Missing required cafe fields (Name, City, or Quick Note/Review)`)
        currentCafe = null
        continue
      }

      // Create new cafe (lat, lng will be filled by enrichment step)
      currentCafe = {
        name,
        slug: generateSlug(name), // Generate slug from cafe name
        link,
        address: undefined,
        latitude: 0, // Will be fetched from Places API
        longitude: 0, // Will be fetched from Places API
        city: city.toLowerCase(), // Normalize to lowercase
        ambianceScore: getValue('ambiance_score') ? parseFloat(getValue('ambiance_score')) : undefined,
        chargeForAltMilk: (() => {
          const altMilkValue = getValue('charge_for_alt_milk')?.toLowerCase().trim()
          if (!altMilkValue) return undefined // Unknown - no data provided
          if (altMilkValue === 'free' || altMilkValue === '0') return 0 // Free
          const parsed = parseFloat(altMilkValue)
          return isNaN(parsed) ? undefined : parsed
        })(),
        quickNote,
        review: getValue('review') || undefined,
        source: getValue('source') || undefined,
        hours: undefined,
        instagram: getValue('instagram') || undefined,
        instagramPostLink: getValue('instagram_post_link') || undefined,
        tiktokPostLink: getValue('tiktok_post_link') || undefined,
        images: undefined,
        drinks: []
      }
    }

    // Add drink to current cafe - only if score exists
    const drinkScore = getValue('drink_score')
    if (currentCafe && drinkScore) {
      // Parse score (only required field for drinks)
      const score = parseFloat(drinkScore)
      if (isNaN(score)) {
        errors.push(`Row ${i + 1}: Invalid score "${drinkScore}"`)
        continue
      }

      // Default drink name to "Iced Matcha Latte" if not provided
      const drinkName = getValue('drink_name') || 'Iced Matcha Latte'

      // Parse price - OPTIONAL
      let priceAmount: number | null = null
      let priceCurrency: string | null = null
      const drinkPrice = getValue('drink_price_amount')

      if (drinkPrice && drinkPrice.trim()) {
        // Try to parse price
        const priceStr = drinkPrice.toLowerCase().trim()
        if (priceStr === 'free' || priceStr.includes('free')) {
          priceAmount = 0
        } else {
          // Extract number from string like "7", "7 usd", "$7.50", "8.5 (I think...)"
          const priceMatch = priceStr.match(/[\d.]+/)
          if (priceMatch) {
            priceAmount = parseFloat(priceMatch[0])

            // Infer currency from price text or city
            if (priceStr.includes('usd') || priceStr.includes('$')) {
              priceCurrency = 'USD'
            } else if (priceStr.includes('jpy') || priceStr.includes('¥')) {
              priceCurrency = 'JPY'
            } else {
              // Infer from city
              if (currentCafe.city.toLowerCase().includes('new york') || currentCafe.city.toLowerCase() === 'nyc') {
                priceCurrency = 'USD'
              } else if (currentCafe.city.toLowerCase().includes('tokyo')) {
                priceCurrency = 'JPY'
              } else {
                priceCurrency = 'CAD' // Toronto, Montreal, etc.
              }
            }
          }
          // If we can't parse price, leave it as null (don't error)
        }
      }

      // Parse grams - OPTIONAL
      const gramsValue = getValue('grams')
      const gramsUsed = gramsValue ? parseInt(gramsValue) : null

      currentCafe.drinks.push({
        name: drinkName,
        score,
        priceAmount,
        priceCurrency,
        gramsUsed,
        isDefault: true, // First drink is default
        notes: null
      })
    }
    // If no score, we don't add a drink - cafe can exist without drinks
  }

  // Add last cafe
  if (currentCafe) {
    cafes.push(currentCafe)
  }

  return { cafes, errors }
}

/**
 * Validate a cafe has all required fields (before enrichment)
 */
export function validateCafe(cafe: CsvCafe): string[] {
  const errors: string[] = []

  if (!cafe.name) errors.push('Missing name')
  if (!cafe.link) errors.push('Missing link')
  if (!cafe.city) errors.push('Missing city')
  if (!cafe.quickNote) errors.push('Missing quick_note')
  // Note: slug, latitude, longitude will be enriched from Places API

  return errors
}

/**
 * Validate a drink has all required fields
 */
export function validateDrink(drink: CsvDrink): string[] {
  const errors: string[] = []

  // Only score is required for drinks
  if (drink.score === undefined || drink.score === null || isNaN(drink.score)) errors.push('Invalid score')

  // Name defaults to "Iced Matcha Latte" so it's always valid
  // Price and currency are optional - no validation needed

  return errors
}
