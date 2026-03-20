# MatchaMap documentation

**Last updated:** 2026-03-20

Task-oriented index. **Product scope:** [`PRODUCT_FOUNDATION.md`](./PRODUCT_FOUNDATION.md) · **Simplification / cut-off:** [`SIMPLIFICATION_PLAN.md`](./SIMPLIFICATION_PLAN.md) · **Parallel agent runs (current plan):** [`AGENT_PARALLELIZATION_PLAN.md`](./AGENT_PARALLELIZATION_PLAN.md)

MatchaMap is a **curated guide** (map, list, detail, events, About / vivisual.diary)—not a social network. Social and public user-account UX are out of scope or behind flags; historical docs live in [`archive/`](./archive/).

---

## Quick links

| I want to… | Read |
|------------|------|
| **Daily dev patterns** | [`../CLAUDE.md`](../CLAUDE.md) |
| **Contribute** | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| **CI (workflows, forks)** | [`CI.md`](./CI.md) |
| **Backend locally** | [`QUICKSTART_BACKEND.md`](./QUICKSTART_BACKEND.md) |
| **Deploy** | [`DEPLOYMENT.md`](./DEPLOYMENT.md) |
| **Tests (unit/integration)** | [`TESTING.md`](./TESTING.md) |
| **E2E (Playwright)** | [`E2E_TESTING_GUIDE.md`](./E2E_TESTING_GUIDE.md) |
| **Security testing** | [`security-testing-guide.md`](./security-testing-guide.md) |
| **Performance deep dives** | [`PERFORMANCE.md`](./PERFORMANCE.md) |
| **Feature flags** | [`feature-flags-guide.md`](./feature-flags-guide.md) |
| **Add a city** | [`adding-new-cities.md`](./adding-new-cities.md) |
| **Google Places** | [`GOOGLE_PLACES_SETUP.md`](./GOOGLE_PLACES_SETUP.md) |
| **Photos / R2** | [`photo-upload-guide.md`](./photo-upload-guide.md) · [`architecture/photo-upload-flow.md`](./architecture/photo-upload-flow.md) |
| **Metrics** | [`metrics-tracking-prd.md`](./metrics-tracking-prd.md) |
| **Full tech spec** | [`TECH_SPEC.md`](./TECH_SPEC.md) — prefer [`api/database-schema.md`](./api/database-schema.md) and [`api/api-reference.md`](./api/api-reference.md) for schema/API details |

---

## Architecture and API

| Topic | Document |
|--------|----------|
| System overview | [`architecture/system-overview.md`](./architecture/system-overview.md) |
| Auth (JWT, admin) | [`architecture/auth-flow.md`](./architecture/auth-flow.md) |
| Database tables | [`api/database-schema.md`](./api/database-schema.md) |
| HTTP endpoints | [`api/api-reference.md`](./api/api-reference.md) |
| Backend PRD / decisions | [`backend-prd.md`](./backend-prd.md) |

---

## Users and admins

| Audience | Document |
|----------|----------|
| End users (map, list, events) | [`user-guide/getting-started.md`](./user-guide/getting-started.md) |
| Admin moderation | [`admin/moderation.md`](./admin/moderation.md) |

---

## Archive

| Document | Note |
|----------|------|
| [`archive/social-features-guide.md`](./archive/social-features-guide.md) | Historical; social product out of scope |
| [`archive/social-features-analytics-prd.md`](./archive/social-features-analytics-prd.md) | Historical analytics PRD |
| [`archive/feed-refactoring-plan.md`](./archive/feed-refactoring-plan.md) | Deprecated feed work |
| [`archive/PARALLEL_EXECUTION_PLAN.md`](./archive/PARALLEL_EXECUTION_PLAN.md) | Old parallel *social* roadmap; superseded by simplification + `AGENT_PARALLELIZATION_PLAN.md` |
| [`archive/UI_POLISH_SUMMARY.md`](./archive/UI_POLISH_SUMMARY.md) | Completed UI polish notes |

---

## Directory layout

```
docs/
├── README.md                 # This index
├── PRODUCT_FOUNDATION.md
├── SIMPLIFICATION_PLAN.md
├── AGENT_PARALLELIZATION_PLAN.md
├── PERFORMANCE.md            # Links perf-related docs
├── api/                      # API + DB reference
├── architecture/             # System, auth, photo flow
├── user-guide/
├── admin/
└── archive/                  # Superseded or out-of-scope
```

---

## Suggested reading order

**New contributor:** [`CONTRIBUTING.md`](../CONTRIBUTING.md) → [`CLAUDE.md`](../CLAUDE.md) → [`architecture/system-overview.md`](./architecture/system-overview.md) → [`QUICKSTART_BACKEND.md`](./QUICKSTART_BACKEND.md) if you touch the API.

**Ship a feature:** [`feature-flags-guide.md`](./feature-flags-guide.md) → schema/API refs → [`CLAUDE.md`](../CLAUDE.md) patterns → [`TESTING.md`](./TESTING.md).

**Production deploy:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) end-to-end (includes migrations and rollback).

---

## Principles

- **Single source of truth** — Schema and endpoints: `api/`; product scope: `PRODUCT_FOUNDATION.md`.
- **Task-oriented** — Prefer linking over copying long sections between files.
- **Update when you change behavior** — Docs are part of the change.

**Help:** Troubleshooting commands live in [`CLAUDE.md`](../CLAUDE.md); deployment specifics in [`DEPLOYMENT.md`](./DEPLOYMENT.md).
