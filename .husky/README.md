# Git Hooks Configuration

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Available Hooks

### `pre-commit` (Default)
Runs comprehensive checks before each commit:
- ✅ TypeScript typecheck across all workspaces
- ✅ Unit tests (frontend) in CI mode (non-watch)

This ensures code quality but may be slower for large commits (~7-10 seconds).

### `pre-commit-fast` (Alternative)
Runs only typecheck, skipping tests for faster commits:
- ✅ TypeScript typecheck only
- ⏭️ Skips tests (run manually with `npm run test:ci`)

## Switching Between Hooks

### Use fast pre-commit (typecheck only)
```bash
mv .husky/pre-commit .husky/pre-commit-full
mv .husky/pre-commit-fast .husky/pre-commit
chmod +x .husky/pre-commit
```

### Restore full pre-commit (typecheck + tests)
```bash
mv .husky/pre-commit .husky/pre-commit-fast
mv .husky/pre-commit-full .husky/pre-commit
chmod +x .husky/pre-commit
```

## Bypassing Hooks (Emergency Only)

If you need to bypass hooks for an urgent commit:
```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning:** Only use `--no-verify` in emergencies. Always fix issues properly.

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
- **Current Status**: 762/920 tests passing (see `docs/TESTING.md`)
