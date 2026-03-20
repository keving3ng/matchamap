# Fix CI Command

Quickly identify and fix CI failures on a pull request.

## Usage

```bash
/fix-ci <pr-number>
```

## Example

```bash
/fix-ci 238
```

---

## Instructions

Fix CI failures efficiently by focusing on what actually failed.

### Step 1: Check CI Status

Use `mcp__github__pull_request_read` to get the status:

```typescript
// Get CI status
await mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <pr-number>,
  method: 'get_status'
})
```

Parse the response to identify FAILED checks. This repo uses a **single required check** named **CI** (one job). Inspect the log for which **step** failed:
- **TypeScript type checking** — blocking
- **Lint** — advisory (`continue-on-error`)
- **Security audit** — advisory (`continue-on-error`)
- **Frontend tests** / **Backend tests** — blocking
- **Build** — `main` pushes only (not on PRs)

Look for `conclusion: "FAILURE"` in the `statusCheckRollup` array.

### Step 2: Get PR Details and Switch to Branch

Get branch name and switch:

```typescript
// Get PR details
const pr = await mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <pr-number>,
  method: 'get'
})

// Extract branch name: pr.head.ref
```

Then switch:

```bash
git fetch origin
git checkout <pr.head.ref>
git pull origin <pr.head.ref>
```

### Step 3: Reproduce the Specific Failure

**Only run the check that failed** - don't waste time on passing checks.

**If the typecheck step failed:**
```bash
npm run typecheck  # TypeScript errors are the most common cause
```

TypeScript errors? Fix the type issues. Common patterns:
- Add type annotations: `const body = await request.json() as { field?: type }`
- Fix D1 result access: Use `result.meta.changes` not `result.changes`
- Follow existing patterns in similar files (check reviews.ts, photos.ts, etc.)

**If Frontend/Backend Tests failed:**
```bash
npm test  # or npm test --workspace=backend
```

**If Build failed:**
```bash
npm run build
```

**If Lint failed:**
Check if it has `continue-on-error: true` in `.github/workflows/ci.yml` - if so, it won't block CI and you can ignore it.

### Step 4: Fix and Verify

Make the fixes, then **only re-run what failed**:

```bash
npm run typecheck  # typecheck step
# OR
npm test           # frontend tests (or backend workspace as needed)
# OR
npm run build      # build step (main only)
```

Don't run all checks - the pre-commit hook will do that automatically.

### Step 5: Commit and Push

```bash
git add <changed-files>
git commit -m "fix(ci): resolve <specific-check> failures

- <what you fixed>
- <specific change made>

Fixes CI failures in PR #<number>"

git push origin <pr-branch-name>
```

The pre-commit hook will run typecheck + tests automatically and prevent bad commits.

### Step 6: Verify CI Passes

Wait ~30 seconds, then check status again:

```typescript
await mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <pr-number>,
  method: 'get_status'
})
```

If all checks show `conclusion: "SUCCESS"`, you're done! Add a summary comment:

```typescript
await mcp__github__add_issue_comment({
  owner: 'keving3ng',
  repo: 'matchamap',
  issue_number: <pr-number>,  // PRs are issues in GitHub API
  body: `✅ CI checks fixed

Fixed Issues:
- <specific failure> - <what was wrong>

All checks now passing.`
})
```

---

## Project-Specific Quick Reference

### MatchaMap CI (`.github/workflows/ci.yml`)

Single job **CI**, sequential steps:

1. **Typecheck** — `npm run typecheck` (blocking)
2. **Lint** — `npm run lint:ci --workspace=frontend -- -f gha` (advisory)
3. **Audit** — `npm audit` (advisory)
4. **Frontend tests** — `npm run test:ci` or `test:coverage` on `main`
5. **Backend tests** — `npm run test:ci --workspace=backend`
6. **Build** — `npm run build` on `main` push only
7. **Deploy** — migrations + wrangler on `main` only

### Common MatchaMap TypeScript Fixes

**Request body parsing:**
```typescript
// ❌ Wrong
const body = await request.json()
const { field } = body  // TypeScript error: unknown

// ✅ Right
const body = await request.json() as { field?: type }
const { field } = body
```

**D1 result access:**
```typescript
// ❌ Wrong
const result = await db.run()
if (result.changes > 0) // Property doesn't exist

// ✅ Right
const result = await db.run()
if ((result.meta.changes || 0) > 0)
```

**Follow existing patterns:**
- Check `backend/src/routes/reviews.ts` for Zod validation examples
- Check `backend/src/routes/photos.ts` for body type assertions
- Use patterns from similar endpoints

### Pre-commit Hook

The project has a pre-commit hook that runs:
1. `npm run typecheck` (all workspaces)
2. `npm test` (frontend only)

If your commit succeeds, CI will likely pass. The hook prevents most CI failures.

---

## MCP Tools Reference

**Get PR status:**
```typescript
mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <number>,
  method: 'get_status'
})
```

**Get PR details:**
```typescript
mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <number>,
  method: 'get'
})
```

**Add comment to PR:**
```typescript
mcp__github__add_issue_comment({
  owner: 'keving3ng',
  repo: 'matchamap',
  issue_number: <pr-number>,
  body: '...'
})
```

---

## Tips for Speed

1. **Use MCP tools** - Type-safe and integrated
2. **Focus on the failure** - Don't run checks that passed
3. **Check .github/workflows/ci.yml** - Understand what actually blocks CI
4. **Trust the pre-commit hook** - It catches most issues before push
5. **Look for patterns** - TypeScript errors follow common patterns (body typing, D1 results)
6. **Read similar files** - Copy working patterns from existing routes

---

## When Things Go Wrong

**If pre-commit hook fails:**
- Fix the errors shown (typecheck or test failures)
- Don't bypass the hook - it's preventing CI failures

**If CI still fails after your fix:**
- Check the actual error in GitHub Actions logs
- You might have fixed the wrong thing
- Re-run Step 1 to see current failures

**If you're unsure what failed:**
- Click the "Details" link on the GitHub PR page for the failing check
- Read the actual error message from the logs
- Search for similar errors in the codebase
