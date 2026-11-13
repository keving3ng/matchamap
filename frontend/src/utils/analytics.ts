/**
 * Analytics tracking utilities for MatchaMap
 * Handles user behavior tracking for metrics and insights
 */

/**
 * Get user ID if authenticated, otherwise null
 * Used to track both anonymous and authenticated user actions
 */
async function getUserId(): Promise<number | null> {
  const { useAuthStore } = await import('../stores/authStore')
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
  const [{ api }, userId] = await Promise.all([import('./api'), getUserId()])
  await api.stats.trackCafeStat(cafeId, stat, userId)
}


/**
 * Track event click
 * Fire-and-forget - errors are silently ignored
 */
export async function trackEventClick(eventId: number): Promise<void> {
  const [{ api }, userId] = await Promise.all([import('./api'), getUserId()])
  await api.stats.trackEventClick(eventId, userId)
}