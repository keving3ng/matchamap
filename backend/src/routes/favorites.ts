import { IRequest } from 'itty-router';
import { eq, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userFavorites, cafes } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTP_STATUS } from '../constants';
import { cafeSelection, transformCafeSelection } from '../utils/selections';

/**
 * GET /api/users/me/favorites
 * Get current user's favorites list with cafe details
 */
export async function getMyFavorites(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    // Get favorites with cafe details via JOIN using standardized cafe selection
    const favoritesWithCafes = await db
      .select({
        id: userFavorites.id,
        userId: userFavorites.userId,
        cafeId: userFavorites.cafeId,
        notes: userFavorites.notes,
        sortOrder: userFavorites.sortOrder,
        createdAt: userFavorites.createdAt,
        updatedAt: userFavorites.updatedAt,

        // Cafe details using standardized selection
        ...cafeSelection,
      })
      .from(userFavorites)
      .innerJoin(cafes, eq(userFavorites.cafeId, cafes.id))
      .where(eq(userFavorites.userId, request.user.userId))
      .orderBy(userFavorites.sortOrder, desc(userFavorites.createdAt))
      .all();

    // Transform to include nested cafe object using standardized transformation
    const favorites = favoritesWithCafes.map((row) => ({
      id: row.id,
      userId: row.userId,
      cafeId: row.cafeId,
      notes: row.notes,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      cafe: transformCafeSelection(row, row.cafeId),
    }));

    return jsonResponse({ favorites }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get favorites error:', error);
    return errorResponse('Failed to get favorites', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/users/me/favorites
 * Add a cafe to favorites (or update existing)
 */
export async function addFavorite(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const body = await request.json() as { cafeId?: number; notes?: string };
    const { cafeId, notes } = body;

    // Validate required fields
    if (!cafeId || typeof cafeId !== 'number') {
      return badRequestResponse('Valid cafeId is required', request as Request, env);
    }

    // Validate notes if provided
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
      return badRequestResponse('Notes must be a string with max 500 characters', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if cafe exists
    const cafe = await db
      .select({ id: cafes.id })
      .from(cafes)
      .where(eq(cafes.id, cafeId))
      .get();

    if (!cafe) {
      return badRequestResponse('Cafe not found', request as Request, env);
    }

    // Use raw SQL for upsert behavior (consistent with existing codebase patterns)
    const result = await env.DB.prepare(`
      INSERT INTO user_favorites (user_id, cafe_id, notes, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, cafe_id)
      DO UPDATE SET
        notes = ?,
        updated_at = datetime('now')
      RETURNING *
    `).bind(request.user.userId, cafeId, notes || null, notes || null).first();

    return jsonResponse({
      success: true,
      favorite: result
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Add favorite error:', error);
    return errorResponse('Failed to add favorite', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/users/me/favorites/:cafeId
 * Remove a cafe from favorites
 */
export async function removeFavorite(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const { cafeId } = request.params as { cafeId: string };
    const cafeIdNum = parseInt(cafeId, 10);

    if (isNaN(cafeIdNum)) {
      return badRequestResponse('Valid cafeId is required', request as Request, env);
    }

    // Delete the favorite (idempotent - no error if doesn't exist)
    const result = await env.DB.prepare(`
      DELETE FROM user_favorites
      WHERE user_id = ? AND cafe_id = ?
    `).bind(request.user.userId, cafeIdNum).run();

    return jsonResponse({
      success: true,
      removed: (result.meta.changes || 0) > 0
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Remove favorite error:', error);
    return errorResponse('Failed to remove favorite', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/users/me/favorites/:cafeId/notes
 * Update notes for a specific favorite
 */
export async function updateFavoriteNotes(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const { cafeId } = request.params as { cafeId: string };
    const cafeIdNum = parseInt(cafeId, 10);

    if (isNaN(cafeIdNum)) {
      return badRequestResponse('Valid cafeId is required', request as Request, env);
    }

    const body = await request.json() as { notes?: string };
    const { notes } = body;

    // Validate notes
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
      return badRequestResponse('Notes must be a string with max 500 characters', request as Request, env);
    }

    // Update notes (returns null if favorite doesn't exist)
    const result = await env.DB.prepare(`
      UPDATE user_favorites
      SET notes = ?, updated_at = datetime('now')
      WHERE user_id = ? AND cafe_id = ?
      RETURNING *
    `).bind(notes || null, request.user.userId, cafeIdNum).first();

    if (!result) {
      return errorResponse('Favorite not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    return jsonResponse({
      success: true,
      favorite: result
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Update favorite notes error:', error);
    return errorResponse('Failed to update favorite notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}