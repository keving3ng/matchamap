import { IRequest } from 'itty-router';
import { sql, isNull, count, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, cafes } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';
import type { CityWithCount } from '../../../shared/types';

/**
 * GET /api/cities - List all cities with their cafe counts
 * Only returns cities that have at least one non-deleted cafe
 */
export async function listCities(request: IRequest, env: Env): Promise<Response> {
  try {
    const db = getDb(env.DB);

    // Query to get cities with their cafe counts
    // Only include cities with at least one non-deleted cafe
    const cityResults = await db
      .select({
        city: cafes.city,
        cafe_count: count(cafes.id).as('cafe_count'),
      })
      .from(cafes)
      .where(isNull(cafes.deletedAt))
      .groupBy(cafes.city)
      .having(sql`count(${cafes.id}) > 0`)
      .orderBy(desc(count(cafes.id)), cafes.city);

    const cities: CityWithCount[] = cityResults.map(result => ({
      city: result.city,
      cafe_count: result.cafe_count,
    }));

    return jsonResponse(
      { cities },
      200,
      request as Request,
      env,
      'public, max-age=300' // 5 min cache since city counts don't change often
    );
  } catch (error) {
    console.error('Error listing cities:', error);
    return errorResponse('Failed to fetch cities', 500, request as Request, env);
  }
}