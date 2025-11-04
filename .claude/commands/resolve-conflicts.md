# Resolve Merge Conflicts Command

Intelligently resolve merge conflicts during a rebase by understanding the PR's intended changes.

## Usage

```bash
/resolve-conflicts <pr-number-or-url>
```

## Examples

```bash
/resolve-conflicts 285
/resolve-conflicts https://github.com/keving3ng/matchamap/pull/285
```

---

## Instructions

Resolve merge conflicts during an active rebase by understanding the PR's intended changes and applying them correctly.

### Step 0: Verify Rebase in Progress

**CRITICAL:** Before starting, verify a rebase is actively in progress:

```bash
# Check for rebase state
if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
  echo "✓ Rebase in progress"
else
  echo "✗ No rebase in progress"
  exit 1
fi
```

**If no rebase is in progress:**
- Output: "❌ No rebase in progress. Please start the rebase first with `git rebase <branch>`, then run this command."
- **STOP** - Do not proceed

### Step 1: Parse PR Input

Extract PR number from input:

```typescript
let prNumber: number

// Handle PR number directly
if (/^\d+$/.test(input)) {
  prNumber = parseInt(input, 10)
}
// Handle GitHub PR URL
else if (input.includes('github.com')) {
  const match = input.match(/\/pull\/(\d+)/)
  prNumber = match ? parseInt(match[1], 10) : null
}

if (!prNumber) {
  throw new Error('Invalid PR number or URL')
}
```

### Step 2: Understand PR Intent

Fetch comprehensive PR information in parallel:

```typescript
const [prDetails, prDiff, changedFiles] = await Promise.all([
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: prNumber,
    method: 'get'
  }),
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: prNumber,
    method: 'get_diff'
  }),
  mcp__github__pull_request_read({
    owner: 'keving3ng',
    repo: 'matchamap',
    pullNumber: prNumber,
    method: 'get_files'
  })
])
```

**Analyze to understand:**
- PR title and description (high-level intent)
- Full diff (specific changes)
- Changed files (scope of changes)
- Commits (incremental changes)

**Create mental model:**
```
PR Intent: "Add user favorites feature"
Key Changes:
- New table: user_favorites
- New API endpoints: /api/favorites (GET, POST, DELETE)
- New frontend components: FavoritesButton, FavoritesPage
- Updated types: UserFavorite interface
```

### Step 3: Identify Conflict Files

```bash
# Get list of files with conflicts
git status --porcelain | grep '^UU' | awk '{print $2}'
```

For each conflict file, read the conflicted state:

```bash
git show :1:<file>  # Common ancestor
git show :2:<file>  # Current branch (HEAD)
git show :3:<file>  # Incoming branch
```

Or simply read the file with conflict markers:

```typescript
const conflictedContent = await Read({ file_path: '<conflict-file>' })
```

### Step 4: Resolve Each Conflict Intelligently

For each file with conflicts:

**1. Understand the conflict:**
- Read the file with conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Identify what changed in both branches
- Compare with PR diff to understand intended changes

**2. Determine resolution strategy:**

**Strategy A: PR changes win (most common)**
When PR introduces new functionality that doesn't conflict with parallel changes:
```typescript
// Example: PR adds new function, base branch reformatted file
// Resolution: Accept BOTH changes
```

**Strategy B: Base branch changes win**
When base branch has critical fixes/refactors:
```typescript
// Example: Base branch renamed function, PR still uses old name
// Resolution: Accept base changes, update PR code to match new API
```

**Strategy C: Merge both changes**
When changes are complementary:
```typescript
// Example: Both branches add different imports
// Resolution: Include both imports, deduplicate if needed
```

**Strategy D: Rewrite for compatibility**
When changes are incompatible:
```typescript
// Example: Base branch changed component API, PR uses old API
// Resolution: Rewrite PR code to use new API while preserving intent
```

**3. Apply resolution following MatchaMap patterns:**

