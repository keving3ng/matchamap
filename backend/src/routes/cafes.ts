import { IRequest } from 'itty-router';
import { eq, isNull, and, gte, lte, sql, like, or, inArray } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, cafes, drinks, userReviews } from '../db';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from '../utils/response';
import { HTTP_STATUS, PAGINATION_CONSTANTS, CACHE_CONSTANTS } from '../constants';
import { logAdminAction, generateChangesSummary } from '../utils/auditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { VALID_CITY_KEYS } from '../../../shared/types';

// GET /api/cafes - List cafes with optional filtering and search
export async function listCafes(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get('city'); // Optional - no default
    const minScore = url.searchParams.get('minScore');
    const maxPrice = url.searchParams.get('maxPrice');
    const search = url.searchParams.get('search'); // New search parameter
    const userMinRating = url.searchParams.get('userMinRating'); // User rating filter
    const userMaxRating = url.searchParams.get('userMaxRating'); // User rating filter
    const limit = Math.min(parseInt(url.searchParams.get('limit') || PAGINATION_CONSTANTS.CAFES_DEFAULT_LIMIT.toString()), PAGINATION_CONSTANTS.CAFES_MAX_LIMIT);
    const offset = parseInt(url.searchParams.get('offset') || PAGINATION_CONSTANTS.DEFAULT_OFFSET.toString());

    const db = getDb(env.DB);

    // Build base query conditions - only exclude deleted
    const conditions = [isNull(cafes.deletedAt)];

    // Add optional city filter if provided
    if (city) {
      if (!['toronto', 'montreal', 'tokyo'].includes(city)) {
        return badRequestResponse('Invalid city parameter', request as Request, env);
      }
      conditions.push(eq(cafes.city, city));
    }

    // Add user rating filters if provided
    if (userMinRating) {
      const minRating = parseFloat(userMinRating);
      if (!isNaN(minRating) && minRating >= 0 && minRating <= 10) {
        conditions.push(gte(cafes.userRatingAvg, minRating));
      }
    }

    if (userMaxRating) {
      const maxRating = parseFloat(userMaxRating);
      if (!isNaN(maxRating) && maxRating >= 0 && maxRating <= 10) {
        conditions.push(lte(cafes.userRatingAvg, maxRating));
      }
    }

    let results: typeof cafes.$inferSelect[] = [];

    // If search query provided, perform enhanced search
    if (search && search.trim().length > 0) {
      // Sanitize search query
      const MAX_SEARCH_LENGTH = 100;
      const sanitizedSearch = search.trim().substring(0, MAX_SEARCH_LENGTH);

      // Escape SQL wildcards to prevent abuse
      const escapedSearch = sanitizedSearch.replace(/[%_]/g, '\\$&');
      const searchTerm = `%${escapedSearch.toLowerCase()}%`;
      
      // Get cafe IDs that match search criteria
      const searchResults = await db
        .select({ 
          cafeId: sql<number>`DISTINCT ${cafes.id}`,
          relevanceScore: sql<number>`
            CASE 
              WHEN LOWER(${cafes.name}) LIKE ${searchTerm} THEN 3
              WHEN LOWER(${cafes.quickNote}) LIKE ${searchTerm} THEN 2
              WHEN LOWER(${cafes.address}) LIKE ${searchTerm} THEN 1
              ELSE 0
            END +
            CASE 
              WHEN ${userReviews.content} IS NOT NULL AND LOWER(${userReviews.content}) LIKE ${searchTerm} THEN 2
              WHEN ${userReviews.tags} IS NOT NULL AND LOWER(${userReviews.tags}) LIKE ${searchTerm} THEN 1
              ELSE 0
            END
          `
        })
        .from(cafes)
        .leftJoin(userReviews, and(
          eq(userReviews.cafeId, cafes.id),
          eq(userReviews.moderationStatus, 'approved'),
          eq(userReviews.isPublic, true)
        ))
        .where(and(
          ...conditions,
          or(
            like(sql`LOWER(${cafes.name})`, searchTerm),
            like(sql`LOWER(${cafes.quickNote})`, searchTerm),
            like(sql`LOWER(${cafes.address})`, searchTerm),
            and(
              sql`${userReviews.content} IS NOT NULL`,
              like(sql`LOWER(${userReviews.content})`, searchTerm)
            ),
            and(
              sql`${userReviews.tags} IS NOT NULL`,
              like(sql`LOWER(${userReviews.tags})`, searchTerm)
            )
          )
        ))
        .orderBy(sql`relevanceScore DESC`)
        .limit(limit + 1)
        .offset(offset);

      // Extract cafe IDs and fetch full cafe data
      const cafeIds = searchResults.map(r => r.cafeId);

      if (cafeIds.length === 0) {
        results = [];
      } else {
        // Use inArray for safe SQL injection prevention
        results = await db
          .select()
          .from(cafes)
          .where(inArray(cafes.id, cafeIds))
          .orderBy(sql`
            CASE ${cafes.id}
              ${sql.join(
                cafeIds.map((id, index) => sql`WHEN ${id} THEN ${index}`),
                sql` `
              )}
            END
          `);
      }
    } else {
      // Regular query without search
      results = await db
        .select()
        .from(cafes)
        .where(and(...conditions))
        .limit(limit + 1)
        .offset(offset);
    }

    const hasMore = results.length > limit;
    const cafesList = hasMore ? results.slice(0, limit) : results;

    // Batch fetch drinks for all cafes (fix N+1 query problem)
    const cafeIds = cafesList.map(cafe => cafe.id);
    const allDrinks = cafeIds.length > 0
      ? await db
          .select()
          .from(drinks)
          .where(inArray(drinks.cafeId, cafeIds))
      : [];

    // Group drinks by cafe ID
    const drinksByCafeId = new Map<number, typeof allDrinks>();
    for (const drink of allDrinks) {
      if (!drinksByCafeId.has(drink.cafeId)) {
        drinksByCafeId.set(drink.cafeId, []);
      }
      drinksByCafeId.get(drink.cafeId)!.push(drink);
    }

    // Batch fetch review snippets if search was performed
    let reviewSnippetsByCafeId = new Map<number, any[]>();
    if (search && search.trim().length > 0 && cafeIds.length > 0) {
      // Sanitize search query (reuse same logic)
      const MAX_SEARCH_LENGTH = 100;
      const sanitizedSearch = search.trim().substring(0, MAX_SEARCH_LENGTH);
      const escapedSearch = sanitizedSearch.replace(/[%_]/g, '\\$&');
      const searchTerm = `%${escapedSearch.toLowerCase()}%`;

      const allReviewSnippets = await db
        .select({
          cafeId: userReviews.cafeId,
          id: userReviews.id,
          content: userReviews.content,
          tags: userReviews.tags,
          overallRating: userReviews.overallRating,
          createdAt: userReviews.createdAt
        })
        .from(userReviews)
        .where(and(
          inArray(userReviews.cafeId, cafeIds),
          eq(userReviews.moderationStatus, 'approved'),
          eq(userReviews.isPublic, true),
          or(
            like(sql`LOWER(${userReviews.content})`, searchTerm),
            like(sql`LOWER(${userReviews.tags})`, searchTerm)
          )
        ))
        .orderBy(sql`${userReviews.overallRating} DESC`);

      // Group snippets by cafe ID (limit to 2 per cafe)
      for (const snippet of allReviewSnippets) {
        if (!reviewSnippetsByCafeId.has(snippet.cafeId)) {
          reviewSnippetsByCafeId.set(snippet.cafeId, []);
        }
        const cafeSnippets = reviewSnippetsByCafeId.get(snippet.cafeId)!;
        if (cafeSnippets.length < 2) {
          cafeSnippets.push(snippet);
        }
      }
    }

    // Build cafe data with drinks and review snippets
    const cafesWithScores = cafesList.map((cafe) => {
      const cafeDrinks = drinksByCafeId.get(cafe.id) || [];

      // Calculate display score: default drink OR highest score
      let displayScore: number | null = null;
      if (cafeDrinks.length > 0) {
        const defaultDrink = cafeDrinks.find(d => d.isDefault);
        if (defaultDrink) {
          displayScore = defaultDrink.score;
        } else {
          displayScore = Math.max(...cafeDrinks.map(d => d.score));
        }
      }

      const reviewSnippets = reviewSnippetsByCafeId.get(cafe.id) || [];

      return {
        ...cafe,
        displayScore,
        drinks: cafeDrinks,
        reviewSnippets: reviewSnippets.map(snippet => {
          try {
            return {
              ...snippet,
              tags: snippet.tags ? JSON.parse(snippet.tags) : null,
              // Truncate content for snippet display
              content: snippet.content.length > 150
                ? snippet.content.substring(0, 150) + '...'
                : snippet.content
            };
          } catch (error) {
            // Handle JSON.parse errors gracefully
            console.error(`Failed to parse tags for review ${snippet.id}:`, error);
            return {
              ...snippet,
              tags: null,
              content: snippet.content.length > 150
                ? snippet.content.substring(0, 150) + '...'
                : snippet.content
            };
          }
        })
      };
    });

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
      HTTP_STATUS.OK,
      request as Request,
      env,
`${CACHE_CONSTANTS.PUBLIC_CACHE}, max-age=${CACHE_CONSTANTS.PUBLIC_CACHE_MAX_AGE}` // 5 min cache
    );
  } catch (error) {
    console.error('Error listing cafes:', error);
    return errorResponse('Failed to fetch cafes', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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
      HTTP_STATUS.OK,
      request as Request,
      env,
`${CACHE_CONSTANTS.PUBLIC_CACHE}, max-age=${CACHE_CONSTANTS.PUBLIC_CACHE_MAX_AGE}` // 5 min cache
    );
  } catch (error) {
    console.error('Error fetching cafe:', error);
    return errorResponse('Failed to fetch cafe', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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

    // Validate city key
    const cityKey = (body.city || 'toronto').toLowerCase();
    if (!VALID_CITY_KEYS.includes(cityKey as any)) {
      return badRequestResponse(
        `Invalid city. Must be one of: ${VALID_CITY_KEYS.join(', ')}`,
        request as Request,
        env
      );
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
      address: body.address || null,
      latitude: body.latitude,
      longitude: body.longitude,
      city: cityKey, // Already validated and normalized
      ambianceScore: body.ambianceScore ?? null,
      chargeForAltMilk: body.chargeForAltMilk ?? null,
      quickNote: body.quickNote,
      review: body.review || null,
      source: body.source || null,
      hours: body.hours || null,
      instagram: body.instagram || null,
      instagramPostLink: body.instagramPostLink || null,
      tiktokPostLink: body.tiktokPostLink || null,
      images: body.images || null,
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

      // Log the audit action (restore + update)
      await logAdminAction(request as AuthenticatedRequest, env, {
        action: 'CREATE',
        resourceType: 'cafe',
        resourceId: updated[0].id,
        changesSummary: generateChangesSummary('CREATE', 'cafe', updated[0].name),
        afterState: updated[0],
      });

      return jsonResponse(
        { cafe: updated[0] },
        HTTP_STATUS.CREATED,
        request as Request,
        env,
        CACHE_CONSTANTS.NO_STORE
      );
    }

    // If cafe exists and is NOT deleted, return error
    if (existing.length > 0) {
      return errorResponse('Cafe with this slug already exists', HTTP_STATUS.CONFLICT, request as Request, env);
    }

    // Otherwise, insert new cafe
    const newCafe = await db
      .insert(cafes)
      .values(cafeData)
      .returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'CREATE',
      resourceType: 'cafe',
      resourceId: newCafe[0].id,
      changesSummary: generateChangesSummary('CREATE', 'cafe', newCafe[0].name),
      afterState: newCafe[0],
    });

    return jsonResponse(
      { cafe: newCafe[0] },
      HTTP_STATUS.CREATED,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error creating cafe:', error);
    return errorResponse('Failed to create cafe', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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

    const beforeState = existing[0];

    // Build update object with only valid cafe fields (matching current schema)
    const updateData: Record<string, any> = {};

    // Basic fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;

    // Location
    if (body.link !== undefined) updateData.link = body.link;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.city !== undefined) {
      const cityKey = body.city.toLowerCase();
      if (!VALID_CITY_KEYS.includes(cityKey as any)) {
        return badRequestResponse(
          `Invalid city. Must be one of: ${VALID_CITY_KEYS.join(', ')}`,
          request as Request,
          env
        );
      }
      updateData.city = cityKey;
    }

    // Ratings
    if (body.ambianceScore !== undefined) updateData.ambianceScore = body.ambianceScore ?? null;

    // Pricing
    if (body.chargeForAltMilk !== undefined) updateData.chargeForAltMilk = body.chargeForAltMilk ?? null;

    // Content
    if (body.quickNote !== undefined) updateData.quickNote = body.quickNote;
    if (body.review !== undefined) updateData.review = body.review || null;
    if (body.source !== undefined) updateData.source = body.source || null;

    // Contact/Social
    if (body.hours !== undefined) updateData.hours = body.hours || null;
    if (body.instagram !== undefined) updateData.instagram = body.instagram || null;
    if (body.instagramPostLink !== undefined) updateData.instagramPostLink = body.instagramPostLink || null;
    if (body.tiktokPostLink !== undefined) updateData.tiktokPostLink = body.tiktokPostLink || null;

    // Media
    if (body.images !== undefined) updateData.images = body.images || null;

    // Always update timestamp
    updateData.updatedAt = sql`CURRENT_TIMESTAMP`;

    const updated = await db
      .update(cafes)
      .set(updateData)
      .where(eq(cafes.id, cafeId))
      .returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'UPDATE',
      resourceType: 'cafe',
      resourceId: cafeId,
      changesSummary: generateChangesSummary('UPDATE', 'cafe', updated[0].name, beforeState, updated[0]),
      beforeState,
      afterState: updated[0],
    });

    return jsonResponse(
      { cafe: updated[0] },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error updating cafe:', error);
    return errorResponse('Failed to update cafe', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
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

    // Get the cafe before deletion for audit log
    const beforeDelete = await db
      .select()
      .from(cafes)
      .where(and(eq(cafes.id, cafeId), isNull(cafes.deletedAt)))
      .limit(1);

    if (beforeDelete.length === 0) {
      return notFoundResponse(request as Request, env);
    }

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

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'DELETE',
      resourceType: 'cafe',
      resourceId: cafeId,
      changesSummary: generateChangesSummary('DELETE', 'cafe', beforeDelete[0].name),
      beforeState: beforeDelete[0],
    });

    return jsonResponse(
      { message: 'Cafe deleted successfully' },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error deleting cafe:', error);
    return errorResponse('Failed to delete cafe', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
