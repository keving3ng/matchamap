import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertDialog } from './ui/AlertDialog'
import { COPY } from '../constants/copy'
import { useSessionExpiry } from '../hooks/useSessionExpiry'

/**
 * SessionExpiredDialog - Shows when authentication token expires
 * Provides option to navigate to login page with redirect preservation
 */
export const SessionExpiredDialog: React.FC = () => {
  const navigate = useNavigate()
  const { showDialog, hideSessionExpiredDialog, getIntendedDestination, clearIntendedDestination } = useSessionExpiry()

  const handleSignInAgain = () => {
    const redirectPath = getIntendedDestination()
    hideSessionExpiredDialog()
    
    // Navigate to login with redirect parameter
    const loginPath = redirectPath 
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : '/login'
    
    navigate(loginPath)
  }

  const handleDismiss = () => {
    hideSessionExpiredDialog()
    clearIntendedDestination()
  }

  if (!showDialog) {
    return null
  }

  return (
    <AlertDialog
      variant="warning"
      title={COPY.auth.sessionExpired.title}
      message={COPY.auth.sessionExpired.message}
      primaryAction={{
        label: COPY.auth.sessionExpired.signInAgain,
        onClick: handleSignInAgain,
      }}
      secondaryAction={{
        label: COPY.auth.sessionExpired.dismiss,
        onClick: handleDismiss,
      }}
    />
  )
}