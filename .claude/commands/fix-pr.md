# Fix PR Command

Address PR feedback efficiently by fixing blocking issues and creating follow-up tasks.

## Usage

```bash
/fix-pr <pr-number>
```

## Example

```bash
/fix-pr 123
```

---

## Instructions

Handle PR feedback efficiently by focusing on blocking issues first.

### Step 1: Gather PR Feedback

Get all feedback using MCP tools:

```typescript
// Get PR details, reviews, and status in parallel
const [pr, reviews, files, status] = await Promise.all([
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: <pr-number>,
    method: 'get'
  }),
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: <pr-number>,
    method: 'get_reviews'
  }),
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: <pr-number>,
    method: 'get_files'
  }),
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: <pr-number>,
    method: 'get_status'
  })
])
```

Also get review comments if needed:

```typescript
const comments = await mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <pr-number>,
  method: 'get_review_comments'
})
```

Parse to identify:
- Formal reviews (APPROVED, CHANGES_REQUESTED, COMMENTED)
- Review comments on specific lines
- CI failures
- Changed files

### Step 2: Switch to PR Branch

```bash
git fetch origin
git checkout <pr.head.ref>  # From step 1
git pull origin <pr.head.ref>
```

### Step 3: Categorize Feedback

Quickly categorize into two buckets:

**BLOCKING** (fix now):
- "Changes requested" reviews
- CI/test failures
- Type errors, linting failures
- Code pattern violations (CLAUDE.md)
- Security/critical bugs
- Merge conflicts

**FOLLOW-UP** (create issues):
- "Nice to have" suggestions
- Refactoring ideas
- Performance optimizations
- Additional features
- Tech debt notes
- Test coverage improvements

Create mental (or written) summary:
```
BLOCKING:
1. Fix TypeScript errors in favorites.ts - @reviewer
2. Add error handling to API call - @reviewer

FOLLOW-UP:
1. Refactor duplicate validation logic - @reviewer
2. Add integration tests for favorites - @reviewer
```

### Step 4: Fix Blocking Issues

For each blocking item:

**1. Read the code**
Use Read tool to view the file(s) mentioned in feedback.

**2. Make the fix following MatchaMap patterns:**
- COPY constants for user-facing strings (`COPY.section.key`)
- API client for backend calls (`api.endpoint.method()`)
- Shared UI components (`PrimaryButton`, `AlertDialog`, etc.)
- TypeScript strict mode (no `any`)
- Request body typing: `await request.json() as { field?: type }`
- D1 results: `result.meta.changes` not `result.changes`

**3. Test the fix (only what you changed):**
```bash
npm run typecheck  # If TypeScript changes
npm test           # If logic changes
```

Don't run everything - pre-commit hook will validate.

**4. Commit focused changes:**
```bash
git add <files>
git commit -m "fix: address PR feedback - <what>

- <specific change>
- <why it was needed>

Addresses feedback from @reviewer in PR #<number>"
```

Repeat for each blocking issue.

### Step 5: Create Follow-Up Issues

**Check for duplicates first:**

```typescript
// Search for similar issues
const existingIssues = await mcp__github__search_issues({
  query: 'repo:keving3ng/matchamap <keyword> label:enhancement,tech-debt,follow-up',
  owner: 'keving3ng',
  repo: 'matchamap'
})
```

**If not duplicate, create issue:**

```typescript
await mcp__github__create_issue({
  owner: 'keving3ng',
  repo: 'matchamap',
  title: '<actionable title>',
  body: `Context from PR #<number> review:

<reviewer's feedback>

Original comment: <link to PR comment>

Suggested approach:
- <approach from review or your idea>

Acceptance criteria:
- [ ] <criterion 1>
- [ ] <criterion 2>`,
  labels: ['follow-up', 'enhancement']  // or ['follow-up', 'tech-debt']
})
```

Track issue numbers for summary.

### Step 6: Push and Notify

**Push all fixes:**
```bash
git push origin <branch-name>
```

Pre-commit hook validates typecheck + tests automatically.

**Add summary comment:**

```typescript
await mcp__github__add_issue_comment({
  owner: 'keving3ng',
  repo: 'matchamap',
  issue_number: <pr-number>,  // PRs are issues in GitHub API
  body: `### PR Feedback Addressed

