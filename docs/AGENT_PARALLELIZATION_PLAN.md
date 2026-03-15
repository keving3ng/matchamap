# MatchaMap Agent Parallelization Plan

**Purpose:** Run the [Simplification Plan](./SIMPLIFICATION_PLAN.md) with multiple agents in parallel. Use this when coordinating AI agents (e.g. Cursor subagents) or human contributors to execute tasks concurrently.

**Related:** [PRODUCT_FOUNDATION.md](./PRODUCT_FOUNDATION.md) | [SIMPLIFICATION_PLAN.md](./SIMPLIFICATION_PLAN.md)

---

## Dependency Graph

```
                    ┌─────────────────────────────┐
                    │ Phase 1: Feature flags       │
                    │ (features.yaml prod values)  │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
        ┌───────────▼──────────┐     ┌─────────────▼────────────┐
        │ Phase 2A: Nav &      │     │ Phase 2B: Routes &        │
        │ Header cleanup       │     │ component guards          │
        └───────────┬──────────┘     └─────────────┬──────────────┘
                    │                              │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼───────┐      ┌───────────▼───────────┐    ┌───────▼───────┐
│ Phase 3:      │      │ Phase 4A: Docs update  │    │ Phase 4B:    │
│ Backend       │      │ (README, CLAUDE, etc.) │    │ Docs archive │
│ deprecation   │      └───────────────────────┘    └──────────────┘
└───────────────┘                │                           │
                                 └───────────┬───────────────┘
                                             │
                                 ┌───────────▼───────────┐
                                 │ Phase 4C: GitHub      │
                                 │ (issues, labels,      │
                                 │ description)          │
                                 └───────────────────────┘
```

**Phase 1** blocks everything. **Phase 2A and 2B** can run in parallel. **Phase 3, 4A, 4B** can run in parallel after Phase 2. **Phase 4C** can run in parallel with 3/4A/4B or after.

---

## Wave 1: Phase 1 (Single Agent, Fast)

**Prerequisite:** None

| Task | Agent Type | Description |
|------|------------|-------------|
| 1.1 Update `features.yaml` prod values | `generalPurpose` or manual | Set `ENABLE_USER_ACCOUNTS: false`, `ENABLE_USER_SOCIAL: false`, `ENABLE_ABOUT: true` for prod |
| 1.2 Add admin login entry point (if needed) | `generalPurpose` | Ensure `/login` or hidden "Admin" link remains reachable when user accounts "off" for public |

**Output:** Feature flags applied; deploy to verify prod shows simplified product.

---

## Wave 2: Phase 2 (2 Parallel Agents)

**Prerequisite:** Phase 1 complete

### Track A: Navigation & Header

| Task | Agent Type | Description |
|------|------------|-------------|
| 2A.1 Audit Header.tsx | `explore` | Find all nav items that should hide when flags off |
| 2A.2 Guard Header items | `generalPurpose` | Wrap Sign In, My Profile, Shop, Settings in feature-flag checks; ensure About and vivisual.diary links visible when ENABLE_ABOUT |
| 2A.3 Audit Menu (if exists) | `explore` | Same as Header |
| 2A.4 Guard Menu items | `generalPurpose` | Feature-flag guards for menu items |

**Suggested agent prompt:** *"Given PRODUCT_FOUNDATION.md and SIMPLIFICATION_PLAN.md Phase 2.2, update Header and Menu so Sign In, My Profile, Shop, Settings are hidden when ENABLE_USER_ACCOUNTS or ENABLE_USER_SOCIAL are false; ensure About and vivisual.diary links show when ENABLE_ABOUT is true."*

---

### Track B: Routes & Components

| Task | Agent Type | Description |
|------|------------|-------------|
| 2B.1 Audit AppRoutes.tsx | `explore` | List routes for /profile, /leaderboards, /store, /settings |
| 2B.2 Guard or remove routes | `generalPurpose` | Ensure leaderboards, store, settings routes only render when their flags are on; profile same for ENABLE_USER_PROFILES |
| 2B.3 Find check-in, review, photo UI | `explore` | Search DetailView and related components for "I've been here", review form, photo upload |
| 2B.4 Add feature-flag guards to components | `generalPurpose` | Wrap check-in, user review create, photo upload UI in `ENABLE_USER_SOCIAL` or specific flag checks |
| 2B.5 Remove or hide leaderboard links | `generalPurpose` | Nav/footer links to /leaderboards when flag off |

**Suggested agent prompt:** *"Given SIMPLIFICATION_PLAN Phase 2.1 and 2.3, guard AppRoutes and detail-page components so leaderboards, store, settings, profile routes and check-in/review/photo UI only show when their feature flags are enabled."*

