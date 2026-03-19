# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `MapView.tsx`, `DetailView.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useGeolocation.ts`, `useLazyData.ts`)
- Utilities: camelCase (e.g., `distance.ts`, `validation.ts`)
- Stores: camelCase ending with `Store` (e.g., `cafeStore.ts`, `locationStore.ts`)
- Tests: Same as source file + `.test.ts/tsx` suffix (e.g., `cafeStore.test.ts`)
- Config files: camelCase (e.g., `features.yaml`, `cafeFields.ts`)

**Functions:**
- Arrow functions for all components and utilities
- PascalCase for React components (e.g., `const MapView = () => {}`)
- camelCase for regular functions (e.g., `calculateDistance()`, `formatHours()`)
- Prefix internal/private functions with underscore (e.g., `_recalculateCafes()`)

**Variables:**
- camelCase for all variable declarations (const, let)
- UPPER_CASE for constants (rarely used - prefer const instead)
- Prefix unused parameters with underscore to satisfy linter (e.g., `(_options: Options) => {}`)

**Types/Interfaces:**
- PascalCase for all type/interface names (e.g., `CafeWithDistance`, `BaseButtonProps`, `DetailViewProps`)
- Suffix component prop interfaces with `Props` (e.g., `MapViewProps`, `ButtonProps`)
- Suffix store interfaces with `Store` (e.g., `CafeStore`, `LocationStore`)
- Event types: `XyzError`, `XyzResponse` pattern (e.g., `GeolocationPositionError`)
- Generic/abstract interfaces: Use `I` prefix for collections only (e.g., `interface Coordinates`, `interface DistanceResult`)

## Code Style

**Formatting:**
- ESLint with TypeScript preset enforces style
- Custom config: `frontend/eslint.config.js`
- Auto-formatting via Tailwind CSS Vite integration (no separate Prettier needed)
- Semicolons: Always required (enforced by parser)
- Tabs: 2 spaces (Tailwind CSS standard)

**Linting:**
- Tool: ESLint 9 with flat config
- Plugin: `typescript-eslint`, `react`, `react-hooks`, `react-refresh`
- Rules enforce: no unused variables, const preference, no var, arrow functions only
- Test files relaxed: Allow unused vars, allow `any` types in tests
- Max warnings in CI: 200 (loose, for large refactors)

**Key Rules:**
```javascript
// eslint.config.js key settings
'@typescript-eslint/no-unused-vars': ['error', {
  argsIgnorePattern: '^_',      // Ignore underscore-prefixed params
  varsIgnorePattern: '^_',      // Ignore underscore-prefixed vars
}],
'@typescript-eslint/no-explicit-any': 'warn',  // Warn, not error
'react/function-component-definition': ['error', {
  namedComponents: 'arrow-function',   // Must use arrow functions
  unnamedComponents: 'arrow-function',
}],
'react-hooks/rules-of-hooks': 'error',        // Strict
'react-hooks/exhaustive-deps': 'warn',        // Warn, not error
'prefer-const': 'error',                      // Always use const
'no-var': 'error',                            // Never use var
```

## Import Organization

**Order:**
1. React and React DOM imports
2. Third-party libraries (zustand, react-router, leaflet)
3. App-specific utilities and types (`@/` alias)
4. Relative imports (for test files, mocks)

**Path Aliases:**
- `@/*` → `frontend/src/*` (baseUrl + paths in tsconfig.json)
- All imports use the `@/` alias, never relative paths like `../../../utils`

**Example:**
```typescript
import React, { useState, useEffect } from 'react'
import { create } from 'zustand'
import { useNavigate } from 'react-router'
import { MapPin, Navigation } from '@/components/icons'
import { api } from '@/utils/api'
import { COPY } from '@/constants/copy'
import type { DetailViewProps } from '@/types'
```

## Error Handling

