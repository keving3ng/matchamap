import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactPage } from '../ContactPage'

// Mock API
const mockApi = {
  contact: {
    send: vi.fn(),
  },
}

vi.mock('../../utils/api', () => ({
  api: mockApi,
}))

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render contact form', () => {
    render(<ContactPage />)

    expect(screen.getByText(/Contact/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Your Name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Your Email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Your Message/i)).toBeInTheDocument()
    expect(screen.getByText(/Send Message/i)).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    mockApi.contact.send.mockResolvedValue({})

    render(<ContactPage />)

    await user.type(screen.getByPlaceholderText(/Your Name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/Your Email/i), 'john@example.com')
    await user.type(screen.getByPlaceholderText(/Your Message/i), 'Test message')

    const submitButton = screen.getByText(/Send Message/i)
    await user.click(submitButton)

    expect(mockApi.contact.send).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockApi.contact.send.mockReturnValue(promise)

    render(<ContactPage />)

    await user.type(screen.getByPlaceholderText(/Your Name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/Your Email/i), 'john@example.com')
    await user.type(screen.getByPlaceholderText(/Your Message/i), 'Test message')

    const submitButton = screen.getByText(/Send Message/i)
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()

    resolvePromise!()
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('should handle form validation', async () => {
    const user = userEvent.setup()
    render(<ContactPage />)

    const submitButton = screen.getByText(/Send Message/i)
    await user.click(submitButton)

    expect(mockApi.contact.send).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockApi.contact.send.mockRejectedValue(new Error('API Error'))

    render(<ContactPage />)

    await user.type(screen.getByPlaceholderText(/Your Name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/Your Email/i), 'john@example.com')
    await user.type(screen.getByPlaceholderText(/Your Message/i), 'Test message')

    const submitButton = screen.getByText(/Send Message/i)
    await user.click(submitButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })
})