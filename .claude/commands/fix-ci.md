---
description: Check CI status of a PR and fix failing checks
args:
  - name: pr_number
    description: Pull request number to check
    required: true
---

You are tasked with checking the CI/test status of a GitHub Pull Request and fixing any failures. Follow these steps:

## Step 1: Get Repository Info

First, determine the repository owner and name from the git remote:

```bash
git remote get-url origin
```

Parse the owner/repo from the URL (e.g., `keving3ng/matchamap`).

## Step 2: Fetch PR and CI Status

1. **Get PR details** using `mcp__github__pull_request_read` with `method: "get"`:
   - `owner`: Repository owner
   - `repo`: Repository name
   - `pullNumber`: PR number from user input

   Extract:
   - PR title and description
   - Source branch name (`head.ref`)
   - Target branch name (`base.ref`)
   - Current state (`state`, `draft`, `mergeable`)

2. **Get CI/test status** using `mcp__github__pull_request_read` with `method: "get_status"`:
   - `owner`: Repository owner
   - `repo`: Repository name
   - `pullNumber`: PR number

   Analyze the status checks:
   - `state`: Overall status (success, pending, failure, error)
   - `statuses`: Array of individual check results
   - `check_runs`: GitHub Actions check runs with details

3. **Get changed files** using `mcp__github__pull_request_read` with `method: "get_files"`:
   - Shows which files were modified in the PR
   - Helps identify what might be causing failures

## Step 3: Analyze CI Failures

For each failing check, identify:

**Common CI Failure Types:**

1. **TypeScript Type Errors** (`typecheck` job)
   - Look for `.ts` or `.tsx` files in changed files
   - Common causes: missing types, `any` usage, interface mismatches
   - Fix: Run `npm run typecheck` locally to see errors

2. **Linting Errors** (`lint` job)
   - ESLint violations in code
   - Common causes: unused variables, formatting issues
   - Fix: Run `npm run lint` locally and address issues

3. **Test Failures** (`test` job)
   - Unit tests or integration tests failing
   - Common causes: broken assertions, missing mocks, outdated snapshots
   - Fix: Run `npm test` locally to reproduce

4. **Build Failures** (`build` job)
   - Compilation or bundling errors
   - Common causes: import errors, syntax errors, missing dependencies
   - Fix: Run `npm run build` locally

5. **Dependency Issues**
   - Missing packages, version conflicts
   - Fix: Run `npm install` or check `package.json`

Create a clear summary:

```
CI STATUS SUMMARY
=================

Overall Status: ❌ FAILED (or ✅ PASSED, ⏳ PENDING)

Failing Checks:
1. ❌ typecheck - TypeScript compilation failed
   - Files affected: src/components/NewComponent.tsx
   - Error: Property 'foo' does not exist on type 'Bar'

2. ❌ test - 3 tests failing
   - Test suite: src/components/__tests__/NewComponent.test.tsx
   - Failures: "should render correctly", "should handle click"

3. ✅ lint - Passed
4. ✅ build - Passed
```

## Step 4: Switch to PR Branch

1. Check current branch:
   ```bash
   git branch --show-current
   ```

2. If not on the PR branch:
   ```bash
   git fetch origin
   git checkout <pr-branch-name>
   git pull origin <pr-branch-name>
   ```

3. Verify you're on the correct branch and it's up to date

## Step 5: Reproduce Failures Locally

For each failing check, run the corresponding command locally:

1. **TypeScript errors:**
   ```bash
   npm run typecheck
   ```
   - Shows exact line numbers and error messages
   - Identifies all type errors at once

2. **Linting errors:**
   ```bash
   npm run lint
   ```
   - Shows linting violations
   - Some can be auto-fixed with `npm run lint -- --fix`

3. **Test failures:**
   ```bash
   npm test
   ```
   - Runs full test suite
   - Use `npm test -- --watch` for iterative development
   - Use `npm test -- path/to/test.ts` for specific tests

4. **Build failures:**
   ```bash
   npm run build
   ```
   - Shows compilation errors
   - Check for import/export issues

## Step 6: Fix Each Failure

For each error identified, read the relevant files and fix the issues:

### TypeScript Fixes

**Common patterns:**
- Add proper type annotations (never use `any`)
- Update interfaces to match actual data structures
- Import missing types from shared/types
- Use type guards for runtime checks

**Example:**
```typescript
// ❌ BAD
const data: any = await api.cafes.getAll()

// ✅ GOOD
const data: { cafes: Cafe[] } = await api.cafes.getAll()
```

### Linting Fixes

**Common patterns:**
- Remove unused variables/imports
- Fix indentation (2 spaces)
- Add missing semicolons (if configured)
- Fix quote style (single vs double)

**Auto-fix when possible:**
```bash
npm run lint -- --fix
```

### Test Fixes

**Common patterns:**
- Update test assertions to match new behavior
- Add missing mocks for new API calls
- Use `waitFor()` for async operations
- Use `userEvent` instead of `fireEvent`

**Example:**
```typescript
// ❌ BAD
fireEvent.click(button)
expect(mockFn).toHaveBeenCalled() // Too early!

// ✅ GOOD
await user.click(button)
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled()
})
```

### Build Fixes

