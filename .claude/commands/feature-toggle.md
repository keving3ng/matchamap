---
description: Add a new feature flag to the config
args:
  - name: feature_name
    description: Name of the feature flag (e.g., ENABLE_SEARCH, SHOW_EVENTS)
    required: true
  - name: default_value
    description: Default value (true/false)
    required: false
---

Add a new feature toggle to the MatchaMap feature flag system.

## Steps:

1. **Update feature config file** (`src/config/features.yaml`):
   - Add the new feature flag with the provided name in SCREAMING_SNAKE_CASE
   - Set default value to {{default_value}} (defaults to `false` if not provided)
   - Add a comment explaining what the feature controls

2. **Update TypeScript types** (`src/types/index.ts`):
   - Add the new feature flag to the `FeatureFlags` interface
   - Ensure type safety across the codebase

3. **Create or update the feature hook** (`src/hooks/useFeatureToggle.ts`):
   - If it doesn't exist, create a hook that reads from `features.yaml`
   - Export a typed hook: `useFeatureFlag(flag: keyof FeatureFlags): boolean`
   - Implement caching to avoid re-reading the file

4. **Usage example** - Show how to use the new feature flag:
   ```tsx
   import { useFeatureFlag } from '@/hooks/useFeatureToggle'

   export function MyComponent() {
     const is{{feature_name}}Enabled = useFeatureFlag('{{feature_name}}')

     if (!is{{feature_name}}Enabled) {
       return null
     }

     return <div>Feature content here</div>
   }
   ```

5. **Document the feature flag**:
   - Add entry to CLAUDE.md's feature flags section (if exists)
   - Note: No environment variables needed - all flags are in YAML

## Implementation Notes:

- Feature flags are version-controlled (no .env needed)
- Type-safe via TypeScript interface
- No build-time injection required
- Easy to toggle without redeployment (just commit + push)

Create the feature flag now with the name: **{{feature_name}}**