**Patterns:**
- Try-catch used in event handlers and async API calls
- Errors logged to console.error() for debugging
- User-facing errors displayed via dialogs or UI components (ErrorAlert, AlertDialog)
- API errors (401/403) handled centrally in `fetchAPI()` - clears auth and shows session expired dialog
- Silent failures for non-critical operations (e.g., analytics tracking catches and ignores errors)

**Example:**
```typescript
// In component event handlers
const handleSubmit = async () => {
  try {
    await api.cafes.update(id, data)
    setSuccess(true)
  } catch (error) {
    console.error('Failed to update cafe:', error)
    // Show user-facing error dialog
  }
}

// In API wrapper - centralized 401/403 handling
if (response.status === 401 || response.status === 403) {
  useAuthStore.getState().clearAuth()
  useSessionExpiry.getState().showSessionExpiredDialog(currentPath)
  throw new Error('Authentication required')
}
```

## Logging

**Framework:** Console API (no external logging library)

**Patterns:**
- `console.error()` for errors and exceptions
- `console.log()` for debugging (stripped in production via terser config)
- No `console.warn()` used - use eslint warnings instead
- Silent failures for analytics/tracking (catch and ignore errors)

**Production:**
- Terser minifier removes all console.log statements (drop_console: true in vite.config.js)
- console.error remains for production debugging via browser DevTools

## Comments

**When to Comment:**
- JSDoc for exported functions, hooks, and utilities
- Complex algorithms or non-obvious logic
- Configuration options that are extensible
- Deprecated patterns or TODOs

**JSDoc/TSDoc:**
- Used for public APIs: hooks, utilities, exported functions
- Format: `/** description @param name type - desc @returns type description */`
- Optional for simple functions (<5 lines, obvious purpose)

**Example:**
```typescript
/**
 * Calculate distances from user location to all cafes
 * Converts between kilometers and miles, calculates walking time
 *
 * @param userLocation - User's geolocation coordinates
 * @param cafes - Array of cafes to calculate distance for
 * @returns Array of cafes with distance info attached
 */
export const calculateCafeDistances = (
  userLocation: Coordinates,
  cafes: Cafe[]
): CafeWithDistance[] => {
  // Implementation...
}
```

## Function Design

**Size:**
- Components: Limit to ~300 lines (extract subcomponents beyond this)
- Utilities: Limit to ~50 lines (single responsibility)
- Hooks: Limit to ~80 lines (multiple concerns acceptable for hooks, but use extract-to-utility for reusable logic)

**Parameters:**
- Max 3-4 parameters: Use object destructuring for options
- Callbacks/handlers: Named `onXyz` pattern (e.g., `onPinClick`, `onViewDetails`)
- Unused parameters: Prefix with underscore (e.g., `(_event: React.MouseEvent) => {}`)

**Return Values:**
- Components return `React.ReactNode` or `React.FC<Props>`
- Hooks return object with named properties, never arrays (better for destructuring)
- Async functions return Promise explicitly typed (e.g., `Promise<CafeStats[]>`)

**Example:**
```typescript
interface UseGeolocationReturn {
  coordinates: Coordinates | null
  error: GeolocationPositionError | null
  loading: boolean
  requestLocation: () => void
  clearLocation: () => void
}

export const useGeolocation = (): UseGeolocationReturn => {
  // Implementation...
  return { coordinates, error, loading, requestLocation, clearLocation }
}
```

## Module Design

**Exports:**
- Named exports only (no default exports, enforced by eslint-plugin-react-refresh)
- Single component/hook per file, matches filename

**Barrel Files:**
- Used in `frontend/src/components/ui/index.ts` to export all shared UI components
- Enables: `import { PrimaryButton, ScoreBadge } from '@/components/ui'`
- Not used for other directories (components, hooks, utils import individually)

**Store Pattern:**
- Each store is a single Zustand store with focused state
- Stores subscribe to each other for derived state (e.g., `cafeStore` subscribes to `dataStore` and `locationStore`)
- No circular dependencies (parent → child subscription direction)

