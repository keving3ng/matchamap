import { IRequest } from 'itty-router';
import { eq, isNull, sql, and } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, neighborhoods, cafes } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';

// GET /api/neighborhoods - Get neighborhoods with cafe counts
export async function listNeighborhoods(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') || 'toronto';

    const db = getDb(env.DB);

    // Fetch neighborhoods with cafe counts (excluding deleted cafes)
    const results = await db
      .select({
        id: neighborhoods.id,
        name: neighborhoods.name,
        city: neighborhoods.city,
        cafeCount: sql<number>`count(${cafes.id})`,
      })
      .from(neighborhoods)
      .leftJoin(
        cafes,
        and(
          eq(neighborhoods.id, cafes.neighborhoodId),
          isNull(cafes.deletedAt)
        )
      )
      .where(eq(neighborhoods.city, city))
      .groupBy(neighborhoods.id);

    return jsonResponse(
      { neighborhoods: results },
      200,
      request as Request,
      env,
      'public, max-age=300' // 5 min cache
    );
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return errorResponse('Failed to fetch neighborhoods', 500, request as Request, env);
  }
}
