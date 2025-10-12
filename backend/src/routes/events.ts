import { IRequest } from 'itty-router';
import { eq, and, gte, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, events } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, PAGINATION_CONSTANTS, CACHE_CONSTANTS } from '../constants';

// GET /api/events - Get events
export async function listEvents(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const upcoming = url.searchParams.get('upcoming') !== 'false'; // default true
    const featured = url.searchParams.get('featured') === 'true';
    const cafeId = url.searchParams.get('cafeId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || PAGINATION_CONSTANTS.EVENTS_DEFAULT_LIMIT.toString()), PAGINATION_CONSTANTS.EVENTS_MAX_LIMIT);

    const db = getDb(env.DB);

    // Build query conditions
    const conditions = [eq(events.published, true)];

    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(gte(events.date, today));
    }

    if (featured) {
      conditions.push(eq(events.featured, true));
    }

    if (cafeId) {
      const cafeIdNum = parseInt(cafeId);
      if (!isNaN(cafeIdNum)) {
        conditions.push(eq(events.cafeId, cafeIdNum));
      }
    }

    // Fetch events
    // Order by event date (ascending) to show soonest upcoming events first
    const results = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.date)
      .limit(limit);

    return jsonResponse(
      { events: results },
      HTTP_STATUS.OK,
      request as Request,
      env,
      `${CACHE_CONSTANTS.PUBLIC_CACHE}, max-age=${CACHE_CONSTANTS.PUBLIC_CACHE_MAX_AGE}` // 5 min cache
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    return errorResponse('Failed to fetch events', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