✅ **Fixed blocking issues:**
- <issue 1>: <what was fixed>
- <issue 2>: <what was fixed>

📋 **Created follow-up issues:**
- #<issue-number>: <title>
- #<issue-number>: <title>

All blocking feedback addressed. Ready for re-review.`
})
```

### Step 7: Verify CI Passes

Wait ~30 seconds, then check:

```typescript
const status = await mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <pr-number>,
  method: 'get_status'
})
```

If all checks show `conclusion: "SUCCESS"`, you're done! If failures remain, use `/fix-ci <pr-number>`.

---

## MatchaMap-Specific Patterns

### TypeScript Fixes

**Request body parsing:**
```typescript
// ❌ Wrong
const body = await request.json()
const { field } = body  // Error: unknown

// ✅ Right (see photos.ts, reviews.ts)
const body = await request.json() as { field?: type }
const { field } = body
```

**D1 database results:**
```typescript
// ❌ Wrong
if (result.changes > 0)  // Property doesn't exist

// ✅ Right
if ((result.meta.changes || 0) > 0)
```

### Code Patterns (CLAUDE.md)

**Copy constants:**
```typescript
// ❌ Wrong
<button>Get Directions</button>

// ✅ Right
import { COPY } from '@/constants/copy'
<button>{COPY.map.getDirections}</button>
```

**API client:**
```typescript
// ❌ Wrong
await fetch(`${API_URL}/cafes`)

// ✅ Right
import { api } from '@/utils/api'
await api.cafes.getAll()
```

**Shared UI:**
```typescript
// ❌ Wrong
<button className="bg-gradient...">Click</button>

// ✅ Right
import { PrimaryButton } from '@/components/ui'
<PrimaryButton onClick={...}>Click</PrimaryButton>
```

### Common Review Feedback

**"Add error handling":**
```typescript
try {
  await api.endpoint()
  setSuccess(true)
} catch (error) {
  console.error('Operation failed:', error)
  // Use AlertDialog for user-facing errors
}
```

**"Add validation":**
```typescript
if (!field || typeof field !== 'expected-type') {
  return badRequestResponse('Field is required', request, env)
}
```

**"Follow existing patterns":**
- Check similar files: `reviews.ts`, `photos.ts`, `favorites.ts`
- Look for Zod validators in `backend/src/validators/`
- Check frontend patterns in similar components

---

## MCP Tools Reference

**Get PR details:**
```typescript
mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <number>,
  method: 'get'  // or 'get_reviews', 'get_files', 'get_status', 'get_review_comments'
})
```

**Search for issues:**
```typescript
mcp__github__search_issues({
  query: 'repo:keving3ng/matchamap <keywords> label:enhancement',
  owner: 'keving3ng',
  repo: 'matchamap'
})
```

**Create issue:**
```typescript
mcp__github__create_issue({
  owner: 'keving3ng',
  repo: 'matchamap',
  title: '...',
  body: '...',
  labels: ['follow-up', 'enhancement']
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

## Tips for Efficiency

1. **Use MCP tools** - Type-safe and integrated into Claude Code
2. **Fetch in parallel** - Use `Promise.all()` for multiple PR queries
3. **Batch related fixes** - Commit multiple related changes together
4. **Trust pre-commit hook** - Don't manually run all checks
5. **Check similar files** - Copy working patterns
6. **Ask if unclear** - Don't guess on ambiguous feedback
7. **Create issues liberally** - Better to track than forget
8. **Link everything** - Always reference PR/comment in follow-up issues

---

## When Things Go Wrong

**Pre-commit hook fails:**
- Fix the errors (usually typecheck or tests)
- Don't bypass - it prevents CI failures

**Reviewer disagrees with approach:**
- Discuss in PR comments before implementing
- Ask for clarification on ambiguous feedback

**Too many blocking items:**
- Prioritize by severity (CI failures first, then code issues)
- Fix and push incrementally
- Don't try to fix everything at once

**Unsure if duplicate issue:**
- Search more broadly with `mcp__github__search_issues`
- Check closed issues too (state: "all")
- When in doubt, create it - can close if duplicate found

**CI fails after fixes:**
- Use `/fix-ci <pr-number>` to debug
- May have introduced new issues while fixing
- Check the specific failure in GitHub Actions
