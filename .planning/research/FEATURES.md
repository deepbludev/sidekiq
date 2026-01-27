# Feature Research: Workspace Model for AI Chat Application

**Domain:** Workspace model, content isolation, assistant sharing, and message regeneration for a premium AI chat application
**Researched:** 2026-01-27
**Confidence:** HIGH (verified against ChatGPT, Claude, Slack, Notion, Linear, T3.chat workspace implementations)

---

## Executive Summary

Workspaces have become the foundational organizational primitive in modern SaaS products. Every major AI chat platform (ChatGPT Business/Enterprise, Claude Teams, T3.chat) now uses workspace-level isolation as the boundary for content, permissions, and billing. The industry consensus is clear: **treat personal accounts as single-user workspaces** with the same data model as team workspaces. This eliminates special-casing, simplifies queries, and provides a natural upgrade path from personal to team usage.

Sidekiq's existing "team" model already captures most of the data needed. The migration to workspaces is primarily a conceptual reframing (teams become workspaces) plus adding: (1) automatic personal workspace creation on signup, (2) a workspace switcher in the sidebar, (3) workspaceId scoping on threads and sidekiqs, and (4) workspace-scoped Sidekiq sharing with permission levels.

Key insight from Slack's architecture evolution: **workspace-per-entity isolation works early but becomes a bottleneck if you need cross-workspace sharing later.** For Sidekiq v0.2, strict workspace isolation is correct. Plan for (but do not build) cross-workspace features.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users of any workspace-enabled SaaS product expect. Missing these makes the workspace model feel broken or incomplete.

#### Workspace Foundation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Personal workspace auto-created on signup** | Every user needs somewhere to put their content from day one. ChatGPT, Notion, Loom, Linear all auto-create a personal workspace. Without it, new users hit a blank wall. | Low | Create during user registration flow. Personal workspace = workspace with single member (owner). No special-casing needed if personal workspaces use the same schema as team workspaces. |
| **Workspace switcher in sidebar** | Users in multiple workspaces need a fast way to switch context. Slack, Notion, Linear, ChatGPT all place this in the top-left of the sidebar. It is the single most universal SaaS workspace pattern. | Medium | Top-left sidebar dropdown showing all workspaces user belongs to. Show workspace name + avatar. Must visually indicate active workspace at all times. |
| **Full content isolation per workspace** | When you switch workspaces, you see only that workspace's content. ChatGPT: "data and resources do not overlap between personal and Enterprise environments." Slack, Notion: same strict isolation. | Medium | All threads and sidekiqs scoped to active workspace via workspaceId foreign key. Every tRPC query must filter by active workspace. This is the hardest part to get right -- every data access path must be workspace-aware. |
| **Workspace members with roles** | Any multi-user workspace needs role-based access. ChatGPT Business: owner + member. Claude Teams: owner/admin/member. Linear: owner/admin/member. Existing Sidekiq team model already has owner/admin/member. | Low | Already built as team_member with role enum. Migration: rename team tables to workspace tables, reuse existing role infrastructure. |
| **Invite members to workspace** | Standard SaaS collaboration pattern. ChatGPT Business, Claude Teams, Slack, Notion, Linear all use email-based invitations. | Low | Already built as team_invite. Reuse existing invite flow, just rename "team" to "workspace" in UI copy. |
| **Workspace name and avatar** | Every workspace needs an identity. Required for the workspace switcher to be usable. | Low | Already exists on teams table (name + avatar JSONB). |

#### Workspace Switching UX

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Instant context switch** | Switching workspaces changes everything: sidebar content, chat threads, sidekiqs, settings context. Users expect this to be immediate (not a page reload). ChatGPT: "you will immediately enter the selected workspace's environment." | Medium | Client-side: update active workspace in React state/context, invalidate all workspace-scoped TanStack Query caches. Should not require page navigation -- just data refetch. |
| **Clear visual indicator of active workspace** | Users must always know which workspace they are in. Slack shows workspace name prominently at top. Notion shows it in sidebar header. Without this, users accidentally put content in the wrong workspace. | Low | Workspace name + avatar displayed in sidebar header, always visible. Use distinct colors/avatars per workspace to aid quick recognition. |
| **Persist last active workspace** | When user returns to app, they should land in their last-used workspace, not be forced to pick every time. | Low | Store lastActiveWorkspaceId in user preferences (JSONB). Restore on app load. |

