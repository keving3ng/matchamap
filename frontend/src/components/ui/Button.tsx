import React from 'react'
import { LucideIcon } from 'lucide-react'

interface BaseButtonProps {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

/**
 * PrimaryButton - Main action button with green gradient
 * Mobile-first design with proper touch targets (min 44px)
 */
export const PrimaryButton: React.FC<BaseButtonProps> = ({
  onClick,
  disabled = false,
  children,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-gradient-to-r from-green-600 to-green-500
        text-white
        py-3 px-6
        rounded-xl
        font-semibold
        shadow-md
        hover:from-green-700 hover:to-green-600
        active:scale-[0.98]
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        min-h-[44px]
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {Icon && iconPosition === 'left' && <Icon size={20} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon size={20} />}
    </button>
  )
}

/**
 * SecondaryButton - Secondary action button with border
 * Mobile-first design with proper touch targets (min 44px)
 */
export const SecondaryButton: React.FC<BaseButtonProps> = ({
  onClick,
  disabled = false,
  children,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-white
        border-2 border-green-300
        text-green-600
        py-3 px-6
        rounded-xl
        font-semibold
        hover:bg-green-50
        active:scale-[0.98]
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        min-h-[44px]
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {Icon && iconPosition === 'left' && <Icon size={20} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon size={20} />}
    </button>
  )
}

/**
 * TertiaryButton - Subtle action button (gray background)
 * Mobile-first design with proper touch targets (min 44px)
 */
export const TertiaryButton: React.FC<BaseButtonProps> = ({
  onClick,
  disabled = false,
  children,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-gray-100
        text-gray-700
        py-3 px-6
        rounded-xl
        font-semibold
        hover:bg-gray-200
        active:scale-[0.98]
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        min-h-[44px]
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {Icon && iconPosition === 'left' && <Icon size={20} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon size={20} />}
    </button>
  )
}

interface IconButtonProps {
  onClick?: () => void
  disabled?: boolean
  icon: LucideIcon
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  badge?: boolean
  loading?: boolean
  ariaLabel: string
}

/**
 * IconButton - Circular icon-only button
 * Mobile-first design with proper touch targets (44px x 44px)
 */
export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  disabled = false,
  icon: Icon,
  className = '',
  variant = 'ghost',
  badge = false,
  loading = false,
  ariaLabel
}) => {
  const variantStyles = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-green-100 text-green-700 hover:bg-green-200',
    ghost: 'bg-white/95 backdrop-blur-sm text-green-700 hover:bg-white shadow-lg'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        relative
        w-11 h-11
        rounded-full
        flex items-center justify-center
        active:scale-95
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${variantStyles[variant]}
        ${className}
      `}
    >
      <Icon size={20} className={loading ? 'animate-pulse' : ''} />
      {badge && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
      )}
    </button>
  )
}

interface FilterButtonProps {
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
  icon?: LucideIcon
  hasBadge?: boolean
  className?: string
}

/**
 * FilterButton - Pill-shaped filter/toggle button
 * Used for search, filter, and quick action buttons
 */
export const FilterButton: React.FC<FilterButtonProps> = ({
  onClick,
  active = false,
  children,
  icon: Icon,
  hasBadge = false,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative
        p-2 sm:px-3 sm:py-2
        rounded-full
        text-sm font-semibold
        whitespace-nowrap
        transition-all duration-200
        flex items-center justify-center sm:justify-start gap-1.5
        min-h-[44px] min-w-[44px]
        ${active
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
        }
        ${className}
      `}
    >
      {Icon && <Icon size={16} />}
      <span className="hidden sm:inline">{children}</span>
      {hasBadge && !active && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
      )}
    </button>
  )
}
