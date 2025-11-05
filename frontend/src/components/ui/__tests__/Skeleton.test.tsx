import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, CafeCardSkeleton, ListSkeleton, DetailPageSkeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('should render with default rectangular variant', () => {
    render(<Skeleton />)
    const skeleton = document.querySelector('.bg-gray-200.rounded-lg')
    expect(skeleton).toBeInTheDocument()
  })

  it('should render text variant', () => {
    render(<Skeleton variant="text" />)
    const skeleton = document.querySelector('.rounded.h-4')
    expect(skeleton).toBeInTheDocument()
  })

  it('should render circular variant', () => {
    render(<Skeleton variant="circular" />)
    const skeleton = document.querySelector('.rounded-full')
    expect(skeleton).toBeInTheDocument()
  })

  it('should render rectangular variant', () => {
    render(<Skeleton variant="rectangular" />)
    const skeleton = document.querySelector('.rounded-lg')
    expect(skeleton).toBeInTheDocument()
  })

  it('should apply shimmer animation by default', () => {
    render(<Skeleton />)
    const skeleton = document.querySelector('.animate-shimmer')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('bg-gradient-to-r', 'from-gray-200', 'via-gray-100', 'to-gray-200')
  })

  it('should apply pulse animation when specified', () => {
    render(<Skeleton animation="pulse" />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).not.toHaveClass('animate-shimmer')
  })

  it('should apply no animation when specified', () => {
    render(<Skeleton animation="none" />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).not.toHaveClass('animate-pulse', 'animate-shimmer')
  })

  it('should apply custom width as string', () => {
    render(<Skeleton width="50%" />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '50%' })
  })

  it('should apply custom width as number (pixels)', () => {
    render(<Skeleton width={200} />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '200px' })
  })

  it('should apply custom height as string', () => {
    render(<Skeleton height="100px" />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ height: '100px' })
  })

  it('should apply custom height as number (pixels)', () => {
    render(<Skeleton height={50} />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ height: '50px' })
  })

  it('should apply both width and height', () => {
    render(<Skeleton width={300} height="75px" />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '300px', height: '75px' })
  })

  it('should apply custom className', () => {
    render(<Skeleton className="custom-skeleton-class" />)
    const skeleton = document.querySelector('.custom-skeleton-class')
    expect(skeleton).toBeInTheDocument()
  })

  it('should combine all props correctly', () => {
    render(
      <Skeleton
        variant="circular"
        width={100}
        height={100}
        animation="pulse"
        className="custom-circle"
      />
    )
    
    const skeleton = document.querySelector('.custom-circle')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('rounded-full', 'animate-pulse', 'bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '100px', height: '100px' })
  })

  it('should have proper background gradient for shimmer animation', () => {
    render(<Skeleton animation="shimmer" />)
    const skeleton = document.querySelector('.animate-shimmer')
    expect(skeleton).toHaveClass('bg-[length:200%_100%]', 'bg-no-repeat')
  })
})

describe('CafeCardSkeleton', () => {
  it('should render cafe card skeleton structure', () => {
    render(<CafeCardSkeleton />)

    // Check main container
    const container = document.querySelector('.bg-white.rounded-2xl.shadow-xs.border-2.border-green-100.p-4.animate-pulse')
    expect(container).toBeInTheDocument()
  })

  it('should render skeleton elements for cafe card layout', () => {
    render(<CafeCardSkeleton />)
    
    // Should have multiple skeleton elements for text and circular elements
    const skeletons = document.querySelectorAll('.bg-gray-200')
    expect(skeletons.length).toBeGreaterThan(2) // At least title, subtitle, and circular score
  })

  it('should have proper flex layout', () => {
    render(<CafeCardSkeleton />)
    
    const flexContainer = document.querySelector('.flex.items-center.justify-between.mb-3')
    expect(flexContainer).toBeInTheDocument()
  })

  it('should match cafe card visual structure', () => {
    render(<CafeCardSkeleton />)
    
    // Check for text elements (different sizes for title/subtitle)
    const textElements = document.querySelectorAll('[style*="width: 60%"], [style*="width: 40%"]')
    expect(textElements.length).toBeGreaterThanOrEqual(2)
    
    // Check for circular element (score badge)
    const circularElement = document.querySelector('[style*="width: 44px"][style*="height: 44px"]')
    expect(circularElement).toBeInTheDocument()
  })
})

