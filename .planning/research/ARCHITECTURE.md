# Architecture Research

**Domain:** PWA layer on existing SPA + Worker API  
**Researched:** 2026-03-22

## Typical structure

```text
Browser
  ├─ Manifest + registered SW (vite-plugin-pwa)
  ├─ Precache: index.html, JS/CSS chunks, static icons
  └─ Runtime cache: GET /api/cafes* (or chosen route) → Workbox strategy

Cloudflare Pages (static) ──► User
Cloudflare Worker ──► D1 (source of truth for cafe JSON)
```

## Component boundaries

| Layer | Responsibility |
|-------|------------------|
| **SW (Workbox)** | Cache policy only; does not replace API auth rules for public reads |
| **React app** | UI for install hints, offline banner; reads same API client |
| **Worker** | Unchanged contract; optional `Cache-Control` headers to hint SW (optional) |

## Data flow

1. Online: app fetches cafes → SW can pass-through or update runtime cache  
2. Offline: SW serves last good response for cached URL; UI shows banner  
3. New deploy: new `revision` / precache hash bumps SW → clients refresh  

## Suggested build order

1. Manifest + icons + meta tags  
2. SW precache (shell) only — verify offline load of app frame  
3. Runtime caching for cafe endpoints + invalidation rules  
4. Install + offline **copy** and **UI** (uses `COPY`)  
5. Perf verification (LCP, bundle)  
