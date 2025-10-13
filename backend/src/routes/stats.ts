import { IRequest } from 'itty-router';
import { Env } from '../types';
import { HTTP_STATUS } from '../constants';
import { jsonResponse, errorResponse } from '../utils/response';

/**
 * Track cafe statistics (views, directions, passport marks, social clicks)
 * Handles both anonymous and authenticated users using fire-and-forget pattern
 */
export async function trackCafeStat(request: IRequest, env: Env): Promise<Response> {
  try {
    const { cafeId, stat } = request.params;

    // Parse userId from request body (null if anonymous)
    const body = await request.json().catch(() => ({})) as { userId?: string };
    const userId = body.userId ?? null;
    
    // Map stat names to column names (prevents SQL injection)
    const statColumns: Record<string, string> = {
      view: 'views',
      directions: 'directions_clicks',
      passport: 'anonymous_passport_marks',
      instagram: 'instagram_clicks',
      tiktok: 'tiktok_clicks',
    };
    
    const column = statColumns[stat];
    if (!column) {
      return errorResponse('Invalid stat type', HTTP_STATUS.BAD_REQUEST, request, env);
    }
    
    // Parse and validate cafeId
    const parsedCafeId = parseInt(cafeId);
    if (isNaN(parsedCafeId)) {
      return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env); // Fire-and-forget: return OK even on invalid ID
    }
    
    // Increment cafe_stats counter (upsert pattern)
    await env.DB.prepare(`
      INSERT INTO cafe_stats (cafe_id, ${column}, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(cafe_id)
      DO UPDATE SET
        ${column} = ${column} + 1,
        updated_at = CURRENT_TIMESTAMP
    `)
      .bind(parsedCafeId)
      .run();
    
    // If authenticated user, also update user_activity_stats
    // (Only for 'view' and 'directions' stats)
    if (userId && (stat === 'view' || stat === 'directions')) {
      const userColumn = stat === 'view' ? 'total_cafe_views' : 'total_directions_clicks';
      
      await env.DB.prepare(`
        INSERT INTO user_activity_stats (user_id, ${userColumn}, last_active_at, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id)
        DO UPDATE SET
          ${userColumn} = ${userColumn} + 1,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `)
        .bind(userId)
        .run();
    }
    
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error tracking cafe stat:', error);
    // Return OK even on error (fire-and-forget pattern)
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env);
  }
}

/**
 * Track feed item clicks
 * Handles both anonymous and authenticated users using fire-and-forget pattern
 */
export async function trackFeedClick(request: IRequest, env: Env): Promise<Response> {
  try {
    const { feedItemId } = request.params;
    
    // Parse and validate feedItemId
    const parsedFeedItemId = parseInt(feedItemId);
    if (isNaN(parsedFeedItemId)) {
      return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env); // Fire-and-forget: return OK even on invalid ID
    }
    
    // Increment feed_stats counter (upsert pattern)
    await env.DB.prepare(`
      INSERT INTO feed_stats (feed_item_id, clicks, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(feed_item_id)
      DO UPDATE SET
        clicks = clicks + 1,
        updated_at = CURRENT_TIMESTAMP
    `)
      .bind(parsedFeedItemId)
      .run();
    
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error tracking feed click:', error);
    // Return OK even on error (fire-and-forget pattern)
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env);
  }
}

/**
 * Track event clicks
 * Handles both anonymous and authenticated users using fire-and-forget pattern
 */
export async function trackEventClick(request: IRequest, env: Env): Promise<Response> {
  try {
    const { eventId } = request.params;
    
    // Parse and validate eventId
    const parsedEventId = parseInt(eventId);
    if (isNaN(parsedEventId)) {
      return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env); // Fire-and-forget: return OK even on invalid ID
    }
    
    // Increment event_stats counter (upsert pattern)
    await env.DB.prepare(`
      INSERT INTO event_stats (event_id, clicks, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(event_id)
      DO UPDATE SET
        clicks = clicks + 1,
        updated_at = CURRENT_TIMESTAMP
    `)
      .bind(parsedEventId)
      .run();
    
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error tracking event click:', error);
    // Return OK even on error (fire-and-forget pattern)
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request, env);
  }
}