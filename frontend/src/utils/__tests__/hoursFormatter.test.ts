import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isCurrentlyOpen, formatHoursCompact } from '../hoursFormatter'

vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

function createHoursData(todayHours: string): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return JSON.stringify(
    days.map((day, index) => (index === 0 ? `${day}: ${todayHours}` : `${day}: 9:00 AM – 5:00 PM`))
  )
}

describe('hoursFormatter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T14:00:00')) // Monday 2:00 PM
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('evaluates open/closed status across standard, split, and midnight-spanning hours', () => {
    expect(isCurrentlyOpen(createHoursData('9:00 AM – 5:00 PM'))).toBe(true)
    expect(isCurrentlyOpen(createHoursData('9:00 AM - 5:00 PM'))).toBe(true)
    expect(isCurrentlyOpen(createHoursData('Closed'))).toBe(false)

    vi.setSystemTime(new Date('2024-01-01T13:00:00'))
    expect(isCurrentlyOpen(createHoursData('9:00 AM – 11:00 AM, 5:00 PM – 10:00 PM'))).toBe(false)

    vi.setSystemTime(new Date('2024-01-01T01:00:00'))
    expect(isCurrentlyOpen(createHoursData('10:00 PM – 2:00 AM'))).toBe(true)

    expect(isCurrentlyOpen(null)).toBeNull()
    expect(isCurrentlyOpen('invalid json')).toBeNull()
  })

  it('formats compact hours for current day and rejects malformed inputs', () => {
    const hours = createHoursData('8:00 AM – 4:00 PM')
    const compact = formatHoursCompact(hours)
    expect(compact?.todayHours).toBe('Monday: 8:00 AM – 4:00 PM')
    expect(compact?.allHours).toHaveLength(7)

    expect(formatHoursCompact('invalid')).toBeNull()
    expect(formatHoursCompact('[]')).toBeNull()
    expect(formatHoursCompact(null)).toBeNull()
  })
})
