import type { Cafe } from '../types'

export interface MarkerState {
  isSelected: boolean
  isVisited: boolean
}

export const createMatchaMarker = (cafe: Cafe, state: MarkerState = { isSelected: false, isVisited: false }): string => {
  const { isSelected, isVisited } = state

  // Determine marker colors based on state
  const getMarkerColors = () => {
    if (isSelected) {
      return {
        bg: 'bg-matcha-600',
        border: 'border-matcha-300',
        shadow: 'shadow-matcha-500/30',
        pulse: 'animate-pulse'
      }
    }
    if (isVisited) {
      return {
        bg: 'bg-matcha-400',
        border: 'border-matcha-200',
        shadow: 'shadow-matcha-400/20',
        pulse: ''
      }
    }
    return {
      bg: 'bg-matcha-500',
      border: 'border-white',
      shadow: 'shadow-lg',
      pulse: ''
    }
  }

  const colors = getMarkerColors()

  // Score badge styling based on score
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 9.0) return 'bg-gradient-to-r from-matcha-600 to-matcha-700 text-white'
    if (score >= 8.0) return 'bg-gradient-to-r from-matcha-500 to-matcha-600 text-white'
    if (score >= 7.0) return 'bg-gradient-to-r from-matcha-400 to-matcha-500 text-white'
    return 'bg-gradient-to-r from-matcha-300 to-matcha-400 text-matcha-800'
  }

  const scoreBadgeStyle = getScoreBadgeStyle(cafe.score)

  return `
    <div class="relative flex items-center justify-center">
      <!-- Main marker pin -->
      <div class="relative">
        <!-- Pin shadow -->
        <div class="absolute inset-0 ${colors.bg} opacity-30 rounded-full blur-sm transform translate-y-1"></div>

        <!-- Main pin body -->
        <div class="${colors.bg} ${colors.border} border-2 ${colors.shadow} ${colors.pulse}
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-200 hover:scale-110 cursor-pointer">
          <!-- Matcha leaf icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-white">
            <path d="M12 2C9.76 2 7.82 3.69 7.82 6.5c0 2.81 2.09 5.17 4.18 5.17s4.18-2.36 4.18-5.17C16.18 3.69 14.24 2 12 2z"/>
            <path d="M12 13.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z"/>
          </svg>
        </div>

        <!-- Pin point -->
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 ${colors.bg} rotate-45"></div>
      </div>

      <!-- Score badge -->
      <div class="absolute -top-3 -right-2 ${scoreBadgeStyle}
                  px-2 py-0.5 rounded-full text-xs font-bold shadow-md
                  border border-white/20 min-w-[2rem] text-center
                  transition-all duration-200">
        ${cafe.score}
      </div>

      <!-- Visited checkmark -->
      ${isVisited ? `
        <div class="absolute -bottom-2 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
          ✓
        </div>
      ` : ''}

      <!-- Selection ring -->
      ${isSelected ? `
        <div class="absolute inset-0 border-2 border-matcha-300 rounded-full animate-ping opacity-75"></div>
        <div class="absolute inset-0 border-2 border-matcha-400 rounded-full"></div>
      ` : ''}
    </div>
  `
}

export const createUserLocationMarker = (): string => {
  return `
    <div class="relative flex items-center justify-center">
      <!-- Outer pulse ring -->
      <div class="absolute w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
      <div class="absolute w-6 h-6 bg-blue-500 rounded-full opacity-50 animate-ping" style="animation-delay: 75ms;"></div>

      <!-- Main dot -->
      <div class="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg">
        <div class="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  `
}