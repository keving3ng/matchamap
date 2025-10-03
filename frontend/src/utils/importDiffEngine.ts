import type { CsvCafe, CsvDrink } from './csvParser'
import type { Cafe, DrinkItem } from '../types'
import { validateCafe, validateDrink } from './csvParser'

export interface CafeChange {
  type: 'update' | 'new'
  cafe: CsvCafe
  existingCafe?: Cafe
  changes?: string[] // List of changed fields
}

export interface InvalidEntry {
  cafe: CsvCafe
  errors: string[]
}

export interface ImportChangelog {
  existingChanges: CafeChange[] // Updates to existing cafes/drinks
  newAdditions: CafeChange[] // New cafes that are valid
  invalidEntries: InvalidEntry[] // Entries that cannot be added
}

/**
 * Compare CSV cafes against existing cafes to generate changelog
 */
export function generateChangelog(
  csvCafes: CsvCafe[],
  existingCafes: Cafe[]
): ImportChangelog {
  const existingChanges: CafeChange[] = []
  const newAdditions: CafeChange[] = []
  const invalidEntries: InvalidEntry[] = []

  // Create lookup map by slug
  const existingBySlug = new Map<string, Cafe>()
  existingCafes.forEach(cafe => {
    existingBySlug.set(cafe.slug, cafe)
  })

  csvCafes.forEach(csvCafe => {
    // Validate cafe
    const cafeErrors = validateCafe(csvCafe)

    // Validate all drinks
    const drinkErrors: string[] = []
    csvCafe.drinks.forEach((drink, idx) => {
      const errors = validateDrink(drink)
      if (errors.length > 0) {
        drinkErrors.push(`Drink ${idx + 1}: ${errors.join(', ')}`)
      }
    })

    const allErrors = [...cafeErrors, ...drinkErrors]

    // If cafe has no drinks, it's invalid
    if (csvCafe.drinks.length === 0) {
      allErrors.push('Cafe must have at least one drink')
    }

    // If there are validation errors, add to invalid
    if (allErrors.length > 0) {
      invalidEntries.push({
        cafe: csvCafe,
        errors: allErrors
      })
      return
    }

    const existing = existingBySlug.get(csvCafe.slug)

    if (existing) {
      // Compare for changes
      const changes = detectCafeChanges(csvCafe, existing)
      if (changes.length > 0) {
        existingChanges.push({
          type: 'update',
          cafe: csvCafe,
          existingCafe: existing,
          changes
        })
      }
    } else {
      // New cafe
      newAdditions.push({
        type: 'new',
        cafe: csvCafe
      })
    }
  })

  return { existingChanges, newAdditions, invalidEntries }
}

/**
 * Detect what changed between CSV cafe and existing cafe
 */
function detectCafeChanges(csvCafe: CsvCafe, existing: Cafe): string[] {
  const changes: string[] = []

  // Compare cafe-level fields
  if (csvCafe.name !== existing.name) changes.push(`Name: "${existing.name}" → "${csvCafe.name}"`)
  if (csvCafe.link !== existing.link) changes.push(`Link updated`)
  if (csvCafe.address !== existing.address) changes.push(`Address: "${existing.address}" → "${csvCafe.address}"`)
  if (csvCafe.latitude !== existing.latitude || csvCafe.longitude !== existing.longitude) {
    changes.push(`Location: (${existing.latitude}, ${existing.longitude}) → (${csvCafe.latitude}, ${csvCafe.longitude})`)
  }
  if (csvCafe.city !== existing.city) changes.push(`City: "${existing.city}" → "${csvCafe.city}"`)

  // Optional fields
  if (csvCafe.ambianceScore !== existing.ambianceScore) {
    changes.push(`Ambiance: ${existing.ambianceScore ?? 'none'} → ${csvCafe.ambianceScore ?? 'none'}`)
  }
  if (csvCafe.chargeForAltMilk !== existing.chargeForAltMilk) {
    changes.push(`Alt Milk Charge: ${existing.chargeForAltMilk ?? 'free'} → ${csvCafe.chargeForAltMilk ?? 'free'}`)
  }
  if (csvCafe.quickNote !== existing.quickNote) changes.push(`Quick Note updated`)
  if (csvCafe.review !== existing.review) changes.push(`Review updated`)
  if (csvCafe.source !== existing.source) changes.push(`Source: "${existing.source ?? 'none'}" → "${csvCafe.source ?? 'none'}"`)
  if (csvCafe.instagram !== existing.instagram) changes.push(`Instagram: "${existing.instagram ?? 'none'}" → "${csvCafe.instagram ?? 'none'}"`)

  // Compare drinks
  const drinkChanges = detectDrinkChanges(csvCafe.drinks, existing.drinks || [])
  changes.push(...drinkChanges)

  return changes
}

/**
 * Detect drink changes (new drinks, updated drinks, removed drinks)
 */
function detectDrinkChanges(csvDrinks: CsvDrink[], existingDrinks: DrinkItem[]): string[] {
  const changes: string[] = []

  // Create lookup by drink name (assuming name is unique per cafe)
  const existingByName = new Map<string, DrinkItem>()
  existingDrinks.forEach(drink => {
    existingByName.set(drink.name, drink)
  })

  const csvDrinkNames = new Set(csvDrinks.map(d => d.name))

  // Find new drinks
  csvDrinks.forEach(csvDrink => {
    const existing = existingByName.get(csvDrink.name)
    if (!existing) {
      changes.push(`➕ New drink: ${csvDrink.name} (${csvDrink.score}/10, $${csvDrink.priceAmount})`)
    } else {
      // Check for drink updates
      const drinkChanges: string[] = []
      if (csvDrink.score !== existing.score) {
        drinkChanges.push(`score ${existing.score} → ${csvDrink.score}`)
      }
      if (csvDrink.priceAmount !== existing.priceAmount) {
        drinkChanges.push(`price $${existing.priceAmount} → $${csvDrink.priceAmount}`)
      }
      if (csvDrink.type !== existing.type) {
        drinkChanges.push(`type ${existing.type} → ${csvDrink.type}`)
      }
      if (csvDrink.isDefault !== existing.isDefault) {
        drinkChanges.push(`default ${existing.isDefault} → ${csvDrink.isDefault}`)
      }

      if (drinkChanges.length > 0) {
        changes.push(`🔄 Updated drink: ${csvDrink.name} (${drinkChanges.join(', ')})`)
      }
    }
  })

  // Find removed drinks
  existingDrinks.forEach(existing => {
    if (!csvDrinkNames.has(existing.name)) {
      changes.push(`➖ Removed drink: ${existing.name}`)
    }
  })

  return changes
}
