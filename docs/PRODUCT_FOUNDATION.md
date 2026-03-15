# MatchaMap Product Foundation

**Purpose:** Define the simplified, focused product. Use this as the single source of truth for what MatchaMap is and what it is not.

**Last updated:** 2025-03-14

---

## What MatchaMap Is

MatchaMap is a **curated guide** to matcha at cafes in Toronto (and eventually other cities). It exists to:

1. **Share our recommendations and data** – Expert-curated cafe listings, drink scores, and reviews. One voice (the team + backer), not a crowd-sourced platform.
2. **Share relevant news** – Events, tastings, and matcha-related happenings. Simple, editorially curated.
3. **Promote our content creator backer** – [vivisual.diary](https://www.instagram.com/vivisual.diary) is the face of the project; the site should link to their Instagram/TikTok and content, not replace it with an in-app social layer.

We are **not** building a social network, a review aggregator, or a community platform. We are a **publisher** of a focused, high-quality guide.

---

## Core Product (In Scope)

| Area | Description |
|------|-------------|
| **Map** | Interactive map of matcha cafes; pins, popover, “get directions.” |
| **List** | Browse cafes as a list with sorting (e.g. neighborhood, score, distance). |
| **Detail** | Per-cafe page: scores, expert review, drinks, hours, links (Maps, Instagram, TikTok). |
| **Events** | Curated list of matcha-related events (workshops, tastings, pop-ups). |
| **About** | Who we are, rating rubric, and **prominent link to vivisual.diary** (Instagram + TikTok). |
| **Contact** | Optional; simple way to get in touch (e.g. for partnerships, corrections). |
| **Admin** | Protected panel for **editors only**: manage cafes, drinks, events. No public user management. |
| **Passport (optional)** | Simple “stamp” list of cafes you’ve visited – can stay **localStorage-only** (no accounts). |
| **Cities** | Toronto first; structure allows adding more cities later. |
| **News (future)** | Simple, curated news/updates (e.g. “New cafe added,” “Event this weekend”). No feed algorithm, no activity feed. |

Technical scope that supports the above:

- **Data:** Cafes, drinks (scores/prices), events. Optional: waitlist for launch; simple stats (e.g. directions clicks, event clicks).
- **Auth:** Only for **admin/editors** (login to manage content). No public sign-up or profiles.

---

## Out of Scope (Not the Foundation)

These are explicitly **not** part of the simplified product. They can be removed or left dormant until there is a clear need.

| Area | Why out of scope |
|------|------------------|
| **Public user accounts** | We’re a guide, not a social app. No sign-up, no “community” login. |
| **User profiles & profile pages** | No public user identity. |
| **Check-ins / passport sync** | No accounts → no server-side passport. Optional: keep passport as localStorage-only. |
| **User reviews & ratings** | Curation is our differentiator; we don’t aggregate user reviews. |
| **User photo uploads** | Content comes from the team/vivisual.diary, not user galleries. |
| **Following / followers** | Social graph is out of scope. |
| **Favorites / lists** | Can revisit later if needed; not core. |
| **Badges / leaderboards** | Gamification and social competition are out of scope. |
| **Notifications** | No user accounts → no in-app notifications. |
| **Cafe suggestions (user-submitted)** | Can be replaced by Contact or a simple form; not a product pillar. |
| **“For you” / trending / similar cafes** | No recommendation engine for now; keep the experience simple. |
| **Activity feed** | No social feed. News = curated updates, not a feed of user actions. |
| **Store/shop** | Out of scope unless explicitly added later. |
| **User settings** | No public users → no user settings. |

---

## Content Creator: vivisual.diary

- **Role:** Content creator backer; the human face of the guide.
- **Presence on the site:** Clear links from Header and About (and anywhere else that makes sense) to:
  - Instagram: [instagram.com/vivisual.diary](https://www.instagram.com/vivisual.diary)
  - TikTok: [tiktok.com/@vivisual.diary](https://www.tiktok.com/@vivisual.diary)
- **Principle:** The site promotes their content and expertise; we don’t replicate a social experience inside the app.

---

## Where This Leaves the Codebase

- **Keep and prioritize:** Map, List, Detail, Events, About, Contact (if desired), Admin (cafes, drinks, events), optional Passport (localStorage), cities, simple analytics.
- **Remove or disable:** All public user account flows, social features (reviews, photos, check-ins, following, favorites, lists, badges, leaderboards, notifications, suggestions, recommendations), and any UI/docs that describe MatchaMap as a social or community platform.
- **Cut-off point:** The “new foundation” is the state of the product **after** simplification. See [SIMPLIFICATION_PLAN.md](./SIMPLIFICATION_PLAN.md) for the concrete steps and checklist.

---

## Summary

| Question | Answer |
|----------|--------|
| What is MatchaMap? | A curated guide to matcha at cafes (Toronto + future cities), with events and a clear link to vivisual.diary. |
| Who is the audience? | People looking for trusted recommendations and events, not a social network. |
| Who creates content? | The team and vivisual.diary; no UGC (reviews, photos, check-ins) in the core product. |
| Do we need user accounts? | Only for editors (admin). No public sign-up. |
| What about “news”? | Curated updates and events only; no activity feed or algorithmic feed. |

This document is the product foundation. New features should align with it; if they don’t, the foundation or the feature should be revisited.
