# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Runner:**
- Vitest 4.0.6 (Vite-native test runner)
- Config: `frontend/vitest.config.ts`
- Environment: jsdom (browser DOM simulation)

**Assertion Library:**
- @testing-library/jest-dom (DOM matchers)
- @testing-library/react (React component testing)
- @testing-library/user-event (realistic user interactions)

**Run Commands:**
```bash
npm test                 # Run all tests once (report: default + junit)
npm test:watch         # Watch mode with live reload
npm test:ui            # Interactive UI dashboard
npm test:coverage      # With coverage report (branches: 75%, functions: 80%, lines: 80%)
npm test:ci            # CI mode (JUnit XML output to test-results/junit.xml)
```

## Test File Organization

**Location:**
- Co-located with source files in `__tests__` directories
- Pattern: `src/stores/__tests__/`, `src/components/__tests__/`, `src/hooks/__tests__/`

**Naming:**
- Store tests: `storeName.test.ts` (e.g., `cafeStore.test.ts`)
- Component tests: `ComponentName.test.tsx` (e.g., `MapView.test.tsx`)
- Hook tests: `hookName.test.ts` (e.g., `useGeolocation.test.ts`)
- Utility tests: `utilityName.test.ts` (e.g., `distance.test.ts`)

**Structure:**
```
frontend/src/
├── stores/__tests__/
│   ├── cafeStore.test.ts           # 500+ lines, comprehensive
│   ├── authStore.test.ts
│   └── dataStore.test.ts
├── components/__tests__/
│   ├── MapView.test.tsx            # 100-200 lines typical
│   ├── ListView.test.tsx
│   └── DetailView.test.tsx
├── hooks/__tests__/
│   ├── useGeolocation.test.ts      # 80-150 lines typical
│   └── useLazyData.test.ts
├── utils/__tests__/
│   ├── distance.test.ts
│   └── hoursFormatter.test.ts
└── test/
    ├── setup.ts                    # Global test setup (mocks, globals)
    ├── helpers.ts                  # Shared test utilities (factories, mocking)
    └── mocks/
        └── leaflet.ts              # Leaflet mock
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCafeStore } from '../cafeStore'

describe('cafeStore', () => {
  // ===== Setup & Teardown =====
  beforeEach(() => {
    // Reset stores before each test
    useCafeStore.setState({ cafesWithDistance: [], selectedCafe: null })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ===== Describe blocks by feature =====
  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCafeStore())
      expect(result.current.cafesWithDistance).toEqual([])
    })
  })

  describe('cafe recalculation', () => {
    it('should add distance info when user location is available', () => {
      // Test implementation
    })
  })

  describe('edge cases', () => {
    it('should handle null coordinates gracefully', () => {
      // Test implementation
    })
  })
})
```

**Patterns:**
- Use `describe()` blocks to organize related tests (4-8 tests per block)
- Flat test names, no nesting beyond one level of description
- Start test name with verb: "should", "must", "initializes", "handles"
- Each test tests ONE behavior
- Use `beforeEach()` to reset state (critical for store tests)
- Use `afterEach()` to clean up mocks and timers

## Mocking

**Framework:** Vitest's `vi` module (drop-in for Jest)

**Patterns:**

### Module Mocking
```typescript
// Mock entire modules
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({ ... })),
  marker: vi.fn(() => ({ ... })),
}))

// Mock sub-modules
vi.mock('../../utils/distance', () => ({
  calculateCafeDistances: vi.fn((userLocation, cafes) => {
    return cafes.map(cafe => ({
      ...cafe,
      distanceInfo: { kilometers: 1, ... }
    }))
  }),
}))
```

### Function Mocking
```typescript
// Spy on and mock methods
const recalculateSpy = vi.spyOn(result.current, '_recalculateCafes')

// Create mock functions
const handleClick = vi.fn()
const onViewDetails = vi.fn()

// Verify calls
expect(handleClick).toHaveBeenCalledWith(cafeId)
expect(handleClick).toHaveBeenCalledTimes(1)
```

