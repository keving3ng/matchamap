import React from 'react'

interface ReviewRatingInputProps {
  label?: string
  value: number | null
  onChange: (value: number | null) => void
  max?: number
  required?: boolean
  className?: string
}

export const ReviewRatingInput: React.FC<ReviewRatingInputProps> = ({
  label,
  value,
  onChange,
  max = 10,
  required = false,
  className = '',
}) => {
  const ratings = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex flex-wrap gap-2">
        {required && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`
              min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg border-2 font-medium text-sm
              transition-all duration-150 active:scale-[0.98]
              ${value === null 
                ? 'border-gray-300 bg-gray-100 text-gray-700' 
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }
            `}
          >
            -
          </button>
        )}
        
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`
              min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg border-2 font-medium text-sm
              transition-all duration-150 active:scale-[0.98]
              ${value === rating
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {rating}
          </button>
        ))}
      </div>
      
      {value !== null && (
        <div className="text-sm text-gray-600">
          {value}/{max}
        </div>
      )}
    </div>
  )
}