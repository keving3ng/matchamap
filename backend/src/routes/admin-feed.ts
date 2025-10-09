import { IRequest } from 'itty-router';
import { eq, desc, and } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, feedItems, NewFeedItem } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, PAGINATION_CONSTANTS, CACHE_CONSTANTS } from '../constants';
import { logAdminAction, generateChangesSummary } from '../utils/auditLog';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /api/admin/feed - Get all feed items (including unpublished)
export async function listAllFeedItems(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || PAGINATION_CONSTANTS.ADMIN_FEED_DEFAULT_LIMIT.toString()), PAGINATION_CONSTANTS.ADMIN_FEED_MAX_LIMIT);
    const offset = parseInt(url.searchParams.get('offset') || PAGINATION_CONSTANTS.DEFAULT_OFFSET.toString());
    const published = url.searchParams.get('published');

    const db = getDb(env.DB);

    // Build query with conditional filter
    const conditions = [];
    if (published !== null && published !== undefined) {
      conditions.push(eq(feedItems.published, published === 'true'));
    }

    const query = conditions.length > 0
      ? db.select().from(feedItems).where(and(...conditions))
      : db.select().from(feedItems);

    const results = await query
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
      CACHE_CONSTANTS.NO_STORE // Don't cache admin data
    );
  } catch (error) {
    console.error('Error fetching feed items:', error);
    return errorResponse('Failed to fetch feed items', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// GET /api/admin/feed/:id - Get a single feed item
export async function getFeedItem(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid feed item ID' }, HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const db = getDb(env.DB);
    const item = await db.select().from(feedItems).where(eq(feedItems.id, id)).get();

    if (!item) {
      return jsonResponse({ error: 'Feed item not found' }, HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    return jsonResponse(item, HTTP_STATUS.OK, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error fetching feed item:', error);
    return errorResponse('Failed to fetch feed item', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// POST /api/admin/feed - Create a new feed item
export async function createFeedItem(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json() as NewFeedItem;

    // Validate required fields
    if (!body.type || !body.title || !body.preview || !body.date) {
      return jsonResponse(
        { error: 'Missing required fields: type, title, preview, date' },
        HTTP_STATUS.BAD_REQUEST,
        request as Request,
        env
      );
    }

    // Validate type
    const validTypes = ['new_location', 'score_update', 'announcement', 'menu_update', 'closure'];
    if (!validTypes.includes(body.type)) {
      return jsonResponse(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        HTTP_STATUS.BAD_REQUEST,
        request as Request,
        env
      );
    }

    const db = getDb(env.DB);

    const result = await db.insert(feedItems).values({
      type: body.type,
      title: body.title,
      preview: body.preview,
      content: body.content || null,
      cafeId: body.cafeId || null,
      cafeName: body.cafeName || null,
      score: body.score || null,
      previousScore: body.previousScore || null,
      neighborhood: body.neighborhood || null,
      image: body.image || null,
      author: body.author || null,
      tags: body.tags || null,
      published: body.published ?? false,
      date: body.date,
    }).returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'CREATE',
      resourceType: 'feed_item',
      resourceId: result[0].id,
      changesSummary: generateChangesSummary('CREATE', 'feed_item', result[0].title),
      afterState: result[0],
    });

    return jsonResponse(result[0], HTTP_STATUS.CREATED, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error creating feed item:', error);
    return errorResponse('Failed to create feed item', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// PUT /api/admin/feed/:id - Update a feed item
export async function updateFeedItem(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid feed item ID' }, HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const body = await request.json() as Partial<NewFeedItem>;
    const db = getDb(env.DB);

    // Check if feed item exists
    const existing = await db.select().from(feedItems).where(eq(feedItems.id, id)).get();
    if (!existing) {
      return jsonResponse({ error: 'Feed item not found' }, HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    const beforeState = existing;

    // Validate type if provided
    if (body.type) {
      const validTypes = ['new_location', 'score_update', 'announcement', 'menu_update', 'closure'];
      if (!validTypes.includes(body.type)) {
        return jsonResponse(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          HTTP_STATUS.BAD_REQUEST,
          request as Request,
          env
        );
      }
    }

    const result = await db
      .update(feedItems)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(feedItems.id, id))
      .returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'UPDATE',
      resourceType: 'feed_item',
      resourceId: id,
      changesSummary: generateChangesSummary('UPDATE', 'feed_item', result[0].title, beforeState, result[0]),
      beforeState,
      afterState: result[0],
    });

    return jsonResponse(result[0], HTTP_STATUS.OK, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error updating feed item:', error);
    return errorResponse('Failed to update feed item', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// DELETE /api/admin/feed/:id - Delete a feed item
export async function deleteFeedItem(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid feed item ID' }, HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if feed item exists
    const existing = await db.select().from(feedItems).where(eq(feedItems.id, id)).get();
    if (!existing) {
      return jsonResponse({ error: 'Feed item not found' }, HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    await db.delete(feedItems).where(eq(feedItems.id, id));

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'DELETE',
      resourceType: 'feed_item',
      resourceId: id,
      changesSummary: generateChangesSummary('DELETE', 'feed_item', existing.title),
      beforeState: existing,
    });

    return jsonResponse({ success: true, message: 'Feed item deleted' }, HTTP_STATUS.OK, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error deleting feed item:', error);
    return errorResponse('Failed to delete feed item', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
