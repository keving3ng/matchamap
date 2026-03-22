# Requirements: MatchaMap PWA (#432)

**Defined:** 2026-03-22  
**Core Value:** Visitors can open MatchaMap reliably on the go and browse already-loaded cafe information when the network drops; install UX supports return visits.

## v1 Requirements

### Manifest & installability

- [ ] **MANF-01**: App ships a valid Web App Manifest (name, `short_name`, `start_url`, `display`, theme/background colors)
- [ ] **MANF-02**: Maskable and/or standard PWA icons are built and referenced for required sizes
- [ ] **MANF-03**: Document head includes manifest link and theme color appropriate for installed mode

### Service worker & caching

- [ ] **SW-01**: Service worker registers in production builds; development behavior avoids confusing stale caches (disabled or clearly documented)
- [ ] **SW-02**: Precache includes application shell and static assets needed for initial load without network
- [ ] **SW-03**: Runtime caching applies to public `GET` cafe-list endpoints used by the app, with cache keys that respect **city / query** so the wrong city is not served offline
- [ ] **SW-04**: Strategy and/or versioning prevent indefinitely stale cafe data after admin edits or deploys (documented behavior)

### Install & offline UX

- [ ] **UX-01**: User can find an explicit “Install MatchaMap” (or equivalent) entry via About and/or footer using `COPY` strings only
- [ ] **UX-02**: When the network or API is unavailable, the user sees a clear, non-blocking offline/degraded state (copy via `COPY`)
- [ ] **UX-03**: Where supported, install affordance uses platform-appropriate patterns (`beforeinstallprompt` or iOS guidance copy)

### Quality & documentation

- [ ] **QUAL-01**: Bundle-size check (`bundle:check` / CI) passes; any change to budgets is justified and recorded
- [ ] **QUAL-02**: LCP remains within project targets or regression is documented with mitigation
- [ ] **QUAL-03**: User-facing or docs limitation: **map tiles are not fully cached offline** (aligns with #432)

## v2 Requirements

### Possible follow-ups (not v1)

- **PUSH-01**: Web push for new cafes or events (not in #432)
- **TILE-01**: Optional limited tile cache policy (high risk; explicitly out of v1)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full offline Leaflet tile coverage | Size, churn, complexity — #432 |
| Offline admin / content editing | Security and scope |
| Native app store wrappers | Web PWA only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MANF-01 | Phase 1 | Pending |
| MANF-02 | Phase 1 | Pending |
| MANF-03 | Phase 1 | Pending |
| SW-01 | Phase 1 | Pending |
| SW-02 | Phase 1 | Pending |
| SW-03 | Phase 2 | Pending |
| SW-04 | Phase 2 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 13 total  
- Mapped to phases: 13  
- Unmapped: 0 ✓  

---
*Requirements defined: 2026-03-22*  
*Last updated: 2026-03-22 after roadmap creation*
