import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isCurrentlyOpen, formatHoursCompact } from '../hoursFormatter'

// Mock console methods to avoid cluttering test output
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

// Helper to create mock hours data
function createHoursData(todayHours: string): string {
  // Google Maps format: ["Monday: ...", "Tuesday: ...", etc.]
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const hoursArray = days.map((day, index) => {
    if (index === 0) return `${day}: ${todayHours}` // Monday (today for testing)
    return `${day}: 9:00 AM – 5:00 PM`
  })
  return JSON.stringify(hoursArray)
}

describe('parseTime 12-hour conversion', () => {
  // Note: parseTime is internal function, so we test through isCurrentlyOpen

  beforeEach(() => {
    mockConsoleWarn.mockClear()
    mockConsoleError.mockClear()
    // Mock Date to be Monday at 6:30 PM (18:30)
    vi.useFakeTimers()
    const mockDate = new Date('2024-01-01T18:30:00') // Monday
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('converts 12:00 PM to 720 minutes (noon) - should be open at 6:30 PM', () => {
    const hours = createHoursData('12:00 PM – 10:30 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })

  it('converts 12:00 AM to 0 minutes (midnight) - should handle midnight correctly', () => {
    const hours = createHoursData('12:00 AM – 2:00 AM')
    // Test at 1:00 AM
    vi.setSystemTime(new Date('2024-01-01T01:00:00'))
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })

  it('converts 1:00 PM to 780 minutes - should be open at 6:30 PM', () => {
    const hours = createHoursData('1:00 PM – 10:00 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })

  it('identifies cafe as closed before opening time', () => {
    // Test at 11:00 AM when cafe opens at 12:00 PM
    vi.setSystemTime(new Date('2024-01-01T11:00:00'))
    const hours = createHoursData('12:00 PM – 10:30 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(false)
  })

  it('identifies cafe as closed after closing time', () => {
    // Test at 11:00 PM when cafe closes at 10:30 PM
    vi.setSystemTime(new Date('2024-01-01T23:00:00'))
    const hours = createHoursData('12:00 PM – 10:30 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(false)
  })
})

describe('dash character variations', () => {
  beforeEach(() => {
    mockConsoleWarn.mockClear()
    mockConsoleError.mockClear()
    // Mock Date to be Monday at 2:00 PM (14:00)
    vi.useFakeTimers()
    const mockDate = new Date('2024-01-01T14:00:00') // Monday
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles en-dash (–) U+2013', () => {
    const hours = createHoursData('9:00 AM – 5:00 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })

  it('handles em-dash (—) U+2014', () => {
    const hours = createHoursData('9:00 AM — 5:00 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })

  it('handles hyphen (-) U+002D', () => {
    const hours = createHoursData('9:00 AM - 5:00 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })

  it('handles minus sign (−) U+2212', () => {
    const hours = createHoursData('9:00 AM − 5:00 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)
  })
})

describe('isCurrentlyOpen edge cases', () => {
  beforeEach(() => {
    mockConsoleWarn.mockClear()
    mockConsoleError.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles midnight-spanning hours (10:00 PM – 2:00 AM)', () => {
    // Test at 1:00 AM
    vi.setSystemTime(new Date('2024-01-01T01:00:00'))
    const hours = createHoursData('10:00 PM – 2:00 AM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)

    // Test at 11:00 PM
    vi.setSystemTime(new Date('2024-01-01T23:00:00'))
    const result2 = isCurrentlyOpen(hours)
    expect(result2).toBe(true)

    // Test at 3:00 AM (should be closed)
    vi.setSystemTime(new Date('2024-01-01T03:00:00'))
    const result3 = isCurrentlyOpen(hours)
    expect(result3).toBe(false)
  })

  it('handles multiple time ranges', () => {
    // Test at 10:00 AM (should be open in first range)
    vi.setSystemTime(new Date('2024-01-01T10:00:00'))
    const hours = createHoursData('9:00 AM – 11:00 AM, 5:00 PM – 10:00 PM')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(true)

    // Test at 7:00 PM (should be open in second range)
    vi.setSystemTime(new Date('2024-01-01T19:00:00'))
    const result2 = isCurrentlyOpen(hours)
    expect(result2).toBe(true)

    // Test at 1:00 PM (should be closed between ranges)
    vi.setSystemTime(new Date('2024-01-01T13:00:00'))
    const result3 = isCurrentlyOpen(hours)
    expect(result3).toBe(false)
  })

  it('handles "Closed" in hours string', () => {
    const hours = createHoursData('Closed')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(false)
  })

  it('returns null for invalid hours data', () => {
    expect(isCurrentlyOpen(null)).toBe(null)
    expect(isCurrentlyOpen(undefined)).toBe(null)
    expect(isCurrentlyOpen('')).toBe(null)
    expect(isCurrentlyOpen('invalid json')).toBe(null)
  })

  it('logs warnings for unparseable time strings', () => {
    const hours = createHoursData('invalid time format')
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(false) // Should return false when no valid ranges found
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to parse time/)
    )
  })

  it('logs warnings for invalid range formats', () => {
    const hours = createHoursData('9:00 AM to 5:00 PM') // Wrong separator
    const result = isCurrentlyOpen(hours)
    expect(result).toBe(false)
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Invalid time range format:',
      expect.any(String),
      'from',
      expect.any(String)
    )
  })
})

describe('formatHoursCompact', () => {
  beforeEach(() => {
    mockConsoleWarn.mockClear()
    vi.useFakeTimers()
    // Mock to Monday
    const mockDate = new Date('2024-01-01T12:00:00') // Monday
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('correctly identifies today\'s hours on Monday', () => {
    const hoursArray = [
      'Monday: 9:00 AM – 5:00 PM',
      'Tuesday: 9:00 AM – 5:00 PM',
      'Wednesday: 9:00 AM – 5:00 PM',
      'Thursday: 9:00 AM – 5:00 PM',
      'Friday: 9:00 AM – 5:00 PM',
      'Saturday: 10:00 AM – 4:00 PM',
      'Sunday: Closed'
    ]
    const hours = JSON.stringify(hoursArray)
    const result = formatHoursCompact(hours)
    
    expect(result).not.toBe(null)
    expect(result?.todayHours).toBe('Monday: 9:00 AM – 5:00 PM')
    expect(result?.allHours).toEqual(hoursArray)
  })

  it('correctly identifies today\'s hours on Sunday', () => {
    // Mock to Sunday
    vi.setSystemTime(new Date('2024-01-07T12:00:00')) // Sunday
    
    const hoursArray = [
      'Monday: 9:00 AM – 5:00 PM',
      'Tuesday: 9:00 AM – 5:00 PM',
      'Wednesday: 9:00 AM – 5:00 PM',
      'Thursday: 9:00 AM – 5:00 PM',
      'Friday: 9:00 AM – 5:00 PM',
      'Saturday: 10:00 AM – 4:00 PM',
      'Sunday: Closed'
    ]
    const hours = JSON.stringify(hoursArray)
    const result = formatHoursCompact(hours)
    
    expect(result).not.toBe(null)
    expect(result?.todayHours).toBe('Sunday: Closed')
  })

  it('returns null for invalid JSON', () => {
    const result = formatHoursCompact('invalid json')
    expect(result).toBe(null)
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Failed to parse hours data:',
      expect.any(Error)
    )
  })

  it('returns null for empty array', () => {
    const result = formatHoursCompact('[]')
    expect(result).toBe(null)
  })

  it('returns null for null/undefined input', () => {
    expect(formatHoursCompact(null)).toBe(null)
    expect(formatHoursCompact(undefined)).toBe(null)
  })
})