### API Mocking
```typescript
// Setup global mocks in test setup
mockApi.get('/api/cafes', { cafes: [] })
mockApi.post('/api/auth/login', { user: mockUser })
mockApi.error('/api/cafes', 'Network error', 500)

// Use in tests
const response = await api.cafes.getAll()
expect(response.cafes).toEqual([])
```

**What to Mock:**
- External APIs (fetch, HTTP)
- Heavy dependencies (Leaflet map, Geolocation)
- Browser APIs (IntersectionObserver, ResizeObserver, matchMedia)
- File system operations
- Time-dependent behavior (use `vi.useFakeTimers()`)

**What NOT to Mock:**
- React components (test with actual React)
- Custom hooks (test with renderHook)
- Utility functions (test with actual functions)
- Store logic (test store mutations)
- Store subscriptions (test auto-recalculation)

## Fixtures and Factories

**Test Data:**
Located in `frontend/src/test/helpers.ts`

```typescript
// Create mock data for tests
createMockCafe({ name: 'Test Cafe', city: 'toronto' })
createMockCafes(5)  // Create 5 cafes with IDs 1-5
createMockUser({ username: 'testuser' })
createMockAdmin({ email: 'admin@example.com' })
createMockCoordinates(43.6532, -79.3832)
createMockCity({ city: 'toronto', cafe_count: 10 })

// Storage mocking for Zustand persist
mockStorage()  // Returns StateStorage interface
setupLocalStorage()  // Setup window.localStorage
setupSessionStorage()  // Setup window.sessionStorage

// Feature flag mocking
mockFeatureFlag('ENABLE_PASSPORT', true)
resetFeatureFlags()
```

**Location:**
- Defined in `frontend/src/test/helpers.ts`
- Imported with: `import { createMockCafe, mockFeatureFlag } from '@/test/helpers'`
- No duplicate test data - always use factories

**Example Store Test:**
```typescript
const mockCafes: Cafe[] = [
  {
    id: 1,
    name: 'Cafe One',
    slug: 'cafe-one',
    latitude: 43.6532,
    longitude: -79.3832,
    link: 'https://maps.google.com/?cid=1',
    address: '123 Queen St',
    city: 'toronto',
    displayScore: 8.5,
    quickNote: 'Great matcha!',
    // ... other properties
  },
]

const mockUserLocation = {
  latitude: 43.6532,
  longitude: -79.3832,
}
```

## Coverage

**Requirements:**
- Branches: 75% (paths through conditionals)
- Functions: 80% (all exported functions)
- Lines: 80% (code coverage)
- Statements: 80% (all statements)
- Enforced via thresholds in vitest.config.ts

**View Coverage:**
```bash
npm test:coverage          # Generates coverage report in coverage/
# Open coverage/index.html in browser for visual report
```

**Excluded from coverage:**
- node_modules/
- src/test/ (helpers, setup)
- **/*.d.ts (type definitions)
- **/*.config.* (config files)
- dist/ (build output)

## Test Types

### Unit Tests
**Scope:** Individual functions, hooks, and store logic
**Approach:** Test function in isolation with mocked dependencies
**Example:** `calculateCafeDistances()`, `formatHours()`, `useGeolocation()`

```typescript
describe('calculateCafeDistances', () => {
  it('should calculate distances correctly', () => {
    const result = calculateCafeDistances(userLocation, cafes)
    expect(result).toHaveLength(2)
    expect(result[0].distanceInfo.kilometers).toBe(1)
  })
})
```

### Integration Tests
**Scope:** Multiple components/functions working together
**Approach:** Test store subscriptions, component + hook interactions
**Example:** Store subscribes to other stores and recalculates

```typescript
describe('cafeStore subscriptions', () => {
  it('should automatically recalculate when data store changes', () => {
    act(() => {
      useDataStore.setState({ allCafes: mockCafes })
    })

    const { result } = renderHook(() => useCafeStore())
    expect(result.current.cafesWithDistance).toHaveLength(2)
  })
})
```

### Component Tests
**Scope:** Component rendering and user interactions
**Approach:** Use Testing Library for realistic user event simulation
**No E2E tests:** Only unit + integration tests are automated

