import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeGesture, useLongPress } from '../useSwipeGesture'

describe('useSwipeGesture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => ({
    type,
    touches,
    preventDefault: vi.fn(),
  } as any)

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useSwipeGesture())

    expect(result.current.swipeOffset).toEqual({ x: 0, y: 0 })
    expect(result.current.isSwiping).toBe(false)
    expect(typeof result.current.onTouchStart).toBe('function')
    expect(typeof result.current.onTouchMove).toBe('function')
    expect(typeof result.current.onTouchEnd).toBe('function')
  })

  it('should detect swipe right gesture', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeRight,
      threshold: 50,
      velocity: 0.3,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move right (beyond threshold)
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 200, clientY: 200 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch (trigger swipe detection)
    act(() => {
      vi.advanceTimersByTime(100) // Ensure minimum time for velocity calculation
      result.current.onTouchEnd()
    })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
  })

  it('should detect swipe left gesture', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeLeft,
      threshold: 50,
      velocity: 0.3,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 200, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move left (beyond threshold)
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.onTouchEnd()
    })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
  })

  it('should detect swipe up gesture', () => {
    const onSwipeUp = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeUp,
      threshold: 50,
      velocity: 0.3,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 200, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move up (beyond threshold)
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.onTouchEnd()
    })

    expect(onSwipeUp).toHaveBeenCalledTimes(1)
  })

  it('should detect swipe down gesture', () => {
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeDown,
      threshold: 50,
      velocity: 0.3,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 200, clientY: 100 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move down (beyond threshold)
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 200, clientY: 200 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.onTouchEnd()
    })

    expect(onSwipeDown).toHaveBeenCalledTimes(1)
  })

  it('should not trigger swipe when movement is below threshold', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeRight,
      threshold: 100, // High threshold
      velocity: 0.3,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move right but below threshold
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 200 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.onTouchEnd()
    })

    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('should not trigger swipe when velocity is too low', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeRight,
      threshold: 50,
      velocity: 1.0, // High velocity requirement
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move right beyond threshold
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 200, clientY: 200 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch after long time (low velocity)
    act(() => {
      vi.advanceTimersByTime(1000) // Long time = low velocity
      result.current.onTouchEnd()
    })

    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('should update swipe offset during touch move', () => {
    const { result } = renderHook(() => useSwipeGesture())

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    expect(result.current.swipeOffset).toEqual({ x: 0, y: 0 })

    // Move touch
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 180 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    expect(result.current.swipeOffset).toEqual({ x: 50, y: -20 })
  })

  it('should reset swipe offset after touch end', () => {
    const { result } = renderHook(() => useSwipeGesture())

    // Start and move touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 180 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    expect(result.current.swipeOffset).toEqual({ x: 50, y: -20 })

    // End touch
    act(() => {
      result.current.onTouchEnd()
    })

    expect(result.current.swipeOffset).toEqual({ x: 0, y: 0 })
  })

  it('should prevent scroll when preventScroll is true and swiping horizontally', () => {
    const { result } = renderHook(() => useSwipeGesture({
      preventScroll: true,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move horizontally (more horizontal than vertical movement)
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 210 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    expect(moveEvent.preventDefault).toHaveBeenCalled()
  })

  it('should not prevent scroll when preventScroll is false', () => {
    const { result } = renderHook(() => useSwipeGesture({
      preventScroll: false,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move horizontally
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 210 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    expect(moveEvent.preventDefault).not.toHaveBeenCalled()
  })

  it('should not trigger swipe when not swiping', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight }))

    // End touch without starting
    act(() => {
      result.current.onTouchEnd()
    })

    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('should handle touch move when not swiping', () => {
    const { result } = renderHook(() => useSwipeGesture())

    // Move touch without starting
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 180 }])
    
    expect(() => {
      act(() => {
        result.current.onTouchMove(moveEvent)
      })
    }).not.toThrow()

    expect(result.current.swipeOffset).toEqual({ x: 0, y: 0 })
  })

  it('should prioritize horizontal swipe over vertical when movement is diagonal', () => {
    const onSwipeRight = vi.fn()
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({
      onSwipeRight,
      onSwipeDown,
      threshold: 50,
      velocity: 0.3,
    }))

    // Start touch
    const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
    act(() => {
      result.current.onTouchStart(startEvent)
    })

    // Move diagonally with more horizontal movement
    const moveEvent = createTouchEvent('touchmove', [{ clientX: 200, clientY: 160 }])
    act(() => {
      result.current.onTouchMove(moveEvent)
    })

    // End touch
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.onTouchEnd()
    })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeDown).not.toHaveBeenCalled()
  })
})

describe('useLongPress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should trigger long press after default delay', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // Start touch
    const touchEvent = { target: document.body } as any
    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    // Long press should not trigger immediately
    expect(onLongPress).not.toHaveBeenCalled()

    // Advance time to trigger long press
    act(() => {
      vi.advanceTimersByTime(500) // Default delay
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('should trigger long press after custom delay', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 1000 }))

    // Start touch
    const touchEvent = { target: document.body } as any
    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    // Should not trigger at default delay
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onLongPress).not.toHaveBeenCalled()

    // Should trigger at custom delay
    act(() => {
      vi.advanceTimersByTime(500) // Total 1000ms
    })
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('should cancel long press on touch end', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // Start touch
    const touchEvent = { target: document.body } as any
    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    // End touch before delay
    act(() => {
      result.current.onTouchEnd()
    })

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('should cancel long press on touch move', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // Start touch
    const touchEvent = { target: document.body } as any
    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    // Move touch before delay
    act(() => {
      result.current.onTouchMove()
    })

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('should work with mouse events', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // Start mouse down
    const mouseEvent = { target: document.body } as any
    act(() => {
      result.current.onMouseDown(mouseEvent)
    })

    // Advance time to trigger long press
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('should cancel long press on mouse up', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // Start mouse down
    const mouseEvent = { target: document.body } as any
    act(() => {
      result.current.onMouseDown(mouseEvent)
    })

    // Mouse up before delay
    act(() => {
      result.current.onMouseUp()
    })

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('should cancel long press on mouse leave', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // Start mouse down
    const mouseEvent = { target: document.body } as any
    act(() => {
      result.current.onMouseDown(mouseEvent)
    })

    // Mouse leave before delay
    act(() => {
      result.current.onMouseLeave()
    })

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('should handle multiple long press attempts', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress))

    // First attempt
    const touchEvent = { target: document.body } as any
    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)

    // Second attempt
    act(() => {
      result.current.onTouchStart(touchEvent)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalledTimes(2)
  })
})