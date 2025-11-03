import { useRef, useState } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // Minimum distance for swipe (pixels)
  velocity?: number // Minimum velocity for swipe
  preventScroll?: boolean
}

interface SwipeState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  startTime: number
  isSwiping: boolean
}

/**
 * useSwipeGesture - Hook for detecting swipe gestures on mobile
 *
 * Usage:
 * const swipeHandlers = useSwipeGesture({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   threshold: 50, // minimum 50px to trigger
 * })
 *
 * <div {...swipeHandlers}>Swipeable content</div>
 */
export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocity = 0.3,
    preventScroll = false
  } = options

  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isSwiping: false
  })

  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isSwiping: true
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!swipeState.current.isSwiping) return

    const touch = e.touches[0]
    swipeState.current.currentX = touch.clientX
    swipeState.current.currentY = touch.clientY

    const deltaX = touch.clientX - swipeState.current.startX
    const deltaY = touch.clientY - swipeState.current.startY

    // Update visual offset for feedback
    setSwipeOffset({ x: deltaX, y: deltaY })

    // Prevent scroll if swiping horizontally
    if (preventScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (!swipeState.current.isSwiping) return

    const deltaX = swipeState.current.currentX - swipeState.current.startX
    const deltaY = swipeState.current.currentY - swipeState.current.startY
    const deltaTime = Date.now() - swipeState.current.startTime
    const velocityX = Math.abs(deltaX) / deltaTime
    const velocityY = Math.abs(deltaY) / deltaTime

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold && velocityX > velocity) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold && velocityY > velocity) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    // Reset state
    swipeState.current.isSwiping = false
    setSwipeOffset({ x: 0, y: 0 })
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    swipeOffset, // Use this for visual feedback
    isSwiping: swipeState.current.isSwiping
  }
}

/**
 * useLongPress - Hook for detecting long press gestures
 *
 * Usage:
 * const longPressHandlers = useLongPress(() => {
 *   console.log('Long pressed!')
 * }, { delay: 500 })
 *
 * <button {...longPressHandlers}>Long press me</button>
 */
export const useLongPress = (
  onLongPress: () => void,
  options: { delay?: number } = {}
) => {
  const { delay = 500 } = options
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const target = useRef<EventTarget | null>(null)

  const start = (e: TouchEvent | MouseEvent) => {
    target.current = e.target
    timeout.current = setTimeout(() => {
      onLongPress()
    }, delay)
  }

  const clear = () => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
    target.current = null
  }

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear
  }
}
