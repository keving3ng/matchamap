import { IRequest } from 'itty-router';
import { eq } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userCheckins, cafes } from '../db';
import { HTTP_STATUS } from '../constants';
import { jsonResponse, errorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

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

/**
 * Handle authenticated user check-in
 * Requires JWT authentication
 */
export async function handleCheckIn(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    // Extract userId from JWT (set by requireAuth middleware)
    const userId = request.user?.userId;
    
    if (!userId) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }
    
    const body = await request.json().catch(() => ({})) as { cafeId?: string | number; notes?: string };
    const { cafeId, notes } = body;
    
    if (!cafeId) {
      return errorResponse('cafeId required', HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }
    
    // Parse and validate cafeId
    const parsedCafeId = typeof cafeId === 'string' ? parseInt(cafeId) : cafeId;
    if (typeof parsedCafeId !== 'number' || isNaN(parsedCafeId)) {
      return errorResponse('Invalid cafeId', HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }
    
    // Verify cafe exists
    const cafe = await env.DB.prepare('SELECT id FROM cafes WHERE id = ? AND deleted_at IS NULL')
      .bind(parsedCafeId)
      .first();
      
    if (!cafe) {
      return errorResponse('Cafe not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }
    
    // Execute all database operations in a transaction
    const results = await env.DB.batch([
      // Insert check-in (or update if exists)
      env.DB.prepare(`
        INSERT INTO user_checkins (user_id, cafe_id, visited_at, notes)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(user_id, cafe_id)
        DO UPDATE SET
          visited_at = CURRENT_TIMESTAMP,
          notes = ?
      `).bind(userId, parsedCafeId, notes || null, notes || null),
      
      // Increment user_activity_stats.total_checkins (avoid race condition)
      env.DB.prepare(`
        INSERT INTO user_activity_stats (user_id, total_checkins, last_active_at, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id)
        DO UPDATE SET
          total_checkins = total_checkins + 1,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `).bind(userId),
      
      // Sync userProfiles.totalCheckins (denormalized for quick access)
      env.DB.prepare(`
        UPDATE user_profiles
        SET total_checkins = (
          SELECT COUNT(*) FROM user_checkins WHERE user_id = ?
        )
        WHERE user_id = ?
      `).bind(userId, userId)
    ]);
    
    // Check if any operations failed
    const failed = results.find(result => !result.success);
    if (failed) {
      throw new Error(`Database operation failed: ${failed.error}`);
    }
    
    return jsonResponse({ success: true }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error handling check-in:', error);
    return errorResponse('Failed to check in', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/me/checkins
 * Get authenticated user's check-ins with cafe details
 */
export async function getUserCheckins(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    // Extract userId from JWT (set by requireAuth middleware)
    const userId = request.user?.userId;
    
    if (!userId) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }
    
    const db = getDb(env.DB);
    
    // Get user check-ins with cafe details
    const checkins = await db
      .select({
        id: userCheckins.id,
        cafeId: userCheckins.cafeId,
        visitedAt: userCheckins.visitedAt,
        notes: userCheckins.notes,
        cafeName: cafes.name,
        cafeSlug: cafes.slug,
        cafeAddress: cafes.address,
        cafeLatitude: cafes.latitude,
        cafeLongitude: cafes.longitude,
        cafeCity: cafes.city,
        cafeQuickNote: cafes.quickNote,
        cafeInstagram: cafes.instagram,
        cafeTiktokPostLink: cafes.tiktokPostLink,
        cafeInstagramPostLink: cafes.instagramPostLink,
      })
      .from(userCheckins)
      .leftJoin(cafes, eq(userCheckins.cafeId, cafes.id))
      .where(eq(userCheckins.userId, userId))
      .orderBy(userCheckins.visitedAt)
      .all();
    
    // Transform the data to match expected API response format
    const transformedCheckins = checkins.map(checkin => ({
      id: checkin.id,
      cafeId: checkin.cafeId,
      visitedAt: checkin.visitedAt,
      notes: checkin.notes,
      cafe: checkin.cafeName ? {
        id: checkin.cafeId,
        name: checkin.cafeName,
        slug: checkin.cafeSlug,
        address: checkin.cafeAddress,
        latitude: checkin.cafeLatitude,
        longitude: checkin.cafeLongitude,
        city: checkin.cafeCity,
        quickNote: checkin.cafeQuickNote,
        instagram: checkin.cafeInstagram,
        tiktokPostLink: checkin.cafeTiktokPostLink,
        instagramPostLink: checkin.cafeInstagramPostLink,
      } : null,
    }));
    
    return jsonResponse({ checkins: transformedCheckins }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error getting user check-ins:', error);
    return errorResponse('Failed to get check-ins', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}