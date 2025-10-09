import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { sanitizeText } from '../../utils/sanitize'
import { COPY } from '../../constants/copy'
import { PrimaryButton } from '../ui'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { register, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError(null)

    // Validation
    if (password.length < 8) {
      setValidationError(COPY.auth.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setValidationError(COPY.auth.passwordsDoNotMatch)
      return
    }

    if (username.length < 3) {
      setValidationError(COPY.auth.usernameTooShort)
      return
    }

    // Check for valid username characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setValidationError(COPY.auth.usernameInvalidChars)
      return
    }

    try {
      await register({
        email: sanitizeText(email.trim()),
        username: sanitizeText(username.trim()),
        password: password, // Don't sanitize password
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error is handled by the store
      console.error('Registration failed:', err)
    }
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          {COPY.auth.username}
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={20}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder={COPY.auth.usernamePlaceholder}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          {COPY.auth.usernameHint}
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          {COPY.auth.email}
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder={COPY.auth.emailPlaceholder}
          disabled={isLoading}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          {COPY.auth.password}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder={COPY.auth.passwordPlaceholder}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          {COPY.auth.passwordMinLength}
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          {COPY.auth.confirmPassword}
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder={COPY.auth.passwordPlaceholder}
          disabled={isLoading}
        />
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      {/* Submit Button */}
      <PrimaryButton
        type="submit"
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? COPY.auth.creatingAccount : COPY.auth.createAccount}
      </PrimaryButton>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-matcha-600 hover:text-matcha-700 font-medium"
          >
            {COPY.auth.alreadyHaveAccount}
          </button>
        </div>
      )}
    </form>
  )
}

export default RegisterForm
