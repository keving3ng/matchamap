# MatchaMap Parallelized Development Plan (Phases 4-6)

> **⚠️ SUPERSEDED (2025-03):** This plan describes the old social feature roadmap. MatchaMap has been simplified. See [PRODUCT_FOUNDATION.md](./PRODUCT_FOUNDATION.md), [SIMPLIFICATION_PLAN.md](./SIMPLIFICATION_PLAN.md), and [AGENT_PARALLELIZATION_PLAN.md](./AGENT_PARALLELIZATION_PLAN.md) for current direction.

---

**Timeline:** 6 weeks (vs 7 weeks sequential)
**Strategy:** 4-5 parallel tracks running concurrently
**Last Updated:** 2025-11-26

---

## Overview

This plan reorganizes Phases 4-6 to maximize parallelization, reducing total time from 7 weeks to 6 weeks. Tasks are grouped by dependencies and can be executed in parallel where possible.

## Progress Legend

- ✅ **Completed**
- 🚧 **In Progress** (has open PR)
- 📝 **Ready to Start** (no blockers)
- ⏳ **Blocked** (waiting on dependencies)

---

## PHASE 4: Social Features - 3 Parallel Tracks Possible

### Track A (Sequential - Core Social)
**Status:** 📝 Ready to Start

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Following system | #180 | 📝 | None | Foundation for social features - **PRIORITY** |
| User profile pages | #182 | ✅ | #180 | Completed via PR #365 (Nov 5) |
| Activity feed system ⭐ | #181 | ⏳ | #180, #188 | Blocked by following + review comments |

**Rationale:** Following → Profiles → Activity Feed is sequential because each builds on the previous.

