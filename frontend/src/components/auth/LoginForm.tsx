import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login({ email, password })
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
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-matcha-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder="you@example.com"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-matcha-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-matcha-500 hover:bg-matcha-600 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

export default LoginForm
