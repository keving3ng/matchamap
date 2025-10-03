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
  name: string
  score: number
  priceAmount: number
  priceCurrency: string
  gramsUsed?: number
  isDefault: boolean
  notes?: string
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

    // Check if this is a new cafe (name is filled)
    const name = getValue('name')
    if (name) {
      // Save previous cafe if exists
      if (currentCafe) {
        cafes.push(currentCafe)
      }

      const link = getValue('link')
      const city = getValue('city')
      const quickNote = getValue('quick_note')

      // Validate required cafe fields (we'll skip slug, lat, lng for now - will be enriched later)
      if (!link || !city || !quickNote) {
        errors.push(`Row ${i + 1}: Missing required cafe fields (Link, City, or Quick Note)`)
        currentCafe = null
        continue
      }

      // Create new cafe (slug, lat, lng will be filled by enrichment step)
      currentCafe = {
        name,
        slug: '', // Will be generated from name or fetched from Places API
        link,
        address: undefined,
        latitude: 0, // Will be fetched from Places API
        longitude: 0, // Will be fetched from Places API
        city,
        ambianceScore: getValue('ambiance_score') ? parseFloat(getValue('ambiance_score')) : undefined,
        chargeForAltMilk: getValue('charge_for_alt_milk') ? parseFloat(getValue('charge_for_alt_milk')) : undefined,
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

    // Add drink to current cafe
    const drinkName = getValue('drink_name')
    if (currentCafe && drinkName) {
      const drinkScore = getValue('drink_score')
      const drinkPrice = getValue('drink_price_amount')

      if (!drinkScore) {
        errors.push(`Row ${i + 1}: Missing Score field`)
        continue
      }

      if (!drinkPrice) {
        errors.push(`Row ${i + 1}: Missing Price field`)
        continue
      }

      // Parse score
      const score = parseFloat(drinkScore)
      if (isNaN(score)) {
        errors.push(`Row ${i + 1}: Invalid score "${drinkScore}"`)
        continue
      }

      // Parse price - handle various formats
      let priceAmount = 0
      let priceCurrency = 'CAD' // Default

      // Try to parse price
      const priceStr = drinkPrice.toLowerCase().trim()
      if (priceStr === 'free' || priceStr.includes('free')) {
        priceAmount = 0
      } else {
        // Extract number from string like "7", "7 usd", "$7.50"
        const priceMatch = priceStr.match(/[\d.]+/)
        if (priceMatch) {
          priceAmount = parseFloat(priceMatch[0])
        } else {
          errors.push(`Row ${i + 1}: Could not parse price "${drinkPrice}"`)
          continue
        }
      }

      // Infer currency from city if not specified
      if (currentCafe.city.toLowerCase().includes('new york') || currentCafe.city.toLowerCase() === 'nyc') {
        priceCurrency = 'USD'
      } else if (currentCafe.city.toLowerCase().includes('tokyo')) {
        priceCurrency = 'JPY'
      } else {
        priceCurrency = 'CAD' // Toronto, Montreal, etc.
      }

      currentCafe.drinks.push({
        name: drinkName,
        score,
        priceAmount,
        priceCurrency,
        gramsUsed: getValue('grams') ? parseInt(getValue('grams')) : undefined,
        isDefault: true, // First drink is default
        notes: undefined
      })
    }
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

  if (!drink.name) errors.push('Missing name')
  if (drink.score === undefined || drink.score === null || isNaN(drink.score)) errors.push('Invalid score')
  if (drink.priceAmount === undefined || drink.priceAmount === null || isNaN(drink.priceAmount)) errors.push('Invalid price_amount')
  if (!drink.priceCurrency) errors.push('Missing price_currency')

  return errors
}
