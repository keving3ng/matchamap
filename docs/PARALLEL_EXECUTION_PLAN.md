# MatchaMap Parallelized Development Plan (Phases 4-6)

**Timeline:** 6 weeks (vs 7 weeks sequential)
**Strategy:** 4-5 parallel tracks running concurrently
**Last Updated:** 2025-10-26

---

## Overview

This plan reorganizes Phases 4-6 to maximize parallelization, reducing total time from 7 weeks to 6 weeks. Tasks are grouped by dependencies and can be executed in parallel where possible.

## Progress Legend

- ✅ **Completed**
- 🚧 **In Progress** (has open PR)
- 🤖 **Triggered** (@claude assigned, work starting)
- 📝 **Ready to Start** (no blockers)
- ⏳ **Blocked** (waiting on dependencies)

---

## Week 1-2: Foundation + 4 Parallel Tracks

### Critical Path (Sequential - MUST complete first)
**Status:** 🚧 In Progress

| Task | Issue | Status | PR | Notes |
|------|-------|--------|-----|-------|
| Following system | #180 | 🚧 | #322 | Foundation for social features |
| User profile pages | #182 | ⏳ | - | Depends on #180 |

**Blockers:** #182 blocked until #180 is merged

---

### Track 1: Social Extensions (Parallel)
**Status:** 🚧 In Progress

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Leaderboards | #183 | 🚧 | #320 | Uses existing check-in data (no blockers) |
| Review comments | #188 | 🚧 | #321 | Extends existing reviews (no blockers) |

**Notes:** Both can continue independently. Don't block on #180/#182.

---

### Track 2: Discovery Features (Parallel)
**Status:** 🤖 Triggered

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Custom lists | #185 | 🤖 | - | None - independent feature |
| Enhanced search with UGC | #187 | 🤖 | - | Uses existing review data from Phase 3 |
| Cafe suggestion system | #189 | 🤖 | - | None - independent feature |

**Notes:** All Phase 5 tasks can start NOW. No dependency on Phase 4. **@claude triggered on all 3 tasks.**

---

### Track 3: Admin & Infrastructure (Parallel)
**Status:** 🤖 Triggered

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Admin analytics API | #165 | 🤖 | - | None |
| Security audit ⚠️ | #192 | 🤖 | - | **HIGH PRIORITY** - independent |
| Waitlist fraud detection | #201 | 🤖 | - | Uses existing waitlist data |

**Priority:** Security audit triggered with HIGH PRIORITY flag. **@claude triggered on all 3 tasks.**

---

### Track 4: Quality (Ongoing)
**Status:** 🤖 Triggered

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Code cleanup | #193 | 🤖 | - | Can start anytime |
| Testing expansion | #195 | 🤖 | - | Can start anytime |

**Notes:** Can work on incrementally throughout all weeks. **@claude triggered on both tasks.**

---

## Week 3-4: Activity Feed + 4 Parallel Tracks

### Critical Path (Sequential - continues)
**Status:** ⏳ Blocked

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Activity feed system ⭐ | #181 | ⏳ | - | Depends on #180, #182, #188 |

**Blockers:** Needs following, profiles, and review comments integrated

---

### Track 1: Discovery (Continued)
**Status:** 📝 Ready to Start

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Recommendation algorithm | #184 | 📝 | - | Can use basic signals now, enhance later |

**Notes:** Start with simple version using existing data, refine after social features land.

---

### Track 2: Admin (Continued)
**Status:** 📝 Ready to Start

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Admin analytics dashboard | #166 | ⏳ | - | Depends on #165 (API must be ready) |
| Moderation dashboard | #190 | 📝 | - | Uses existing UGC from Phase 2-3 |

---

### Track 3: Quality (Continued)
**Status:** 📝 Ready to Start

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Code cleanup | #193 | 📝 | - | Ongoing |
| Performance optimization | #194 | 📝 | - | Can start anytime |

---

## Week 5-6: Polish & Final Integration

### Track 1: Discovery UI (Parallel)
**Status:** ⏳ Blocked

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Trending/new/underrated UI | #186 | ⏳ | - | Depends on #184 (recommendation algorithm) |

---

### Track 2: Notifications (Last - Depends on Everything)
**Status:** ⏳ Blocked

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Notification system ⭐ | #191 | ⏳ | - | Depends on ALL Phase 4+5 features |

**Rationale:** Notifications integrate with all features (follow, reviews, activity, lists, etc.). Must be last.

---

### Track 3: Final Quality (Parallel)
**Status:** 📝 Ready to Start

| Task | Issue | Status | PR | Dependencies |
|------|-------|--------|-----|--------------|
| Performance optimization | #194 | 📝 | - | Can work on throughout |
| Documentation | #196 | 📝 | - | Can work on throughout |

---

## Execution Strategy

### Week 1-2 Action Plan
**Goal:** Start 4 parallel tracks simultaneously

1. **Continue Critical Path:**
   - Merge #180 (Following) ASAP
   - Start #182 (Profiles) immediately after

