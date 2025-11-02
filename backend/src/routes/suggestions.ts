import { IRequest } from 'itty-router';
import { eq, desc, and } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, cafeSuggestions, cafes, users } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTP_STATUS } from '../constants';

/**
 * POST /api/cafe-suggestions
 * Submit a new cafe suggestion (authenticated users only)
 */
export async function createSuggestion(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const body = await request.json() as {
      name?: string;
      address?: string;
      city?: string;
      neighborhood?: string;
      description?: string;
      googleMapsUrl?: string;
      instagram?: string;
      website?: string;
    };

    const { name, address, city, neighborhood, description, googleMapsUrl, instagram, website } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 200) {
      return badRequestResponse('Name is required and must be between 2 and 200 characters', request as Request, env);
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 500) {
      return badRequestResponse('Address is required and must be between 5 and 500 characters', request as Request, env);
    }

    if (!city || !['toronto', 'vancouver', 'montreal', 'tokyo'].includes(city.toLowerCase())) {
      return badRequestResponse('City is required and must be one of: toronto, vancouver, montreal, tokyo', request as Request, env);
    }

    // Validate optional fields
    if (description !== undefined && (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 1000)) {
      return badRequestResponse('Description must be between 10 and 1000 characters if provided', request as Request, env);
    }

    if (neighborhood !== undefined && (typeof neighborhood !== 'string' || neighborhood.trim().length > 100)) {
      return badRequestResponse('Neighborhood must be less than 100 characters if provided', request as Request, env);
    }

    if (googleMapsUrl !== undefined && (typeof googleMapsUrl !== 'string' || googleMapsUrl.trim().length > 500)) {
      return badRequestResponse('Google Maps URL must be less than 500 characters if provided', request as Request, env);
    }

    if (instagram !== undefined && (typeof instagram !== 'string' || instagram.trim().length > 200)) {
      return badRequestResponse('Instagram handle must be less than 200 characters if provided', request as Request, env);
    }

    if (website !== undefined && (typeof website !== 'string' || website.trim().length > 500)) {
      return badRequestResponse('Website URL must be less than 500 characters if provided', request as Request, env);
    }

    const db = getDb(env.DB);

    // Create the suggestion
    const result = await env.DB.prepare(`
      INSERT INTO cafe_suggestions (
        user_id, name, address, city, neighborhood, description,
        google_maps_url, instagram, website, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      RETURNING *
    `).bind(
      request.user.userId,
      name.trim(),
      address.trim(),
      city.toLowerCase(),
      neighborhood?.trim() || null,
      description?.trim() || null,
      googleMapsUrl?.trim() || null,
      instagram?.trim() || null,
      website?.trim() || null
    ).first();

    return jsonResponse({
      success: true,
      suggestion: result
    }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Create suggestion error:', error);
    return errorResponse('Failed to create cafe suggestion', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/me/suggestions
 * Get current user's cafe suggestions
 */
export async function getMySuggestions(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    const suggestions = await db
      .select()
      .from(cafeSuggestions)
      .where(eq(cafeSuggestions.userId, request.user.userId))
      .orderBy(desc(cafeSuggestions.createdAt))
      .all();

    return jsonResponse({ suggestions }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get user suggestions error:', error);
    return errorResponse('Failed to get suggestions', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/admin/cafe-suggestions
 * Get all pending cafe suggestions for admin review
 */
export async function getPendingSuggestions(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return errorResponse('Admin access required', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    const db = getDb(env.DB);

    // Get suggestions with user details via JOIN
    const suggestionsWithUsers = await db
      .select({
        id: cafeSuggestions.id,
        userId: cafeSuggestions.userId,
        name: cafeSuggestions.name,
        address: cafeSuggestions.address,
        city: cafeSuggestions.city,
        neighborhood: cafeSuggestions.neighborhood,
        description: cafeSuggestions.description,
        googleMapsUrl: cafeSuggestions.googleMapsUrl,
        instagram: cafeSuggestions.instagram,
        website: cafeSuggestions.website,
        status: cafeSuggestions.status,
        cafeId: cafeSuggestions.cafeId,
        adminNotes: cafeSuggestions.adminNotes,
        moderatedBy: cafeSuggestions.moderatedBy,
        moderatedAt: cafeSuggestions.moderatedAt,
        createdAt: cafeSuggestions.createdAt,
        updatedAt: cafeSuggestions.updatedAt,

        // User details
        username: users.username,
        userEmail: users.email,
      })
      .from(cafeSuggestions)
      .innerJoin(users, eq(cafeSuggestions.userId, users.id))
      .where(eq(cafeSuggestions.status, 'pending'))
      .orderBy(desc(cafeSuggestions.createdAt))
      .all();

    // Transform to include nested user object
    const suggestions = suggestionsWithUsers.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      address: row.address,
      city: row.city,
      neighborhood: row.neighborhood,
      description: row.description,
      googleMapsUrl: row.googleMapsUrl,
      instagram: row.instagram,
      website: row.website,
      status: row.status,
      cafeId: row.cafeId,
      adminNotes: row.adminNotes,
      moderatedBy: row.moderatedBy,
      moderatedAt: row.moderatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        username: row.username,
        email: row.userEmail,
      },
    }));

    return jsonResponse({ suggestions }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get pending suggestions error:', error);
    return errorResponse('Failed to get pending suggestions', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/admin/cafe-suggestions/:id/approve
 * Approve a cafe suggestion and optionally create the cafe
 */
export async function approveSuggestion(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return errorResponse('Admin access required', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    const { id } = request.params as { id: string };
    const suggestionId = parseInt(id, 10);

    if (isNaN(suggestionId)) {
      return badRequestResponse('Valid suggestion ID is required', request as Request, env);
    }

    const body = await request.json() as {
      adminNotes?: string;
      cafeId?: number;
    };

    const { adminNotes, cafeId } = body;

    // Validate admin notes if provided
    if (adminNotes !== undefined && (typeof adminNotes !== 'string' || adminNotes.length > 1000)) {
      return badRequestResponse('Admin notes must be less than 1000 characters if provided', request as Request, env);
    }

    // Validate cafeId if provided
    if (cafeId !== undefined && (typeof cafeId !== 'number' || cafeId <= 0)) {
      return badRequestResponse('Cafe ID must be a positive number if provided', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if suggestion exists
    const suggestion = await db
      .select()
      .from(cafeSuggestions)
      .where(eq(cafeSuggestions.id, suggestionId))
      .get();

    if (!suggestion) {
      return errorResponse('Suggestion not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Update suggestion status to approved
    const result = await env.DB.prepare(`
      UPDATE cafe_suggestions
      SET status = 'approved',
          admin_notes = ?,
          cafe_id = ?,
          moderated_by = ?,
          moderated_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
      RETURNING *
    `).bind(
      adminNotes || null,
      cafeId || null,
      request.user.userId,
      suggestionId
    ).first();

    return jsonResponse({
      success: true,
      suggestion: result
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Approve suggestion error:', error);
    return errorResponse('Failed to approve suggestion', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/admin/cafe-suggestions/:id/reject
 * Reject a cafe suggestion with optional admin notes
 */
export async function rejectSuggestion(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return errorResponse('Admin access required', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    const { id } = request.params as { id: string };
    const suggestionId = parseInt(id, 10);

    if (isNaN(suggestionId)) {
      return badRequestResponse('Valid suggestion ID is required', request as Request, env);
    }

    const body = await request.json() as {
      adminNotes?: string;
    };

    const { adminNotes } = body;

    // Validate admin notes if provided
    if (adminNotes !== undefined && (typeof adminNotes !== 'string' || adminNotes.length > 1000)) {
      return badRequestResponse('Admin notes must be less than 1000 characters if provided', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if suggestion exists
    const suggestion = await db
      .select()
      .from(cafeSuggestions)
      .where(eq(cafeSuggestions.id, suggestionId))
      .get();

    if (!suggestion) {
      return errorResponse('Suggestion not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Update suggestion status to rejected
    const result = await env.DB.prepare(`
      UPDATE cafe_suggestions
      SET status = 'rejected',
          admin_notes = ?,
          moderated_by = ?,
          moderated_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
      RETURNING *
    `).bind(
      adminNotes || null,
      request.user.userId,
      suggestionId
    ).first();

    return jsonResponse({
      success: true,
      suggestion: result
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Reject suggestion error:', error);
    return errorResponse('Failed to reject suggestion', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
