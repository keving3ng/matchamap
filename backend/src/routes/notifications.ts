import { IRequest } from 'itty-router';
import { eq, and, desc, count } from 'drizzle-orm';
import { Env } from '../types';
import { getDb, notifications, users, userProfiles } from '../db';
import { jsonResponse, errorResponse, notFoundResponse, badRequestResponse } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/users/me/notifications
 * Get notifications for the authenticated user
 */
export async function getNotifications(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    const db = getDb(env.DB);

    // Build where clause
    const whereConditions = [eq(notifications.userId, request.user.userId)];
    if (unreadOnly) {
      whereConditions.push(eq(notifications.isRead, false));
    }

    // Get notifications with actor information
    const notificationsList = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        resourceType: notifications.resourceType,
        resourceId: notifications.resourceId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        // Actor information
        actorId: notifications.actorId,
        actorUsername: users.username,
        actorDisplayName: userProfiles.displayName,
        actorAvatarUrl: userProfiles.avatarUrl,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .leftJoin(userProfiles, eq(notifications.actorId, userProfiles.userId))
      .where(and(...whereConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    // Get unread count
    const unreadCountResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, request.user.userId), eq(notifications.isRead, false)))
      .get();

    const unreadCount = unreadCountResult?.count || 0;

    return jsonResponse({
      notifications: notificationsList,
      unreadCount,
      hasMore: notificationsList.length === limit,
    }, request as Request, env);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return errorResponse('Failed to fetch notifications', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
export async function markNotificationAsRead(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const notificationId = parseInt(request.params?.id as string);
    if (isNaN(notificationId)) {
      return badRequestResponse('Invalid notification ID', request as Request, env);
    }

    const db = getDb(env.DB);

    // Check if notification exists and belongs to user
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .get();

    if (!notification) {
      return notFoundResponse(request as Request, env);
    }

    if (notification.userId !== request.user.userId) {
      return errorResponse('Not authorized to mark this notification as read', HTTP_STATUS.FORBIDDEN, request as Request, env);
    }

    // Mark as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .run();

    return jsonResponse({ success: true }, request as Request, env);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return errorResponse('Failed to mark notification as read', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function markAllNotificationsAsRead(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    // Mark all unread notifications as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, request.user.userId), eq(notifications.isRead, false)))
      .run();

    return jsonResponse({ success: true }, request as Request, env);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return errorResponse('Failed to mark all notifications as read', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 */
export async function getUnreadCount(request: AuthenticatedRequest, env: Env): Promise<Response> {
  try {
    if (!request.user) {
      return errorResponse('Not authenticated', HTTP_STATUS.UNAUTHORIZED, request as Request, env);
    }

    const db = getDb(env.DB);

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, request.user.userId), eq(notifications.isRead, false)))
      .get();

    const unreadCount = result?.count || 0;

    return jsonResponse({ unreadCount }, request as Request, env);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return errorResponse('Failed to fetch unread count', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
