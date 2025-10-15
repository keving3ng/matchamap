# Fix PR Command

Handles PR feedback by switching branches, addressing blocking issues, and creating follow-up tasks.

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

You are tasked with handling feedback on a GitHub Pull Request. Follow these steps carefully:

### Step 1: Fetch and Analyze PR

First, determine the repository owner and name from the git remote:

```bash
git remote get-url origin
```

Parse the owner/repo from the URL (e.g., `keving3ng/matchamap`).

1. Use `mcp__github__get_pull_request` to get PR details including:

    - PR title and description
    - Source branch name (`head.ref`)
    - Target branch name (`base.ref`)
    - Current status (mergeable, state, draft, etc.)

2. Use `mcp__github__get_pull_request_comments` to get all review comments

3. Use `mcp__github__get_pull_request_status` to see CI/test status

4. Use `mcp__github__get_pull_request_reviews` to get formal reviews

5. Use `mcp__github__get_pull_request_files` to see which files were changed in the PR

### Step 2: Switch to PR Branch

1. Check current branch: `git branch --show-current`

2. If not on the PR branch:

    - Fetch the latest: `git fetch origin`
    - Switch to branch: `git checkout <pr-branch-name>`
    - Pull latest changes: `git pull origin <pr-branch-name>`

3. Verify you're on the correct branch

### Step 3: Categorize Feedback

Analyze all comments and reviews. Classify each piece of feedback as either:

**BLOCKING** (must fix before merge):

-   Requested changes in formal reviews
-   Failing tests or CI checks
-   Merge conflicts
-   Critical bugs or security issues
-   Breaking changes
-   Code that doesn't match project patterns (check CLAUDE.md)
-   Missing required documentation
-   Type errors or linting failures

**FOLLOW-UP** (can be separate issues):

-   Nice-to-have improvements
-   Refactoring suggestions
-   Performance optimizations (non-critical)
-   Additional features suggested during review
-   Tech debt comments
-   Documentation enhancements
-   Test coverage improvements (if not blocking merge)

Create a clear summary showing:

```
BLOCKING ISSUES (must fix now):
1. [Description] - by @reviewer in comment link
2. ...

FOLLOW-UP TASKS (create issues):
1. [Description] - by @reviewer in comment link
2. ...
```

### Step 4: Check for Duplicate Issues

Before creating any follow-up issues, search existing issues to avoid duplicates:

1. Use `mcp__github__list_issues` with parameters:

    - `owner`: repository owner
    - `repo`: repository name
    - `state: "all"` to search open and closed issues
    - `per_page: 100` to get recent issues

2. For each follow-up task, search for similar issues:

    - Use `mcp__github__search_issues` with a query containing relevant keywords
    - Example query: `"repo:owner/repo review sorting"` for a review sorting feature
    - Check issue titles and descriptions for overlap
    - Look for issues with labels like: `enhancement`, `tech-debt`, `refactor`, `follow-up`

3. For each potential follow-up:
    - If similar issue exists: Note it (e.g., "Similar to #456 - consider commenting there instead")
    - If no duplicate found: Mark as "Ready to create"

### Step 5: Fix Blocking Issues

For each blocking issue:

1. Read the relevant code files mentioned in the feedback

2. Implement the fix following project guidelines:

    - Check `CLAUDE.md` for patterns and architecture rules
    - Use COPY constants for user-facing strings
    - Use API client for backend calls
    - Use shared UI components
    - Follow TypeScript strict mode
    - Maintain mobile-first approach

3. After each fix:

    - Run `npm run typecheck` to verify types
    - Run `npm test` to ensure tests pass
    - Run `npm run build` to verify build succeeds

4. Commit changes with clear messages:

    ```
    fix: address PR feedback - <specific issue>

    - <detail about what was fixed>
    - <detail about approach>

    Addresses feedback from @reviewer
    ```

### Step 6: Create Follow-Up Issues

For each non-duplicate follow-up task:

1. Create a well-structured issue using `mcp__github__create_issue`:

    - `owner`: repository owner
    - `repo`: repository name
    - `title`: Clear, actionable title
    - `body`: Detailed description including:
        - Context from PR review
        - Link to original PR comment
        - Suggested approach if provided
        - Acceptance criteria
    - `labels`: Array like `["follow-up", "enhancement"]` or `["follow-up", "tech-debt"]`

2. Add a comment to the PR linking the new issue using `mcp__github__add_issue_comment`:
    - This creates a comment on the issue, not the PR
    - Instead, note the issue number to include in the final PR summary comment (Step 7)

### Step 7: Push Changes

1. Push the fixes to the PR branch using git:

    ```bash
    git push origin <pr-branch-name>
    ```

2. Verify push succeeded by checking PR status using `mcp__github__get_pull_request`:

    - Check the `mergeable_state` field
    - Check for any merge conflicts

3. Add a summary comment to the PR using `mcp__github__add_issue_comment`:

    - `owner`: repository owner
    - `repo`: repository name
    - `issue_number`: PR number (PRs are issues in GitHub's API)
    - `body`: Summary in this format:

    ```markdown
    ### PR Feedback Addressed

    ✅ **Fixed blocking issues:**

    -   Issue 1: <description>
    -   Issue 2: <description>

    📋 **Created follow-up issues:**

    -   #<issue-number>: <title>
    -   #<issue-number>: <title>

    All blocking feedback has been addressed. Ready for re-review.
    ```

### Step 8: Final Verification

1. Check that CI/tests are now passing using `mcp__github__get_pull_request_status`:

    - Look at the `state` field (should be "success" or "pending")
    - List any failing checks

2. Verify no merge conflicts remain using `mcp__github__get_pull_request`:

    - Check `mergeable` field (should be `true`)
    - Check `mergeable_state` field

3. Confirm all blocking issues from Step 3 have been addressed

4. Provide a final summary to the user with:
    - Number of blocking issues fixed
    - List of commits pushed
    - Number of follow-up issues created (with issue numbers)
    - Current PR status (ready to merge / waiting for CI / needs re-review)
    - Next recommended action

## Notes

-   **Use MCP tools for GitHub operations**: All GitHub API interactions should use `mcp__github__*` tools (get_pull_request, create_issue, add_issue_comment, etc.)
-   **Use git CLI for branch operations**: Use standard git commands for checkout, fetch, pull, push
-   Always preserve existing PR commits - don't force push or rebase unless explicitly requested
-   If you encounter ambiguous feedback, ask the user for clarification before making changes
-   If a blocking issue requires significant architectural changes, discuss with the user first
-   Keep commits focused - one commit per logical fix
-   If tests fail after fixes, treat that as a new blocking issue and fix it
-   For MatchaMap specifically: Always check CLAUDE.md patterns (Copy constants, API client, shared UI components)

## MCP Tools Reference

**Pull Request Operations:**

-   `mcp__github__get_pull_request` - Get PR details
-   `mcp__github__get_pull_request_comments` - Get review comments
-   `mcp__github__get_pull_request_reviews` - Get formal reviews
-   `mcp__github__get_pull_request_files` - Get changed files
-   `mcp__github__get_pull_request_status` - Get CI/test status

**Issue Operations:**

-   `mcp__github__list_issues` - List issues with filters
-   `mcp__github__search_issues` - Search issues by query
-   `mcp__github__create_issue` - Create new issue
-   `mcp__github__add_issue_comment` - Add comment (works for PRs too, since PRs are issues)
