import { IRequest } from 'itty-router';
import { eq, count, sql } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, users, userProfiles, cafes, userCheckins } from '../db';
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

    // Check if profile is public (or if requesting own profile)
    const requestUser = (request as AuthenticatedRequest).user;
    const isOwnProfile = requestUser && requestUser.userId === user.id;

    if (!profile.isPublic && !isOwnProfile) {
      return errorResponse('This profile is private', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Parse preferences JSON
    let preferences = null;
    if (profile.preferences) {
      try {
        preferences = JSON.parse(profile.preferences);
      } catch {
        // Ignore parse errors
      }
    }

    // Calculate passport completion percentage
    const totalCafesResult = await db.select({ count: count() }).from(cafes).get();
    const totalCafes = totalCafesResult?.count || 0;

    const userCheckinsResult = await db
      .select({ count: count() })
      .from(userCheckins)
      .where(eq(userCheckins.userId, user.id))
      .get();
    const userCheckinsCount = userCheckinsResult?.count || 0;

    const passportCompletion = totalCafes > 0
      ? Math.round((userCheckinsCount / totalCafes) * 100)
      : 0;

    // Build public profile response
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
          totalCheckins: userCheckinsCount,
          totalPhotos: profile.totalPhotos,
          passportCompletion,
          reputationScore: profile.reputationScore,
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

    // Parse preferences
    let preferences = null;
    if (profile.preferences) {
      try {
        preferences = JSON.parse(profile.preferences);
      } catch {
        // Ignore
      }
    }

    // Calculate passport completion percentage
    const totalCafesResult = await db.select({ count: count() }).from(cafes).get();
    const totalCafes = totalCafesResult?.count || 0;

    const userCheckinsResult = await db
      .select({ count: count() })
      .from(userCheckins)
      .where(eq(userCheckins.userId, user.id))
      .get();
    const userCheckinsCount = userCheckinsResult?.count || 0;

    const passportCompletion = totalCafes > 0
      ? Math.round((userCheckinsCount / totalCafes) * 100)
      : 0;

    // Return full profile (including private fields)
    const fullProfile = {
      ...profile,
      preferences,
      passportCompletion,
      totalCheckins: userCheckinsCount,
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

    if (body.privacy) {
      if (body.privacy.isPublic !== undefined) {
        updates.isPublic = body.privacy.isPublic;
      }
      if (body.privacy.showActivity !== undefined) {
        updates.showActivity = body.privacy.showActivity;
      }
    }

    // Update profile
    const updatedProfile = await db
      .update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, request.user.userId))
      .returning()
      .get();

    // Parse preferences
    let preferences = null;
    if (updatedProfile.preferences) {
      try {
        preferences = JSON.parse(updatedProfile.preferences);
      } catch {
        // Ignore
      }
    }

    return jsonResponse(
      {
        ...updatedProfile,
        preferences,
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
