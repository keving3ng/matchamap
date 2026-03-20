/**
 * Click-through rate (CTR) as a percentage string for display (no "%" suffix).
 * Uses one decimal place, matching previous StatsPage inline behavior.
 */
export function calculateCtrPercentString(clicks: number, views: number): string {
  if (views <= 0 || !Number.isFinite(views) || !Number.isFinite(clicks)) {
    return '0.0'
  }
  return ((clicks / views) * 100).toFixed(1)
}
