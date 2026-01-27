---
phase: quick-017
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/app/page.tsx
  - sidekiq-webapp/src/app/(dashboard)/dashboard/page.tsx
  - sidekiq-webapp/src/app/(dashboard)/dashboard/sign-out-button.tsx
  - sidekiq-webapp/src/middleware.ts
  - sidekiq-webapp/src/app/(auth)/layout.tsx
  - sidekiq-webapp/src/app/(auth)/sign-in/page.tsx
  - sidekiq-webapp/src/app/(auth)/sign-up/page.tsx
  - sidekiq-webapp/src/components/auth/sign-in-form.tsx
  - sidekiq-webapp/src/components/auth/sign-up-form.tsx
  - sidekiq-webapp/src/components/auth/oauth-buttons.tsx
  - sidekiq-webapp/tests/unit/middleware.test.ts
  - sidekiq-webapp/tests/e2e/auth.spec.ts
autonomous: true

must_haves:
  truths:
    - "Authenticated users landing on '/' are redirected to '/chat'"
    - "Authenticated users on auth pages are redirected to '/chat'"
    - "After sign-in/sign-up, users land on '/chat' (not '/dashboard')"
    - "The '/dashboard' route no longer exists"
    - "All existing unit and E2E tests pass with updated routes"
  artifacts:
    - path: "sidekiq-webapp/src/middleware.ts"
      provides: "Redirect authenticated users from auth routes to /chat instead of /dashboard"
      contains: "/chat"
    - path: "sidekiq-webapp/src/app/page.tsx"
      provides: "Root page redirects authenticated users to /chat"
      contains: "redirect(\"/chat\")"
  key_links:
    - from: "sidekiq-webapp/src/middleware.ts"
      to: "/chat"
      via: "NextResponse.redirect"
      pattern: "new URL\\(\"/chat\""
    - from: "sidekiq-webapp/src/app/page.tsx"
      to: "/chat"
      via: "next/navigation redirect"
      pattern: "redirect\\(\"/chat\"\\)"
---

<objective>
Replace the dashboard page with /chat as the default landing page for authenticated users.

Purpose: The dashboard page (`/dashboard`) is a leftover from Phase 0.1 auth setup — it just shows a "Welcome" card with the user's name. Since Sidekiq is a chat application, /chat is the natural landing experience. Every redirect and default callback currently pointing to `/dashboard` must point to `/chat` instead, and the dashboard route + files must be deleted.