---

## Wave 3: Phase 3 & Phase 4 (4 Parallel Agents)

**Prerequisite:** Phase 2 complete

### Track C: Backend Deprecation

| Task | Agent Type | Description |
|------|------------|-------------|
| 3.1 List social API routes | `explore` | `grep` or search backend/src for checkins, photos, profile, follow, favorites, lists, notifications, badges, leaderboards, reviews, recommendations |
| 3.2 Add deprecation comments | `generalPurpose` | Add `// DEPRECATED: out of scope per PRODUCT_FOUNDATION` to route registrations or handlers |
| 3.3 Document admin-only auth | `generalPurpose` | Update docs (e.g. DEPLOYMENT, QUICKSTART) to state auth is admin-only; no public registration |

**Suggested agent prompt:** *"Search backend/src for social API routes (checkins, photos, profile, follow, favorites, lists, notifications, badges, leaderboards, reviews, recommendations). Add deprecation comments. Do not remove routes or drop tables."*

---

### Track D: Docs Update (README, CLAUDE, docs/README)

| Task | Agent Type | Description |
|------|------------|-------------|
| 4D.1 Update root README | `generalPurpose` | Already partially done; verify matches PRODUCT_FOUNDATION |
| 4D.2 Update CLAUDE.md | `generalPurpose` | Already partially done; verify Key Features and Auth sections |
| 4D.3 Update docs/README.md | `generalPurpose` | Verify product direction section; trim social/feed references |

**Note:** Much of this was done in the initial simplification doc pass. Agent can verify consistency.

---

### Track E: Docs Archive

| Task | Agent Type | Description |
|------|------------|-------------|
| 4E.1 Move social-features-guide.md | `shell` | `mv docs/social-features-guide.md docs/archive/` |
| 4E.2 Add deprecation banner to archived doc | `generalPurpose` | Top of file: "Out of scope for current product; see PRODUCT_FOUNDATION.md" |
| 4E.3 Archive social-features-analytics-prd.md | `shell` | Move to archive |
| 4E.4 Simplify user-guide/getting-started.md | `generalPurpose` | Remove sign-up, check-ins, reviews, profile; keep map/list/events/about |
| 4E.5 Archive feed-refactoring-plan.md | `shell` | Move to archive |
| 4E.6 Update or archive PARALLEL_EXECUTION_PLAN.md | `generalPurpose` | Add banner: references old social roadmap; see SIMPLIFICATION_PLAN and this doc |

**Suggested agent prompt:** *"Move social-features-guide.md, social-features-analytics-prd.md, feed-refactoring-plan.md to docs/archive/. Add deprecation banner to social-features-guide. Simplify user-guide/getting-started to only describe map, list, events, about—no sign-up or social."*

---

### Track F: GitHub

| Task | Agent Type | Description |
|------|------------|-------------|
| 4F.1 Update repo description | `generalPurpose` (or MCP) | "Curated guide to matcha cafes (Toronto +), events, and vivisual.diary" |
| 4F.2 Create pinned issue or update About | `generalPurpose` (or MCP) | Pointer to PRODUCT_FOUNDATION for out-of-scope features |
| 4F.3 Add labels (optional) | `generalPurpose` (or MCP) | `foundation`, `out-of-scope` |
| 4F.4 Close or relabel social-only issues | `generalPurpose` (or MCP) | Optional; list issues first, then close/relabel in batch |

**Suggested agent prompt:** *"Using GitHub MCP (or describe steps): Update repo description to 'Curated guide to matcha cafes (Toronto +), events, and vivisual.diary'. Add label 'out-of-scope' and apply to issues that are purely social-feature work."*

---

## Agent Type Reference

| Type | Use For |
|------|---------|
| `explore` | Finding files, searching codebase, listing routes/components |
| `generalPurpose` | Editing files, adding guards, updating docs, refactors |
| `shell` | File moves, git ops, running commands |

**Launch parallel agents:** Send Track A and Track B prompts in the same turn (Wave 2). Send Track C, D, E, F prompts in the same turn (Wave 3).

---

## Execution Order Summary

| Wave | Tracks | Parallel? |
|------|--------|-----------|
| 1 | Phase 1 (feature flags) | No (single agent) |
| 2 | Track A (Nav), Track B (Routes) | Yes (2 agents) |
| 3 | Track C (Backend), D (Docs), E (Archive), F (GitHub) | Yes (4 agents) |

**Total:** 1 + 2 + 4 = up to 7 agents across 3 waves (with 2 and 4 running in parallel within their waves).
