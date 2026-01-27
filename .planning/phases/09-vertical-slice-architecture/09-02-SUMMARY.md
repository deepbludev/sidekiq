---
phase: 09-vertical-slice-architecture
plan: 02
subsystem: ui
tags: [shadcn-ui, design-system, sidebar-layout, theme, icons, vertical-slices, shared-infrastructure]
requires:
  - phase: 09-01
    provides: "Path aliases (@sidekiq/ui/*, @sidekiq/shared/*) and directory skeleton (shared/ui/, shared/icons/, shared/theme/, shared/layout/)"
provides:
  - "27 shadcn/ui primitives importable from @sidekiq/ui/*"
  - "Theme provider and toggle at @sidekiq/shared/theme/*"
  - "Provider icon components at @sidekiq/shared/icons/*"
  - "6 sidebar layout shell components at @sidekiq/shared/layout/*"
  - "All 124+ import statements updated across 95 files"
affects:
  - 09-03 (chats feature slice imports from @sidekiq/ui/*)
  - 09-04 (sidekiqs + AI slices import from @sidekiq/ui/*)
  - 09-05 (auth + user + workspace slices import from @sidekiq/ui/*)
  - 09-06 (barrel files + final verification)
tech-stack:
  added: []
  patterns:
    - "Relative imports between sibling UI components in shared/ui/"
    - "Layout shell in shared/layout/ referencing feature panels via alias paths"
    - "Sidebar barrel re-exports layout components from shared/layout/"
key-files:
  created: []
  modified:
    - sidekiq-webapp/src/shared/ui/ (27 shadcn/ui component files)
    - sidekiq-webapp/src/shared/icons/provider-icons.tsx
    - sidekiq-webapp/src/shared/theme/theme-provider.tsx
    - sidekiq-webapp/src/shared/theme/theme-toggle.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-layout.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-icon-rail.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-panel.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-mobile-overlay.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-mobile-tabs.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-search.tsx
    - sidekiq-webapp/src/components/sidebar/index.ts (barrel updated)
    - ~60 consumer files (import path updates)
key-decisions:
  - decision: "Use relative imports between sibling UI components in shared/ui/"
    reason: "Components like form.tsx importing label.tsx are co-located; relative paths are cleaner and avoid circular alias resolution"
  - decision: "Layout shell references feature panels via @sidekiq/components/sidebar/ alias"
    reason: "Feature panels haven't moved yet (Plans 03-05); alias path allows them to resolve through fallback while preserving explicit dependency"
  - decision: "Update sidebar barrel to re-export layout components from shared/layout/"
    reason: "Provides backward compatibility for any imports via barrel during migration period"
patterns-established:
  - "UI design system layer: all shadcn/ui primitives under src/shared/ui/"
  - "Cross-concern shared code: theme, icons, layout shell under src/shared/{theme,icons,layout}/"
  - "Import convention: @sidekiq/ui/* for UI primitives, @sidekiq/shared/{dir}/* for other shared code"
duration: ~9 minutes
completed: 2026-01-27
---

# Phase 9 Plan 2: Shared UI Migration Summary

Moved 36 shared client-side files (27 shadcn/ui primitives, 2 theme components, 1 icon component, 6 sidebar layout shell components) to `src/shared/` and updated 124+ import statements across 95 files to use `@sidekiq/ui/*` and `@sidekiq/shared/*` paths.

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~9 minutes |
| Start | 2026-01-27T21:18:16Z |
| End | 2026-01-27T21:27:50Z |
| Tasks | 2/2 |
| Files changed | 95 |
| Tests passing | 664/664 (34 test files) |

## Accomplishments

1. **27 UI primitives relocated** -- All shadcn/ui components moved from `components/ui/` to `shared/ui/` with internal cross-imports converted to relative paths (5 files: alert-dialog, command, dialog, form, toggle-group)

2. **Icons + theme relocated** -- `provider-icons.tsx` moved to `shared/icons/`, `theme-provider.tsx` and `theme-toggle.tsx` moved to `shared/theme/` with imports updated to `@sidekiq/ui/*`

3. **Sidebar layout shell relocated** -- 6 layout components (sidebar-layout, sidebar-icon-rail, sidebar-panel, sidebar-mobile-overlay, sidebar-mobile-tabs, sidebar-search) moved to `shared/layout/` with UI imports updated and feature panel references using alias paths

4. **124+ imports updated across 60+ consumer files** -- All `@sidekiq/components/ui/` changed to `@sidekiq/ui/`, `@sidekiq/components/theme/` to `@sidekiq/shared/theme/`, `@sidekiq/components/icons/` to `@sidekiq/shared/icons/`, and sidebar layout imports to `@sidekiq/shared/layout/`

5. **Sidebar barrel updated** -- `components/sidebar/index.ts` re-exports layout components from `shared/layout/` while keeping feature-specific panel exports pointing to local files

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Move UI primitives, icons, theme + fix all imports | 8f5a38f | 30 files moved, 56 consumer files updated |
| 2 | Move sidebar layout shell + fix sidebar imports | 5613650 | 6 files moved, barrel + 2 test files updated |

## Files Created/Modified

### Moved (36 files)
- `components/ui/*.tsx` (27 files) -> `shared/ui/*.tsx`
- `components/icons/provider-icons.tsx` -> `shared/icons/provider-icons.tsx`
- `components/theme/{theme-provider,theme-toggle}.tsx` -> `shared/theme/`
- `components/sidebar/sidebar-{layout,icon-rail,panel,mobile-overlay,mobile-tabs,search}.tsx` -> `shared/layout/`

### Modified (internal imports within moved files)
- `shared/ui/alert-dialog.tsx` -- buttonVariants import to relative
- `shared/ui/command.tsx` -- Dialog imports to relative
- `shared/ui/dialog.tsx` -- Button import to relative
- `shared/ui/form.tsx` -- Label import to relative
- `shared/ui/toggle-group.tsx` -- toggleVariants import to relative
- `shared/theme/theme-toggle.tsx` -- toggle-group import to @sidekiq/ui/
- `shared/layout/sidebar-{layout,icon-rail,mobile-overlay,search}.tsx` -- UI imports to @sidekiq/ui/
- `shared/layout/sidebar-{panel,mobile-overlay}.tsx` -- Feature panel imports to alias paths

### Modified (barrel file)
- `components/sidebar/index.ts` -- Re-export layout from shared/layout/, keep feature panels local

### Modified (consumer imports, ~60 files)
- All app pages, auth forms, chat components, model-picker, sidekiq forms, team dialogs, thread components
- 4 sidebar feature panels (UI imports)
- 3 test files (import paths)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Relative imports between sibling UI components | Co-located files (form -> label) use relative paths; cleaner than alias and avoids circular resolution |
| Layout shell references feature panels via alias | Feature panels haven't moved yet; alias path resolves through @sidekiq/* fallback |
| Sidebar barrel re-exports layout from shared/ | Backward compatibility during migration; any barrel consumers keep working |
| Include all consumer import updates in Task 1 | Pre-commit hook (lint-staged + eslint) requires buildable project state per commit |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] sidebar-panel-chats.tsx relative import to sidebar-search broke after move**
- **Found during:** Task 2
- **Issue:** `sidebar-panel-chats.tsx` (still in `components/sidebar/`) imported `./sidebar-search` which had moved to `shared/layout/`
- **Fix:** Updated to `@sidekiq/shared/layout/sidebar-search`
- **Files modified:** `src/components/sidebar/sidebar-panel-chats.tsx`
- **Committed in:** 5613650

**2. [Rule 3 - Blocking] Two sidebar test files referenced old paths**
- **Found during:** Task 2 (tsc verification)
- **Issue:** `sidebar-mobile-overlay.test.tsx` and `sidebar-panel.test.tsx` imported from `@sidekiq/components/sidebar/sidebar-*` (layout files that moved)
- **Fix:** Updated to `@sidekiq/shared/layout/sidebar-*`
- **Files modified:** `tests/unit/components/sidebar/sidebar-mobile-overlay.test.tsx`, `tests/unit/components/sidebar/sidebar-panel.test.tsx`
- **Committed in:** 5613650

**3. [Rule 3 - Blocking] Pre-commit hook requires buildable state per commit**
- **Found during:** Task 1 commit attempt
- **Issue:** lint-staged + eslint TypeScript plugin requires all imports to resolve; committing only file moves without import updates caused cascading type errors
- **Fix:** Combined file moves with all consumer import updates in Task 1 commit; Task 2 focused on sidebar layout moves + their imports
- **Impact:** Task boundary shifted slightly -- Task 1 includes consumer import updates that the plan assigned to Task 2
- **Committed in:** 8f5a38f

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. Task boundary adjustment was required by pre-commit hook constraints. Final outcome matches plan exactly.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 09-03 (Chats Feature Slice) is unblocked:
- All UI primitives importable from `@sidekiq/ui/*`
- Theme, icons, and layout shell in `src/shared/`
- Sidebar feature panels (`sidebar-panel-chats`, `sidebar-thread-list`, `sidebar-thread-group`) remain in `components/sidebar/` ready to move to `features/chats/`
- Path aliases for `@sidekiq/chats` and `@sidekiq/chats/*` are configured

---
*Phase: 09-vertical-slice-architecture*
*Completed: 2026-01-27*
