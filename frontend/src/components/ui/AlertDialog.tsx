import React from 'react'
import { type LucideIcon, AlertCircle, CheckCircle, XCircle, Info } from '@/components/icons'

interface AlertDialogProps {
  title: string
  message: string | React.ReactNode
  icon?: LucideIcon
  variant?: 'success' | 'error' | 'warning' | 'info'
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * AlertDialog - Reusable dialog for alerts, confirmations, and messages
 * Mobile-first design with proper touch targets
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  title,
  message,
  icon: CustomIcon,
  variant = 'info',
  primaryAction,
  secondaryAction,
  className = ''
}) => {
  const variantConfig = {
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      border: 'border-green-200',
      icon: CheckCircle
    },
    error: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      border: 'border-red-200',
      icon: XCircle
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      border: 'border-yellow-200',
      icon: AlertCircle
    },
    info: {
      iconBg: 'bg-matcha-100',
      iconColor: 'text-matcha-600',
      border: 'border-matcha-200',
      icon: Info
    }
  }

  const config = variantConfig[variant]
  const Icon = CustomIcon || config.icon

  return (
    <div
      className={`
        absolute inset-x-4 top-4
        bg-white
        rounded-xl
        shadow-xs
        p-4
        z-[9999]
        border
        ${config.border}
        animate-slide-up
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            w-10 h-10
            rounded-full
            flex items-center justify-center
            flex-shrink-0
            ${config.iconBg}
          `}
        >
          <Icon size={20} className={config.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>

          {typeof message === 'string' ? (
            <p className="text-sm text-gray-600 mb-3">{message}</p>
          ) : (
            <div className="mb-3">{message}</div>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-2">
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="
                    px-4 py-2
                    bg-matcha-500 text-white
                    rounded-lg
                    text-sm font-medium
                    hover:bg-matcha-600
                    transition
                    focus:outline-hidden focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2
                    min-h-[44px]
                  "
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="
                    px-4 py-2
                    bg-gray-100 text-gray-700
                    rounded-lg
                    text-sm font-medium
                    hover:bg-gray-200
                    transition
                    focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                    min-h-[44px]
                  "
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface InfoCardProps {
  title?: string
  children: React.ReactNode
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'info'
  className?: string
}

/**
 * InfoCard - Static information card (non-dismissible)
 * Used for permanent UI elements like quick notes, tips
 */
export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  icon: Icon,
  variant = 'default',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div
      className={`
        rounded-xl
        p-3
        border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {title && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon size={16} className="text-gray-600" />}
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        </div>
      )}
      <div className="text-sm text-gray-700">
        {children}
      </div>
    </div>
  )
}
