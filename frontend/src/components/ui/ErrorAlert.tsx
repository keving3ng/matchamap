import React from 'react'
import { AlertTriangle, X } from '@/components/icons'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 ${className}`}>
      <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 transition-colors"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}