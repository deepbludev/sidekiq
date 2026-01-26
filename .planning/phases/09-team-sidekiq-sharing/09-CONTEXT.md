# Phase 9: Team Sidekiq Sharing - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable users to share Sidekiqs with their team and control permissions. A Sidekiq can be shared with one team at a time. Team members can use shared Sidekiqs, and the owner controls edit permissions via a canTeamEdit flag. When a team is deleted, team Sidekiqs transfer to the owner. Threads created with team Sidekiqs remain private to the user who created them.

</domain>

<decisions>
## Implementation Decisions

### Sharing flow
- Share action available in multiple places: edit page, context menu on list/sidebar
- One team at a time — Sidekiq has a single teamId, not many-to-many
- Optional team dropdown in Sidekiq creation form (share during creation)
- When sharing during creation, team edit permission asked separately (checkbox/toggle alongside team picker)
- If user has no teams: show disabled share option with "Create a team to share" hint
- Owner and team admins can share/unshare

### Permission model
- Default (canTeamEdit=false): team members can **use only** — start chats with the Sidekiq, but cannot view instructions/config
- canTeamEdit=true: **partial edit** — team members can edit instructions only, not name/avatar
- Delete rights: **owner only** — no team member or admin can delete someone else's Sidekiq
- canTeamEdit toggle available in both the share dialog and the Sidekiq edit page settings

### Ownership & deletion
- When team is deleted: team Sidekiqs transfer to owner (Claude's discretion on exact dialog UX)
- When owner leaves team: Sidekiq ownership transfers to a team admin
- Leaving member sees confirmation: "You have X Sidekiqs shared with [Team]. They will transfer to [Admin]."
- When member is removed by admin: same transfer behavior (Claude's discretion on exact UX)
- No ownership history/audit trail — just transfer, no tracking
- No reclaim mechanism — once transferred, new owner keeps it (Claude's discretion)
- Threads created with team Sidekiqs are **private** to the user who created them

### Claude's Discretion
- Exact share dialog UX design (dialog with team picker vs inline toggle)
- Confirmation step when sharing/unsharing
- Share feedback mechanism (toast, inline badge, or both)
- Whether sharing is affected by active thread usage
- Whether team owner can force-unshare any member's Sidekiq
- Exact transfer dialog UX when team is deleted
- UX for member removal Sidekiq transfer
- Team picker presentation style (flat list vs with member counts)

</decisions>

<specifics>
## Specific Ideas

- Team dropdown in creation form should be an optional field — not mandatory, doesn't block creation
- "Allow team to edit" should be a separate, clearly labeled toggle/checkbox next to the team picker during creation

</specifics>

<deferred>
## Deferred Ideas

- Team-visible threads (shared chat history within teams) — future capability
- Multi-team sharing (Sidekiq shared with multiple teams simultaneously) — future capability

</deferred>

---

*Phase: 09-team-sidekiq-sharing*
*Context gathered: 2026-01-25*