#### Sidekiq Sharing Within Workspace

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Share Sidekiq with workspace members** | Core value proposition: teams share custom AI assistants. ChatGPT: GPTs can be published to workspace. Claude Projects: team-visible projects. This is the primary collaboration feature for AI chat apps. | Medium | Sidekiq gets workspaceId FK. When workspaceId is set and isPublic is true, all workspace members can use it. Owner keeps edit control. |
| **"Can use" vs "Can edit" permission model** | Claude's permission model for shared projects is the gold standard: simple two-level permissions. ChatGPT: chat only / view / edit. Avoid complexity of fine-grained RBAC for v0.2. | Medium | Use existing canTeamEdit boolean on sidekiqs table (rename to canWorkspaceEdit). "Can use" = can start chats with shared Sidekiq. "Can edit" = can modify instructions, name, description. |
| **Personal Sidekiqs remain private by default** | Users creating Sidekiqs in a team workspace expect their Sidekiqs to be private until explicitly shared. ChatGPT: GPTs are private by default. Claude: projects are private by default. | Low | Sidekiqs default to isPublic: false. User must explicitly share. Sidekiqs in personal workspace are always private (no one else to share with). |

#### Message Regeneration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Regenerate last AI response** | Table stakes for any AI chat app since 2023. ChatGPT, Claude, T3.chat, Gemini all have this. Existing Sidekiq has a "coming soon" placeholder. Users expect to retry when AI gives a poor response. | Low | Vercel AI SDK provides `regenerate()` function on `useChat` hook. Call it, it replaces the last assistant message. Button should appear on hover over the last assistant message. Disabled during streaming. |
| **Regeneration replaces current response** | Standard behavior: regeneration replaces the last assistant message, does not append a new one. This is what ChatGPT, Claude, and the Vercel AI SDK `regenerate()` do natively. | Low | Vercel AI SDK handles this automatically. "The AI provider will regenerate the last message and replace the current one correspondingly." No custom logic needed. |

---

### Differentiators (Competitive Advantage)

