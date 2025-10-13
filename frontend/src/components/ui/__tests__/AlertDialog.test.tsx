import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlertCircle, CheckCircle, XCircle, Info, MapPin } from 'lucide-react'
import { AlertDialog, InfoCard } from '../AlertDialog'

describe('AlertDialog', () => {
  it('should render title and message', () => {
    render(
      <AlertDialog
        title="Test Title"
        message="Test message content"
      />
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message content')).toBeInTheDocument()
  })

  it('should render with default info variant', () => {
    const { container } = render(
      <AlertDialog
        title="Default Alert"
        message="Default message"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass('border-matcha-200')
  })

  it('should render success variant with correct styling', () => {
    const { container } = render(
      <AlertDialog
        variant="success"
        title="Success Alert"
        message="Operation completed successfully"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass('border-green-200')
  })

  it('should render error variant with correct styling', () => {
    const { container } = render(
      <AlertDialog
        variant="error"
        title="Error Alert"
        message="Something went wrong"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass('border-red-200')
  })

  it('should render warning variant with correct styling', () => {
    const { container } = render(
      <AlertDialog
        variant="warning"
        title="Warning Alert"
        message="Please be careful"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass('border-yellow-200')
  })

  it('should render info variant with correct styling', () => {
    const { container } = render(
      <AlertDialog
        variant="info"
        title="Info Alert"
        message="Here's some information"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass('border-matcha-200')
  })

  it('should use default icon for each variant', () => {
    const { rerender } = render(
      <AlertDialog variant="success" title="Success" message="Success message" />
    )
    expect(document.querySelector('.text-green-600')).toBeInTheDocument()
    
    rerender(<AlertDialog variant="error" title="Error" message="Error message" />)
    expect(document.querySelector('.text-red-600')).toBeInTheDocument()
    
    rerender(<AlertDialog variant="warning" title="Warning" message="Warning message" />)
    expect(document.querySelector('.text-yellow-600')).toBeInTheDocument()
    
    rerender(<AlertDialog variant="info" title="Info" message="Info message" />)
    expect(document.querySelector('.text-matcha-600')).toBeInTheDocument()
  })

  it('should use custom icon when provided', () => {
    render(
      <AlertDialog
        icon={MapPin}
        title="Custom Icon"
        message="Using custom icon"
      />
    )
    
    // Icon should be rendered (MapPin icon)
    const iconContainer = document.querySelector('.w-10.h-10')
    expect(iconContainer).toBeInTheDocument()
  })

  it('should render primary action button', async () => {
    const user = userEvent.setup()
    const handlePrimary = vi.fn()
    
    render(
      <AlertDialog
        title="Action Alert"
        message="Click the action"
        primaryAction={{
          label: "Confirm",
          onClick: handlePrimary
        }}
      />
    )
    
    const primaryButton = screen.getByText('Confirm')
    expect(primaryButton).toBeInTheDocument()
    expect(primaryButton).toHaveClass('bg-matcha-500', 'text-white')
    
    await user.click(primaryButton)
    expect(handlePrimary).toHaveBeenCalledOnce()
  })

  it('should render secondary action button', async () => {
    const user = userEvent.setup()
    const handleSecondary = vi.fn()
    
    render(
      <AlertDialog
        title="Two Actions"
        message="Choose an action"
        secondaryAction={{
          label: "Cancel",
          onClick: handleSecondary
        }}
      />
    )
    
    const secondaryButton = screen.getByText('Cancel')
    expect(secondaryButton).toBeInTheDocument()
    expect(secondaryButton).toHaveClass('bg-gray-100', 'text-gray-700')
    
    await user.click(secondaryButton)
    expect(handleSecondary).toHaveBeenCalledOnce()
  })

  it('should render both primary and secondary actions', () => {
    render(
      <AlertDialog
        title="Both Actions"
        message="Two buttons available"
        primaryAction={{
          label: "Save",
          onClick: vi.fn()
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: vi.fn()
        }}
      />
    )
    
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should not render action buttons when not provided', () => {
    render(
      <AlertDialog
        title="No Actions"
        message="Just informational"
      />
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should have proper touch targets for action buttons', () => {
    render(
      <AlertDialog
        title="Touch Targets"
        message="Mobile-friendly buttons"
        primaryAction={{
          label: "Touch Me",
          onClick: vi.fn()
        }}
      />
    )
    
    const button = screen.getByText('Touch Me')
    expect(button).toHaveClass('min-h-[44px]')
  })

  it('should handle React node message content', () => {
    render(
      <AlertDialog
        title="Rich Message"
        message={
          <div>
            <p>First paragraph</p>
            <strong>Bold text</strong>
          </div>
        }
      />
    )
    
    expect(screen.getByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('Bold text')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <AlertDialog
        title="Custom Class"
        message="Testing custom styles"
        className="custom-alert-class"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass('custom-alert-class')
  })

  it('should have proper positioning and styling', () => {
    const { container } = render(
      <AlertDialog
        title="Positioning Test"
        message="Check positioning"
      />
    )

    const alertContainer = container.querySelector('.absolute.inset-x-4')
    expect(alertContainer).toHaveClass(
      'absolute',
      'inset-x-4',
      'top-4',
      'bg-white',
      'rounded-xl',
      'shadow-xl',
      'p-4',
      'z-[9999]',
      'animate-slide-up'
    )
  })

  it('should have proper icon container styling', () => {
    render(
      <AlertDialog
        variant="success"
        title="Icon Container"
        message="Testing icon container"
      />
    )
    
    const iconContainer = document.querySelector('.w-10.h-10.rounded-full.bg-green-100')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('flex', 'items-center', 'justify-center', 'flex-shrink-0')
  })

  it('should have responsive action layout', () => {
    render(
      <AlertDialog
        title="Responsive Actions"
        message="Testing responsive layout"
        primaryAction={{
          label: "Primary",
          onClick: vi.fn()
        }}
        secondaryAction={{
          label: "Secondary",
          onClick: vi.fn()
        }}
      />
    )
    
    const actionsContainer = screen.getByText('Primary').parentElement
    expect(actionsContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-2')
  })
})

describe('InfoCard', () => {
  it('should render children content', () => {
    render(
      <InfoCard>
        <p>Info card content</p>
      </InfoCard>
    )
    
    expect(screen.getByText('Info card content')).toBeInTheDocument()
  })

  it('should render title when provided', () => {
    render(
      <InfoCard title="Card Title">
        Card content
      </InfoCard>
    )
    
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('should not render title section when title is not provided', () => {
    render(
      <InfoCard>
        Content only
      </InfoCard>
    )
    
    const titleContainer = document.querySelector('.flex.items-center.gap-2.mb-2')
    expect(titleContainer).not.toBeInTheDocument()
  })

  it('should render with default variant styling', () => {
    const { container } = render(
      <InfoCard>Default card</InfoCard>
    )

    const infoCardContainer = container.querySelector('.rounded-xl.p-3.border')
    expect(infoCardContainer).toHaveClass('bg-gray-50', 'border-gray-200')
  })

  it('should render success variant styling', () => {
    const { container } = render(
      <InfoCard variant="success">Success card</InfoCard>
    )

    const infoCardContainer = container.querySelector('.rounded-xl.p-3.border')
    expect(infoCardContainer).toHaveClass('bg-green-50', 'border-green-200')
  })

  it('should render warning variant styling', () => {
    const { container } = render(
      <InfoCard variant="warning">Warning card</InfoCard>
    )

    const infoCardContainer = container.querySelector('.rounded-xl.p-3.border')
    expect(infoCardContainer).toHaveClass('bg-yellow-50', 'border-yellow-200')
  })

  it('should render info variant styling', () => {
    const { container } = render(
      <InfoCard variant="info">Info card</InfoCard>
    )

    const infoCardContainer = container.querySelector('.rounded-xl.p-3.border')
    expect(infoCardContainer).toHaveClass('bg-blue-50', 'border-blue-200')
  })

  it('should render icon in title when provided', () => {
    render(
      <InfoCard title="Icon Title" icon={Info}>
        Content with icon
      </InfoCard>
    )
    
    expect(screen.getByText('Icon Title')).toBeInTheDocument()
    // Icon should be present in title area
    const titleContainer = document.querySelector('.flex.items-center.gap-2')
    expect(titleContainer).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <InfoCard className="custom-info-class">
        Custom styled card
      </InfoCard>
    )

    const infoCardContainer = container.querySelector('.rounded-xl.p-3.border')
    expect(infoCardContainer).toHaveClass('custom-info-class')
  })

  it('should have proper base styling', () => {
    const { container } = render(
      <InfoCard>Base styling test</InfoCard>
    )

    const infoCardContainer = container.querySelector('.rounded-xl.p-3.border')
    expect(infoCardContainer).toHaveClass('rounded-xl', 'p-3', 'border')
  })

  it('should have proper title styling', () => {
    render(
      <InfoCard title="Styled Title">
        Content
      </InfoCard>
    )
    
    const title = screen.getByText('Styled Title')
    expect(title).toHaveClass('text-sm', 'font-semibold', 'text-gray-800')
  })

  it('should have proper content styling', () => {
    render(
      <InfoCard>
        <span>Content styling</span>
      </InfoCard>
    )
    
    const contentContainer = screen.getByText('Content styling').parentElement
    expect(contentContainer).toHaveClass('text-sm', 'text-gray-700')
  })

  it('should handle complex children content', () => {
    render(
      <InfoCard title="Complex Content">
        <div>
          <p>First paragraph</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </div>
      </InfoCard>
    )
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument()
    expect(screen.getByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('List item 1')).toBeInTheDocument()
    expect(screen.getByText('List item 2')).toBeInTheDocument()
  })
})

// Integration tests
describe('AlertDialog and InfoCard Integration', () => {
  it('should work well in combination', () => {
    render(
      <div>
        <AlertDialog
          title="Main Alert"
          message="Primary notification"
          variant="success"
        />
        <InfoCard title="Additional Info" variant="info">
          Supplementary information
        </InfoCard>
      </div>
    )
    
    expect(screen.getByText('Main Alert')).toBeInTheDocument()
    expect(screen.getByText('Additional Info')).toBeInTheDocument()
    expect(screen.getByText('Primary notification')).toBeInTheDocument()
    expect(screen.getByText('Supplementary information')).toBeInTheDocument()
  })
})

// Accessibility tests
describe('AlertDialog Accessibility', () => {
  it('should support keyboard navigation for action buttons', async () => {
    const user = userEvent.setup()
    const handlePrimary = vi.fn()
    
    render(
      <AlertDialog
        title="Keyboard Test"
        message="Test keyboard navigation"
        primaryAction={{
          label: "Confirm",
          onClick: handlePrimary
        }}
      />
    )
    
    const button = screen.getByText('Confirm')
    button.focus()
    await user.keyboard('{Enter}')
    expect(handlePrimary).toHaveBeenCalledOnce()
  })

  it('should have proper focus management', () => {
    render(
      <AlertDialog
        title="Focus Test"
        message="Test focus management"
        primaryAction={{
          label: "Focus Me",
          onClick: vi.fn()
        }}
      />
    )
    
    const button = screen.getByText('Focus Me')
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
  })
})

// Edge cases
describe('AlertDialog Edge Cases', () => {
  it('should handle empty title gracefully', () => {
    render(
      <AlertDialog
        title=""
        message="Empty title test"
      />
    )
    
    expect(screen.getByText('Empty title test')).toBeInTheDocument()
  })

  it('should handle empty message gracefully', () => {
    render(
      <AlertDialog
        title="Empty Message"
        message=""
      />
    )
    
    expect(screen.getByText('Empty Message')).toBeInTheDocument()
  })

  it('should handle undefined action callbacks', () => {
    expect(() => {
      render(
        <AlertDialog
          title="Undefined Callback"
          message="Testing undefined"
          primaryAction={{
            label: "Button",
            onClick: undefined as any
          }}
        />
      )
    }).not.toThrow()
  })
})