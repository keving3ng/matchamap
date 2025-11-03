# Content Moderation Guide

**Last Updated:** 2025-11-02
**Audience:** Admin users

This guide explains how to moderate user-generated content on MatchaMap.

---

## Table of Contents

- [Overview](#overview)
- [Moderation Queue](#moderation-queue)
- [Photo Moderation](#photo-moderation)
- [Review Moderation](#review-moderation)
- [Comment Moderation](#comment-moderation)
- [Moderation Guidelines](#moderation-guidelines)
- [Common Scenarios](#common-scenarios)

---

## Overview

### What Requires Moderation?

**Automatic Moderation (Pending by Default):**
- ✅ User-uploaded photos
- ⏳ Review comments (future)

**Post-Moderation (Live First, Moderate Later):**
- ✅ User reviews
- ✅ User profiles

### Moderation Statuses

| Status | Description | User Visibility |
|--------|-------------|-----------------|
| **pending** | Awaiting admin review | Hidden from public |
| **approved** | Approved by admin | Visible to public |
| **rejected** | Rejected by admin | Hidden, user notified |
| **flagged** | Flagged for review | Visible, under investigation |

---

## Moderation Queue

### Accessing the Queue

1. **Log in as admin**
   - Must have `admin` role

2. **Navigate to Admin Panel**
   - Click profile icon → "Admin Panel"

3. **Open Moderation Queue**
   - Click "Moderation" in sidebar
   - Shows all pending content

### Queue Filters

**Filter by Type:**
- Photos
- Reviews (future)
- Comments (future)

**Filter by Status:**
- Pending (awaiting review)
- Flagged (reported by users)
- All

**Sort Options:**
- Newest first (default)
- Oldest first
- Most reported

---

## Photo Moderation

### Photo Review Workflow

```
User uploads photo
    ↓
Photo status = 'pending'
    ↓
Appears in moderation queue
    ↓
Admin reviews photo
    ↓
Approve or Reject
    ↓
If approved: Photo visible in cafe gallery
If rejected: Photo hidden, user notified
```

### Reviewing a Photo

1. **Open Photo in Queue**
   - Click on pending photo

2. **Review Details**
   - **Preview:** View full-size image
   - **Uploaded by:** Username and profile link
   - **Cafe:** Which cafe it's for
   - **Caption:** User-provided caption
   - **Upload date:** When it was uploaded

3. **Make Decision**
   - **Approve:** Photo meets guidelines
   - **Reject:** Photo violates guidelines
   - **Flag:** Needs further review

4. **Add Moderation Notes**
   - Internal notes (not visible to user)
   - Reason for rejection (shown to user)

5. **Submit Decision**
   - Click "Approve" or "Reject"
   - Photo status updated immediately

### Photo Guidelines

**✅ APPROVE if:**
- Clear, well-lit photo of matcha drink
- Shows cafe ambiance or interior
- High quality, in focus
- No offensive content
- No personal information visible
- No copyright violations

**❌ REJECT if:**
- Blurry or very low quality
- Not related to matcha or cafe
- Contains offensive content
- Contains personal information (faces without consent)
- Advertisement or promotional content
- Copyrighted material
- Duplicate of existing photo

**🚩 FLAG if:**
- Borderline quality
- Potentially copyrighted
- Needs discussion
- Unclear if guideline violation

### Rejection Reasons

**Common rejection templates:**

```
Low Quality
"Photo quality is too low. Please upload a clear, well-lit image."

Not Relevant
"Photo does not show matcha drinks or cafe. Please upload relevant content."

Offensive Content
"Photo contains content that violates our community guidelines."

Copyright
"Photo appears to be copyrighted material. Please only upload original photos."

Personal Information
"Photo contains identifiable personal information. Please blur faces before uploading."
```

---

## Review Moderation

**Status:** Currently auto-approved. Future moderation workflow planned.

### Flagged Reviews

Users can flag inappropriate reviews.

**Flag Threshold:** 3 flags = auto-hide + notify admin

### Reviewing Flagged Reviews

1. **View Flagged Reviews**
   - Admin Panel → Moderation → Reviews

2. **Review Content**
   - Read full review
   - Check user history
   - View flag reasons from reporters

3. **Take Action**
   - **Approve:** Review is fine, restore visibility
   - **Reject:** Review violates guidelines, keep hidden
   - **Edit:** Remove offensive parts (notify user)
   - **Ban User:** Severe/repeat violations

### Review Guidelines

**✅ APPROVE reviews that:**
- Share genuine experience
- Are constructive (even if negative)
- Provide helpful details
- Follow community standards

**❌ REJECT reviews that:**
- Contain hate speech or harassment
- Are spam or promotional
- Are fake/fraudulent
- Contain personal attacks
- Violate privacy

---

## Comment Moderation

**Status:** Future feature (Phase 2F)

Comments on reviews will require moderation similar to reviews.

---

## Moderation Guidelines

### General Principles

1. **Be Fair**
   - Apply guidelines consistently
   - Don't let personal bias influence decisions
   - Give users benefit of doubt when borderline

2. **Be Timely**
   - Review pending content within 24 hours
   - Respond to flags within 48 hours
   - Communicate decisions to users

3. **Be Clear**
   - Provide specific reasons for rejection
   - Use templates for common issues
   - Help users understand guidelines

4. **Be Professional**
   - Remain neutral and objective
   - Don't engage in arguments
   - Escalate difficult cases

### Content Policy

**Prohibited Content:**
- ❌ Hate speech, discrimination, harassment
- ❌ Spam, scams, or promotional content
- ❌ Fake reviews or fraudulent content
- ❌ Personal attacks or doxxing
- ❌ Sexually explicit content
- ❌ Violence or illegal activity
- ❌ Copyright violations

**Encouraged Content:**
- ✅ Honest, detailed reviews
- ✅ High-quality photos
- ✅ Constructive feedback
- ✅ Helpful recommendations
- ✅ Community engagement

---

## Common Scenarios

### Scenario 1: Low-Quality Photo

**Situation:** User uploads very dark, blurry photo

**Action:**
1. Reject photo
2. Reason: "Photo quality is too low. Please ensure your photo is well-lit and in focus."
3. User can re-upload better quality photo

---

### Scenario 2: Negative but Fair Review

**Situation:** User leaves 3/10 review citing bad service and low-quality matcha

**Action:**
1. Approve review (if honest and constructive)
2. Negative reviews are valuable feedback
3. Only reject if violates guidelines (offensive language, etc.)

---

### Scenario 3: Potential Copyright Violation

**Situation:** Photo looks professionally shot, might be from cafe's Instagram

**Action:**
1. Flag for investigation
2. Check cafe's Instagram for matching photo
3. If copyright violation: Reject with reason
4. If user's original photo: Approve

---

### Scenario 4: Photo Contains Faces

**Situation:** User uploads photo with identifiable people in background

**Action:**
1. Assess context:
   - Public setting + background faces → Approve
   - Close-up of person without consent → Reject
2. When in doubt, request user blur faces and reupload

---

### Scenario 5: Spam Review

**Situation:** Review is copied from another site or is clearly fake

**Action:**
1. Reject review
2. Check user history for pattern
3. If repeat offender: Ban user
4. Reason: "Review appears to be copied/fake. Please only post original content."

---

### Scenario 6: Multiple Flags on Legitimate Content

**Situation:** Good review has 3 flags, appears to be coordinated

**Action:**
1. Investigate flaggers (check if related accounts)
2. Review content objectively
3. If content is fine: Approve and ignore flags
4. If flags appear coordinated: Investigate further
5. Consider disabling flag feature for bad actors

---

## Moderation Tools

### Admin Panel Features

**Batch Actions:**
- Approve multiple items at once
- Reject multiple items at once
- Bulk assign to moderator (future)

**User Management:**
- View user's moderation history
- See all content by user
- Suspend/ban users (future)

**Reporting:**
- Moderation queue stats
- Average review time
- Rejection reasons breakdown

### Audit Log

All moderation actions are logged:
- Who moderated
- What action was taken
- When it happened
- Moderation notes
- Before/after state

**Access audit log:**
- Admin Panel → Audit Log

---

## Best Practices

### Do's

- ✅ Review content within 24 hours
- ✅ Provide clear, specific rejection reasons
- ✅ Check user history before severe actions
- ✅ Escalate difficult decisions
- ✅ Document unusual cases
- ✅ Stay up to date on guidelines

### Don'ts

- ❌ Approve content while uncertain
- ❌ Reject content based on personal preference
- ❌ Engage in arguments with users
- ❌ Share moderation discussions publicly
- ❌ Make exceptions for friends/known users
- ❌ Rush through queue for metrics

---

## Escalation

### When to Escalate

- Legal issues (DMCA, defamation)
- Serious harassment or threats
- Unclear policy application
- Repeat offenders
- Coordinated abuse

**Escalation Contact:**
- Email: moderation@matchamap.app
- Slack: #moderation-escalation (internal)

---

## See Also

- [User Management Guide](user-management.md) - Managing user accounts
- [Admin Dashboard Guide](dashboard.md) - Using admin analytics
- [API Reference](../api/api-reference.md) - Moderation endpoints
