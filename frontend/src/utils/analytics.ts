/**
 * Analytics tracking utilities for MatchaMap
 * Handles user behavior tracking for metrics and insights
 */

import { api } from './api'
import { useAuthStore } from '../stores/authStore'

/**
 * Get user ID if authenticated, otherwise null
 * Used to track both anonymous and authenticated user actions
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
 * Track event click
 * Fire-and-forget - errors are silently ignored
 */
export async function trackEventClick(eventId: number): Promise<void> {
  const userId = getUserId()
  await api.stats.trackEventClick(eventId, userId)
}

/**
 * Track authenticated user check-in
 * Only works for logged-in users
 * Fire-and-forget - errors are silently ignored
 */
export async function trackCheckIn(cafeId: number, notes?: string): Promise<void> {
  const userId = getUserId()
  
  // Only track check-ins for authenticated users
  if (!userId) {
    console.warn('trackCheckIn called but user not authenticated')
    return
  }
  
  try {
    await api.stats.checkIn(cafeId, notes)
  } catch (error) {
    console.error('Failed to track check-in:', error)
    // Don't throw - fire-and-forget pattern
  }
}