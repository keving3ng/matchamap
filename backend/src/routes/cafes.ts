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
    const city = url.searchParams.get('city'); // Optional - no default
    const minScore = url.searchParams.get('minScore');
    const maxPrice = url.searchParams.get('maxPrice');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const db = getDb(env.DB);

    // Build query conditions - only exclude deleted
    const conditions = [isNull(cafes.deletedAt)];

    // Add optional city filter if provided
    if (city) {
      if (!['toronto', 'montreal', 'tokyo'].includes(city)) {
        return badRequestResponse('Invalid city parameter', request as Request, env);
      }
      conditions.push(eq(cafes.city, city));
    }

    // Add optional filters
    if (minScore) {
      const score = parseFloat(minScore);
      if (isNaN(score) || score < 0 || score > 10) {
        return badRequestResponse('Invalid minScore parameter', request as Request, env);
      }
      conditions.push(gte(cafes.score, score));
    }
    if (maxPrice) {
      const priceValue = parseFloat(maxPrice);
      if (isNaN(priceValue)) {
        return badRequestResponse('Invalid maxPrice parameter', request as Request, env);
      }
      conditions.push(lte(cafes.price, priceValue));
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

    // Fetch drinks for all cafes and calculate display scores
    const cafesWithScores = await Promise.all(
      cafesList.map(async (cafe) => {
        const cafeDrinks = await db
          .select()
          .from(drinks)
          .where(eq(drinks.cafeId, cafe.id));

        // Calculate display score: default drink OR highest score OR legacy cafe.score
        let displayScore = cafe.score || null;
        if (cafeDrinks.length > 0) {
          const defaultDrink = cafeDrinks.find(d => d.isDefault);
          if (defaultDrink) {
            displayScore = defaultDrink.score;
          } else {
            displayScore = Math.max(...cafeDrinks.map(d => d.score));
          }
        }

        return {
          ...cafe,
          displayScore,
          drinks: cafeDrinks,
        };
      })
    );

    // Get total count for this filter
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cafes)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    const response = {
      cafes: cafesWithScores,
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
    if (!body.name || !body.latitude || !body.longitude || !body.link) {
      return badRequestResponse('Missing required fields', request as Request, env);
    }

    const db = getDb(env.DB);
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');

    // Check if a cafe with this slug already exists (including soft-deleted)
    const existing = await db
      .select()
      .from(cafes)
      .where(eq(cafes.slug, slug))
      .limit(1);

    const cafeData = {
      name: body.name,
      slug,
      link: body.link,
      latitude: body.latitude,
      longitude: body.longitude,
      city: body.city || 'toronto',
      score: body.score,
      ambianceScore: body.ambianceScore,
      otherDrinksScore: body.otherDrinksScore,
      price: body.price,
      chargeForAltMilk: body.chargeForAltMilk || false,
      gramsUsed: body.gramsUsed,
      quickNote: body.quickNote,
      review: body.review,
      hours: body.hours,
      instagram: body.instagram,
      instagramPostLink: body.instagramPostLink,
      tiktokPostLink: body.tiktokPostLink,
      images: body.images,
    };

    // If cafe exists and is soft-deleted, undelete and update it
    if (existing.length > 0 && existing[0].deletedAt) {
      const updated = await db
        .update(cafes)
        .set({
          ...cafeData,
          deletedAt: null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(cafes.id, existing[0].id))
        .returning();

      return jsonResponse(
        { cafe: updated[0] },
        201,
        request as Request,
        env,
        'no-store'
      );
    }

    // If cafe exists and is NOT deleted, return error
    if (existing.length > 0) {
      return errorResponse('Cafe with this slug already exists', 409, request as Request, env);
    }

    // Otherwise, insert new cafe
    const newCafe = await db
      .insert(cafes)
      .values(cafeData)
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
