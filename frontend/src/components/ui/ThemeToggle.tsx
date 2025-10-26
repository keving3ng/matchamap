import React from 'react'
import { Sun, Moon, Monitor } from '@/components/icons'
import { useTheme } from '@/stores/themeStore'
import { COPY } from '@/constants/copy'

interface ThemeToggleProps {
  variant?: 'button' | 'menu'
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button',
  className = '' 
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  
  const getThemeIcon = (themeType: 'light' | 'dark' | 'system') => {
    switch (themeType) {
      case 'light':
        return Sun
      case 'dark':
        return Moon
      case 'system':
        return Monitor
    }
  }

  const getThemeLabel = (themeType: 'light' | 'dark' | 'system') => {
    switch (themeType) {
      case 'light':
        return COPY.settings.themeLight
      case 'dark':
        return COPY.settings.themeDark
      case 'system':
        return COPY.settings.themeSystem
    }
  }
  
  if (variant === 'menu') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <Monitor size={20} className="text-gray-600 dark:text-dark-text-secondary" />
          <div>
            <p className="font-semibold text-gray-800 dark:text-dark-text-primary">
              {COPY.settings.theme}
            </p>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {COPY.settings.themeDescription}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {(['light', 'dark', 'system'] as const).map((themeOption) => {
            const Icon = getThemeIcon(themeOption)
            const isSelected = theme === themeOption
            
            return (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-matcha-100 dark:bg-dark-bg-tertiary text-matcha-700 dark:text-dark-matcha-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary'
                  }
                `}
              >
                <Icon size={18} />
                <span className="font-medium">{getThemeLabel(themeOption)}</span>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 bg-matcha-600 dark:bg-dark-matcha-600 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  
  // Button variant - cycle through themes
  const Icon = getThemeIcon(theme)
  
  return (
    <button
      onClick={() => {
        // Cycle through themes: light -> dark -> system -> light
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
      }}
      className={`
        relative w-12 h-6 rounded-full transition-all duration-300
        ${resolvedTheme === 'dark' 
          ? 'bg-matcha-600 dark:bg-dark-matcha-600' 
          : 'bg-gray-300 dark:bg-dark-border-secondary'
        }
        ${className}
      `}
      aria-label={`Current theme: ${getThemeLabel(theme)}`}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-dark-bg-elevated
          rounded-full transition-transform duration-300 flex items-center justify-center
          ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        <Icon size={12} className="text-gray-600 dark:text-dark-text-secondary" />
      </span>
    </button>
  )
}