import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBadge, DrinkScoreBadge, StatusBadge, FeatureBadge, NotificationBadge } from '../Badge'

describe('ScoreBadge', () => {
  it('should display score with one decimal place', () => {
    render(<ScoreBadge score={8.5} />)
    expect(screen.getByText('8.5')).toBeInTheDocument()
  })

  it('should round score to one decimal place', () => {
    render(<ScoreBadge score={7.67} />)
    expect(screen.getByText('7.7')).toBeInTheDocument()
  })

  it('should handle whole numbers', () => {
    render(<ScoreBadge score={9} />)
    expect(screen.getByText('9.0')).toBeInTheDocument()
  })

  it('should handle zero score', () => {
    render(<ScoreBadge score={0} />)
    expect(screen.getByText('0.0')).toBeInTheDocument()
  })

  it('should handle maximum score', () => {
    render(<ScoreBadge score={10} />)
    expect(screen.getByText('10.0')).toBeInTheDocument()
  })

  it('should render with default medium size', () => {
    render(<ScoreBadge score={8.5} />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('px-3', 'py-1', 'text-base')
  })

  it('should render small size correctly', () => {
    render(<ScoreBadge score={8.5} size="sm" />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm')
  })

  it('should render large size correctly', () => {
    render(<ScoreBadge score={8.5} size="lg" />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('px-4', 'py-2', 'text-xl')
  })

  it('should render extra large size correctly', () => {
    render(<ScoreBadge score={8.5} size="xl" />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('px-4', 'py-2', 'text-2xl')
  })

  it('should have green gradient background', () => {
    render(<ScoreBadge score={8.5} />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('bg-gradient-to-br', 'from-green-500', 'to-green-600')
  })

  it('should have white text and proper styling', () => {
    render(<ScoreBadge score={8.5} />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('text-white', 'rounded-full', 'font-bold', 'shadow-md')
  })

  it('should apply custom className', () => {
    render(<ScoreBadge score={8.5} className="custom-class" />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('custom-class')
  })

  it('should be centered', () => {
    render(<ScoreBadge score={8.5} />)
    const badge = screen.getByText('8.5')
    expect(badge).toHaveClass('flex', 'items-center', 'justify-center')
  })
})

describe('DrinkScoreBadge', () => {
  it('should display score with star icon', () => {
    render(<DrinkScoreBadge score={7.8} />)
    expect(screen.getByText('7.8')).toBeInTheDocument()
  })

  it('should format score to one decimal place', () => {
    render(<DrinkScoreBadge score={6.45} />)
    expect(screen.getByText('6.5')).toBeInTheDocument()
  })

  it('should have star icon with proper styling', () => {
    render(<DrinkScoreBadge score={7.8} />)
    const container = screen.getByText('7.8').parentElement
    expect(container).toHaveClass('flex', 'items-center', 'gap-1')
  })

  it('should have green color scheme', () => {
    render(<DrinkScoreBadge score={7.8} />)
    const scoreText = screen.getByText('7.8')
    expect(scoreText).toHaveClass('font-semibold', 'text-green-600')
  })

  it('should apply custom className', () => {
    render(<DrinkScoreBadge score={7.8} className="custom-drink-class" />)
    const container = screen.getByText('7.8').parentElement
    expect(container).toHaveClass('custom-drink-class')
  })

  it('should handle edge score values', () => {
    const { rerender } = render(<DrinkScoreBadge score={0} />)
    expect(screen.getByText('0.0')).toBeInTheDocument()
    
    rerender(<DrinkScoreBadge score={10} />)
    expect(screen.getByText('10.0')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('should render children content', () => {
    render(<StatusBadge>Open Now</StatusBadge>)
    expect(screen.getByText('Open Now')).toBeInTheDocument()
  })

  it('should use default variant styling', () => {
    render(<StatusBadge>Default Status</StatusBadge>)
    const badge = screen.getByText('Default Status')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700', 'border-gray-300')
  })

  it('should apply success variant styling', () => {
    render(<StatusBadge variant="success">Success Status</StatusBadge>)
    const badge = screen.getByText('Success Status')
    expect(badge).toHaveClass('bg-green-100', 'text-green-700', 'border-green-300')
  })

  it('should apply warning variant styling', () => {
    render(<StatusBadge variant="warning">Warning Status</StatusBadge>)
    const badge = screen.getByText('Warning Status')
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700', 'border-yellow-300')
  })

  it('should apply error variant styling', () => {
    render(<StatusBadge variant="error">Error Status</StatusBadge>)
    const badge = screen.getByText('Error Status')
    expect(badge).toHaveClass('bg-red-100', 'text-red-700', 'border-red-300')
  })

  it('should apply info variant styling', () => {
    render(<StatusBadge variant="info">Info Status</StatusBadge>)
    const badge = screen.getByText('Info Status')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700', 'border-blue-300')
  })

  it('should have proper badge styling', () => {
    render(<StatusBadge>Badge Style</StatusBadge>)
    const badge = screen.getByText('Badge Style')
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'px-2',
      'py-0.5',
      'rounded-full',
      'text-xs',
      'font-medium',
      'border'
    )
  })

  it('should apply custom className', () => {
    render(<StatusBadge className="custom-status-class">Custom</StatusBadge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-status-class')
  })

  it('should handle React node children', () => {
    render(
      <StatusBadge>
        <span>Complex content</span>
      </StatusBadge>
    )
    expect(screen.getByText('Complex content')).toBeInTheDocument()
  })
})

describe('FeatureBadge', () => {
  it('should render children content', () => {
    render(<FeatureBadge>Featured</FeatureBadge>)
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('should have green background and white text', () => {
    render(<FeatureBadge>Featured Item</FeatureBadge>)
    const badge = screen.getByText('Featured Item')
    expect(badge).toHaveClass('bg-green-500', 'text-white')
  })

  it('should have proper styling', () => {
    render(<FeatureBadge>Default Drink</FeatureBadge>)
    const badge = screen.getByText('Default Drink')
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs', 'rounded', 'font-medium')
  })

  it('should apply custom className', () => {
    render(<FeatureBadge className="custom-feature-class">Special</FeatureBadge>)
    const badge = screen.getByText('Special')
    expect(badge).toHaveClass('custom-feature-class')
  })

  it('should handle React node children', () => {
    render(
      <FeatureBadge>
        <strong>Bold feature</strong>
      </FeatureBadge>
    )
    expect(screen.getByText('Bold feature')).toBeInTheDocument()
  })
})

describe('NotificationBadge', () => {
  it('should render as dot without count', () => {
    render(<NotificationBadge />)
    const badge = document.querySelector('.bg-red-500.rounded-full')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('w-3', 'h-3')
  })

  it('should render with count when provided', () => {
    render(<NotificationBadge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should handle large count numbers', () => {
    render(<NotificationBadge count={99} />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('should have proper positioning', () => {
    render(<NotificationBadge count={3} />)
    const badge = screen.getByText('3')
    expect(badge).toHaveClass('absolute', '-top-1', '-right-1')
  })

  it('should have proper styling for count badge', () => {
    render(<NotificationBadge count={7} />)
    const badge = screen.getByText('7')
    expect(badge).toHaveClass(
      'px-1.5',
      'py-0.5',
      'min-w-[18px]',
      'bg-red-500',
      'border-2',
      'border-white',
      'rounded-full',
      'text-white',
      'text-xs',
      'font-bold',
      'flex',
      'items-center',
      'justify-center'
    )
  })

  it('should have proper styling for dot badge', () => {
    render(<NotificationBadge />)
    const badge = document.querySelector('.bg-red-500')
    expect(badge).toHaveClass(
      'w-3',
      'h-3',
      'bg-red-500',
      'border-2',
      'border-white',
      'rounded-full'
    )
  })

  it('should show pulse animation when pulse prop is true', () => {
    render(<NotificationBadge pulse />)
    const badge = document.querySelector('.animate-pulse')
    expect(badge).toBeInTheDocument()
  })

  it('should not show pulse animation by default', () => {
    render(<NotificationBadge />)
    const badge = document.querySelector('.bg-red-500')
    expect(badge).not.toHaveClass('animate-pulse')
  })

  it('should apply custom className', () => {
    render(<NotificationBadge className="custom-notification-class" />)
    const badge = document.querySelector('.custom-notification-class')
    expect(badge).toBeInTheDocument()
  })

  it('should handle zero count properly', () => {
    render(<NotificationBadge count={0} />)
    const badge = screen.getByText('0')
    expect(badge).toBeInTheDocument()
  })

  it('should center count text', () => {
    render(<NotificationBadge count={8} />)
    const badge = screen.getByText('8')
    expect(badge).toHaveClass('flex', 'items-center', 'justify-center')
  })
})

// Integration tests for badge combinations
describe('Badge Integration', () => {
  it('should work well together in complex layouts', () => {
    render(
      <div>
        <ScoreBadge score={8.7} size="lg" />
        <StatusBadge variant="success">Open</StatusBadge>
        <FeatureBadge>Special</FeatureBadge>
      </div>
    )
    
    expect(screen.getByText('8.7')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Special')).toBeInTheDocument()
  })

  it('should maintain proper spacing and alignment', () => {
    render(
      <div className="flex items-center gap-2">
        <DrinkScoreBadge score={7.5} />
        <StatusBadge variant="warning">Limited</StatusBadge>
      </div>
    )
    
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('Limited')).toBeInTheDocument()
  })
})

// Edge cases and error handling
describe('Badge Edge Cases', () => {
  it('should handle very high scores', () => {
    render(<ScoreBadge score={999.99} />)
    expect(screen.getByText('1000.0')).toBeInTheDocument()
  })

  it('should handle negative scores gracefully', () => {
    render(<ScoreBadge score={-1.5} />)
    expect(screen.getByText('-1.5')).toBeInTheDocument()
  })

  it('should handle empty children in status badge', () => {
    const { container } = render(<StatusBadge>{''}</StatusBadge>)
    const badge = container.querySelector('.inline-flex.items-center')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('inline-flex')
  })

  it('should handle undefined count in notification badge', () => {
    render(<NotificationBadge count={undefined} />)
    const badge = document.querySelector('.bg-red-500')
    expect(badge).toHaveClass('w-3', 'h-3')
  })

  it('should handle NaN scores gracefully', () => {
    render(<ScoreBadge score={NaN} />)
    expect(screen.getByText('NaN')).toBeInTheDocument()
  })
})