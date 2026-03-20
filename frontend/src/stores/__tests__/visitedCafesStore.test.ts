import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVisitedCafesStore } from '../visitedCafesStore'
import { waitForPersistence } from '../../test/helpers'

describe('visitedCafesStore', () => {
  beforeEach(() => {
    useVisitedCafesStore.setState({ visitedCafeIds: [], stampedCafeIds: [] })
    localStorage.clear()
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useVisitedCafesStore())
    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.stampedCafeIds).toEqual([])
    expect(result.current.getVisitedCount()).toBe(0)
    expect(result.current.getStampCount()).toBe(0)
  })

  it('visited: mark dedupes, unvisit removes, toggle cycles, clearAllVisited keeps stamps', () => {
    const { result } = renderHook(() => useVisitedCafesStore())

    act(() => {
      result.current.markAsVisited(1)
      result.current.markAsVisited(1)
      result.current.markAsVisited(2)
    })
    expect(result.current.visitedCafeIds).toEqual([1, 2])

    act(() => result.current.markAsUnvisited(999))
    expect(result.current.visitedCafeIds).toEqual([1, 2])

    act(() => {
      result.current.markAsUnvisited(2)
      result.current.toggleVisited(2)
      result.current.toggleVisited(2)
    })
    expect(result.current.isVisited(2)).toBe(false)

    act(() => {
      result.current.addStamp(1)
      result.current.clearAllVisited()
    })
    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.stampedCafeIds).toEqual([1])
  })

  it('stamps: add dedupes, remove, toggle cycles, clearAllStamps keeps visited', () => {
    const { result } = renderHook(() => useVisitedCafesStore())

    act(() => {
      result.current.addStamp(1)
      result.current.addStamp(1)
      result.current.addStamp(2)
    })
    expect(result.current.stampedCafeIds).toEqual([1, 2])

    act(() => result.current.removeStamp(99))
    expect(result.current.stampedCafeIds).toEqual([1, 2])

    act(() => {
      result.current.toggleStamp(3)
      result.current.toggleStamp(3)
    })
    expect(result.current.isStamped(3)).toBe(false)

    act(() => {
      result.current.markAsVisited(5)
      result.current.clearAllStamps()
    })
    expect(result.current.stampedCafeIds).toEqual([])
    expect(result.current.visitedCafeIds).toEqual([5])
  })

  it('visited and stamped lists are independent', () => {
    const { result } = renderHook(() => useVisitedCafesStore())
    act(() => {
      result.current.markAsVisited(1)
      result.current.addStamp(2)
    })
    expect(result.current.isVisited(1)).toBe(true)
    expect(result.current.isStamped(2)).toBe(true)
    act(() => {
      result.current.clearAllVisited()
      result.current.clearAllStamps()
    })
    expect(result.current.visitedCafeIds).toEqual([])
    expect(result.current.stampedCafeIds).toEqual([])
  })

  it('persists to localStorage', async () => {
    const { result } = renderHook(() => useVisitedCafesStore())
    act(() => {
      result.current.markAsVisited(1)
      result.current.addStamp(2)
    })
    await waitForPersistence()
    const raw = localStorage.getItem('matchamap-visited-cafes')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.visitedCafeIds).toEqual([1])
    expect(parsed.state.stampedCafeIds).toEqual([2])
  })

  it('shared store updates all hook instances', () => {
    const { result: a } = renderHook(() => useVisitedCafesStore())
    const { result: b } = renderHook(() => useVisitedCafesStore())
    act(() => a.current.markAsVisited(9))
    expect(b.current.visitedCafeIds).toEqual([9])
  })
})
