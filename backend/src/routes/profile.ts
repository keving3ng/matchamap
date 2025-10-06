import { IRequest } from 'itty-router';
import { eq } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, users, userProfiles } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

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
      return errorResponse('User not found', 404, request as Request, env);
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
      return errorResponse('This profile is private', 403, request as Request, env);
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
          totalCheckins: profile.totalCheckins,
          totalPhotos: profile.totalPhotos,
          passportCompletion: 0, // TODO: Calculate this
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

    return jsonResponse(publicProfile, 200, request as Request, env);
  } catch (error) {
    console.error('Get user profile error:', error);
    return errorResponse('Failed to get user profile', 500, request as Request, env);
  }
}

/**
 * GET /api/users/me/profile
 * Get own profile (authenticated)
 */
export async function getMyProfile(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', 401, request as Request, env);
    }

    const db = getDb(env.DB);

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.userId))
      .get();

    if (!user) {
      return errorResponse('User not found', 404, request as Request, env);
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

    // Return full profile (including private fields)
    const fullProfile = {
      ...profile,
      preferences,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };

    return jsonResponse(fullProfile, 200, request as Request, env);
  } catch (error) {
    console.error('Get my profile error:', error);
    return errorResponse('Failed to get profile', 500, request as Request, env);
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
      return errorResponse('Not authenticated', 401, request as Request, env);
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

    // Build update object
    const updates: Partial<typeof userProfiles.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.displayName !== undefined) {
      // Validate display name length
      if (typeof body.displayName === 'string' && body.displayName.length > 50) {
        return badRequestResponse('Display name must be 50 characters or less', request as Request, env);
      }
      updates.displayName = body.displayName;
    }

    if (body.bio !== undefined) {
      // Limit bio to 500 characters
      if (typeof body.bio === 'string' && body.bio.length > 500) {
        return badRequestResponse('Bio must be 500 characters or less', request as Request, env);
      }
      updates.bio = body.bio;
    }

    if (body.location !== undefined) {
      // Validate location length
      if (typeof body.location === 'string' && body.location.length > 100) {
        return badRequestResponse('Location must be 100 characters or less', request as Request, env);
      }
      updates.location = body.location;
    }

    if (body.instagram !== undefined) {
      // Validate Instagram handle (alphanumeric, underscores, periods, max 30 chars)
      if (typeof body.instagram === 'string' && body.instagram.length > 0) {
        const cleanHandle = body.instagram.replace(/^@/, '');
        if (cleanHandle.length > 30) {
          return badRequestResponse('Instagram handle must be 30 characters or less', request as Request, env);
        }
        if (!/^[a-zA-Z0-9_.]+$/.test(cleanHandle)) {
          return badRequestResponse('Instagram handle can only contain letters, numbers, underscores, and periods', request as Request, env);
        }
        updates.instagram = cleanHandle;
      } else {
        updates.instagram = body.instagram;
      }
    }

    if (body.tiktok !== undefined) {
      // Validate TikTok handle (alphanumeric, underscores, periods, max 24 chars)
      if (typeof body.tiktok === 'string' && body.tiktok.length > 0) {
        const cleanHandle = body.tiktok.replace(/^@/, '');
        if (cleanHandle.length > 24) {
          return badRequestResponse('TikTok handle must be 24 characters or less', request as Request, env);
        }
        if (!/^[a-zA-Z0-9_.]+$/.test(cleanHandle)) {
          return badRequestResponse('TikTok handle can only contain letters, numbers, underscores, and periods', request as Request, env);
        }
        updates.tiktok = cleanHandle;
      } else {
        updates.tiktok = body.tiktok;
      }
    }

    if (body.website !== undefined) {
      // Validate website URL format
      if (typeof body.website === 'string' && body.website.length > 0) {
        if (body.website.length > 255) {
          return badRequestResponse('Website URL must be 255 characters or less', request as Request, env);
        }
        try {
          const url = new URL(body.website);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return badRequestResponse('Website URL must use HTTP or HTTPS protocol', request as Request, env);
          }
        } catch {
          return badRequestResponse('Invalid website URL format', request as Request, env);
        }
        updates.website = body.website;
      } else {
        updates.website = body.website;
      }
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
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('Failed to update profile', 500, request as Request, env);
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
      return errorResponse('Not authenticated', 401, request as Request, env);
    }

    // TODO: Implement Cloudflare Images upload
    // For now, return placeholder
    return errorResponse('Avatar upload not yet implemented', 501, request as Request, env);
  } catch (error) {
    console.error('Upload avatar error:', error);
    return errorResponse('Failed to upload avatar', 500, request as Request, env);
  }
}