2. **Continue Track 1:**
   - Merge #183 (Leaderboards)
   - Merge #188 (Review comments)

3. **Start Track 2 (Discovery):**
   - Assign: #185 (Custom lists)
   - Assign: #187 (Enhanced search)
   - Assign: #189 (Cafe suggestions)

4. **Start Track 3 (Admin):**
   - **Priority:** Start #192 (Security audit) IMMEDIATELY
   - Assign: #165 (Analytics API)
   - Assign: #201 (Fraud detection)

5. **Start Track 4 (Quality):**
   - Begin incremental #193 (Code cleanup)
   - Begin incremental #195 (Testing expansion)

### Week 3-4 Action Plan
**Goal:** Complete social foundation, continue parallel work

1. **Critical Path:**
   - Complete #182 (Profiles)
   - Start #181 (Activity feed) once #180, #182, #188 are merged

2. **Track 2:**
   - Complete #185, #187, #189
   - Start #184 (Recommendation algorithm)

3. **Track 3:**
   - Complete #165 (Analytics API)
   - Start #166 (Analytics dashboard)
   - Complete #190 (Moderation dashboard)
   - Complete #192 (Security audit)

4. **Track 4:**
   - Continue #193, #194, #195

### Week 5-6 Action Plan
**Goal:** Final integrations and polish

1. **Critical Path:**
   - Complete #181 (Activity feed)

2. **Dependent Features:**
   - Start #186 (Trending UI) after #184
   - Start #191 (Notifications) LAST

3. **Quality:**
   - Complete #194 (Performance)
   - Complete #196 (Documentation)

---

## Dependency Graph

```
Critical Path (Sequential):
#180 (Following) → #182 (Profiles) → #181 (Activity Feed)
                                           ↓
                                    #191 (Notifications) ← (needs ALL features)

Independent Parallel Tracks:
Track 1: #183 (Leaderboards) ✓ #188 (Review comments)
Track 2: #185 (Lists) ✓ #187 (Search) ✓ #189 (Suggestions) → #184 (Recs) → #186 (Trending)
Track 3: #165 (Analytics API) → #166 (Analytics UI) ✓ #190 (Moderation) ✓ #192 (Security) ✓ #201 (Fraud)
Track 4: #193 (Cleanup) ✓ #194 (Performance) ✓ #195 (Testing) ✓ #196 (Docs)
```

---

## Risk Mitigation

### Critical Path Bottleneck
**Risk:** Activity feed (#181) blocks notifications (#191)
**Mitigation:** Prioritize #180, #182, #188 merges in Weeks 1-2

### Resource Constraints
**Risk:** Too many parallel tracks
**Mitigation:** Prioritize by track:
1. Critical Path (always #1)
2. Track 3 (Security audit HIGH priority)
3. Track 2 (Discovery features - high user value)
4. Track 1 (Social extensions - nice-to-have)
5. Track 4 (Quality - ongoing)

### Merge Conflicts
**Risk:** Parallel PRs create conflicts
**Mitigation:**
- Keep PRs small and focused
- Merge frequently
- Use feature flags for incomplete features

---

## Success Metrics

**Week 2 Checkpoint:**
- ✅ #180 merged (Following)
- ✅ #183 merged (Leaderboards)
- ✅ #188 merged (Review comments)
- ✅ #192 started (Security audit)
- ✅ At least 2 Track 2 tasks started

**Week 4 Checkpoint:**
- ✅ #182 merged (Profiles)
- ✅ #181 in progress (Activity feed)
- ✅ Track 2 (Discovery) 75% complete
- ✅ #165, #166 complete (Analytics)
- ✅ #192 complete (Security audit)

**Week 6 Completion:**
- ✅ All 39 tasks complete
- ✅ All PRs merged
- ✅ Security audit passed
- ✅ Performance targets met
- ✅ Documentation updated

---

## CLI Quick Reference

### Check Current Status
```bash
# View all open PRs
gh pr list

# View specific issue
gh issue view <number>

# Check PR status
gh pr view <number>
```

### Start New Task
```bash
# Create branch for issue
git checkout -b claude/issue-<number>-$(date +%Y%m%d)

# Link to issue when creating PR
gh pr create --title "feat: ..." --body "Closes #<number>"
```

### Track Progress
```bash
# Update this document
vim docs/PARALLEL_EXECUTION_PLAN.md

# Commit progress
git add docs/PARALLEL_EXECUTION_PLAN.md
git commit -m "docs: update parallel execution plan progress"
```

---

## Notes

- **Feature Flags:** All new features should be behind feature flags
- **Testing:** Maintain 100% test pass rate (969/969)
- **Mobile-First:** All UI work must start at 320px
- **Bundle Size:** Keep < 100KB per page
- **API Design:** Follow existing patterns in `frontend/src/utils/api.ts`

---

**Last Updated:** 2025-10-27
**Timeline:** 6 weeks
**Parallel Tracks:** 4-5 active at peak
**Total Tasks:** 39 (Phases 4-6)
**Currently Active:** 11 tasks (3 in progress, 8 triggered)
