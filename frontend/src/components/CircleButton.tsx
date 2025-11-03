import React from 'react'
import { LucideIcon } from '@/components/icons'

interface CircleButtonProps {
  onClick?: () => void
  icon?: LucideIcon
  children?: React.ReactNode
  className?: string
}

export const CircleButton: React.FC<CircleButtonProps> = ({
  onClick,
  icon: Icon,
  children,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        bg-white/95 backdrop-blur-xs
        w-12 h-12
        rounded-full
        shadow-lg shadow-black/10
        hover:bg-white hover:shadow-xl hover:shadow-black/15
        active:scale-95
        transition-all duration-200 ease-out
        flex items-center justify-center
        border border-white/50
        focus:outline-hidden focus:ring-2 focus:ring-matcha-500 focus:ring-offset-2
        ${className}
      `}
    >
      {Icon && <Icon size={20} className="text-matcha-600" />}
      {children && <span className="text-matcha-700 font-semibold text-lg">{children}</span>}
    </button>
  )
}