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
import { 
  safeValidate, 
  createDrinkRequestSchema, 
  updateDrinkRequestSchema, 
  getDrinksQuerySchema 
} from '../validators';

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

    const body = await request.json();

    // Validate input using Zod schema
    const validation = safeValidate(createDrinkRequestSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const validatedData = validation.data;

    // Default name to "Iced Matcha Latte" if not provided
    const drinkName = validatedData.name || 'Iced Matcha Latte';

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
    if (validatedData.isDefault) {
      await db
        .update(drinks)
        .set({ isDefault: false })
        .where(eq(drinks.cafeId, cafeId));
    }

    const drinkData = {
      cafeId,
      name: drinkName,
      score: validatedData.score,
      priceAmount: validatedData.priceAmount || null,
      priceCurrency: validatedData.priceCurrency || null,
      gramsUsed: validatedData.gramsUsed || null,
      isDefault: validatedData.isDefault || false,
      notes: validatedData.notes || null,
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

    const body = await request.json();

    // Validate input using Zod schema
    const validation = safeValidate(updateDrinkRequestSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const validatedData = validation.data;
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
    if (validatedData.isDefault && !drink.isDefault) {
      await db
        .update(drinks)
        .set({ isDefault: false })
        .where(and(eq(drinks.cafeId, drink.cafeId), eq(drinks.id, drinkId)));
    }

    // Default name to "Iced Matcha Latte" if explicitly set to null/empty
    const updateData = {
      ...validatedData,
      ...(validatedData.name === '' || validatedData.name === null ? { name: 'Iced Matcha Latte' } : {}),
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
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Validate query parameters using Zod schema
    const validation = safeValidate(getDrinksQuerySchema, queryParams);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const { cafeId, minScore, maxPrice, limit, offset, sort, order } = validation.data;

    const db = getDb(env.DB);

    // Build the query with filters
    let query = db
      .select({
        id: drinks.id,
        name: drinks.name,
        score: drinks.score,
        priceAmount: drinks.priceAmount,
        price: drinks.priceAmount, // Alias for backward compatibility
        priceCurrency: drinks.priceCurrency,
        gramsUsed: drinks.gramsUsed,
        isDefault: drinks.isDefault,
        notes: drinks.notes,
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
      conditions.push(eq(drinks.cafeId, cafeId));
    }
    if (minScore) {
      conditions.push(sql`${drinks.score} >= ${minScore}`);
    }
    if (maxPrice) {
      conditions.push(sql`${drinks.priceAmount} <= ${maxPrice}`);
    }

    // Apply filtering and sorting
    const sortColumn = sort === 'price' ? drinks.priceAmount : sort === 'score' ? drinks.score : drinks.id;
    const orderByFn = order === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const finalQuery = conditions.length > 0
      ? query.where(and(...conditions)).orderBy(orderByFn)
      : query.orderBy(orderByFn);

    // Get total count for pagination
    const baseCountQuery = db
      .select({ count: sql`COUNT(*)` })
      .from(drinks)
      .leftJoin(cafes, eq(drinks.cafeId, cafes.id));

    const countQuery = conditions.length > 0
      ? baseCountQuery.where(and(...conditions))
      : baseCountQuery;

    const [results, countResult] = await Promise.all([
      finalQuery.limit(limit ?? 20).offset(offset ?? 0),
      countQuery
    ]);

    const total = Number(countResult[0]?.count || 0);
    const hasMore = (offset ?? 0) + (limit ?? 20) < total;

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
        score: drinks.score,
        priceAmount: drinks.priceAmount,
        price: drinks.priceAmount, // Alias for backward compatibility
        priceCurrency: drinks.priceCurrency,
        gramsUsed: drinks.gramsUsed,
        isDefault: drinks.isDefault,
        notes: drinks.notes,
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
