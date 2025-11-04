import { describe, it, expect } from 'vitest'
import { createMatchaMarker, createUserLocationMarker } from '../mapMarkers'
import type { Cafe } from '../../types'

const mockCafe: Cafe = {
  id: 1,
  name: 'Test Matcha Cafe',
  slug: 'test-matcha-cafe',
  displayScore: 8.5,
  latitude: 43.6532,
  longitude: -79.3832,
  link: 'https://maps.google.com',
  address: '123 Test St',
  quickNote: 'Great matcha',
  city: 'toronto',
}

describe('mapMarkers', () => {
  describe('createMatchaMarker', () => {
    it('should create a default marker', () => {
      const html = createMatchaMarker(mockCafe)
      
      expect(html).toContain('bg-matcha-500') // Default state color
      expect(html).toContain('8.5') // Score display
      expect(html).toContain('🍵') // Matcha emoji icon
      expect(html).not.toContain('animate-pulse') // Not selected
      expect(html).not.toContain('✓') // Not visited
    })

    it('should create a selected marker with pulse animation', () => {
      const html = createMatchaMarker(mockCafe, { isSelected: true, isVisited: false })
      
      expect(html).toContain('bg-matcha-600') // Selected state color
      expect(html).toContain('animate-pulse') // Selected animation
      expect(html).toContain('border-matcha-300') // Selection ring
      expect(html).not.toContain('✓') // Not visited
    })

    it('should create a visited marker with checkmark', () => {
      const html = createMatchaMarker(mockCafe, { isSelected: false, isVisited: true })
      
      expect(html).toContain('bg-matcha-400') // Visited state color
      expect(html).toContain('✓') // Visited checkmark
      expect(html).not.toContain('animate-pulse') // Not selected
    })

    it('should create a selected AND visited marker', () => {
      const html = createMatchaMarker(mockCafe, { isSelected: true, isVisited: true })
      
      expect(html).toContain('bg-matcha-600') // Selected takes precedence
      expect(html).toContain('animate-pulse') // Selected animation
      expect(html).toContain('✓') // Still shows visited checkmark
      expect(html).toContain('border-matcha-300') // Selection ring
    })

    it('should apply correct score badge styling based on score', () => {
      // High score (9.0+)
      const highScoreCafe = { ...mockCafe, displayScore: 9.2 }
      const highScoreHtml = createMatchaMarker(highScoreCafe)
      expect(highScoreHtml).toContain('from-matcha-600 to-matcha-700')

      // Good score (8.0-8.9)
      const goodScoreCafe = { ...mockCafe, displayScore: 8.5 }
      const goodScoreHtml = createMatchaMarker(goodScoreCafe)
      expect(goodScoreHtml).toContain('from-matcha-500 to-matcha-600')

      // Average score (7.0-7.9)
      const avgScoreCafe = { ...mockCafe, displayScore: 7.5 }
      const avgScoreHtml = createMatchaMarker(avgScoreCafe)
      expect(avgScoreHtml).toContain('from-matcha-400 to-matcha-500')

      // Lower score (<7.0)
      const lowScoreCafe = { ...mockCafe, displayScore: 6.5 }
      const lowScoreHtml = createMatchaMarker(lowScoreCafe)
      expect(lowScoreHtml).toContain('from-matcha-300 to-matcha-400')
    })

    it('should include all essential marker elements', () => {
      const html = createMatchaMarker(mockCafe)
      
      // Pin elements
      expect(html).toContain('rounded-full') // Main pin shape
      expect(html).toContain('w-10 h-10') // Pin size
      expect(html).toContain('cursor-pointer') // Clickable
      expect(html).toContain('hover:scale-110') // Hover effect
      
      // Score badge
      expect(html).toContain('px-2 py-0.5') // Badge padding
      expect(html).toContain('font-bold') // Bold text
      expect(html).toContain('min-w-[2rem]') // Minimum width
      
      // Shadow and visual effects
      expect(html).toContain('shadow-xs') // Drop shadow-xs
      expect(html).toContain('transition-all') // Smooth transitions
    })
  })

  describe('createUserLocationMarker', () => {
    it('should create user location marker with basic styling', () => {
      const html = createUserLocationMarker()
      
      expect(html).toContain('bg-blue-600') // Main dot color
      expect(html).toContain('bg-blue-400') // Background ring
      expect(html).toContain('border-2 border-white') // White border
      expect(html).toContain('shadow-xs') // Drop shadow-xs
    })

    it('should include required elements', () => {
      const html = createUserLocationMarker()
      
      // Should have main elements
      expect(html).toContain('w-6 h-6') // Background ring size
      expect(html).toContain('w-4 h-4') // Main dot size  
      expect(html).toContain('w-1.5 h-1.5') // Inner white dot
    })

    it('should have proper positioning and styling', () => {
      const html = createUserLocationMarker()
      
      expect(html).toContain('relative') // Relative positioning for stacking
      expect(html).toContain('absolute') // Absolute positioning for rings
      expect(html).toContain('border-2 border-white') // White border
      expect(html).toContain('shadow-xs') // Drop shadow-xs
      expect(html).toContain('opacity-20') // Background ring opacity
    })
  })
})