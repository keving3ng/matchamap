# Claude Code Slash Commands

Custom slash commands for MatchaMap development. These commands help automate common tasks and enforce project conventions.

## Available Commands

### `/migration <migration_name>`

Create a new database migration script file for D1/SQLite.

**Usage:**

```bash
/migration add_cafe_hours_table
/migration create_stats_tables
/migration add_neighborhood_index
```

**What it does:**

-   Generates timestamped migration file in `workers/migrations/`
-   Includes template with up/down migration sections
-   Follows D1/SQLite syntax
-   Provides commands to apply migrations locally and remotely

**Example output:**

```
workers/migrations/20251001_143022_add_cafe_hours_table.sql
```

---

### `/feature-toggle <feature_name> [default_value]`

Add a new feature flag to the YAML config system.

**Usage:**

```bash
/feature-toggle ENABLE_SEARCH false
/feature-toggle SHOW_EVENTS true
/feature-toggle ENABLE_USER_REVIEWS
```

**What it does:**

-   Updates `src/config/features.yaml` with new flag
-   Adds TypeScript types to `src/types/index.ts`
-   Creates/updates `useFeatureToggle` hook
-   Provides usage example for components
-   No environment variables needed (version-controlled)

**Example usage in code:**

```tsx
const isSearchEnabled = useFeatureFlag("ENABLE_SEARCH");
if (!isSearchEnabled) return null;
```

---

### `/tracking <event_type> [component_name]`

Add analytics tracking to components following the metrics-tracking PRD.

**Event Types:**

-   `cafe_view` - Track when cafe detail page is viewed
-   `cafe_directions` - Track directions button clicks
-   `cafe_passport` - Track passport marks
-   `cafe_instagram` - Track Instagram link clicks
-   `cafe_tiktok` - Track TikTok link clicks
-   `feed_click` - Track feed article clicks
-   `event_click` - Track event clicks

**Usage:**

```bash
/tracking cafe_view DetailView
/tracking cafe_directions
/tracking feed_click FeedPage
```

**What it does:**

-   Verifies tracking utilities exist in `src/utils/analytics.ts`
-   Adds tracking calls to appropriate component locations
-   Uses fire-and-forget pattern (won't block UI)
-   Imports necessary tracking functions
-   Verifies backend API endpoints exist

**Example tracking added:**

```tsx
// On mount tracking
useEffect(() => {
  trackCafeStat(cafe.id, 'view')
}, [cafe.id])

// Click tracking
onClick={() => trackCafeStat(cafe.id, 'directions')}
```

---

### `/deploy-check`

Run comprehensive pre-deployment checklist before shipping code.

**Usage:**

```bash
/deploy-check
```

**What it does:**

-   Runs `npm run typecheck` (must pass)
-   Runs `npm run build` (must succeed)
-   Checks bundle size (< 100KB target)
-   Verifies no console errors
-   Tests mobile viewport (320px)
-   Checks all core routes work
-   Validates git status
-   Provides deploy commands if ready

**Checklist includes:**

-   ✅ TypeScript strict mode passes
-   ✅ Build succeeds
-   ✅ Bundle size under budget
-   ✅ Mobile responsiveness
-   ✅ No runtime errors
-   ✅ Git status clean
-   ✅ Workers build (if applicable)

**Output:**

```
Status: READY TO SHIP ✅
or
Status: BLOCKED ❌ (with list of issues)
```

---

## How Slash Commands Work

Slash commands are markdown files in `.claude/commands/` that expand into prompts for Claude Code.

1. **Type the command** in Claude Code chat: `/migration add_users_table`
2. **Command expands** into a detailed prompt for Claude
3. **Claude executes** the task following the prompt instructions
4. **You get results** with code changes, files created, or checks run

## Creating Your Own Commands

Create a new `.md` file in `.claude/commands/`:

```markdown
---
description: Short description of what this command does
args:
    - name: arg_name
      description: What this argument is for
      required: true
---

Your detailed prompt instructions here.
Use {{arg_name}} to reference arguments.
```

## Command Conventions

-   **File naming**: Use `kebab-case.md` for command files
-   **Arguments**: Use `snake_case` for argument names
-   **Templates**: Use `{{arg_name}}` for variable substitution
-   **Descriptions**: Keep concise (one line)

## Tips

-   **Chain commands** for complex workflows:

    ```bash
    /migration add_stats_tables
    # (wait for completion)
    /tracking cafe_view DetailView
    # (wait for completion)
    /deploy-check
    ```

-   **Partial arguments** - If you omit optional args, Claude will infer or prompt:

    ```bash
    /tracking cafe_view
    # Claude will search for the right component
    ```

-   **Help text** - Commands include usage examples and validation

## Project-Specific Context

These commands are tailored for MatchaMap's architecture:

-   **React 18.3+** with TypeScript strict mode
-   **Zustand** for state management
-   **Tailwind CSS** with design tokens
-   **Cloudflare Workers + D1** backend
-   **Mobile-first** design principles
-   **Performance budget** < 100KB per page

See [CLAUDE.md](../../CLAUDE.md) for full project guidelines.

---

**Last Updated:** 2025-10-01
**Commands:** 4 (migration, feature-toggle, tracking, deploy-check)
**Status:** Production Ready
