import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '../../../stores/authStore'
import { mockFeatureFlag, resetStore, createMockUser } from '../../../test/helpers'
import { LoginForm } from '../LoginForm'
import { COPY } from '../../../constants/copy'

// Mock the auth store
vi.mock('../../../stores/authStore')

// Mock sanitize utility
vi.mock('../../../utils/sanitize', () => ({
  sanitizeText: vi.fn((text: string) => text),
}))

// Mock AlertDialog component
vi.mock('../../ui', () => ({
  PrimaryButton: ({ children, onClick, disabled, type, fullWidth }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
      data-testid="primary-button"
      className={fullWidth ? 'w-full' : ''}
    >
      {children}
    </button>
  ),
  AlertDialog: ({ variant, title, message }: any) => (
    <div data-testid="alert-dialog" data-variant={variant}>
      <div data-testid="alert-title">{title}</div>
      <div data-testid="alert-message">{message}</div>
    </div>
  ),
}))

describe('LoginForm', () => {
  const mockLogin = vi.fn()
  const mockClearError = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockOnSwitchToRegister = vi.fn()

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup auth store mock
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      clearError: mockClearError,
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      register: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
      refreshAccessToken: vi.fn(),
      getCurrentUser: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render login form with all fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(COPY.auth.email)).toBeInTheDocument()
      expect(screen.getByLabelText(COPY.auth.password)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: COPY.auth.signIn })).toBeInTheDocument()
    })

    it('should render email input with correct attributes', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', COPY.auth.emailPlaceholder)
      expect(emailInput).toBeRequired()
    })

    it('should render password input with correct attributes', () => {
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(COPY.auth.password)
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('placeholder', COPY.auth.passwordPlaceholder)
      expect(passwordInput).toBeRequired()
    })

    it('should render switch to register button when callback provided', () => {
      render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)

      expect(screen.getByText(COPY.auth.dontHaveAccount)).toBeInTheDocument()
    })

    it('should not render switch to register button when callback not provided', () => {
      render(<LoginForm />)

      expect(screen.queryByText(COPY.auth.dontHaveAccount)).not.toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('should call login with sanitized email and password', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(mockClearError).toHaveBeenCalledOnce()
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should call onSuccess callback after successful login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce(undefined)
      
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce()
      })
    })

    it('should not call onSuccess if not provided', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce(undefined)
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Should not throw error
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })

    it('should handle login failure gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('should trim email before sending', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })

      await user.type(emailInput, '  test@example.com  ')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  describe('loading state', () => {
    it('should disable inputs and button when loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        clearError: mockClearError,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        register: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<LoginForm />)

      expect(screen.getByLabelText(COPY.auth.email)).toBeDisabled()
      expect(screen.getByLabelText(COPY.auth.password)).toBeDisabled()
      expect(screen.getByTestId('primary-button')).toBeDisabled()
    })

    it('should show loading text when loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        clearError: mockClearError,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        register: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<LoginForm />)

      expect(screen.getByText(COPY.auth.signingIn)).toBeInTheDocument()
      expect(screen.queryByText(COPY.auth.signIn)).not.toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('should show AlertDialog when error exists', () => {
      const testError = 'Invalid credentials'
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        clearError: mockClearError,
        isLoading: false,
        error: testError,
        user: null,
        isAuthenticated: false,
        register: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<LoginForm />)

      const alertDialog = screen.getByTestId('alert-dialog')
      expect(alertDialog).toBeInTheDocument()
      expect(alertDialog).toHaveAttribute('data-variant', 'error')
      expect(screen.getByTestId('alert-title')).toHaveTextContent(COPY.common.error)
      expect(screen.getByTestId('alert-message')).toHaveTextContent(testError)
    })

    it('should not show AlertDialog when no error', () => {
      render(<LoginForm />)

      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument()
    })
  })

  describe('switch to register', () => {
    it('should call onSwitchToRegister when button clicked', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)

      const switchButton = screen.getByText(COPY.auth.dontHaveAccount)
      await user.click(switchButton)

      expect(mockOnSwitchToRegister).toHaveBeenCalledOnce()
    })
  })

  describe('form validation', () => {
    it('should clear error when form is submitted', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(mockClearError).toHaveBeenCalledOnce()
    })

    it('should prevent form submission with empty fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: COPY.auth.signIn })
      await user.click(submitButton)

      // Form validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      render(<LoginForm />)

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })

    it('should have proper label associations', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('should have proper button types', () => {
      render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)

      const submitButton = screen.getByTestId('primary-button')
      const switchButton = screen.getByText(COPY.auth.dontHaveAccount)

      expect(submitButton).toHaveAttribute('type', 'submit')
      expect(switchButton).toHaveAttribute('type', 'button')
    })
  })
})