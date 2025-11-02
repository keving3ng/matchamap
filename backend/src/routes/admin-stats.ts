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
        c.slug,
        COALESCE(s.views, 0) as views,
        COALESCE(s.directions_clicks, 0) as directions_clicks,
        COALESCE(s.anonymous_passport_marks, 0) as anonymous_passport_marks,
        COALESCE(s.instagram_clicks, 0) as instagram_clicks,
        COALESCE(s.tiktok_clicks, 0) as tiktok_clicks,
        (SELECT COUNT(*) FROM user_checkins WHERE cafe_id = c.id) as authenticated_checkins
      FROM cafes c
      LEFT JOIN cafe_stats s ON c.id = s.cafe_id
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
 * GET /api/admin/user-activity-summary
 * Get user activity summary (admin only)
 *
 * Returns aggregated user activity metrics:
 * - total_users: Total registered users
 * - active_users_7d: Users active in last 7 days
 * - active_users_30d: Users active in last 30 days
 * - total_checkins: Total authenticated check-ins
 * - repeat_visitors: Users with 3+ check-ins
 *
 * Uses user_activity_stats table for efficient aggregation.
 */
export async function handleUserActivitySummary(request: IRequest, env: Env): Promise<Response> {
  try {
    // Total users
    const { results: totalUsers } = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM users`
    ).all();

    // Active users (7 days)
    const { results: activeUsers7d } = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_activity_stats
      WHERE last_active_at >= datetime('now', '-7 days')
    `).all();

    // Active users (30 days)
    const { results: activeUsers30d } = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_activity_stats
      WHERE last_active_at >= datetime('now', '-30 days')
    `).all();

    // Total check-ins
    const { results: totalCheckins } = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM user_checkins`
    ).all();

    // Repeat visitors (3+ check-ins)
    const { results: repeatVisitors } = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_activity_stats
      WHERE total_checkins >= 3
    `).all();

    return jsonResponse({
      total_users: totalUsers[0]?.count || 0,
      active_users_7d: activeUsers7d[0]?.count || 0,
      active_users_30d: activeUsers30d[0]?.count || 0,
      total_checkins: totalCheckins[0]?.count || 0,
      repeat_visitors: repeatVisitors[0]?.count || 0,
    }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error fetching user activity summary:', error);
    return errorResponse('Failed to fetch user activity summary', HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
  }
}

/**
 * GET /api/admin/feed-stats (Optional)
 * Get feed engagement statistics (admin only)
 *
 * Returns feed items with click counts, sorted by engagement.
 * Includes up to 50 most popular feed items.
 *
 * Note: Feed feature may be disabled via feature flags.
 */
export async function handleFeedStats(request: IRequest, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        f.id,
        f.title,
        f.type,
        COALESCE(s.clicks, 0) as clicks,
        f.published_at
      FROM feed_items f
      LEFT JOIN feed_stats s ON f.id = s.feed_item_id
      ORDER BY s.clicks DESC NULLS LAST
      LIMIT 50
    `).all();

    return jsonResponse({ stats: results }, HTTP_STATUS.OK, request, env);
  } catch (error) {
    console.error('Error fetching feed stats:', error);
    return errorResponse('Failed to fetch feed stats', HTTP_STATUS.INTERNAL_SERVER_ERROR, request, env);
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
        e.name,
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
