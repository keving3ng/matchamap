import { IRequest } from 'itty-router';
import { eq, and, count, desc } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, users, userProfiles, userFollows } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTP_STATUS } from '../constants';

/**
 * Update follower/following counts for a user
 * This function maintains denormalized counts in user_profiles
 */
async function updateFollowCounts(env: Env, userId: number): Promise<void> {
  try {
    const db = getDb(env.DB);

    // Count followers
    const followerResult = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId))
      .get();
    const followerCount = followerResult?.count || 0;

    // Count following
    const followingResult = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId))
      .get();
    const followingCount = followingResult?.count || 0;

    // Update user profile with new counts
    await db
      .update(userProfiles)
      .set({
        followerCount,
        followingCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userProfiles.userId, userId))
      .run();
  } catch (error) {
    console.error('Error updating follow counts:', error);
    // Don't throw - count updates should not break follow operations
  }
}

/**
 * POST /api/users/:username/follow
 * Follow a user
 */
export async function followUser(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const { username } = request.params as { username: string };

    if (!username) {
      return badRequestResponse('Username is required', request as Request, env);
    }

    const db = getDb(env.DB);

    // Find target user by username
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!targetUser) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Prevent self-following
    if (targetUser.id === request.user.userId) {
      return badRequestResponse('Cannot follow yourself', request as Request, env);
    }

    // Check if already following
    const existingFollow = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, request.user.userId),
          eq(userFollows.followingId, targetUser.id)
        )
      )
      .get();

    if (existingFollow) {
      return badRequestResponse('Already following this user', request as Request, env);
    }

    // Create follow relationship
    await db
      .insert(userFollows)
      .values({
        followerId: request.user.userId,
        followingId: targetUser.id,
      })
      .run();

    // Update counts for both users
    await Promise.all([
      updateFollowCounts(env, request.user.userId), // Update follower's following count
      updateFollowCounts(env, targetUser.id), // Update target's follower count
    ]);

    return jsonResponse(
      {
        success: true,
        message: `Now following ${username}`,
      },
      HTTP_STATUS.CREATED,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Follow user error:', error);
    return errorResponse('Failed to follow user', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * DELETE /api/users/:username/follow
 * Unfollow a user
 */
export async function unfollowUser(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const { username } = request.params as { username: string };

    if (!username) {
      return badRequestResponse('Username is required', request as Request, env);
    }

    const db = getDb(env.DB);

    // Find target user by username
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!targetUser) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Remove follow relationship
    const result = await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, request.user.userId),
          eq(userFollows.followingId, targetUser.id)
        )
      )
      .run();

    if (result.changes === 0) {
      return badRequestResponse('Not following this user', request as Request, env);
    }

    // Update counts for both users
    await Promise.all([
      updateFollowCounts(env, request.user.userId), // Update follower's following count
      updateFollowCounts(env, targetUser.id), // Update target's follower count
    ]);

    return jsonResponse(
      {
        success: true,
        message: `Unfollowed ${username}`,
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Unfollow user error:', error);
    return errorResponse('Failed to unfollow user', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/:username/followers
 * Get user's followers
 */
export async function getUserFollowers(request: IRequest, env: Env): Promise<Response> {
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

    // Check if user profile is public (or if requesting own profile)
    const requestUser = (request as AuthenticatedRequest).user;
    const isOwnProfile = requestUser && requestUser.userId === user.id;

    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .get();

    // Parse privacy settings
    let privacySettings = { isPublic: true, showActivity: true, showFollowers: true };
    if (userProfile?.privacySettings) {
      try {
        privacySettings = JSON.parse(userProfile.privacySettings);
      } catch {
        // Use defaults if parsing fails
      }
    }

    // Check if followers list is visible
    if (!privacySettings.showFollowers && !isOwnProfile) {
      return errorResponse('Followers list is private', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Get followers with user details
    const followers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        followedAt: userFollows.createdAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(userFollows.followingId, user.id))
      .orderBy(desc(userFollows.createdAt))
      .all();

    return jsonResponse(
      {
        followers: followers.map(follower => ({
          id: follower.id,
          username: follower.username,
          displayName: follower.displayName || follower.username,
          avatarUrl: follower.avatarUrl,
          followedAt: follower.followedAt,
        })),
        total: followers.length,
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Get followers error:', error);
    return errorResponse('Failed to get followers', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/:username/following
 * Get users that this user is following
 */
export async function getUserFollowing(request: IRequest, env: Env): Promise<Response> {
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

    // Check if user profile is public (or if requesting own profile)
    const requestUser = (request as AuthenticatedRequest).user;
    const isOwnProfile = requestUser && requestUser.userId === user.id;

    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .get();

    // Parse privacy settings
    let privacySettings = { isPublic: true, showActivity: true, showFollowers: true };
    if (userProfile?.privacySettings) {
      try {
        privacySettings = JSON.parse(userProfile.privacySettings);
      } catch {
        // Use defaults if parsing fails
      }
    }

    // Check if following list is visible (using same privacy setting as followers)
    if (!privacySettings.showFollowers && !isOwnProfile) {
      return errorResponse('Following list is private', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Get following with user details
    const following = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        followedAt: userFollows.createdAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(userFollows.followerId, user.id))
      .orderBy(desc(userFollows.createdAt))
      .all();

    return jsonResponse(
      {
        following: following.map(followedUser => ({
          id: followedUser.id,
          username: followedUser.username,
          displayName: followedUser.displayName || followedUser.username,
          avatarUrl: followedUser.avatarUrl,
          followedAt: followedUser.followedAt,
        })),
        total: following.length,
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Get following error:', error);
    return errorResponse('Failed to get following', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/users/:username/follow-status
 * Check if current user is following the specified user
 */
export async function getFollowStatus(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const { username } = request.params as { username: string };

    if (!username) {
      return badRequestResponse('Username is required', request as Request, env);
    }

    const db = getDb(env.DB);

    // Find target user by username
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!targetUser) {
      return errorResponse('User not found', HTTP_STATUS.NOT_FOUND, request as Request, env);
    }

    // Check if following
    const isFollowing = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, request.user.userId),
          eq(userFollows.followingId, targetUser.id)
        )
      )
      .get();

    return jsonResponse(
      {
        isFollowing: !!isFollowing,
        canFollow: targetUser.id !== request.user.userId, // Can't follow yourself
      },
      HTTP_STATUS.OK,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Get follow status error:', error);
    return errorResponse('Failed to get follow status', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}