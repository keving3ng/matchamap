import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { sanitizeText } from '../../utils/sanitize'
import { COPY } from '../../constants/copy'
import { PrimaryButton, AlertDialog } from '../ui'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      // Sanitize inputs before sending to API
      await login({
        email: sanitizeText(email.trim()),
        password: password, // Don't sanitize password - send as-is
      })
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error is handled by the store
      console.error('Login failed:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-2">
          {COPY.auth.email}
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-matcha-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder={COPY.auth.emailPlaceholder}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
          {COPY.auth.password}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-matcha-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder={COPY.auth.passwordPlaceholder}
          disabled={isLoading}
        />
      </div>

      {error && (
        <AlertDialog
          variant="error"
          title={COPY.common.error}
          message={error}
        />
      )}

      <PrimaryButton
        type="submit"
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? COPY.auth.signingIn : COPY.auth.signIn}
      </PrimaryButton>

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm text-matcha-600 hover:text-matcha-700 font-medium"
          >
            {COPY.auth.dontHaveAccount}
          </button>
        </div>
      )}
    </form>
  )
}

export default LoginForm
