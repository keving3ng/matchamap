import { IRequest } from 'itty-router';
import { eq, sql } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userCheckins, cafes } from '../db';
import { HTTP_STATUS } from '../constants';
import { jsonResponse, errorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/users/me/passport
 * Get user's passport statistics and summary
 */
export async function getUserPassport(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    // Extract userId from JWT (set by requireAuth middleware)
    const userId = request.user?.userId;
    
    if (!userId) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }
    
    const db = getDb(env.DB);
    
    // Get total number of cafes
    const totalCafesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cafes)
      .where(sql`deleted_at IS NULL`)
      .get();
    
    const totalCafes = totalCafesResult?.count || 0;
    
    // Get user's check-ins with cafe details
    const checkins = await db
      .select({
        id: userCheckins.id,
        cafeId: userCheckins.cafeId,
        visitedAt: userCheckins.visitedAt,
        notes: userCheckins.notes,
        cafeName: cafes.name,
        cafeSlug: cafes.slug,
        cafeCity: cafes.city,
        cafeDisplayScore: cafes.displayScore,
      })
      .from(userCheckins)
      .leftJoin(cafes, eq(userCheckins.cafeId, cafes.id))
      .where(eq(userCheckins.userId, userId))
      .orderBy(userCheckins.visitedAt)
      .all();
    
    const visitedCafes = checkins.length;
    const completionPercentage = totalCafes > 0 ? Math.round((visitedCafes / totalCafes) * 100) : 0;
    
    // Calculate city breakdown
    const cityBreakdown = checkins.reduce((acc, checkin) => {
      if (checkin.cafeCity) {
        acc[checkin.cafeCity] = (acc[checkin.cafeCity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Get recent check-ins (last 5)
    const recentCheckins = checkins
      .slice(-5)
      .reverse()
      .map(checkin => ({
        id: checkin.id,
        cafeId: checkin.cafeId,
        visitedAt: checkin.visitedAt,
        notes: checkin.notes,
        cafe: checkin.cafeName ? {
          id: checkin.cafeId,
          name: checkin.cafeName,
          slug: checkin.cafeSlug,
          city: checkin.cafeCity,
          displayScore: checkin.cafeDisplayScore,
        } : null,
      }));
    
    // Calculate achievement milestones
    const milestones = [
      { threshold: 1, name: 'First Sip', achieved: visitedCafes >= 1 },
      { threshold: 5, name: 'Explorer', achieved: visitedCafes >= 5 },
      { threshold: 10, name: 'Enthusiast', achieved: visitedCafes >= 10 },
      { threshold: 25, name: 'Connoisseur', achieved: visitedCafes >= 25 },
      { threshold: 50, name: 'Master', achieved: visitedCafes >= 50 },
    ];
    
    const nextMilestone = milestones.find(m => !m.achieved);
    
    const passport = {
      stats: {
        totalCafes,
        visitedCafes,
        completionPercentage,
        visitedCafeIds: checkins.map(c => c.cafeId),
      },
      achievements: {
        milestones,
        nextMilestone: nextMilestone ? {
          name: nextMilestone.name,
          threshold: nextMilestone.threshold,
          progress: visitedCafes,
          remaining: nextMilestone.threshold - visitedCafes,
        } : null,
      },
      cityBreakdown,
      recentCheckins,
      lastUpdated: new Date().toISOString(),
    };
    
    return jsonResponse({ passport }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error getting user passport:', error);
    return errorResponse('Failed to get passport', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/me/passport/simple
 * Get simplified passport data (just visited cafe IDs for quick checks)
 */
export async function getUserPassportSimple(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    // Extract userId from JWT (set by requireAuth middleware)
    const userId = request.user?.userId;
    
    if (!userId) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }
    
    const db = getDb(env.DB);
    
    // Get just the cafe IDs for visited cafes
    const checkins = await db
      .select({ cafeId: userCheckins.cafeId })
      .from(userCheckins)
      .where(eq(userCheckins.userId, userId))
      .all();
    
    const visitedCafeIds = checkins.map(c => c.cafeId);
    
    return jsonResponse({ 
      visitedCafeIds,
      visitedCount: visitedCafeIds.length 
    }, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Error getting simple passport:', error);
    return errorResponse('Failed to get passport', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}