```typescript
describe('MapView', () => {
  it('renders map container', () => {
    render(<MapView {...mockProps} />)
    const mapContainer = document.querySelector('[style*="min-height: 400px"]')
    expect(mapContainer).toBeInTheDocument()
  })
})
```

## Common Patterns

### Async Testing
```typescript
// For async functions (API calls, geolocation)
it('should fetch cafes on load', async () => {
  mockApi.get('/api/cafes', { cafes: mockCafes })

  const { result } = renderHook(() => useDataStore())

  await act(async () => {
    await result.current.fetchCafes()
  })

  expect(result.current.allCafes).toHaveLength(2)
})

// For Zustand persist writes
it('should persist visited cafes to localStorage', async () => {
  const { result } = renderHook(() => useVisitedCafesStore())

  act(() => {
    result.current.addVisited(1)
  })

  await waitForPersistence()  // Wait for localStorage write
  expect(localStorage.get('visited-cafes')).toEqual([1])
})
```

### Error Testing
```typescript
it('should handle geolocation errors', async () => {
  const mockError = createMockLocationError(1, 'Permission denied')

  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementationOnce(
    (_success, error) => error(mockError)
  )

  const { result } = renderHook(() => useGeolocation())

  act(() => {
    result.current.requestLocation()
  })

  expect(result.current.error).toEqual(mockError)
  expect(result.current.loading).toBe(false)
})
```

### Store State Management
```typescript
// Reset stores before tests
beforeEach(() => {
  useCafeStore.setState({
    cafesWithDistance: [],
    selectedCafe: null,
  })

  useDataStore.setState({
    allCafes: [],
    isLoading: false,
    error: null,
  })
})

// Trigger state changes with act()
act(() => {
  result.current.setSelectedCafe(mockCafe)
})

// Verify state updates
expect(result.current.selectedCafe).toEqual(mockCafe)
```

### Feature Flag Testing
```typescript
it('should show passport button when enabled', () => {
  mockFeatureFlag('ENABLE_PASSPORT', true)

  render(<PassportView />)
  expect(screen.getByText('Matcha Passport')).toBeInTheDocument()
})

it('should hide passport button when disabled', () => {
  mockFeatureFlag('ENABLE_PASSPORT', false)

  render(<PassportView />)
  expect(screen.queryByText('Matcha Passport')).not.toBeInTheDocument()
})
```

## Global Setup

**File:** `frontend/src/test/setup.ts`

**Includes:**
- IntersectionObserver mock
- ResizeObserver mock
- matchMedia mock
- scrollTo mock
- localStorage and sessionStorage setup (for Zustand persist)
- Feature flag mock setup (uses globalThis.__TEST_FEATURE_FLAGS__)
- beforeEach: Clear storages, reset feature flags, reset API mocks, clear mocks
- afterEach: Clear timers, restore mocks

**Run by Vitest automatically** via `setupFiles` in vitest.config.ts

## Snapshot Tests

**Not used** in this codebase. Use explicit expectations instead of snapshots.

**Why:**
- Snapshots hide implementation details
- Hard to review in PRs
- Brittle to UI changes
- Better to test specific UI props/content

## Pre-Commit Testing

**Required checks:**
```bash
npm test              # All tests must pass (100% passing)
npm run typecheck     # No TypeScript errors
npm run build         # Build must succeed
npm run lint          # No linting errors
```

## Test Data Best Practices

✅ **DO:**
- Use factory functions from `helpers.ts` for all test data
- Use `act()` wrapper for state changes and async operations
- Use `beforeEach()` to reset state before each test
- Mock Leaflet and other heavy dependencies
- Test single behavior per test
- Use meaningful variable names (mockUserLocation not loc)
- Group related tests in describe blocks
- Create comprehensive test suites for critical logic (stores, hooks)

❌ **DON'T:**
- Hardcode test data inline (use factories instead)
- Test multiple behaviors in one test
- Forget `act()` wrapper for state updates
- Use snapshot tests
- Mock things you don't need to mock (React, custom hooks)
- Create test files without matching source file name
- Use `waitFor()` without timeout (use `waitForPersistence()` for Zustand)
- Test implementation details instead of behavior

---

*Testing analysis: 2026-03-18*
