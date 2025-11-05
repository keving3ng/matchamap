/**
 * Recommendation Algorithm
 *
 * Generates personalized cafe recommendations based on:
 * - Similar cafes (20% weight)
 * - Collaborative filtering (30% weight)
 * - User preferences (25% weight)
 * - Proximity (15% weight)
 * - Trending (10% weight)
 */

import { eq, sql, desc, and, inArray, isNull, gt, gte } from 'drizzle-orm';
import { getDb, cafes, userReviews, userCheckins, userProfiles, drinks } from '../db';
import type { Cafe } from '../db';
import type { RecommendationScore, UserLocation } from '../../../shared/types';

// Re-export types for use in routes
export type { RecommendationScore, UserLocation };

// Algorithm weights
const WEIGHTS = {
  SIMILAR_CAFES: 0.20,
  COLLABORATIVE_FILTERING: 0.30,
  USER_PREFERENCES: 0.25,
  PROXIMITY: 0.15,
  TRENDING: 0.10,
} as const;

// Constants
const MAX_RECOMMENDATIONS = 20;
const TRENDING_DAYS = 7; // Look at last 7 days for trending
const SIMILAR_CAFE_LIMIT = 10;
const COLLABORATIVE_USER_LIMIT = 50; // Max similar users to consider
const NEARBY_THRESHOLD_KM = 5; // Distance threshold for "nearby" cafes
const MAX_PROXIMITY_KM = 50; // Maximum distance for proximity scoring

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get similar cafes based on ratings, neighborhood, and drink scores
 */
async function getSimilarCafes(
  db: ReturnType<typeof getDb>,
  cafeId: number,
  limit: number = SIMILAR_CAFE_LIMIT
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();

  // Get the target cafe
  const targetCafe = await db
    .select()
    .from(cafes)
    .where(eq(cafes.id, cafeId))
    .get();

  if (!targetCafe) {
    return scores;
  }

  // Get all cafes with their ratings
  const allCafes = await db
    .select({
      id: cafes.id,
      city: cafes.city,
      latitude: cafes.latitude,
      longitude: cafes.longitude,
      userRatingAvg: cafes.userRatingAvg,
      ambianceScore: cafes.ambianceScore,
    })
    .from(cafes)
    .where(and(isNull(cafes.deletedAt), sql`${cafes.id} != ${cafeId}`))
    .all();

  // Get drinks for target cafe
  const targetDrinks = await db
    .select()
    .from(drinks)
    .where(eq(drinks.cafeId, cafeId))
    .all();

  const targetAvgDrinkScore =
    targetDrinks.length > 0
      ? targetDrinks.reduce((sum, d) => sum + d.score, 0) / targetDrinks.length
      : 0;

  // Batch fetch ALL drinks for all cafes to avoid N+1 queries
  const cafeIds = allCafes.map((c) => c.id);
  const allDrinks = cafeIds.length > 0
    ? await db
        .select()
        .from(drinks)
        .where(inArray(drinks.cafeId, cafeIds))
        .all()
    : [];

  // Group drinks by cafe ID
  const drinksByCafeId = new Map<number, typeof allDrinks>();
  for (const drink of allDrinks) {
    if (!drinksByCafeId.has(drink.cafeId)) {
      drinksByCafeId.set(drink.cafeId, []);
    }
    drinksByCafeId.get(drink.cafeId)!.push(drink);
  }

  // Calculate similarity scores
  for (const cafe of allCafes) {
    let similarity = 0;
    let factors = 0;

    // City match (exact match gets bonus)
    if (cafe.city === targetCafe.city) {
      similarity += 0.3;
      factors++;
    }

    // Proximity (closer cafes are more similar)
    const distance = calculateDistance(
      targetCafe.latitude,
      targetCafe.longitude,
      cafe.latitude,
      cafe.longitude
    );
    if (distance < NEARBY_THRESHOLD_KM) {
      similarity += 0.2 * (1 - distance / NEARBY_THRESHOLD_KM);
      factors++;
    }

    // Rating similarity (if both have ratings)
    if (targetCafe.userRatingAvg && cafe.userRatingAvg) {
      const ratingDiff = Math.abs(targetCafe.userRatingAvg - cafe.userRatingAvg);
      similarity += 0.3 * (1 - ratingDiff / 10);
      factors++;
    }

    // Ambiance similarity
    if (targetCafe.ambianceScore && cafe.ambianceScore) {
      const ambianceDiff = Math.abs(
        targetCafe.ambianceScore - cafe.ambianceScore
      );
      similarity += 0.2 * (1 - ambianceDiff / 10);
      factors++;
    }

    // Drink score similarity (using pre-fetched drinks)
    const cafeDrinks = drinksByCafeId.get(cafe.id) || [];

    if (cafeDrinks.length > 0 && targetDrinks.length > 0) {
      const cafeAvgDrinkScore =
        cafeDrinks.reduce((sum, d) => sum + d.score, 0) / cafeDrinks.length;
      const drinkScoreDiff = Math.abs(targetAvgDrinkScore - cafeAvgDrinkScore);
      similarity += 0.2 * (1 - drinkScoreDiff / 10);
      factors++;
    }

    // Normalize by number of factors
    if (factors > 0) {
      scores.set(cafe.id, similarity / factors);
    }
  }

  // Sort and return top cafes
  const sortedCafes = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return new Map(sortedCafes);
}

