# E2E & Integration Testing Guide

**Status**: Implementation Complete | Target Coverage: 95%+ | Framework: Playwright + Vitest

This guide documents the comprehensive end-to-end and integration testing implementation for MatchaMap, expanding test coverage beyond the existing 82.8% unit test coverage.

---

## Table of Contents

1. [Overview](#overview)
2. [E2E Testing with Playwright](#e2e-testing-with-playwright)
3. [Integration Testing](#integration-testing)
4. [Performance Testing](#performance-testing)
5. [Database Testing](#database-testing)
6. [CI/CD Integration](#cicd-integration)
7. [Running Tests](#running-tests)
8. [Writing New Tests](#writing-new-tests)

---

## Overview

### Test Coverage Expansion

**Before**: 762/920 tests (82.8%) - primarily unit tests
**Target**: 95%+ coverage with comprehensive test types

**New Test Categories**:
- **E2E Tests**: 25+ user journey tests
- **API Integration**: 20+ endpoint validation tests  
- **Database Constraints**: 15+ integrity tests
- **Performance**: 10+ load and benchmark tests

### Testing Philosophy

1. **User-Centric**: Test complete user journeys, not just individual components
2. **Real Environment**: Test against actual APIs and databases
3. **Performance-Aware**: Establish benchmarks and monitor degradation
4. **Mobile-First**: Prioritize mobile user experience testing
5. **CI/CD Integrated**: Automated testing on every change

---

## E2E Testing with Playwright

### Setup & Configuration

**Installation**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration** (`playwright.config.ts`):
- Cross-browser testing (Chrome, Firefox, Safari, Mobile)
- Automatic dev server startup
- Video/screenshot capture on failure
- Parallel test execution

### Test Structure

```
tests/e2e/
├── auth-flow.spec.ts         # Authentication journeys
├── cafe-discovery.spec.ts    # Browse → details → check-in → review
├── review-submission.spec.ts # Photo upload, CRUD, moderation
├── helpers/
│   ├── auth.ts              # Authentication utilities
│   ├── cafe.ts              # Cafe interaction helpers
│   └── review.ts            # Review management helpers
├── fixtures/
│   └── test-cafe-photo.jpg  # Test assets
├── global-setup.ts          # Test environment setup
└── global-teardown.ts       # Cleanup procedures
```

### Critical User Journeys Tested

#### 1. Authentication Flow
```typescript
test('user registration → email verification → first login', async ({ page }) => {
  // Complete user onboarding process
  await registerUser(page, newUser)
  await verifyEmail(page, newUser.email) // Mocked in test env
  await loginUser(page, newUser)
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
})
```

#### 2. Cafe Discovery & Review
```typescript
test('browse cafes → view details → check in → add review', async ({ page }) => {
  await setupAuthenticatedPage(page)
  await switchToListView(page)
  await navigateToCafe(page, cafeId)
  await checkInToCafe(page, cafeId)
  await submitReview(page, cafeId, reviewData)
})
```

#### 3. Photo Upload Flow
```typescript
test('submit review with photo upload', async ({ page }) => {
  await submitReview(page, cafeId, {
    rating: 8,
    text: 'Amazing matcha!',
    photoPath: './tests/e2e/fixtures/test-cafe-photo.jpg'
  })
  await expect(page.locator('[data-testid="review-photo"]')).toBeVisible()
})
```

### Mobile Testing

**Device Simulation**:
```typescript
test('mobile-responsive cafe browsing', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await setupAuthenticatedPage(page)
  
  // Test touch interactions
  await page.locator('[data-testid="cafe-list"]').hover()
  
  // Test bottom navigation
  await page.click('[data-testid="bottom-nav-map"]')
  await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
})
```

---

## Integration Testing

### API Integration Tests

**Framework**: Vitest with real HTTP requests
**Environment**: Node.js environment for API testing

#### Authentication API Testing
```typescript
describe('Authentication API Integration', () => {
  it('should register → login → validate token flow', async () => {
    // Register new user
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    expect(registerResponse.status).toBe(201)
    
    // Login with credentials
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, ...)
    const { token } = await loginResponse.json()
    
    // Validate token
    const validateResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    expect(validateResponse.status).toBe(200)
  })
})
```

#### Review API Testing
```typescript
describe('Review API Integration', () => {
  it('should enforce authorization on CRUD operations', async () => {
    // Create review with user A
    const createResponse = await fetch(`${API_BASE_URL}/reviews`, {
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: JSON.stringify(reviewData)
    })
    
    // Try to edit with user B (should fail)
    const editResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${userBToken}` },
      body: JSON.stringify(updatedData)
    })
    expect(editResponse.status).toBe(403)
  })
})
```

### Component Integration Tests

**Real API Interactions**:
```typescript
describe('ReviewForm Integration', () => {
  it('should handle API errors gracefully', async () => {
    // Mock API to return error
    vi.mocked(api.reviews.create).mockRejectedValueOnce(new Error('Server error'))
    
    render(<ReviewForm cafeId="1" />)
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to submit/i)).toBeInTheDocument()
    })
  })
})
```

---

## Performance Testing

### Load Testing Scenarios

#### 1. Activity Feed Performance
```typescript
test('activity feed performance with large dataset', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('/feed')
  await page.waitForSelector('[data-testid="activity-feed"]')
  const loadTime = Date.now() - startTime
  
  expect(loadTime).toBeLessThan(5000) // 5 second target
})
```

#### 2. Search Performance
```typescript
test('search autocomplete performance', async ({ page }) => {
  const searchTimes = []
  for (let i = 1; i <= 'matcha'.length; i++) {
    const startTime = Date.now()
    await searchInput.fill('matcha'.substring(0, i))
    await page.waitForSelector('[data-testid="search-results"]')
    searchTimes.push(Date.now() - startTime)
  }
  
  const avgTime = searchTimes.reduce((a, b) => a + b) / searchTimes.length
  expect(avgTime).toBeLessThan(1000) // 1 second average
})
```

#### 3. Mobile Performance on Slow Network
```typescript
test('mobile performance on slow network', async ({ page, context }) => {
  // Simulate 3G network
  await context.route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 100))
    await route.continue()
  })
  
  await page.setViewportSize({ width: 375, height: 667 })
  const startTime = Date.now()
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  expect(Date.now() - startTime).toBeLessThan(12000) // 12s on slow network
})
```

### Performance Benchmarks

| Metric | Target | Test |
|--------|---------|------|
| Initial Load | < 5s | Activity feed, cafe list |
| Search Response | < 1s average | Autocomplete typing |
| Photo Upload | < 15s | Large file upload |
| Map Rendering | < 8s | Many markers load |
| Mobile (3G) | < 12s | Full app load |

---

## Database Testing

### Constraint Validation

#### Foreign Key Constraints
```typescript
it('should enforce foreign key constraints on reviews', async () => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    body: JSON.stringify({
      cafeId: '99999', // Non-existent cafe
      rating: 8,
      text: 'This should fail'
    })
  })
  
  expect(response.status).toBe(400)
  const error = await response.json()
  expect(error.message).toMatch(/cafe.*not found/i)
})
```

#### Cascade Deletes
```typescript
it('should handle cascade deletes correctly', async () => {
  // Create review
  const reviewResponse = await createReview(authToken, reviewData)
  const reviewId = reviewResponse.id
  
  // Delete user (should cascade delete review)
  await deleteUser(authToken)
  
  // Verify review is deleted
  const getReviewResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}`)
  expect(getReviewResponse.status).toBe(404)
})
```

#### Transaction Integrity
```typescript
it('should handle database transaction rollbacks', async () => {
  // Attempt bulk operation with one invalid item
  const response = await fetch(`${API_BASE_URL}/reviews/bulk`, {
    body: JSON.stringify({
      reviews: [
        { cafeId: '1', rating: 8, text: 'Valid' },
        { cafeId: '99999', rating: 7, text: 'Invalid' } // Should cause rollback
      ]
    })
  })
  
  expect(response.status).toBe(400)
  
  // Verify no reviews were created (transaction rolled back)
  const cafeReviews = await getCafeReviews('1')
  expect(cafeReviews.length).toBe(initialCount) // No change
})
```

---

## CI/CD Integration

### Workflow Structure

```yaml
name: Comprehensive Test Suite

jobs:
  unit-tests:        # Existing Vitest tests
  integration-tests: # API integration tests  
  e2e-tests:         # Playwright E2E tests
  performance-tests: # Performance benchmarks (main branch only)
  bundle-size-check: # Bundle size monitoring
  test-summary:      # Aggregate results
```

### Test Execution Order

1. **Unit Tests** (fastest, run first)
2. **Integration Tests** (API validation)
3. **E2E Tests** (full user journeys)
4. **Performance Tests** (benchmarks, main branch only)
5. **Bundle Size Check** (parallel)

### Artifact Management

- **Test Results**: JUnit XML for all test types
- **Coverage Reports**: Codecov integration
- **E2E Artifacts**: Videos/screenshots on failure
- **Performance Metrics**: Trend analysis
- **Bundle Analysis**: Size tracking

---

## Running Tests

### Development

```bash
# Unit tests (existing)
npm test
npm test -- --watch

# Integration tests
npm run test:integration
npm run test:integration:watch

# E2E tests
npm run test:e2e
npm run test:e2e:ui          # Interactive mode
npm run test:e2e:headed      # Show browser

# Performance tests
npx playwright test tests/performance/

# Everything
npm run test:all-comprehensive
```

### CI Environment

```bash
# Full test suite (as run in CI)
npm run test:all              # Unit tests
npm run test:integration     # API integration
npm run test:e2e             # E2E user journeys
npx playwright test tests/performance/  # Performance (main branch)
```

### Debug Mode

```bash
# Debug E2E tests
PWDEBUG=1 npx playwright test auth-flow.spec.ts

# Debug integration tests
npm run test:integration:watch -- --reporter=verbose

# Generate test reports
npm run test:e2e -- --reporter=html
```

---

## Writing New Tests

### E2E Test Pattern

```typescript
import { test, expect } from '@playwright/test'
import { setupAuthenticatedPage } from './helpers/auth'

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page)
  })

  test('should complete user journey', async ({ page }) => {
    // Navigate to feature
    await page.goto('/new-feature')
    
    // Interact with UI
    await page.fill('[data-testid="input"]', 'test value')
    await page.click('[data-testid="submit-button"]')
    
    // Verify outcome
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

### Integration Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('New API Integration', () => {
  let authToken: string

  beforeEach(async () => {
    // Setup authenticated user
    authToken = await setupTestUser()
  })

  afterEach(async () => {
    // Cleanup
    await cleanupTestUser(authToken)
  })

  it('should handle API operation', async () => {
    const response = await fetch(`${API_BASE_URL}/new-endpoint`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(testData)
    })

    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result.id).toBeDefined()
  })
})
```

### Performance Test Pattern

```typescript
test('new feature performance benchmark', async ({ page }) => {
  const startTime = Date.now()
  
  // Perform action being benchmarked
  await page.goto('/new-feature')
  await page.waitForSelector('[data-testid="feature-loaded"]')
  
  const loadTime = Date.now() - startTime
  console.log(`Feature load time: ${loadTime}ms`)
  
  // Set performance expectation
  expect(loadTime).toBeLessThan(3000)
})
```

### Test Data Guidelines

- **Use factories** for creating test data
- **Unique identifiers** for parallel test execution
- **Cleanup after tests** to prevent interference
- **Mock external services** when appropriate
- **Real data for integration** tests when possible

---

## Best Practices

### E2E Testing

1. **Test User Journeys**: Focus on complete workflows, not individual features
2. **Use Page Object Pattern**: Encapsulate page interactions in helper functions
3. **Stable Selectors**: Use `data-testid` attributes for reliable element selection
4. **Wait Strategies**: Use `waitForSelector()` and `waitFor()` appropriately
5. **Error Handling**: Test both success and failure scenarios

### Integration Testing

1. **Real APIs**: Test against actual backend endpoints
2. **Authentication**: Test with real JWT tokens and sessions
3. **Data Validation**: Verify request/response schemas
4. **Error Scenarios**: Test network failures, invalid data, unauthorized access
5. **Database State**: Verify data persistence and integrity

### Performance Testing

1. **Baseline Metrics**: Establish performance benchmarks
2. **Real Conditions**: Test with realistic data volumes
3. **Network Simulation**: Test under various network conditions
4. **Mobile Testing**: Prioritize mobile device performance
5. **Trend Monitoring**: Track performance changes over time

---

## Troubleshooting

### Common E2E Issues

**Flaky Tests**:
```typescript
// Use proper waiting strategies
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 })
await page.waitForLoadState('networkidle')
```

**Element Not Found**:
```typescript
// Check if element exists before interacting
const element = page.locator('[data-testid="button"]')
await expect(element).toBeVisible()
await element.click()
```

### Integration Test Issues

**Network Timeouts**:
```typescript
// Increase timeout for slow APIs
describe('Slow API', () => {
  it('should handle slow response', async () => {
    // Test implementation
  }, 30000) // 30 second timeout
})
```

**Database State**:
```typescript
// Ensure clean state between tests
beforeEach(async () => {
  await clearTestData()
  await seedTestData()
})
```

---

## Resources

- **Playwright Documentation**: https://playwright.dev/
- **Vitest Documentation**: https://vitest.dev/
- **Testing Library Best Practices**: https://testing-library.com/docs/guiding-principles/
- **Performance Testing Guide**: https://web.dev/performance/
- **CI/CD Testing Patterns**: https://martinfowler.com/articles/continuousIntegration.html

---

## Getting Help

1. **Check existing test examples** in the test directories
2. **Review error messages** carefully - they often indicate the fix needed
3. **Use debug mode** for step-by-step test execution
4. **Check CI logs** for environment-specific issues
5. **Update this documentation** when you discover new patterns!

---

_Last updated: 2025-10-27_
_Test Implementation: Complete | Coverage Target: 95%+ | Framework: Playwright + Vitest_
_E2E Tests: 25+ journeys | Integration Tests: 20+ APIs | Performance Tests: 10+ benchmarks_