Features that set Sidekiq apart. Not expected in every workspace implementation, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Workspace-scoped Sidekiq library** | Dedicated sidebar panel showing all Sidekiqs available in the current workspace (personal + shared). Unlike ChatGPT where GPTs are buried in a separate "Explore" page, Sidekiq puts them front-and-center in the sidebar. Already built as icon rail panel. | Low | Already exists as sidebar panel. Just filter by active workspace. Show "shared" badge on Sidekiqs from other workspace members. |
| **Model selection per workspace** | Workspace admins can set a default model for the workspace, overriding user preference. Enterprise teams want standardization. No competitor does this well -- ChatGPT limits by plan, not by workspace choice. | Medium | Add defaultModel to workspace table. Model priority chain becomes: thread > sidekiq > workspace > user > system default. |
| **Workspace-aware thread context** | Threads show which Sidekiq (and workspace) they belong to. When switching workspaces, the correct threads appear. Sidekiq already has Sidekiq indicators in sidebar -- extend to workspace context. | Low | Already partially built (sidekiq visual indicators). Add workspace badge/indicator to thread list items when viewing threads from a workspace context. |
| **Seamless team-to-workspace migration** | Existing Sidekiq users with teams get automatic workspace migration with zero data loss. Competitors like ChatGPT forced users to "merge" personal into enterprise (permanent, irreversible). Sidekiq should migrate cleanly. | Medium | Rename team -> workspace in DB. Existing team members become workspace members. Existing team sidekiqs keep their workspace association. Create personal workspaces for all existing users. |
| **Expanded model list** | More model options than competitors. T3.chat leads here with 14+ models. Expanding Vercel AI Gateway model list gives users more choice, reinforcing Sidekiq's "model agnostic" positioning. | Low | Configuration-only change. Add all available Vercel AI Gateway models to the supported models list. No architecture changes. |
| **Keyboard shortcut for workspace switching** | Linear is the UX benchmark here. Cmd+K opens command palette for everything. Adding workspace switching to the command palette (if it exists) or a dedicated shortcut matches the power-user UX Sidekiq targets. | Low | Add workspace switching to a future command palette, or use a dedicated shortcut. Low priority for v0.2 but worth noting. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build for v0.2. These are tempting but introduce complexity that isn't justified yet.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Cross-workspace Sidekiq sharing** | Users want to use a great Sidekiq from one workspace in another. | Breaks workspace isolation model. Slack learned this the hard way -- cross-workspace channels required a complete re-architecture (Unified Grid). Creates permission nightmares: which workspace owns it? Who can edit? | Keep strict isolation for v0.2. A user can manually recreate a Sidekiq in another workspace. Consider import/export JSON as a bridge (already in pending todos). |
| **Workspace merge/migration** | ChatGPT offers "merge personal into enterprise." Users will ask for this. | ChatGPT's merge is permanent and irreversible. Users lose control of personal content. Creates ownership ambiguity. Complex data migration. | Keep workspaces separate. Personal workspace is always yours. Team workspaces are collaborative. No merge needed if both exist independently. |
| **Workspace-level billing** | Enterprise customers expect per-workspace billing. | Premature for v0.2. No payment system exists yet. Adding billing complexity to workspace model before validating core workspace UX is a mistake. | Defer to payments milestone. Workspace model should be billing-ready (workspaceId exists as a natural billing entity) but not billing-aware. |
| **Workspace-level custom instructions** | ChatGPT has workspace-level custom instructions. Teams want standardized AI behavior. | Adds a new layer to the already-complex model priority chain (thread > sidekiq > workspace instructions > user > default). Confuses users about what instructions are active. | Use workspace-scoped shared Sidekiqs as the mechanism for standardized behavior. A team can share a "Company Voice" Sidekiq instead of workspace instructions. |
| **Workspace admin panel** | Admins want a dedicated settings page for workspace management. | Large UX surface area. Role management, member management, invite management, settings, audit logs. Building this properly is a phase unto itself. | Reuse existing team management UI (already built in v0.1). Rename "Team" to "Workspace" in settings. Member/invite management already works. Defer advanced admin features. |
| **Nested workspaces / sub-workspaces** | Notion has "teamspaces within workspaces." Large orgs want hierarchy. | Extreme complexity for no v0.2 benefit. Nested permission models are the #1 cause of authorization bugs. Sidekiq targets small teams, not enterprises with hundreds of sub-teams. | Flat workspace model. One level. A user can be in multiple workspaces. If someone needs separation within a workspace, they create Sidekiqs for different topics. |
| **Real-time workspace activity feed** | Slack shows who's online, what's happening. Users might expect workspace awareness. | Requires WebSocket infrastructure, presence tracking, activity logging. Far beyond v0.2 scope. | No activity feed. Users see shared Sidekiqs and their own threads. Social features are not core to AI chat value prop. |
| **Conversation branching / forking on regenerate** | When regenerating, save the old response as a branch. ChatGPT does this with "previous versions" UI. | Significantly complicates message data model. parentMessageId schema support exists but UI for branching is Very High complexity. Already marked as v2 feature in PROJECT.md. | Simple regeneration: replace the last message. No branch history for v0.2. Users can copy important responses before regenerating if needed. |

---

## Feature Dependencies

Understanding what depends on what is critical for phasing.

```
Workspace Foundation (must be first)
├── workspaces table (rename from teams)
├── workspace_members table (rename from team_members)
├── workspace_invites table (rename from team_invites)
└── Personal workspace auto-creation
    └── On user signup (trigger/hook in auth flow)

Content Isolation (depends on Foundation)
├── threads table gets workspaceId FK
├── sidekiqs table workspaceId FK (already exists as teamId)
├── All tRPC queries add workspace filter
├── Active workspace state in React context
└── TanStack Query cache invalidation on workspace switch

Workspace Switcher (depends on Foundation + Isolation)
├── Sidebar header dropdown component
├── Workspace list query (user's workspaces)
├── Active workspace persistence (user preferences)
└── Full context switch on selection

Sidekiq Sharing (depends on Isolation)
├── isPublic flag on sidekiqs (already exists)
├── canWorkspaceEdit permission (already exists as canTeamEdit)
├── Shared Sidekiq listing in sidebar
└── Permission checks in Sidekiq CRUD operations

Message Regeneration (independent -- no workspace dependency)
├── regenerate() from useChat hook
├── Regenerate button UI on assistant messages
└── Button state management (disabled during streaming)

Expanded Model List (independent -- no workspace dependency)
└── Configuration update for Vercel AI Gateway models
```

