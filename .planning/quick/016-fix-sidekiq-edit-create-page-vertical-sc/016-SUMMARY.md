# Quick Task 016: Fix Sidekiq Edit/Create Page Vertical Scroll Overflow

## Result: COMPLETE

## What Was Done

Added `h-full overflow-y-auto` to the outermost wrapper div on all three Sidekiq pages to enable vertical scrolling when content exceeds viewport height.

### Root Cause

The dashboard layout sets `overflow-hidden` on `<main>` (intentional for the chat page, which manages its own internal scroll). Sidekiq pages used a simple wrapper div with no scroll handling, so content that exceeded viewport height was clipped with no way to scroll.

### Changes

| File | Change |
|------|--------|
| `sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/page.tsx` | Added `h-full overflow-y-auto` to wrapper div |
| `sidekiq-webapp/src/app/(dashboard)/sidekiqs/[id]/edit/page.tsx` | Added `h-full overflow-y-auto` to all 3 wrapper divs (loading, error, main) |
| `sidekiq-webapp/src/app/(dashboard)/sidekiqs/page.tsx` | Added `h-full overflow-y-auto` to wrapper div |

### Commit

- `2997a19` — fix(quick-016): add vertical scroll to Sidekiq pages
