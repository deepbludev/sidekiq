---
phase: 08-team-foundation
plan: 03
subsystem: team-ui
tags: [react, components, dialogs, hooks, fuse.js, shadcn]

dependency-graph:
  requires: [08-01]
  provides:
    [
      team-avatar,
      delete-team-dialog,
      remove-member-dialog,
      invite-member-dialog,
      use-member-search,
    ]
  affects: [08-04, 08-05, 08-06, 08-07]

tech-stack:
  added: [shadcn/tabs]
  patterns: [type-to-confirm-dialog, tabbed-dialog, fuzzy-search-hook]

key-files:
  created:
    - sidekiq-webapp/src/components/team/team-avatar.tsx
    - sidekiq-webapp/src/components/team/delete-team-dialog.tsx
    - sidekiq-webapp/src/components/team/remove-member-dialog.tsx
    - sidekiq-webapp/src/components/team/invite-member-dialog.tsx
    - sidekiq-webapp/src/components/ui/tabs.tsx
  modified:
    - sidekiq-webapp/src/lib/team-permissions.ts

decisions:
  - key: rounded-lg-for-team-avatars
    choice: "Use rounded-lg (vs rounded-full for users) to visually distinguish team avatars"
    reason: "Clear visual distinction between team and user avatars"
  - key: tabbed-invite-dialog
    choice: "Tabs for email invite vs copy link in InviteMemberDialog"
    reason: "Both options available per CONTEXT.md, tabs provide clean UX"
  - key: permission-functions-accept-null
    choice: "Permission functions accept TeamRole | null"
    reason: "Cleaner callsite code, functions handle null safely by returning false"

metrics:
  duration: 5min
  completed: 2026-01-25
---

# Phase 8 Plan 03: Team UI Components Summary

**One-liner:** Reusable team UI components with avatar display, type-to-confirm delete, tabbed invite dialog, and Fuse.js member search hook.

## What Was Built

### TeamAvatar Component

- Displays initials or emoji with colored background
- Uses same SidekiqAvatar type for consistency
- Rounded-lg styling to distinguish from user avatars (rounded-full)
- Size variants: sm (24px), md (32px), lg (40px), xl (48px)
- Reuses `getInitials` utility from avatar.ts

### DeleteTeamDialog Component

- Type-to-confirm pattern (matches Sidekiq deletion UX)
- Shows member count warning for teams with multiple members
- Destructive action styling for delete button
- Properly resets confirm text on close

### RemoveMemberDialog Component

- Simple confirmation dialog for member removal
- No type-to-confirm (less destructive than team deletion)
- Shows what removal means (loss of access, need new invite to rejoin)

### InviteMemberDialog Component

- Tabbed UI with Email Invite and Copy Link options
- Email validation via Zod schema
- Success state shows copyable invite URL
- 7-day expiration notice displayed
- "Invite Another" button for multiple invites
- Uses shadcn Tabs component (newly added)

### useMemberSearch Hook

- Fuse.js fuzzy search on user.name and user.email fields
- Threshold 0.4 for typo tolerance (matches thread/sidekiq search patterns)
- 200ms debounce for typing performance
- Match highlighting utility with yellow background
- Returns all members when query is empty
- Exposes isSearching state for loading indicators

## Technical Decisions

1. **Rounded-lg for Team Avatars**: Team avatars use `rounded-lg` while user avatars use `rounded-full` to provide clear visual distinction in the UI.

2. **Tabbed Invite Dialog**: Rather than two separate dialogs or a complex form, a tabbed interface cleanly presents both invite options (email vs manual link sharing).

3. **Permission Functions Accept Null**: Updated `canInvite`, `canDeleteTeam`, `canRemoveMember`, etc. to accept `TeamRole | null`. This allows cleaner callsite code without explicit null checks, since all functions return `false` for null roles.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Permission functions type safety**

- **Found during:** Task 4 commit
- **Issue:** ESLint flagged `role as TeamRole` casts as unsafe when role could be null
- **Fix:** Updated all permission functions in team-permissions.ts to accept `TeamRole | null`
- **Files modified:** sidekiq-webapp/src/lib/team-permissions.ts
- **Commit:** f630880

**2. [Rule 3 - Blocking] JSX in .ts file**

- **Found during:** Task 4 verification
- **Issue:** useMemberSearch used JSX but had .ts extension
- **Fix:** Renamed to .tsx
- **Note:** File already existed from 08-02, fix applied automatically

## Files Created/Modified

| File                                           | Purpose                         |
| ---------------------------------------------- | ------------------------------- |
| `src/components/team/team-avatar.tsx`          | Team avatar display component   |
| `src/components/team/delete-team-dialog.tsx`   | Type-to-confirm team deletion   |
| `src/components/team/remove-member-dialog.tsx` | Member removal confirmation     |
| `src/components/team/invite-member-dialog.tsx` | Tabbed email/link invite dialog |
| `src/components/ui/tabs.tsx`                   | shadcn Tabs component           |
| `src/lib/team-permissions.ts`                  | Updated to accept null roles    |

## Verification

- [x] `pnpm typecheck` passes
- [x] All components export correctly (TeamAvatar, DeleteTeamDialog, RemoveMemberDialog, InviteMemberDialog)
- [x] useMemberSearch hook exports correctly
- [x] Dialogs follow AlertDialog/Dialog patterns from existing codebase
- [x] Hook follows useThreadSearch pattern

## Commits

| Hash    | Message                                                       |
| ------- | ------------------------------------------------------------- |
| b83661b | feat(08-03): create TeamAvatar component                      |
| a3186ea | feat(08-03): create DeleteTeamDialog with type-to-confirm     |
| 0da648a | feat(08-03): create RemoveMemberDialog and InviteMemberDialog |
| f630880 | feat(08-03): create useMemberSearch hook (permission fixes)   |

## Next Phase Readiness

**Dependencies satisfied:**

- TeamAvatar ready for team settings UI
- DeleteTeamDialog ready for team settings danger zone
- RemoveMemberDialog ready for member management
- InviteMemberDialog ready for invite flow
- useMemberSearch ready for member list filtering

**Ready for:** Plan 08-04 (Team Settings Components) - these foundational components will be composed into the team settings views.
