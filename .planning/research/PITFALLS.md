# Pitfalls Research

**Domain:** PWA + API caching for content that changes in admin  
**Researched:** 2026-03-22

## Pitfall: Stale cafe list after admin edit

| Item | Detail |
|------|--------|
| **Warning signs** | Users see old hours/names after update |
| **Prevention** | Prefer **network-first** or short **SWR** with max age; bump cache on deploy; document “open online once to refresh” if needed |
| **Phase** | Runtime cache + QA |

## Pitfall: SW breaks dev workflow

| Item | Detail |
|------|--------|
| **Warning signs** | Stale assets in local dev |
| **Prevention** | `devOptions.enabled: false` or opt-in; clear SW in docs |
| **Phase** | Foundation |

## Pitfall: Bundle / LCP regression

| Item | Detail |
|------|--------|
| **Warning signs** | `bundle:check` fails; Lighthouse LCP > budget |
| **Prevention** | Measure before/after; lazy-load non-critical PWA helpers |
| **Phase** | All; gate in final QA |

## Pitfall: iOS install / SW limitations

| Item | Detail |
|------|--------|
| **Warning signs** | No `beforeinstallprompt`; different cache behavior |
| **Prevention** | Manual test matrix; progressive enhancement for install CTA |
| **Phase** | UX + QA |

## Pitfall: Caching wrong API URL

| Item | Detail |
|------|--------|
| **Warning signs** | Wrong city data after switching city offline |
| **Prevention** | Include **city id** (or full query) in cache key pattern |
| **Phase** | Runtime cache design |
