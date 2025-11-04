/**
 * Recommendation API Routes
 *
 * Endpoints:
 * - GET /api/recommendations/for-you - Personalized recommendations
 * - GET /api/recommendations/trending - Trending cafes
 * - GET /api/recommendations/similar/:cafeId - Similar cafes
 */

import { IRequest } from 'itty-router';
import { Env } from '../types';
import { getDb, cafes } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  jsonResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} from '../utils/response';
import { HTTP_STATUS } from '../constants';
import {
  generateRecommendations,
  getSimilarCafeRecommendations,
  getTrendingRecommendations,
  type UserLocation,
} from '../utils/recommendations';
import { eq, isNull, inArray } from 'drizzle-orm';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes for personalized recommendations
const TRENDING_CACHE_DURATION = 600; // 10 minutes for trending
const SIMILAR_CACHE_DURATION = 1800; // 30 minutes for similar cafes

/**
 * GET /api/recommendations/for-you
 * Get personalized cafe recommendations for authenticated user
 *
 * Query params:
 * - lat: User's latitude (optional)
 * - lng: User's longitude (optional)
 * - limit: Number of recommendations (default: 10, max: 20)
 * - variant: A/B test variant ('A' or 'B', default: 'A')
 */
export async function getForYouRecommendations(
  request: AuthenticatedRequest,
  env: Env
): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        request as Request,
        env
      );
    }

    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const limitParam = url.searchParams.get('limit');
    const variantParam = url.searchParams.get('variant');

    // Parse location if provided
    let userLocation: UserLocation | undefined;
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return badRequestResponse(
          'Invalid location coordinates',
          request as Request,
          env
        );
      }

      userLocation = { latitude, longitude };
    }

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return badRequestResponse(
        'Limit must be between 1 and 20',
        request as Request,
        env
      );
    }

    // Parse A/B test variant
    const variant: 'A' | 'B' =
      variantParam === 'B' ? 'B' : 'A';

    const db = getDb(env.DB);

    // Generate recommendations
    const recommendations = await generateRecommendations(
      db,
      request.user.userId,
      userLocation,
      variant
    );

    // Fetch cafe details for recommended cafes
    const cafeIds = recommendations.map((r) => r.cafeId);

    if (cafeIds.length === 0) {
      return jsonResponse(
        {
          recommendations: [],
          variant,
          message: 'No recommendations available. Try visiting more cafes!',
        },
        HTTP_STATUS.OK,
        request as Request,
        env,
        CACHE_DURATION
      );
    }

    const cafeDetails = await db
      .select()
      .from(cafes)
      .where(inArray(cafes.id, cafeIds))
      .all();

    // Map cafes to recommendation scores
    const cafeMap = new Map(cafeDetails.map((c) => [c.id, c]));

    const results = recommendations
      .slice(0, limit)
      .map((rec) => ({
        cafe: cafeMap.get(rec.cafeId),
        score: Math.round(rec.score * 100) / 100,
        reasons: rec.reasons,
      }))
      .filter((r) => r.cafe); // Filter out any missing cafes

    return jsonResponse(
      {
        recommendations: results,
        variant,
        total: results.length,
      },
      HTTP_STATUS.OK,
      request as Request,
      env,
      CACHE_DURATION
    );
  } catch (error) {
    console.error('Error getting for-you recommendations:', error);
    return errorResponse(
      'Failed to get recommendations',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      request as Request,
      env
    );
  }
}

/**
 * GET /api/recommendations/trending
 * Get trending cafes (public endpoint, no auth required)
 *
 * Query params:
 * - limit: Number of recommendations (default: 10, max: 20)
 */
export async function getTrending(
  request: IRequest,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return badRequestResponse(
        'Limit must be between 1 and 20',
        request as Request,
        env
      );
    }

    const db = getDb(env.DB);

    // Get trending recommendations
    const recommendations = await getTrendingRecommendations(db, limit);

    // Fetch cafe details
    const cafeIds = recommendations.map((r) => r.cafeId);

    if (cafeIds.length === 0) {
      return jsonResponse(
        {
          trending: [],
          message: 'No trending cafes at the moment',
        },
        HTTP_STATUS.OK,
        request as Request,
        env,
        TRENDING_CACHE_DURATION
      );
    }

    const cafeDetails = await db
      .select()
      .from(cafes)
      .where(inArray(cafes.id, cafeIds))
      .all();

    // Map cafes to recommendation scores
    const cafeMap = new Map(cafeDetails.map((c) => [c.id, c]));

    const results = recommendations
      .map((rec) => ({
        cafe: cafeMap.get(rec.cafeId),
        score: Math.round(rec.score * 100) / 100,
        reasons: rec.reasons,
      }))
      .filter((r) => r.cafe);

    return jsonResponse(
      {
        trending: results,
        total: results.length,
      },
      HTTP_STATUS.OK,
      request as Request,
      env,
      TRENDING_CACHE_DURATION
    );
  } catch (error) {
    console.error('Error getting trending recommendations:', error);
    return errorResponse(
      'Failed to get trending cafes',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      request as Request,
      env
    );
  }
}

/**
 * GET /api/recommendations/similar/:cafeId
 * Get cafes similar to a specific cafe (public endpoint)
 *
 * Query params:
 * - limit: Number of recommendations (default: 10, max: 20)
 */
export async function getSimilarCafes(
  request: IRequest,
  env: Env
): Promise<Response> {
  try {
    const cafeId = parseInt(request.params?.cafeId as string);

    if (isNaN(cafeId)) {
      return badRequestResponse(
        'Invalid cafe ID',
        request as Request,
        env
      );
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return badRequestResponse(
        'Limit must be between 1 and 20',
        request as Request,
        env
      );
    }

    const db = getDb(env.DB);

    // Check if cafe exists
    const cafe = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, cafeId))
      .get();

    if (!cafe || cafe.deletedAt) {
      return notFoundResponse(request as Request, env);
    }

    // Get similar cafe recommendations
    const recommendations = await getSimilarCafeRecommendations(
      db,
      cafeId,
      limit
    );

    // Fetch cafe details
    const similarCafeIds = recommendations.map((r) => r.cafeId);

    if (similarCafeIds.length === 0) {
      return jsonResponse(
        {
          similar: [],
          sourceCafe: {
            id: cafe.id,
            name: cafe.name,
            slug: cafe.slug,
          },
          message: 'No similar cafes found',
        },
        HTTP_STATUS.OK,
        request as Request,
        env,
        SIMILAR_CACHE_DURATION
      );
    }

    const cafeDetails = await db
      .select()
      .from(cafes)
      .where(inArray(cafes.id, similarCafeIds))
      .all();

    // Map cafes to recommendation scores
    const cafeMap = new Map(cafeDetails.map((c) => [c.id, c]));

    const results = recommendations
      .map((rec) => ({
        cafe: cafeMap.get(rec.cafeId),
        score: Math.round(rec.score * 100) / 100,
        reasons: rec.reasons,
      }))
      .filter((r) => r.cafe);

    return jsonResponse(
      {
        similar: results,
        sourceCafe: {
          id: cafe.id,
          name: cafe.name,
          slug: cafe.slug,
        },
        total: results.length,
      },
      HTTP_STATUS.OK,
      request as Request,
      env,
      SIMILAR_CACHE_DURATION
    );
  } catch (error) {
    console.error('Error getting similar cafes:', error);
    return errorResponse(
      'Failed to get similar cafes',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      request as Request,
      env
    );
  }
}
