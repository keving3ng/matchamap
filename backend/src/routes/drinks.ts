import { IRequest } from 'itty-router';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, drinks, cafes } from '../db';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from '../utils/response';
import { HTTP_STATUS, CACHE_CONSTANTS } from '../constants';
import { logAdminAction, generateChangesSummary } from '../utils/auditLog';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /api/admin/cafes/:cafeId/drinks - List drinks for a cafe
export async function listDrinks(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.cafeId || '');
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Verify cafe exists
    const cafeResults = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, cafeId))
      .limit(1);

    if (cafeResults.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    // Get all drinks for this cafe
    const drinksList = await db
      .select()
      .from(drinks)
      .where(eq(drinks.cafeId, cafeId))
      .orderBy(drinks.isDefault); // Default drinks first

    return jsonResponse(
      { drinks: drinksList },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error listing drinks:', error);
    return errorResponse('Failed to fetch drinks', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// POST /api/admin/cafes/:cafeId/drinks - Create drink
export async function createDrink(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.cafeId || '');
    if (isNaN(cafeId)) {
      return badRequestResponse('Invalid cafe ID', request as Request, env);
    }

    const body = await request.json() as any;

    // Validation - only score is required
    if (body.score === undefined || body.score === null) {
      return badRequestResponse('Score is required', request as Request, env);
    }

    // Default name to "Iced Matcha Latte" if not provided
    const drinkName = body.name || 'Iced Matcha Latte';

    const db = getDb(env.DB);

    // Verify cafe exists
    const cafeResults = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, cafeId))
      .limit(1);

    if (cafeResults.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(drinks)
        .set({ isDefault: false })
        .where(eq(drinks.cafeId, cafeId));
    }

    const drinkData = {
      cafeId,
      name: drinkName,
      score: body.score,
      priceAmount: body.priceAmount || null,
      priceCurrency: body.priceCurrency || null,
      gramsUsed: body.gramsUsed || null,
      isDefault: body.isDefault || false,
      notes: body.notes || null,
    };

    const newDrink = await db
      .insert(drinks)
      .values(drinkData)
      .returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'CREATE',
      resourceType: 'drink',
      resourceId: newDrink[0].id,
      changesSummary: generateChangesSummary('CREATE', 'drink', newDrink[0].name ?? undefined),
      afterState: newDrink[0],
    });

    return jsonResponse(
      { drink: newDrink[0] },
      HTTP_STATUS.CREATED,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error creating drink:', error);
    return errorResponse('Failed to create drink', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// PUT /api/admin/drinks/:id - Update drink
export async function updateDrink(request: IRequest, env: Env): Promise<Response> {
  try {
    const drinkId = parseInt(request.params?.id || '');
    if (isNaN(drinkId)) {
      return badRequestResponse('Invalid drink ID', request as Request, env);
    }

    const body = await request.json() as any;
    const db = getDb(env.DB);

    // Check if drink exists and get cafe ID
    const existing = await db
      .select()
      .from(drinks)
      .where(eq(drinks.id, drinkId))
      .limit(1);

    if (existing.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    const drink = existing[0];
    const beforeState = drink;

    // If setting as default, unset other defaults for this cafe
    if (body.isDefault && !drink.isDefault) {
      await db
        .update(drinks)
        .set({ isDefault: false })
        .where(and(eq(drinks.cafeId, drink.cafeId), eq(drinks.id, drinkId)));
    }

    // Default name to "Iced Matcha Latte" if explicitly set to null/empty
    const updateData = {
      ...body,
      ...(body.name === '' || body.name === null ? { name: 'Iced Matcha Latte' } : {}),
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    const updated = await db
      .update(drinks)
      .set(updateData)
      .where(eq(drinks.id, drinkId))
      .returning();

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'UPDATE',
      resourceType: 'drink',
      resourceId: drinkId,
      changesSummary: generateChangesSummary('UPDATE', 'drink', updated[0].name ?? undefined, beforeState, updated[0]),
      beforeState,
      afterState: updated[0],
    });

    return jsonResponse(
      { drink: updated[0] },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error updating drink:', error);
    return errorResponse('Failed to update drink', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// PUT /api/admin/cafes/:cafeId/drinks/:drinkId/set-default - Set drink as default
export async function setDefaultDrink(request: IRequest, env: Env): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.cafeId || '');
    const drinkId = parseInt(request.params?.drinkId || '');
    
    if (isNaN(cafeId) || isNaN(drinkId)) {
      return badRequestResponse('Invalid cafe ID or drink ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Verify cafe exists
    const cafeResults = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, cafeId))
      .limit(1);

    if (cafeResults.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    // Use transaction to ensure atomicity and handle both validation and updates
    let beforeState: any;
    let updated: any[];
    
    try {
      const result = await db.batch([
        // First, get the drink to validate it exists and belongs to this cafe
        db.select()
          .from(drinks)
          .where(and(eq(drinks.id, drinkId), eq(drinks.cafeId, cafeId)))
          .limit(1),
        // Remove default flag from all drinks for this cafe
        db.update(drinks)
          .set({ isDefault: false })
          .where(eq(drinks.cafeId, cafeId)),
        // Set this drink as default
        db.update(drinks)
          .set({ 
            isDefault: true,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(and(eq(drinks.id, drinkId), eq(drinks.cafeId, cafeId)))
          .returning()
      ]);

      const drinkCheck = result[0] as any[];
      updated = result[2] as any[];

      if (drinkCheck.length === 0) {
        return notFoundResponse(request as Request, env);
      }

      if (updated.length === 0) {
        return notFoundResponse(request as Request, env);
      }

      beforeState = drinkCheck[0];
    } catch (error) {
      console.error('Transaction failed:', error);
      return errorResponse('Failed to set default drink', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
    }

    // Get all drinks for this cafe to return
    const allDrinks = await db
      .select()
      .from(drinks)
      .where(eq(drinks.cafeId, cafeId))
      .orderBy(drinks.isDefault); // Default drinks first

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'UPDATE',
      resourceType: 'drink',
      resourceId: drinkId,
      changesSummary: generateChangesSummary('UPDATE', 'drink', updated[0].name ?? undefined, beforeState, updated[0]),
      beforeState,
      afterState: updated[0],
    });

    return jsonResponse(
      { 
        message: 'Default drink updated successfully',
        drink: updated[0],
        drinks: allDrinks
      },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error setting default drink:', error);
    return errorResponse('Failed to set default drink', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// DELETE /api/admin/drinks/:id - Delete drink
export async function deleteDrink(request: IRequest, env: Env): Promise<Response> {
  try {
    const drinkId = parseInt(request.params?.id || '');
    if (isNaN(drinkId)) {
      return badRequestResponse('Invalid drink ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get the drink before deletion for audit log
    const beforeDelete = await db
      .select()
      .from(drinks)
      .where(eq(drinks.id, drinkId))
      .limit(1);

    if (beforeDelete.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    const deleted = await db
      .delete(drinks)
      .where(eq(drinks.id, drinkId))
      .returning();

    if (deleted.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    // Log the audit action
    await logAdminAction(request as AuthenticatedRequest, env, {
      action: 'DELETE',
      resourceType: 'drink',
      resourceId: drinkId,
      changesSummary: generateChangesSummary('DELETE', 'drink', beforeDelete[0].name ?? undefined),
      beforeState: beforeDelete[0],
    });

    return jsonResponse(
      { message: 'Drink deleted successfully' },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.NO_STORE
    );
  } catch (error) {
    console.error('Error deleting drink:', error);
    return errorResponse('Failed to delete drink', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// GET /api/drinks - List all drinks with filtering and pagination
export async function getDrinks(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const cafeId = url.searchParams.get('cafeId');
    const minScore = url.searchParams.get('minScore');
    const maxPrice = url.searchParams.get('maxPrice');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sort = url.searchParams.get('sort') || 'score';
    const order = url.searchParams.get('order') || 'desc';

    // Validate parameters
    if (cafeId && isNaN(parseInt(cafeId))) {
      return badRequestResponse('Invalid cafeId parameter', request as Request, env);
    }
    if (minScore && isNaN(parseFloat(minScore))) {
      return badRequestResponse('Invalid minScore parameter', request as Request, env);
    }
    if (maxPrice && isNaN(parseFloat(maxPrice))) {
      return badRequestResponse('Invalid maxPrice parameter', request as Request, env);
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return badRequestResponse('Invalid limit parameter (1-100)', request as Request, env);
    }
    if (isNaN(offset) || offset < 0) {
      return badRequestResponse('Invalid offset parameter', request as Request, env);
    }
    if (!['name', 'score', 'price', 'createdAt'].includes(sort)) {
      return badRequestResponse('Invalid sort parameter', request as Request, env);
    }
    if (!['asc', 'desc'].includes(order)) {
      return badRequestResponse('Invalid order parameter', request as Request, env);
    }

    const db = getDb(env.DB);

    // Build the query with filters
    let query = db
      .select({
        id: drinks.id,
        name: drinks.name,
        description: drinks.description,
        score: drinks.score,
        priceAmount: drinks.priceAmount,
        price: drinks.priceAmount, // Alias for backward compatibility
        priceCurrency: drinks.priceCurrency,
        gramsUsed: drinks.gramsUsed,
        isDefault: drinks.isDefault,
        createdAt: drinks.createdAt,
        updatedAt: drinks.updatedAt,
        cafeId: drinks.cafeId,
        cafe: {
          id: cafes.id,
          name: cafes.name,
          slug: cafes.slug,
          city: cafes.city,
        },
      })
      .from(drinks)
      .leftJoin(cafes, eq(drinks.cafeId, cafes.id));

    // Apply filters
    const conditions = [];
    if (cafeId) {
      conditions.push(eq(drinks.cafeId, parseInt(cafeId)));
    }
    if (minScore) {
      conditions.push(sql`${drinks.score} >= ${parseFloat(minScore)}`);
    }
    if (maxPrice) {
      conditions.push(sql`${drinks.priceAmount} <= ${parseFloat(maxPrice)}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sort === 'price' ? drinks.priceAmount : drinks[sort as keyof typeof drinks];
    query = query.orderBy(order === 'desc' ? desc(sortColumn) : asc(sortColumn));

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql`COUNT(*)` })
      .from(drinks)
      .leftJoin(cafes, eq(drinks.cafeId, cafes.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [results, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    const total = Number(countResult[0]?.count || 0);
    const hasMore = offset + limit < total;

    return jsonResponse(
      {
        drinks: results,
        total,
        hasMore,
        pagination: {
          limit,
          offset,
          total,
        },
      },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.PUBLIC_CACHE
    );
  } catch (error) {
    console.error('Error fetching drinks:', error);
    return errorResponse('Failed to fetch drinks', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// GET /api/drinks/:id - Get single drink with cafe information
export async function getDrink(request: IRequest, env: Env): Promise<Response> {
  try {
    const drinkId = parseInt(request.params?.id || '');
    if (isNaN(drinkId)) {
      return badRequestResponse('Invalid drink ID', request as Request, env);
    }

    const db = getDb(env.DB);

    const result = await db
      .select({
        id: drinks.id,
        name: drinks.name,
        description: drinks.description,
        score: drinks.score,
        priceAmount: drinks.priceAmount,
        price: drinks.priceAmount, // Alias for backward compatibility
        priceCurrency: drinks.priceCurrency,
        gramsUsed: drinks.gramsUsed,
        isDefault: drinks.isDefault,
        createdAt: drinks.createdAt,
        updatedAt: drinks.updatedAt,
        cafeId: drinks.cafeId,
        cafe: {
          id: cafes.id,
          name: cafes.name,
          slug: cafes.slug,
          city: cafes.city,
          latitude: cafes.latitude,
          longitude: cafes.longitude,
        },
      })
      .from(drinks)
      .leftJoin(cafes, eq(drinks.cafeId, cafes.id))
      .where(eq(drinks.id, drinkId))
      .limit(1);

    if (result.length === 0) {
      return notFoundResponse(request as Request, env);
    }

    return jsonResponse(
      { drink: result[0] },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_CONSTANTS.PUBLIC_CACHE
    );
  } catch (error) {
    console.error('Error fetching drink:', error);
    return errorResponse('Failed to fetch drink', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
