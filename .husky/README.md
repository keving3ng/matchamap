# Git Hooks Configuration

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Pre-commit Hook (Smart Bypass)

The `pre-commit` hook is **smart** and automatically bypasses expensive checks when only non-code files are changed.

### ✨ Automatic Bypass

The hook will **skip tests and typecheck** when ALL staged files match these patterns:

- `.github/workflows/` - GitHub Actions workflows
- `docs/` - Documentation
- `.husky/` - Git hooks themselves
- `README.md`, `CHANGELOG.md`, `LICENSE` - Project meta files
- `*.md` - Any markdown files
- Configuration files (`.gitignore`, `.npmrc`, `.nvmrc`)
- Lock files (`package-lock.json`)

**Example output when bypassed:**
```
✨ Only non-code files changed (workflows, docs, etc.)
📄 Changed files:
   - .github/workflows/auto-merge.yml
   - docs/workflow-guide.md
⚡ Skipping tests and typecheck (not needed for these files)
✅ Pre-commit checks bypassed!
```

### 🔍 Full Checks

When ANY code file (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, etc.) is staged, the hook runs:

1. **TypeScript typecheck** (`npm run typecheck`)
2. **Tests** (`npm run test:ci`)

**Example output:**
```
🔍 Running pre-commit checks...

📝 TypeScript type checking...
✓ No TypeScript errors found

🧪 Running tests...
✓ All 969 tests passed

✅ All pre-commit checks passed!
```

## Alternative Hooks

### `pre-commit-fast` (Typecheck Only)

If you want to **always** skip tests (and only run typecheck), use the fast hook:

```bash
mv .husky/pre-commit .husky/pre-commit-full
mv .husky/pre-commit-fast .husky/pre-commit
chmod +x .husky/pre-commit
```

**Note:** The smart bypass in the default hook is recommended for most workflows!

## Manual Override

To bypass checks manually (use sparingly!):

```bash
git commit --no-verify -m "message"
```

⚠️ **Warning:** Only use `--no-verify` in emergencies. Always fix issues properly.

## Adding More Bypass Patterns

To add more file patterns that should bypass checks, edit `.husky/pre-commit` and add to the `BYPASS_PATTERNS` array:

```bash
BYPASS_PATTERNS=(
  "^\.github/workflows/"     # GitHub Actions workflows
  "^docs/"                   # Documentation
  "^your-pattern-here/"      # Add your pattern
)
```

Patterns use regex syntax (grep -E).

## Troubleshooting

### Hook not running
```bash
# Re-install husky
npm run prepare
chmod +x .husky/pre-commit
```

### Hook failing incorrectly
```bash
# Test the commands manually
npm run typecheck
npm run test:ci
```

### Uninstalling hooks
```bash
# Remove husky
npm uninstall husky
rm -rf .husky
```

## What Gets Checked

- **TypeScript**: All `.ts` and `.tsx` files in frontend, backend, and shared workspaces
- **Tests**: All test files in `frontend/src/**/__tests__/**`
- **Current Status**: 969/969 tests passing ✅ (see `docs/TESTING.md`)
