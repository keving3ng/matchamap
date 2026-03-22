# MatchaMap — PWA install + offline cafe cache

## What This Is

MatchaMap is a **mobile-first curated guide** to matcha cafes (map, list, detail, events, About, optional Passport, admin-backed content). This planning track adds **[GitHub #432](https://github.com/keving3ng/matchamap/issues/432)**: an **installable PWA** with a **modest offline read cache** of cafe data so the app **degrades gracefully** on poor mobile networks—without pretending map tiles work fully offline.

## Core Value

Visitors can **open MatchaMap reliably on the go** (installed or in-browser) and still **browse already-loaded cafe information** when the network drops; install UX increases **return visits** without an app store.

## Requirements

### Validated

- ✓ **Curated cafe guide** — Map (Leaflet), list, detail, sorting/filtering, expert content — *existing*
- ✓ **API-backed data** — Cafes (and related) via Cloudflare Worker + D1; centralized `api` client — *existing*
- ✓ **Performance discipline** — Lazy routes, chunk budgets, bundle checks — *existing*
- ✓ **Editorial workflow** — Admin updates content without redeploying the static shell for copy — *existing*

### Active

- [ ] **Web App Manifest** — Name, icons, theme, `start_url`, display mode suitable for install
- [ ] **Service worker** — Precache shell + static assets; runtime strategy for cafe list API responses (per city / query), with a clear invalidation approach when content or deploy changes
- [ ] **Install UX** — Discoverable “Install MatchaMap” (e.g. About and/or footer) using `COPY` constants
- [ ] **Offline / degraded network UX** — Clear banner or state when API unreachable; honest messaging
- [ ] **Quality gates** — No unjustified LCP or bundle-size regression; document that **map tiles are not fully offline**

### Out of Scope

- **Full offline map tiles** — Leaflet tile layers are heavy; document limitation instead of caching full slippy maps
- **Full offline editing / admin** — Admin remains online; out of scope for this track
- **Push notifications / background sync** — Not required for #432

## Context

- **Audience:** On-the-go mobile users (weak 4G, transit); install prompt reduces friction vs app stores.
- **Repo:** Monorepo — `frontend` (Vite + React 19), `backend` (Worker), `shared` types. Frontend ships as static assets (e.g. Cloudflare Pages).
- **Starting point:** There is **no** `vite-plugin-pwa` dependency in `frontend/package.json` today; #432 explicitly allows **Workbox** (via `vite-plugin-pwa`) or a **lightweight custom** SW—choose during implementation with bundle and maintenance tradeoffs.
- **Related doc:** `.planning/codebase/ARCHITECTURE.md` — request flow and layering; update if PWA section drifts after implementation.

## Constraints

- **Performance:** LCP and gzipped bundle budgets in `CLAUDE.md` / CI — PWA additions must stay within or justify changes
- **Content freshness:** Cafe data changes in admin; cache strategy must not silently serve **stale** data indefinitely
- **iOS Safari:** Test install + SW behavior; PWA capabilities differ from Chromium
- **Copy:** All user-facing strings via `frontend/src/constants/copy.ts`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope anchored to **#432** | Single source for proposal, metrics, out-of-scope | — Pending |
| **Tiles offline** excluded | Issue + product honesty; technical weight | — Pending |
| Workbox vs custom SW | Trade maintainability vs bundle; align with `vite-plugin-pwa` if adopted | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after initialization (#432, brownfield)*