**Critical patterns to maintain:**
- **COPY constants:** Ensure all user-facing strings use `COPY.*`
- **API client:** Ensure backend calls use `api.*`
- **Shared UI:** Ensure components use shared UI components
- **TypeScript strict:** No `any` types, proper typing
- **Request parsing:** `await request.json() as { field?: type }`
- **D1 results:** Use `result.meta.changes` not `result.changes`

**4. Edit the file to resolve conflict:**

```typescript
// Use Edit tool to replace conflicted section with resolved version
await Edit({
  file_path: '<conflict-file>',
  old_string: `<<<<<<< HEAD
... conflicted content ...
=======
... conflicted content ...
>>>>>>> <commit>`,
  new_string: `... resolved content ...`
})
```

**5. Verify resolution:**
- Check TypeScript types if applicable
- Ensure imports are correct
- Verify no merge markers remain

### Step 5: Mark as Resolved and Continue

After resolving all conflicts in a file:

```bash
git add <resolved-file>
```

After all conflicts are resolved:

```bash
# Verify no unresolved conflicts remain
git status

# If all conflicts resolved, continue rebase
git rebase --continue
```

### Step 6: Validate Resolution

After rebase completes:

```bash
# Run type checking
npm run typecheck

# Run tests
npm test
```

If validation fails:
- Review the resolution
- Fix any introduced errors
- Commit the fixes

### Step 7: Summary

Output a clear summary:

```
✅ Merge conflicts resolved for PR #<number>: <title>

📋 Resolved files:
- frontend/src/stores/dataStore.ts (Strategy A: PR changes win)
- backend/src/routes/favorites.ts (Strategy C: Merged both changes)
- shared/types/index.ts (Strategy D: Rewrote for compatibility)

🔍 PR Intent:
<summary of what PR was trying to accomplish>

✅ Resolution validated:
- TypeScript: ✓ Passing
- Tests: ✓ Passing

▶️ Next steps:
1. Review the resolved conflicts in each file
2. Push the resolved branch: git push origin <branch> --force-with-lease
3. PR #<number> should now be ready for merge
```

---

## Resolution Strategies in Detail

### Strategy A: PR Changes Win

**When to use:**
- PR introduces new functionality
- Base branch has formatting/style changes only
- PR changes don't conflict with base branch logic

**Example:**
```typescript
// BASE: Reformatted existing function
function fetchCafes() {
  return api.cafes.getAll()
}

// PR: Added new function
function fetchUserFavorites() {
  return api.favorites.getAll()
}

// RESOLUTION: Keep both, apply base formatting to PR code
function fetchCafes() {
  return api.cafes.getAll()
}

function fetchUserFavorites() {
  return api.favorites.getAll()
}
```

### Strategy B: Base Branch Changes Win

**When to use:**
- Base branch has critical bug fixes
- Base branch has major refactoring
- PR code is outdated/incompatible

**Example:**
```typescript
// BASE: Renamed function
export async function getUserProfile(userId: string) { ... }

// PR: Still uses old name
const profile = await fetchUserProfile(userId)

// RESOLUTION: Update PR to use new API
const profile = await getUserProfile(userId)
```

### Strategy C: Merge Both Changes

**When to use:**
- Both branches add different features
- Changes are complementary
- Both are necessary

**Example:**
```typescript
// BASE: Added new import
import { PrimaryButton } from '@/components/ui'

// PR: Added different import
import { api } from '@/utils/api'

// RESOLUTION: Include both
import { PrimaryButton } from '@/components/ui'
import { api } from '@/utils/api'
```

### Strategy D: Rewrite for Compatibility

**When to use:**
- API/interface changed in base branch
- PR logic is valid but implementation outdated
- Need to preserve PR intent with new API