/**
 * Collaborative filtering - find cafes liked by similar users
 */
async function getCollaborativeFilteringScores(
  db: ReturnType<typeof getDb>,
  userId: number
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();

  // Get user's check-ins and reviews
  const userCheckinResults = await db
    .select({ cafeId: userCheckins.cafeId })
    .from(userCheckins)
    .where(eq(userCheckins.userId, userId))
    .all();

  const userReviewResults = await db
    .select({ cafeId: userReviews.cafeId })
    .from(userReviews)
    .where(eq(userReviews.userId, userId))
    .all();

  const userCafeIds = new Set([
    ...userCheckinResults.map((c) => c.cafeId),
    ...userReviewResults.map((r) => r.cafeId),
  ]);

  if (userCafeIds.size === 0) {
    return scores; // No user history
  }

  // Find users who have checked in or reviewed the same cafes
  const similarUserIds = new Set<number>();

  const similarUserCheckins = await db
    .select({ userId: userCheckins.userId })
    .from(userCheckins)
    .where(
      and(
        inArray(userCheckins.cafeId, Array.from(userCafeIds)),
        sql`${userCheckins.userId} != ${userId}`
      )
    )
    .limit(COLLABORATIVE_USER_LIMIT)
    .all();

  similarUserCheckins.forEach((c) => similarUserIds.add(c.userId));

  if (similarUserIds.size === 0) {
    return scores; // No similar users
  }

  // Get cafes these similar users like (that the target user hasn't visited)
  const recommendedCafes = await db
    .select({
      cafeId: userCheckins.cafeId,
      count: sql<number>`COUNT(*)`,
    })
    .from(userCheckins)
    .where(
      and(
        inArray(userCheckins.userId, Array.from(similarUserIds)),
        sql`${userCheckins.cafeId} NOT IN (${sql.join(
          Array.from(userCafeIds).map((id) => sql`${id}`),
          sql`, `
        )})`
      )
    )
    .groupBy(userCheckins.cafeId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(MAX_RECOMMENDATIONS)
    .all();

  // Score based on how many similar users liked the cafe
  const maxCount = recommendedCafes[0]?.count || 1;
  recommendedCafes.forEach((cafe) => {
    scores.set(cafe.cafeId, cafe.count / maxCount);
  });

  return scores;
}

/**
 * Score cafes based on user preferences (from profile)
 */
async function getUserPreferenceScores(
  db: ReturnType<typeof getDb>,
  userId: number
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();

  // Get user profile preferences
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!profile?.preferences) {
    return scores; // No preferences set
  }

  let preferences: any;
  try {
    preferences = JSON.parse(profile.preferences);
  } catch {
    return scores;
  }

  // Get all cafes
  const allCafes = await db
    .select({
      id: cafes.id,
      userRatingAvg: cafes.userRatingAvg,
      ambianceScore: cafes.ambianceScore,
    })
    .from(cafes)
    .where(isNull(cafes.deletedAt))
    .all();

  // Score based on preferences
  for (const cafe of allCafes) {
    let score = 0.5; // Base score

    // Prefer highly rated cafes
    if (cafe.userRatingAvg) {
      score += (cafe.userRatingAvg / 10) * 0.3;
    }

    // Prefer good ambiance
    if (cafe.ambianceScore) {
      score += (cafe.ambianceScore / 10) * 0.2;
    }

    scores.set(cafe.id, Math.min(score, 1.0));
  }

  return scores;
}

/**
 * Score cafes based on proximity to user's location
 */
async function getProximityScores(
  db: ReturnType<typeof getDb>,
  userLocation?: UserLocation
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();

  if (!userLocation) {
    return scores; // No location provided
  }

  // Get all cafes
  const allCafes = await db
    .select({
      id: cafes.id,
      latitude: cafes.latitude,
      longitude: cafes.longitude,
    })
    .from(cafes)
    .where(isNull(cafes.deletedAt))
    .all();

  // Score based on distance (closer = higher score)
  for (const cafe of allCafes) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      cafe.latitude,
      cafe.longitude
    );

    // Within MAX_PROXIMITY_KM, score inversely proportional to distance
    if (distance <= MAX_PROXIMITY_KM) {
      scores.set(cafe.id, 1 - distance / MAX_PROXIMITY_KM);
    }
  }

  return scores;
}

/**
 * Score cafes based on recent popularity (trending)
 */
