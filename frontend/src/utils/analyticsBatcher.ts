/**
 * Analytics Event Batching
 *
 * Batches analytics events to reduce network requests and improve performance.
 * Events are sent in batches of 10 or every 5 seconds, whichever comes first.
 *
 * Usage:
 *   import { batchedTrack } from '@/utils/analyticsBatcher'
 *   batchedTrack('cafe_view', { cafeId: 123 })
 */

interface AnalyticsEvent {
  type: string
  data: Record<string, unknown>
  timestamp: number
}

class AnalyticsBatcher {
  private queue: AnalyticsEvent[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly batchSize = 10
  private readonly flushInterval = 5000 // 5 seconds
  private readonly maxQueueSize = 100 // Prevent memory issues

  /**
   * Add event to batch queue
   */
  track(type: string, data: Record<string, unknown> = {}): void {
    // Use requestIdleCallback for non-critical tracking
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.addToQueue(type, data))
    } else {
      // Fallback to setTimeout
      setTimeout(() => this.addToQueue(type, data), 0)
    }
  }

  /**
   * Add event to queue (internal)
   */
  private addToQueue(type: string, data: Record<string, unknown>): void {
    // Prevent queue from growing too large
    if (this.queue.length >= this.maxQueueSize) {
      this.flush()
    }

    this.queue.push({
      type,
      data,
      timestamp: Date.now(),
    })

    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else {
      // Schedule flush if not already scheduled
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.flushInterval)
      }
    }
  }

  /**
   * Flush queued events to server
   */
  private async flush(): Promise<void> {
    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    // Nothing to flush
    if (this.queue.length === 0) {
      return
    }

    // Get events to send
    const events = [...this.queue]
    this.queue = []

    // Send to server (fire-and-forget)
    try {
      // Use sendBeacon for better performance (doesn't block page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ events })], {
          type: 'application/json',
        })
        navigator.sendBeacon('/api/analytics/batch', blob)
      } else {
        // Fallback to fetch (not guaranteed to complete on page unload)
        fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
          keepalive: true, // Attempt to keep request alive during page unload
        }).catch(() => {
          // Silently fail - fire-and-forget
        })
      }

      if (import.meta.env.DEV) {
        console.log(`[Analytics] Flushed ${events.length} events`)
      }
    } catch (error) {
      // Silently fail - fire-and-forget
      if (import.meta.env.DEV) {
        console.warn('[Analytics] Failed to flush events:', error)
      }
    }
  }

  /**
   * Flush immediately (for page unload)
   */
  flushNow(): void {
    this.flush()
  }
}

// Singleton instance
const batcher = new AnalyticsBatcher()

/**
 * Track analytics event (batched)
 *
 * @param type - Event type (e.g., 'cafe_view', 'cafe_directions')
 * @param data - Event data
 *
 * @example
 * ```ts
 * batchedTrack('cafe_view', { cafeId: 123, userId: 456 })
 * batchedTrack('cafe_directions', { cafeId: 123 })
 * ```
 */
export function batchedTrack(type: string, data: Record<string, unknown> = {}): void {
  batcher.track(type, data)
}

/**
 * Flush batched events immediately
 * Call this on page unload to ensure events are sent
 */
export function flushAnalytics(): void {
  batcher.flushNow()
}

/**
 * Initialize analytics batching
 * Sets up automatic flushing on page unload
 */
export function initAnalyticsBatching(): void {
  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushAnalytics()
  })

  // Flush on visibility change (user switches tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAnalytics()
    }
  })

  if (import.meta.env.DEV) {
    console.log('[Analytics Batching] Initialized')
  }
}
