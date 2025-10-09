import { IRequest } from 'itty-router';
import { eq, count, desc, sql, gte, like, or, and } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, users, userProfiles, userCheckins } from '../db';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/admin/users
 * List all users with their profiles and stats
 */
export async function listUsers(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    // Validate and sanitize pagination parameters
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
    // Validate and sanitize search (limit length for security)
    const search = url.searchParams.get('search')?.trim().slice(0, 100);
    const role = url.searchParams.get('role'); // 'admin' or 'user'

    const db = getDb(env.DB);

    // Build WHERE conditions array
    const conditions = [];

    // Apply search filter at database level
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(users.email, searchPattern),
          like(users.username, searchPattern),
          like(userProfiles.displayName, searchPattern)
        )
      );
    }

    // Apply role filter at database level
    if (role && (role === 'admin' || role === 'user')) {
      conditions.push(eq(users.role, role));
    }

    // Build and execute query with all conditions in one go (fixes TypeScript type narrowing issues)
    const baseQuery = db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        totalCheckins: userProfiles.totalCheckins,
        totalReviews: userProfiles.totalReviews,
        reputationScore: userProfiles.reputationScore,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

    // Execute query with pagination and ordering
    const allUsers = await (conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery
    )
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    // Get total count with same filters (build in one go to avoid type issues)
    const baseCountQuery = db.select({ count: count() }).from(users);

    const countQuery = search
      ? baseCountQuery
          .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
          .where(
            conditions.length === 1 ? conditions[0] : and(...conditions)
          )
      : conditions.length > 0
      ? baseCountQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseCountQuery;

    const totalResult = await countQuery.get();
    const total = totalResult?.count || 0;

    return jsonResponse(
      {
        users: allUsers,
        total,
        limit,
        offset,
        hasMore: offset + allUsers.length < total,
      },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('List users error:', error);
    return errorResponse('Failed to list users', 500, request as Request, env);
  }
}

/**
 * GET /api/admin/users/stats
 * Get aggregated user statistics
 */
export async function getUserStats(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    const db = getDb(env.DB);

    // Total users
    const totalResult = await db.select({ count: count() }).from(users).get();
    const totalUsers = totalResult?.count || 0;

    // Admin users
    const adminResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'))
      .get();
    const adminUsers = adminResult?.count || 0;

    // Active this week (users with lastActiveAt in last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    const activeResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastActiveAt, oneWeekAgoStr))
      .get();
    const activeThisWeek = activeResult?.count || 0;

    // New users this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString();

    const newResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, oneMonthAgoStr))
      .get();
    const newThisMonth = newResult?.count || 0;

    return jsonResponse(
      {
        totalUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        activeThisWeek,
        newThisMonth,
      },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse('Failed to get user stats', 500, request as Request, env);
  }
}

/**
 * GET /api/admin/users/:id
 * Get single user with full details
 */
export async function getUser(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);

    if (!userId || isNaN(userId)) {
      return badRequestResponse('Invalid user ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Get user
    const user = await db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
      return errorResponse('User not found', 404, request as Request, env);
    }

    // Get profile
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .get();

    // Get check-ins count
    const checkinsResult = await db
      .select({ count: count() })
      .from(userCheckins)
      .where(eq(userCheckins.userId, userId))
      .get();
    const totalCheckins = checkinsResult?.count || 0;

    return jsonResponse(
      {
        user: {
          ...user,
          passwordHash: undefined, // Never send password hash to frontend
        },
        profile: profile || null,
        stats: {
          totalCheckins,
        },
      },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('Failed to get user', 500, request as Request, env);
  }
}

/**
 * PUT /api/admin/users/:id/role
 * Update user role (admin only, cannot demote yourself)
 */
export async function updateUserRole(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);

    if (!userId || isNaN(userId)) {
      return badRequestResponse('Invalid user ID', request as Request, env);
    }

    const body = (await request.json()) as { role: string };

    if (!body.role || (body.role !== 'admin' && body.role !== 'user')) {
      return badRequestResponse('Invalid role. Must be "admin" or "user"', request as Request, env);
    }

    // Prevent admins from demoting themselves
    if (request.user?.userId === userId && body.role === 'user') {
      return badRequestResponse(
        'You cannot demote yourself from admin',
        request as Request,
        env
      );
    }

    const db = getDb(env.DB);

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
      return errorResponse('User not found', 404, request as Request, env);
    }

    // Update role
    const updatedUser = await db
      .update(users)
      .set({
        role: body.role as 'admin' | 'user',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning()
      .get();

    return jsonResponse(
      {
        user: {
          ...updatedUser,
          passwordHash: undefined,
        },
      },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Update user role error:', error);
    return errorResponse('Failed to update user role', 500, request as Request, env);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete user (hard delete - removes user and all associated data)
 * Cannot delete yourself
 */
export async function deleteUser(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);

    if (!userId || isNaN(userId)) {
      return badRequestResponse('Invalid user ID', request as Request, env);
    }

    // Prevent admins from deleting themselves
    if (request.user?.userId === userId) {
      return badRequestResponse('You cannot delete yourself', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
      return errorResponse('User not found', 404, request as Request, env);
    }

    // Delete user (cascade will handle related records)
    await db.delete(users).where(eq(users.id, userId)).run();

    return jsonResponse(
      {
        success: true,
        message: 'User deleted successfully',
      },
      200,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('Failed to delete user', 500, request as Request, env);
  }
}
