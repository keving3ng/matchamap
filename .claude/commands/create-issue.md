---
description: Create a well-formatted GitHub issue following project templates
args:
  - name: description
    description: Brief description of the issue to create
    required: true
---

You are helping create a GitHub issue for the MatchaMap project. Based on the user's description, you need to:

## Step 1: Understand the Issue

Analyze the user's description and determine:
- **Type**: Is this a bug, feature, enhancement, documentation, or tech debt?
- **Scope**: What parts of the codebase does this affect? (frontend, backend, map, admin, social, etc.)
- **Priority**: How urgent is this? (high, medium, low)
- **Complexity**: Is this a simple fix or a complex feature?

Ask clarifying questions if the description is too vague:
- What is the expected behavior?
- What is the current behavior (for bugs)?
- What are the specific acceptance criteria?
- Are there any technical constraints or dependencies?

## Step 2: Analyze Project Context

Review relevant parts of the codebase to:
- Identify which files will likely need changes
- Understand existing patterns and architecture
- Find similar issues or implementations for reference
- Check if there are existing components/utilities that can be reused

**Key project guidelines to follow** (from CLAUDE.md):
- Always use shared UI components from `frontend/src/components/ui/` (Button, Badge, AlertDialog, Skeleton)
- Always use COPY constants from `frontend/src/constants/copy.ts` for user-facing strings
- Always use API client from `frontend/src/utils/api.ts` (never direct fetch)
- Always use design tokens from `frontend/src/styles/spacing.ts`
- Mobile-first design (320px base, then scale up)
- Performance targets: LCP < 2.5s, bundle < 100KB per page
- TypeScript strict mode (no `any` types)

## Step 3: Draft Comprehensive Issue

Create a detailed issue following this template structure:

```markdown
**Priority:** [High | Medium | Low]

[Clear, concise description of the problem or feature request]

**Current Behavior:** (for bugs)
- What's happening now
- Steps to reproduce

**Expected Behavior:**
- What should happen instead

**Acceptance Criteria:**
- [ ] Specific, testable requirement 1
- [ ] Specific, testable requirement 2
- [ ] Specific, testable requirement 3
- [ ] Works on mobile (320px) and desktop
- [ ] TypeScript compiles without errors
- [ ] Performance budget maintained

**Implementation Notes:**

**Recommended Approach:**
[Detailed technical guidance on how to implement this]

**Files to Create/Modify:**
- `path/to/file1.tsx` - Description of changes
- `path/to/file2.ts` - Description of changes

**Code Examples:**
```typescript
// Example implementation or pattern to follow
```

**Project Guidelines to Follow:**
- [ ] Use shared UI components from @/components/ui (PrimaryButton, AlertDialog, etc.)
- [ ] Use COPY constants for all user-facing strings (COPY.section.key)
- [ ] Use api.ts client for all API calls (api.cafes.getAll(), etc.)
- [ ] Use design tokens from @/styles/spacing (spacing.cardPadding, etc.)
- [ ] Mobile-first design (base styles for 320px)
- [ ] Performance: animations 150-300ms, CSS transforms only
- [ ] TypeScript: strict mode, no `any` types

**Testing Plan:**
- [ ] Test case 1
- [ ] Test case 2
- [ ] Test on mobile (320px viewport)
- [ ] Test on slow 3G connection
- [ ] Verify no console errors

**Dependencies:**
[Any dependencies on other issues, features, or external libraries]

**Security Considerations:** (if applicable)
[Any security implications or requirements]

**Edge Cases:**
- Edge case 1 and how to handle it
- Edge case 2 and how to handle it
```

## Step 4: Suggest Appropriate Labels

Based on the issue analysis, suggest relevant labels from:

**Type Labels:**
- `bug` - Something isn't working
- `feature` - New feature
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements
- `tech-debt` - Technical debt

**Scope Labels:**
- `frontend` - Frontend/UI changes
- `backend` - Backend/API changes
- `map` - Map functionality
- `admin` - Admin panel features
- `social` - Social features
- `auth` - Authentication/authorization

**Priority Labels:**
- `high-priority` - High priority issue

**Other Labels:**
- `security` - Security-related issues
- `performance` - Performance optimization
- `ui` - UI/UX improvements
- `testing` - Testing related
- `mobile` - Mobile-specific
- `good first issue` - Good for newcomers

## Step 5: Suggest Milestone (if applicable)

Check if this should be part of the "V1 Launch" milestone or left unassigned.

## Step 6: Create the Issue

Once you have all the information, create the issue using the GitHub CLI:

```bash
gh issue create \
  --title "Clear, actionable title (imperative mood)" \
  --body "$(cat <<'EOF'
[Full issue body from template above]
EOF
)" \
  --label "label1,label2,label3" \
  --milestone "V1 Launch"  # Optional, omit if not applicable
```

## Step 7: Confirm and Provide Context

After creating the issue:
- Show the issue number and URL
- Provide a brief summary of what was created
- Suggest any related issues that should be linked
- Mention if this should block or be blocked by other issues

## Best Practices

**Title Guidelines:**
- Use imperative mood ("Add", "Fix", "Update", not "Adding", "Fixes")
- Be specific and actionable
- Keep under 60 characters if possible
- Examples:
  - ✅ "Fix map tiles not loading on city switch"
  - ✅ "Add user profile avatar upload"
  - ❌ "Map broken"
  - ❌ "Users need profiles"

**Body Guidelines:**
- Always include priority level
- Be comprehensive but concise
- Include code examples when helpful
- Reference project guidelines (CLAUDE.md)
- Suggest specific files to modify
- Include testing checklist
- Think about edge cases
- Consider performance implications
- Note any security concerns

**Label Guidelines:**
- Always include type label (bug/feature/enhancement/etc.)
- Include all relevant scope labels (can have multiple)
- Add priority label if high priority
- Add specialized labels when relevant (security, performance, etc.)

---

Now, based on the user's description: **{{description}}**

Create a comprehensive GitHub issue following the template and guidelines above.
