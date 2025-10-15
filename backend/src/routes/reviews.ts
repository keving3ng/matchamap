import { IRequest } from 'itty-router';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userReviews, reviewHelpful, cafes, users, userProfiles } from '../db';
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
        moderationStatus: 'approved', // Auto-approve for now
      })
      .returning()
      .get();

    // Update cafe aggregated rating asynchronously with error logging
    updateCafeRating(env, cafeId).catch(error => {
      console.error(`Failed to update cafe rating for cafe ${cafeId} after review creation:`, error);
      // TODO: Consider queueing for retry or alerting on repeated failures
    });

    return jsonResponse({ review: newReview }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Error creating review:', error);
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

    // Check if cafe exists
    const cafe = await db.select().from(cafes).where(eq(cafes.id, cafeId)).get();
    if (!cafe) {
      return notFoundResponse(request as Request, env);
    }

    // Build sorting clause
    let orderClause;
    switch (queryParams.sortBy) {
      case 'rating':
        orderClause = desc(userReviews.overallRating);
        break;
      case 'helpful':
        orderClause = desc(userReviews.helpfulCount);
        break;
      case 'recent':
      default:
        orderClause = desc(userReviews.createdAt);
        break;
    }

    // Get reviews with user information
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
      .where(
        and(
          eq(userReviews.cafeId, cafeId),
          eq(userReviews.moderationStatus, 'approved'),
          eq(userReviews.isPublic, true)
        )
      )
      .orderBy(orderClause)
      .limit(queryParams.limit)
      .offset(queryParams.offset);

    // Parse tags from JSON strings
    const processedReviews = reviews.map(review => ({
      ...review,
      tags: review.tags ? JSON.parse(review.tags) : null,
    }));

    return jsonResponse({
      reviews: processedReviews,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: reviews.length === queryParams.limit,
      },
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
      updateCafeRating(env, existingReview.cafeId).catch(error => {
        console.error(`Failed to update cafe rating for cafe ${existingReview.cafeId} after review update:`, error);
        // TODO: Consider queueing for retry or alerting on repeated failures
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
    updateCafeRating(env, existingReview.cafeId).catch(error => {
      console.error(`Failed to update cafe rating for cafe ${existingReview.cafeId} after review deletion:`, error);
      // TODO: Consider queueing for retry or alerting on repeated failures
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

    // Insert helpful vote (ignore if already exists due to unique constraint)
    let voteAdded = false;
    try {
      await db.insert(reviewHelpful).values({
        reviewId: reviewId,
        userId: request.user.userId,
      });
      voteAdded = true;
    } catch (error: any) {
      // Ignore duplicate key errors (user already marked as helpful)
      if (!error.message?.includes('UNIQUE constraint failed')) {
        throw error;
      }
    }

    // Atomically increment helpful count only if vote was added
    if (voteAdded) {
      await db
        .update(userReviews)
        .set({ helpfulCount: sql`${userReviews.helpfulCount} + 1` })
        .where(eq(userReviews.id, reviewId));
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

    // Get user's reviews with cafe information
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
      .limit(queryParams.limit)
      .offset(queryParams.offset);

    // Parse tags from JSON strings
    const processedReviews = reviews.map(review => ({
      ...review,
      tags: review.tags ? JSON.parse(review.tags) : null,
    }));

    return jsonResponse({
      reviews: processedReviews,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: reviews.length === queryParams.limit,
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
  try {
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
  } catch (error) {
    console.error('Error updating cafe rating:', error);
    // Don't throw - this is async background operation
  }
}