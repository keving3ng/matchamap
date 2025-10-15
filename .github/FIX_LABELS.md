# Fix Labels - Auto-removal System

## Available Labels

These labels help track quality issues in PRs and are **automatically removed** when the corresponding checks pass:

| Label | Description | Removed When |
|-------|-------------|--------------|
| `fix-tests` | Tests are failing | Frontend Tests AND Backend Tests jobs pass |
| `fix-typecheck` | TypeScript type errors | Static Analysis job passes (includes typecheck) |
| `fix-build` | Build is failing | Build job passes |
| `fix-lint` | Linting errors | Static Analysis job passes (includes lint) |

## How It Works

1. **Manual Labeling**: Add these labels to PRs when you identify issues
2. **Automatic Removal**: The `auto-remove-fix-labels.yml` workflow runs after CI completes
3. **Smart Detection**: Labels are only removed when all required checks pass

## Usage Examples

### Scenario 1: PR with test failures
```bash
# Add label manually or via gh CLI
gh pr edit 123 --add-label "fix-tests"

# After tests are fixed and CI passes, label is auto-removed
```

### Scenario 2: Multiple issues
```bash
# Add multiple labels
gh pr edit 123 --add-label "fix-tests,fix-typecheck,fix-lint"

# As each check passes, corresponding labels are removed
# - Static Analysis passes → removes fix-typecheck and fix-lint
# - Tests pass → removes fix-tests
```

## Workflow Details

**Trigger**: Runs after the CI workflow completes on PRs

**Steps**:
1. Identifies the PR associated with the workflow run
2. Checks results of all CI jobs
3. Compares current PR labels with job results
4. Removes labels for passing checks

**Requirements**:
- PR must be open
- CI workflow must complete (success or failure)
- Labels must exist on the PR for removal to occur

## CI Job Mapping

The workflow maps labels to these CI jobs:

```yaml
fix-tests:
  - Frontend Tests
  - Backend Tests

fix-typecheck:
  - Static Analysis (typecheck step)

fix-build:
  - Build

fix-lint:
  - Static Analysis (lint step)
```

## Tips

- Use these labels for tracking issues across PRs
- Labels are visual indicators of what needs attention
- Automation ensures labels stay accurate as issues are resolved
- Can be combined with GitHub Projects for better tracking

## Debugging

To check if the workflow is running correctly:

```bash
# View workflow runs
gh run list --workflow=auto-remove-fix-labels.yml

# View specific run logs
gh run view <run-id> --log
```

## Configuration

The workflow file: `.github/workflows/auto-remove-fix-labels.yml`

To modify label rules, edit the `labelRules` object in the workflow script.
