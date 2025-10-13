/**
 * Analytics tracking utilities for MatchaMap
 * Handles user behavior tracking for metrics and insights
 */

import { api } from './api'

/**
 * Track cafe statistic (views, directions, marks, social clicks)
 * Fire-and-forget - errors are silently ignored
 */
export async function trackCafeStat(
  cafeId: number,
  stat: 'view' | 'directions' | 'passport' | 'instagram' | 'tiktok',
  userId?: number | null
): Promise<void> {
  await api.stats.trackCafeStat(cafeId, stat, userId)
}

/**
 * Track feed article click
 * Fire-and-forget - errors are silently ignored
 */
export async function trackFeedClick(feedItemId: number, userId?: number | null): Promise<void> {
  await api.stats.trackFeedClick(feedItemId, userId)
}

/**
 * Track event click
 * Fire-and-forget - errors are silently ignored
 */
export async function trackEventClick(eventId: number, userId?: number | null): Promise<void> {
  await api.stats.trackEventClick(eventId, userId)
}