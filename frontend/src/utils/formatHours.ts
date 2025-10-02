/**
 * Parse and format hours from various formats
 */

export interface ParsedHours {
  weekdayDescriptions?: string[] // Array like ["Monday: 9:00 AM – 5:00 PM", ...]
}

/**
 * Parse hours from JSON string or plain text
 */
export function parseHours(hoursString: string): ParsedHours | null {
  if (!hoursString) return null

  try {
    // Try parsing as JSON first (from Google Places API)
    const parsed = JSON.parse(hoursString)
    if (Array.isArray(parsed)) {
      return { weekdayDescriptions: parsed }
    }
    return parsed
  } catch {
    // Not JSON, might be plain text separated by newlines
    const lines = hoursString.split('\n').filter(line => line.trim())
    if (lines.length > 0) {
      return { weekdayDescriptions: lines }
    }
    return null
  }
}

/**
 * Format hours for display in a compact format
 * Shows today's hours prominently, with option to expand for full week
 */
export function formatHoursCompact(hoursString: string): {
  todayHours: string | null
  allHours: string[]
} {
  const parsed = parseHours(hoursString)

  if (!parsed || !parsed.weekdayDescriptions) {
    return { todayHours: null, allHours: [] }
  }

  const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayMap[today]

  // Find today's hours
  const todayHours = parsed.weekdayDescriptions.find(desc =>
    desc.startsWith(todayName)
  )

  return {
    todayHours: todayHours || null,
    allHours: parsed.weekdayDescriptions
  }
}

/**
 * Format hours as simple list (one per line)
 */
export function formatHoursList(hoursString: string): string[] {
  const parsed = parseHours(hoursString)
  return parsed?.weekdayDescriptions || []
}

/**
 * Get just the time portion from hours string
 * "Monday: 9:00 AM – 5:00 PM" -> "9:00 AM – 5:00 PM"
 */
export function extractTime(hoursLine: string): string {
  const match = hoursLine.match(/:\s*(.+)/)
  return match ? match[1] : hoursLine
}

/**
 * Check if a cafe is currently open based on hours
 */
export function isOpenNow(hoursString: string): boolean | null {
  const parsed = parseHours(hoursString)
  if (!parsed || !parsed.weekdayDescriptions) return null

  const now = new Date()
  const today = now.getDay()
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayMap[today]

  const todayHours = parsed.weekdayDescriptions.find(desc =>
    desc.startsWith(todayName)
  )

  if (!todayHours) return null

  // Check if it says "Closed"
  if (todayHours.includes('Closed')) return false

  // Try to parse hours (this is simplified - full implementation would be more complex)
  // For now, just return null if we can't determine
  return null
}
