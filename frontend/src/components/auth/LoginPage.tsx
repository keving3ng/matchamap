import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { LoginForm } from './LoginForm'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  // Get the redirect path from location state, default to admin
  const from = (location.state as { from?: string })?.from || '/admin'

  useEffect(() => {
    // If already authenticated, redirect to intended destination
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleLoginSuccess = () => {
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-matcha-600 mb-2">MatchaMap</h1>
          <h2 className="text-xl font-semibold text-charcoal-800 mb-2">Admin Login</h2>
          <p className="text-sm text-charcoal-600">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-charcoal-600">
          <p>Access restricted to authorized users only</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
