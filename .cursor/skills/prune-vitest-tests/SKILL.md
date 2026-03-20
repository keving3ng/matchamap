---
name: prune-vitest-tests
description: >-
  Audit and shrink Vitest unit tests in this repo by removing Tailwind class assertions,
  duplicate scenarios, and mock-only cases while preserving behavior-focused coverage.
  Use when asked to clean up tests, reduce noise for CI or AI agents, or apply the
  unit-testing rule before/after large refactors.
---

# Prune Vitest unit tests (MatchaMap)

## When to use

- Test files are huge, mostly `toHaveClass`, or duplicate store/hook cases.
- CI is slow or flaky and tests do not catch real regressions.
- After refactors that break style-only assertions.

## Process

1. **Classify** the file: UI primitive vs screen vs store vs hook vs API route.
2. **UI primitives** (`components/ui`): keep render, one primary interaction, disabled/loading, and meaningful a11y (label/role). Delete multi-line class lists.
3. **Screens**: prefer a few integration-style tests; mock `cityStore` / `api` when the component loads data on mount.
4. **Stores**: merge visited/stamp or admin flows into single scenarios where safe; keep persistence at least once per persisted store.
5. **Hooks**: keep directionally different behavior (e.g. swipe axis); drop repeated “not throw when uninitialized” cases — collapse into one.
6. **Backend** (`backend/src`): keep route/integration tests; only merge duplicate setup in pure utils (e.g. `it.each` for MIME types).

## Verify

```bash
npm run test:ci --workspace=frontend
npm run test:ci --workspace=backend
# optional:
npm run test:coverage --workspace=frontend
```

## Do not

- Add snapshots to compensate for removals.
- Lower `vitest.config.ts` coverage thresholds without explicit agreement.