**Common patterns:**
- Fix import paths (check case sensitivity)
- Ensure all exports are properly defined
- Check for circular dependencies
- Verify all dependencies are installed

## Step 7: Verify Fixes Locally

After making fixes, run ALL checks locally to ensure everything passes:

```bash
# Run all quality checks
npm run typecheck  # Must pass
npm test           # Must pass
npm run lint       # Must pass
npm run build      # Must pass
```

**Don't proceed until all checks pass locally!**

## Step 8: Commit and Push Fixes

1. **Stage changes:**
   ```bash
   git add <changed-files>
   ```

2. **Commit with clear message:**
   ```bash
   git commit -m "fix(ci): resolve failing checks

   - Fix TypeScript errors in NewComponent
   - Update test assertions for new behavior
   - Remove unused imports flagged by linter

   Fixes CI failures in PR #<number>"
   ```

3. **Push to PR branch:**
   ```bash
   git push origin <pr-branch-name>
   ```

## Step 9: Verify CI Passes

1. **Wait for CI to complete** (check GitHub PR page or use MCP tool)

2. **Check status again** using `mcp__github__pull_request_read` with `method: "get_status"`:
   - Verify `state` is now "success"
   - Confirm all checks are green ✅

3. **If still failing:**
   - Review new error messages
   - Repeat Steps 5-8 with new fixes
   - Check for flaky tests or environment issues

## Step 10: Add Summary Comment

Once all checks pass, add a comment to the PR using `mcp__github__add_issue_comment`:

```markdown
### ✅ CI Checks Fixed

All CI checks are now passing:

**Fixed Issues:**
- ✅ TypeScript compilation errors in `src/components/NewComponent.tsx`
- ✅ 3 failing tests in `NewComponent.test.tsx`
- ✅ ESLint warnings (unused imports)

**Verification:**
- [x] `npm run typecheck` - Passed
- [x] `npm test` - Passed (969/969 tests)
- [x] `npm run lint` - Passed
- [x] `npm run build` - Passed

Ready for review! 🚀
```

## Step 11: Final Report

Provide a summary to the user:

```
CI STATUS UPDATE
================

PR #<number>: <title>
Branch: <branch-name>

BEFORE:
- ❌ typecheck - Failed
- ❌ test - 3 failures
- ✅ lint - Passed
- ✅ build - Passed

AFTER:
- ✅ typecheck - Passed
- ✅ test - Passed (969/969)
- ✅ lint - Passed
- ✅ build - Passed

Commits pushed: 1
- fix(ci): resolve failing checks

Next steps:
- CI is re-running (check PR page for live status)
- All checks should pass in ~2-3 minutes
- PR is ready for review once CI completes
```

## Best Practices

**Before making changes:**
- ✅ Always reproduce the failure locally first
- ✅ Understand the root cause before fixing
- ✅ Check project guidelines in `CLAUDE.md`
- ✅ Read existing code patterns

**When fixing:**
- ✅ Fix one issue type at a time (types, then tests, then lint)
- ✅ Run checks frequently to catch regressions
- ✅ Make focused commits (separate commit per check type)
- ✅ Add clear commit messages explaining what was fixed

**After fixing:**
- ✅ Verify ALL checks pass locally before pushing
- ✅ Wait for CI to confirm fixes before marking complete
- ✅ Add summary comment to PR for transparency

**Common pitfalls to avoid:**
- ❌ Pushing fixes without running checks locally
- ❌ Using `any` type to silence TypeScript errors
- ❌ Commenting out failing tests instead of fixing them
- ❌ Ignoring lint errors with disable comments
- ❌ Force pushing and rewriting PR history

## Project-Specific Guidelines (MatchaMap)

When fixing failures, ensure compliance with MatchaMap patterns:

**TypeScript:**
- Strict mode enabled (no `any` types)
- Import shared types from `shared/types/index.ts`
- Define proper interfaces for all props

**Code Patterns (from CLAUDE.md):**
- Use COPY constants for user-facing strings (`COPY.section.key`)
- Use API client for backend calls (`api.cafes.getAll()`)
- Use shared UI components (`PrimaryButton`, `AlertDialog`, etc.)
- Use design tokens (`spacing.cardPadding`, `borderRadius.xl`)

**Testing:**
- Use `waitForPersistence()` for Zustand store tests
- Use `userEvent` for user interactions
- Use `vi.mocked()` for API mocking
- See `docs/TESTING.md` for patterns

**Performance:**
- Maintain bundle size < 100KB per page
- Keep components < 300 lines
- Use lazy loading for routes

## MCP Tools Reference

**PR Operations:**
- `mcp__github__pull_request_read(method: "get")` - Get PR details
- `mcp__github__pull_request_read(method: "get_status")` - Get CI status
- `mcp__github__pull_request_read(method: "get_files")` - Get changed files
- `mcp__github__pull_request_read(method: "get_diff")` - Get full PR diff

**Issue Operations:**
- `mcp__github__add_issue_comment` - Add comment to PR (PRs are issues)

**Repository Info:**
- Use `git remote get-url origin` to get repo URL
- Parse owner/repo from URL

---

Now check CI status for PR #{{pr_number}} and fix any failures following the steps above.
