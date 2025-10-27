/**
 * Spacing Design Tokens
 *
 * Centralized spacing values for consistent UI
 * Based on 4px base unit (Tailwind default)
 */

export const spacing = {
  // Basic spacing scale (follows Tailwind)
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px

  // Semantic spacing (use these when possible)
  cardPadding: '1rem',        // 16px - Standard card padding
  cardPaddingLg: '1.25rem',   // 20px - Large card padding
  sectionGap: '1.5rem',       // 24px - Gap between sections
  listGap: '0.75rem',         // 12px - Gap between list items
  inlineGap: '0.5rem',        // 8px - Gap for inline elements
  iconGap: '0.5rem',          // 8px - Gap next to icons

  // Mobile-specific
  touchPadding: '0.75rem',    // 12px - Min padding for touch targets
  minTouchTarget: '44px',     // WCAG minimum touch target

  // Tooltip-specific
  tooltipPadding: '0.75rem',  // 12px - Vertical padding (py-3)
  tooltipPaddingX: '1rem',    // 16px - Horizontal padding (px-4)
  tooltipOffset: '0.25rem',   // 4px - Distance from trigger element
  tooltipMaxWidth: '30rem',   // Maximum width for large tooltips (480px)
  tooltipMinWidth: '17.5rem', // Minimum width for content (280px)
  tooltipArrowSize: '4px',    // Border width for tooltip arrows
  tooltipPositionThreshold: '120px', // Space needed above for upward positioning
  tooltipTriggerSize: '20px', // Size for small tooltip trigger buttons
} as const

/**
 * Border Radius Design Tokens
 */
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  base: '0.5rem',   // 8px - Default
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px - Cards
  xl: '1.5rem',     // 24px - Large cards
  '2xl': '2rem',    // 32px - Hero sections
  full: '9999px',   // Circular/pill buttons
} as const

/**
 * Shadow Design Tokens
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const

/**
 * Z-Index Design Tokens
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 100,
  fixed: 1000,
  modalBackdrop: 9998,
  modal: 9999,
  adminBanner: 10000,
} as const
