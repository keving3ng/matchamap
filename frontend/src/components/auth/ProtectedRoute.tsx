import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 * Optionally checks for admin role
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    // Redirect to login page with the current location as state
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    // If admin is required but user is not admin, redirect to home
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
