import { describe, it, expect } from 'vitest'
import { calculateCtrPercentString } from '../metrics'

describe('calculateCtrPercentString', () => {
  it('returns 0.0 when views is 0', () => {
    expect(calculateCtrPercentString(5, 0)).toBe('0.0')
  })

  it('returns 0.0 when views is negative', () => {
    expect(calculateCtrPercentString(1, -1)).toBe('0.0')
  })

  it('computes percentage with one decimal', () => {
    expect(calculateCtrPercentString(1, 4)).toBe('25.0')
    expect(calculateCtrPercentString(3, 10)).toBe('30.0')
  })

  it('handles non-finite inputs', () => {
    expect(calculateCtrPercentString(Number.NaN, 10)).toBe('0.0')
    expect(calculateCtrPercentString(1, Number.NaN)).toBe('0.0')
  })
})
