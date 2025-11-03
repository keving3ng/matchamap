import { IRequest } from 'itty-router';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Env } from '../types';
import {
  getDb,
  reviewPhotos,
  userReviews,
  reviewComments,
  users,
  cafes
} from '../db';
import {
  jsonResponse,
  errorResponse,
} from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/admin/moderation/queue - Get all pending moderation items
 * Returns photos, reviews, and comments pending moderation
 */
export async function getModerationQueue(request: IRequest, env: Env): Promise<Response> {
  try {
    const db = getDb(env.DB);

    // Get pending photos
    const pendingPhotos = await db
      .select({
        id: reviewPhotos.id,
        type: sql<string>`'photo'`,
        content: reviewPhotos.caption,
        imageUrl: reviewPhotos.imageUrl,
        thumbnailUrl: reviewPhotos.thumbnailUrl,
        moderationStatus: reviewPhotos.moderationStatus,
        createdAt: reviewPhotos.createdAt,
        userId: reviewPhotos.userId,
        username: users.username,
        cafeId: reviewPhotos.cafeId,
        cafeName: cafes.name,
        fileSize: reviewPhotos.fileSize,
        width: reviewPhotos.width,
        height: reviewPhotos.height,
      })
      .from(reviewPhotos)
      .innerJoin(users, eq(reviewPhotos.userId, users.id))
      .innerJoin(cafes, eq(reviewPhotos.cafeId, cafes.id))
      .where(eq(reviewPhotos.moderationStatus, 'pending'))
      .orderBy(desc(reviewPhotos.createdAt))
      .limit(50)
      .all();

    // Get pending reviews
    const pendingReviews = await db
      .select({
        id: userReviews.id,
        type: sql<string>`'review'`,
        content: userReviews.content,
        title: userReviews.title,
        overallRating: userReviews.overallRating,
        moderationStatus: userReviews.moderationStatus,
        createdAt: userReviews.createdAt,
        userId: userReviews.userId,
        username: users.username,
        cafeId: userReviews.cafeId,
        cafeName: cafes.name,
      })
      .from(userReviews)
      .innerJoin(users, eq(userReviews.userId, users.id))
      .innerJoin(cafes, eq(userReviews.cafeId, cafes.id))
      .where(eq(userReviews.moderationStatus, 'pending'))
      .orderBy(desc(userReviews.createdAt))
      .limit(50)
      .all();

    // Get pending comments
    const pendingComments = await db
      .select({
        id: reviewComments.id,
        type: sql<string>`'comment'`,
        content: reviewComments.content,
        moderationStatus: reviewComments.moderationStatus,
        createdAt: reviewComments.createdAt,
        userId: reviewComments.userId,
        username: users.username,
        reviewId: reviewComments.reviewId,
      })
      .from(reviewComments)
      .innerJoin(users, eq(reviewComments.userId, users.id))
      .where(eq(reviewComments.moderationStatus, 'pending'))
      .orderBy(desc(reviewComments.createdAt))
      .limit(50)
      .all();

    // Get statistics
    const stats = {
      photos: {
        pending: pendingPhotos.length,
        total: await getCount(db, reviewPhotos),
      },
      reviews: {
        pending: pendingReviews.length,
        total: await getCount(db, userReviews),
      },
      comments: {
        pending: pendingComments.length,
        total: await getCount(db, reviewComments),
      },
    };

    return jsonResponse({
      photos: pendingPhotos,
      reviews: pendingReviews,
      comments: pendingComments,
      stats,
    }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Get moderation queue error:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/admin/moderation/bulk - Bulk moderate items
 * Approve or reject multiple items at once
 */
export async function bulkModerate(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const body = await request.json() as {
      items: Array<{
        id: number;
        type: 'photo' | 'review' | 'comment';
      }>;
      status: 'approved' | 'rejected';
      notes?: string;
    };

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('Items array is required', HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return errorResponse('Valid status is required (approved or rejected)', HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const db = getDb(env.DB);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each item
    for (const item of body.items) {
      try {
        switch (item.type) {
          case 'photo':
            await db
              .update(reviewPhotos)
              .set({
                moderationStatus: body.status,
                moderatedAt: new Date().toISOString(),
                moderatedBy: request.user.userId,
                moderationNotes: body.notes || null,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(reviewPhotos.id, item.id));
            break;

          case 'review':
            await db
              .update(userReviews)
              .set({
                moderationStatus: body.status,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(userReviews.id, item.id));
            break;

          case 'comment':
            await db
              .update(reviewComments)
              .set({
                moderationStatus: body.status,
                moderatedAt: sql`CURRENT_TIMESTAMP`,
                moderatedBy: request.user.userId,
                moderationNotes: body.notes || null,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(reviewComments.id, item.id));
            break;

          default:
            throw new Error(`Unknown item type: ${item.type}`);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to moderate ${item.type} ${item.id}: ${error}`);
        console.error(`Bulk moderation error for ${item.type} ${item.id}:`, error);
      }
    }

    return jsonResponse({
      results,
      message: `Successfully moderated ${results.success} items, ${results.failed} failed`,
    }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Bulk moderation error:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/admin/moderation/stats - Get moderation statistics
 */
export async function getModerationStats(request: IRequest, env: Env): Promise<Response> {
  try {
    const db = getDb(env.DB);

    // Get counts for each moderation status
    const photoStats = await getStatusCounts(db, reviewPhotos);
    const reviewStats = await getStatusCounts(db, userReviews);
    const commentStats = await getStatusCounts(db, reviewComments);

    return jsonResponse({
      photos: photoStats,
      reviews: reviewStats,
      comments: commentStats,
      total: {
        pending: photoStats.pending + reviewStats.pending + commentStats.pending,
        approved: photoStats.approved + reviewStats.approved + commentStats.approved,
        rejected: photoStats.rejected + reviewStats.rejected + commentStats.rejected,
        flagged: (photoStats.flagged || 0) + (reviewStats.flagged || 0) + (commentStats.flagged || 0),
      },
    }, HTTP_STATUS.OK, request as Request, env);

  } catch (error) {
    console.error('Get moderation stats error:', error);
    return errorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// Helper functions
async function getCount(db: any, table: any): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(table)
    .get();
  return result?.count || 0;
}

async function getStatusCounts(db: any, table: any): Promise<Record<string, number>> {
  const results = await db
    .select({
      status: table.moderationStatus,
      count: sql<number>`COUNT(*)`,
    })
    .from(table)
    .groupBy(table.moderationStatus)
    .all();

  const counts: Record<string, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
  };

  results.forEach((row: any) => {
    counts[row.status] = row.count;
  });

  return counts;
}
