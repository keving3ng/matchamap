import { describe, it, expect, beforeEach } from 'vitest'
import { useCafeStore } from '../cafeStore'
import { useDataStore } from '../dataStore'
import { useLocationStore } from '../locationStore'
import { useUIStore } from '../uiStore'
import type { Cafe } from '../../../shared/types'

const mockCafes: Cafe[] = [
  {
    id: 1,
    name: 'Queen West Matcha',
    slug: 'queen-west-matcha',
    latitude: 43.6532,
    longitude: -79.3832,
    link: 'https://maps.google.com/?cid=1',
    address: '123 Queen St W',
    city: 'toronto',
    displayScore: 9.1,
    ambianceScore: 8.5,
    quickNote: 'Ceremonial grade whisked to order',
    chargeForAltMilk: 0,
    review: 'Rich umami finish',
    source: 'Editorial',
    instagram: '@queenwestmatcha',
    instagramPostLink: null,
    tiktokPostLink: null,
    hours: '9am-5pm',
    images: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Yorkville Tea House',
    slug: 'yorkville-tea-house',
    latitude: 43.6708,
    longitude: -79.3915,
    link: 'https://maps.google.com/?cid=2',
    address: '456 Bay St',
    city: 'toronto',
    displayScore: 8.4,
    ambianceScore: 9.0,
    quickNote: 'Quiet tatami seating',
    chargeForAltMilk: 0.75,
    review: 'Smooth iced latte',
    source: 'Editorial',
    instagram: '@yorkvilletea',
    instagramPostLink: null,
    tiktokPostLink: null,
    hours: '10am-6pm',
    images: '',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

describe('cafeStore + locationStore + uiStore integration', () => {
  beforeEach(() => {
    useDataStore.setState({ allCafes: [], cafesFetched: false })
    useLocationStore.setState({ coordinates: null, error: null, loading: false, permission: null })
    useCafeStore.setState({ cafesWithDistance: [], selectedCafe: null })
    useUIStore.setState({ showPopover: false, expandedCard: null, selectedDrinkType: null })
  })

  it('derives cafesWithDistance from dataStore and computes real Haversine distances when user coordinates are set', () => {
    useDataStore.setState({ allCafes: mockCafes })
    useCafeStore.getState()._recalculateCafes()

    expect(useCafeStore.getState().cafesWithDistance).toHaveLength(2)
    expect(useCafeStore.getState().cafesWithDistance[0].distanceInfo).toBeNull()

    // Set user location right at Queen West Matcha
    useLocationStore.getState().setCoordinates({
      latitude: 43.6532,
      longitude: -79.3832,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    } as GeolocationCoordinates)
    useCafeStore.getState()._recalculateCafes()

    const [first, second] = useCafeStore.getState().cafesWithDistance
    expect(first.distanceInfo?.kilometers).toBe(0)
    expect(second.distanceInfo?.kilometers).toBeGreaterThan(1.5)
    expect(second.distanceInfo?.kilometers).toBeLessThan(2.5)
    expect(second.distanceInfo?.walkTime).toContain('min')
  })

  it('keeps selectedCafe distanceInfo synchronized when location updates or clears', () => {
    useDataStore.setState({ allCafes: mockCafes })
    useCafeStore.getState()._recalculateCafes()
    useCafeStore.getState().setSelectedCafe(useCafeStore.getState().cafesWithDistance[1])
    expect(useCafeStore.getState().selectedCafe?.distanceInfo).toBeNull()

    useLocationStore.getState().setCoordinates({
      latitude: 43.6532,
      longitude: -79.3832,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    } as GeolocationCoordinates)
    useCafeStore.getState()._recalculateCafes()
    expect(useCafeStore.getState().selectedCafe?.distanceInfo?.kilometers).toBeGreaterThan(1.5)

    useLocationStore.getState().clearLocation()
    useCafeStore.getState()._recalculateCafes()
    expect(useCafeStore.getState().selectedCafe?.distanceInfo).toBeNull()
  })

  it('manages UI filter and popover state cleanly', () => {
    const ui = useUIStore.getState()
    ui.setShowPopover(true)
    ui.setExpandedCard(1)
    ui.setSelectedDrinkType('Iced Matcha Latte')

    expect(useUIStore.getState()).toMatchObject({
      showPopover: true,
      expandedCard: 1,
      selectedDrinkType: 'Iced Matcha Latte',
    })

    useUIStore.getState().closePopover()
    useUIStore.getState().setSelectedDrinkType(null)
    expect(useUIStore.getState().showPopover).toBe(false)
    expect(useUIStore.getState().selectedDrinkType).toBeNull()
  })
})
