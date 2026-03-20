# Continuous integration (GitHub Actions)

## Workflow layout

- **Single workflow** (`.github/workflows/ci.yml`), **one job** named **CI**: one checkout, one `npm ci`, then typecheck → lint → audit → frontend tests → backend tests. **Build**, **migrations**, and **deploy** run only on **push to `main`** (not on pull requests from branches).

This minimizes GitHub-hosted **runner minutes** (no parallel fan-out that repeats installs).

## Forks and untrusted PRs

- Workflows triggered by **`pull_request`** from forks run with a **`GITHUB_TOKEN`** that has **no access to repository secrets** (e.g. `CLOUDFLARE_API_TOKEN`). Deploy and other secret-backed steps are **skipped** or **not defined** for those events; only the same **build/test/lint** steps that use the public token run.
- **Do not** use `pull_request_target` to run untrusted code with secrets unless you follow GitHub’s hardening guidance (not used here).

Pushes to **`main`** on this repo use secrets for deploy (trusted maintainers).

## Agent- and reviewer-friendly outputs

- **Lint:** ESLint uses **`eslint-formatter-gha`** (`-f gha`) so issues show as **annotations** on the PR **Files** tab in Actions (when lint is advisory). ESLint 9 does not ship the old `github` built-in formatter.
- **Tests:** Frontend Vitest emits **JUnit** at `frontend/test-results/junit.xml`. On **failure**, that file is uploaded as an artifact **`vitest-junit-frontend`** when the token allows (same-repo PRs / pushes). **Fork PRs** often cannot upload artifacts (read-only token); the upload step is non-blocking.

## Dependabot

- **npm** updates are configured for the **repository root** (`directory: "/"`) so **`package-lock.json`** stays in sync with the workspace (see `.github/dependabot.yml`). Do not rely on separate lockfiles per package without updating the root lockfile.

## Required checks

After changing job or workflow names, align **branch protection** with the exact check name shown in GitHub (see `.github/BRANCH_PROTECTION_SETUP.md`).
