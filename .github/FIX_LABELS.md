# Fix Labels (manual / future automation)

Some teams use labels like `fix-tests`, `fix-typecheck` to track PR issues. **There is no `auto-remove-fix-labels` workflow in this repo right now** — if you add one, map it to the single **CI** job and the **step** that failed (see `docs/CI.md`).

## Conceptual mapping (if you automate)

| Label | Meaning | Cleared when |
|-------|---------|----------------|
| `fix-tests` | Frontend or backend tests failing | **CI** log shows Frontend + Backend test steps succeeded |
| `fix-typecheck` | TypeScript errors | **CI** log shows typecheck step succeeded |
| `fix-build` | Build failing | **CI** log shows Build step succeeded (`main` only) |
| `fix-lint` | Lint issues | **CI** log shows Lint step succeeded (lint is advisory and does not block merge) |

## Single required check

Branch protection should require **`CI`** only. See `.github/BRANCH_PROTECTION_SETUP.md`.
