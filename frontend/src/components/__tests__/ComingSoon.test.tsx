import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComingSoon } from '../ComingSoon'
import { api } from '../../utils/api'

// Mock validation utility
vi.mock('../../utils/validation', () => ({
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
}))

// Mock API
vi.mock('../../utils/api', () => ({
  api: {
    waitlist: {
      join: vi.fn(),
    },
  },
}))

describe('ComingSoon', () => {
  const mockOnPasswordCorrect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock environment variable before each test
    vi.stubEnv('VITE_ACCESS_PASSWORD', 'test123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should render MatchaMap title and emoji', () => {
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    expect(screen.getByText('MatchaMap')).toBeInTheDocument()
    expect(screen.getByText('🍵')).toBeInTheDocument()
  })

  it('should render email form initially', () => {
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    expect(screen.getByPlaceholderText('your email')).toBeInTheDocument()
    expect(screen.getByText('notify me')).toBeInTheDocument()
  })

  it('should handle email submission to waitlist', async () => {
    const user = userEvent.setup()
    vi.mocked(api.waitlist.join).mockResolvedValue({})

    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emailInput = screen.getByPlaceholderText('your email')
    const submitButton = screen.getByText('notify me')

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    expect(api.waitlist.join).toHaveBeenCalledWith('test@example.com')

    await waitFor(() => {
      expect(screen.getByText('you\'re in.')).toBeInTheDocument()
    })
  })

  it('should show loading state during email submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(api.waitlist.join).mockReturnValue(promise)

    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emailInput = screen.getByPlaceholderText('your email')
    const submitButton = screen.getByText('notify me')

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    expect(screen.getByText('...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(emailInput).toBeDisabled()

    resolvePromise!()
    await waitFor(() => {
      expect(screen.getByText('you\'re in.')).toBeInTheDocument()
    })
  })

  it('should show password field when emoji is clicked', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emojiButton = screen.getByText('🍵')
    await user.click(emojiButton)

    expect(screen.getByPlaceholderText('password')).toBeInTheDocument()
  })

  it('should handle correct password submission', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    // Click emoji to show password field
    const emojiButton = screen.getByText('🍵')
    await user.click(emojiButton)

    const passwordInput = screen.getByPlaceholderText('password')
    await user.type(passwordInput, 'test123')

    // Submit the form explicitly
    const form = passwordInput.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockOnPasswordCorrect).toHaveBeenCalled()
    })
  })

  it('should clear password field on incorrect password', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    // Click emoji to show password field
    const emojiButton = screen.getByText('🍵')
    await user.click(emojiButton)

    const passwordInput = screen.getByPlaceholderText('password')
    await user.type(passwordInput, 'wrongpassword')
    
    fireEvent.submit(passwordInput.closest('form')!)

    expect(mockOnPasswordCorrect).not.toHaveBeenCalled()
    expect(passwordInput).toHaveValue('')
  })

  it('should handle email validation', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emailInput = screen.getByPlaceholderText('your email')
    const submitButton = screen.getByText('notify me')

    // Try invalid email
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(api.waitlist.join).not.toHaveBeenCalled()
  })

  it('should handle API error gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.waitlist.join).mockRejectedValue(new Error('API Error'))

    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emailInput = screen.getByPlaceholderText('your email')
    const submitButton = screen.getByText('notify me')

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error joining waitlist:', expect.any(Error))
    })

    // Should return to normal state
    expect(screen.getByText('notify me')).toBeInTheDocument()
    expect(screen.queryByText('you\'re in.')).not.toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should toggle password field visibility', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emojiButton = screen.getByText('🍵')

    // Show password field
    await user.click(emojiButton)
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument()

    // Hide password field
    await user.click(emojiButton)
    expect(screen.queryByPlaceholderText('password')).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emailInput = screen.getByPlaceholderText('your email')
    const submitButton = screen.getByText('notify me')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('should clear email after successful submission', async () => {
    const user = userEvent.setup()
    vi.mocked(api.waitlist.join).mockResolvedValue({})

    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emailInput = screen.getByPlaceholderText('your email')
    const submitButton = screen.getByText('notify me')

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('you\'re in.')).toBeInTheDocument()
    })

    // Email should be cleared (component maintains state internally)
    expect(emailInput).not.toBeInTheDocument() // Input is replaced with success message
  })

  it('should handle empty email submission', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const submitButton = screen.getByText('notify me')
    await user.click(submitButton)

    expect(api.waitlist.join).not.toHaveBeenCalled()
  })

  it('should focus password input when shown', async () => {
    const user = userEvent.setup()
    render(<ComingSoon onPasswordCorrect={mockOnPasswordCorrect} />)

    const emojiButton = screen.getByText('🍵')
    await user.click(emojiButton)

    const passwordInput = screen.getByPlaceholderText('password')
    await waitFor(() => {
      expect(passwordInput).toHaveFocus()
    })
  })
})