**Example:**
```typescript
// BASE: Changed component API
<AlertDialog
  variant="error"
  title="Error"
  message={errorMessage}
  primaryAction={{ label: "OK", onClick: handleClose }}
/>

// PR: Using old API
<AlertDialog
  type="error"
  text={errorMessage}
  onClose={handleClose}
/>

// RESOLUTION: Rewrite PR code with new API, preserve intent
<AlertDialog
  variant="error"
  title="Error"
  message={errorMessage}
  primaryAction={{ label: "OK", onClick: handleClose }}
/>
```

---

## Common Conflict Patterns

### Pattern 1: Import Conflicts

**Cause:** Both branches add/remove imports

**Resolution:**
1. Merge both import additions
2. Remove duplicate imports
3. Sort imports (React → libraries → local)
4. Remove unused imports

### Pattern 2: Type Definition Conflicts

**Cause:** Both branches modify same interface/type

**Resolution:**
1. Identify which fields are added by each branch
2. Merge all new fields
3. Ensure no duplicate fields
4. Check for type compatibility

### Pattern 3: Function/Component Conflicts

**Cause:** Both branches modify same function

**Resolution:**
1. Understand logic changes in each branch
2. If logic is independent, merge both changes
3. If logic conflicts, prefer base branch and adapt PR
4. Maintain function signature compatibility

### Pattern 4: Store/State Conflicts

**Cause:** Both branches add state or actions

**Resolution:**
1. Merge all new state fields
2. Merge all new actions
3. Check for naming conflicts
4. Ensure state updates don't conflict

### Pattern 5: Config/Constant Conflicts

**Cause:** Both branches modify feature flags, constants, etc.

**Resolution:**
1. Merge all new config values
2. If same key modified differently, prefer base branch
3. Ensure config structure is valid
4. Update any dependent code

---

## MatchaMap-Specific Conflict Resolution

### COPY Constants Conflicts

```typescript
// CONFLICT: Both branches add new copy
<<<<<<< HEAD
export const COPY = {
  favorites: {
    title: 'My Favorites',
    empty: 'No favorites yet'
  }
}
=======
export const COPY = {
  profile: {
    title: 'Profile',
    edit: 'Edit Profile'
  }
}
>>>>>>> pr-branch

// RESOLUTION: Merge both sections
export const COPY = {
  favorites: {
    title: 'My Favorites',
    empty: 'No favorites yet'
  },
  profile: {
    title: 'Profile',
    edit: 'Edit Profile'
  }
}
```

### API Client Conflicts

```typescript
// CONFLICT: Both branches add new API modules
<<<<<<< HEAD
export const api = {
  cafes: cafeAPI,
  favorites: favoritesAPI
}
=======
export const api = {
  cafes: cafeAPI,
  reviews: reviewsAPI
}
>>>>>>> pr-branch

// RESOLUTION: Merge both modules
export const api = {
  cafes: cafeAPI,
  favorites: favoritesAPI,
  reviews: reviewsAPI
}
```

### Type Conflicts

```typescript
// CONFLICT: Both branches add fields to Cafe type
<<<<<<< HEAD
export interface Cafe {
  id: string
  name: string
  isFavorite?: boolean
}
=======
export interface Cafe {
  id: string
  name: string
  reviewCount: number
}
>>>>>>> pr-branch

// RESOLUTION: Merge both fields
export interface Cafe {
  id: string
  name: string
  isFavorite?: boolean
  reviewCount: number
}
```

### Route/Component Conflicts

```typescript
// CONFLICT: Both branches add routes
<<<<<<< HEAD
<Route path="/favorites" element={<FavoritesPage />} />
=======
<Route path="/reviews" element={<ReviewsPage />} />
>>>>>>> pr-branch

// RESOLUTION: Include both routes
<Route path="/favorites" element={<FavoritesPage />} />
<Route path="/reviews" element={<ReviewsPage />} />
```

---

## Troubleshooting

### "Can't resolve conflict automatically"

**Cause:** Changes are too complex or contradictory