### Dependency Key Insight

Message regeneration and expanded model list are **completely independent** of workspace features. They can be built in parallel or in any order. Workspace features must be built in order: foundation -> isolation -> switcher -> sharing.

---

## MVP Definition

### Launch With (v0.2)

These features constitute the v0.2 workspace milestone:

1. **Workspace data model migration** (teams -> workspaces) -- foundation for everything
2. **Personal workspace auto-creation** on signup -- every user gets a workspace immediately
3. **Content isolation** (threads + sidekiqs scoped to workspace) -- data integrity
4. **Workspace switcher** in sidebar -- users can switch context
5. **Active workspace persistence** -- return to last workspace on app load
6. **Sidekiq sharing within workspace** -- core collaboration value
7. **Permission model** (can use / can edit) for shared Sidekiqs
8. **Regenerate message button** -- table stakes AI chat feature, independent of workspaces
9. **Expanded model list** -- configuration change, independent of workspaces

### Add After Validation (v0.3+)

Features to add once workspace model is validated with real usage:

- **Workspace-level default model** -- workspace admins set default model for all members
- **Workspace settings panel** -- dedicated settings page (beyond reused team settings)
- **Sidekiq usage analytics** -- which shared Sidekiqs are popular in a workspace
- **Workspace onboarding flow** -- guided setup for new workspaces with templates
- **Shared Sidekiq discovery** -- browse all shared Sidekiqs in workspace (beyond sidebar list)
- **Workspace member activity** -- who created what, last active time

### Future Consideration (v1+)

Features for much later, after core product-market fit:

- Cross-workspace Sidekiq sharing (requires careful isolation architecture)
- Workspace-level custom instructions
- Nested workspaces / teamspaces (Notion model)
- Workspace-level billing and usage tracking
- Workspace admin audit logs
- Workspace templates (pre-configured Sidekiqs for common use cases)
- Public Sidekiq marketplace (shared across all workspaces)
- Workspace-level API keys

---

## Feature Prioritization Matrix

| Feature | User Impact | Implementation Effort | Risk | Priority |
|---------|-------------|----------------------|------|----------|
| Personal workspace auto-creation | HIGH (every new user) | LOW | LOW | P0 |
| Content isolation (workspace scoping) | HIGH (data integrity) | MEDIUM (every query) | MEDIUM (missing scope = data leak) | P0 |
| Workspace switcher UI | HIGH (usability) | MEDIUM | LOW | P0 |
| Regenerate message button | HIGH (table stakes) | LOW (SDK support) | LOW | P0 |
| Workspace data model migration | HIGH (foundation) | MEDIUM (DB migration) | MEDIUM (data preservation) | P0 |
| Sidekiq sharing within workspace | HIGH (collaboration) | MEDIUM | LOW (builds on existing) | P1 |
| Permission model (use/edit) | MEDIUM (governance) | LOW (fields exist) | LOW | P1 |
| Expanded model list | MEDIUM (differentiation) | LOW (config only) | LOW | P1 |
| Active workspace persistence | MEDIUM (convenience) | LOW | LOW | P1 |
| Workspace default model | LOW (admin feature) | LOW | LOW | P2 (defer to v0.3) |
| Keyboard shortcut for switching | LOW (power users) | LOW | LOW | P2 (defer) |

---

## Competitor Feature Analysis

### Workspace Model Comparison

