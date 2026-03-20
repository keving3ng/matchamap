# Branch protection (`main`)

Configure **Settings → Branches → Branch protection rule** for `main`.

## Required status checks

Use the exact names GitHub shows after a workflow run (case-sensitive). Current CI (`.github/workflows/ci.yml`) exposes:

| Check name (typical) | Role |
|---------------------|------|
| **CI** | Single job: typecheck (blocking); lint & audit (advisory); frontend + backend tests; on `main` push only: build, migrate, deploy |

**PRs:** Require **CI** only. **Build / deploy** run inside the same job on pushes to `main` — they do not appear as separate checks on PRs from forks.

**After changing workflow job `name:` fields**, update this list and branch protection to match.

## Suggested rule settings

- Require a pull request before merging (with review as your team prefers).
- Require status checks to pass before merging; require branches to be up to date.
- Do not allow force-push or deletion on `main` (recommended).

## Troubleshooting

If a check name is missing from the dropdown, open a PR and let CI finish once so GitHub registers the check names.

See **CI/CD (GitHub Actions)** in `CLAUDE.md` and `docs/CI.md` for workflow behavior and fork safety.
