import { IRequest } from 'itty-router';
import { eq, count, sql } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, users, userProfiles, cafes, userCheckins, userReviews, reviewPhotos, userFavorites } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  validateDisplayName,
  validateBio,
  validateLocation,
  validateSocialUsername,
  validateUrl,
} from '../utils/validation';
import { HTTP_STATUS } from '../constants';

// Constants
const DECIMAL_PRECISION = 100; // For rounding to 2 decimal places
const DEFAULT_PRIVACY_SETTINGS = { isPublic: true, showActivity: true, showFollowers: true };

/**
 * Parse privacy settings from JSON string with fallback to defaults
 */
function parsePrivacySettings(privacySettingsJson: string | null): typeof DEFAULT_PRIVACY_SETTINGS {
  if (!privacySettingsJson) {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }

  try {
    return JSON.parse(privacySettingsJson);
  } catch {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
}

/**
 * Parse preferences from JSON string with fallback to null
 */
function parsePreferences(preferencesJson: string | null): any {
  if (!preferencesJson) {
    return null;
  }

  try {
    return JSON.parse(preferencesJson);
  } catch {
    return null;
  }
}

/**
 * Sync profile stats with actual data
 * Updates denormalized stats in user_profiles table
 * Includes retry logic for transient failures
 */
export async function syncProfileStats(
  env: Env,
  userId: number,
  retryCount = 0,
  maxRetries = 2
): Promise<void> {
  try {
    const db = getDb(env.DB);

    // Count reviews
    const reviewResult = await db
      .select({ count: count() })
      .from(userReviews)
      .where(eq(userReviews.userId, userId))
      .get();
    const reviewCount = reviewResult?.count || 0;

    // Count approved photos
    const photoResult = await db
      .select({ count: count() })
      .from(reviewPhotos)
      .where(
        sql`${reviewPhotos.userId} = ${userId} AND ${reviewPhotos.moderationStatus} = 'approved'`
      )
      .get();
    const photoCount = photoResult?.count || 0;

    // Count check-ins
    const checkinResult = await db
      .select({ count: count() })
      .from(userCheckins)
      .where(eq(userCheckins.userId, userId))
      .get();
    const checkinCount = checkinResult?.count || 0;

    // Count favorites
    const favoriteResult = await db
      .select({ count: count() })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId))
      .get();
    const favoriteCount = favoriteResult?.count || 0;

    // Calculate passport completion
    const totalCafesResult = await db
      .select({ count: count() })
      .from(cafes)
      .where(sql`${cafes.deletedAt} IS NULL`)
      .get();
    const totalCafes = totalCafesResult?.count || 0;

    const passportCompletion = totalCafes > 0 ? (checkinCount / totalCafes) * 100 : 0;

    // Update user_profiles with synced stats
    await db
      .update(userProfiles)
      .set({
        totalReviews: reviewCount,
        totalPhotos: photoCount,
        totalCheckins: checkinCount,
        totalFavorites: favoriteCount,
        passportCompletion: Math.round(passportCompletion * DECIMAL_PRECISION) / DECIMAL_PRECISION,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userProfiles.userId, userId))
      .run();
  } catch (error) {
    console.error(`Error syncing profile stats (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);

    // Retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      // Exponential backoff: wait 100ms, then 200ms, etc.
      const backoffMs = 100 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return syncProfileStats(env, userId, retryCount + 1, maxRetries);
    }

    // Don't throw - stats sync should not break profile requests
    console.error('Failed to sync profile stats after max retries');
  }
}

/**
 * GET /api/users/:username/profile
 * Get public user profile by username
 */
export async function getUserProfile(request: IRequest, env: Env): Promise<Response> {
  try {
    const { username } = request.params as { username: string };

    if (!username) {
      return badRequestResponse('Username is required', request as Request, env);
    }

    const db = getDb(env.DB);

    // Find user by username
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Get user profile (create default if doesn't exist)
    let profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .get();

    if (!profile) {
      // Create default profile
      profile = await db
        .insert(userProfiles)
        .values({
          userId: user.id,
        })
        .returning()
        .get();
    }

    // Sync stats before returning (for accuracy)
    await syncProfileStats(env, user.id);

    // Fetch updated profile with synced stats
    profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .get();

    if (!profile) {
      return errorResponse('Profile not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Parse privacy settings
    const privacySettings = parsePrivacySettings(profile.privacySettings);

    // Check if profile is public (or if requesting own profile)
    const requestUser = (request as AuthenticatedRequest).user;
    const isOwnProfile = requestUser && requestUser.userId === user.id;

    if (!privacySettings.isPublic && !isOwnProfile) {
      // Return limited profile for private users
      return jsonResponse({
        user: {
          username: user.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          isPrivate: true,
        },
      }, HTTP_STATUS.OK, request as Request, env);
    }

    // Parse preferences JSON
    const preferences = parsePreferences(profile.preferences);

    // Build public profile response (using denormalized stats)
    const publicProfile = {
      user: {
        id: user.id,
        username: user.username,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        location: profile.location,
        joinedAt: user.createdAt,
        stats: {
          totalReviews: profile.totalReviews,
          totalCheckins: profile.totalCheckins,
          totalPhotos: profile.totalPhotos,
          totalFavorites: profile.totalFavorites,
          passportCompletion: profile.passportCompletion,
          reputationScore: profile.reputationScore,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount,
        },
        badges: [], // TODO: Fetch badges from user_badges table
        social: {
          instagram: profile.instagram,
          tiktok: profile.tiktok,
          website: profile.website,
        },
      },
    };

    return jsonResponse(publicProfile, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get user profile error:', error);
    return errorResponse('Failed to get user profile', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/me/profile
 * Get own profile (authenticated)
 */
export async function getMyProfile(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.userId))
      .get();

    if (!user) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Get profile (create if doesn't exist)
    let profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .get();

    if (!profile) {
      profile = await db
        .insert(userProfiles)
        .values({
          userId: user.id,
        })
        .returning()
        .get();
    }

    // Sync stats before returning (for accuracy)
    await syncProfileStats(env, user.id);

    // Fetch updated profile with synced stats
    profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .get();

    if (!profile) {
      return errorResponse('Profile not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Parse preferences and privacy settings
    const preferences = parsePreferences(profile.preferences);
    const privacySettings = parsePrivacySettings(profile.privacySettings);

    // Return full profile (including private fields)
    const fullProfile = {
      ...profile,
      preferences,
      privacySettings,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };

    return jsonResponse(fullProfile, HTTP_STATUS.OK, request as Request, env);
  } catch (error) {
    console.error('Get my profile error:', error);
    return errorResponse('Failed to get profile', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/users/me/profile
 * Update own profile (authenticated)
 */
export async function updateMyProfile(
  request: AuthenticatedRequest,
  env: Env
): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const body = (await request.json()) as Record<string, any>;
    const db = getDb(env.DB);

    // Get or create profile
    let profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, request.user.userId))
      .get();

    if (!profile) {
      profile = await db
        .insert(userProfiles)
        .values({
          userId: request.user.userId,
        })
        .returning()
        .get();
    }

    // Build update object with validation
    const updates: Partial<typeof userProfiles.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    // Validate display name
    if (body.displayName !== undefined) {
      const validation = validateDisplayName(body.displayName);
      if (!validation.valid) {
        return badRequestResponse(validation.error!, request as Request, env);
      }
      updates.displayName = body.displayName;
    }

    // Validate bio
    if (body.bio !== undefined) {
      const validation = validateBio(body.bio);
      if (!validation.valid) {
        return badRequestResponse(validation.error!, request as Request, env);
      }
      updates.bio = body.bio;
    }

    // Validate location
    if (body.location !== undefined) {
      const validation = validateLocation(body.location);
      if (!validation.valid) {
        return badRequestResponse(validation.error!, request as Request, env);
      }
      updates.location = body.location;
    }

    // Validate Instagram username
    if (body.instagram !== undefined) {
      const validation = validateSocialUsername(body.instagram, 'Instagram');
      if (!validation.valid) {
        return badRequestResponse(validation.error!, request as Request, env);
      }
      updates.instagram = body.instagram;
    }

    // Validate TikTok username
    if (body.tiktok !== undefined) {
      const validation = validateSocialUsername(body.tiktok, 'TikTok');
      if (!validation.valid) {
        return badRequestResponse(validation.error!, request as Request, env);
      }
      updates.tiktok = body.tiktok;
    }

    // Validate website URL
    if (body.website !== undefined) {
      const validation = validateUrl(body.website);
      if (!validation.valid) {
        return badRequestResponse(validation.error!, request as Request, env);
      }
      updates.website = body.website;
    }

    if (body.preferences !== undefined) {
      updates.preferences = JSON.stringify(body.preferences);
    }

    // Handle privacy settings
    if (body.privacy) {
      // Parse existing privacy settings
      const currentPrivacy = parsePrivacySettings(profile.privacySettings);

      // Update individual privacy fields with type validation
      if (body.privacy.isPublic !== undefined) {
        if (typeof body.privacy.isPublic !== 'boolean') {
          return badRequestResponse('isPublic must be a boolean', request as Request, env);
        }
        currentPrivacy.isPublic = body.privacy.isPublic;
        updates.isPublic = body.privacy.isPublic; // Keep legacy field in sync
      }
      if (body.privacy.showActivity !== undefined) {
        if (typeof body.privacy.showActivity !== 'boolean') {
          return badRequestResponse('showActivity must be a boolean', request as Request, env);
        }
        currentPrivacy.showActivity = body.privacy.showActivity;
        updates.showActivity = body.privacy.showActivity; // Keep legacy field in sync
      }
      if (body.privacy.showFollowers !== undefined) {
        if (typeof body.privacy.showFollowers !== 'boolean') {
          return badRequestResponse('showFollowers must be a boolean', request as Request, env);
        }
        currentPrivacy.showFollowers = body.privacy.showFollowers;
      }

      updates.privacySettings = JSON.stringify(currentPrivacy);
    }

    // Update profile
    const updatedProfile = await db
      .update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, request.user.userId))
      .returning()
      .get();

    // Parse preferences and privacy settings
    const preferences = parsePreferences(updatedProfile.preferences);
    const privacySettings = parsePrivacySettings(updatedProfile.privacySettings);

    return jsonResponse(
      {
        ...updatedProfile,
        preferences,
        privacySettings,
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('Failed to update profile', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/users/me/privacy
 * Update privacy settings only
 */
export async function updatePrivacySettings(
  request: AuthenticatedRequest,
  env: Env
): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const body = (await request.json()) as {
      isPublic?: boolean;
      showActivity?: boolean;
      showFollowers?: boolean;
    };
    const db = getDb(env.DB);

    // Get or create profile
    let profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, request.user.userId))
      .get();

    if (!profile) {
      profile = await db
        .insert(userProfiles)
        .values({
          userId: request.user.userId,
        })
        .returning()
        .get();
    }

    // Parse existing privacy settings
    const currentPrivacy = parsePrivacySettings(profile.privacySettings);

    // Update with provided values (with type validation)
    if (body.isPublic !== undefined) {
      if (typeof body.isPublic !== 'boolean') {
        return badRequestResponse('isPublic must be a boolean', request as Request, env);
      }
      currentPrivacy.isPublic = body.isPublic;
    }
    if (body.showActivity !== undefined) {
      if (typeof body.showActivity !== 'boolean') {
        return badRequestResponse('showActivity must be a boolean', request as Request, env);
      }
      currentPrivacy.showActivity = body.showActivity;
    }
    if (body.showFollowers !== undefined) {
      if (typeof body.showFollowers !== 'boolean') {
        return badRequestResponse('showFollowers must be a boolean', request as Request, env);
      }
      currentPrivacy.showFollowers = body.showFollowers;
    }

    // Update database
    await db
      .update(userProfiles)
      .set({
        privacySettings: JSON.stringify(currentPrivacy),
        isPublic: currentPrivacy.isPublic, // Keep legacy field in sync
        showActivity: currentPrivacy.showActivity, // Keep legacy field in sync
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userProfiles.userId, request.user.userId))
      .run();

    return jsonResponse(
      {
        success: true,
        privacySettings: currentPrivacy,
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Update privacy settings error:', error);
    return errorResponse('Failed to update privacy settings', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * POST /api/users/me/avatar
 * Upload avatar image
 * TODO: Implement Cloudflare Images upload
 */
export async function uploadAvatar(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    // TODO: Implement Cloudflare Images upload
    // For now, return placeholder
    return errorResponse('Avatar upload not yet implemented', HTTP_STATUS.NOT_IMPLEMENTED, request as Request, env);
  } catch (error) {
    console.error('Upload avatar error:', error);
    return errorResponse('Failed to upload avatar', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
