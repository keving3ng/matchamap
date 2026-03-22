# Features Research

**Domain:** PWA + offline-tolerant consumer web apps  
**Researched:** 2026-03-22

## Table stakes (users expect)

| Feature | Complexity | Notes |
|---------|------------|--------|
| Valid **Web App Manifest** (name, icons, theme, display) | Low | Required for installability |
| **HTTPS** | N/A (Cloudflare) | Required for SW |
| **Service worker** registered | Medium | Shell available offline |
| **Clear offline / error state** | Low–Med | Avoid infinite spinners |
| **Install entry point** (browser + in-app hint) | Low | About/footer copy |

## Differentiators (for MatchaMap)

| Feature | Notes |
|---------|--------|
| **City-scoped cafe JSON cache** | Matches product (multi-city); must key cache correctly |
| **Honest UX** — tiles not offline | Trust; reduces bad reviews |

## Anti-features (deliberately not building)

| Anti-feature | Why |
|--------------|-----|
| Offline **map tile** pack | Cost, size, staleness (#432) |
| Full offline **admin** | Security and complexity |
| Background **sync** of user writes | Out of scope |

## Dependencies between features

1. Manifest + icons → install eligibility  
2. SW registration → precache shell  
3. Runtime API cache → degraded-network cafe list  
4. Copy + banner → user understanding  
