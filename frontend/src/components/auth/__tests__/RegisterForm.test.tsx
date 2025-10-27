import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '../../../stores/authStore'
import { mockFeatureFlag, resetStore, createMockUser } from '../../../test/helpers'
import { RegisterForm } from '../RegisterForm'
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

describe('RegisterForm', () => {
  const mockRegister = vi.fn()
  const mockClearError = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockOnSwitchToLogin = vi.fn()

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup auth store mock
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      clearError: mockClearError,
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
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
    it('should render register form with all fields', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(COPY.auth.username)).toBeInTheDocument()
      expect(screen.getByLabelText(COPY.auth.email)).toBeInTheDocument()
      expect(screen.getByLabelText(COPY.auth.password)).toBeInTheDocument()
      expect(screen.getByLabelText(COPY.auth.confirmPassword)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: COPY.auth.createAccount })).toBeInTheDocument()
    })

    it('should render username input with correct attributes', () => {
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      expect(usernameInput).toHaveAttribute('type', 'text')
      expect(usernameInput).toHaveAttribute('placeholder', COPY.auth.usernamePlaceholder)
      expect(usernameInput).toHaveAttribute('minLength', '3')
      expect(usernameInput).toHaveAttribute('maxLength', '20')
      expect(usernameInput).toBeRequired()
    })

    it('should render email input with correct attributes', () => {
      render(<RegisterForm />)

      const emailInput = screen.getByLabelText(COPY.auth.email)
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', COPY.auth.emailPlaceholder)
      expect(emailInput).toBeRequired()
    })

    it('should render password input with correct attributes', () => {
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(COPY.auth.password)
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('placeholder', COPY.auth.passwordPlaceholder)
      expect(passwordInput).toHaveAttribute('minLength', '8')
      expect(passwordInput).toBeRequired()
    })

    it('should render confirm password input with correct attributes', () => {
      render(<RegisterForm />)

      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('placeholder', COPY.auth.passwordPlaceholder)
      expect(confirmPasswordInput).toBeRequired()
    })

    it('should render helper texts', () => {
      render(<RegisterForm />)

      expect(screen.getByText(COPY.auth.usernameHint)).toBeInTheDocument()
      expect(screen.getByText(COPY.auth.passwordMinLength)).toBeInTheDocument()
    })

    it('should render switch to login button when callback provided', () => {
      render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)

      expect(screen.getByText(COPY.auth.alreadyHaveAccount)).toBeInTheDocument()
    })

    it('should not render switch to login button when callback not provided', () => {
      render(<RegisterForm />)

      expect(screen.queryByText(COPY.auth.alreadyHaveAccount)).not.toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('should show error for short password', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '1234567') // 7 chars, too short
      await user.type(confirmPasswordInput, '1234567')
      await user.click(submitButton)

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-message')).toHaveTextContent(COPY.auth.passwordTooShort)
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should show error for mismatched passwords', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password456') // Different password
      await user.click(submitButton)

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-message')).toHaveTextContent(COPY.auth.passwordsDoNotMatch)
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should show error for short username', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'ab') // 2 chars, too short
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-message')).toHaveTextContent(COPY.auth.usernameTooShort)
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should show error for invalid username characters', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'test user!') // Invalid characters (space and !)
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-message')).toHaveTextContent(COPY.auth.usernameInvalidChars)
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('should call register with valid data', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      expect(mockClearError).toHaveBeenCalledOnce()
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should call onSuccess callback after successful registration', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce(undefined)
      
      render(<RegisterForm onSuccess={mockOnSuccess} />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce()
      })
    })

    it('should not call onSuccess if not provided', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce(undefined)
      
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Should not throw error
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled()
      })
    })

    it('should handle registration failure gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockRegister.mockRejectedValueOnce(new Error('Email already exists'))
      
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Registration failed:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('should trim and sanitize inputs before sending', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      // Don't add spaces to username as it will fail validation before trimming
      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, '  test@example.com  ')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  describe('loading state', () => {
    it('should disable inputs and button when loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        clearError: mockClearError,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<RegisterForm />)

      expect(screen.getByLabelText(COPY.auth.username)).toBeDisabled()
      expect(screen.getByLabelText(COPY.auth.email)).toBeDisabled()
      expect(screen.getByLabelText(COPY.auth.password)).toBeDisabled()
      expect(screen.getByLabelText(COPY.auth.confirmPassword)).toBeDisabled()
      expect(screen.getByTestId('primary-button')).toBeDisabled()
    })

    it('should show loading text when loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        clearError: mockClearError,
        isLoading: true,
        error: null,
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<RegisterForm />)

      expect(screen.getByText(COPY.auth.creatingAccount)).toBeInTheDocument()
      expect(screen.queryByText(COPY.auth.createAccount)).not.toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('should show AlertDialog for validation errors', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      // Fill in data that will trigger password length validation
      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '1234567') // Too short (7 chars)
      await user.type(confirmPasswordInput, '1234567')
      await user.click(submitButton)

      // Should show validation error for short password
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-variant', 'error')
      expect(screen.getByTestId('alert-title')).toHaveTextContent(COPY.common.error)
    })

    it('should show AlertDialog for auth store errors', () => {
      const testError = 'Email already exists'
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        clearError: mockClearError,
        isLoading: false,
        error: testError,
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<RegisterForm />)

      const alertDialog = screen.getByTestId('alert-dialog')
      expect(alertDialog).toBeInTheDocument()
      expect(alertDialog).toHaveAttribute('data-variant', 'error')
      expect(screen.getByTestId('alert-title')).toHaveTextContent(COPY.common.error)
      expect(screen.getByTestId('alert-message')).toHaveTextContent(testError)
    })

    it('should prioritize validation errors over auth store errors', async () => {
      const user = userEvent.setup()
      const testError = 'Auth store error'
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        clearError: mockClearError,
        isLoading: false,
        error: testError,
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        clearAuth: vi.fn(),
        refreshAccessToken: vi.fn(),
        getCurrentUser: vi.fn(),
      })

      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123') // Mismatched passwords
      await user.click(submitButton)

      // Should show validation error, not auth store error
      expect(screen.getByTestId('alert-message')).toHaveTextContent(COPY.auth.passwordsDoNotMatch)
      expect(screen.getByTestId('alert-message')).not.toHaveTextContent(testError)
    })

    it('should not show AlertDialog when no errors', () => {
      render(<RegisterForm />)

      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument()
    })

    it('should clear validation error when valid input is submitted', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)
      const submitButton = screen.getByRole('button', { name: COPY.auth.createAccount })

      // First, trigger a validation error with mismatched passwords
      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.click(submitButton)

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()

      // Then, fix the password and submit with valid data
      await user.clear(confirmPasswordInput)
      await user.type(confirmPasswordInput, 'password123')
      await user.click(submitButton)

      // Validation error should be cleared
      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('switch to login', () => {
    it('should call onSwitchToLogin when button clicked', async () => {
      const user = userEvent.setup()
      render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)

      const switchButton = screen.getByText(COPY.auth.alreadyHaveAccount)
      await user.click(switchButton)

      expect(mockOnSwitchToLogin).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      const { container } = render(<RegisterForm />)

      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('should have proper label associations', () => {
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(COPY.auth.username)
      const emailInput = screen.getByLabelText(COPY.auth.email)
      const passwordInput = screen.getByLabelText(COPY.auth.password)
      const confirmPasswordInput = screen.getByLabelText(COPY.auth.confirmPassword)

      expect(usernameInput).toHaveAttribute('id', 'username')
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword')
    })

    it('should have proper button types', () => {
      render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)

      const submitButton = screen.getByTestId('primary-button')
      const switchButton = screen.getByText(COPY.auth.alreadyHaveAccount)

      expect(submitButton).toHaveAttribute('type', 'submit')
      expect(switchButton).toHaveAttribute('type', 'button')
    })
  })
})