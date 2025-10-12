# Test Utilities & Testing Guide

## Overview

This directory contains reusable test utilities and global test configuration for the MatchaMap frontend test suite.

## Test Utilities (`helpers.ts`)

### Feature Flag Mocking

Mock feature flags for testing:

```typescript
import { mockFeatureFlag, resetFeatureFlags } from '@/test/helpers'

// In your test
beforeEach(() => {
  mockFeatureFlag('ENABLE_USER_ACCOUNTS', true)
  mockFeatureFlag('ENABLE_PASSPORT', false)
})

afterEach(() => {
  resetFeatureFlags() // Clean up
})
```

### Storage Mocking

The global test setup (`setup.ts`) automatically provides Zustand-compatible localStorage and sessionStorage mocks:

```typescript
import { waitForPersistence } from '@/test/helpers'

// Storage is already mocked globally
beforeEach(() => {
  localStorage.clear() // Reset between tests
})

// Wait for Zustand persistence after state changes
it('should persist data', async () => {
  act(() => {
    store.setState({ value: 'test' })
  })

  await waitForPersistence() // Wait for persist middleware

  const stored = localStorage.getItem('store-key')
  expect(stored).toBeTruthy()
})
```

### API Mocking

Use the `api` import with `vi.mocked()` for type-safe API mocking:

```typescript
import { api } from '@/utils/api'
import { vi } from 'vitest'

// Mock the API module
vi.mock('@/utils/api', () => ({
  api: {
    cafes: {
      getAll: vi.fn(),
    },
  },
}))

// In your test
it('should fetch cafes', async () => {
  vi.mocked(api.cafes.getAll).mockResolvedValue({ cafes: [] })

  // ... test code

  expect(api.cafes.getAll).toHaveBeenCalled()
})
```

### Data Factories

Create test fixtures easily:

```typescript
import {
  createMockUser,
  createMockCafe,
  createMockCafes,
  createMockCoordinates
} from '@/test/helpers'

// Create a single user
const user = createMockUser({ username: 'testuser', email: 'test@example.com' })

// Create a single cafe
const cafe = createMockCafe({ name: 'Test Cafe', city: 'toronto' })

// Create multiple cafes
const cafes = createMockCafes(5) // Creates cafes with IDs 1-5

// Create mock coordinates
const coords = createMockCoordinates(43.6532, -79.3832)
```

## Common Patterns

### Testing Zustand Stores

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCafeStore } from '@/stores/cafeStore'
import { waitForPersistence } from '@/test/helpers'

describe('cafeStore', () => {
  beforeEach(() => {
    // Reset store state
    useCafeStore.setState({ cafes: [], loading: false })
    localStorage.clear()
  })

  it('should persist data', async () => {
    const { result } = renderHook(() => useCafeStore())

    act(() => {
      result.current.addCafe(mockCafe)
    })

    await waitForPersistence()

    const stored = localStorage.getItem('cafe-store')
    expect(stored).toBeTruthy()
  })
})
```

### Testing Components with Feature Flags

```typescript
import { render, screen } from '@testing-library/react'
import { mockFeatureFlag } from '@/test/helpers'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should show feature when enabled', () => {
    mockFeatureFlag('ENABLE_MY_FEATURE', true)

    render(<MyComponent />)

    expect(screen.getByText('My Feature')).toBeInTheDocument()
  })

  it('should hide feature when disabled', () => {
    mockFeatureFlag('ENABLE_MY_FEATURE', false)

    render(<MyComponent />)

    expect(screen.queryByText('My Feature')).not.toBeInTheDocument()
  })
})
```

### Testing with Authentication

```typescript
import { renderHook } from '@testing-library/react'
import { useAuthStore } from '@/stores/authStore'
import { createMockUser } from '@/test/helpers'

describe('Protected Feature', () => {
  it('should work when authenticated', () => {
    const mockUser = createMockUser({ role: 'admin' })

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    // ... test authenticated behavior
  })
})
```

## Global Test Configuration

### `setup.ts`

Automatically configured for all tests:

- ✅ Browser API mocks (IntersectionObserver, ResizeObserver, etc.)
- ✅ Storage mocks (localStorage, sessionStorage)
- ✅ Feature flag system
- ✅ Automatic cleanup between tests

### `vitest.config.ts`

- Configured for React/JSX
- YAML file support
- Coverage reporting
- jsdom environment

## Troubleshooting

### "localStorage is not defined"

The global setup already mocks localStorage. Make sure your test imports from the test directory structure correctly.

### "Cannot read property of undefined" on stores

Make sure to reset store state in `beforeEach`:

```typescript
beforeEach(() => {
  useMyStore.setState({ /* initial state */ })
  localStorage.clear()
})
```

### Zustand persistence not working

Use `waitForPersistence()` after state changes to ensure the persist middleware completes:

```typescript
await waitForPersistence() // After setState
```

### Feature flags not applying

Make sure to call `mockFeatureFlag()` BEFORE rendering components:

```typescript
mockFeatureFlag('FLAG_NAME', true)
render(<Component />) // Flag is now mocked
```

## Best Practices

1. **Always clean up**: Use `beforeEach` to reset state and clear storage
2. **Wait for async**: Use `waitForPersistence()` when testing Zustand stores
3. **Use factories**: Leverage `createMockUser()`, `createMockCafe()`, etc.
4. **Type safety**: Use `vi.mocked()` for type-safe mock assertions
5. **Isolation**: Each test should be independent and not rely on others

## Contributing

When adding new test utilities:

1. Add them to `helpers.ts`
2. Export them from the module
3. Document usage with JSDoc
4. Add examples to this README
5. Keep utilities focused and reusable

## Examples

See individual test files for real-world examples:

- `stores/__tests__/visitedCafesStore.test.ts` - Store testing with persistence
- `hooks/__tests__/useFeatureToggle.test.ts` - Feature flag testing
- `components/__tests__/ComingSoon.test.tsx` - Component + API mocking
