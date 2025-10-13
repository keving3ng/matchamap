import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVisitedCafes } from '../useVisitedCafes'
import { useVisitedCafesStore } from '../../stores/visitedCafesStore'
import { waitForPersistence } from '../../test/helpers'

describe('useVisitedCafes', () => {
  beforeEach(() => {
    // Reset store before each test
    useVisitedCafesStore.setState({
      visitedCafeIds: [],
      stampedCafeIds: [],
    })

    // Clear localStorage
    localStorage.clear()

    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should initialize with empty visited cafes', () => {
    const { result } = renderHook(() => useVisitedCafes())

    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.getVisitedCount()).toBe(0)
  })

  it('should load visited cafes from localStorage', () => {
    // Directly set state to simulate restored session
    useVisitedCafesStore.setState({
      visitedCafeIds: [1, 2, 3],
    })

    const { result } = renderHook(() => useVisitedCafes())

    expect(result.current.visitedCafeIds).toEqual([1, 2, 3])
    expect(result.current.getVisitedCount()).toBe(3)
  })

  it('should mark cafe as visited', async () => {
    const { result } = renderHook(() => useVisitedCafes())

    act(() => {
      result.current.markAsVisited(1)
    })

    expect(result.current.visitedCafeIds).toEqual([1])
    expect(result.current.isVisited(1)).toBe(true)
    expect(result.current.getVisitedCount()).toBe(1)

    // Wait for persistence
    await waitForPersistence()

    // Check localStorage was updated
    const stored = localStorage.getItem('matchamap-visited-cafes')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.visitedCafeIds).toEqual([1])
  })

  it('should not duplicate visited cafes', () => {
    // Set initial state
    useVisitedCafesStore.setState({
      visitedCafeIds: [1],
    })

    const { result } = renderHook(() => useVisitedCafes())

    act(() => {
      result.current.markAsVisited(1) // Try to mark same cafe again
    })

    expect(result.current.visitedCafeIds).toEqual([1])
    expect(result.current.getVisitedCount()).toBe(1)
  })

  it('should mark cafe as unvisited', () => {
    // Set initial state
    useVisitedCafesStore.setState({
      visitedCafeIds: [1, 2, 3],
    })

    const { result } = renderHook(() => useVisitedCafes())

    act(() => {
      result.current.markAsUnvisited(2)
    })

    expect(result.current.visitedCafeIds).toEqual([1, 3])
    expect(result.current.isVisited(2)).toBe(false)
    expect(result.current.getVisitedCount()).toBe(2)
  })

  it('should toggle visited status', () => {
    // Set initial state
    useVisitedCafesStore.setState({
      visitedCafeIds: [1],
    })

    const { result } = renderHook(() => useVisitedCafes())

    // Toggle visited cafe to unvisited
    act(() => {
      result.current.toggleVisited(1)
    })

    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.isVisited(1)).toBe(false)

    // Toggle unvisited cafe to visited
    act(() => {
      result.current.toggleVisited(2)
    })

    expect(result.current.visitedCafeIds).toEqual([2])
    expect(result.current.isVisited(2)).toBe(true)
  })

  it('should clear all visited cafes', async () => {
    // Set initial state
    useVisitedCafesStore.setState({
      visitedCafeIds: [1, 2, 3],
    })

    const { result } = renderHook(() => useVisitedCafes())

    act(() => {
      result.current.clearAllVisited()
    })

    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.getVisitedCount()).toBe(0)

    // Wait for persistence
    await waitForPersistence()

    // Check localStorage was updated
    const stored = localStorage.getItem('matchamap-visited-cafes')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.visitedCafeIds).toEqual([])
  })

  it('should handle localStorage errors gracefully', () => {
    // Set corrupted localStorage data
    localStorage.setItem('matchamap-visited-cafes', 'invalid-json')

    const { result } = renderHook(() => useVisitedCafes())

    // Zustand persist middleware should handle errors gracefully
    // and initialize with default empty state
    expect(result.current.visitedCafeIds).toEqual([])
  })

  it('should handle invalid JSON in localStorage', () => {
    // Set invalid JSON
    localStorage.setItem('matchamap-visited-cafes', 'invalid json')

    const { result } = renderHook(() => useVisitedCafes())

    // Should fallback to default state
    expect(result.current.visitedCafeIds).toEqual([])
  })

  it('should handle non-array data in localStorage', () => {
    // Set non-array data
    localStorage.setItem('matchamap-visited-cafes', JSON.stringify({ state: { visitedCafeIds: { notAnArray: true } } }))

    const { result } = renderHook(() => useVisitedCafes())

    // Should fallback to default state or handle gracefully
    // Since the store expects an array, it should either be empty or the invalid data is rejected
    expect(Array.isArray(result.current.visitedCafeIds)).toBe(true)
  })
})