describe('ListSkeleton', () => {
  it('should render default number of skeleton cards (5)', () => {
    render(<ListSkeleton />)
    
    const cafeCards = document.querySelectorAll('.bg-white.rounded-2xl')
    expect(cafeCards).toHaveLength(5)
  })

  it('should render custom number of skeleton cards', () => {
    render(<ListSkeleton count={3} />)
    
    const cafeCards = document.querySelectorAll('.bg-white.rounded-2xl')
    expect(cafeCards).toHaveLength(3)
  })

  it('should render single skeleton card', () => {
    render(<ListSkeleton count={1} />)
    
    const cafeCards = document.querySelectorAll('.bg-white.rounded-2xl')
    expect(cafeCards).toHaveLength(1)
  })

  it('should render large number of skeleton cards', () => {
    render(<ListSkeleton count={10} />)
    
    const cafeCards = document.querySelectorAll('.bg-white.rounded-2xl')
    expect(cafeCards).toHaveLength(10)
  })

  it('should have proper spacing between cards', () => {
    render(<ListSkeleton />)
    
    const container = document.querySelector('.space-y-3.p-4')
    expect(container).toBeInTheDocument()
  })

  it('should handle zero count gracefully', () => {
    render(<ListSkeleton count={0} />)
    
    const cafeCards = document.querySelectorAll('.bg-white.rounded-2xl')
    expect(cafeCards).toHaveLength(0)
  })
})

describe('DetailPageSkeleton', () => {
  it('should render main container with proper styling', () => {
    render(<DetailPageSkeleton />)
    
    const container = document.querySelector('.flex-1.overflow-y-auto.pb-24')
    expect(container).toBeInTheDocument()
  })

  it('should render hero section skeleton', () => {
    render(<DetailPageSkeleton />)
    
    // Hero skeleton should have specific height
    const heroSkeleton = document.querySelector('[style*="height: 192px"]')
    expect(heroSkeleton).toBeInTheDocument()
    expect(heroSkeleton).toHaveClass('w-full')
  })

  it('should render main info card skeleton', () => {
    render(<DetailPageSkeleton />)

    const infoCard = document.querySelector('.bg-white.rounded-2xl.shadow-xs.p-5.border-2.border-green-100.mb-4')
    expect(infoCard).toBeInTheDocument()
  })

  it('should render action button skeleton in info card', () => {
    render(<DetailPageSkeleton />)
    
    // Should have a full-width button skeleton
    const buttonSkeleton = document.querySelector('[style*="height: 44px"]')
    expect(buttonSkeleton).toBeInTheDocument()
    expect(buttonSkeleton).toHaveClass('w-full')
  })

  it('should render drinks menu skeleton', () => {
    render(<DetailPageSkeleton />)

    const drinksMenu = document.querySelector('.bg-white.rounded-xl.shadow-xs.p-4.border.border-green-100.space-y-3')
    expect(drinksMenu).toBeInTheDocument()
  })

  it('should render multiple drink items in menu', () => {
    render(<DetailPageSkeleton />)
    
    // Should have multiple drink item skeletons
    const drinkItems = document.querySelectorAll('.flex.justify-between.items-center.py-2')
    expect(drinkItems.length).toBe(3) // Based on the component implementation
  })

  it('should have proper positioning and z-index', () => {
    render(<DetailPageSkeleton />)
    
    const positionedContainer = document.querySelector('.px-4.-mt-6.relative.z-10')
    expect(positionedContainer).toBeInTheDocument()
  })

  it('should use pulse animation for hero section', () => {
    render(<DetailPageSkeleton />)
    
    const heroSkeleton = document.querySelector('.w-full[style*="height: 192px"]')
    expect(heroSkeleton).toHaveClass('animate-pulse') // This should be implied by the animation prop
  })

  it('should have different skeleton widths for varying content', () => {
    render(<DetailPageSkeleton />)
    
    // Check for different width percentages (title, subtitle, etc.)
    const differentWidths = document.querySelectorAll('[style*="width: 70%"], [style*="width: 50%"], [style*="width: 60%"], [style*="width: 40%"], [style*="width: 20%"]')
    expect(differentWidths.length).toBeGreaterThan(3)
  })
})