| Feature | ChatGPT Business | Claude Teams | Slack | Notion | Linear | T3.chat | Sidekiq v0.2 Target |
|---------|-----------------|-------------|-------|--------|--------|---------|-------------------|
| **Personal workspace** | Yes (default) | Yes (implicit) | N/A (no personal) | Yes (default) | Yes (separate) | Yes (implicit) | Yes (auto-created) |
| **Team workspace** | Yes (Business/Enterprise) | Yes (Teams/Enterprise) | Yes (core model) | Yes (with teamspaces) | Yes (core model) | Upcoming | Yes (rename from teams) |
| **Workspace switcher location** | Profile icon dropdown (top-right) | Sidebar (top-left) | Sidebar (top-left) | Sidebar (top-left) | Sidebar (top-left) | N/A | Sidebar (top-left) |
| **Switching mechanism** | Click profile > select workspace | Sidebar dropdown | Sidebar dropdown | Sidebar dropdown | Sidebar dropdown | N/A | Sidebar dropdown |
| **Content isolation** | Full (no overlap) | Full (per workspace) | Full (per workspace) | Full (per workspace) | Full (per workspace) | N/A | Full (per workspace) |
| **Shared assistants** | GPTs (up to 100 shares) | Projects (public/private) | N/A | N/A | N/A | N/A | Sidekiqs (workspace-scoped) |
| **Permission levels** | Chat only / View / Edit | Can View / Can Edit | N/A | Can View / Can Edit / Full | N/A | N/A | Can Use / Can Edit |
| **Default private** | Yes | Yes | N/A | Yes (personal workspace) | N/A | N/A | Yes |
| **Member roles** | Owner + Member | Owner / Admin / Member | Owner / Admin / Member | Owner / Admin / Member + Guest | Owner / Admin / Member | N/A | Owner / Admin / Member |
| **Workspace merge** | Yes (permanent, irreversible) | No | No | No | No | N/A | No (deliberate choice) |
| **Cross-workspace sharing** | No | No | Yes (Enterprise Grid, XWS channels) | No (paid plan per workspace) | No | N/A | No (v0.2 scope) |
| **Regenerate message** | Yes (with version history) | Yes (simple replace) | N/A | N/A | N/A | Yes | Yes (simple replace) |

### Key Takeaways from Competitor Analysis

1. **Sidebar top-left is the universal placement** for workspace switcher (4 out of 5 products). Only ChatGPT puts it in the top-right profile area. Sidekiq should follow the majority pattern (top-left sidebar).

2. **Full content isolation is non-negotiable.** Every product that has workspaces enforces complete data separation. ChatGPT explicitly states "data and resources do not overlap."

3. **Personal workspace as default workspace** is standard. ChatGPT, Notion, Linear all give users a personal space automatically. Users should never see an empty state because of missing workspace.

4. **Simple permission models win.** Claude's "Can View / Can Edit" is cleaner than ChatGPT's three-level system. Two levels is enough for v0.2.

5. **No workspace merge.** ChatGPT's merge feature is the only one in the industry, and it is explicitly "permanent and cannot be undone." Avoiding this complexity is the right call.

6. **Regeneration is simple replace.** Claude and the Vercel AI SDK both treat regeneration as a replacement of the last message. ChatGPT's version history is a differentiator but not table stakes. Simple replace is correct for v0.2.

7. **Slack's architecture lesson:** Starting with workspace-per-entity isolation is correct, but plan data models to allow future cross-workspace features without a Slack-scale re-architecture.

---

## Implementation Notes for Existing Codebase

### Schema Migration Path (teams -> workspaces)

The existing schema already has most of what workspaces need:

| Existing Table | Rename To | Changes Needed |
|---------------|-----------|----------------|
| `team` | `workspace` | Add `type` enum (personal/team), add `isPersonal` boolean |
| `team_member` | `workspace_member` | No structural changes |
| `team_invite` | `workspace_invite` | No structural changes |
| `team_role` enum | `workspace_role` enum | No value changes (owner/admin/member) |
| `sidekiq.teamId` | `sidekiq.workspaceId` | Rename FK column |
| `thread` | `thread` | Add `workspaceId` FK (new column) |

### Critical: threads currently lack workspace scoping

The `thread` table currently has `userId` but no `teamId`/`workspaceId`. This means threads are user-scoped, not workspace-scoped. **Adding `workspaceId` to threads is the single most important schema change** for workspace isolation. Without it, workspace switching cannot filter threads by workspace.

### Vercel AI SDK Regeneration

The `useChat` hook provides a `regenerate()` function. Implementation is straightforward:

```typescript
const { regenerate, status } = useChat();
// Button disabled unless status === 'ready' || status === 'error'
```

The SDK handles message replacement automatically. No custom logic needed for the basic case.

---

## Sources