Output: All auth flows redirect to /chat, dashboard files removed, tests updated.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/middleware.ts
@sidekiq-webapp/src/app/page.tsx
@sidekiq-webapp/src/app/(dashboard)/dashboard/page.tsx
@sidekiq-webapp/src/app/(dashboard)/dashboard/sign-out-button.tsx
@sidekiq-webapp/src/app/(auth)/layout.tsx
@sidekiq-webapp/src/app/(auth)/sign-in/page.tsx
@sidekiq-webapp/src/app/(auth)/sign-up/page.tsx
@sidekiq-webapp/src/components/auth/sign-in-form.tsx
@sidekiq-webapp/src/components/auth/sign-up-form.tsx
@sidekiq-webapp/src/components/auth/oauth-buttons.tsx
@sidekiq-webapp/tests/unit/middleware.test.ts
@sidekiq-webapp/tests/e2e/auth.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace all /dashboard references with /chat and delete dashboard files</name>
  <files>
    sidekiq-webapp/src/app/page.tsx
    sidekiq-webapp/src/middleware.ts
    sidekiq-webapp/src/app/(auth)/layout.tsx
    sidekiq-webapp/src/app/(auth)/sign-in/page.tsx
    sidekiq-webapp/src/app/(auth)/sign-up/page.tsx
    sidekiq-webapp/src/components/auth/sign-in-form.tsx
    sidekiq-webapp/src/components/auth/sign-up-form.tsx
    sidekiq-webapp/src/components/auth/oauth-buttons.tsx
    sidekiq-webapp/src/app/(dashboard)/dashboard/page.tsx (DELETE)
    sidekiq-webapp/src/app/(dashboard)/dashboard/sign-out-button.tsx (DELETE)
  </files>
  <action>
    Replace every occurrence of "/dashboard" with "/chat" in the following files. These are all simple string replacements — no logic changes needed:

    1. **sidekiq-webapp/src/app/page.tsx** (line 11): Change `redirect("/dashboard")` to `redirect("/chat")`
    2. **sidekiq-webapp/src/middleware.ts** (line 47): Change `new URL("/dashboard", request.url)` to `new URL("/chat", request.url)`. Also update the JSDoc comment on line 25 from "to /dashboard" to "to /chat".
    3. **sidekiq-webapp/src/app/(auth)/layout.tsx** (line 17): Change `redirect("/dashboard")` to `redirect("/chat")`
    4. **sidekiq-webapp/src/app/(auth)/sign-in/page.tsx** (line 11): Change fallback from `"/dashboard"` to `"/chat"`
    5. **sidekiq-webapp/src/app/(auth)/sign-up/page.tsx** (line 11): Change fallback from `"/dashboard"` to `"/chat"`
    6. **sidekiq-webapp/src/components/auth/sign-in-form.tsx** (line 31): Change default prop from `"/dashboard"` to `"/chat"`
    7. **sidekiq-webapp/src/components/auth/sign-up-form.tsx** (line 30): Change default prop from `"/dashboard"` to `"/chat"`
    8. **sidekiq-webapp/src/components/auth/oauth-buttons.tsx** (line 18): Change default prop from `"/dashboard"` to `"/chat"`

    Then DELETE the entire dashboard directory and its files:
    - `rm -rf sidekiq-webapp/src/app/(dashboard)/dashboard/`

    This removes `page.tsx` (DashboardPage) and `sign-out-button.tsx` (SignOutButton). The SignOutButton is only used by DashboardPage — sign-out functionality exists elsewhere in the sidebar.
  </action>
  <verify>
    Run `grep -r "/dashboard" sidekiq-webapp/src/ --include="*.ts" --include="*.tsx"` — should return zero results (except possibly JSDoc comments in layout files that reference the route group name "(dashboard)", which is the Next.js folder name, not the route).

    Verify the dashboard directory is gone: `ls sidekiq-webapp/src/app/\(dashboard\)/dashboard/` should fail with "No such file or directory".

    Run `npx tsc --noEmit` from sidekiq-webapp/ to confirm no TypeScript errors from broken imports.
  </verify>
  <done>
    All "/dashboard" route references replaced with "/chat". Dashboard page and sign-out-button deleted. No TypeScript compilation errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update unit and E2E tests to reflect /chat as the default route</name>
  <files>
    sidekiq-webapp/tests/unit/middleware.test.ts
    sidekiq-webapp/tests/e2e/auth.spec.ts
  </files>
  <action>
    Update test assertions and descriptions to use /chat instead of /dashboard:

    **sidekiq-webapp/tests/unit/middleware.test.ts:**
    - Line 100-108: Change test name from "redirect to sign-in from dashboard" to "redirect to sign-in from chat" (or another protected route like "/chat"). Change `createMockRequest("/dashboard")` to `createMockRequest("/chat")` and update `callbackUrl=%2Fdashboard` assertion to `callbackUrl=%2Fchat`.
    - Lines 128-158: In the "auth routes (authenticated)" describe block, all four tests assert `toContain("/dashboard")` — change all to `toContain("/chat")`.
    - Lines 166-170: Change test name to reference /chat. Change `createMockRequest("/dashboard")` to `createMockRequest("/chat")`.

    **sidekiq-webapp/tests/e2e/auth.spec.ts:**
    - Lines 100-107: Update test name and assertions. Change `page.goto("/dashboard")` to `page.goto("/chat")`. Change URL assertion from `%2Fdashboard` to `%2Fchat`.
    - Lines 109-115: Same pattern — update `page.goto("/dashboard")` and URL assertion.
    - Line 167: Update `page.goto("/sign-in?callbackUrl=%2Fdashboard")` to `page.goto("/sign-in?callbackUrl=%2Fchat")`.
  </action>
  <verify>
    Run unit tests: `cd sidekiq-webapp && npx vitest run tests/unit/middleware.test.ts` — all tests must pass.

    For E2E tests, just verify no syntax errors: `npx tsc --noEmit` (E2E tests require a running server so we verify structure only).
  </verify>
  <done>
    All test files updated to reference /chat instead of /dashboard. Unit tests pass. No TypeScript errors.
  </done>
</task>

</tasks>

<verification>
1. `grep -r "/dashboard" sidekiq-webapp/src/ --include="*.ts" --include="*.tsx"` returns no route references (the `(dashboard)` folder name in paths is a Next.js route group, not a URL route — that is fine).
2. `ls sidekiq-webapp/src/app/\(dashboard\)/dashboard/` fails — directory deleted.
3. `cd sidekiq-webapp && npx tsc --noEmit` passes — no broken imports.
4. `cd sidekiq-webapp && npx vitest run tests/unit/middleware.test.ts` — all tests pass.
5. `grep -r "/dashboard" sidekiq-webapp/tests/ --include="*.ts"` returns no results.
</verification>

<success_criteria>
- Authenticated users are redirected to /chat (not /dashboard) from: root page, auth pages, middleware redirect, sign-in/sign-up callbacks
- The /dashboard route and its files (page.tsx, sign-out-button.tsx) are deleted
- All unit tests pass with updated route assertions
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/017-replace-dashboard-with-chat-landing/017-SUMMARY.md`
</output>
