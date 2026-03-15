import { IRequest } from 'itty-router';
import { Env } from '../types';
import { HTTP_STATUS } from '../constants';
import { jsonResponse, errorResponse } from '../utils/response';

/**
 * Admin Analytics Endpoints
 *
 * Provides aggregated metrics data for the admin analytics dashboard.
 * All endpoints require admin authentication (JWT + admin role).
 *
 * Endpoints:
 * - GET /api/admin/cafe-stats - Cafe performance metrics
 * - GET /api/admin/user-activity-summary - User activity aggregates
 * - GET /api/admin/feed-stats - Feed engagement (optional)
 * - GET /api/admin/event-stats - Event engagement (optional)
 */

/**
 * GET /api/admin/cafe-stats
 * Get cafe performance statistics (admin only)
 *
 * Returns all cafes with their view counts, social clicks, and check-ins.
 * Includes both anonymous metrics (cafe_stats) and authenticated check-ins (user_checkins).
 *
 * Response includes:
 * - views: Total cafe detail page views
 * - directions_clicks: Total "Get Directions" clicks
 * - anonymous_passport_marks: Anonymous passport marks (localStorage)
 * - instagram_clicks: Instagram link clicks
 * - tiktok_clicks: TikTok link clicks
 * - authenticated_checkins: Authenticated user check-ins
 *
 * Sorted by views (highest first), includes cafes with 0 views using COALESCE.
 */
export async function handleAdminCafeStats(request: IRequest, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        c.id,
        c.name,
        c.city,
        c.neighborhood,
        c.slug,
        COALESCE(s.views, 0) as views,
        COALESCE(s.directions_clicks, 0) as directions_clicks,
        COALESCE(s.anonymous_passport_marks, 0) as anonymous_passport_marks,
        COALESCE(s.instagram_clicks, 0) as instagram_clicks,
        COALESCE(s.tiktok_clicks, 0) as tiktok_clicks,
        COALESCE(uc.checkin_count, 0) as authenticated_checkins
      FROM cafes c
      LEFT JOIN cafe_stats s ON c.id = s.cafe_id
      LEFT JOIN (
        SELECT cafe_id, COUNT(*) as checkin_count
        FROM user_checkins
        GROUP BY cafe_id
      ) uc ON c.id = uc.cafe_id
      WHERE c.deleted_at IS NULL
      ORDER BY s.views DESC NULLS LAST
    `).all();

    return jsonResponse({ stats: results }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error fetching cafe stats:', error);
    return errorResponse('Failed to fetch cafe stats', HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * GET /api/admin/event-stats (Optional)
 * Get event engagement statistics (admin only)
 *
 * Returns events with click counts, sorted by engagement.
 * Includes up to 50 most popular events.
 *
 * Useful for understanding which events drive the most interest.
 */
export async function handleEventStats(request: IRequest, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        e.id,
        e.title,
        e.date,
        COALESCE(s.clicks, 0) as clicks,
        e.featured
      FROM events e
      LEFT JOIN event_stats s ON e.id = s.event_id
      ORDER BY s.clicks DESC NULLS LAST
      LIMIT 50
    `).all();

    return jsonResponse({ stats: results }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return errorResponse('Failed to fetch event stats', HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}
