import { IRequest } from 'itty-router';
import { eq, desc, and, ne } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, events, NewEvent } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, PAGINATION_CONSTANTS, CACHE_CONSTANTS } from '../constants';
import { logAdminAction, generateChangesSummary } from '../utils/auditLog';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /api/admin/events - Get all events (including unpublished)
export async function listAllEvents(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || PAGINATION_CONSTANTS.ADMIN_EVENTS_DEFAULT_LIMIT.toString()), PAGINATION_CONSTANTS.ADMIN_EVENTS_MAX_LIMIT);
    const offset = parseInt(url.searchParams.get('offset') || PAGINATION_CONSTANTS.DEFAULT_OFFSET.toString());
    const published = url.searchParams.get('published');

    const db = getDb(env.DB);

    // Build query with conditional filter
    const conditions = [];
    if (published !== null && published !== undefined) {
      conditions.push(eq(events.published, published === 'true'));
    }

    const query = conditions.length > 0
      ? db.select().from(events).where(and(...conditions))
      : db.select().from(events);

    // Order by event date (descending) to show most distant future events first
    // This helps admins see what's scheduled furthest out
    const results = await query
      .orderBy(desc(events.date))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return jsonResponse(
      { events: items, hasMore },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE // Don't cache admin data
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    return errorResponse('Failed to fetch events', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// GET /api/admin/events/:id - Get a single event
export async function getEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid event ID' }, HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const db = getDb(env.DB);
    const event = await db.select().from(events).where(eq(events.id, id)).get();

    if (!event) {
      return jsonResponse({ error: 'Event not found' }, HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    return jsonResponse(event, HTTP_STATUS.OK, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error fetching event:', error);
    return errorResponse('Failed to fetch event', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// POST /api/admin/events - Create a new event
export async function createEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json() as NewEvent;

    // Validate required fields
    if (!body.title || !body.date || !body.time || !body.venue || !body.location || !body.description) {
      return jsonResponse(
        { error: 'Missing required fields: title, date, time, venue, location, description' },
        HTTP_STATUS.BAD_REQUEST,
        request as Request,
        env
      );
    }

    const db = getDb(env.DB);

    // If creating a featured event, remove featured status from all other events
    if (body.featured === true) {
      await db
        .update(events)
        .set({ featured: false })
        .where(eq(events.featured, true));
    }

    const result = await db.insert(events).values({
      title: body.title,
      date: body.date,
      time: body.time,
      venue: body.venue,
      location: body.location,
      cafeId: body.cafeId || null,
      description: body.description,
      image: body.image || null,
      price: body.price || null,
      featured: body.featured ?? false,
      published: body.published ?? true,
    }).returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'CREATE',
      resourceType: 'event',
      resourceId: result[0].id,
      changesSummary: generateChangesSummary('CREATE', 'event', result[0].title),
      afterState: result[0],
    });

    return jsonResponse(result[0], HTTP_STATUS.CREATED, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error creating event:', error);
    return errorResponse('Failed to create event', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// PUT /api/admin/events/:id - Update an event
export async function updateEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid event ID' }, HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const body = await request.json() as Partial<NewEvent>;
    const db = getDb(env.DB);

    // Check if event exists
    const existing = await db.select().from(events).where(eq(events.id, id)).get();
    if (!existing) {
      return jsonResponse({ error: 'Event not found' }, HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    const beforeState = existing;

    // If setting this event as featured, remove featured status from all other events
    if (body.featured === true) {
      await db
        .update(events)
        .set({ featured: false })
        .where(and(
          eq(events.featured, true),
          // Don't update the current event (we'll do that in the main update)
          ne(events.id, id)
        ));
    }

    const result = await db
      .update(events)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, id))
      .returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'UPDATE',
      resourceType: 'event',
      resourceId: id,
      changesSummary: generateChangesSummary('UPDATE', 'event', result[0].title, beforeState, result[0]),
      beforeState,
      afterState: result[0],
    });

    return jsonResponse(result[0], HTTP_STATUS.OK, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error updating event:', error);
    return errorResponse('Failed to update event', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// DELETE /api/admin/events/:id - Delete an event
export async function deleteEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid event ID' }, HTTP_STATUS.BAD_REQUEST, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if event exists
    const existing = await db.select().from(events).where(eq(events.id, id)).get();
    if (!existing) {
      return jsonResponse({ error: 'Event not found' }, HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    await db.delete(events).where(eq(events.id, id));

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'DELETE',
      resourceType: 'event',
      resourceId: id,
      changesSummary: generateChangesSummary('DELETE', 'event', existing.title),
      beforeState: existing,
    });

    return jsonResponse({ success: true, message: 'Event deleted' }, HTTP_STATUS.OK, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    console.error('Error deleting event:', error);
    return errorResponse('Failed to delete event', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
