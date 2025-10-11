import { z } from 'zod';
import { AUTH_CONSTANTS } from '../constants';

/**
 * Validation schemas using Zod for API input validation
 */

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must be less than 254 characters');

// Password validation - enhanced security requirements
export const passwordSchema = z
  .string()
  .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/, 'Password must contain at least one special character')
  .refine((password) => {
    // Check for weak patterns
    const weakPatterns = [
      /(.)\1{2,}/, // Three or more consecutive identical characters
      /123456|abcdef|qwerty|password/i, // Common weak sequences
    ];
    return !weakPatterns.some(pattern => pattern.test(password));
  }, 'Password contains common weak patterns. Please choose a stronger password.');

// Username validation
export const usernameSchema = z
  .string()
  .min(AUTH_CONSTANTS.USERNAME_MIN_LENGTH, `Username must be at least ${AUTH_CONSTANTS.USERNAME_MIN_LENGTH} characters`)
  .max(AUTH_CONSTANTS.USERNAME_MAX_LENGTH, `Username must be less than ${AUTH_CONSTANTS.USERNAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Waitlist schema
export const waitlistSchema = z.object({
  email: emailSchema,
  referralSource: z.string().max(255).optional().nullable(),
});

// Cafe schemas
export const citySchema = z.enum(['toronto', 'montreal', 'tokyo', 'kyoto', 'osaka', 'new york', 'mississauga', 'scarborough'], {
  errorMap: () => ({ message: 'Invalid city. Must be one of: toronto, montreal, tokyo, kyoto, osaka, new york, mississauga, or scarborough' }),
});

export const createCafeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  slug: z.string().max(255).optional(),
  link: z.string().url('Invalid URL').max(500, 'URL too long'),
  address: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  city: citySchema.default('toronto'),
  ambianceScore: z.number().min(0).max(100).optional().nullable(),
  chargeForAltMilk: z.boolean().optional().nullable(),
  quickNote: z.string().max(1000, 'Quick note too long').optional(),
  review: z.string().max(5000, 'Review too long').optional().nullable(),
  source: z.string().max(255).optional().nullable(),
  hours: z.string().max(1000).optional().nullable(),
  instagram: z.string().max(255).optional().nullable(),
  instagramPostLink: z.string().url().max(500).optional().nullable(),
  tiktokPostLink: z.string().url().max(500).optional().nullable(),
  images: z.string().max(5000).optional().nullable(),
});

export const updateCafeSchema = createCafeSchema.partial();

// Drink schemas
export const createDrinkSchema = z.object({
  cafeId: z.number().int().positive(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  price: z.number().min(0, 'Price cannot be negative').optional().nullable(),
  isDefault: z.boolean().default(false),
  notes: z.string().max(1000, 'Notes too long').optional().nullable(),
});

export const updateDrinkSchema = createDrinkSchema.partial().omit({ cafeId: true });

// Feed item schemas
export const feedItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  excerpt: z.string().max(500).optional().nullable(),
  cafeId: z.number().int().positive().optional().nullable(),
  image: z.string().url().max(500).optional().nullable(),
  link: z.string().url().max(500).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const updateFeedItemSchema = feedItemSchema.partial();

// Event schemas
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  cafeId: z.number().int().positive().optional().nullable(),
  image: z.string().url().max(500).optional().nullable(),
  link: z.string().url().max(500).optional().nullable(),
});

export const updateEventSchema = eventSchema.partial();

// Enhanced drink schemas (replacing the existing ones above)
export const createDrinkRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional().nullable(),
  score: z.number().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100'),
  priceAmount: z.number().min(0, 'Price cannot be negative').optional().nullable(),
  priceCurrency: z.string().max(10, 'Currency code too long').optional().nullable(),
  gramsUsed: z.number().min(0, 'Grams used cannot be negative').optional().nullable(),
  isDefault: z.boolean().default(false),
  notes: z.string().max(1000, 'Notes too long').optional().nullable(),
});

export const updateDrinkRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional().nullable(),
  score: z.number().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100').optional(),
  priceAmount: z.number().min(0, 'Price cannot be negative').optional().nullable(),
  priceCurrency: z.string().max(10, 'Currency code too long').optional().nullable(),
  gramsUsed: z.number().min(0, 'Grams used cannot be negative').optional().nullable(),
  isDefault: z.boolean().optional(),
  notes: z.string().max(1000, 'Notes too long').optional().nullable(),
});

export const getDrinksQuerySchema = z.object({
  cafeId: z.coerce.number().int().positive().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['name', 'score', 'price', 'createdAt'], {
    errorMap: () => ({ message: 'Sort must be one of: name, score, price, createdAt' }),
  }).default('score'),
  order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Order must be either asc or desc' }),
  }).default('desc'),
});

// Places schemas
export const lookupPlaceRequestSchema = z.object({
  googleMapsUrl: z.string().url('Invalid URL format').min(1, 'Google Maps URL is required'),
});

// Query parameter schemas
export const listCafesQuerySchema = z.object({
  city: citySchema.optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(500),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Helper function to validate data against a schema
 * Returns validated data or throws with formatted error messages
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Helper function to safely validate data
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Format Zod errors into readable message
  const errorMessage = result.error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
  return { success: false, error: errorMessage };
}
