# Testing Guide

**Status**: 100% tests passing ✅

This guide documents the testing infrastructure, patterns, and best practices for the MatchaMap frontend test suite.

> **Note**: We strive for 100% test pass rate at all times. Test counts are not tracked in documentation as they change by design as we continuously add test coverage.

---

## Table of Contents

1. [Test Infrastructure](#test-infrastructure)
2. [Writing Tests](#writing-tests)
3. [Common Patterns](#common-patterns)
4. [Troubleshooting](#troubleshooting)
5. [Running Tests](#running-tests)

---

## Test Infrastructure

### Global Setup (`src/test/setup.ts`)

All tests use a centralized setup file that provides:

-   **Global Mocks**: localStorage, sessionStorage, IntersectionObserver
-   **Feature Flag Mocking**: `mockFeatureFlag()` utility
-   **Zustand Persistence Helpers**: `waitForPersistence()` for async store tests
-   **Testing Library Extensions**: Custom matchers and utilities

**Key exports from setup.ts:**

```typescript
// Test helpers
export { mockFeatureFlag } from "./helpers";
export { waitForPersistence } from "./helpers";

// Global mocks are automatically configured
// No need to mock localStorage/sessionStorage in individual tests
```

### Test Utilities (`src/test/helpers.ts`)

**Available utilities:**

```typescript
// Feature flag mocking
mockFeatureFlag(featureName: string, value: boolean)

// Storage persistence
waitForPersistence(ms?: number): Promise<void>

// Mock generators (for complex test data)
// Add more as needed
```

### Vitest Configuration (`vitest.config.ts`)

**Key features:**

-   YAML file handling via custom plugin
-   CSS module mocking
-   Path aliases (`@/` → `src/`)
-   Global setup file auto-loaded
-   Coverage reporting configured

---

## Writing Tests

### Store Tests (Zustand)

**✅ CORRECT Pattern:**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyStore } from "../myStore";
import { waitForPersistence } from "../../test/helpers";

describe("myStore", () => {
    beforeEach(() => {
        // Reset store state
        useMyStore.setState({
            // initial state
        });

        // Clear storage (global mock provided)
        localStorage.clear();

        vi.clearAllMocks();
    });

    // Test state changes
    it("should update state", () => {
        const { result } = renderHook(() => useMyStore());

        act(() => {
            result.current.updateValue("new value");
        });

        expect(result.current.value).toBe("new value");
    });

    // Test persistence (async)
    it("should persist state", async () => {
        const { result } = renderHook(() => useMyStore());

        act(() => {
            result.current.updateValue("persisted");
        });

        // IMPORTANT: Wait for Zustand's async persistence
        await waitForPersistence();

        const stored = localStorage.getItem("my-storage-key");
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.state.value).toBe("persisted");
    });

    // Test hydration (restoration from storage)
    it("should restore state from storage", () => {
        // Directly set state to simulate hydration
        // (Don't test localStorage directly - Zustand handles that)
        useMyStore.setState({
            value: "restored",
        });

        const { result } = renderHook(() => useMyStore());

        expect(result.current.value).toBe("restored");
    });
});
```

**❌ DON'T DO THIS:**

```typescript
// ❌ Custom localStorage mock (use global mock instead)
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    // ...
};
vi.stubGlobal("localStorage", localStorageMock);

// ❌ Testing persistence without waiting
act(() => {
    result.current.updateValue("test");
});
expect(localStorage.getItem("key")).toBeTruthy(); // Will fail!

// ❌ Testing hydration with localStorage.setItem()
localStorage.setItem("key", JSON.stringify({ state: { value: "test" } }));
const { result } = renderHook(() => useMyStore());
// This won't work - hydration happens on module load, not render
```

### Component Tests (React)

**✅ CORRECT Pattern:**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "../MyComponent";

// Mock external dependencies
vi.mock("../../utils/api", () => ({
    api: {
        data: {
            fetch: vi.fn(),
        },
    },
}));

describe("MyComponent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders correctly", () => {
        render(<MyComponent />);

        expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("handles user interaction", async () => {
        const user = userEvent.setup();
        const mockCallback = vi.fn();

        render(<MyComponent onClick={mockCallback} />);

        const button = screen.getByRole("button", { name: /click me/i });
        await user.click(button);

        expect(mockCallback).toHaveBeenCalled();
    });

    it("handles async operations", async () => {
        const mockFetch = vi.fn().mockResolvedValue({ data: "test" });

        render(<MyComponent fetchData={mockFetch} />);

        const button = screen.getByRole("button", { name: /load/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByText("test")).toBeInTheDocument();
        });
    });
});
```

**Key principles:**

-   Use `userEvent` over `fireEvent` for realistic user interactions
-   Use `waitFor()` for async assertions
-   Use `screen.getByRole()` for accessible queries
-   Use `await` with all user interactions

### API Mocking Pattern

**✅ CORRECT Pattern:**

```typescript
import { api } from "../../utils/api";

// Mock the entire API module
vi.mock("../../utils/api", () => ({
    api: {
        cafes: {
            getAll: vi.fn(),
            getById: vi.fn(),
        },
        feed: {
            getAll: vi.fn(),
        },
    },
}));

describe("dataStore", () => {
    it("fetches data correctly", async () => {
        // Use vi.mocked() for type safety
        vi.mocked(api.cafes.getAll).mockResolvedValueOnce({
            cafes: [{ id: 1, name: "Test Cafe" }],
        });

        const { result } = renderHook(() => useDataStore());

        await act(async () => {
            await result.current.fetchCafes();
        });

        expect(result.current.allCafes).toHaveLength(1);
    });
});
```

**❌ DON'T DO THIS:**

```typescript
// ❌ Custom mock object defined before vi.mock (hoisting issues)
const mockApi = {
    cafes: { getAll: vi.fn() },
};
vi.mock("../../utils/api", () => ({ api: mockApi }));

// ❌ Wrong import path (common mistake)
vi.mock("../utils/api", () => ({
    /* ... */
}));
// Should be: '../../utils/api' (check your file location!)
```

### Leaflet Map Mocking

**✅ CORRECT Pattern:**

```typescript
// Mock Leaflet - define inline to avoid hoisting issues
vi.mock("leaflet", () => {
    const mockLeaflet = {
        map: vi.fn(() => ({
            setView: vi.fn().mockReturnThis(),
            remove: vi.fn(),
            on: vi.fn().mockReturnThis(),
            off: vi.fn().mockReturnThis(),
        })),
        tileLayer: vi.fn(() => ({
            addTo: vi.fn(),
        })),
        marker: vi.fn(() => {
            const markerInstance = {
                addTo: vi.fn().mockReturnThis(),
                on: vi.fn().mockReturnThis(),
                setLatLng: vi.fn().mockReturnThis(),
            };
            // Support method chaining
            markerInstance.addTo.mockReturnValue(markerInstance);
            markerInstance.on.mockReturnValue(markerInstance);
            return markerInstance;
        }),
        divIcon: vi.fn(),
        Icon: {
            Default: {
                prototype: {},
                mergeOptions: vi.fn(),
            },
        },
    };

    return {
        default: mockLeaflet,
        ...mockLeaflet,
    };
});
```

**Key points:**

-   Define mock inline (inside `vi.mock()` callback) to avoid hoisting issues
-   Support method chaining with `mockReturnThis()` or `mockReturnValue(instance)`
-   Include all methods used in your components

---

## Common Patterns

### 1. Store Refactoring Pattern

When fixing store tests, follow this checklist:

-   [ ] Remove custom `localStorage`/`sessionStorage` mocks
-   [ ] Replace with global mocks (automatically available)
-   [ ] Add `import { waitForPersistence } from '../../test/helpers'`
-   [ ] Add `async` to all persistence tests
-   [ ] Add `await waitForPersistence()` after `setState()` calls
-   [ ] Convert hydration tests to use `setState()` directly
-   [ ] Fix API mock paths and use `vi.mocked(api.module.function)`

**Example transformation:**

```typescript
// BEFORE
const localStorageMock = {
    /* ... */
};
vi.stubGlobal("localStorage", localStorageMock);

it("should persist", () => {
    act(() => result.current.updateValue("test"));
    expect(localStorageMock.setItem).toHaveBeenCalled(); // ❌
});

// AFTER
import { waitForPersistence } from "../../test/helpers";

it("should persist", async () => {
    act(() => result.current.updateValue("test"));
    await waitForPersistence(); // ✅

    const stored = localStorage.getItem("storage-key");
    expect(stored).toBeTruthy();
});
```

### 2. Async Test Pattern

**Always use `async/await` with:**

-   API calls
-   User interactions (`userEvent`)
-   State updates that trigger effects
-   Zustand persistence

```typescript
it("handles async operation", async () => {
    const user = userEvent.setup();

    render(<MyComponent />);

    // Wait for user action
    await user.click(screen.getByRole("button"));

    // Wait for effect
    await waitFor(() => {
        expect(screen.getByText("Loaded")).toBeInTheDocument();
    });
});
```

### 3. Feature Flag Testing

```typescript
import { mockFeatureFlag } from "../../test/helpers";

describe("MyComponent", () => {
    it("shows feature when enabled", () => {
        mockFeatureFlag("ENABLE_NEW_FEATURE", true);

        render(<MyComponent />);

        expect(screen.getByText("New Feature")).toBeInTheDocument();
    });

    it("hides feature when disabled", () => {
        mockFeatureFlag("ENABLE_NEW_FEATURE", false);

        render(<MyComponent />);

        expect(screen.queryByText("New Feature")).not.toBeInTheDocument();
    });
});
```

### 4. Form Testing Pattern

```typescript
it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<MyForm onSubmit={mockSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123{Enter}");

    // Or click submit button
    // await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password123",
        });
    });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot access 'X' before initialization" (Hoisting Error)

**Problem**: Using variables before `vi.mock()` calls

**Solution**: Define mocks inline within the `vi.mock()` callback

```typescript
// ❌ BAD
const mockValue = "test";
vi.mock("./module", () => ({ value: mockValue }));

// ✅ GOOD
vi.mock("./module", () => ({
    value: "test",
}));
```

#### 2. "Expected spy to be called but it wasn't"

**Problem**: Missing `await` or `waitFor()`

**Solution**: Make test async and wait for operations

```typescript
// ❌ BAD
it("calls function", () => {
    render(<Component />);
    expect(mockFn).toHaveBeenCalled(); // Too early!
});

// ✅ GOOD
it("calls function", async () => {
    render(<Component />);
    await waitFor(() => {
        expect(mockFn).toHaveBeenCalled();
    });
});
```

#### 3. Persistence Tests Failing

**Problem**: Not waiting for Zustand's async persistence

**Solution**: Use `waitForPersistence()` helper

```typescript
// ❌ BAD
act(() => result.current.setValue("test"));
expect(localStorage.getItem("key")).toBeTruthy(); // Fails!

// ✅ GOOD
act(() => result.current.setValue("test"));
await waitForPersistence();
expect(localStorage.getItem("key")).toBeTruthy();
```

#### 4. "Module ... does not provide export ..."

**Problem**: Incorrect mock structure or path

**Solution**:

-   Check import paths match file location
-   Ensure mock exports match actual module exports
-   Use `vi.mocked()` for type safety

```typescript
// Actual module: export const api = { cafes: { ... } }

// ✅ CORRECT mock
vi.mock("../../utils/api", () => ({
    api: {
        cafes: {
            getAll: vi.fn(),
        },
    },
}));
```

#### 5. "Update not wrapped in act(...)"

**Problem**: State updates outside of `act()`

**Solution**: Wrap state changes in `act()` or use `userEvent`

```typescript
// ❌ BAD
result.current.updateValue("test");

// ✅ GOOD
act(() => {
    result.current.updateValue("test");
});

// ✅ ALSO GOOD (for user interactions)
await user.click(button); // userEvent handles act() internally
```

### Debugging Tips

**1. Check what's rendered:**

```typescript
import { screen } from "@testing-library/react";

// See entire DOM
screen.debug();

// See specific element
screen.debug(screen.getByRole("button"));
```

**2. Check localStorage content:**

```typescript
console.log("Storage:", localStorage.getItem("my-key"));
```

**3. Check mock calls:**

```typescript
console.log("Mock calls:", vi.mocked(api.fetch).mock.calls);
```

**4. Increase timeout for slow tests:**

```typescript
await waitFor(
    () => {
        expect(something).toBeTruthy();
    },
    { timeout: 3000 }
); // Default is 1000ms
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific file
npm test -- src/stores/__tests__/myStore.test.ts

# Run with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --grep "should fetch"

# Run in UI mode (interactive)
npm test -- --ui
```

### Focused Testing

```typescript
// Run only this test
it.only("should do something", () => {
    /* ... */
});

// Skip this test
it.skip("should do something", () => {
    /* ... */
});

// Run only this suite
describe.only("MyComponent", () => {
    /* ... */
});
```

### CI/CD

Tests run automatically on:

-   Every push to `main`
-   Pull request creation/updates

**Pre-commit checklist:**

-   [ ] `npm test` passes locally
-   [ ] No `.only` or `.skip` in committed code
-   [ ] New tests added for new features
-   [ ] Test coverage maintained or improved

---

## Test Coverage

### Current Status

All tests are passing (100% pass rate ✅). We continuously add test coverage across all areas of the codebase.

### Coverage Goals

-   **Stores**: 95%+ (critical business logic)
-   **Components**: 80%+ (UI interactions)
-   **Utils**: 90%+ (pure functions)
-   **Hooks**: 85%+ (reusable logic)
-   **Pass Rate**: 100% required at all times

### What to Test

**✅ Always test:**

-   Business logic (stores, utilities)
-   User interactions (clicks, form submissions)
-   API integrations (mocked)
-   State management
-   Error handling
-   Accessibility (ARIA attributes, keyboard navigation)

**❌ Don't test:**

-   Third-party library internals
-   Implementation details (CSS classes, internal state)
-   Trivial getters/setters
-   Auto-generated code

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ BAD - tests implementation
expect(component.state.internalCounter).toBe(5);

// ✅ GOOD - tests behavior
expect(screen.getByText("Count: 5")).toBeInTheDocument();
```

### 2. Use Accessible Queries

Prefer queries that reflect how users interact:

```typescript
// ✅ BEST - accessible
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);

// ⚠️ OK - but less preferred
screen.getByText("Submit");
screen.getByPlaceholderText("Enter email");

// ❌ AVOID - brittle
screen.getByTestId("submit-btn");
screen.getByClassName("email-input");
```

### 3. Write Descriptive Test Names

```typescript
// ❌ BAD
it("works", () => {
    /* ... */
});

// ✅ GOOD
it("should show error message when email is invalid", () => {
    /* ... */
});
```

### 4. Keep Tests Independent

```typescript
// ❌ BAD - tests depend on each other
describe("Counter", () => {
    let count = 0;

    it("increments", () => {
        count++;
        expect(count).toBe(1);
    });

    it("decrements", () => {
        count--;
        expect(count).toBe(0); // Depends on previous test!
    });
});

// ✅ GOOD - each test is independent
describe("Counter", () => {
    beforeEach(() => {
        // Fresh state for each test
    });

    it("increments from zero", () => {
        // ...
    });

    it("decrements from zero", () => {
        // ...
    });
});
```

### 5. Use Factories for Test Data

```typescript
// Create test data factories
const createMockCafe = (overrides = {}) => ({
    id: 1,
    name: "Test Cafe",
    latitude: 43.6532,
    longitude: -79.3832,
    displayScore: 8.5,
    city: "toronto",
    ...overrides,
});

// Use in tests
it("renders cafe", () => {
    const cafe = createMockCafe({ name: "Special Cafe" });
    render(<CafeCard cafe={cafe} />);
    // ...
});
```

---

## Resources

-   **Vitest**: https://vitest.dev/
-   **Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
-   **Zustand Testing**: https://docs.pmnd.rs/zustand/guides/testing
-   **User Event**: https://testing-library.com/docs/user-event/intro/

---

## Getting Help

**Common questions:**

1. Check this document first
2. Look at existing test files for examples
3. Search test output for error messages
4. Check Vitest/Testing Library docs

**Need to add a new testing pattern?**
Update this document and the test helpers in `src/test/`!

---

_Last updated: 2025-11-03_
_Test Status: 100% passing ✅_
