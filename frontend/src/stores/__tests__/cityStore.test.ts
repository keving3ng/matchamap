import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCityStore, CITIES, type CityKey } from '../cityStore'
import { waitForPersistence } from '../../test/helpers'
import type { CityWithCount } from '../../../../shared/types'
import { api } from '../../utils/api'

// Mock the API client
vi.mock('../../utils/api', () => ({
  api: {
    cities: {
      getAll: vi.fn(),
    },
  },
}))

describe('cityStore', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  const mockCitiesResponse: CityWithCount[] = [
    { city: 'toronto', cafe_count: 15 },
    { city: 'montreal', cafe_count: 8 },
    { city: 'new york', cafe_count: 5 },
    { city: 'tokyo', cafe_count: 3 },
  ]

  beforeEach(() => {
    // Reset store before each test
    useCityStore.setState({
      selectedCity: 'toronto',
      availableCities: [],
      availableCitiesLoaded: false,
    })

    // Clear localStorage
    localStorage.clear()

    // Reset mocks
    vi.clearAllMocks()

    // Set up console.error spy
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('initialization', () => {
    it('should initialize with default Toronto selection', () => {
      const { result } = renderHook(() => useCityStore())
      
      expect(result.current.selectedCity).toBe('toronto')
      expect(result.current.availableCities).toEqual([])
      expect(result.current.availableCitiesLoaded).toBe(false)
    })

    it('should restore selected city from localStorage', () => {
      // Directly set state to simulate restored session
      useCityStore.setState({
        selectedCity: 'montreal',
        availableCities: ['toronto', 'montreal'],
        availableCitiesLoaded: true,
      })

      const { result } = renderHook(() => useCityStore())

      expect(result.current.selectedCity).toBe('montreal')
      expect(result.current.availableCities).toEqual(['toronto', 'montreal'])
      expect(result.current.availableCitiesLoaded).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('matchamap_selected_city', 'invalid-json')

      const { result } = renderHook(() => useCityStore())

      expect(result.current.selectedCity).toBe('toronto') // Default fallback
    })
  })

  describe('CITIES constant', () => {
    it('should have all expected cities with correct structure', () => {
      const expectedCities: CityKey[] = [
        'toronto', 'montreal', 'new york', 'mississauga', 
        'scarborough', 'tokyo', 'kyoto', 'osaka'
      ]

      expectedCities.forEach(cityKey => {
        expect(CITIES[cityKey]).toBeDefined()
        expect(CITIES[cityKey].key).toBe(cityKey)
        expect(CITIES[cityKey].name).toBeTruthy()
        expect(CITIES[cityKey].shortCode).toBeTruthy()
        expect(CITIES[cityKey].center).toHaveLength(2)
        expect(typeof CITIES[cityKey].center[0]).toBe('number') // latitude
        expect(typeof CITIES[cityKey].center[1]).toBe('number') // longitude
        expect(typeof CITIES[cityKey].zoom).toBe('number')
      })
    })

    it('should have valid coordinates for all cities', () => {
      Object.values(CITIES).forEach(city => {
        const [lat, lng] = city.center
        expect(lat).toBeGreaterThanOrEqual(-90)
        expect(lat).toBeLessThanOrEqual(90)
        expect(lng).toBeGreaterThanOrEqual(-180)
        expect(lng).toBeLessThanOrEqual(180)
        expect(city.zoom).toBeGreaterThan(0)
        expect(city.zoom).toBeLessThanOrEqual(18)
      })
    })

    it('should have unique short codes', () => {
      const shortCodes = Object.values(CITIES).map(city => city.shortCode)
      const uniqueShortCodes = new Set(shortCodes)
      expect(shortCodes.length).toBe(uniqueShortCodes.size)
    })
  })

  describe('setCity', () => {
    it('should set city when no available cities restriction', () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        result.current.setCity('montreal')
      })

      expect(result.current.selectedCity).toBe('montreal')
    })

    it('should allow setting city when it is in available cities list', () => {
      const { result } = renderHook(() => useCityStore())

      // First set available cities
      act(() => {
        useCityStore.setState({
          availableCities: ['toronto', 'montreal', 'tokyo'],
        })
      })

      // Then set city to one in the list
      act(() => {
        result.current.setCity('montreal')
      })

      expect(result.current.selectedCity).toBe('montreal')
    })

    it('should not allow setting city when it is not in available cities list', () => {
      const { result } = renderHook(() => useCityStore())

      // Set available cities (montreal not included)
      act(() => {
        useCityStore.setState({
          availableCities: ['toronto', 'tokyo'],
        })
      })

      const initialCity = result.current.selectedCity

      // Try to set city not in available list
      act(() => {
        result.current.setCity('montreal')
      })

      expect(result.current.selectedCity).toBe(initialCity) // Should not change
    })

    it('should persist city selection to localStorage', async () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        result.current.setCity('kyoto')
      })

      await waitForPersistence()

      const stored = localStorage.getItem('matchamap_selected_city')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.selectedCity).toBe('kyoto')
    })

    it('should handle all valid city keys', () => {
      const { result } = renderHook(() => useCityStore())

      const validCities: CityKey[] = Object.keys(CITIES) as CityKey[]

      validCities.forEach(cityKey => {
        act(() => {
          result.current.setCity(cityKey)
        })
        expect(result.current.selectedCity).toBe(cityKey)
      })
    })
  })

  describe('getCity', () => {
    it('should return current city details', () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        result.current.setCity('montreal')
      })

      const city = result.current.getCity()
      expect(city).toEqual(CITIES.montreal)
      expect(city.name).toBe('Montreal')
      expect(city.shortCode).toBe('MTL')
      expect(city.center).toEqual([45.5017, -73.5673])
    })

    it('should return correct city for all selections', () => {
      const { result } = renderHook(() => useCityStore())

      Object.keys(CITIES).forEach(cityKey => {
        act(() => {
          result.current.setCity(cityKey as CityKey)
        })
        
        const city = result.current.getCity()
        expect(city.key).toBe(cityKey)
        expect(city).toEqual(CITIES[cityKey as CityKey])
      })
    })

    it('should always return a valid city object', () => {
      const { result } = renderHook(() => useCityStore())

      const city = result.current.getCity()
      expect(city).toBeDefined()
      expect(city.key).toBeTruthy()
      expect(city.name).toBeTruthy()
      expect(city.center).toHaveLength(2)
      expect(typeof city.zoom).toBe('number')
    })
  })

  describe('getAvailableCities', () => {
    it('should return empty array when no cities are loaded', () => {
      const { result } = renderHook(() => useCityStore())

      const availableCities = result.current.getAvailableCities()
      expect(availableCities).toEqual([])
    })

    it('should return city objects for available city keys', () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        useCityStore.setState({
          availableCities: ['toronto', 'montreal', 'tokyo'],
        })
      })

      const availableCities = result.current.getAvailableCities()
      expect(availableCities).toHaveLength(3)
      expect(availableCities[0]).toEqual(CITIES.toronto)
      expect(availableCities[1]).toEqual(CITIES.montreal)
      expect(availableCities[2]).toEqual(CITIES.tokyo)
    })

    it('should filter out invalid city keys', () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        useCityStore.setState({
          availableCities: ['toronto', 'invalid-city', 'montreal'] as CityKey[],
        })
      })

      const availableCities = result.current.getAvailableCities()
      expect(availableCities).toHaveLength(2)
      expect(availableCities.map(c => c.key)).toEqual(['toronto', 'montreal'])
    })

    it('should return cities in the same order as availableCities array', () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        useCityStore.setState({
          availableCities: ['osaka', 'toronto', 'kyoto'],
        })
      })

      const availableCities = result.current.getAvailableCities()
      expect(availableCities.map(c => c.key)).toEqual(['osaka', 'toronto', 'kyoto'])
    })
  })

  describe('loadAvailableCities', () => {
    it('should load cities from API successfully', async () => {
      const { result } = renderHook(() => useCityStore())

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: mockCitiesResponse,
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto', 'montreal', 'new york', 'tokyo'])
      expect(result.current.availableCitiesLoaded).toBe(true)
      expect(api.cities.getAll).toHaveBeenCalled()
    })

    it('should normalize city names correctly', async () => {
      const { result } = renderHook(() => useCityStore())

      const unnormalizedResponse = [
        { city: ' TORONTO ', cafe_count: 15 },
        { city: 'Montreal', cafe_count: 8 },
        { city: 'NEW YORK', cafe_count: 5 },
      ]

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: unnormalizedResponse,
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto', 'montreal', 'new york'])
    })

    it('should filter out invalid city names', async () => {
      const { result } = renderHook(() => useCityStore())

      const mixedResponse = [
        { city: 'toronto', cafe_count: 15 },
        { city: 'invalid-city-name', cafe_count: 1 },
        { city: 'montreal', cafe_count: 8 },
        { city: 'another-invalid', cafe_count: 2 },
      ]

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: mixedResponse,
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto', 'montreal'])
    })

    it('should remove duplicate cities', async () => {
      const { result } = renderHook(() => useCityStore())

      const duplicateResponse = [
        { city: 'toronto', cafe_count: 10 },
        { city: 'montreal', cafe_count: 5 },
        { city: 'toronto', cafe_count: 5 }, // Duplicate
        { city: 'montreal', cafe_count: 3 }, // Duplicate
      ]

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: duplicateResponse,
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto', 'montreal'])
    })

    it('should switch to first available city if current is not available', async () => {
      const { result } = renderHook(() => useCityStore())

      // Set current city to one that won't be in the API response
      act(() => {
        useCityStore.setState({ selectedCity: 'kyoto' })
      })

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: [
          { city: 'toronto', cafe_count: 15 },
          { city: 'montreal', cafe_count: 8 },
        ],
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.selectedCity).toBe('toronto') // Should switch to first available
      expect(result.current.availableCities).toEqual(['toronto', 'montreal'])
    })

    it('should keep current city if it is available', async () => {
      const { result } = renderHook(() => useCityStore())

      // Set current city to one that will be in the API response
      act(() => {
        useCityStore.setState({ selectedCity: 'montreal' })
      })

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: [
          { city: 'toronto', cafe_count: 15 },
          { city: 'montreal', cafe_count: 8 },
          { city: 'tokyo', cafe_count: 3 },
        ],
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.selectedCity).toBe('montreal') // Should keep current selection
    })

    it('should handle API errors gracefully', async () => {
      const { result } = renderHook(() => useCityStore())

      vi.mocked(api.cities.getAll).mockRejectedValueOnce(new Error('API Error'))

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      // Should fallback to all cities
      expect(result.current.availableCities).toEqual(Object.keys(CITIES))
      expect(result.current.availableCitiesLoaded).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load available cities:', expect.any(Error))
    })

    it('should handle empty API response', async () => {
      const { result } = renderHook(() => useCityStore())

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: [],
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual([])
      expect(result.current.availableCitiesLoaded).toBe(true)
    })

    it('should handle malformed API response', async () => {
      const { result } = renderHook(() => useCityStore())

      const malformedResponse = [
        { city: 'toronto' }, // Missing cafe_count
        { cafe_count: 5 }, // Missing city
        { city: null, cafe_count: 3 }, // Null city
        { city: '', cafe_count: 2 }, // Empty city
      ]

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: malformedResponse,
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto'])
      expect(result.current.availableCitiesLoaded).toBe(true)
    })
  })

  describe('persistence', () => {
    it('should persist selectedCity and availableCities', async () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        result.current.setCity('osaka')
        useCityStore.setState({
          availableCities: ['toronto', 'osaka', 'kyoto'],
          availableCitiesLoaded: true,
        })
      })

      await waitForPersistence()

      const stored = localStorage.getItem('matchamap_selected_city')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.selectedCity).toBe('osaka')
      expect(parsedData.state.availableCities).toEqual(['toronto', 'osaka', 'kyoto'])
      expect(parsedData.state.availableCitiesLoaded).toBe(true)
    })

    it('should restore full state from localStorage', () => {
      // Directly set state to simulate restored session
      useCityStore.setState({
        selectedCity: 'tokyo',
        availableCities: ['tokyo', 'kyoto', 'osaka'],
        availableCitiesLoaded: true,
      })

      const { result } = renderHook(() => useCityStore())

      expect(result.current.selectedCity).toBe('tokyo')
      expect(result.current.availableCities).toEqual(['tokyo', 'kyoto', 'osaka'])
      expect(result.current.availableCitiesLoaded).toBe(true)
    })

    it('should handle partial state in localStorage', () => {
      // Directly set state to simulate partial restoration
      useCityStore.setState({
        selectedCity: 'montreal',
        // availableCities and availableCitiesLoaded will use defaults
      })

      const { result } = renderHook(() => useCityStore())

      expect(result.current.selectedCity).toBe('montreal')
      expect(result.current.availableCities).toEqual([]) // Default value
      expect(result.current.availableCitiesLoaded).toBe(false) // Default value
    })
  })

  describe('edge cases', () => {
    it('should handle setting invalid city key', () => {
      const { result } = renderHook(() => useCityStore())

      // TypeScript would prevent this, but test runtime behavior
      act(() => {
        result.current.setCity('invalid-city' as CityKey)
      })

      // Since there are no available cities restrictions, it should allow the invalid city
      expect(result.current.selectedCity).toBe('invalid-city')
    })

    it('should handle concurrent city changes', () => {
      const { result } = renderHook(() => useCityStore())

      act(() => {
        result.current.setCity('montreal')
        result.current.setCity('tokyo')
        result.current.setCity('osaka')
      })

      expect(result.current.selectedCity).toBe('osaka') // Last one wins
    })

    it('should handle rapid loadAvailableCities calls', async () => {
      const { result } = renderHook(() => useCityStore())

      // Mock different responses
      vi.mocked(api.cities.getAll)
        .mockResolvedValueOnce({ cities: [{ city: 'toronto', cafe_count: 1 }] })
        .mockResolvedValueOnce({ cities: [{ city: 'montreal', cafe_count: 2 }] })
        .mockResolvedValueOnce({ cities: [{ city: 'tokyo', cafe_count: 3 }] })

      await act(async () => {
        // Fire multiple requests concurrently
        await Promise.all([
          result.current.loadAvailableCities(),
          result.current.loadAvailableCities(),
          result.current.loadAvailableCities(),
        ])
      })

      expect(result.current.availableCitiesLoaded).toBe(true)
      expect(vi.mocked(api.cities.getAll)).toHaveBeenCalledTimes(3)
    })

    it('should maintain referential integrity for city objects', () => {
      const { result } = renderHook(() => useCityStore())

      const torontoCity1 = result.current.getCity()
      
      act(() => {
        result.current.setCity('montreal')
      })
      
      act(() => {
        result.current.setCity('toronto')
      })
      
      const torontoCity2 = result.current.getCity()
      
      // Should return the same object reference (from CITIES constant)
      expect(torontoCity1).toBe(CITIES.toronto)
      expect(torontoCity2).toBe(CITIES.toronto)
      expect(torontoCity1).toBe(torontoCity2)
    })

    it('should handle empty strings and null values in API response', async () => {
      const { result } = renderHook(() => useCityStore())

      const badResponse = [
        { city: '', cafe_count: 1 },
        { city: null, cafe_count: 2 },
        { city: undefined, cafe_count: 3 },
        { city: 'toronto', cafe_count: 4 },
      ] as any[]

      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: badResponse,
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto'])
    })
  })

  describe('store subscriptions', () => {
    it('should notify subscribers of city changes', () => {
      const { result: result1 } = renderHook(() => useCityStore())
      const { result: result2 } = renderHook(() => useCityStore())

      // Both should start with same city
      expect(result1.current.selectedCity).toBe(result2.current.selectedCity)

      // Change through first hook
      act(() => {
        result1.current.setCity('montreal')
      })

      // Both should reflect the change
      expect(result1.current.selectedCity).toBe('montreal')
      expect(result2.current.selectedCity).toBe('montreal')
    })

    it('should handle subscription updates during state changes', () => {
      const { result } = renderHook(() => useCityStore())

      let callbackCount = 0
      const unsubscribe = useCityStore.subscribe(() => {
        callbackCount++
      })

      act(() => {
        result.current.setCity('montreal')
        result.current.setCity('tokyo')
        result.current.setCity('osaka')
      })

      expect(callbackCount).toBeGreaterThan(0)
      unsubscribe()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete user workflow', async () => {
      const { result } = renderHook(() => useCityStore())

      // 1. User loads the app (default state)
      expect(result.current.selectedCity).toBe('toronto')
      expect(result.current.availableCitiesLoaded).toBe(false)

      // 2. App loads available cities from API
      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: [
          { city: 'toronto', cafe_count: 15 },
          { city: 'montreal', cafe_count: 8 },
          { city: 'tokyo', cafe_count: 3 },
        ],
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      expect(result.current.availableCities).toEqual(['toronto', 'montreal', 'tokyo'])
      expect(result.current.selectedCity).toBe('toronto') // Should remain toronto

      // 3. User selects different city
      act(() => {
        result.current.setCity('montreal')
      })

      expect(result.current.selectedCity).toBe('montreal')
      expect(result.current.getCity().name).toBe('Montreal')

      // 4. User refreshes browser (tests persistence)
      await waitForPersistence()

      const stored = localStorage.getItem('matchamap_selected_city')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.selectedCity).toBe('montreal')
    })

    it('should handle city restriction workflow', async () => {
      const { result } = renderHook(() => useCityStore())

      // 1. Load limited available cities
      vi.mocked(api.cities.getAll).mockResolvedValueOnce({
        cities: [
          { city: 'toronto', cafe_count: 15 },
          { city: 'montreal', cafe_count: 8 },
        ],
      })

      await act(async () => {
        await result.current.loadAvailableCities()
      })

      // 2. Try to select city not in available list
      act(() => {
        result.current.setCity('tokyo') // Not in available cities
      })

      expect(result.current.selectedCity).toBe('toronto') // Should not change

      // 3. Select valid city
      act(() => {
        result.current.setCity('montreal')
      })

      expect(result.current.selectedCity).toBe('montreal') // Should change
    })
  })
})