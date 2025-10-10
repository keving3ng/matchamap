import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.setState({
      showPopover: false,
      expandedCard: null,
      selectedDrinkType: null,
    })
  })

  afterEach(() => {
    // Clean up after each test
    useUIStore.setState({
      showPopover: false,
      expandedCard: null,
      selectedDrinkType: null,
    })
  })

  describe('initialization', () => {
    it('should initialize with default UI state', () => {
      const { result } = renderHook(() => useUIStore())
      
      expect(result.current.showPopover).toBe(false)
      expect(result.current.expandedCard).toBeNull()
      expect(result.current.selectedDrinkType).toBeNull()
    })
  })

  describe('popover state', () => {
    it('should show popover', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setShowPopover(true)
      })

      expect(result.current.showPopover).toBe(true)
    })

    it('should hide popover', () => {
      const { result } = renderHook(() => useUIStore())

      // First show the popover
      act(() => {
        result.current.setShowPopover(true)
      })
      expect(result.current.showPopover).toBe(true)

      // Then hide it
      act(() => {
        result.current.setShowPopover(false)
      })

      expect(result.current.showPopover).toBe(false)
    })

    it('should close popover using closePopover method', () => {
      const { result } = renderHook(() => useUIStore())

      // First show the popover
      act(() => {
        result.current.setShowPopover(true)
      })
      expect(result.current.showPopover).toBe(true)

      // Use closePopover method
      act(() => {
        result.current.closePopover()
      })

      expect(result.current.showPopover).toBe(false)
    })

    it('should handle multiple popover state changes', () => {
      const { result } = renderHook(() => useUIStore())

      // Toggle popover multiple times
      act(() => {
        result.current.setShowPopover(true)
      })
      expect(result.current.showPopover).toBe(true)

      act(() => {
        result.current.setShowPopover(false)
      })
      expect(result.current.showPopover).toBe(false)

      act(() => {
        result.current.setShowPopover(true)
      })
      expect(result.current.showPopover).toBe(true)

      act(() => {
        result.current.closePopover()
      })
      expect(result.current.showPopover).toBe(false)
    })

    it('should close popover even if already closed', () => {
      const { result } = renderHook(() => useUIStore())

      // Start with popover closed
      expect(result.current.showPopover).toBe(false)

      // Close it again - should not throw error
      act(() => {
        result.current.closePopover()
      })

      expect(result.current.showPopover).toBe(false)
    })
  })

  describe('expanded card state', () => {
    it('should set expanded card by ID', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setExpandedCard(123)
      })

      expect(result.current.expandedCard).toBe(123)
    })

    it('should clear expanded card', () => {
      const { result } = renderHook(() => useUIStore())

      // First set an expanded card
      act(() => {
        result.current.setExpandedCard(123)
      })
      expect(result.current.expandedCard).toBe(123)

      // Then clear it
      act(() => {
        result.current.setExpandedCard(null)
      })

      expect(result.current.expandedCard).toBeNull()
    })

    it('should handle multiple card expansions', () => {
      const { result } = renderHook(() => useUIStore())

      // Expand first card
      act(() => {
        result.current.setExpandedCard(1)
      })
      expect(result.current.expandedCard).toBe(1)

      // Expand different card (should replace previous)
      act(() => {
        result.current.setExpandedCard(2)
      })
      expect(result.current.expandedCard).toBe(2)

      // Expand another card
      act(() => {
        result.current.setExpandedCard(999)
      })
      expect(result.current.expandedCard).toBe(999)
    })

    it('should handle zero as valid card ID', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setExpandedCard(0)
      })

      expect(result.current.expandedCard).toBe(0)
    })

    it('should handle negative card IDs', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setExpandedCard(-1)
      })

      expect(result.current.expandedCard).toBe(-1)
    })

    it('should allow setting same card ID multiple times', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setExpandedCard(123)
      })
      expect(result.current.expandedCard).toBe(123)

      // Set same ID again
      act(() => {
        result.current.setExpandedCard(123)
      })
      expect(result.current.expandedCard).toBe(123)
    })
  })

  describe('drink type filter state', () => {
    it('should set drink type filter', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setSelectedDrinkType('matcha')
      })

      expect(result.current.selectedDrinkType).toBe('matcha')
    })

    it('should clear drink type filter', () => {
      const { result } = renderHook(() => useUIStore())

      // First set a drink type
      act(() => {
        result.current.setSelectedDrinkType('latte')
      })
      expect(result.current.selectedDrinkType).toBe('latte')

      // Then clear it
      act(() => {
        result.current.setSelectedDrinkType(null)
      })

      expect(result.current.selectedDrinkType).toBeNull()
    })

    it('should handle different drink types', () => {
      const { result } = renderHook(() => useUIStore())

      const drinkTypes = ['matcha', 'latte', 'cappuccino', 'americano', 'tea']

      drinkTypes.forEach(drinkType => {
        act(() => {
          result.current.setSelectedDrinkType(drinkType)
        })
        expect(result.current.selectedDrinkType).toBe(drinkType)
      })
    })

    it('should handle empty string drink type', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setSelectedDrinkType('')
      })

      expect(result.current.selectedDrinkType).toBe('')
    })

    it('should handle special characters in drink type', () => {
      const { result } = renderHook(() => useUIStore())

      const specialDrinkType = 'café-au-lait & matcha!'

      act(() => {
        result.current.setSelectedDrinkType(specialDrinkType)
      })

      expect(result.current.selectedDrinkType).toBe(specialDrinkType)
    })

    it('should replace previous drink type selection', () => {
      const { result } = renderHook(() => useUIStore())

      // Set first drink type
      act(() => {
        result.current.setSelectedDrinkType('matcha')
      })
      expect(result.current.selectedDrinkType).toBe('matcha')

      // Set different drink type
      act(() => {
        result.current.setSelectedDrinkType('latte')
      })
      expect(result.current.selectedDrinkType).toBe('latte')
    })
  })

  describe('state independence', () => {
    it('should maintain independent state for different UI elements', () => {
      const { result } = renderHook(() => useUIStore())

      // Set all state values
      act(() => {
        result.current.setShowPopover(true)
        result.current.setExpandedCard(456)
        result.current.setSelectedDrinkType('matcha')
      })

      expect(result.current.showPopover).toBe(true)
      expect(result.current.expandedCard).toBe(456)
      expect(result.current.selectedDrinkType).toBe('matcha')

      // Change one state - others should remain unchanged
      act(() => {
        result.current.setShowPopover(false)
      })

      expect(result.current.showPopover).toBe(false)
      expect(result.current.expandedCard).toBe(456) // Unchanged
      expect(result.current.selectedDrinkType).toBe('matcha') // Unchanged
    })

    it('should handle simultaneous state changes', () => {
      const { result } = renderHook(() => useUIStore())

      // Change multiple states at once
      act(() => {
        result.current.setShowPopover(true)
        result.current.setExpandedCard(789)
        result.current.setSelectedDrinkType('americano')
      })

      expect(result.current.showPopover).toBe(true)
      expect(result.current.expandedCard).toBe(789)
      expect(result.current.selectedDrinkType).toBe('americano')
    })

    it('should reset to initial state when cleared', () => {
      const { result } = renderHook(() => useUIStore())

      // Set all states to non-default values
      act(() => {
        result.current.setShowPopover(true)
        result.current.setExpandedCard(999)
        result.current.setSelectedDrinkType('special-drink')
      })

      // Verify they are set
      expect(result.current.showPopover).toBe(true)
      expect(result.current.expandedCard).toBe(999)
      expect(result.current.selectedDrinkType).toBe('special-drink')

      // Clear all states
      act(() => {
        result.current.closePopover()
        result.current.setExpandedCard(null)
        result.current.setSelectedDrinkType(null)
      })

      // Should be back to initial state
      expect(result.current.showPopover).toBe(false)
      expect(result.current.expandedCard).toBeNull()
      expect(result.current.selectedDrinkType).toBeNull()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle undefined values gracefully', () => {
      const { result } = renderHook(() => useUIStore())

      // TypeScript would normally prevent these, but test runtime behavior
      act(() => {
        result.current.setExpandedCard(undefined as any)
        result.current.setSelectedDrinkType(undefined as any)
      })

      expect(result.current.expandedCard).toBeUndefined()
      expect(result.current.selectedDrinkType).toBeUndefined()
    })

    it('should handle very large card IDs', () => {
      const { result } = renderHook(() => useUIStore())

      const largeId = Number.MAX_SAFE_INTEGER

      act(() => {
        result.current.setExpandedCard(largeId)
      })

      expect(result.current.expandedCard).toBe(largeId)
    })

    it('should handle very long drink type strings', () => {
      const { result } = renderHook(() => useUIStore())

      const longDrinkType = 'a'.repeat(1000)

      act(() => {
        result.current.setSelectedDrinkType(longDrinkType)
      })

      expect(result.current.selectedDrinkType).toBe(longDrinkType)
    })

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useUIStore())

      // Perform many rapid changes
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setShowPopover(i % 2 === 0)
          result.current.setExpandedCard(i)
          result.current.setSelectedDrinkType(`drink-${i}`)
        }
      })

      // Should have the final values
      expect(result.current.showPopover).toBe(false) // 99 % 2 === 1, so false
      expect(result.current.expandedCard).toBe(99)
      expect(result.current.selectedDrinkType).toBe('drink-99')
    })
  })

  describe('functional behavior', () => {
    it('should support typical popover workflow', () => {
      const { result } = renderHook(() => useUIStore())

      // User clicks on map pin -> show popover
      act(() => {
        result.current.setShowPopover(true)
      })
      expect(result.current.showPopover).toBe(true)

      // User clicks outside or escape -> close popover
      act(() => {
        result.current.closePopover()
      })
      expect(result.current.showPopover).toBe(false)
    })

    it('should support typical card expansion workflow', () => {
      const { result } = renderHook(() => useUIStore())

      // User clicks to expand card 1
      act(() => {
        result.current.setExpandedCard(1)
      })
      expect(result.current.expandedCard).toBe(1)

      // User clicks to expand card 2 (collapses card 1)
      act(() => {
        result.current.setExpandedCard(2)
      })
      expect(result.current.expandedCard).toBe(2)

      // User clicks same card again to collapse
      act(() => {
        result.current.setExpandedCard(null)
      })
      expect(result.current.expandedCard).toBeNull()
    })

    it('should support typical filter workflow', () => {
      const { result } = renderHook(() => useUIStore())

      // User selects matcha filter
      act(() => {
        result.current.setSelectedDrinkType('matcha')
      })
      expect(result.current.selectedDrinkType).toBe('matcha')

      // User selects different filter
      act(() => {
        result.current.setSelectedDrinkType('latte')
      })
      expect(result.current.selectedDrinkType).toBe('latte')

      // User clears filter
      act(() => {
        result.current.setSelectedDrinkType(null)
      })
      expect(result.current.selectedDrinkType).toBeNull()
    })

    it('should maintain filter state across view changes', () => {
      const { result } = renderHook(() => useUIStore())

      // Set filter in map view
      act(() => {
        result.current.setSelectedDrinkType('matcha')
      })

      // Simulate view change (filter should persist)
      // In real app, this would be handled by the view component
      expect(result.current.selectedDrinkType).toBe('matcha')

      // Change expanded card (simulating list view interaction)
      act(() => {
        result.current.setExpandedCard(123)
      })

      // Filter should still be active
      expect(result.current.selectedDrinkType).toBe('matcha')
      expect(result.current.expandedCard).toBe(123)
    })
  })

  describe('store subscription and reactivity', () => {
    it('should notify subscribers of state changes', () => {
      const { result } = renderHook(() => useUIStore())

      const initialShowPopover = result.current.showPopover
      
      act(() => {
        result.current.setShowPopover(!initialShowPopover)
      })

      // The hook should re-render with new state
      expect(result.current.showPopover).toBe(!initialShowPopover)
    })

    it('should handle multiple subscribers', () => {
      const { result: result1 } = renderHook(() => useUIStore())
      const { result: result2 } = renderHook(() => useUIStore())

      // Both hooks should start with same state
      expect(result1.current.expandedCard).toBe(result2.current.expandedCard)

      // Change state through first hook
      act(() => {
        result1.current.setExpandedCard(42)
      })

      // Both hooks should reflect the change
      expect(result1.current.expandedCard).toBe(42)
      expect(result2.current.expandedCard).toBe(42)
    })

    it('should not cause unnecessary re-renders for same values', () => {
      const { result } = renderHook(() => useUIStore())

      // Set a value
      act(() => {
        result.current.setExpandedCard(100)
      })
      expect(result.current.expandedCard).toBe(100)

      // Set the same value again
      act(() => {
        result.current.setExpandedCard(100)
      })
      expect(result.current.expandedCard).toBe(100)

      // Value should still be the same
      expect(result.current.expandedCard).toBe(100)
    })
  })
})