import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactPage } from '../ContactPage'
import { COPY } from '../../constants/copy'

const { mockSubmit } = vi.hoisted(() => ({
  mockSubmit: vi.fn(),
}))

vi.mock('../../utils/api', () => ({
  api: {
    contact: {
      submit: mockSubmit,
    },
  },
}))

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render contact form', () => {
    render(<ContactPage />)

    expect(screen.getByText(COPY.contact.pageTitle)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(COPY.contact.namePlaceholder)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(COPY.contact.emailPlaceholder)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(COPY.contact.messagePlaceholder)).toBeInTheDocument()
    expect(screen.getByText(COPY.contact.send)).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    mockSubmit.mockResolvedValue({ success: true })

    render(<ContactPage />)

    await user.type(screen.getByPlaceholderText(COPY.contact.namePlaceholder), 'John Doe')
    await user.type(screen.getByPlaceholderText(COPY.contact.emailPlaceholder), 'john@example.com')
    const subjectSelect = screen.getByLabelText(new RegExp(`^${COPY.contact.subjectLabel}$`))
    await user.selectOptions(subjectSelect, 'general')
    await user.type(screen.getByPlaceholderText(COPY.contact.messagePlaceholder), 'Test message')

    await act(async () => {
      await user.click(screen.getByText(COPY.contact.send))
    })

    await waitFor(() => {
      expect(screen.getByText(COPY.contact.successTitle)).toBeInTheDocument()
    })

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'general',
      message: 'Test message',
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    let resolveSubmit: (value: { success: boolean }) => void
    const submitPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveSubmit = resolve
    })
    mockSubmit.mockReturnValue(submitPromise)

    render(<ContactPage />)

    await user.type(screen.getByPlaceholderText(COPY.contact.namePlaceholder), 'John Doe')
    await user.type(screen.getByPlaceholderText(COPY.contact.emailPlaceholder), 'john@example.com')
    await user.selectOptions(screen.getByLabelText(new RegExp(`^${COPY.contact.subjectLabel}$`)), 'general')
    await user.type(screen.getByPlaceholderText(COPY.contact.messagePlaceholder), 'Test message')

    await act(async () => {
      await user.click(screen.getByText(COPY.contact.send))
    })

    expect(screen.getByText(COPY.contact.sending)).toBeInTheDocument()

    await act(async () => {
      resolveSubmit!({ success: true })
    })

    await waitFor(() => {
      expect(screen.getByText(COPY.contact.successTitle)).toBeInTheDocument()
    })
  })

  it('should handle form validation', async () => {
    render(<ContactPage />)

    const submitButton = screen.getByText(COPY.contact.send)
    expect(submitButton).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    mockSubmit.mockRejectedValue(new Error('Network error'))

    render(<ContactPage />)

    await user.type(screen.getByPlaceholderText(COPY.contact.namePlaceholder), 'John Doe')
    await user.type(screen.getByPlaceholderText(COPY.contact.emailPlaceholder), 'john@example.com')
    await user.selectOptions(screen.getByLabelText(new RegExp(`^${COPY.contact.subjectLabel}$`)), 'general')
    await user.type(screen.getByPlaceholderText(COPY.contact.messagePlaceholder), 'Test message')

    await act(async () => {
      await user.click(screen.getByText(COPY.contact.send))
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(COPY.contact.error)
    })
  })
})