**Solution:**
1. Read the full file context (not just conflict markers)
2. Review PR description for intent
3. Check commit messages in PR for context
4. If still unclear, ask: "The changes appear contradictory. Should I <option A> or <option B>?"

### "TypeScript errors after resolution"

**Cause:** Resolved code doesn't match updated types/APIs

**Solution:**
1. Check if base branch updated related types/interfaces
2. Update resolved code to match new type signatures
3. Add missing imports
4. Fix any type mismatches

### "Tests fail after resolution"

**Cause:** Resolved code changes behavior

**Solution:**
1. Check if base branch updated tests
2. Update tests to match new behavior if appropriate
3. If PR tests are outdated, update them to base branch patterns

### "Git won't continue rebase"

**Cause:** Some conflicts still unresolved or not staged

**Solution:**
```bash
# Check status
git status

# Look for any remaining "UU" (unmerged) files
# Resolve them, then:
git add <files>
git rebase --continue
```

---

## Safety Checks

Before marking complete:

- [ ] All merge conflict markers removed (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] `git status` shows no unmerged files
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] PR intent preserved in resolution
- [ ] MatchaMap patterns followed (COPY, api, shared UI)
- [ ] No regression in existing functionality

---

## MCP Tools Reference

**Get PR details:**
```typescript
mcp__github__pull_request_read({
  owner: 'keving3ng',
  repo: 'matchamap',
  pullNumber: <number>,
  method: 'get' | 'get_diff' | 'get_files'
})
```

**Get specific commit:**
```typescript
mcp__github__get_commit({
  owner: 'keving3ng',
  repo: 'matchamap',
  sha: '<commit-sha>'
})
```

---

## When to Abort

**Abort the conflict resolution if:**
- No rebase is in progress (checked in Step 0)
- PR number is invalid or not found
- Conflicts are too complex to resolve confidently
- Need human review for critical logic changes

**To abort rebase safely:**
```bash
git rebase --abort
```

Then notify user:
```
⚠️ Conflict resolution aborted.

Reason: <why>

Recommendation: <what to do instead>
```

---

## Tips for Success

1. **Always start with PR intent** - Understand the "why" before resolving
2. **Prefer Strategy C (merge both)** - When in doubt, keep both changes
3. **Follow MatchaMap patterns** - Consistency is critical
4. **Test after resolution** - Always validate with typecheck + tests
5. **Use Edit tool carefully** - Include enough context to match uniquely
6. **Read full file context** - Don't just look at conflict markers
7. **Check related files** - Resolution might need updates elsewhere
8. **Document complex resolutions** - Add comments explaining why

---

## Example Run

```
$ /resolve-conflicts 285

✓ Rebase in progress detected

Fetching PR #285 details...
PR: "feat(favorites): add user favorites feature"

Understanding intended changes...
- Added user_favorites table
- Added /api/favorites endpoints
- Added FavoritesButton component
- Updated Cafe type with isFavorite field

Identifying conflicts...
Found 3 files with conflicts:
1. shared/types/index.ts
2. frontend/src/components/AppRoutes.tsx
3. frontend/src/constants/copy.ts

Resolving shared/types/index.ts...
Strategy: Merge both changes (added isFavorite + reviewCount fields)
✓ Resolved

Resolving frontend/src/components/AppRoutes.tsx...
Strategy: Merge both changes (added /favorites + /reviews routes)
✓ Resolved

Resolving frontend/src/constants/copy.ts...
Strategy: Merge both changes (added favorites + reviews sections)
✓ Resolved

Staging resolved files...
✓ All conflicts resolved

Continuing rebase...
✓ Rebase completed

Validating resolution...
Running typecheck... ✓ Pass
Running tests... ✓ Pass (100%)

✅ Merge conflicts resolved successfully!

📋 Summary:
- 3 files resolved using Strategy C (merge both)
- All MatchaMap patterns maintained
- Type safety preserved
- Tests passing

▶️ Next: git push origin feature/favorites --force-with-lease
```
