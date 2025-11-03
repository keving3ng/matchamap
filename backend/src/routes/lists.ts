import { IRequest } from 'itty-router';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userLists, userListItems, cafes } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTP_STATUS } from '../constants';
import { sanitizeShortText, sanitizeTextInput } from '../utils/sanitize';
import type { CreateListRequest, UpdateListRequest, AddListItemRequest } from '../../../shared/types';

/**
 * GET /api/lists/me
 * Get current user's lists with item counts
 * Optimized with single query using LEFT JOIN and COUNT
 */
export async function getMyLists(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    // Get user's lists with item counts in a single query using LEFT JOIN
    const listsWithCounts = await db
      .select({
        id: userLists.id,
        userId: userLists.userId,
        name: userLists.name,
        description: userLists.description,
        isPublic: userLists.isPublic,
        createdAt: userLists.createdAt,
        updatedAt: userLists.updatedAt,
        itemCount: count(userListItems.id),
      })
      .from(userLists)
      .leftJoin(userListItems, eq(userLists.id, userListItems.listId))
      .where(eq(userLists.userId, request.user.userId))
      .groupBy(userLists.id)
      .orderBy(desc(userLists.createdAt))
      .all();

    return jsonResponse({ lists: listsWithCounts, total: listsWithCounts.length }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get my lists error:', error);
    return errorResponse('Failed to get lists', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/lists
 * Create a new list
 */
export async function createList(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const body = await request.json() as CreateListRequest;

    // Sanitize and validate list name
    const sanitizedName = sanitizeShortText(body.name, 100);
    if (!sanitizedName) {
      return badRequestResponse('List name is required and must be valid', request as Request, env);
    }

    // Sanitize description
    const sanitizedDescription = sanitizeTextInput(body.description, 500);

    const db = getDb(env.DB);

    // Create the list
    const result = await db
      .insert(userLists)
      .values({
        userId: request.user.userId,
        name: sanitizedName,
        description: sanitizedDescription,
        isPublic: body.isPublic ?? false,
      })
      .returning()
      .get();

    return jsonResponse({ list: { ...result, itemCount: 0 } }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Create list error:', error);
    return errorResponse('Failed to create list', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/lists/:id
 * Get list details with items
 */
export async function getListById(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    const listId = parseInt(request.params?.id || '');

    if (isNaN(listId)) {
      return badRequestResponse('Invalid list ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the list
    const list = await db
      .select()
      .from(userLists)
      .where(eq(userLists.id, listId))
      .get();

    if (!list) {
      return errorResponse('List not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Check authorization - user must own the list OR list must be public
    if (list.userId !== request.user?.userId && !list.isPublic) {
      return errorResponse('Not authorized to view this list', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Get list items with cafe details
    const itemsWithCafes = await db
      .select({
        id: userListItems.id,
        listId: userListItems.listId,
        cafeId: userListItems.cafeId,
        notes: userListItems.notes,
        createdAt: userListItems.createdAt,

        // Cafe details
        cafeName: cafes.name,
        cafeSlug: cafes.slug,
        cafeCity: cafes.city,
        cafeLatitude: cafes.latitude,
        cafeLongitude: cafes.longitude,
        cafeAmbianceScore: cafes.ambianceScore,
        cafeQuickNote: cafes.quickNote,
        cafeInstagram: cafes.instagram,
        cafeImages: cafes.images,
        cafeLink: cafes.link,
        cafeAddress: cafes.address,
        cafeUserRatingAvg: cafes.userRatingAvg,
        cafeUserRatingCount: cafes.userRatingCount,
      })
      .from(userListItems)
      .innerJoin(cafes, eq(userListItems.cafeId, cafes.id))
      .where(eq(userListItems.listId, listId))
      .orderBy(desc(userListItems.createdAt))
      .all();

    // Transform to include nested cafe object
    const items = itemsWithCafes.map((row) => ({
      id: row.id,
      listId: row.listId,
      cafeId: row.cafeId,
      notes: row.notes,
      createdAt: row.createdAt,
      cafe: {
        id: row.cafeId,
        name: row.cafeName,
        slug: row.cafeSlug,
        city: row.cafeCity,
        latitude: row.cafeLatitude,
        longitude: row.cafeLongitude,
        ambianceScore: row.cafeAmbianceScore,
        quickNote: row.cafeQuickNote,
        instagram: row.cafeInstagram,
        images: row.cafeImages,
        link: row.cafeLink,
        address: row.cafeAddress,
        userRatingAvg: row.cafeUserRatingAvg,
        userRatingCount: row.cafeUserRatingCount,
      },
    }));

    return jsonResponse({ list, items }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get list by ID error:', error);
    return errorResponse('Failed to get list', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/lists/:id
 * Update list details
 */
export async function updateList(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const listId = parseInt(request.params?.id || '');

    if (isNaN(listId)) {
      return badRequestResponse('Invalid list ID', request as Request, env);
    }

    const body = await request.json() as UpdateListRequest;
    const db = getDb(env.DB);

    // Get the list to check ownership
    const list = await db
      .select()
      .from(userLists)
      .where(eq(userLists.id, listId))
      .get();

    if (!list) {
      return errorResponse('List not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    if (list.userId !== request.user.userId) {
      return errorResponse('Not authorized to update this list', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Build update object with sanitization
    const updateData: Partial<typeof userLists.$inferInsert> = {};

    if (body.name !== undefined) {
      const sanitizedName = sanitizeShortText(body.name, 100);
      if (!sanitizedName) {
        return badRequestResponse('List name cannot be empty and must be valid', request as Request, env);
      }
      updateData.name = sanitizedName;
    }

    if (body.description !== undefined) {
      updateData.description = sanitizeTextInput(body.description, 500);
    }

    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic;
    }

    // Update the list
    const updated = await db
      .update(userLists)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(userLists.id, listId))
      .returning()
      .get();

    return jsonResponse({ list: updated }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Update list error:', error);
    return errorResponse('Failed to update list', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/lists/:id
 * Delete a list
 */
export async function deleteList(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const listId = parseInt(request.params?.id || '');

    if (isNaN(listId)) {
      return badRequestResponse('Invalid list ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the list to check ownership
    const list = await db
      .select()
      .from(userLists)
      .where(eq(userLists.id, listId))
      .get();

    if (!list) {
      return errorResponse('List not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    if (list.userId !== request.user.userId) {
      return errorResponse('Not authorized to delete this list', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Delete the list (CASCADE will delete items)
    await db.delete(userLists).where(eq(userLists.id, listId)).run();

    return jsonResponse({ message: 'List deleted successfully' }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Delete list error:', error);
    return errorResponse('Failed to delete list', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/lists/:id/items
 * Add a cafe to a list
 */
export async function addListItem(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const listId = parseInt(request.params?.id || '');

    if (isNaN(listId)) {
      return badRequestResponse('Invalid list ID', request as Request, env);
    }

    const body = await request.json() as AddListItemRequest;

    if (!body.cafeId) {
      return badRequestResponse('Cafe ID is required', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the list to check ownership
    const list = await db
      .select()
      .from(userLists)
      .where(eq(userLists.id, listId))
      .get();

    if (!list) {
      return errorResponse('List not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    if (list.userId !== request.user.userId) {
      return errorResponse('Not authorized to add items to this list', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Verify cafe exists
    const cafe = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, body.cafeId))
      .get();

    if (!cafe) {
      return errorResponse('Cafe not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Check if item already exists in list
    const existing = await db
      .select()
      .from(userListItems)
      .where(
        and(
          eq(userListItems.listId, listId),
          eq(userListItems.cafeId, body.cafeId)
        )
      )
      .get();

    if (existing) {
      return badRequestResponse('Cafe already in this list', request as Request, env);
    }

    // Sanitize notes
    const sanitizedNotes = sanitizeTextInput(body.notes, 500);

    // Add the item
    const result = await db
      .insert(userListItems)
      .values({
        listId,
        cafeId: body.cafeId,
        notes: sanitizedNotes,
      })
      .returning()
      .get();

    return jsonResponse({ item: result }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Add list item error:', error);
    return errorResponse('Failed to add cafe to list', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/lists/:id/items/:cafeId
 * Remove a cafe from a list
 */
export async function removeListItem(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const listId = parseInt(request.params?.id || '');
    const cafeId = parseInt(request.params?.cafeId || '');

    if (isNaN(listId) || isNaN(cafeId)) {
      return badRequestResponse('Invalid list ID or cafe ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the list to check ownership
    const list = await db
      .select()
      .from(userLists)
      .where(eq(userLists.id, listId))
      .get();

    if (!list) {
      return errorResponse('List not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    if (list.userId !== request.user.userId) {
      return errorResponse('Not authorized to remove items from this list', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Remove the item
    await db
      .delete(userListItems)
      .where(
        and(
          eq(userListItems.listId, listId),
          eq(userListItems.cafeId, cafeId)
        )
      )
      .run();

    return jsonResponse({ message: 'Item removed from list' }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Remove list item error:', error);
    return errorResponse('Failed to remove cafe from list', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
