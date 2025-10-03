import { IRequest } from 'itty-router';
import { eq, desc, and } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, events, NewEvent } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';

// GET /api/admin/events - Get all events (including unpublished)
export async function listAllEvents(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');
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

    const results = await query
      .orderBy(desc(events.date))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return jsonResponse(
      { events: items, hasMore },
      200,
      request as Request,
      env,
      'no-store' // Don't cache admin data
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    return errorResponse('Failed to fetch events', 500, request as Request, env);
  }
}

// GET /api/admin/events/:id - Get a single event
export async function getEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid event ID' }, 400, request as Request, env);
    }

    const db = getDb(env.DB);
    const event = await db.select().from(events).where(eq(events.id, id)).get();

    if (!event) {
      return jsonResponse({ error: 'Event not found' }, 404, request as Request, env);
    }

    return jsonResponse(event, 200, request as Request, env, 'no-store');
  } catch (error) {
    console.error('Error fetching event:', error);
    return errorResponse('Failed to fetch event', 500, request as Request, env);
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
        400,
        request as Request,
        env
      );
    }

    const db = getDb(env.DB);

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

    return jsonResponse(result[0], 201, request as Request, env, 'no-store');
  } catch (error) {
    console.error('Error creating event:', error);
    return errorResponse('Failed to create event', 500, request as Request, env);
  }
}

// PUT /api/admin/events/:id - Update an event
export async function updateEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid event ID' }, 400, request as Request, env);
    }

    const body = await request.json() as Partial<NewEvent>;
    const db = getDb(env.DB);

    // Check if event exists
    const existing = await db.select().from(events).where(eq(events.id, id)).get();
    if (!existing) {
      return jsonResponse({ error: 'Event not found' }, 404, request as Request, env);
    }

    const result = await db
      .update(events)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, id))
      .returning();

    return jsonResponse(result[0], 200, request as Request, env, 'no-store');
  } catch (error) {
    console.error('Error updating event:', error);
    return errorResponse('Failed to update event', 500, request as Request, env);
  }
}

// DELETE /api/admin/events/:id - Delete an event
export async function deleteEvent(request: IRequest, env: Env): Promise<Response> {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return jsonResponse({ error: 'Invalid event ID' }, 400, request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if event exists
    const existing = await db.select().from(events).where(eq(events.id, id)).get();
    if (!existing) {
      return jsonResponse({ error: 'Event not found' }, 404, request as Request, env);
    }

    await db.delete(events).where(eq(events.id, id));

    return jsonResponse({ success: true, message: 'Event deleted' }, 200, request as Request, env, 'no-store');
  } catch (error) {
    console.error('Error deleting event:', error);
    return errorResponse('Failed to delete event', 500, request as Request, env);
  }
}
