import React from 'react'

interface ContentContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * ContentContainer - Reusable layout wrapper for comfortable reading width
 *
 * Provides consistent max-width constraints for content-heavy pages while
 * maintaining mobile-first design. Centers content on larger screens.
 *
 * @param maxWidth - Maximum width constraint
 *   - 'sm': 640px - For narrow content (articles, forms)
 *   - 'md': 768px - For standard content (default, recommended for most pages)
 *   - 'lg': 1024px - For wider content (dashboards, lists)
 *   - 'xl': 1280px - For very wide content (tables, admin panels)
 */
export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className = '',
  maxWidth = 'md'
}) => {
  const maxWidthClass = {
    sm: 'max-w-screen-sm',  // 640px
    md: 'max-w-screen-md',  // 768px
    lg: 'max-w-screen-lg',  // 1024px
    xl: 'max-w-screen-xl'   // 1280px
  }[maxWidth]

  return (
    <div className={`w-full ${maxWidthClass} mx-auto ${className}`}>
      {children}
    </div>
  )
}

export default ContentContainer
