# Research Summary

**Synthesized:** 2026-03-22  
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, `.planning/PROJECT.md`

## Stack (headline)

- Add **`vite-plugin-pwa`** + **Workbox** runtime strategies to the existing **Vite 7** frontend; keep Worker API as source of truth.

## Table stakes

- Valid manifest + icons; HTTPS; SW with precache shell; explicit offline/degraded UX; install discovery paths.

## Watch out for

- **Stale content** after admin edits — network-first or disciplined TTL + deploy bump  
- **iOS** behavior vs Chromium — test real devices  
- **Bundle/LCP** — stay within existing CI budgets  

## Build order

1. Manifest + precache shell  
2. Runtime cafe API caching (keyed by city/query)  
3. Install + offline messaging (`COPY`)  
4. Verification + documentation of tile limitations  
