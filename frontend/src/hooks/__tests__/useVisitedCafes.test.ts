import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVisitedCafes } from '../useVisitedCafes'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('useVisitedCafes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.getItem.mockReset()
    localStorageMock.setItem.mockReset()
  })

  it('should initialize with empty visited cafes', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useVisitedCafes())
    
    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.getVisitedCount()).toBe(0)
  })

  it('should load visited cafes from localStorage', () => {
    const existingVisited = [1, 2, 3]
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingVisited))
    
    const { result } = renderHook(() => useVisitedCafes())
    
    expect(result.current.visitedCafeIds).toEqual(existingVisited)
    expect(result.current.getVisitedCount()).toBe(3)
  })

  it('should mark cafe as visited', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useVisitedCafes())
    
    act(() => {
      result.current.markAsVisited(1)
    })
    
    expect(result.current.visitedCafeIds).toEqual([1])
    expect(result.current.isVisited(1)).toBe(true)
    expect(result.current.getVisitedCount()).toBe(1)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'matchamap-visited-cafes',
      JSON.stringify([1])
    )
  })

  it('should not duplicate visited cafes', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1]))
    
    const { result } = renderHook(() => useVisitedCafes())
    
    act(() => {
      result.current.markAsVisited(1) // Try to mark same cafe again
    })
    
    expect(result.current.visitedCafeIds).toEqual([1])
    expect(result.current.getVisitedCount()).toBe(1)
  })

  it('should mark cafe as unvisited', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]))
    
    const { result } = renderHook(() => useVisitedCafes())
    
    act(() => {
      result.current.markAsUnvisited(2)
    })
    
    expect(result.current.visitedCafeIds).toEqual([1, 3])
    expect(result.current.isVisited(2)).toBe(false)
    expect(result.current.getVisitedCount()).toBe(2)
  })

  it('should toggle visited status', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1]))
    
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

  it('should clear all visited cafes', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]))
    
    const { result } = renderHook(() => useVisitedCafes())
    
    act(() => {
      result.current.clearAllVisited()
    })
    
    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.getVisitedCount()).toBe(0)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'matchamap-visited-cafes',
      JSON.stringify([])
    )
  })

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error')
    })
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useVisitedCafes())
    
    expect(result.current.visitedCafeIds).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load visited cafes from localStorage:',
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should handle invalid JSON in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useVisitedCafes())
    
    expect(result.current.visitedCafeIds).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('should handle non-array data in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ notAnArray: true }))
    
    const { result } = renderHook(() => useVisitedCafes())
    
    expect(result.current.visitedCafeIds).toEqual([])
  })
})