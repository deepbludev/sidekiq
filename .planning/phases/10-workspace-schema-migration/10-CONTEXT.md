# Phase 10: Workspace Schema Migration - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Evolve the database from the team model to a unified workspace model. Teams table becomes workspaces with a type enum (personal/team). Every user gets a personal workspace. All content tables (threads, sidekiqs) get a `workspaceId` foreign key. All team-related naming in the codebase is renamed to workspace. No production data exists — this is a clean schema change with Drizzle migrations.

</domain>

<decisions>
## Implementation Decisions

### Personal workspace creation
- Named "Personal" for every user
- Exactly one personal workspace per user, enforced by database constraint
- Permanent and non-deletable — exists as long as the user account exists
- For **existing users**: created during the Drizzle migration (so `workspaceId` can be NOT NULL from the start)
- For **new signups**: created at signup time in the auth callback (not lazy)
- If creation fails during first load: block the app and retry (user can't proceed without a personal workspace)
- Existing teams become team-type workspaces AND users also get a personal workspace

### Content ownership rules
- Existing threads assigned to the user's personal workspace (via migration)
- Team Sidekiqs stay with the team workspace — `teamId` replaced by `workspaceId` pointing to the same (now team-type) workspace
- Personal Sidekiqs (those with no team) assigned to the user's personal workspace
- `workspaceId` is NOT NULL from the start — migration creates personal workspaces for all existing users first

### Migration safety
- Use Drizzle migrations (not raw SQL scripts) — no production data to worry about
- Local dev databases wiped and re-seeded after migration — fresh start with workspace schema
- Full rename across the codebase: `teamId` → `workspaceId`, team router → workspace router, `TeamMember` → `WorkspaceMember`, etc. Clean break, no backwards compatibility

### Workspace identity
- Three-tier role model: owner / admin / member
- Both workspace types (personal and team) can have Stripe billing fields — personal workspace could have its own subscription in the future
- Personal workspace slug is fixed: "personal" (not globally unique, accessed by user context)
- Workspace creation via UI is out of scope for Phase 10 (that's Phase 12)

### Claude's Discretion
- Table strategy: rename `teams` → `workspaces` vs drop and create fresh
- Migration file structure: single file vs multiple sequential
- Workspace table fields beyond what teams have (type enum is required; description/avatar optional)
- Personal workspace ownership model: explicit `workspace_members` row vs implied via `userId` FK
- Invite table migration approach (rename team_invites → workspace_invites, field changes)

</decisions>

<specifics>
## Specific Ideas

- "No production data" — simplifies everything. Clean schema change, wipe-and-reseed local dev.
- Personal workspaces created in migration for existing users, at signup for new users — guarantees `workspaceId` is never NULL.
- Team Sidekiqs stay with team workspace (no copying). Clean 1:1 mapping from `teamId` to `workspaceId`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-workspace-schema-migration*
*Context gathered: 2026-01-27*
