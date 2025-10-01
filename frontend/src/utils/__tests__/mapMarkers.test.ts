import { describe, it, expect } from 'vitest'
import { createMatchaMarker, createUserLocationMarker } from '../mapMarkers'
import type { Cafe } from '../../types'

const mockCafe: Cafe = {
  id: 1,
  name: 'Test Matcha Cafe',
  score: 8.5,
  lat: 43.6532,
  lng: -79.3832,
  neighborhood: 'Downtown',
  address: '123 Test St',
  quickNote: 'Great matcha',
  city: 'toronto',
  emoji: '🍃',
  color: 'from-green-400 to-green-600',
}

describe('mapMarkers', () => {
  describe('createMatchaMarker', () => {
    it('should create a default marker', () => {
      const html = createMatchaMarker(mockCafe)
      
      expect(html).toContain('bg-matcha-500') // Default state color
      expect(html).toContain('8.5') // Score display
      expect(html).toContain('svg') // Matcha leaf icon
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
      const highScoreCafe = { ...mockCafe, score: 9.2 }
      const highScoreHtml = createMatchaMarker(highScoreCafe)
      expect(highScoreHtml).toContain('from-matcha-600 to-matcha-700')

      // Good score (8.0-8.9)
      const goodScoreCafe = { ...mockCafe, score: 8.5 }
      const goodScoreHtml = createMatchaMarker(goodScoreCafe)
      expect(goodScoreHtml).toContain('from-matcha-500 to-matcha-600')

      // Average score (7.0-7.9)
      const avgScoreCafe = { ...mockCafe, score: 7.5 }
      const avgScoreHtml = createMatchaMarker(avgScoreCafe)
      expect(avgScoreHtml).toContain('from-matcha-400 to-matcha-500')

      // Lower score (<7.0)
      const lowScoreCafe = { ...mockCafe, score: 6.5 }
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
      expect(html).toContain('shadow') // Drop shadow
      expect(html).toContain('transition-all') // Smooth transitions
    })
  })

  describe('createUserLocationMarker', () => {
    it('should create user location marker with pulse animations', () => {
      const html = createUserLocationMarker()
      
      expect(html).toContain('bg-blue-600') // Main dot color
      expect(html).toContain('bg-blue-400') // Outer ring
      expect(html).toContain('bg-blue-500') // Middle ring
      expect(html).toContain('animate-ping') // Pulse animation
      expect(html).toContain('animation-delay: 75ms') // Delayed animation
    })

    it('should include multiple pulse rings', () => {
      const html = createUserLocationMarker()
      
      // Should have multiple rings for layered pulse effect
      expect(html).toContain('w-8 h-8') // Outer ring size
      expect(html).toContain('w-6 h-6') // Middle ring size
      expect(html).toContain('w-4 h-4') // Main dot size
      expect(html).toContain('w-1.5 h-1.5') // Inner white dot
    })

    it('should have proper positioning and styling', () => {
      const html = createUserLocationMarker()
      
      expect(html).toContain('relative') // Relative positioning for stacking
      expect(html).toContain('absolute') // Absolute positioning for rings
      expect(html).toContain('border-2 border-white') // White border
      expect(html).toContain('shadow-lg') // Drop shadow
      expect(html).toContain('opacity-30') // Outer ring opacity
      expect(html).toContain('opacity-50') // Middle ring opacity
    })
  })
})