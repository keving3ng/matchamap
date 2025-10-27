import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  initialize: () => void
}

// Utility functions
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Default to light mode
      resolvedTheme: 'light', // Will be updated on initialization
      
      setTheme: (theme: Theme) => {
        const resolved = resolveTheme(theme)
        applyTheme(resolved)
        set({ theme, resolvedTheme: resolved })
      },
      
      toggleTheme: () => {
        const { theme } = get()
        // Cycle through: light -> dark -> system -> light
        if (theme === 'light') {
          get().setTheme('dark')
        } else if (theme === 'dark') {
          get().setTheme('system')
        } else {
          get().setTheme('light')
        }
      },
      
      initialize: () => {
        const { theme } = get()
        const resolved = resolveTheme(theme)
        applyTheme(resolved)
        set({ resolvedTheme: resolved })
        
        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e: MediaQueryListEvent) => {
            const { theme } = get()
            if (theme === 'system') {
              const newResolved = e.matches ? 'dark' : 'light'
              applyTheme(newResolved)
              set({ resolvedTheme: newResolved })
            }
          }
          
          mediaQuery.addEventListener('change', handleChange)
          
          // Cleanup function (not used in this context but good practice)
          return () => mediaQuery.removeEventListener('change', handleChange)
        }
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }), // Only persist the theme preference
    }
  )
)

// Hook for easy theme access
export const useTheme = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore()
  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme,
  }
}