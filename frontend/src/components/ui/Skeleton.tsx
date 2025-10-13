import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
}

/**
 * Skeleton - Loading placeholder component
 * Shows while content is loading for better perceived performance
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer'
}) => {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] bg-no-repeat',
    none: ''
  }

  const style: React.CSSProperties = {}
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`
        bg-gray-200
        ${variantStyles[variant]}
        ${animationStyles[animation]}
        ${className}
      `}
      style={style}
    />
  )
}

/**
 * CafeCardSkeleton - Loading state for cafe cards
 */
export const CafeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={24} className="mb-2" />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
        <Skeleton variant="circular" width={44} height={44} />
      </div>
    </div>
  )
}

/**
 * ListSkeleton - Loading state for list views
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <CafeCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * DetailPageSkeleton - Loading state for detail pages
 */
export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Hero skeleton */}
      <Skeleton variant="rectangular" height={192} className="w-full" animation="pulse" />

      <div className="px-4 -mt-6 relative z-10">
        {/* Main info card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-green-100 mb-4">
          <div className="flex justify-between mb-3">
            <div className="flex-1">
              <Skeleton variant="text" width="70%" height={28} className="mb-2" />
              <Skeleton variant="text" width="50%" height={20} />
            </div>
            <Skeleton variant="circular" width={56} height={56} />
          </div>
          <Skeleton variant="rectangular" height={44} className="w-full mt-4" />
        </div>

        {/* Drinks menu skeleton */}
        <div className="bg-white rounded-xl shadow p-4 border border-green-100 space-y-3">
          <Skeleton variant="text" width="40%" height={20} className="mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton variant="text" width="60%" height={18} />
              <Skeleton variant="text" width="20%" height={18} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
