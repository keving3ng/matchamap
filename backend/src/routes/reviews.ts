import { IRequest } from 'itty-router';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userReviews, reviewHelpful, cafes, users, userProfiles, reviewPhotos } from '../db';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  validateCreateReview,
  validateUpdateReview,
  validateGetCafeReviewsQuery,
  validateGetUserReviewsQuery,
} from '../validators/review';
import { createHelpfulNotification } from '../utils/notifications';

/**
 * POST /api/cafes/:id/reviews - Create a new review for a cafe
 */
export async function createReview(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const cafeId = parseInt(request.params?.id as string);
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const body = await request.json();
    
    // Validate input using Zod schema
    let validatedData;
    try {
      validatedData = validateCreateReview(body);
    } catch (error: any) {
      // Format Zod validation errors for user-friendly messages
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Validation error: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Validation error: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if cafe exists
    const cafe = await db.select().from(cafes).where(eq(cafes.id, cafeId)).get();
    if (!cafe) {
      return notFoundResponse(request as Request, env);
    }

    // Check if user already reviewed this cafe
    const existingReview = await db
      .select()
      .from(userReviews)
      .where(and(eq(userReviews.userId, request.user.userId), eq(userReviews.cafeId, cafeId)))
      .get();

    if (existingReview) {
      return errorResponse('You have already reviewed this cafe', HTTP_STATUS.CONFLICT, request as Request, env);
    }

    // Create the review
    const newReview = await db
      .insert(userReviews)
      .values({
        userId: request.user.userId,
        cafeId: cafeId,
        overallRating: validatedData.overallRating,
        matchaQualityRating: validatedData.matchaQualityRating || null,
        ambianceRating: validatedData.ambianceRating || null,
        serviceRating: validatedData.serviceRating || null,
        valueRating: validatedData.valueRating || null,
        title: validatedData.title || null,
        content: validatedData.content,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        visitDate: validatedData.visitDate || null,
        isPublic: validatedData.isPublic,
        moderationStatus: 'approved', // Auto-approve all reviews for now
      })
      .returning()
      .get();

    // Link photos to the review if photoIds provided
    if (validatedData.photoIds && validatedData.photoIds.length > 0) {
      console.log(`Linking ${validatedData.photoIds.length} photos to review ${newReview.id}`);

      // Verify photos exist and belong to the user
      for (const photoId of validatedData.photoIds) {
        const photo = await db
          .select()
          .from(reviewPhotos)
          .where(
            and(
              eq(reviewPhotos.id, photoId),
              eq(reviewPhotos.userId, request.user.userId),
              eq(reviewPhotos.cafeId, cafeId)
            )
          )
          .get();

        if (!photo) {
          console.error(`Photo ${photoId} not found or doesn't belong to user ${request.user.userId}`);
          return badRequestResponse(`Photo ${photoId} not found or access denied`, request as Request, env);
        }

        // Link photo to review
        await db
          .update(reviewPhotos)
          .set({ reviewId: newReview.id })
          .where(eq(reviewPhotos.id, photoId));
      }

      console.log(`Successfully linked ${validatedData.photoIds.length} photos to review ${newReview.id}`);
    }

    // Update cafe aggregated rating asynchronously with retry logic
    updateCafeRatingWithRetry(env, cafeId, 'review creation').catch(error => {
      console.error(`Failed to update cafe rating for cafe ${cafeId} after review creation (all retries exhausted):`, error);
      // In production: consider alerting or queueing for manual review
    });

    return jsonResponse({ review: newReview }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Error creating review:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/cafes/:id/reviews - Get reviews for a cafe with pagination and sorting
 */
export async function getCafeReviews(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.id as string);
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const url = new URL(request.url);
    
    // Validate query parameters
    let queryParams;
    try {
      queryParams = validateGetCafeReviewsQuery({
        page: url.searchParams.get('page'),
        limit: url.searchParams.get('limit'),
        offset: url.searchParams.get('offset'),
        sortBy: url.searchParams.get('sortBy'),
        sortOrder: url.searchParams.get('sortOrder'),
        minRating: url.searchParams.get('minRating'),
        maxRating: url.searchParams.get('maxRating'),
      });
    } catch (error: any) {
      // Format Zod validation errors for user-friendly messages
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Invalid query parameters: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Invalid query parameters: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if cafe exists
    const cafe = await db.select().from(cafes).where(eq(cafes.id, cafeId)).get();
    if (!cafe) {
      return notFoundResponse(request as Request, env);
    }

    // Build sorting clause based on sortBy and sortOrder
    let sortColumn;
    switch (queryParams.sortBy) {
      case 'rating':
      case 'overallRating':
        sortColumn = userReviews.overallRating;
        break;
      case 'helpful':
      case 'helpfulCount':
        sortColumn = userReviews.helpfulCount;
        break;
      case 'recent':
      case 'createdAt':
      default:
        sortColumn = userReviews.createdAt;
        break;
    }

    const orderClause = queryParams.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Build where conditions with optional rating filters
    const whereConditions: any[] = [
      eq(userReviews.cafeId, cafeId),
      eq(userReviews.moderationStatus, 'approved'),
      eq(userReviews.isPublic, true)
    ];

    // Add rating range filters if provided
    if (queryParams.minRating !== undefined && queryParams.minRating !== null) {
      whereConditions.push(sql`${userReviews.overallRating} >= ${queryParams.minRating}`);
    }
    if (queryParams.maxRating !== undefined && queryParams.maxRating !== null) {
      whereConditions.push(sql`${userReviews.overallRating} <= ${queryParams.maxRating}`);
    }

    // Get reviews with user information (fetch +1 to check if more exist)
    const reviews = await db
      .select({
        id: userReviews.id,
        overallRating: userReviews.overallRating,
        matchaQualityRating: userReviews.matchaQualityRating,
        ambianceRating: userReviews.ambianceRating,
        serviceRating: userReviews.serviceRating,
        valueRating: userReviews.valueRating,
        title: userReviews.title,
        content: userReviews.content,
        tags: userReviews.tags,
        visitDate: userReviews.visitDate,
        helpfulCount: userReviews.helpfulCount,
        createdAt: userReviews.createdAt,
        updatedAt: userReviews.updatedAt,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(userReviews)
      .innerJoin(users, eq(userReviews.userId, users.id))
      .leftJoin(userProfiles, eq(userReviews.userId, userProfiles.userId))
      .where(and(...whereConditions))
      .orderBy(orderClause)
      .limit(queryParams.limit + 1)
      .offset(queryParams.offset);

    // Check if there are more results and slice to actual limit
    const hasMore = reviews.length > queryParams.limit;
    const paginatedReviews = hasMore ? reviews.slice(0, queryParams.limit) : reviews;

    // Get total count of reviews matching the filters
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userReviews)
      .innerJoin(users, eq(userReviews.userId, users.id))
      .leftJoin(userProfiles, eq(userReviews.userId, userProfiles.userId))
      .where(and(...whereConditions))
      .get();

    const total = countResult?.count || 0;

    // Fetch photos for all reviews
    const reviewIds = paginatedReviews.map(r => r.id);
    let photosMap: Map<number, any[]> = new Map();

    if (reviewIds.length > 0) {
      const photos = await db
        .select({
          id: reviewPhotos.id,
          reviewId: reviewPhotos.reviewId,
          imageUrl: reviewPhotos.imageUrl,
          thumbnailUrl: reviewPhotos.thumbnailUrl,
          caption: reviewPhotos.caption,
          width: reviewPhotos.width,
          height: reviewPhotos.height,
        })
        .from(reviewPhotos)
        .where(
          and(
            sql`${reviewPhotos.reviewId} IN (${sql.join(reviewIds.map(id => sql`${id}`), sql`, `)})`,
            eq(reviewPhotos.moderationStatus, 'approved')
          )
        )
        .all();

      // Group photos by reviewId
      photos.forEach(photo => {
        if (photo.reviewId) {
          if (!photosMap.has(photo.reviewId)) {
            photosMap.set(photo.reviewId, []);
          }
          photosMap.get(photo.reviewId)!.push(photo);
        }
      });
    }

    // Parse tags from JSON strings and attach photos
    const processedReviews = paginatedReviews.map(review => ({
      ...review,
      tags: review.tags ? JSON.parse(review.tags) : null,
      photos: photosMap.get(review.id) || [],
      user: review.username ? {
        username: review.username,
        displayName: review.displayName || undefined,
        avatarUrl: review.avatarUrl || undefined,
      } : undefined,
    }));

    return jsonResponse({
      reviews: processedReviews,
      total,
      hasMore,
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error getting cafe reviews:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/reviews/:id - Update user's own review
 */
export async function updateReview(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const body = await request.json();
    
    // Validate input using Zod schema
    let validatedData;
    try {
      validatedData = validateUpdateReview(body);
    } catch (error: any) {
      // Format Zod validation errors for user-friendly messages
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Validation error: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Validation error: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if review exists and user owns it
    const existingReview = await db
      .select()
      .from(userReviews)
      .where(eq(userReviews.id, reviewId))
      .get();

    if (!existingReview) {
      return notFoundResponse(request as Request, env);
    }

    if (existingReview.userId !== request.user.userId) {
      return errorResponse('Forbidden: You can only edit your own reviews', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (validatedData.overallRating !== undefined) updateData.overallRating = validatedData.overallRating;
    if (validatedData.matchaQualityRating !== undefined) updateData.matchaQualityRating = validatedData.matchaQualityRating;
    if (validatedData.ambianceRating !== undefined) updateData.ambianceRating = validatedData.ambianceRating;
    if (validatedData.serviceRating !== undefined) updateData.serviceRating = validatedData.serviceRating;
    if (validatedData.valueRating !== undefined) updateData.valueRating = validatedData.valueRating;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags ? JSON.stringify(validatedData.tags) : null;
    if (validatedData.visitDate !== undefined) updateData.visitDate = validatedData.visitDate;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;

    // Update the review
    await db
      .update(userReviews)
      .set(updateData)
      .where(eq(userReviews.id, reviewId));

    // Update cafe aggregated rating if overall rating changed
    if (validatedData.overallRating !== undefined) {
      updateCafeRatingWithRetry(env, existingReview.cafeId, 'review update').catch(error => {
        console.error(`Failed to update cafe rating for cafe ${existingReview.cafeId} after review update (all retries exhausted):`, error);
        // In production: consider alerting or queueing for manual review
      });
    }

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error updating review:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/reviews/:id - Delete user's own review
 */
export async function deleteReview(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if review exists and user owns it
    const existingReview = await db
      .select()
      .from(userReviews)
      .where(eq(userReviews.id, reviewId))
      .get();

    if (!existingReview) {
      return notFoundResponse(request as Request, env);
    }

    if (existingReview.userId !== request.user.userId) {
      return errorResponse('Forbidden: You can only delete your own reviews', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Delete the review (this will cascade delete helpful votes)
    await db.delete(userReviews).where(eq(userReviews.id, reviewId));

    // Update cafe aggregated rating
    updateCafeRatingWithRetry(env, existingReview.cafeId, 'review deletion').catch(error => {
      console.error(`Failed to update cafe rating for cafe ${existingReview.cafeId} after review deletion (all retries exhausted):`, error);
      // In production: consider alerting or queueing for manual review
    });

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error deleting review:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/reviews/:id/helpful - Mark a review as helpful
 */
export async function markHelpful(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if review exists
    const review = await db.select().from(userReviews).where(eq(userReviews.id, reviewId)).get();
    if (!review) {
      return notFoundResponse(request as Request, env);
    }

    // Check if vote already exists before inserting
    const existingVote = await db
      .select()
      .from(reviewHelpful)
      .where(and(eq(reviewHelpful.reviewId, reviewId), eq(reviewHelpful.userId, request.user.userId)))
      .get();

    // Only proceed if vote doesn't exist
    if (!existingVote) {
      try {
        // Insert vote and increment count atomically in a transaction-like pattern
        await db.insert(reviewHelpful).values({
          reviewId: reviewId,
          userId: request.user.userId,
        });

        // Increment helpful count only after successful insert
        await db
          .update(userReviews)
          .set({ helpfulCount: sql`${userReviews.helpfulCount} + 1` })
          .where(eq(userReviews.id, reviewId));

        // Create notification for review owner
        await createHelpfulNotification(
          env,
          review.userId,
          request.user.userId,
          request.user.username,
          reviewId
        );
      } catch (error: any) {
        // Handle race condition - if unique constraint fails, another user voted
        if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('SQLITE_CONSTRAINT')) {
          // Vote already exists due to race condition - this is acceptable
          console.log(`Duplicate helpful vote prevented for review ${reviewId} by user ${request.user.userId}`);
        } else {
          throw error; // Re-throw unexpected errors
        }
      }
    }

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error marking review helpful:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/reviews/:id/helpful - Remove helpful vote from a review
 */
export async function removeHelpful(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Remove helpful vote and track if anything was deleted
    const result = await db
      .delete(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, request.user.userId)
        )
      )
      .returning();

    // Atomically decrement helpful count only if vote was removed
    if (result && result.length > 0) {
      await db
        .update(userReviews)
        .set({ helpfulCount: sql`MAX(0, ${userReviews.helpfulCount} - 1)` })
        .where(eq(userReviews.id, reviewId));
    }

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error removing helpful vote:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/:username/reviews - Get reviews by a specific user
 */
export async function getUserReviews(request: IRequest, env: Env): Promise<Response> {
  try {
    const username = request.params?.username as string;
    if (!username) {
      return badRequestResponse('Username is required', request as Request, env);
    }

    const url = new URL(request.url);
    
    // Validate query parameters
    let queryParams;
    try {
      queryParams = validateGetUserReviewsQuery({
        limit: url.searchParams.get('limit'),
        offset: url.searchParams.get('offset'),
        sortBy: url.searchParams.get('sortBy'),
      });
    } catch (error: any) {
      // Format Zod validation errors for user-friendly messages
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Invalid query parameters: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Invalid query parameters: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.username, username)).get();
    if (!user) {
      return notFoundResponse(request as Request, env);
    }

    // Build sorting clause
    let orderClause;
    switch (queryParams.sortBy) {
      case 'rating':
        orderClause = desc(userReviews.overallRating);
        break;
      case 'recent':
      default:
        orderClause = desc(userReviews.createdAt);
        break;
    }

    // Get user's reviews with cafe information (fetch +1 to check if more exist)
    const reviews = await db
      .select({
        id: userReviews.id,
        overallRating: userReviews.overallRating,
        matchaQualityRating: userReviews.matchaQualityRating,
        ambianceRating: userReviews.ambianceRating,
        serviceRating: userReviews.serviceRating,
        valueRating: userReviews.valueRating,
        title: userReviews.title,
        content: userReviews.content,
        tags: userReviews.tags,
        visitDate: userReviews.visitDate,
        helpfulCount: userReviews.helpfulCount,
        createdAt: userReviews.createdAt,
        updatedAt: userReviews.updatedAt,
        cafeId: cafes.id,
        cafeName: cafes.name,
        cafeSlug: cafes.slug,
        cafeCity: cafes.city,
      })
      .from(userReviews)
      .innerJoin(cafes, eq(userReviews.cafeId, cafes.id))
      .where(
        and(
          eq(userReviews.userId, user.id),
          eq(userReviews.moderationStatus, 'approved'),
          eq(userReviews.isPublic, true),
          isNull(cafes.deletedAt)
        )
      )
      .orderBy(orderClause)
      .limit(queryParams.limit + 1)
      .offset(queryParams.offset);

    // Check if there are more results and slice to actual limit
    const hasMore = reviews.length > queryParams.limit;
    const paginatedReviews = hasMore ? reviews.slice(0, queryParams.limit) : reviews;

    // Fetch photos for all reviews
    const reviewIds = paginatedReviews.map(r => r.id);
    let photosMap: Map<number, any[]> = new Map();

    if (reviewIds.length > 0) {
      const photos = await db
        .select({
          id: reviewPhotos.id,
          reviewId: reviewPhotos.reviewId,
          imageUrl: reviewPhotos.imageUrl,
          thumbnailUrl: reviewPhotos.thumbnailUrl,
          caption: reviewPhotos.caption,
          width: reviewPhotos.width,
          height: reviewPhotos.height,
        })
        .from(reviewPhotos)
        .where(
          and(
            sql`${reviewPhotos.reviewId} IN (${sql.join(reviewIds.map(id => sql`${id}`), sql`, `)})`,
            eq(reviewPhotos.moderationStatus, 'approved')
          )
        )
        .all();

      // Group photos by reviewId
      photos.forEach(photo => {
        if (photo.reviewId) {
          if (!photosMap.has(photo.reviewId)) {
            photosMap.set(photo.reviewId, []);
          }
          photosMap.get(photo.reviewId)!.push(photo);
        }
      });
    }

    // Parse tags from JSON strings and attach photos
    const processedReviews = paginatedReviews.map(review => ({
      ...review,
      tags: review.tags ? JSON.parse(review.tags) : null,
      photos: photosMap.get(review.id) || [],
    }));

    return jsonResponse({
      reviews: processedReviews,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore,
      },
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * Helper function to update cafe aggregated rating
 * Called asynchronously after review changes
 */
async function updateCafeRating(env: Env, cafeId: number): Promise<void> {
  const db = getDb(env.DB);

  // Calculate average rating and count
  const result = await db
    .select({
      avg: sql<number>`AVG(${userReviews.overallRating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(userReviews)
    .where(
      and(
        eq(userReviews.cafeId, cafeId),
        eq(userReviews.moderationStatus, 'approved')
      )
    )
    .get();

  // Update cafe with aggregated ratings
  await db
    .update(cafes)
    .set({
      userRatingAvg: result?.avg || null,
      userRatingCount: result?.count || 0,
    })
    .where(eq(cafes.id, cafeId));
}

/**
 * Helper function to update cafe rating with retry logic
 * Implements exponential backoff for reliability
 */
async function updateCafeRatingWithRetry(
  env: Env, 
  cafeId: number, 
  operation: string, 
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await updateCafeRating(env, cafeId);
      return; // Success - exit retry loop
    } catch (error) {
      console.error(`Failed to update cafe rating for cafe ${cafeId} during ${operation} (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error; // Re-throw on final attempt
      }
      
      // Exponential backoff: wait 2^attempt seconds
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Content moderation helper - determines if review should be auto-approved
 * Implements basic content filtering for security
 */
function shouldAutoApprove(content: string, title?: string | null): boolean {
  // Combine all text to check
  const textToCheck = `${title || ''} ${content}`.toLowerCase();
  
  // Basic spam/inappropriate content detection
  const suspiciousPatterns = [
    // Spam indicators
    /\b(free\s*(money|cash|gift)|win\s*(money|cash|prize)|click\s*here)\b/,
    /\b(viagra|cialis|casino|gambling|poker)\b/,
    /\bhttps?:\/\/[^\s]+/gi, // URLs (might be spam)
    
    // Inappropriate content
    /\b(fuck|shit|damn|hell|asshole|bitch)\b/,
    /\b(hate|racist|sexist|homophobic)\b/,
    
    // Fake review indicators
    /\b(best\s*(cafe|restaurant|place)\s*(ever|in\s*(the\s*)?world))\b/,
    /\b(amazing|incredible|perfect|flawless)\s*(experience|service|everything)\b/,
    /\b(worst\s*(cafe|restaurant|place)\s*(ever|in\s*(the\s*)?world))\b/,
  ];

  // Check for suspicious patterns
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(textToCheck));
  
  // Check for excessive caps (possible spam)
  const capsPercentage = (textToCheck.match(/[A-Z]/g) || []).length / textToCheck.length;
  const excessiveCaps = capsPercentage > 0.5 && textToCheck.length > 20;
  
  // Check for repetitive content
  const words = textToCheck.split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitive = words.length > 10 && uniqueWords.size / words.length < 0.5;
  
  // Auto-approve if content passes all checks
  return !hasSuspiciousContent && !excessiveCaps && !repetitive;
}
/**
 * Admin: Get all reviews for a specific cafe (including hidden ones)
 * GET /api/admin/cafes/:id/reviews
 */
export async function getAdminCafeReviews(request: IRequest, env: Env): Promise<Response> {
  try {
    const { id: cafeId } = request.params;

    if (!cafeId) {
      return badRequestResponse('Cafe ID is required', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get all reviews (including hidden) for the cafe
    const reviews = await db
      .select({
        id: userReviews.id,
        overallRating: userReviews.overallRating,
        matchaQualityRating: userReviews.matchaQualityRating,
        ambianceRating: userReviews.ambianceRating,
        serviceRating: userReviews.serviceRating,
        valueRating: userReviews.valueRating,
        title: userReviews.title,
        content: userReviews.content,
        tags: userReviews.tags,
        visitDate: userReviews.visitDate,
        helpfulCount: userReviews.helpfulCount,
        moderationStatus: userReviews.moderationStatus,
        createdAt: userReviews.createdAt,
        updatedAt: userReviews.updatedAt,
        userId: userReviews.userId,
        username: users.username,
      })
      .from(userReviews)
      .innerJoin(users, eq(userReviews.userId, users.id))
      .where(eq(userReviews.cafeId, parseInt(cafeId)))
      .orderBy(desc(userReviews.createdAt))
      .limit(100)
      .all();

    // Parse tags from JSON strings
    const processedReviews = reviews.map(review => ({
      ...review,
      tags: review.tags ? JSON.parse(review.tags) : null,
    }));

    return jsonResponse({ reviews: processedReviews }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Get admin cafe reviews error:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * Admin: Get review count for a cafe
 * GET /api/admin/cafes/:id/reviews/count
 */
export async function getAdminCafeReviewsCount(request: IRequest, env: Env): Promise<Response> {
  try {
    const { id: cafeId } = request.params;

    if (!cafeId) {
      return badRequestResponse('Cafe ID is required', request as Request, env);
    }

    const db = getDb(env.DB);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userReviews)
      .where(eq(userReviews.cafeId, parseInt(cafeId)))
      .get();

    return jsonResponse({ count: countResult?.count || 0 }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Get admin cafe reviews count error:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * Admin: Moderate a review (approve, reject, flag)
 * PUT /api/admin/reviews/:id/moderate
 */
export async function moderateReview(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const body = await request.json() as { status?: string; notes?: string };

    if (!body.status || !['approved', 'rejected', 'flagged'].includes(body.status)) {
      return badRequestResponse('Valid status is required (approved, rejected, or flagged)', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the review to check if it exists
    const review = await db.select().from(userReviews).where(eq(userReviews.id, reviewId)).get();
    if (!review) {
      return notFoundResponse(request as Request, env);
    }

    // Update review moderation status
    const updateData: any = {
      moderationStatus: body.status as 'approved' | 'rejected' | 'pending' | 'flagged',
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    await db
      .update(userReviews)
      .set(updateData)
      .where(eq(userReviews.id, reviewId));

    // Update cafe aggregated rating if status changed affects public visibility
    if (body.status === 'approved' || review.moderationStatus === 'approved') {
      updateCafeRatingWithRetry(env, review.cafeId, 'review moderation').catch(error => {
        console.error(`Failed to update cafe rating for cafe ${review.cafeId} after review moderation (all retries exhausted):`, error);
      });
    }

    return jsonResponse({
      success: true,
      message: `Review ${body.status} successfully`
    }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Error moderating review:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
