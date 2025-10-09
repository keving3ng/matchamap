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

// ===== User Profile Validation Functions =====

/**
 * Validate username format
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Cannot start with underscore
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' }
  }

  const trimmed = username.trim()

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }

  if (trimmed.startsWith('_')) {
    return { valid: false, error: 'Username cannot start with an underscore' }
  }

  return { valid: true }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmed = email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

/**
 * Validate URL format
 * Only allows http and https protocols
 */
export function validateUrl(url: string | null): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: true } // URL is optional
  }

  const trimmed = url.trim()

  if (!trimmed) {
    return { valid: true } // Empty is OK
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use http or https protocol' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Validate password strength
 * - At least 8 characters
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }

  return { valid: true }
}

/**
 * Validate display name
 * - 1-50 characters
 */
export function validateDisplayName(displayName: string | null): { valid: boolean; error?: string } {
  if (!displayName) {
    return { valid: true } // Optional
  }

  if (typeof displayName !== 'string') {
    return { valid: false, error: 'Display name must be a string' }
  }

  const trimmed = displayName.trim()

  if (!trimmed) {
    return { valid: true } // Empty is OK
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Display name must be 50 characters or less' }
  }

  return { valid: true }
}

/**
 * Validate bio
 * - Maximum 500 characters
 */
export function validateBio(bio: string | null): { valid: boolean; error?: string } {
  if (!bio) {
    return { valid: true } // Optional
  }

  if (typeof bio !== 'string') {
    return { valid: false, error: 'Bio must be a string' }
  }

  if (bio.length > 500) {
    return { valid: false, error: 'Bio must be 500 characters or less' }
  }

  return { valid: true }
}

/**
 * Validate location
 * - Maximum 100 characters
 */
export function validateLocation(location: string | null): { valid: boolean; error?: string } {
  if (!location) {
    return { valid: true } // Optional
  }

  if (typeof location !== 'string') {
    return { valid: false, error: 'Location must be a string' }
  }

  const trimmed = location.trim()

  if (trimmed.length > 100) {
    return { valid: false, error: 'Location must be 100 characters or less' }
  }

  return { valid: true }
}

/**
 * Validate social media username
 * - 1-30 characters
 * - Alphanumeric, dots, and underscores
 */
export function validateSocialUsername(
  username: string | null,
  platform: string
): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: true } // Optional
  }

  if (typeof username !== 'string') {
    return { valid: false, error: `${platform} username must be a string` }
  }

  const trimmed = username.trim()

  if (!trimmed) {
    return { valid: true } // Empty is OK
  }

  if (trimmed.length > 30) {
    return { valid: false, error: `${platform} username must be 30 characters or less` }
  }

  // Allow alphanumeric, dots, and underscores (common for social media)
  if (!/^[a-zA-Z0-9._]+$/.test(trimmed)) {
    return {
      valid: false,
      error: `${platform} username can only contain letters, numbers, dots, and underscores`,
    }
  }

  return { valid: true }
}
