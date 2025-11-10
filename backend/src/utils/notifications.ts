import { getDb, notifications, NewNotification } from '../db';
import { Env } from '../types';

/**
 * Helper functions for creating notifications
 */

export type NotificationType = 'follower' | 'comment' | 'helpful' | 'badge' | 'comment_like';
export type ResourceType = 'review' | 'comment' | 'badge' | 'user';

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  message: string;
  actorId?: number;
  resourceType?: ResourceType;
  resourceId?: number;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  env: Env,
  params: CreateNotificationParams
): Promise<void> {
  try {
    const db = getDb(env.DB);

    const notification: NewNotification = {
      userId: params.userId,
      type: params.type,
      message: params.message,
      actorId: params.actorId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      isRead: false,
    };

    await db.insert(notifications).values(notification).run();
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notification creation should not break the main operation
  }
}

/**
 * Create a notification when someone follows a user
 */
export async function createFollowerNotification(
  env: Env,
  userId: number,
  followerId: number,
  followerUsername: string
): Promise<void> {
  await createNotification(env, {
    userId,
    type: 'follower',
    actorId: followerId,
    resourceType: 'user',
    resourceId: followerId,
    message: `${followerUsername} started following you`,
  });
}

/**
 * Create a notification when someone comments on a review
 */
export async function createCommentNotification(
  env: Env,
  reviewOwnerId: number,
  commenterId: number,
  commenterUsername: string,
  reviewId: number,
  commentId: number
): Promise<void> {
  // Don't notify if user comments on their own review
  if (reviewOwnerId === commenterId) {
    return;
  }

  await createNotification(env, {
    userId: reviewOwnerId,
    type: 'comment',
    actorId: commenterId,
    resourceType: 'review',
    resourceId: reviewId,
    message: `${commenterUsername} commented on your review`,
  });
}

/**
 * Create a notification when someone likes a comment
 */
export async function createCommentLikeNotification(
  env: Env,
  commentOwnerId: number,
  likerId: number,
  likerUsername: string,
  commentId: number
): Promise<void> {
  // Don't notify if user likes their own comment
  if (commentOwnerId === likerId) {
    return;
  }

  await createNotification(env, {
    userId: commentOwnerId,
    type: 'comment_like',
    actorId: likerId,
    resourceType: 'comment',
    resourceId: commentId,
    message: `${likerUsername} liked your comment`,
  });
}

/**
 * Create a notification when someone marks a review as helpful
 */
export async function createHelpfulNotification(
  env: Env,
  reviewOwnerId: number,
  voterId: number,
  voterUsername: string,
  reviewId: number
): Promise<void> {
  // Don't notify if user votes on their own review
  if (reviewOwnerId === voterId) {
    return;
  }

  await createNotification(env, {
    userId: reviewOwnerId,
    type: 'helpful',
    actorId: voterId,
    resourceType: 'review',
    resourceId: reviewId,
    message: `${voterUsername} found your review helpful`,
  });
}

/**
 * Create a notification when a user earns a badge
 */
export async function createBadgeNotification(
  env: Env,
  userId: number,
  badgeName: string,
  badgeId: number
): Promise<void> {
  await createNotification(env, {
    userId,
    type: 'badge',
    resourceType: 'badge',
    resourceId: badgeId,
    message: `You earned the "${badgeName}" badge!`,
  });
}
