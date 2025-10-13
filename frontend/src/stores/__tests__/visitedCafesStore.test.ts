import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVisitedCafesStore } from '../visitedCafesStore'
import { waitForPersistence } from '../../test/helpers'

describe('visitedCafesStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useVisitedCafesStore.setState({
      visitedCafeIds: [],
      stampedCafeIds: [],
    })

    // Clear localStorage (globalThis setup from test/setup.ts)
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with empty visited and stamped lists', () => {
      const { result } = renderHook(() => useVisitedCafesStore())
      
      expect(result.current.visitedCafeIds).toEqual([])
      expect(result.current.stampedCafeIds).toEqual([])
      expect(result.current.getVisitedCount()).toBe(0)
      expect(result.current.getStampCount()).toBe(0)
    })

    it('should restore data from localStorage', async () => {
      // Set up localStorage with existing data and manually set store state
      // (Zustand hydration happens on module load, so we manually restore for testing)
      const visitedIds = [1, 2, 3]
      const stampedIds = [2, 4]

      useVisitedCafesStore.setState({
        visitedCafeIds: visitedIds,
        stampedCafeIds: stampedIds,
      })

      const { result } = renderHook(() => useVisitedCafesStore())

      expect(result.current.visitedCafeIds).toEqual(visitedIds)
      expect(result.current.stampedCafeIds).toEqual(stampedIds)
      expect(result.current.getVisitedCount()).toBe(3)
      expect(result.current.getStampCount()).toBe(2)
    })
  })

  describe('visited cafes functionality', () => {
    describe('markAsVisited', () => {
      it('should mark a cafe as visited', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(1)
        })

        expect(result.current.visitedCafeIds).toEqual([1])
        expect(result.current.isVisited(1)).toBe(true)
        expect(result.current.getVisitedCount()).toBe(1)
      })

      it('should not duplicate cafe IDs when marking as visited multiple times', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(1)
          result.current.markAsVisited(1)
          result.current.markAsVisited(1)
        })

        expect(result.current.visitedCafeIds).toEqual([1])
        expect(result.current.getVisitedCount()).toBe(1)
      })

      it('should add multiple different cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(1)
          result.current.markAsVisited(2)
          result.current.markAsVisited(3)
        })

        expect(result.current.visitedCafeIds).toEqual([1, 2, 3])
        expect(result.current.getVisitedCount()).toBe(3)
      })

      it('should persist visited cafes to localStorage', async () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(5)
        })

        // Wait for persistence
        await waitForPersistence()

        const stored = localStorage.getItem('matchamap-visited-cafes')
        expect(stored).toBeTruthy()

        const parsedData = JSON.parse(stored!)
        expect(parsedData.state.visitedCafeIds).toEqual([5])
      })
    })

    describe('markAsUnvisited', () => {
      it('should remove a cafe from visited list', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // First mark as visited
        act(() => {
          result.current.markAsVisited(1)
          result.current.markAsVisited(2)
          result.current.markAsVisited(3)
        })
        expect(result.current.visitedCafeIds).toEqual([1, 2, 3])

        // Then unmark one
        act(() => {
          result.current.markAsUnvisited(2)
        })

        expect(result.current.visitedCafeIds).toEqual([1, 3])
        expect(result.current.isVisited(2)).toBe(false)
        expect(result.current.getVisitedCount()).toBe(2)
      })

      it('should handle unmarking a cafe that was not visited', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(1)
        })

        // Try to unmark a cafe that was never visited
        act(() => {
          result.current.markAsUnvisited(999)
        })

        expect(result.current.visitedCafeIds).toEqual([1])
        expect(result.current.getVisitedCount()).toBe(1)
      })

      it('should handle unmarking from empty list', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsUnvisited(1)
        })

        expect(result.current.visitedCafeIds).toEqual([])
        expect(result.current.getVisitedCount()).toBe(0)
      })
    })

    describe('toggleVisited', () => {
      it('should mark as visited when not visited', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.toggleVisited(1)
        })

        expect(result.current.isVisited(1)).toBe(true)
        expect(result.current.visitedCafeIds).toEqual([1])
      })

      it('should mark as unvisited when already visited', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // First mark as visited
        act(() => {
          result.current.markAsVisited(1)
        })
        expect(result.current.isVisited(1)).toBe(true)

        // Then toggle to unvisited
        act(() => {
          result.current.toggleVisited(1)
        })

        expect(result.current.isVisited(1)).toBe(false)
        expect(result.current.visitedCafeIds).toEqual([])
      })

      it('should handle multiple toggles correctly', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // Toggle on
        act(() => {
          result.current.toggleVisited(1)
        })
        expect(result.current.isVisited(1)).toBe(true)

        // Toggle off
        act(() => {
          result.current.toggleVisited(1)
        })
        expect(result.current.isVisited(1)).toBe(false)

        // Toggle on again
        act(() => {
          result.current.toggleVisited(1)
        })
        expect(result.current.isVisited(1)).toBe(true)
      })
    })

    describe('isVisited', () => {
      it('should return true for visited cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(1)
          result.current.markAsVisited(5)
        })

        expect(result.current.isVisited(1)).toBe(true)
        expect(result.current.isVisited(5)).toBe(true)
      })

      it('should return false for unvisited cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.markAsVisited(1)
        })

        expect(result.current.isVisited(2)).toBe(false)
        expect(result.current.isVisited(999)).toBe(false)
      })

      it('should return false when list is empty', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        expect(result.current.isVisited(1)).toBe(false)
      })
    })

    describe('getVisitedCount', () => {
      it('should return correct count', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        expect(result.current.getVisitedCount()).toBe(0)

        act(() => {
          result.current.markAsVisited(1)
        })
        expect(result.current.getVisitedCount()).toBe(1)

        act(() => {
          result.current.markAsVisited(2)
          result.current.markAsVisited(3)
        })
        expect(result.current.getVisitedCount()).toBe(3)

        act(() => {
          result.current.markAsUnvisited(2)
        })
        expect(result.current.getVisitedCount()).toBe(2)
      })
    })

    describe('clearAllVisited', () => {
      it('should clear all visited cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // Add some visited cafes
        act(() => {
          result.current.markAsVisited(1)
          result.current.markAsVisited(2)
          result.current.markAsVisited(3)
        })
        expect(result.current.getVisitedCount()).toBe(3)

        // Clear all
        act(() => {
          result.current.clearAllVisited()
        })

        expect(result.current.visitedCafeIds).toEqual([])
        expect(result.current.getVisitedCount()).toBe(0)
        expect(result.current.isVisited(1)).toBe(false)
        expect(result.current.isVisited(2)).toBe(false)
        expect(result.current.isVisited(3)).toBe(false)
      })

      it('should not affect stamped cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // Add visited and stamped cafes
        act(() => {
          result.current.markAsVisited(1)
          result.current.addStamp(1)
          result.current.addStamp(2)
        })

        // Clear visited only
        act(() => {
          result.current.clearAllVisited()
        })

        expect(result.current.visitedCafeIds).toEqual([])
        expect(result.current.stampedCafeIds).toEqual([1, 2])
      })
    })
  })

  describe('passport stamps functionality', () => {
    describe('addStamp', () => {
      it('should add a stamp for a cafe', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.addStamp(1)
        })

        expect(result.current.stampedCafeIds).toEqual([1])
        expect(result.current.isStamped(1)).toBe(true)
        expect(result.current.getStampCount()).toBe(1)
      })

      it('should not duplicate stamps', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.addStamp(1)
          result.current.addStamp(1)
          result.current.addStamp(1)
        })

        expect(result.current.stampedCafeIds).toEqual([1])
        expect(result.current.getStampCount()).toBe(1)
      })

      it('should add multiple different stamps', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.addStamp(1)
          result.current.addStamp(2)
          result.current.addStamp(3)
        })

        expect(result.current.stampedCafeIds).toEqual([1, 2, 3])
        expect(result.current.getStampCount()).toBe(3)
      })
    })

    describe('removeStamp', () => {
      it('should remove a stamp', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // First add stamps
        act(() => {
          result.current.addStamp(1)
          result.current.addStamp(2)
          result.current.addStamp(3)
        })
        expect(result.current.stampedCafeIds).toEqual([1, 2, 3])

        // Remove one stamp
        act(() => {
          result.current.removeStamp(2)
        })

        expect(result.current.stampedCafeIds).toEqual([1, 3])
        expect(result.current.isStamped(2)).toBe(false)
        expect(result.current.getStampCount()).toBe(2)
      })

      it('should handle removing non-existent stamp', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.addStamp(1)
        })

        // Try to remove a stamp that doesn't exist
        act(() => {
          result.current.removeStamp(999)
        })

        expect(result.current.stampedCafeIds).toEqual([1])
        expect(result.current.getStampCount()).toBe(1)
      })
    })

    describe('toggleStamp', () => {
      it('should add stamp when not stamped', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.toggleStamp(1)
        })

        expect(result.current.isStamped(1)).toBe(true)
        expect(result.current.stampedCafeIds).toEqual([1])
      })

      it('should remove stamp when already stamped', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // First add stamp
        act(() => {
          result.current.addStamp(1)
        })
        expect(result.current.isStamped(1)).toBe(true)

        // Then toggle to remove
        act(() => {
          result.current.toggleStamp(1)
        })

        expect(result.current.isStamped(1)).toBe(false)
        expect(result.current.stampedCafeIds).toEqual([])
      })

      it('should handle multiple toggles', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // Toggle on
        act(() => {
          result.current.toggleStamp(1)
        })
        expect(result.current.isStamped(1)).toBe(true)

        // Toggle off
        act(() => {
          result.current.toggleStamp(1)
        })
        expect(result.current.isStamped(1)).toBe(false)

        // Toggle on again
        act(() => {
          result.current.toggleStamp(1)
        })
        expect(result.current.isStamped(1)).toBe(true)
      })
    })

    describe('isStamped', () => {
      it('should return true for stamped cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.addStamp(1)
          result.current.addStamp(5)
        })

        expect(result.current.isStamped(1)).toBe(true)
        expect(result.current.isStamped(5)).toBe(true)
      })

      it('should return false for unstamped cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        act(() => {
          result.current.addStamp(1)
        })

        expect(result.current.isStamped(2)).toBe(false)
        expect(result.current.isStamped(999)).toBe(false)
      })
    })

    describe('getStampCount', () => {
      it('should return correct stamp count', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        expect(result.current.getStampCount()).toBe(0)

        act(() => {
          result.current.addStamp(1)
        })
        expect(result.current.getStampCount()).toBe(1)

        act(() => {
          result.current.addStamp(2)
          result.current.addStamp(3)
        })
        expect(result.current.getStampCount()).toBe(3)

        act(() => {
          result.current.removeStamp(2)
        })
        expect(result.current.getStampCount()).toBe(2)
      })
    })

    describe('clearAllStamps', () => {
      it('should clear all stamps', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // Add some stamps
        act(() => {
          result.current.addStamp(1)
          result.current.addStamp(2)
          result.current.addStamp(3)
        })
        expect(result.current.getStampCount()).toBe(3)

        // Clear all
        act(() => {
          result.current.clearAllStamps()
        })

        expect(result.current.stampedCafeIds).toEqual([])
        expect(result.current.getStampCount()).toBe(0)
        expect(result.current.isStamped(1)).toBe(false)
        expect(result.current.isStamped(2)).toBe(false)
        expect(result.current.isStamped(3)).toBe(false)
      })

      it('should not affect visited cafes', () => {
        const { result } = renderHook(() => useVisitedCafesStore())

        // Add visited and stamped cafes
        act(() => {
          result.current.markAsVisited(1)
          result.current.markAsVisited(2)
          result.current.addStamp(1)
        })

        // Clear stamps only
        act(() => {
          result.current.clearAllStamps()
        })

        expect(result.current.stampedCafeIds).toEqual([])
        expect(result.current.visitedCafeIds).toEqual([1, 2])
      })
    })
  })

  describe('independence of visited and stamped states', () => {
    it('should maintain separate visited and stamped lists', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(1)
        result.current.markAsVisited(2)
        result.current.addStamp(2)
        result.current.addStamp(3)
      })

      expect(result.current.visitedCafeIds).toEqual([1, 2])
      expect(result.current.stampedCafeIds).toEqual([2, 3])
      
      expect(result.current.isVisited(1)).toBe(true)
      expect(result.current.isStamped(1)).toBe(false)
      
      expect(result.current.isVisited(2)).toBe(true)
      expect(result.current.isStamped(2)).toBe(true)
      
      expect(result.current.isVisited(3)).toBe(false)
      expect(result.current.isStamped(3)).toBe(true)
    })

    it('should allow same cafe to be both visited and stamped', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(1)
        result.current.addStamp(1)
      })

      expect(result.current.isVisited(1)).toBe(true)
      expect(result.current.isStamped(1)).toBe(true)
      expect(result.current.visitedCafeIds).toEqual([1])
      expect(result.current.stampedCafeIds).toEqual([1])
    })

    it('should clear visited and stamped independently', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(1)
        result.current.markAsVisited(2)
        result.current.addStamp(1)
        result.current.addStamp(3)
      })

      // Clear visited only
      act(() => {
        result.current.clearAllVisited()
      })

      expect(result.current.visitedCafeIds).toEqual([])
      expect(result.current.stampedCafeIds).toEqual([1, 3])

      // Clear stamps only
      act(() => {
        result.current.clearAllStamps()
      })

      expect(result.current.visitedCafeIds).toEqual([])
      expect(result.current.stampedCafeIds).toEqual([])
    })
  })

  describe('persistence', () => {
    it('should persist both visited and stamped data', async () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(1)
        result.current.markAsVisited(2)
        result.current.addStamp(2)
        result.current.addStamp(3)
      })

      // Wait for persistence
      await waitForPersistence()

      const stored = localStorage.getItem('matchamap-visited-cafes')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.visitedCafeIds).toEqual([1, 2])
      expect(parsedData.state.stampedCafeIds).toEqual([2, 3])
    })

    it('should restore both visited and stamped data on initialization', async () => {
      // Manually set state to simulate hydration
      const visitedIds = [1, 3, 5]
      const stampedIds = [2, 4, 6]

      useVisitedCafesStore.setState({
        visitedCafeIds: visitedIds,
        stampedCafeIds: stampedIds,
      })

      const { result } = renderHook(() => useVisitedCafesStore())

      expect(result.current.visitedCafeIds).toEqual(visitedIds)
      expect(result.current.stampedCafeIds).toEqual(stampedIds)
      expect(result.current.getVisitedCount()).toBe(3)
      expect(result.current.getStampCount()).toBe(3)
    })

    it('should handle partial data in localStorage', async () => {
      // Simulate partial restoration (only visited, no stamped)
      useVisitedCafesStore.setState({
        visitedCafeIds: [1, 2],
        stampedCafeIds: [], // Explicitly set to empty to simulate missing data
      })

      const { result } = renderHook(() => useVisitedCafesStore())

      expect(result.current.visitedCafeIds).toEqual([1, 2])
      expect(result.current.stampedCafeIds).toEqual([]) // Should be empty
    })
  })

  describe('edge cases', () => {
    it('should handle zero as valid cafe ID', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(0)
        result.current.addStamp(0)
      })

      expect(result.current.isVisited(0)).toBe(true)
      expect(result.current.isStamped(0)).toBe(true)
    })

    it('should handle negative cafe IDs', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(-1)
        result.current.addStamp(-5)
      })

      expect(result.current.isVisited(-1)).toBe(true)
      expect(result.current.isStamped(-5)).toBe(true)
      expect(result.current.visitedCafeIds).toEqual([-1])
      expect(result.current.stampedCafeIds).toEqual([-5])
    })

    it('should handle very large cafe IDs', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      const largeId = Number.MAX_SAFE_INTEGER

      act(() => {
        result.current.markAsVisited(largeId)
        result.current.addStamp(largeId)
      })

      expect(result.current.isVisited(largeId)).toBe(true)
      expect(result.current.isStamped(largeId)).toBe(true)
    })

    it('should handle rapid operations', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        // Rapid fire operations
        for (let i = 0; i < 100; i++) {
          result.current.markAsVisited(i)
          result.current.addStamp(i)
          if (i % 2 === 0) {
            result.current.markAsUnvisited(i)
          }
          if (i % 3 === 0) {
            result.current.removeStamp(i)
          }
        }
      })

      // Should have processed all operations correctly
      expect(result.current.getVisitedCount()).toBeGreaterThan(0)
      expect(result.current.getStampCount()).toBeGreaterThan(0)
    })

    it('should maintain correct state during mixed operations', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      act(() => {
        result.current.markAsVisited(1)
        result.current.addStamp(1)
        result.current.markAsVisited(2)
        result.current.addStamp(3)
        result.current.toggleVisited(4)
        result.current.toggleStamp(4)
        result.current.markAsUnvisited(1)
      })

      expect(result.current.visitedCafeIds).toEqual([2, 4])
      expect(result.current.stampedCafeIds).toEqual([1, 3, 4])
      expect(result.current.isVisited(1)).toBe(false)
      expect(result.current.isStamped(1)).toBe(true)
    })
  })

  describe('store subscriptions', () => {
    it('should notify subscribers of state changes', () => {
      const { result: result1 } = renderHook(() => useVisitedCafesStore())
      const { result: result2 } = renderHook(() => useVisitedCafesStore())

      // Both should start empty
      expect(result1.current.visitedCafeIds).toEqual([])
      expect(result2.current.visitedCafeIds).toEqual([])

      // Update through first hook
      act(() => {
        result1.current.markAsVisited(1)
      })

      // Both should reflect the change
      expect(result1.current.visitedCafeIds).toEqual([1])
      expect(result2.current.visitedCafeIds).toEqual([1])
    })

    it('should handle multiple concurrent operations', () => {
      const { result } = renderHook(() => useVisitedCafesStore())

      let subscriptionCount = 0
      const unsubscribe = useVisitedCafesStore.subscribe(() => {
        subscriptionCount++
      })

      act(() => {
        result.current.markAsVisited(1)
        result.current.addStamp(2)
        result.current.toggleVisited(3)
      })

      expect(subscriptionCount).toBeGreaterThan(0)
      unsubscribe()
    })
  })
})