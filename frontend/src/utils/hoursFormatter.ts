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
 * Parse a time string like "9:00 AM" into minutes since midnight
 */
function parseTime(timeStr: string): number | null {
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) {
    console.warn(`Failed to parse time: "${timeStr}"`)
    return null
  }

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return hours * 60 + minutes
}

/**
 * Check if cafe is currently open based on hours
 */
export function isCurrentlyOpen(hours: string | null | undefined): boolean | null {
  if (!hours) return null

  try {
    const hoursData = formatHoursCompact(hours)
    if (!hoursData?.todayHours) {
      console.warn('No hours data for today:', hours)
      return null
    }

    // Check if today shows "Closed"
    if (hoursData.todayHours.toLowerCase().includes('closed')) {
      return false
    }

    // Parse the time range from today's hours
    // Format: "Monday: 9:00 AM – 5:00 PM" or "Monday: 9:00 AM – 5:00 PM, 6:00 PM – 10:00 PM"
    const timeMatch = hoursData.todayHours.match(/:\s*(.+)/)
    if (!timeMatch) return null

    const timePart = timeMatch[1]

    // Handle multiple time ranges (split by comma)
    const ranges = timePart.split(',')

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Check if current time falls within any of the ranges
    for (const range of ranges) {
      // Handle all Unicode dash variations: – (en-dash), — (em-dash), - (hyphen), − (minus)
      const rangeParts = range.split(/[–—\-−]/).map(s => s.trim())
      if (rangeParts.length !== 2) {
        console.warn('Invalid time range format:', range, 'from', hoursData.todayHours)
        continue
      }

      const openTime = parseTime(rangeParts[0])
      const closeTime = parseTime(rangeParts[1])

      if (openTime === null || closeTime === null) {
        console.warn('Failed to parse times:', rangeParts, 'from', hoursData.todayHours)
        continue
      }

      // Handle cases where closing time is past midnight (rare for cafes but possible)
      if (closeTime < openTime) {
        // Spans midnight
        if (currentMinutes >= openTime || currentMinutes < closeTime) {
          return true
        }
      } else {
        // Normal case
        if (currentMinutes >= openTime && currentMinutes < closeTime) {
          return true
        }
      }
    }

    // Not within any time range
    return false
  } catch (error) {
    console.error('Error in isCurrentlyOpen:', error, 'Hours:', hours)
    return null
  }
}
