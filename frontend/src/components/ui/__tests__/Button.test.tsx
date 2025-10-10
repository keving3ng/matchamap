import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapPin, Navigation, Filter, Loader } from 'lucide-react'
import { PrimaryButton, SecondaryButton, TertiaryButton, IconButton, FilterButton } from '../Button'

describe('PrimaryButton', () => {
  it('should render with text content', () => {
    render(<PrimaryButton>Click me</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should render with icon on left by default', () => {
    render(<PrimaryButton icon={MapPin}>Get Directions</PrimaryButton>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Get Directions')
  })

  it('should render with icon on right when specified', () => {
    render(<PrimaryButton icon={Navigation} iconPosition="right">Navigate</PrimaryButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Navigate')
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<PrimaryButton onClick={handleClick}>Click</PrimaryButton>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<PrimaryButton disabled>Disabled Button</PrimaryButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should be disabled when loading prop is true', () => {
    render(<PrimaryButton loading>Loading Button</PrimaryButton>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-wait')
  })

  it('should show loading spinner when loading', () => {
    render(<PrimaryButton loading>Loading</PrimaryButton>)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<PrimaryButton disabled onClick={handleClick}>Disabled</PrimaryButton>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should not call onClick when loading', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<PrimaryButton loading onClick={handleClick}>Loading</PrimaryButton>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should have minimum 44px height for mobile touch targets', () => {
    render(<PrimaryButton>Touch Target</PrimaryButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]')
  })

  it('should be full width when fullWidth prop is true', () => {
    render(<PrimaryButton fullWidth>Full Width</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('should apply custom className', () => {
    render(<PrimaryButton className="custom-class">Custom</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('should have correct button type when specified', () => {
    render(<PrimaryButton type="submit">Submit</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('should have proper focus ring for accessibility', () => {
    render(<PrimaryButton>Focus Test</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveClass('focus:ring-2', 'focus:ring-green-500')
  })

  it('should have active scale animation', () => {
    render(<PrimaryButton>Active Test</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveClass('active:scale-[0.98]')
  })

  it('should not have active scale when disabled', () => {
    render(<PrimaryButton disabled>Disabled Active</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveClass('disabled:active:scale-100')
  })
})

describe('SecondaryButton', () => {
  it('should render with correct styling', () => {
    render(<SecondaryButton>Secondary</SecondaryButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-white', 'border-2', 'border-green-300', 'text-green-600')
  })

  it('should handle all same props as PrimaryButton', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <SecondaryButton
        icon={MapPin}
        iconPosition="right"
        onClick={handleClick}
        fullWidth
        loading={false}
      >
        Secondary Action
      </SecondaryButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Secondary Action')
    expect(button).toHaveClass('w-full')
    
    await user.click(button)
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should show loading spinner with correct color', () => {
    render(<SecondaryButton loading>Loading</SecondaryButton>)
    const spinner = document.querySelector('.border-green-600')
    expect(spinner).toBeInTheDocument()
  })

  it('should have hover styles', () => {
    render(<SecondaryButton>Hover Test</SecondaryButton>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-green-50')
  })
})

describe('TertiaryButton', () => {
  it('should render with gray styling', () => {
    render(<TertiaryButton>Tertiary</TertiaryButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-100', 'text-gray-700')
  })

  it('should have gray hover styles', () => {
    render(<TertiaryButton>Hover Test</TertiaryButton>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-200')
  })

  it('should show loading spinner with gray border', () => {
    render(<TertiaryButton loading>Loading</TertiaryButton>)
    const spinner = document.querySelector('.border-gray-700')
    expect(spinner).toBeInTheDocument()
  })

  it('should have gray focus ring', () => {
    render(<TertiaryButton>Focus Test</TertiaryButton>)
    expect(screen.getByRole('button')).toHaveClass('focus:ring-gray-500')
  })
})

describe('IconButton', () => {
  it('should render icon-only button with aria label', () => {
    render(<IconButton icon={MapPin} ariaLabel="Find location" />)
    const button = screen.getByLabelText('Find location')
    expect(button).toBeInTheDocument()
  })

  it('should require ariaLabel prop for accessibility', () => {
    render(<IconButton icon={MapPin} ariaLabel="Required label" />)
    expect(screen.getByLabelText('Required label')).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<IconButton icon={MapPin} onClick={handleClick} ariaLabel="Clickable" />)
    
    await user.click(screen.getByLabelText('Clickable'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should show badge when badge prop is true', () => {
    render(<IconButton icon={MapPin} badge={true} ariaLabel="With badge" />)
    const badge = document.querySelector('.animate-pulse')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-400', 'rounded-full')
  })

  it('should not show badge when loading', () => {
    render(<IconButton icon={MapPin} badge={true} loading={true} ariaLabel="Loading with badge" />)
    const badge = document.querySelector('.animate-pulse')
    expect(badge).not.toBeInTheDocument()
  })

  it('should render different variants correctly', () => {
    const { rerender } = render(<IconButton icon={MapPin} variant="primary" ariaLabel="Primary" />)
    expect(screen.getByLabelText('Primary')).toHaveClass('bg-green-600', 'text-white')
    
    rerender(<IconButton icon={MapPin} variant="secondary" ariaLabel="Secondary" />)
    expect(screen.getByLabelText('Secondary')).toHaveClass('bg-green-100', 'text-green-700')
    
    rerender(<IconButton icon={MapPin} variant="ghost" ariaLabel="Ghost" />)
    expect(screen.getByLabelText('Ghost')).toHaveClass('bg-white/95', 'backdrop-blur-sm')
  })

  it('should have proper size (44px x 44px) for touch targets', () => {
    render(<IconButton icon={MapPin} ariaLabel="Size test" />)
    expect(screen.getByLabelText('Size test')).toHaveClass('w-11', 'h-11')
  })

  it('should show loading spinner when loading', () => {
    render(<IconButton icon={MapPin} loading ariaLabel="Loading" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<IconButton icon={MapPin} loading ariaLabel="Loading button" />)
    expect(screen.getByLabelText('Loading button')).toBeDisabled()
  })

  it('should have rounded design', () => {
    render(<IconButton icon={MapPin} ariaLabel="Round" />)
    expect(screen.getByLabelText('Round')).toHaveClass('rounded-full')
  })

  it('should have active scale animation', () => {
    render(<IconButton icon={MapPin} ariaLabel="Active" />)
    expect(screen.getByLabelText('Active')).toHaveClass('active:scale-95')
  })
})

describe('FilterButton', () => {
  it('should render in inactive state by default', () => {
    render(<FilterButton>Filter</FilterButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-green-100', 'text-green-700')
    expect(button).not.toHaveClass('bg-green-600')
  })

  it('should render in active state when active prop is true', () => {
    render(<FilterButton active>Active Filter</FilterButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-green-600', 'text-white')
  })

  it('should show badge indicator when hasBadge is true and not active', () => {
    render(<FilterButton hasBadge>Filter with badge</FilterButton>)
    const badge = document.querySelector('.bg-red-500.rounded-full')
    expect(badge).toBeInTheDocument()
  })

  it('should not show badge when active', () => {
    render(<FilterButton active hasBadge>Active with badge</FilterButton>)
    const badge = document.querySelector('.bg-red-500')
    expect(badge).not.toBeInTheDocument()
  })

  it('should not show badge when loading', () => {
    render(<FilterButton loading hasBadge>Loading with badge</FilterButton>)
    const badge = document.querySelector('.bg-red-500')
    expect(badge).not.toBeInTheDocument()
  })

  it('should render with icon', () => {
    render(<FilterButton icon={Filter}>Filter Button</FilterButton>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show loading spinner when loading', () => {
    render(<FilterButton loading>Loading filter</FilterButton>)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<FilterButton loading>Loading filter</FilterButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should have proper touch target size', () => {
    render(<FilterButton>Touch target</FilterButton>)
    expect(screen.getByRole('button')).toHaveClass('min-h-[44px]', 'min-w-[44px]')
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<FilterButton onClick={handleClick}>Clickable filter</FilterButton>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should have responsive text display', () => {
    render(<FilterButton>Responsive text</FilterButton>)
    const textSpan = screen.getByText('Responsive text')
    expect(textSpan).toHaveClass('hidden', 'sm:inline')
  })

  it('should have hover styles when not active', () => {
    render(<FilterButton>Hover test</FilterButton>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-green-200')
  })

  it('should have pill shape', () => {
    render(<FilterButton>Pill shape</FilterButton>)
    expect(screen.getByRole('button')).toHaveClass('rounded-full')
  })
})

// Shared behavior tests across all button components
describe('Button Accessibility', () => {
  it('should support keyboard navigation with Enter key', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<PrimaryButton onClick={handleClick}>Keyboard test</PrimaryButton>)
    
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should support keyboard navigation with Space key', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SecondaryButton onClick={handleClick}>Space test</SecondaryButton>)
    
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should have proper focus management', () => {
    render(<TertiaryButton>Focus management</TertiaryButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus:outline-none')
    expect(button).toHaveClass('focus:ring-2')
  })
})

// Edge cases and error handling
describe('Button Edge Cases', () => {
  it('should handle undefined onClick gracefully', () => {
    expect(() => {
      render(<PrimaryButton>No onClick</PrimaryButton>)
    }).not.toThrow()
  })

  it('should handle empty children gracefully', () => {
    render(<PrimaryButton>{''}</PrimaryButton>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle multiple class names', () => {
    render(<PrimaryButton className="class1 class2 class3">Multiple classes</PrimaryButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('class1', 'class2', 'class3')
  })

  it('should handle icon without children', () => {
    render(<PrimaryButton icon={MapPin}>{''}</PrimaryButton>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})