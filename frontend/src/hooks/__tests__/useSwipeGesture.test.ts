import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

  const touch = (type: string, x: number, y: number) =>
    ({
      type,
      touches: [{ clientX: x, clientY: y }],
      preventDefault: vi.fn(),
    }) as unknown as TouchEvent

  const swipeHorizontal = (
    hook: ReturnType<typeof renderHook<ReturnType<typeof useSwipeGesture>>['result']>,
    fromX: number,
    toX: number,
    y = 200
  ) => {
    act(() => {
      hook.current.onTouchStart(touch('touchstart', fromX, y))
    })
    act(() => {
      hook.current.onTouchMove(touch('touchmove', toX, y))
    })
    act(() => {
      vi.advanceTimersByTime(100)
      hook.current.onTouchEnd()
    })
  }

  it('exposes handlers and initial state', () => {
    const { result } = renderHook(() => useSwipeGesture())
    expect(result.current.swipeOffset).toEqual({ x: 0, y: 0 })
    expect(typeof result.current.onTouchStart).toBe('function')
  })

  it('detects horizontal swipes', () => {
    const onSwipeRight = vi.fn()
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeRight, onSwipeLeft, threshold: 50, velocity: 0.01 })
    )

    swipeHorizontal(result, 100, 220)
    expect(onSwipeRight).toHaveBeenCalledTimes(1)

    swipeHorizontal(result, 220, 100)
    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
  })

  it('detects vertical swipes', () => {
    const onSwipeUp = vi.fn()
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeUp, onSwipeDown, threshold: 50, velocity: 0.01 })
    )

    act(() => {
      result.current.onTouchStart(touch('touchstart', 100, 200))
    })
    act(() => {
      result.current.onTouchMove(touch('touchmove', 100, 320))
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.onTouchEnd()
    })
    expect(onSwipeDown).toHaveBeenCalledTimes(1)
  })
})

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('invokes callback after delay', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 300 }))

    act(() => {
      result.current.onTouchStart({ target: document.body } as TouchEvent)
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('cancels on touch end before delay', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress(onLongPress, { delay: 300 }))

    act(() => {
      result.current.onTouchStart({ target: document.body } as TouchEvent)
      result.current.onTouchEnd()
      vi.advanceTimersByTime(300)
    })
    expect(onLongPress).not.toHaveBeenCalled()
  })
})