async function getTrendingScores(
  db: ReturnType<typeof getDb>
): Promise<Map<number, number>> {
  const scores = new Map<number, number>();

  // Get recent check-ins (last N days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - TRENDING_DAYS);
  const cutoffDateStr = cutoffDate.toISOString();

  const trendingCafes = await db
    .select({
      cafeId: userCheckins.cafeId,
      count: sql<number>`COUNT(*)`,
    })
    .from(userCheckins)
    .where(gte(userCheckins.visitedAt, cutoffDateStr))
    .groupBy(userCheckins.cafeId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(MAX_RECOMMENDATIONS * 2)
    .all();

  // Score based on check-in count
  const maxCount = trendingCafes[0]?.count || 1;
  trendingCafes.forEach((cafe) => {
    scores.set(cafe.cafeId, cafe.count / maxCount);
  });

  return scores;
}

/**
 * Generate personalized recommendations for a user
 */
export async function generateRecommendations(
  db: ReturnType<typeof getDb>,
  userId: number,
  userLocation?: UserLocation,
  abTestVariant: 'A' | 'B' = 'A'
): Promise<RecommendationScore[]> {
  // Get user's visited cafes to exclude
  const visitedCheckins = await db
    .select({ cafeId: userCheckins.cafeId })
    .from(userCheckins)
    .where(eq(userCheckins.userId, userId))
    .all();

  const visitedReviews = await db
    .select({ cafeId: userReviews.cafeId })
    .from(userReviews)
    .where(eq(userReviews.userId, userId))
    .all();

  const visitedCafeIds = new Set([
    ...visitedCheckins.map((c) => c.cafeId),
    ...visitedReviews.map((r) => r.cafeId),
  ]);

  // Get scores from each algorithm component
  const [collaborativeScores, preferenceScores, proximityScores, trendingScores] =
    await Promise.all([
      getCollaborativeFilteringScores(db, userId),
      getUserPreferenceScores(db, userId),
      getProximityScores(db, userLocation),
      getTrendingScores(db),
    ]);

  // Get all candidate cafes
  const allCafes = await db
    .select({ id: cafes.id })
    .from(cafes)
    .where(isNull(cafes.deletedAt))
    .all();

  const cafeIds = allCafes.map((c) => c.id).filter((id) => !visitedCafeIds.has(id));

  // Adjust weights based on A/B test variant
  const weights = abTestVariant === 'B'
    ? {
        SIMILAR_CAFES: 0.20,
        COLLABORATIVE_FILTERING: 0.40,  // Increased from 0.30
        USER_PREFERENCES: 0.15,          // Decreased from 0.25
        PROXIMITY: 0.15,
        TRENDING: 0.10,
      }
    : WEIGHTS;

  // Calculate combined scores
  const recommendations: RecommendationScore[] = [];

  for (const cafeId of cafeIds) {
    const components = {
      similar: 0,
      collaborative: collaborativeScores.get(cafeId) || 0,
      preferences: preferenceScores.get(cafeId) || 0,
      proximity: proximityScores.get(cafeId) || 0,
      trending: trendingScores.get(cafeId) || 0,
    };

    // Calculate weighted score
    const score =
      components.collaborative * weights.COLLABORATIVE_FILTERING +
      components.preferences * weights.USER_PREFERENCES +
      components.proximity * weights.PROXIMITY +
      components.trending * weights.TRENDING;

    // Generate reasons
    const reasons: string[] = [];
    if (components.collaborative > 0.5) {
      reasons.push('Popular with users like you');
    }
    if (components.proximity > 0.7) {
      reasons.push('Nearby');
    }
    if (components.trending > 0.6) {
      reasons.push('Trending this week');
    }
    if (components.preferences > 0.7) {
      reasons.push('Matches your taste');
    }

    recommendations.push({
      cafeId,
      score,
      reasons,
      components,
    });
  }

  // Sort by score and return top recommendations
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, MAX_RECOMMENDATIONS);
}

/**
 * Get similar cafes to a specific cafe
 */
export async function getSimilarCafeRecommendations(
  db: ReturnType<typeof getDb>,
  cafeId: number,
  limit: number = 10
): Promise<RecommendationScore[]> {
  const similarScores = await getSimilarCafes(db, cafeId, limit);
  const trendingScores = await getTrendingScores(db);

  const recommendations: RecommendationScore[] = [];

  for (const [similarCafeId, similarScore] of similarScores.entries()) {
    const trendingScore = trendingScores.get(similarCafeId) || 0;

    // Combine similar (80%) and trending (20%)
    const score = similarScore * 0.8 + trendingScore * 0.2;

    const reasons: string[] = ['Similar vibe and quality'];
    if (trendingScore > 0.6) {
      reasons.push('Trending this week');
    }

    recommendations.push({
      cafeId: similarCafeId,
      score,
      reasons,
      components: {
        similar: similarScore,
        collaborative: 0,
        preferences: 0,
        proximity: 0,
        trending: trendingScore,
      },
    });
  }

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}

/**
 * Get trending cafes (public, no personalization)
 */
export async function getTrendingRecommendations(
  db: ReturnType<typeof getDb>,
  limit: number = 10
): Promise<RecommendationScore[]> {
  const trendingScores = await getTrendingScores(db);

  const recommendations: RecommendationScore[] = [];

  for (const [cafeId, score] of trendingScores.entries()) {
    recommendations.push({
      cafeId,
      score,
      reasons: ['Popular this week'],
      components: {
        similar: 0,
        collaborative: 0,
        preferences: 0,
        proximity: 0,
        trending: score,
      },
    });
  }

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}