**Example:**
```typescript
// ✅ Named exports only
export const useCafeStore = create<CafeStore>(...)
export const cafeAPI = { ... }

// ❌ Never default export
export default useCafeStore  // DON'T DO THIS
```

## Copy/Strings

**Central Location:** `frontend/src/constants/copy.ts`

**Rules:**
- ALL user-facing strings must go in COPY constant
- Never hardcoded strings in components
- Exceptions: Dynamic data from API, console logs, test data

**Organization:**
- Grouped by feature/component (e.g., `COPY.map.*`, `COPY.auth.*`, `COPY.detail.*`)
- Functions for parameterized strings: `(value: number) => \`text ${value}\``
- Use `as const` for type safety with full autocomplete

**Example:**
```typescript
// ✅ CORRECT
import { COPY } from '@/constants/copy'

const Header = () => (
  <button>{COPY.map.getDirections}</button>
)

// ❌ INCORRECT - hardcoded string
const Header = () => (
  <button>Get Directions</button>
)

// ✅ Parameterized
export const COPY = {
  detail: {
    walkTime: (distance: string, time: string) => `${distance} away • ${time} walk`,
  },
}
```

## Shared Components

**Location:** `frontend/src/components/ui/`

**Rule:** Use shared components instead of creating custom styled elements

**Available Components:**
- Buttons: `PrimaryButton`, `SecondaryButton`, `TertiaryButton`, `IconButton`, `FilterButton`
- Badges: `ScoreBadge`, `DrinkScoreBadge`, `StatusBadge`, `FeatureBadge`, `NotificationBadge`
- Dialogs: `AlertDialog`, `ErrorAlert`, `InfoCard`
- Loading: `Skeleton`, `CafeCardSkeleton`, `ListSkeleton`, `DetailPageSkeleton`

**Design Tokens:** `frontend/src/styles/spacing.ts`
- `spacing.cardPadding` (16px)
- `spacing.sectionGap` (24px)
- `spacing.minTouchTarget` (44px)
- Touch targets: Always minimum 44×44px for mobile (enforced in button components)

## State Management

**Zustand Stores:**
- Location: `frontend/src/stores/locationStore.ts` - User geolocation
- Data: `frontend/src/stores/dataStore.ts` - Cafe, event, city data
- Cafe: `frontend/src/stores/cafeStore.ts` - Cafes with distance, selection
- Visited: `frontend/src/stores/visitedCafesStore.ts` - Passport stamps (persisted)
- Auth: `frontend/src/stores/authStore.ts` - User tokens (persisted)
- UI: `frontend/src/stores/uiStore.ts` - Modals, panels, bottom nav
- City: `frontend/src/stores/cityStore.ts` - Selected city
- Admin: `frontend/src/stores/adminStore.ts` - Admin panel state
- Lists: `frontend/src/stores/listsStore.ts` - User lists (persisted)

**Store Persistence:**
- Uses Zustand's `persist` middleware
- localStorage for: visited cafes, auth tokens, user lists
- sessionStorage for: some temporary UI state
- Retrieved via `useAuthStore.getState()` for server actions

## TypeScript

**Strict Mode:** Enabled globally in `tsconfig.json`
- `strict: true`
- `noUnusedLocals: true` (excluding test files)
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Type Practices:**
- Always define prop interfaces before component (e.g., `interface MapViewProps { ... }`)
- Use `React.FC<Props>` for component type annotation
- Re-export types from shared types where possible (e.g., `export type { Cafe } from '../../../shared/types'`)
- Enums for tight type safety (e.g., `enum City { TORONTO = 'toronto' }`)
- Avoid `any` type (linter warns), use generics or `unknown` instead

**Example:**
```typescript
interface DetailViewProps {
  cafe: CafeWithDistance
  visitedLocations: number[]
  onToggleVisited: (cafeId: number) => void
}

export const DetailView: React.FC<DetailViewProps> = ({
  cafe,
  visitedLocations,
  onToggleVisited
}) => {
  // Implementation
}
```

---

*Convention analysis: 2026-03-18*
