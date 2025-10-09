import { IRequest } from 'itty-router';
import { eq, and, sql } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, drinks, cafes } from '../db';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from '../utils/response';
import { HTTP_STATUS, CACHE_CONSTANTS } from '../constants';

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

// DELETE /api/admin/drinks/:id - Delete drink
export async function deleteDrink(request: IRequest, env: Env): Promise<Response> {
  try {
    const drinkId = parseInt(request.params?.id || '');
    if (isNaN(drinkId)) {
      return badRequestResponse('Invalid drink ID', request as Request, env);
    }

    const db = getDb(env.DB);

    const deleted = await db
      .delete(drinks)
      .where(eq(drinks.id, drinkId))
      .returning();

    if (deleted.length === 0) {
      return notFoundResponse(request as Request, env);
    }

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
