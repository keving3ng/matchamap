import { IRequest } from 'itty-router';
import { eq, and, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, feedItems } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, PAGINATION_CONSTANTS, CACHE_CONSTANTS } from '../constants';

// GET /api/feed - Get feed items
export async function listFeedItems(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || PAGINATION_CONSTANTS.FEED_DEFAULT_LIMIT.toString()), PAGINATION_CONSTANTS.FEED_MAX_LIMIT);
    const offset = parseInt(url.searchParams.get('offset') || PAGINATION_CONSTANTS.DEFAULT_OFFSET.toString());

    const db = getDb(env.DB);

    // Build query conditions
    const conditions = [eq(feedItems.published, true)];

    if (type) {
      const validTypes = ['new_location', 'score_update', 'announcement', 'menu_update', 'closure'];
      if (!validTypes.includes(type)) {
        return jsonResponse(
          { error: 'Invalid type parameter' },
          HTTP_STATUS.BAD_REQUEST,
          request as Request,
          env
        );
      }
      conditions.push(eq(feedItems.type, type));
    }

    // Fetch feed items
    const results = await db
      .select()
      .from(feedItems)
      .where(and(...conditions))
      .orderBy(desc(feedItems.date))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return jsonResponse(
      { items, hasMore },
      HTTP_STATUS.OK,
      request as Request,
      env,
      `${CACHE_CONSTANTS.PUBLIC_CACHE}, max-age=${CACHE_CONSTANTS.PUBLIC_CACHE_MAX_AGE}` // 5 min cache
    );
  } catch (error) {
    console.error('Error fetching feed:', error);
    return errorResponse('Failed to fetch feed', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
