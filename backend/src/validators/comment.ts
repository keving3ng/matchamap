import { z } from 'zod'

/**
 * Validation schemas for review comment API endpoints
 */

// Create comment schema
export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
  parentCommentId: z.number().int().positive().optional(), // For replies
})

// Update comment schema
export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
})

// Get comments query parameters
export const getCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['recent', 'likes', 'createdAt', 'likeCount']).default('recent'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'), // Comments typically show oldest first
})

/**
 * Helper functions to validate comment data
 */
export function validateCreateComment(data: unknown) {
  return createCommentSchema.parse(data)
}

export function validateUpdateComment(data: unknown) {
  return updateCommentSchema.parse(data)
}

export function validateGetCommentsQuery(data: unknown) {
  return getCommentsQuerySchema.parse(data)
}