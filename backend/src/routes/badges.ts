/**
 * API routes for user badges and achievements
 * Handles badge retrieval, checking, and awarding
 */

import { IRequest } from 'itty-router';
import { eq, count, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, userBadges, userProfiles, userCheckins, userReviews, reviewPhotos, users } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import { jsonResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { 
  BADGE_DEFINITIONS, 
  checkEligibleBadges, 
  getBadgeDefinition,
  getBadgesByCategory,
  BADGE_CATEGORIES,
  type UserStats,
  type BadgeDefinition 
} from '../utils/badges';

/**
 * GET /api/users/me/badges
 * Get current user's earned badges
 */
export async function getMyBadges(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);
    const userId = request.user.id;

    // Fetch user's badges with join for sorting
    const earnedBadges = await db
      .select({
        id: userBadges.id,
        badgeKey: userBadges.badgeKey,
        badgeCategory: userBadges.badgeCategory,
        earnedAt: userBadges.earnedAt,
        progressValue: userBadges.progressValue,
      })
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));

    // Enrich with badge definitions
    const enrichedBadges = earnedBadges.map(badge => {
      const definition = getBadgeDefinition(badge.badgeKey);
      return {
        ...badge,
        definition,
      };
    }).filter(badge => badge.definition); // Filter out any badges with missing definitions

    return jsonResponse({ badges: enrichedBadges }, request as Request, env);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return errorResponse('Failed to fetch badges', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/users/me/badges/check
 * Check for new badges and award them
 */
export async function checkAndAwardBadges(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);
    const userId = request.user.id;

    // Get user's current stats
    const userStats = await getUserStats(db, userId);
    if (!userStats) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Get eligible badges based on current stats
    const eligibleBadges = checkEligibleBadges(userStats);

    // Get already earned badges
    const earnedBadgeKeys = await db
      .select({ badgeKey: userBadges.badgeKey })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    
    const earnedKeys = new Set(earnedBadgeKeys.map(b => b.badgeKey));

    // Find new badges to award
    const newBadges = eligibleBadges.filter(badge => !earnedKeys.has(badge.key));

    // Award new badges
    const awardedBadges = [];
    for (const badge of newBadges) {
      try {
        const [insertedBadge] = await db
          .insert(userBadges)
          .values({
            userId,
            badgeKey: badge.key,
            badgeCategory: badge.category,
            progressValue: getProgressValue(badge, userStats),
          })
          .returning();

        awardedBadges.push({
          ...insertedBadge,
          definition: badge,
        });
      } catch (error) {
        // Handle potential duplicate badge errors (race conditions)
        console.warn(`Failed to award badge ${badge.key} to user ${userId}:`, error);
      }
    }

    return jsonResponse({ 
      newBadges: awardedBadges,
      totalEarned: earnedKeys.size + awardedBadges.length
    }, request as Request, env);
  } catch (error) {
    console.error('Error checking badges:', error);
    return errorResponse('Failed to check badges', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/badges/definitions
 * Get all available badge definitions
 */
export async function getBadgeDefinitions(request: IRequest, env: Env): Promise<Response> {
  try {
    const allBadges = Object.values(BADGE_DEFINITIONS);
    
    // Group by category for easy frontend consumption
    const badgesByCategory = {
      [BADGE_CATEGORIES.PASSPORT]: getBadgesByCategory(BADGE_CATEGORIES.PASSPORT),
      [BADGE_CATEGORIES.REVIEWS]: getBadgesByCategory(BADGE_CATEGORIES.REVIEWS),
      [BADGE_CATEGORIES.PHOTOS]: getBadgesByCategory(BADGE_CATEGORIES.PHOTOS),
      [BADGE_CATEGORIES.SPECIAL]: getBadgesByCategory(BADGE_CATEGORIES.SPECIAL),
    };

    return jsonResponse({ 
      allBadges,
      byCategory: badgesByCategory 
    }, request as Request, env);
  } catch (error) {
    console.error('Error fetching badge definitions:', error);
    return errorResponse('Failed to fetch badge definitions', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/me/badges/progress
 * Get user's badge progress (how close they are to earning badges)
 */
export async function getBadgeProgress(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);
    const userId = request.user.id;

    const userStats = await getUserStats(db, userId);
    if (!userStats) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Get already earned badges
    const earnedBadgeKeys = await db
      .select({ badgeKey: userBadges.badgeKey })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    
    const earnedKeys = new Set(earnedBadgeKeys.map(b => b.badgeKey));

    // Calculate progress for unearned badges
    const progress = [];
    for (const badge of Object.values(BADGE_DEFINITIONS)) {
      if (earnedKeys.has(badge.key)) continue; // Skip earned badges

      if (badge.threshold) {
        let currentValue = 0;
        switch (badge.category) {
          case BADGE_CATEGORIES.PASSPORT:
            currentValue = userStats.totalCheckins;
            break;
          case BADGE_CATEGORIES.REVIEWS:
            currentValue = userStats.totalReviews;
            break;
          case BADGE_CATEGORIES.PHOTOS:
            currentValue = userStats.totalPhotos;
            break;
        }

        progress.push({
          badge,
          currentValue,
          targetValue: badge.threshold,
          progress: Math.min(currentValue / badge.threshold, 1.0),
          isEligible: currentValue >= badge.threshold,
        });
      }
    }

    return jsonResponse({ progress }, request as Request, env);
  } catch (error) {
    console.error('Error fetching badge progress:', error);
    return errorResponse('Failed to fetch badge progress', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

// Helper function to get user stats for badge checking
async function getUserStats(db: any, userId: number): Promise<UserStats | null> {
  try {
    // Get user registration date
    const [user] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return null;

    // Get user profile stats
    const [profile] = await db
      .select({
        totalCheckins: userProfiles.totalCheckins,
        totalReviews: userProfiles.totalReviews,
        totalPhotos: userProfiles.totalPhotos,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));

    if (!profile) {
      // If no profile exists, calculate stats directly
      const [checkinCount] = await db
        .select({ count: count() })
        .from(userCheckins)
        .where(eq(userCheckins.userId, userId));

      const [reviewCount] = await db
        .select({ count: count() })
        .from(userReviews)
        .where(eq(userReviews.userId, userId));

      const [photoCount] = await db
        .select({ count: count() })
        .from(reviewPhotos)
        .where(eq(reviewPhotos.userId, userId));

      return {
        totalCheckins: checkinCount?.count || 0,
        totalReviews: reviewCount?.count || 0,
        totalPhotos: photoCount?.count || 0,
        registrationDate: user.createdAt,
      };
    }

    return {
      totalCheckins: profile.totalCheckins || 0,
      totalReviews: profile.totalReviews || 0,
      totalPhotos: profile.totalPhotos || 0,
      registrationDate: user.createdAt,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

// Helper function to get progress value for a badge
function getProgressValue(badge: BadgeDefinition, userStats: UserStats): number | null {
  if (!badge.threshold) return null;

  switch (badge.category) {
    case BADGE_CATEGORIES.PASSPORT:
      return userStats.totalCheckins;
    case BADGE_CATEGORIES.REVIEWS:
      return userStats.totalReviews;
    case BADGE_CATEGORIES.PHOTOS:
      return userStats.totalPhotos;
    default:
      return null;
  }
}

