# Branch protection (`main`)

Configure **Settings → Branches → Branch protection rule** for `main`.

## Required status checks

Use the exact names GitHub shows after a workflow run (case-sensitive). Current CI (`.github/workflows/ci.yml`) exposes:

| Check name (typical) | Role |
|---------------------|------|
| **Static checks** | Typecheck (blocking); lint & audit (advisory in workflow) |
| **Frontend tests (shard 1/2)** | Frontend Vitest shard |
| **Frontend tests (shard 2/2)** | Frontend Vitest shard |
| **Backend tests** | Backend Vitest |

**PRs:** Require the checks above. **Build** and **Deploy backend** only run on pushes to `main`, not on PRs—do not require them for merge (they will not appear on PR runs).

**After changing workflow job `name:` fields**, update this list and branch protection to match.

## Suggested rule settings

- Require a pull request before merging (with review as your team prefers).
- Require status checks to pass before merging; require branches to be up to date.
- Do not allow force-push or deletion on `main` (recommended).

## Troubleshooting

If a check name is missing from the dropdown, open a PR and let CI finish once so GitHub registers the check names.

See **CI/CD (GitHub Actions)** in `CLAUDE.md` for cost-aware workflow guidelines.
