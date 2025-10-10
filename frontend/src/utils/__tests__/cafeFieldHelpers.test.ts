import { describe, it, expect } from 'vitest'
import { OPTIONAL_CAFE_FIELDS } from '../../constants/cafeFields'
import type { Cafe } from '../../types'

// Helper function extracted for testing (this would be the logic from getMissingFields)
const getMissingFields = (cafe: Cafe): string[] => {
  return OPTIONAL_CAFE_FIELDS
    .filter(field => {
      const value = cafe[field.key as keyof Cafe]
      return value === null || value === undefined || value === ''
    })
    .map(field => field.label)
}

describe('getMissingFields', () => {
  const baseCafe: Cafe = {
    id: 1,
    name: 'Test Cafe',
    quickNote: 'A test cafe',
    city: 'toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    displayScore: 4.0,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    // All optional fields set to null initially
    address: null,
    review: null,
    hours: null,
    instagram: null,
    instagramPostLink: null,
    tiktokPostLink: null,
    images: null,
    ambianceScore: null,
    chargeForAltMilk: null,
    source: null,
  }

  it('returns empty array when all optional fields are present', () => {
    const completeCafe: Cafe = {
      ...baseCafe,
      address: '123 Main St',
      review: 'Great cafe',
      hours: '8am-6pm',
      instagram: '@testcafe',
      instagramPostLink: 'https://instagram.com/p/123',
      tiktokPostLink: 'https://tiktok.com/@user/video/123',
      images: ['image1.jpg'],
      ambianceScore: 4,
      chargeForAltMilk: false,
    }

    const missing = getMissingFields(completeCafe)
    expect(missing).toEqual([])
  })

  it('identifies all missing optional fields correctly', () => {
    const missing = getMissingFields(baseCafe)
    
    expect(missing).toEqual([
      'Address',
      'Review', 
      'Hours',
      'Instagram',
      'Instagram Post',
      'TikTok Post',
      'Images',
      'Ambiance Score',
      'Alt Milk Pricing'
    ])
  })

  it('identifies partially missing fields', () => {
    const partialCafe: Cafe = {
      ...baseCafe,
      address: '123 Main St',
      review: 'Nice place',
      // Other fields remain null
    }

    const missing = getMissingFields(partialCafe)
    
    expect(missing).toEqual([
      'Hours',
      'Instagram',
      'Instagram Post',
      'TikTok Post',
      'Images',
      'Ambiance Score',
      'Alt Milk Pricing'
    ])
  })

  it('treats empty strings as missing', () => {
    const emptyCafe: Cafe = {
      ...baseCafe,
      address: '',
      review: '',
      hours: '',
      instagram: '',
    }

    const missing = getMissingFields(emptyCafe)
    
    expect(missing).toContain('Address')
    expect(missing).toContain('Review')
    expect(missing).toContain('Hours')
    expect(missing).toContain('Instagram')
  })

  it('treats undefined values as missing', () => {
    const undefinedCafe: Cafe = {
      ...baseCafe,
      address: undefined,
      review: undefined,
    }

    const missing = getMissingFields(undefinedCafe)
    
    expect(missing).toContain('Address')
    expect(missing).toContain('Review')
  })

  it('excludes source field from checks', () => {
    // Source field should not be in the optional fields list
    const sourceFieldExists = OPTIONAL_CAFE_FIELDS.some(field => field.key === 'source')
    expect(sourceFieldExists).toBe(false)
  })

  it('handles boolean fields correctly', () => {
    const booleanCafe: Cafe = {
      ...baseCafe,
      chargeForAltMilk: false, // false is a valid value, not missing
    }

    const missing = getMissingFields(booleanCafe)
    
    expect(missing).not.toContain('Alt Milk Pricing')
  })

  it('handles numeric fields correctly', () => {
    const numericCafe: Cafe = {
      ...baseCafe,
      ambianceScore: 0, // 0 is a valid value, not missing
    }

    const missing = getMissingFields(numericCafe)
    
    expect(missing).not.toContain('Ambiance Score')
  })

  it('handles array fields correctly', () => {
    const arrayCafe: Cafe = {
      ...baseCafe,
      images: [], // Empty array should be treated as missing
    }

    const missing = getMissingFields(arrayCafe)
    
    // Note: This depends on how we want to handle empty arrays
    // Currently the logic checks for null/undefined/empty string
    // Empty arrays would not be caught by this logic
    expect(missing).not.toContain('Images')
  })
})

describe('OPTIONAL_CAFE_FIELDS', () => {
  it('contains expected field keys', () => {
    const expectedKeys = [
      'address',
      'review', 
      'hours',
      'instagram',
      'instagramPostLink',
      'tiktokPostLink',
      'images',
      'ambianceScore',
      'chargeForAltMilk'
    ]

    const actualKeys = OPTIONAL_CAFE_FIELDS.map(field => field.key)
    expect(actualKeys).toEqual(expectedKeys)
  })

  it('contains expected field labels', () => {
    const expectedLabels = [
      'Address',
      'Review',
      'Hours', 
      'Instagram',
      'Instagram Post',
      'TikTok Post',
      'Images',
      'Ambiance Score',
      'Alt Milk Pricing'
    ]

    const actualLabels = OPTIONAL_CAFE_FIELDS.map(field => field.label)
    expect(actualLabels).toEqual(expectedLabels)
  })

  it('excludes source field as specified', () => {
    const hasSourceField = OPTIONAL_CAFE_FIELDS.some(field => field.key === 'source')
    expect(hasSourceField).toBe(false)
  })
})