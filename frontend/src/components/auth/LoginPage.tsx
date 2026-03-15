import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import { useSessionExpiry } from '../../hooks/useSessionExpiry'
import { LoginForm } from './LoginForm'
import { COPY } from '../../constants/copy'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const { clearIntendedDestination } = useSessionExpiry()

  // Get the redirect path from location state or query parameter
  const searchParams = new URLSearchParams(location.search)
  const redirectParam = searchParams.get('redirect')
  const from = redirectParam || (location.state as { from?: string })?.from

  useEffect(() => {
    // If already authenticated, redirect to admin (all logins are admin in simplified product)
    if (isAuthenticated && user) {
      clearIntendedDestination()
      const destination = from || '/admin'
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, user, navigate, from, clearIntendedDestination])

  const handleSuccess = () => {
    clearIntendedDestination()
    navigate(from || '/admin', { replace: true })
  }

  const isAdminRoute = from?.startsWith('/admin')

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-matcha-500 to-matcha-600 rounded-full flex items-center justify-center text-2xl shadow-xs">
              🍵
            </div>
            <h1 className="text-3xl font-bold text-matcha-600 font-caveat">{COPY.header.title}</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isAdminRoute ? COPY.auth.adminAccess : COPY.auth.welcomeBack}
          </h2>
          <p className="text-sm text-gray-600">
            {isAdminRoute ? COPY.auth.signInForAdmin : COPY.auth.signInToSave}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xs p-8">
          <LoginForm onSuccess={handleSuccess} onSwitchToRegister={undefined} />
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
