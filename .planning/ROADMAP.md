# Roadmap: PWA install + offline cafe cache

**Created:** 2026-03-22  
**Granularity:** Coarse (4 phases)  
**Project:** `.planning/PROJECT.md` · **Issue:** [#432](https://github.com/keving3ng/matchamap/issues/432)

## Overview

| # | Phase | Goal | Requirements |
|---|-------|------|----------------|
| 1 | PWA foundation | Installable shell: manifest, icons, SW registration, precache | MANF-01 — SW-02 |
| 2 | API runtime cache | Degraded-network cafe data with sane invalidation | SW-03 — SW-04 |
| 3 | Install & offline UX | Discoverable install paths + offline banner (`COPY`) | UX-01 — UX-03 |
| 4 | Quality & ship | Budgets, LCP, device checks, document tile limits | QUAL-01 — QUAL-03 |

**Coverage:** All v1 requirements mapped ✓

---

## Phase 1: PWA foundation

**Goal:** Site meets installability basics and loads cached shell offline.

**Requirements:** MANF-01, MANF-02, MANF-03, SW-01, SW-02

**Success criteria:**

1. Lighthouse (or equivalent) reports manifest and install criteria met for production build.
2. Repeat visit loads core shell without network (precached assets) in a controlled test.
3. No persistent “broken” dev experience — SW policy for `npm run dev` is defined and documented.

**UI hint:** no (infrastructure; minimal user-facing copy)

---

## Phase 2: API runtime cache

**Goal:** Last-fetched public cafe list remains available offline per city/query; stale data rules are explicit.

**Requirements:** SW-03, SW-04

**Success criteria:**

1. With network, app shows current API data; with network disabled, last successful cafe response for the active city is shown (or clear empty state).
2. After admin content change + online refresh, user does not keep stale data indefinitely (strategy documented and verified).
3. Switching city does not show another city’s cached cafes offline.

**UI hint:** no (behavioral; banner comes in Phase 3)

---

## Phase 3: Install & offline UX

**Goal:** Users discover install and understand degraded mode.

**Requirements:** UX-01, UX-02, UX-03

**Success criteria:**

1. From primary navigation surfaces, user can reach install instructions or trigger install where the platform allows.
2. Offline or API failure shows a clear, dismissible or non-blocking message using `COPY` only.
3. iOS users see accurate guidance (no fake universal install button where unsupported).

**UI hint:** yes

---

## Phase 4: Quality & ship

**Goal:** Ship with confidence on performance and honest limitations.

**Requirements:** QUAL-01, QUAL-02, QUAL-03

**Success criteria:**

1. `bundle:check` (and any related CI) passes on the branch; deltas noted if budgets change.
2. LCP measured on a cold load remains within project targets or documented exception.
3. Limitation on offline map tiles is visible in product or help copy as agreed.

**UI hint:** no (verification + copy audit)

---

## Notes

- **Metrics** from #432 (install rate, SW fallback usage) may be implemented as analytics events where the codebase already tracks stats — defer detail to `plan-phase` if not yet designed.
