# Phase 8: Team Foundation - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Create teams and manage members with an invite system. Users can create teams with name and avatar, invite members via email with secure token links, manage membership with roles (owner/admin/member), and handle team lifecycle including deletion. Team Sidekiq sharing is Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Team Creation Flow
- Access via dedicated 'Teams' section in sidebar with + button
- Required fields: team name + avatar (same system as Sidekiq - initials/emoji + color picker)
- Users can create and own multiple teams
- Empty state shows illustration + "Create your first team" CTA with brief benefit text
- Team dropdown in sidebar header for switching between teams
- No uniqueness requirement for team names (teams identified by ID)
- Team deletion with type-to-confirm (same pattern as Sidekiq deletion)
- Active team selection persists across sessions (localStorage)
- Team section in sidebar shows team Sidekiqs in addition to personal ones
- Members can leave teams they're a member of (self-leave)

### Member Roles & Permissions
- Three-tier role structure: Owner, Admin, Member
- Role display via icon indicators (crown for owner, shield for admin)
- Ownership can be transferred to another member
- Team activity/audit log deferred to future phase

### Invite Experience
- Both options: send email with link OR generate copyable link to share manually
- Invites are email-specific (only valid for specified email address)
- Email service required: Resend
- New users without account: sign up → auto-join team flow
- 7-day expiration (per requirements)

### Member Management UI
- Team settings inside user settings page (not dedicated route)
- Simple list format: avatar + name + role + actions
- Actions via dropdown menu (three-dot) per member row
- Removing member requires confirmation dialog
- Member count with limit displayed: "5/50 members"
- Default team member limit: 50
- Empty members state shows illustration + invite CTA
- Owner appears in member list with owner badge
- Search input to filter members by name/email

### Claude's Discretion
- Team name character limit (reasonable default)
- Admin capabilities (invite/remove members, change roles except owner demotion)
- Admins can change roles for members/other admins (owner-only for promoting to admin)
- Admins cannot remove other admins (only owner can)
- New invites join as members by default (role change after joining)
- Invite flow UX: show accept page with team details → authenticate → auto-join
- Pending invites display approach (inline with members, marked as pending)
- Expired invite handling (clear error + suggest requesting new invite)
- Pending invite limit per team (reasonable anti-spam)
- Resend invite option (regenerates token, sends new email)
- Invite rate limiting (reasonable protection)
- Email styling (pragmatic approach)
- Settings page layout (tabs vs scroll based on content)
- Member list sorting (role hierarchy then alphabetical)

</decisions>

<specifics>
## Specific Ideas

- Team avatar uses same system as Sidekiq avatars (initials/emoji + color) for consistency
- Type-to-confirm deletion pattern matches existing Sidekiq deletion UX
- Role icons: crown for owner, shield for admin (clear visual hierarchy)
- Member list search matches existing Fuse.js patterns (threshold 0.4) used elsewhere

</specifics>

<deferred>
## Deferred Ideas

- Team activity/audit log tracking invites, role changes, removals — future phase
- Team Sidekiq sharing — Phase 9

</deferred>

---

*Phase: 08-team-foundation*
*Context gathered: 2026-01-25*
