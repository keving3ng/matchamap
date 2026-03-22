# Stack Research

**Domain:** Installable PWA + API runtime caching (Vite React SPA)  
**Researched:** 2026-03-22  
**Confidence:** HIGH (ecosystem norms); MEDIUM (exact plugin majors — verify in package.json at implementation)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **vite-plugin-pwa** | ^1.x (verify latest compatible with Vite 7) | Generates SW + Workbox, precache manifest from build | De-facto Vite integration; aligns with #432 “Workbox or lightweight custom” |
| **workbox-build / workbox-window** | Bundled with plugin | Precache + runtime caching strategies | Battle-tested; reduces custom SW bugs |
| **Vite** | ^7.x (repo) | Build + asset pipeline | Already the frontend bundler |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **workbox-routing** | via Workbox | Match API URL patterns | Cache `GET` cafe endpoints with city/query keys |
| **workbox-strategies** | via Workbox | NetworkFirst / StaleWhileRevalidate | Prefer fresh data when online; fallback when offline |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Lighthouse PWA audit** | Validate manifest + SW | Run on production-like build |
| **Safari Technology Preview / real iOS** | Install + SW quirks | Required; iOS differs from Chrome |

## What NOT to use (for this scope)

- **Aggressive precache of map tiles** — Size and churn; contradicts #432 out-of-scope
- **Heavy custom SW without tests** — Prefer plugin + small `injectManifest` custom chunk if needed

## Installation

Add `vite-plugin-pwa` to `frontend` devDependencies; configure in `frontend/vite.config.js` with `registerType`, `workbox` runtimeCaching for API routes, and manifest icons path.

## Confidence Notes

- Pin versions at implementation time against Vite 7 peer requirements.
- If bundle impact is unacceptable, evaluate slimmer **injectManifest** + minimal Workbox imports only for runtime caching.
