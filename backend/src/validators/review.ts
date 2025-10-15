import { z } from 'zod'

/**
 * Validation schemas for user review API endpoints
 */

// Create review schema
export const createReviewSchema = z.object({
  overallRating: z.number().min(0, 'Overall rating must be at least 0').max(10, 'Overall rating must be at most 10'),
  matchaQualityRating: z.number().min(0).max(10).optional(),
  ambianceRating: z.number().min(0).max(10).optional(),
  serviceRating: z.number().min(0).max(10).optional(),
  valueRating: z.number().min(0).max(10).optional(),
  
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  content: z.string().min(50, 'Content must be at least 50 characters').max(2000, 'Content must be less than 2000 characters'),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).max(10, 'Maximum 10 tags allowed').optional(),
  
  visitDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be in YYYY-MM-DD format')
    .refine((date) => {
      const visitDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return visitDate <= today;
    }, 'Visit date cannot be in the future')
    .optional(),
  isPublic: z.boolean().default(true),
})

// Update review schema (all fields optional except content validation)
export const updateReviewSchema = z.object({
  overallRating: z.number().min(0).max(10).optional(),
  matchaQualityRating: z.number().min(0).max(10).optional().nullable(),
  ambianceRating: z.number().min(0).max(10).optional().nullable(),
  serviceRating: z.number().min(0).max(10).optional().nullable(),
  valueRating: z.number().min(0).max(10).optional().nullable(),
  
  title: z.string().max(100).optional().nullable(),
  content: z.string().min(50).max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional().nullable(),
  
  visitDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be in YYYY-MM-DD format')
    .refine((date) => {
      const visitDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return visitDate <= today;
    }, 'Visit date cannot be in the future')
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
}).refine(data => {
  // If content is provided, ensure it meets minimum length
  if (data.content !== undefined && data.content.length < 50) {
    return false
  }
  return true
}, {
  message: 'Content must be at least 50 characters when provided',
  path: ['content']
})

// Get cafe reviews query parameters
export const getCafeReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['recent', 'rating', 'helpful']).default('recent'),
})

// Get user reviews query parameters  
export const getUserReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['recent', 'rating']).default('recent'),
})

/**
 * Helper function to validate review data
 */
export function validateCreateReview(data: unknown) {
  return createReviewSchema.parse(data)
}

export function validateUpdateReview(data: unknown) {
  return updateReviewSchema.parse(data)
}

export function validateGetCafeReviewsQuery(data: unknown) {
  return getCafeReviewsQuerySchema.parse(data)
}

export function validateGetUserReviewsQuery(data: unknown) {
  return getUserReviewsQuerySchema.parse(data)
}