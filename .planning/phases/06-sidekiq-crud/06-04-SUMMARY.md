---
phase: "06"
plan: "04"
subsystem: sidekiq-crud
tags: [form, react-hook-form, zod, preview, validation]

dependency-graph:
  requires:
    - phase: "06-01"
      provides: "sidekiqRouter with CRUD operations"
    - phase: "06-02"
      provides: "useSidekiqActions hook, avatar utilities"
  provides:
    - SidekiqForm component with React Hook Form
    - SidekiqPreview live preview component
    - /sidekiqs/new create page
  affects: [06-05, 06-06, 07-sidekiq-integration]

tech-stack:
  added: []
  patterns:
    - "sidekiqFormSchema without Zod defaults for form state"
    - "useWatch for live preview updates"
    - "beforeunload for unsaved changes warning"
    - "Auto-generated avatar color from name hash"

files:
  created:
    - sidekiq-webapp/src/components/sidekiq/sidekiq-form.tsx
    - sidekiq-webapp/src/components/sidekiq/sidekiq-preview.tsx
    - sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/page.tsx
    - sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/layout.tsx
  modified:
    - sidekiq-webapp/src/lib/validations/sidekiq.ts

decisions:
  - id: form-schema-no-defaults
    choice: "Separate sidekiqFormSchema without Zod defaults"
    reason: "React Hook Form defaultValues conflicts with Zod schema defaults"
  - id: avatar-type-narrowing
    choice: "Explicit type assertion for watched avatar"
    reason: "useWatch returns partial types, need to ensure avatar has required fields"
  - id: split-layout-responsive
    choice: "Preview hidden on lg breakpoint"
    reason: "Form needs space on smaller screens, preview is bonus for desktop"

metrics:
  duration: "9min"
  completed: "2026-01-24"
---

# Phase 06 Plan 04: Create Form Summary

**One-liner:** React Hook Form with Zod validation, live preview panel, and /sidekiqs/new page with breadcrumb navigation.

## Execution Results

### Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Create Sidekiq preview component | Done | c168dc1 |
| 2 | Create Sidekiq form component | Done | 2755c50 |
| 3 | Create /sidekiqs/new page | Done | f6c1402 |

### Key Artifacts

**SidekiqPreview (`src/components/sidekiq/sidekiq-preview.tsx`):**
- Live card preview with avatar, name, description
- Conversation starters display (max 4 shown)
- Mock chat preview showing how responses will appear
- Real-time updates as user types

**SidekiqForm (`src/components/sidekiq/sidekiq-form.tsx`):**
- React Hook Form with zodResolver
- Name, description, instructions fields
- Character counters with color indicators (green/amber/red)
- Auto-generated avatar color on name change
- beforeunload warning for unsaved changes
- Split layout: form left, preview right (lg+ screens)

**Create Page (`src/app/(dashboard)/sidekiqs/new/page.tsx`):**
- Breadcrumb: Sidekiqs > Create New
- Page title and description header
- Integrated SidekiqForm in create mode

### Schema Addition

Added `sidekiqFormSchema` to validations:
- Same fields as `createSidekiqSchema` but without Zod defaults
- Required for React Hook Form where defaults are provided via `defaultValues`
- Type: `SidekiqFormValues`

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form schema approach | Separate sidekiqFormSchema | Zod .default() conflicts with RHF defaultValues - schema expects input type, form tracks output type |
| Avatar type handling | Explicit narrowing check | useWatch returns DeepPartial, need to verify type and color exist before using |
| Preview visibility | Hidden below lg breakpoint | Form needs full width on tablet/mobile, preview is enhancement for desktop |
| Character count display | Always visible with color thresholds | 90%+ amber, 100% red - provides clear feedback |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Schema type mismatch with React Hook Form**
- **Found during:** Task 2 (SidekiqForm implementation)
- **Issue:** `createSidekiqSchema` has Zod defaults which create input/output type mismatch with useForm
- **Fix:** Created separate `sidekiqFormSchema` without defaults for form validation
- **Files modified:** sidekiq-webapp/src/lib/validations/sidekiq.ts
- **Committed in:** 2755c50

**2. [Rule 1 - Bug] useWatch returns partial types for avatar**
- **Found during:** Task 2 (SidekiqForm implementation)
- **Issue:** `watchedValues.avatar` could have undefined type/color fields during hydration
- **Fix:** Added explicit type narrowing check before passing to SidekiqPreview
- **Files modified:** sidekiq-webapp/src/components/sidekiq/sidekiq-form.tsx
- **Committed in:** 2755c50

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)

## Must-Haves Verification

| Truth | Verified |
|-------|----------|
| User can navigate to /sidekiqs/new and see create form | Yes - page renders with form |
| Form has fields for name, description, and instructions | Yes - all three FormField components |
| Form validates inputs inline as user types | Yes - mode: "onChange" in useForm |
| Split layout shows form on left, preview on right | Yes - grid lg:grid-cols-2 |
| Breadcrumb navigation shows: Sidekiqs > Create New | Yes - Breadcrumb component with Link |

## Next Phase Readiness

**Ready for 06-05 (Edit page):** The form component supports both create and edit modes via the `mode` prop. Edit page will:
- Pass `initialData` with existing Sidekiq data
- Pass `mode="edit"`
- Use same form/preview components

**Dependencies verified:**
- SidekiqForm exported and working
- SidekiqPreview exported and working
- sidekiqFormSchema and SidekiqFormValues exported from validations

---

*Phase: 06-sidekiq-crud*
*Completed: 2026-01-24*
