import { IRequest } from 'itty-router';
import { eq, and, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, feedItems } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';

// GET /api/feed - Get feed items
export async function listFeedItems(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const db = getDb(env.DB);

    // Build query conditions
    const conditions = [eq(feedItems.published, true)];

    if (type) {
      const validTypes = ['new_location', 'score_update', 'announcement', 'menu_update', 'closure'];
      if (!validTypes.includes(type)) {
        return jsonResponse(
          { error: 'Invalid type parameter' },
          400,
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
      200,
      request as Request,
      env,
      'public, max-age=300' // 5 min cache
    );
  } catch (error) {
    console.error('Error fetching feed:', error);
    return errorResponse('Failed to fetch feed', 500, request as Request, env);
  }
}
