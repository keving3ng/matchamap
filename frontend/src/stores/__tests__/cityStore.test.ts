import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCityStore, CITIES, type CityKey } from '../cityStore'
import { waitForPersistence } from '../../test/helpers'
import type { CityWithCount } from '../../../../shared/types'
import { api } from '../../utils/api'

vi.mock('../../utils/api', () => ({
  api: {
    cities: {
      getAll: vi.fn(),
    },
  },
}))

describe('cityStore', () => {
  const mockCitiesResponse: CityWithCount[] = [
    { city: 'toronto', cafe_count: 15 },
    { city: 'montreal', cafe_count: 8 },
  ]

  beforeEach(() => {
    useCityStore.setState({
      selectedCity: 'toronto',
      availableCities: [],
      availableCitiesLoaded: false,
    })
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to toronto and empty availability', () => {
    const { result } = renderHook(() => useCityStore())
    expect(result.current.selectedCity).toBe('toronto')
    expect(result.current.availableCities).toEqual([])
    expect(result.current.getAvailableCities()).toEqual([])
  })

  it('CITIES has expected keys and structure', () => {
    const keys = Object.keys(CITIES) as CityKey[]
    expect(keys.length).toBeGreaterThan(0)
    const toronto = CITIES.toronto
    expect(toronto.center).toHaveLength(2)
    expect(toronto.zoom).toBeGreaterThan(0)
  })

  it('setCity when unrestricted or city is allowed; blocked when not in list', () => {
    const { result } = renderHook(() => useCityStore())
    act(() => result.current.setCity('montreal'))
    expect(result.current.selectedCity).toBe('montreal')

    act(() =>
      useCityStore.setState({
        availableCities: ['toronto', 'tokyo'],
        availableCitiesLoaded: true,
      })
    )
    act(() => result.current.setCity('montreal'))
    expect(result.current.selectedCity).toBe('montreal')

    act(() => result.current.setCity('tokyo'))
    expect(result.current.selectedCity).toBe('tokyo')
  })

  it('getCity reflects selection', () => {
    const { result } = renderHook(() => useCityStore())
    act(() => result.current.setCity('montreal'))
    expect(result.current.getCity()).toEqual(CITIES.montreal)
  })

  it('loadAvailableCities maps API and reselects when current city not returned', async () => {
    vi.mocked(api.cities.getAll).mockResolvedValueOnce({ cities: mockCitiesResponse })

    const { result } = renderHook(() => useCityStore())
    await act(async () => {
      await result.current.loadAvailableCities()
    })

    expect(result.current.availableCitiesLoaded).toBe(true)
    expect(result.current.availableCities).toContain('toronto')

    vi.mocked(api.cities.getAll).mockResolvedValueOnce({ cities: [{ city: 'montreal', cafe_count: 1 }] })
    await act(async () => {
      useCityStore.setState({ selectedCity: 'toronto', availableCities: [], availableCitiesLoaded: false })
      await result.current.loadAvailableCities()
    })
    expect(result.current.selectedCity).toBe('montreal')
  })

  it('loadAvailableCities falls back to all cities on error', async () => {
    vi.mocked(api.cities.getAll).mockRejectedValueOnce(new Error('network'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCityStore())
    await act(async () => {
      await result.current.loadAvailableCities()
    })

    expect(result.current.availableCitiesLoaded).toBe(true)
    expect(result.current.availableCities.length).toBe(Object.keys(CITIES).length)
    consoleSpy.mockRestore()
  })

  it('persists selection', async () => {
    const { result } = renderHook(() => useCityStore())
    act(() => result.current.setCity('kyoto'))
    await waitForPersistence()
    expect(JSON.parse(localStorage.getItem('matchamap_selected_city')!).state.selectedCity).toBe('kyoto')
  })
})
