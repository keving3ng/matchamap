import { describe, it, expect, afterEach } from 'vitest'
import { isIOS, isIOSSafari, isAndroid, isMobile, getLocationRequestAdvice, getOptimalGeolocationOptions } from '../deviceDetection'

// Mock navigator.userAgent
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    writable: true,
    configurable: true,
  })
}

describe('deviceDetection', () => {
  const originalUserAgent = navigator.userAgent

  afterEach(() => {
    mockUserAgent(originalUserAgent)
  })

  describe('isIOS', () => {
    it('should detect iPhone', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(isIOS()).toBe(true)
    })

    it('should detect iPad', () => {
      mockUserAgent('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(isIOS()).toBe(true)
    })

    it('should not detect Android as iOS', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36')
      expect(isIOS()).toBe(false)
    })

    it('should not detect desktop as iOS', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(isIOS()).toBe(false)
    })
  })

  describe('isIOSSafari', () => {
    it('should detect iOS Safari', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
      expect(isIOSSafari()).toBe(true)
    })

    it('should not detect iOS Chrome as Safari', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/94.0.4606.76 Mobile/15E148 Safari/604.1')
      expect(isIOSSafari()).toBe(false)
    })

    it('should not detect Android as iOS Safari', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36')
      expect(isIOSSafari()).toBe(false)
    })
  })

  describe('isAndroid', () => {
    it('should detect Android', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36')
      expect(isAndroid()).toBe(true)
    })

    it('should not detect iOS as Android', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(isAndroid()).toBe(false)
    })
  })

  describe('isMobile', () => {
    it('should detect iPhone as mobile', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(isMobile()).toBe(true)
    })

    it('should detect Android as mobile', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36')
      expect(isMobile()).toBe(true)
    })

    it('should not detect desktop as mobile', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(isMobile()).toBe(false)
    })
  })

  describe('getLocationRequestAdvice', () => {
    it('should return iOS Safari specific advice', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
      const advice = getLocationRequestAdvice()
      expect(advice).toContain('Settings → Privacy & Security → Location Services → Safari')
    })

    it('should return iOS general advice for non-Safari browsers', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/94.0.4606.76 Mobile/15E148 Safari/604.1')
      const advice = getLocationRequestAdvice()
      expect(advice).toContain('Location Services for your browser')
    })

    it('should return Android specific advice', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36')
      const advice = getLocationRequestAdvice()
      expect(advice).toContain('Settings → Apps → [Browser] → Permissions')
    })

    it('should return generic advice for desktop', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      const advice = getLocationRequestAdvice()
      expect(advice).toContain('location services are enabled for your browser')
    })
  })

  describe('getOptimalGeolocationOptions', () => {
    it('should return mobile-optimized options for mobile devices', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15')
      const options = getOptimalGeolocationOptions()
      
      expect(options.enableHighAccuracy).toBe(false) // Start with false on mobile
      expect(options.timeout).toBe(20000) // Longer timeout on mobile
      expect(options.maximumAge).toBe(600000) // Longer cache on mobile
    })

    it('should return desktop-optimized options for desktop', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      const options = getOptimalGeolocationOptions()
      
      expect(options.enableHighAccuracy).toBe(true) // High accuracy on desktop
      expect(options.timeout).toBe(15000) // Shorter timeout on desktop
      expect(options.maximumAge).toBe(300000) // Shorter cache on desktop
    })
  })
})