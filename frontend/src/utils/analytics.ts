/**
 * Analytics tracking utilities for MatchaMap
 * Handles user behavior tracking for metrics and insights
 */

import { api } from './api'
import { useAuthStore } from '../stores/authStore'

/**
 * Get current user ID if authenticated, otherwise null
 */
function getUserId(): number | null {
  const { user } = useAuthStore.getState()
  return user?.id ?? null
}

/**
 * Track cafe statistic (views, directions, marks, social clicks)
 * Fire-and-forget - errors are silently ignored
 */
export async function trackCafeStat(
  cafeId: number,
  stat: 'view' | 'directions' | 'passport' | 'instagram' | 'tiktok'
): Promise<void> {
  const userId = getUserId()
  await api.stats.trackCafeStat(cafeId, stat, userId)
}

/**
 * Track feed article click
 * Fire-and-forget - errors are silently ignored
 */
export async function trackFeedClick(feedItemId: number): Promise<void> {
  const userId = getUserId()
  await api.stats.trackFeedClick(feedItemId, userId)
}

/**
 * Track event click
 * Fire-and-forget - errors are silently ignored
 */
export async function trackEventClick(eventId: number): Promise<void> {
  const userId = getUserId()
  await api.stats.trackEventClick(eventId, userId)
}