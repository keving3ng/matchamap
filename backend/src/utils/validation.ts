import { z } from 'zod'

// Constants for magic strings
export const DEFAULT_DRINK_NAME = 'Iced Matcha Latte'
export const DEFAULT_CITY = 'toronto'

/**
 * Validation schema for drink data
 */
export const drinkSchema = z.object({
  name: z.string().nullable().optional(),
  score: z.number().min(0).max(10),
  priceAmount: z.number().nullable().optional(),
  priceCurrency: z.string().nullable().optional(),
  gramsUsed: z.number().nullable().optional(),
  isDefault: z.boolean(),
  notes: z.string().nullable().optional(),
})

/**
 * Validation schema for cafe data
 */
export const cafeSchema = z.object({
  name: z.string().min(1, 'Cafe name is required'),
  slug: z.string().min(1),
  link: z.string().url('Invalid Google Maps URL'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().min(1, 'City is required'),
  ambianceScore: z.number().min(0).max(10).nullable().optional(),
  chargeForAltMilk: z.number().min(0).nullable().optional(),
  quickNote: z.string().min(1, 'Quick note is required'),
  review: z.string().optional(),
  source: z.string().optional(),
  hours: z.string().optional(),
  instagram: z.string().optional(),
  instagramPostLink: z.string().optional(),
  tiktokPostLink: z.string().optional(),
  images: z.string().optional(),
  drinks: z.array(drinkSchema).min(1, 'At least one drink is required'),
})

/**
 * Validation schema for bulk import request
 */
export const bulkImportSchema = z.object({
  cafes: z.array(cafeSchema).min(1, 'At least one cafe is required'),
})

/**
 * Type exports
 */
export type ValidatedDrink = z.infer<typeof drinkSchema>
export type ValidatedCafe = z.infer<typeof cafeSchema>
export type BulkImportRequest = z.infer<typeof bulkImportSchema>
