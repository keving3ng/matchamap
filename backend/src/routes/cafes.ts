import { IRequest } from 'itty-router';
import { eq, isNull, and, gte, lte, sql } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, cafes, drinks } from '../db';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from '../utils/response';

// GET /api/cafes - List cafes with optional filtering
export async function listCafes(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') || 'toronto';
    const neighborhood = url.searchParams.get('neighborhood');
    const minScore = url.searchParams.get('minScore');
    const maxPrice = url.searchParams.get('maxPrice');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const db = getDb(env.DB);

    // Build query conditions
    const conditions = [isNull(cafes.deletedAt)];

    // Validate and add city filter
    if (!['toronto', 'montreal', 'tokyo'].includes(city)) {
      return badRequestResponse('Invalid city parameter', request as Request, env);
    }
    conditions.push(eq(cafes.city, city));

    // Add optional filters
    if (neighborhood) {
      const neighborhoodId = parseInt(neighborhood);
      if (!isNaN(neighborhoodId)) {
        conditions.push(eq(cafes.neighborhoodId, neighborhoodId));
      }
    }
    if (minScore) {
      const score = parseFloat(minScore);
      if (isNaN(score) || score < 0 || score > 10) {
        return badRequestResponse('Invalid minScore parameter', request as Request, env);
      }
      conditions.push(gte(cafes.score, score));
    }
    if (maxPrice) {
      if (!['$', '$$', '$$$'].includes(maxPrice)) {
        return badRequestResponse('Invalid maxPrice parameter', request as Request, env);
      }
      conditions.push(lte(cafes.priceRange, maxPrice));
    }

    // Execute query with pagination
    const results = await db
      .select()
      .from(cafes)
      .where(and(...conditions))
      .limit(limit + 1) // Fetch one extra to check if there are more
      .offset(offset);

    const hasMore = results.length > limit;
    const cafesList = hasMore ? results.slice(0, limit) : results;

    // Get total count for this filter
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cafes)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    const response = {
      cafes: cafesList,
      total,
      hasMore,
    };

    return jsonResponse(
      response,
      200,
      request as Request,
      env,
      'public, max-age=300' // 5 min cache
    );
  } catch (error) {
    console.error('Error listing cafes:', error);
    return errorResponse('Failed to fetch cafes', 500, request as Request, env);
  }
}

// GET /api/cafes/:id - Get single cafe with drinks
export async function getCafe(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.id || '');
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Fetch cafe
    const cafeResults = await db
      .select()
      .from(cafes)
      .where(and(eq(cafes.id, cafeId), isNull(cafes.deletedAt)))
      .limit(1);

    if (cafeResults.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    const cafe = cafeResults[0];

    // Fetch drinks for this cafe
    const cafedrinks = await db
      .select()
      .from(drinks)
      .where(eq(drinks.cafeId, cafeId));

    const response = {
      cafe,
      drinks: cafedrinks,
    };

    return jsonResponse(
      response,
      200,
      request as Request,
      env,
      'public, max-age=300' // 5 min cache
    );
  } catch (error) {
    console.error('Error fetching cafe:', error);
    return errorResponse('Failed to fetch cafe', 500, request as Request, env);
  }
}

// POST /api/admin/cafes - Create new cafe
export async function createCafe(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;

    // Basic validation
    if (!body.name || !body.lat || !body.lng || !body.score) {
      return badRequestResponse('Missing required fields', request as Request, env);
    }

    const db = getDb(env.DB);

    const newCafe = await db
      .insert(cafes)
      .values({
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        lat: body.lat,
        lng: body.lng,
        address: body.address,
        city: body.city || 'toronto',
        neighborhoodId: body.neighborhoodId,
        score: body.score,
        valueScore: body.valueScore,
        ambianceScore: body.ambianceScore,
        otherDrinksScore: body.otherDrinksScore,
        priceRange: body.priceRange,
        chargeForAltMilk: body.chargeForAltMilk || false,
        quickNote: body.quickNote,
        review: body.review,
        comments: body.comments,
        menuHighlights: body.menuHighlights,
        hours: body.hours,
        instagram: body.instagram,
        tiktok: body.tiktok,
        googleMapsUrl: body.googleMapsUrl,
        emoji: body.emoji || '🍵',
        color: body.color || '#7cb342',
      })
      .returning();

    return jsonResponse(
      { cafe: newCafe[0] },
      201,
      request as Request,
      env,
      'no-store'
    );
  } catch (error) {
    console.error('Error creating cafe:', error);
    return errorResponse('Failed to create cafe', 500, request as Request, env);
  }
}

// PUT /api/admin/cafes/:id - Update cafe
export async function updateCafe(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.id || '');
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const body = await request.json() as any;
    const db = getDb(env.DB);

    // Check if cafe exists
    const existing = await db
      .select()
      .from(cafes)
      .where(and(eq(cafes.id, cafeId), isNull(cafes.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    const updated = await db
      .update(cafes)
      .set({
        ...(body as Record<string, any>),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(cafes.id, cafeId))
      .returning();

    return jsonResponse(
      { cafe: updated[0] },
      200,
      request as Request,
      env,
      'no-store'
    );
  } catch (error) {
    console.error('Error updating cafe:', error);
    return errorResponse('Failed to update cafe', 500, request as Request, env);
  }
}

// DELETE /api/admin/cafes/:id - Soft delete cafe
export async function deleteCafe(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.id || '');
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Soft delete by setting deletedAt
    const deleted = await db
      .update(cafes)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(cafes.id, cafeId))
      .returning();

    if (deleted.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    return jsonResponse(
      { message: 'Cafe deleted successfully' },
      200,
      request as Request,
      env,
      'no-store'
    );
  } catch (error) {
    console.error('Error deleting cafe:', error);
    return errorResponse('Failed to delete cafe', 500, request as Request, env);
  }
}
