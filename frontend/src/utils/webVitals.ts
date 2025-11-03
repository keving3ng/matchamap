/**
 * Web Vitals Tracking
 *
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB) for performance monitoring.
 * Uses the web-vitals library pattern with fallback to manual Performance API.
 *
 * Usage:
 *   import { initWebVitals } from '@/utils/webVitals'
 *   initWebVitals() // Call once in main.tsx
 */

interface Metric {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

// Thresholds for Core Web Vitals ratings
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}

/**
 * Get rating based on metric value and thresholds
 */
function getRating(name: Metric['name'], value: number): Metric['rating'] {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Send metric to analytics endpoint
 * Fire-and-forget - errors are silently ignored
 */
function sendToAnalytics(metric: Metric): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: metric.rating,
    })
  }

  // In production, send to analytics endpoint
  // TODO: Implement analytics endpoint when available
  // navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(metric))

  // Store in sessionStorage for debugging
  try {
    const vitals = JSON.parse(sessionStorage.getItem('webVitals') || '[]')
    vitals.push({
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      timestamp: Date.now(),
    })
    sessionStorage.setItem('webVitals', JSON.stringify(vitals))
  } catch (error) {
    // Silently fail - sessionStorage might be full or disabled
  }
}

/**
 * Observe LCP (Largest Contentful Paint)
 * Target: < 2.5s
 */
function observeLCP(): void {
  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number
        loadTime?: number
      }

      const value = lastEntry.renderTime || lastEntry.loadTime || 0

      sendToAnalytics({
        name: 'LCP',
        value,
        rating: getRating('LCP', value),
        delta: value,
        id: `lcp-${Date.now()}`,
      })
    })

    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (error) {
    // PerformanceObserver not supported
  }
}

/**
 * Observe FID (First Input Delay)
 * Target: < 100ms
 */
function observeFID(): void {
  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const firstInput = entries[0] as PerformanceEventTiming

      if (firstInput) {
        const value = firstInput.processingStart - firstInput.startTime

        sendToAnalytics({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          delta: value,
          id: `fid-${Date.now()}`,
        })
      }
    })

    observer.observe({ type: 'first-input', buffered: true })
  } catch (error) {
    // PerformanceObserver not supported
  }
}

/**
 * Observe CLS (Cumulative Layout Shift)
 * Target: < 0.1
 */
function observeCLS(): void {
  try {
    let clsValue = 0
    let clsEntries: PerformanceEntry[] = []

    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        // Only count layout shifts without recent user input
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean
          value?: number
        }

        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value || 0
          clsEntries.push(entry)
        }
      }
    })

    observer.observe({ type: 'layout-shift', buffered: true })

    // Report CLS when page is hidden (user navigates away)
    const reportCLS = () => {
      sendToAnalytics({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: `cls-${Date.now()}`,
      })
    }

    // Report on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportCLS()
      }
    })

    // Also report on beforeunload as fallback
    window.addEventListener('beforeunload', reportCLS)
  } catch (error) {
    // PerformanceObserver not supported
  }
}

/**
 * Observe FCP (First Contentful Paint)
 * Target: < 1.8s
 */
function observeFCP(): void {
  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const fcpEntry = entries[0]

      if (fcpEntry) {
        const value = fcpEntry.startTime

        sendToAnalytics({
          name: 'FCP',
          value,
          rating: getRating('FCP', value),
          delta: value,
          id: `fcp-${Date.now()}`,
        })
      }
    })

    observer.observe({ type: 'paint', buffered: true })
  } catch (error) {
    // PerformanceObserver not supported
  }
}

/**
 * Observe TTFB (Time to First Byte)
 * Target: < 800ms
 */
function observeTTFB(): void {
  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigationEntry) {
      const value = navigationEntry.responseStart - navigationEntry.requestStart

      sendToAnalytics({
        name: 'TTFB',
        value,
        rating: getRating('TTFB', value),
        delta: value,
        id: `ttfb-${Date.now()}`,
      })
    }
  } catch (error) {
    // Navigation Timing API not supported
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this once in main.tsx after React app mounts
 */
export function initWebVitals(): void {
  // Only track in browser environment
  if (typeof window === 'undefined') return

  // Observe all Core Web Vitals
  observeLCP()
  observeFID()
  observeCLS()
  observeFCP()
  observeTTFB()

  if (import.meta.env.DEV) {
    console.log('[Web Vitals] Tracking initialized')
  }
}

/**
 * Get current Web Vitals from sessionStorage
 * Useful for debugging or displaying in admin panel
 */
export function getWebVitals(): Array<{
  name: string
  value: number
  rating: string
  timestamp: number
}> {
  try {
    return JSON.parse(sessionStorage.getItem('webVitals') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear stored Web Vitals
 */
export function clearWebVitals(): void {
  try {
    sessionStorage.removeItem('webVitals')
  } catch {
    // Silently fail
  }
}
