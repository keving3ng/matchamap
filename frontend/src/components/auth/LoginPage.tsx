import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import { useSessionExpiry } from '../../hooks/useSessionExpiry'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { COPY } from '../../constants/copy'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const { clearIntendedDestination } = useSessionExpiry()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Get the redirect path from location state or query parameter
  const searchParams = new URLSearchParams(location.search)
  const redirectParam = searchParams.get('redirect')
  const from = redirectParam || (location.state as { from?: string })?.from

  useEffect(() => {
    // If already authenticated, redirect appropriately
    if (isAuthenticated && user) {
      // Clear any stored intended destination
      clearIntendedDestination()
      
      // Admins go to admin panel, regular users go to their profile
      const destination = from || (user.role === 'admin' ? '/admin' : `/profile/${user.username}`)
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, user, navigate, from, clearIntendedDestination])

  const handleSuccess = () => {
    // Clear any stored intended destination
    clearIntendedDestination()
    
    // After successful login/register, redirect based on role
    if (user) {
      const destination = from || (user.role === 'admin' ? '/admin' : `/profile/${user.username}`)
      navigate(destination, { replace: true })
    }
  }

  const isAdminRoute = from?.startsWith('/admin')

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-matcha-500 to-matcha-600 rounded-full flex items-center justify-center text-2xl shadow-md">
              🍵
            </div>
            <h1 className="text-3xl font-bold text-matcha-600 font-caveat">{COPY.header.title}</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isAdminRoute ? COPY.auth.adminAccess : mode === 'login' ? COPY.auth.welcomeBack : COPY.auth.joinCommunity}
          </h2>
          <p className="text-sm text-gray-600">
            {isAdminRoute
              ? COPY.auth.signInForAdmin
              : mode === 'login'
                ? COPY.auth.signInToSave
                : COPY.auth.createAccountToTrack
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={!isAdminRoute ? () => setMode('register') : undefined}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>

        {/* Footer */}
        {isAdminRoute && (
          <div className="text-center text-xs text-gray-500">
            <p>{COPY.auth.adminAccessRestricted}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
