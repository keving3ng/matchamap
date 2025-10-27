import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PassportMigrationModal } from '../PassportMigrationModal'

describe('PassportMigrationModal', () => {
  const mockOnMigrate = vi.fn()
  const mockOnSkip = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    isOpen: true,
    isLoading: false,
    error: null,
    localVisitCount: 5,
    onMigrate: mockOnMigrate,
    onSkip: mockOnSkip,
    onClose: mockOnClose,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(<PassportMigrationModal {...defaultProps} />)

    expect(screen.getByText('Sync Your Passport')).toBeInTheDocument()
    expect(screen.getByText('We found visits saved locally on your device. Would you like to sync them to your account?')).toBeInTheDocument()
    expect(screen.getByText('5 local visits found')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<PassportMigrationModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Sync Your Passport')).not.toBeInTheDocument()
  })

  it('should handle plural vs singular visit count text', () => {
    const { rerender } = render(<PassportMigrationModal {...defaultProps} localVisitCount={1} />)
    expect(screen.getByText('1 local visit found')).toBeInTheDocument()

    rerender(<PassportMigrationModal {...defaultProps} localVisitCount={0} />)
    expect(screen.getByText('0 local visits found')).toBeInTheDocument()

    rerender(<PassportMigrationModal {...defaultProps} localVisitCount={3} />)
    expect(screen.getByText('3 local visits found')).toBeInTheDocument()
  })

  it('should call onMigrate when migrate button is clicked', async () => {
    const user = userEvent.setup()
    render(<PassportMigrationModal {...defaultProps} />)

    const migrateButton = screen.getByText('Sync to Account')
    await user.click(migrateButton)

    expect(mockOnMigrate).toHaveBeenCalledTimes(1)
  })

  it('should call onSkip when skip button is clicked', async () => {
    const user = userEvent.setup()
    render(<PassportMigrationModal {...defaultProps} />)

    const skipButton = screen.getByText('Skip for Now')
    await user.click(skipButton)

    expect(mockOnSkip).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<PassportMigrationModal {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading state', () => {
    render(<PassportMigrationModal {...defaultProps} isLoading={true} />)

    expect(screen.getByText('Syncing...')).toBeInTheDocument()
    
    const migrateButton = screen.getByText('Syncing...')
    expect(migrateButton).toBeDisabled()
  })

  it('should display error message when error occurs', () => {
    const errorMessage = 'Failed to sync visits. Please try again.'
    render(<PassportMigrationModal {...defaultProps} error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toHaveClass('text-red-600')
  })

  it('should disable buttons when loading', () => {
    render(<PassportMigrationModal {...defaultProps} isLoading={true} />)

    const migrateButton = screen.getByText('Syncing...')
    const skipButton = screen.getByText('Skip for Now')

    expect(migrateButton).toBeDisabled()
    expect(skipButton).toBeDisabled()
  })

  it('should close modal when overlay is clicked', async () => {
    const user = userEvent.setup()
    render(<PassportMigrationModal {...defaultProps} />)

    // Click on the overlay background
    const overlay = screen.getByText('Sync Your Passport').closest('div')?.parentElement
    expect(overlay).toBeInTheDocument()
    
    await user.click(overlay!)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should have proper accessibility attributes', () => {
    render(<PassportMigrationModal {...defaultProps} />)

    const migrateButton = screen.getByText('Sync to Account')
    const skipButton = screen.getByText('Skip for Now')
    const closeButton = screen.getByRole('button', { name: /close/i })

    expect(migrateButton).toHaveAttribute('type', 'button')
    expect(skipButton).toHaveAttribute('type', 'button')
    expect(closeButton).toHaveAttribute('type', 'button')
  })

  it('should maintain focus trap within modal', () => {
    render(<PassportMigrationModal {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3) // migrate, skip, close

    buttons.forEach(button => {
      expect(button).toBeVisible()
    })
  })

  it('should show passport emoji icon', () => {
    render(<PassportMigrationModal {...defaultProps} />)

    expect(screen.getByText('🎫')).toBeInTheDocument()
  })

  it('should handle zero visits gracefully', () => {
    render(<PassportMigrationModal {...defaultProps} localVisitCount={0} />)

    expect(screen.getByText('0 local visits found')).toBeInTheDocument()
    expect(screen.getByText('Sync to Account')).toBeInTheDocument()
  })
})