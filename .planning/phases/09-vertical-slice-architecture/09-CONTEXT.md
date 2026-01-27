# Phase 9: Vertical Slice Architecture - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganize the codebase from horizontal layers (components/, hooks/, server/) to feature-driven vertical slices under `src/features/`, with shared cross-cutting code in `src/shared/`. All existing tests pass with zero behavior changes. This is a structural refactor only — no new capabilities.

</domain>

<decisions>
## Implementation Decisions

### Feature boundaries
- **Domain-based slicing** — 7 feature slices: `chats`, `sidekiqs`, `auth`, `user`, `ai`, `workspace`, `billing`
- Sidebar sections are **distributed across features** — each feature owns its sidebar section, a shared layout component composes them
- Design system with atomic design lives in `src/shared/ui/` — separate from feature-specific components
- `workspace` gets its own slice now (not deferred to Phase 10), making future migration cleaner
- Next.js `app/` pages remain as **thin routing wrappers** that import and render feature components

### Shared vs feature-owned
- Database infrastructure (Drizzle client, connection, migrations, schema) moves to `src/shared/db/`
- tRPC infrastructure (router factory, procedures, context) moves to `src/shared/trpc/`
- Root tRPC router stays in `src/app/api/trpc/` — imports and merges feature routers
- Claude's Discretion: contents of `src/shared/` beyond ui/, db/, trpc/ (determine based on actual cross-cutting usage)

### Directory structure
- **Hybrid internal structure**: top-level concern folders (`components/`, `hooks/`, `api/`) with sub-grouping allowed inside `components/` for complex features
- **Barrel files required**: each feature has `index.ts` exporting its public API
- **Types co-located**: types defined next to the files that use them (not in a separate types/ folder)
- **Hooks hybrid rule**: co-locate if used by one component, move to `hooks/` if shared across multiple components in the feature
- **Unit tests co-located**: `chat-input.test.ts` next to `chat-input.tsx`
- **E2E tests**: dedicated separate folder (not co-located with source)
- Claude's Discretion: Zod schema placement, constants organization, atomic design depth (atoms-only vs atoms+molecules+organisms), barrel file strategy for shared/

### Import rules
- **Cross-feature imports allowed via barrel file only** — features can import from another feature's `index.ts`, not from internal paths
- **Strict dependency layering**: `shared/` -> `features/` -> `app/`. Each layer only imports from layers below.
- **Path aliases**: keep `@sidekiq/` prefix with short aliases — `@sidekiq/chats` maps to `src/features/chats/index.ts`
- **Internal imports use relative paths** — aliases only for cross-feature and shared imports
- Claude's Discretion: shared alias strategy (`@sidekiq/shared/*` vs flattened), ESLint enforcement vs convention-only, cross-feature state sharing mechanism (context via barrel vs shared state layer)

### Intra-slice layering
- **Single `api/` folder** for all server-side code within a feature; everything else is frontend
- **Three server layers**: `api/router.ts` (tRPC procedures), `api/service.ts` (business logic), `api/queries.ts` (db operations)
- `/api/chat` route handler: business logic moves to `src/features/chats/api/`, route handler in `app/api/chat/` is a thin wrapper
- Claude's Discretion: api/ barrel file strategy (separate from feature barrel, or unified)

</decisions>

<specifics>
## Specific Ideas

- "I want domain-based slicing, more like: chats, sidekiqs, auth, user, ai" — business domains, not UI areas
- Wants a design system layer with atomic design organization in `src/shared/ui/`
- "Keep things simple but maintainable and scalable" — avoid over-engineering the layer structure
- Short aliases (`@sidekiq/chats`) preferred over verbose paths (`@sidekiq/features/chats`)

</specifics>

<deferred>
## Deferred Ideas

- **E2E test suite layering** — Analyze current E2E tests and organize into: smoke, sanity/feature, regression, UAT/exploratory. Separate initiative from codebase restructuring.

</deferred>

---

*Phase: 09-vertical-slice-architecture*
*Context gathered: 2026-01-27*
