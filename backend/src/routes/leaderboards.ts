import { IRequest } from 'itty-router';
import { desc, sql, eq, and, gte } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userProfiles, users, cafes } from '../db';
import { jsonResponse, errorResponse } from '../utils/response';
import { VALID_CITY_KEYS } from '../../../shared/types';

// Constants
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const CACHE_TTL = 300; // 5 minutes in seconds

/**
 * Get passport leaderboard (most cafes visited)
 * GET /api/leaderboard/passport?period=all&city=toronto&limit=50
 */
export async function getPassportLeaderboard(
  request: IRequest,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'all'; // 'all' or 'monthly'
    const city = url.searchParams.get('city');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || `${DEFAULT_LIMIT}`), MAX_LIMIT);

    // Validate city parameter if provided
    if (city && !validateCityKey(city)) {
      return errorResponse('Invalid city parameter', 400, request as Request, env);
    }

    const db = getDb(env.DB);
    
    // Build query conditions
    const conditions = [];
    
    // Add time filter for monthly period
    if (period === 'monthly') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(userProfiles.updatedAt, monthStart.toISOString()));
    }

    // Base query for passport leaderboard
    let query = db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${userProfiles.totalCheckins} DESC)`.as('rank'),
        userId: userProfiles.userId,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        totalCheckins: userProfiles.totalCheckins,
        passportCompletion: userProfiles.passportCompletion,
        location: userProfiles.location,
      })
      .from(userProfiles)
      .innerJoin(users, eq(users.id, userProfiles.userId))
      .where(
        and(
          eq(userProfiles.isPublic, true),
          ...conditions
        )
      )
      .orderBy(desc(userProfiles.totalCheckins))
      .limit(limit);

    const leaderboard = await query;

    return jsonResponse({
      leaderboard,
      metadata: {
        type: 'passport',
        period,
        city: city || 'all',
        limit,
        generatedAt: new Date().toISOString(),
      },
    }, 200, request as Request, env, `public, max-age=${CACHE_TTL}`);

  } catch (error) {
    console.error('Error fetching passport leaderboard:', error);
    return errorResponse('Internal server error', 500, request as Request, env);
  }
}

/**
 * Get reviewer leaderboard (most helpful reviews)
 * GET /api/leaderboard/reviewers?period=all&city=toronto&limit=50
 */
export async function getReviewerLeaderboard(
  request: IRequest,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'all';
    const city = url.searchParams.get('city');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || `${DEFAULT_LIMIT}`), MAX_LIMIT);

    if (city && !validateCityKey(city)) {
      return errorResponse('Invalid city parameter', 400, request as Request, env);
    }

    const db = getDb(env.DB);
    
    const conditions = [];
    
    if (period === 'monthly') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(userProfiles.updatedAt, monthStart.toISOString()));
    }

    let query = db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${userProfiles.totalReviews} DESC, ${userProfiles.reputationScore} DESC)`.as('rank'),
        userId: userProfiles.userId,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        totalReviews: userProfiles.totalReviews,
        reputationScore: userProfiles.reputationScore,
        location: userProfiles.location,
      })
      .from(userProfiles)
      .innerJoin(users, eq(users.id, userProfiles.userId))
      .where(
        and(
          eq(userProfiles.isPublic, true),
          ...conditions
        )
      )
      .orderBy(desc(userProfiles.totalReviews), desc(userProfiles.reputationScore))
      .limit(limit);

    const leaderboard = await query;

    return jsonResponse({
      leaderboard,
      metadata: {
        type: 'reviewers',
        period,
        city: city || 'all',
        limit,
        generatedAt: new Date().toISOString(),
      },
    }, 200, request as Request, env, `public, max-age=${CACHE_TTL}`);

  } catch (error) {
    console.error('Error fetching reviewer leaderboard:', error);
    return errorResponse('Internal server error', 500, request as Request, env);
  }
}

/**
 * Get contributor leaderboard (total contributions: reviews + photos + favorites)
 * GET /api/leaderboard/contributors?period=all&city=toronto&limit=50
 */
