/**
 * Format hours data from Google Maps API for compact display
 */

export interface HoursData {
  todayHours: string | null
  allHours: string[]
}

/**
 * Get today's day of week (0 = Sunday, 1 = Monday, etc.)
 */
function getTodayDayIndex(): number {
  return new Date().getDay()
}

/**
 * Format hours for compact display, showing today's hours
 * @param hours - JSON string from Google Maps API weekdayDescriptions
 * @returns Formatted hours data or null if invalid
 */
export function formatHoursCompact(hours: string | null | undefined): HoursData | null {
  if (!hours) return null

  try {
    // Parse JSON array from Google Maps API
    const hoursArray: string[] = JSON.parse(hours)

    if (!Array.isArray(hoursArray) || hoursArray.length === 0) {
      return null
    }

    // Google Maps weekdayDescriptions format: ["Monday: 9:00 AM – 5:00 PM", ...]
    // Days are in order: Monday (0), Tuesday (1), ..., Sunday (6)

    // Convert JavaScript day (0=Sunday) to Google Maps format (0=Monday)
    const todayJsDay = getTodayDayIndex()
    const todayGoogleDay = todayJsDay === 0 ? 6 : todayJsDay - 1

    return {
      todayHours: hoursArray[todayGoogleDay] || null,
      allHours: hoursArray,
    }
  } catch (error) {
    console.warn('Failed to parse hours data:', error)
    return null
  }
}

/**
 * Check if cafe is currently open based on hours
 * Note: This is a simplified check - for production you'd want more robust time parsing
 */
export function isCurrentlyOpen(hours: string | null | undefined): boolean | null {
  if (!hours) return null

  try {
    const hoursData = formatHoursCompact(hours)
    if (!hoursData?.todayHours) return null

    // Check if today shows "Closed"
    if (hoursData.todayHours.toLowerCase().includes('closed')) {
      return false
    }

    // For a basic check, if there are hours listed, assume open
    // A more robust implementation would parse actual hours and check current time
    return true
  } catch {
    return null
  }
}
