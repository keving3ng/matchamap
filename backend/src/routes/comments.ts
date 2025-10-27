import { IRequest } from 'itty-router';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';
import { Env } from '../types';
import { 
  getDb, 
  reviewComments, 
  reviewCommentLikes, 
  userReviews, 
  users, 
  userProfiles 
} from '../db';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  validateCreateComment,
  validateUpdateComment,
  validateGetCommentsQuery,
} from '../validators/comment';

/**
 * GET /api/reviews/:id/comments - Get comments for a review
 */
export async function getReviewComments(request: IRequest, env: Env): Promise<Response> {
  try {
    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const url = new URL(request.url);
    
    // Validate query parameters
    let queryParams;
    try {
      queryParams = validateGetCommentsQuery({
        limit: url.searchParams.get('limit'),
        offset: url.searchParams.get('offset'),
        sortBy: url.searchParams.get('sortBy'),
        sortOrder: url.searchParams.get('sortOrder'),
      });
    } catch (error: any) {
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Invalid query parameters: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Invalid query parameters: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if review exists
    const review = await db.select().from(userReviews).where(eq(userReviews.id, reviewId)).get();
    if (!review) {
      return notFoundResponse(request as Request, env);
    }

    // Build sorting clause
    let sortColumn;
    switch (queryParams.sortBy) {
      case 'likes':
      case 'likeCount':
        sortColumn = reviewComments.likeCount;
        break;
      case 'recent':
      case 'createdAt':
      default:
        sortColumn = reviewComments.createdAt;
        break;
    }

    const orderClause = queryParams.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get comments with user information (only approved comments)
    const comments = await db
      .select({
        id: reviewComments.id,
        content: reviewComments.content,
        parentCommentId: reviewComments.parentCommentId,
        likeCount: reviewComments.likeCount,
        createdAt: reviewComments.createdAt,
        updatedAt: reviewComments.updatedAt,
        userId: reviewComments.userId,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(reviewComments)
      .innerJoin(users, eq(reviewComments.userId, users.id))
      .leftJoin(userProfiles, eq(reviewComments.userId, userProfiles.userId))
      .where(
        and(
          eq(reviewComments.reviewId, reviewId),
          eq(reviewComments.moderationStatus, 'approved')
        )
      )
      .orderBy(orderClause)
      .limit(queryParams.limit + 1)
      .offset(queryParams.offset);

    // Check if there are more results and slice to actual limit
    const hasMore = comments.length > queryParams.limit;
    const paginatedComments = hasMore ? comments.slice(0, queryParams.limit) : comments;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(reviewComments)
      .where(
        and(
          eq(reviewComments.reviewId, reviewId),
          eq(reviewComments.moderationStatus, 'approved')
        )
      )
      .get();

    const total = countResult?.count || 0;

    // Process comments to add user information
    const processedComments = paginatedComments.map(comment => ({
      id: comment.id,
      content: comment.content,
      parentCommentId: comment.parentCommentId,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.userId,
        username: comment.username,
        displayName: comment.displayName || undefined,
        avatarUrl: comment.avatarUrl || undefined,
      },
    }));

    return jsonResponse({
      comments: processedComments,
      total,
      hasMore,
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error getting review comments:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/reviews/:id/comments - Create a new comment on a review
 */
export async function createComment(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const reviewId = parseInt(request.params?.id as string);
    if (isNaN(reviewId)) {
      return badRequestResponse('Invalid review ID', request as Request, env);
    }

    const body = await request.json();
    
    // Validate input
    let validatedData;
    try {
      validatedData = validateCreateComment(body);
    } catch (error: any) {
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Validation error: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Validation error: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if review exists
    const review = await db.select().from(userReviews).where(eq(userReviews.id, reviewId)).get();
    if (!review) {
      return notFoundResponse(request as Request, env);
    }

    // If this is a reply, validate parent comment exists and is on same review
    if (validatedData.parentCommentId) {
      const parentComment = await db
        .select()
        .from(reviewComments)
        .where(
          and(
            eq(reviewComments.id, validatedData.parentCommentId),
            eq(reviewComments.reviewId, reviewId),
            eq(reviewComments.moderationStatus, 'approved')
          )
        )
        .get();

      if (!parentComment) {
        return badRequestResponse('Parent comment not found or not approved', request as Request, env);
      }

      // Ensure we only allow 1 level of nesting - parent comment cannot have a parent
      if (parentComment.parentCommentId) {
        return badRequestResponse('Cannot reply to a reply. Only one level of nesting is allowed.', request as Request, env);
      }
    }

    // Create the comment
    const newComment = await db
      .insert(reviewComments)
      .values({
        reviewId: reviewId,
        userId: request.user.userId,
        content: validatedData.content,
        parentCommentId: validatedData.parentCommentId || null,
        moderationStatus: 'approved', // Auto-approve for now
      })
      .returning()
      .get();

    // Get the comment with user information
    const commentWithUser = await db
      .select({
        id: reviewComments.id,
        content: reviewComments.content,
        parentCommentId: reviewComments.parentCommentId,
        likeCount: reviewComments.likeCount,
        createdAt: reviewComments.createdAt,
        updatedAt: reviewComments.updatedAt,
        userId: reviewComments.userId,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(reviewComments)
      .innerJoin(users, eq(reviewComments.userId, users.id))
      .leftJoin(userProfiles, eq(reviewComments.userId, userProfiles.userId))
      .where(eq(reviewComments.id, newComment.id))
      .get();

    const processedComment = {
      id: commentWithUser!.id,
      content: commentWithUser!.content,
      parentCommentId: commentWithUser!.parentCommentId,
      likeCount: commentWithUser!.likeCount,
      createdAt: commentWithUser!.createdAt,
      updatedAt: commentWithUser!.updatedAt,
      user: {
        id: commentWithUser!.userId,
        username: commentWithUser!.username,
        displayName: commentWithUser!.displayName || undefined,
        avatarUrl: commentWithUser!.avatarUrl || undefined,
      },
    };

    return jsonResponse({ comment: processedComment }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Error creating comment:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/comments/:id - Update a comment (user's own)
 */
export async function updateComment(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const commentId = parseInt(request.params?.id as string);
    if (isNaN(commentId)) {
      return badRequestResponse('Invalid comment ID', request as Request, env);
    }

    const body = await request.json();
    
    // Validate input
    let validatedData;
    try {
      validatedData = validateUpdateComment(body);
    } catch (error: any) {
      if (error?.issues) {
        const errorMessages = error.issues.map((issue: any) =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return badRequestResponse(`Validation error: ${errorMessages}`, request as Request, env);
      }
      return badRequestResponse(`Validation error: ${error}`, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if comment exists and user owns it
    const existingComment = await db
      .select()
      .from(reviewComments)
      .where(eq(reviewComments.id, commentId))
      .get();

    if (!existingComment) {
      return notFoundResponse(request as Request, env);
    }

    if (existingComment.userId !== request.user.userId) {
      return errorResponse('Forbidden: You can only edit your own comments', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Update the comment
    await db
      .update(reviewComments)
      .set({
        content: validatedData.content,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(reviewComments.id, commentId));

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error updating comment:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/comments/:id - Delete a comment (user's own)
 */
export async function deleteComment(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const commentId = parseInt(request.params?.id as string);
    if (isNaN(commentId)) {
      return badRequestResponse('Invalid comment ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if comment exists and user owns it
    const existingComment = await db
      .select()
      .from(reviewComments)
      .where(eq(reviewComments.id, commentId))
      .get();

    if (!existingComment) {
      return notFoundResponse(request as Request, env);
    }

    if (existingComment.userId !== request.user.userId) {
      return errorResponse('Forbidden: You can only delete your own comments', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Delete the comment (this will cascade delete likes and replies)
    await db.delete(reviewComments).where(eq(reviewComments.id, commentId));

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error deleting comment:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/comments/:id/like - Like a comment
 */
export async function likeComment(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const commentId = parseInt(request.params?.id as string);
    if (isNaN(commentId)) {
      return badRequestResponse('Invalid comment ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if comment exists
    const comment = await db.select().from(reviewComments).where(eq(reviewComments.id, commentId)).get();
    if (!comment) {
      return notFoundResponse(request as Request, env);
    }

    // Check if like already exists
    const existingLike = await db
      .select()
      .from(reviewCommentLikes)
      .where(
        and(
          eq(reviewCommentLikes.commentId, commentId),
          eq(reviewCommentLikes.userId, request.user.userId)
        )
      )
      .get();

    // Only proceed if like doesn't exist
    if (!existingLike) {
      try {
        // Insert like and increment count
        await db.insert(reviewCommentLikes).values({
          commentId: commentId,
          userId: request.user.userId,
        });

        // Increment like count
        await db
          .update(reviewComments)
          .set({ likeCount: sql`${reviewComments.likeCount} + 1` })
          .where(eq(reviewComments.id, commentId));
      } catch (error: any) {
        // Handle race condition - if unique constraint fails, another user voted
        if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('SQLITE_CONSTRAINT')) {
          console.log(`Duplicate like prevented for comment ${commentId} by user ${request.user.userId}`);
        } else {
          throw error;
        }
      }
    }

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error liking comment:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/comments/:id/like - Unlike a comment
 */
export async function unlikeComment(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const commentId = parseInt(request.params?.id as string);
    if (isNaN(commentId)) {
      return badRequestResponse('Invalid comment ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Remove like and track if anything was deleted
    const result = await db
      .delete(reviewCommentLikes)
      .where(
        and(
          eq(reviewCommentLikes.commentId, commentId),
          eq(reviewCommentLikes.userId, request.user.userId)
        )
      )
      .returning();

    // Decrement like count only if like was removed
    if (result && result.length > 0) {
      await db
        .update(reviewComments)
        .set({ likeCount: sql`MAX(0, ${reviewComments.likeCount} - 1)` })
        .where(eq(reviewComments.id, commentId));
    }

    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error unliking comment:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * Admin: Moderate a comment (approve, reject, flag)
 * PUT /api/admin/comments/:id/moderate
 */
export async function moderateComment(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const commentId = parseInt(request.params?.id as string);
    if (isNaN(commentId)) {
      return badRequestResponse('Invalid comment ID', request as Request, env);
    }

    const body = await request.json() as { status?: string; notes?: string };

    if (!body.status || !['approved', 'rejected', 'flagged'].includes(body.status)) {
      return badRequestResponse('Valid status is required (approved, rejected, or flagged)', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the comment to check if it exists
    const comment = await db.select().from(reviewComments).where(eq(reviewComments.id, commentId)).get();
    if (!comment) {
      return notFoundResponse(request as Request, env);
    }

    // Update comment moderation status
    await db
      .update(reviewComments)
      .set({
        moderationStatus: body.status as 'approved' | 'rejected' | 'pending' | 'flagged',
        moderatedAt: sql`CURRENT_TIMESTAMP`,
        moderatedBy: request.user.userId,
        moderationNotes: body.notes || null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(reviewComments.id, commentId));

    return jsonResponse({
      success: true,
      message: `Comment ${body.status} successfully`
    }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Error moderating comment:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}