export async function getContributorLeaderboard(
  request: IRequest,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'all';
    const city = url.searchParams.get('city');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || `${DEFAULT_LIMIT}`), MAX_LIMIT);

    if (city && !validateCityKey(city)) {
      return errorResponse('Invalid city parameter', 400, request as Request, env);
    }

    const db = getDb(env.DB);
    
    const conditions = [];
    
    if (period === 'monthly') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(userProfiles.updatedAt, monthStart.toISOString()));
    }

    let query = db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY (${userProfiles.totalReviews} + ${userProfiles.totalPhotos} + ${userProfiles.totalFavorites}) DESC)`.as('rank'),
        userId: userProfiles.userId,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        totalReviews: userProfiles.totalReviews,
        totalPhotos: userProfiles.totalPhotos,
        totalFavorites: userProfiles.totalFavorites,
        totalContributions: sql<number>`(${userProfiles.totalReviews} + ${userProfiles.totalPhotos} + ${userProfiles.totalFavorites})`.as('totalContributions'),
        reputationScore: userProfiles.reputationScore,
        location: userProfiles.location,
      })
      .from(userProfiles)
      .innerJoin(users, eq(users.id, userProfiles.userId))
      .where(
        and(
          eq(userProfiles.isPublic, true),
          ...conditions
        )
      )
      .orderBy(sql`(${userProfiles.totalReviews} + ${userProfiles.totalPhotos} + ${userProfiles.totalFavorites}) DESC`)
      .limit(limit);

    const leaderboard = await query;

    return jsonResponse({
      leaderboard,
      metadata: {
        type: 'contributors',
        period,
        city: city || 'all',
        limit,
        generatedAt: new Date().toISOString(),
      },
    }, 200, request as Request, env, `public, max-age=${CACHE_TTL}`);

  } catch (error) {
    console.error('Error fetching contributor leaderboard:', error);
    return errorResponse('Internal server error', 500, request as Request, env);
  }
}

/**
 * Get user's rank in specified leaderboard
 * GET /api/leaderboard/rank?type=passport&period=all&city=toronto
 */
export async function getUserRank(
  request: IRequest,
  env: Env,
  userId?: number
): Promise<Response> {
  try {
    if (!userId) {
      return errorResponse('Authentication required', 401, request as Request, env);
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'passport'; // 'passport', 'reviewers', 'contributors'
    const period = url.searchParams.get('period') || 'all';
    const city = url.searchParams.get('city');

    if (city && !validateCityKey(city)) {
      return errorResponse('Invalid city parameter', 400, request as Request, env);
    }

    if (!['passport', 'reviewers', 'contributors'].includes(type)) {
      return errorResponse('Invalid leaderboard type', 400, request as Request, env);
    }

    const db = getDb(env.DB);
    
    const conditions = [];
    
    if (period === 'monthly') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(userProfiles.updatedAt, monthStart.toISOString()));
    }

    // Build different ranking queries based on type
    let rankQuery;
    
    if (type === 'passport') {
      rankQuery = db
        .select({
          rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${userProfiles.totalCheckins} DESC)`.as('rank'),
          userId: userProfiles.userId,
          totalCheckins: userProfiles.totalCheckins,
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.isPublic, true),
            ...conditions
          )
        );
    } else if (type === 'reviewers') {
      rankQuery = db
        .select({
          rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${userProfiles.totalReviews} DESC, ${userProfiles.reputationScore} DESC)`.as('rank'),
          userId: userProfiles.userId,
          totalReviews: userProfiles.totalReviews,
          reputationScore: userProfiles.reputationScore,
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.isPublic, true),
            ...conditions
          )
        );
    } else { // contributors
      rankQuery = db
        .select({
          rank: sql<number>`ROW_NUMBER() OVER (ORDER BY (${userProfiles.totalReviews} + ${userProfiles.totalPhotos} + ${userProfiles.totalFavorites}) DESC)`.as('rank'),
          userId: userProfiles.userId,
          totalContributions: sql<number>`(${userProfiles.totalReviews} + ${userProfiles.totalPhotos} + ${userProfiles.totalFavorites})`.as('totalContributions'),
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.isPublic, true),
            ...conditions
          )
        );
    }

    // Execute as subquery to find user's rank
    const userRankResult = await db
      .select()
      .from(sql`(${rankQuery}) as ranked_users`)
      .where(sql`ranked_users.userId = ${userId}`)
      .limit(1);

    const userRank = userRankResult[0] || null;

    return jsonResponse({
      userRank,
      metadata: {
        type,
        period,
        city: city || 'all',
        userId,
        generatedAt: new Date().toISOString(),
      },
    }, 200, request as Request, env, `public, max-age=${CACHE_TTL}`);

  } catch (error) {
    console.error('Error fetching user rank:', error);
    return errorResponse('Internal server error', 500, request as Request, env);
  }
}