// Integration tests
describe('Skeleton Components Integration', () => {
  it('should work well together in complex layouts', () => {
    render(
      <div>
        <Skeleton variant="rectangular" height={200} className="mb-4" />
        <ListSkeleton count={2} />
        <DetailPageSkeleton />
      </div>
    )

    // Should render all components without conflicts
    expect(document.querySelector('.mb-4')).toBeInTheDocument()
    // 2 from ListSkeleton + 2 from DetailPageSkeleton (main info card + drinks menu)
    expect(document.querySelectorAll('.bg-white.rounded-2xl, .bg-white.rounded-xl').length).toBeGreaterThanOrEqual(3)
    expect(document.querySelector('.flex-1.overflow-y-auto')).toBeInTheDocument() // From DetailPageSkeleton
  })

  it('should maintain consistent styling across components', () => {
    render(
      <div>
        <CafeCardSkeleton />
        <ListSkeleton count={1} />
      </div>
    )
    
    // Both should use similar card styling
    const cards = document.querySelectorAll('.bg-white.rounded-2xl.shadow-xs.border-2.border-green-100')
    expect(cards.length).toBe(2) // One from CafeCardSkeleton, one from ListSkeleton
  })
})

// Performance and rendering tests
describe('Skeleton Performance', () => {
  it('should render large lists efficiently', () => {
    const startTime = performance.now()
    render(<ListSkeleton count={50} />)
    const endTime = performance.now()

    // Should render in reasonable time (relaxed threshold for CI environments)
    // Focus is on the list rendering correctly, not exact timing
    expect(endTime - startTime).toBeLessThan(1000)

    const cards = document.querySelectorAll('.bg-white.rounded-2xl')
    expect(cards).toHaveLength(50)
  })

  it('should handle rapid re-renders', () => {
    const { rerender } = render(<ListSkeleton count={5} />)

    expect(() => {
      for (let i = 0; i < 10; i++) {
        rerender(<ListSkeleton count={i + 1} />)
      }
    }).not.toThrow()
  })
})

// Edge cases and error handling
describe('Skeleton Edge Cases', () => {
  it('should handle negative dimensions gracefully', () => {
    render(<Skeleton width={-100} height={-50} />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '-100px', height: '-50px' })
  })

  it('should handle zero dimensions', () => {
    render(<Skeleton width={0} height={0} />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '0px', height: '0px' })
  })

  it('should handle very large dimensions', () => {
    render(<Skeleton width={9999} height={9999} />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: '9999px', height: '9999px' })
  })

  it('should handle special string values', () => {
    render(<Skeleton width="auto" height="inherit" />)
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toHaveStyle({ width: 'auto', height: 'inherit' })
  })

  it('should handle undefined props gracefully', () => {
    expect(() => {
      render(<Skeleton width={undefined} height={undefined} />)
    }).not.toThrow()
  })
})

// Accessibility tests
describe('Skeleton Accessibility', () => {
  it('should be screen reader friendly', () => {
    render(<Skeleton />)
    
    // Skeleton should not interfere with screen readers
    // Loading state should be communicated through parent components
    const skeleton = document.querySelector('.bg-gray-200')
    expect(skeleton).toBeInTheDocument()
  })

  it('should work with ARIA busy states', () => {
    render(
      <div aria-busy="true">
        <ListSkeleton count={3} />
      </div>
    )
    
    const container = document.querySelector('[aria-busy="true"]')
    expect(container).toBeInTheDocument()
  })
})