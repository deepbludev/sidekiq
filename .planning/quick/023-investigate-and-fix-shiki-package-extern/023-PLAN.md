---
phase: quick-023
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/package.json
  - sidekiq-webapp/pnpm-lock.yaml
autonomous: true

must_haves:
  truths:
    - "Next.js build no longer emits 'Package shiki can't be external' warning"
    - "Streamdown code highlighting continues to work in chat messages"
  artifacts:
    - path: "sidekiq-webapp/package.json"
      provides: "shiki as direct dependency"
      contains: "shiki"
  key_links:
    - from: "sidekiq-webapp/package.json"
      to: "node_modules/shiki"
      via: "pnpm install hoists shiki to project node_modules"
      pattern: "shiki"
---

<objective>
Fix the "Package shiki can't be external" warning during Next.js build.

Purpose: `@streamdown/code` depends on `shiki` (syntax highlighting), but pnpm's strict isolation means shiki only exists deep in `.pnpm/` and is NOT accessible from the project root `node_modules/`. Next.js has `shiki` on its default `serverExternalPackages` list and tries to resolve it from the project directory, which fails. The fix is to add `shiki` as a direct dependency so pnpm creates the root-level symlink Next.js expects.

Output: Clean Next.js build with no shiki externalization warning.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@sidekiq-webapp/package.json
@sidekiq-webapp/next.config.js
@sidekiq-webapp/src/features/chats/components/message-content.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add shiki as direct dependency and verify build</name>
  <files>sidekiq-webapp/package.json, sidekiq-webapp/pnpm-lock.yaml</files>
  <action>
    1. From `sidekiq-webapp/`, run `pnpm add shiki` to add shiki as a direct dependency. The @streamdown/code package already depends on shiki@^3.19.0 (currently resolving to 3.21.0), so pnpm should deduplicate to the same version.

    2. After install, verify shiki is now accessible at the project root level:
       - `ls node_modules/shiki` should show the package (symlink created by pnpm)

    3. Run the Next.js dev server briefly (or `pnpm build` if a build script exists) and confirm the "Package shiki can't be external" warning is gone. Capture build output and grep for "shiki" to verify absence of the warning.

    4. Verify streamdown code plugin still works by checking that the import chain is intact:
       - `@streamdown/code` imports shiki internally
       - `message-content.tsx` imports `createCodePlugin` from `@streamdown/code`
       - No TypeScript errors: run `pnpm tsc --noEmit` (or equivalent type-check command)

    NOTE: Do NOT modify `next.config.js` to add `serverExternalPackages` config. The issue is that shiki wasn't resolvable from the project root, not that it needs to be added/removed from the externals list. Adding shiki as a direct dep is the correct fix per the Next.js warning message itself ("Try to install it into the project directory").
  </action>
  <verify>
    - `pnpm build` (or dev server startup) completes without "Package shiki can't be external" warning
    - `ls sidekiq-webapp/node_modules/shiki` shows the package exists
    - `pnpm tsc --noEmit` passes (no type errors introduced)
  </verify>
  <done>shiki is a direct dependency in package.json, pnpm lockfile updated, Next.js build warning eliminated, no regressions in type checking or streamdown code highlighting</done>
</task>

</tasks>

<verification>
- Run `pnpm build` in sidekiq-webapp and confirm zero warnings mentioning "shiki" or "can't be external"
- Confirm `node_modules/shiki` directory exists at project root level
- TypeScript compilation passes without errors
</verification>

<success_criteria>
- The "Package shiki can't be external" build warning is completely eliminated
- shiki appears in package.json dependencies
- No new warnings or errors introduced
- @streamdown/code continues to function (code highlighting in chat messages)
</success_criteria>

<output>
After completion, create `.planning/quick/023-investigate-and-fix-shiki-package-extern/023-SUMMARY.md`
</output>