**Update:** User profiles (#182) completed ahead of schedule. Activity feed now only blocked by #180 and #188.

---

### Track B (Parallel - Independent)
**Status:** ✅ Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Leaderboards | #183 | ✅ | None | Uses existing check-in/review data |

**Rationale:** Leaderboards are independent features that don't block anything.

---

### Track C (Parallel - Independent)
**Status:** 📝 Ready to Start

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Review comments system | #188 | 📝 | #167 (reviews - completed) | Extends reviews, independent of social features |

**Rationale:** Review comments extend existing review system and don't depend on social features.

---

## PHASE 5: Discovery & Polish - 4 Parallel Tracks Possible

### Track A (Sequential - Discovery Core)
**Status:** ✅ Partially Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Recommendation algorithm | #184 | ✅ | User behavior data | Completed via PR #366 (Nov 5) |
| Trending/new/underrated UI | #186 | 📝 | #184 | **NOW UNBLOCKED** - ready to start |

**Rationale:** Recommendation algorithm should inform trending UI.

**Update:** Recommendations (#184) completed! Trending UI (#186) is now unblocked and ready.

---

### Track B (Parallel - Independent)
**Status:** 📝 Ready to Start

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Custom lists | #185 | 📝 | None | Independent feature |

**Rationale:** Lists are an independent feature.

---

### Track C (Parallel - Independent)
**Status:** ✅ Partially Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Enhanced search with UGC | #187 | ✅ | #167 (reviews - completed) | Uses existing review data |
| Cafe suggestion system | #189 | 📝 | None | Independent |

**Rationale:** Search and suggestions are independent features.

---

### Track D (Parallel - Last)
**Status:** ✅ Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Notification system ⭐ | #191 | ✅ | All Phase 4+5 features | Completed via PR #367 (Nov 5) |

**Rationale:** Notifications should be last as they integrate with all other features.

**Update:** Notification system (#191) completed! Follow-up issues created for improvements:
- #372 - Add test coverage for notifications
- #373 - Improve accessibility for notifications
- #376 - Optimize notification polling strategy

---

## PHASE 6: Admin & Quality - Highly Parallelizable

### Track A (Sequential - Analytics)
**Status:** 📝 Ready to Start

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Admin analytics API | #165 | 📝 | None | API endpoints |
| Admin analytics dashboard | #166 | ⏳ | #165 | Depends on API |

**Rationale:** Dashboard depends on API endpoints.

---

### Track B (Parallel - Moderation)
**Status:** 📝 Ready to Start

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Moderation dashboard | #190 | 📝 | None | Independent |

---

### Track C (Parallel - Security)
**Status:** ✅ Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Security audit | #192 | ✅ | All features implemented | Post-implementation audit |

---

### Track D (Parallel - Code Quality)
**Status:** 📝 Ready to Start

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Code cleanup | #193 | 📝 | None | Can be done anytime |
| Performance optimization | #194 | 📝 | None | Can be done anytime |

**Rationale:** Cleanup and optimization can happen alongside other work.

---

### Track E (Parallel - Testing & Docs)
**Status:** ✅ Partially Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Testing expansion | #195 | ✅ | None | Complement other work |
| Documentation | #196 | 📝 | Features completed | Document as you build |

**Rationale:** Testing and docs can complement each other.

---

### Track F (Parallel - Fraud Detection)
**Status:** ✅ Completed

| Task | Issue | Status | Dependencies | Notes |
|------|-------|--------|--------------|-------|
| Waitlist fraud detection | #201 | ✅ | None | Independent feature |

---

## Summary: Completed vs Remaining

### Completed (10 tasks) ✅
- #182 - User profile pages (PR #365 - Nov 5)
- #183 - Leaderboards
- #184 - Recommendation algorithm (PR #366 - Nov 5)
- #187 - Enhanced search with UGC
- #191 - Notification system (PR #367 - Nov 5)
- #192 - Security audit
- #195 - Testing expansion
- #201 - Waitlist fraud detection
- #257 - Bundle size optimization (bonus)

### In Progress (0 tasks) 🚧
None currently

### Ready to Start (9 tasks) 📝
**Phase 4:**
- #180 - Following system ⭐ **CRITICAL PATH**
- #188 - Review comments system

**Phase 5:**
- #185 - Custom lists
- #186 - Trending/new/underrated UI (**newly unblocked**)
- #189 - Cafe suggestion system

**Phase 6:**
- #165 - Admin analytics API
- #190 - Moderation dashboard
- #193 - Code cleanup
- #194 - Performance optimization
- #196 - Documentation

### Blocked (2 tasks) ⏳
- #181 - Activity feed system (blocked by #180, #188)
- #166 - Admin analytics dashboard (blocked by #165)

---

## Follow-up Issues (from completed PRs)

These are enhancement/polish issues created during PR reviews:

**From PR #365 (User Profiles):**
- #369 - Add cafe names to profile activity timeline
- #370 - Implement public reviews endpoint for profiles
- #371 - Add tests for ProfileActivity/ProfileBadges components

**From PR #367 (Notifications):**
- #372 - Add test coverage for notification system
- #373 - Improve accessibility for notifications
- #376 - Optimize notification polling strategy

**From PR #368 (Analytics):**
- #374 - Add accessibility labels to analytics table headers
- #375 - Extract CTR calculation to utility function

---

## Updated Execution Strategy

### Immediate Priorities (This Week)

**Critical Path:**
1. **Start #180 (Following system)** - This is the main blocker for Activity Feed

**Parallel Work:**
- Start #186 (Trending UI) - now unblocked
- Start #188 (Review comments) - blocks Activity Feed
- Start #185 (Custom lists) - independent

### Next Phase

**After #180 completes:**
- Start #181 (Activity feed) - requires #180 + #188

**After #165 completes:**
- Start #166 (Admin analytics dashboard)

### Ongoing (Low Priority)
- #189 - Cafe suggestions
- #190 - Moderation dashboard
- #193 - Code cleanup
- #194 - Performance optimization
- #196 - Documentation
- Follow-up issues (testing, a11y, polish)

---

## Dependency Graph (Updated)

```
Critical Path (Sequential):
#180 (Following) ──────────────────────┐
                                       ↓
#188 (Review comments) ───────────→ #181 (Activity Feed)

Completed Features:
✅ #182 (Profiles) - Completed Nov 5
✅ #184 (Recommendations) - Completed Nov 5
✅ #191 (Notifications) - Completed Nov 5

Independent Parallel Tracks:
Track 1: ✅ #183 (Leaderboards) | #188 (Review comments)
Track 2: #185 (Lists) | ✅ #187 (Search) | #189 (Suggestions) | ✅ #184 (Recs) | #186 (Trending)
Track 3: #165 (Analytics API) → #166 (Analytics UI) | #190 (Moderation) | ✅ #192 (Security) | ✅ #201 (Fraud)
Track 4: #193 (Cleanup) | #194 (Performance) | ✅ #195 (Testing) | #196 (Docs)
```

---

## Risk Mitigation

### Critical Path Bottleneck
**Risk:** Activity feed (#181) is blocked by 2 dependencies (#180, #188)
**Mitigation:** Start both #180 and #188 immediately in parallel

### Resource Constraints
**Risk:** Too many parallel tracks
**Mitigation:** Prioritize by track:
1. Critical Path (#180, #188) - always #1
2. Newly unblocked features (#186 Trending UI)
3. Track 3 (Admin features - high business value)
4. Track 2 (Discovery features - high user value)
5. Track 4 (Quality - ongoing)

### Merge Conflicts
**Risk:** Parallel PRs create conflicts
**Mitigation:**
- Keep PRs small and focused
- Merge frequently
- Use feature flags for incomplete features

---

## Success Metrics (Updated)

**Current Progress:**
- ✅ User profiles completed
- ✅ Recommendation algorithm completed
- ✅ Notification system completed
- ⏳ Following system not yet started (critical path)

**Next Checkpoint:**
- [ ] #180 (Following) in progress or complete
- [ ] #186 (Trending UI) in progress
- [ ] #188 (Review comments) in progress
- [ ] At least 2 parallel tracks active

**Final Checkpoint:**
- [ ] All critical path features complete (#180, #181)
- [ ] All parallel tracks complete
- [ ] Performance targets met
- [ ] Documentation updated

---

## Notes

- **Feature Flags:** All new features should be behind feature flags
- **Testing:** Maintain 100% test pass rate at all times
- **Mobile-First:** All UI work must start at 320px
- **Bundle Size:** Keep < 100KB per page (currently optimized)
- **API Design:** Follow existing patterns in `frontend/src/utils/api.ts`
- **Follow-ups:** Address follow-up issues as capacity allows (testing, a11y improvements)

---

**Last Updated:** 2025-11-26
**Timeline:** 6 weeks
**Parallel Tracks:** 4 active tracks at peak
**Total Tasks:** 21 (10 completed + 11 remaining)
**Completion:** 48% (10/21 tasks completed)