### ChatGPT Workspaces
- [What is a ChatGPT Enterprise workspace? How can I switch workspaces?](https://help.openai.com/en/articles/8265430-what-is-a-chatgpt-enterprise-workspace-how-can-i-switch-workspaces) -- HIGH confidence (official OpenAI docs)
- [Workspace management for ChatGPT Business](https://help.openai.com/en/articles/8542216-workspace-management-for-chatgpt-business) -- HIGH confidence
- [How to share GPTs within workspaces](https://help.openai.com/en/articles/9083988-how-to-share-gpts-within-workspaces) -- HIGH confidence
- [Shared edit access for custom GPTs](https://help.openai.com/en/articles/10658904-shared-edit-access-for-custom-gpts) -- HIGH confidence
- [Workspace settings](https://help.openai.com/en/articles/8411955-what-workspace-settings-can-i-control-for-my-workspace) -- HIGH confidence

### Claude Teams & Projects
- [Project visibility and sharing](https://support.claude.com/en/articles/9519189-project-visibility-and-sharing) -- HIGH confidence (official Anthropic docs)
- [Claude AI Team Workspaces](https://www.datastudios.org/post/claude-ai-team-workspaces-collaboration-billing-and-data-retention-explained) -- MEDIUM confidence
- [How Anthropic's Projects are revolutionizing AI teamwork](https://venturebeat.com/ai/anthropic-ai-assistant-claude-just-got-a-massive-upgrade-heres-what-you-need-to-know) -- MEDIUM confidence

### Slack Architecture
- [Unified Grid: How We Re-Architected Slack](https://slack.engineering/unified-grid-how-we-re-architected-slack-for-our-largest-customers/) -- HIGH confidence (official Slack engineering)
- [Deep Dive: Slack's Multi-Tenancy Architecture](https://dev.to/devcorner/deep-dive-slacks-multi-tenancy-architecture-m38) -- MEDIUM confidence
- [Changing the Model: Why and How We Re-Architected Slack](https://www.infoq.com/presentations/slack-rearchitecture/) -- HIGH confidence (QCon talk)

### Notion Workspaces
- [Intro to workspaces](https://www.notion.com/help/intro-to-workspaces) -- HIGH confidence (official Notion docs)
- [Create, join & leave workspaces](https://www.notion.com/help/create-delete-and-switch-workspaces) -- HIGH confidence
- [Switching between work and personal accounts](https://www.notion.com/help/guides/a-notion-guide-on-switching-between-work-and-personal-accounts) -- HIGH confidence

### Linear Workspaces
- [Workspaces - Linear Docs](https://linear.app/docs/workspaces) -- HIGH confidence (official Linear docs)
- [Support for multiple workspaces - Linear Changelog](https://linear.app/changelog/2020-06-09) -- HIGH confidence

### T3.chat
- [T3 Chat AI Review 2026](https://techfixai.com/t3-chat-ai-review/) -- MEDIUM confidence
- [The Ultimate Multi-LLM Tool: T3 Chat](https://invernessdesignstudio.com/the-ultimate-multi-llm-tool-t3-chat) -- MEDIUM confidence

### Multi-Tenant SaaS Architecture
- [The developer's guide to SaaS multi-tenant architecture (WorkOS)](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture) -- HIGH confidence
- [Ultimate guide to multi-tenant SaaS data modeling (Flightcontrol)](https://www.flightcontrol.dev/blog/ultimate-guide-to-multi-tenant-saas-data-modeling) -- HIGH confidence
- [Build a multi-tenant SaaS application (Logto)](https://logto.medium.com/build-a-multi-tenant-saas-application-a-complete-guide-from-design-to-implementation-d109d041f253) -- MEDIUM confidence
- [Tenant isolation (AWS)](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html) -- HIGH confidence

### Workspace Switching UX
- [Breaking Down the UX of Switching Accounts in Web Apps](https://medium.com/ux-power-tools/breaking-down-the-ux-of-switching-accounts-in-web-apps-501813a5908b) -- MEDIUM confidence
- [Ways to Design Account Switchers & App Switchers](https://medium.com/ux-power-tools/ways-to-design-account-switchers-app-switchers-743e05372ede) -- MEDIUM confidence

### Vercel AI SDK (Regeneration)
- [AI SDK UI: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) -- HIGH confidence (official Vercel docs, verified via WebFetch)
