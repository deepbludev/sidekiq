---
phase: quick-013
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/lib/team-permissions.test.ts
  - sidekiq-webapp/tests/unit/validations/team.test.ts
  - sidekiq-webapp/tests/unit/components/team/team-avatar.test.tsx
autonomous: true

must_haves:
  truths:
    - "All 10 team permission functions have comprehensive test coverage"
    - "All 12 team validation schemas are tested for valid/invalid inputs"
    - "TeamAvatar component renders correctly for initials and emoji types"
    - "All new tests pass alongside existing test suite"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/lib/team-permissions.test.ts"
      provides: "Permission function tests"
      min_lines: 150
    - path: "sidekiq-webapp/tests/unit/validations/team.test.ts"
      provides: "Team schema validation tests"
      min_lines: 200
    - path: "sidekiq-webapp/tests/unit/components/team/team-avatar.test.tsx"
      provides: "TeamAvatar component tests"
      min_lines: 50
  key_links:
    - from: "sidekiq-webapp/tests/unit/lib/team-permissions.test.ts"
      to: "src/lib/team-permissions.ts"
      via: "direct import"
      pattern: "import.*team-permissions"
    - from: "sidekiq-webapp/tests/unit/validations/team.test.ts"
      to: "src/lib/validations/team.ts"
      via: "direct import"
      pattern: "import.*validations/team"
---

<objective>
Add comprehensive unit tests for Phase 8 (Team Foundation) covering team permissions, team validation schemas, and the TeamAvatar component.

Purpose: Verify the core team logic (pure permission functions, Zod schemas, avatar component) has proper test coverage matching existing test patterns in the codebase.
Output: Three new test files covering team permissions, validations, and TeamAvatar component.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/lib/team-permissions.ts
@sidekiq-webapp/src/lib/validations/team.ts
@sidekiq-webapp/src/components/team/team-avatar.tsx

# Existing test patterns to follow:
@sidekiq-webapp/tests/unit/validations/sidekiq.test.ts
@sidekiq-webapp/tests/unit/lib/avatar.test.ts
@sidekiq-webapp/tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Team permissions unit tests</name>
  <files>sidekiq-webapp/tests/unit/lib/team-permissions.test.ts</files>
  <action>
Create comprehensive unit tests for all 10 pure functions exported from `src/lib/team-permissions.ts`. Follow the pattern from `tests/unit/lib/avatar.test.ts` (import from vitest, describe/it blocks).

Test each function with all role combinations:

**canInvite(userRole):**
- owner -> true, admin -> true, member -> false, null -> false

**canRemoveMember(userRole, targetRole, isSelf):**
- owner removes admin -> true
- owner removes member -> true
- owner removes owner -> false (there's only one owner)
- owner removes self -> false (isSelf=true)
- admin removes member -> true
- admin removes admin -> false
- admin removes owner -> false
- admin removes self -> false
- member removes anyone -> false
- null removes anyone -> false

**canChangeRole(userRole, targetRole, newRole):**
- owner changes admin to member -> true
- owner changes member to admin -> true
- owner changes owner -> false (can't change own role)
- admin changes member to admin -> true
- admin changes admin to member -> true
- admin changes anyone to owner -> false
- admin changes owner -> false
- member changes anything -> false
- null changes anything -> false

**canTransferOwnership(userRole):**
- owner -> true, admin -> false, member -> false, null -> false

**canDeleteTeam(userRole):**
- owner -> true, admin -> false, member -> false, null -> false

**canLeaveTeam(userRole):**
- admin -> true, member -> true, owner -> false

**canRevokeInvite(userRole):**
- owner -> true, admin -> true, member -> false, null -> false

**canUpdateTeam(userRole):**
- owner -> true, admin -> true, member -> false, null -> false

**getRoleIcon(role):**
- owner -> "crown", admin -> "shield", member -> null

**getRoleLabel(role):**
- owner -> "Owner", admin -> "Admin", member -> "Member"

Use `describe` blocks per function with `it` for each case. Use concise test names like "should return true for owner" / "should return false for member".
  </action>
  <verify>Run `cd sidekiq-webapp && npx vitest run tests/unit/lib/team-permissions.test.ts` - all tests pass</verify>
  <done>All 10 permission functions tested with every role combination, all tests green</done>
</task>

<task type="auto">
  <name>Task 2: Team validation schema tests</name>
  <files>sidekiq-webapp/tests/unit/validations/team.test.ts</files>
  <action>
Create unit tests for all Zod schemas in `src/lib/validations/team.ts`. Follow the exact pattern from `tests/unit/validations/sidekiq.test.ts` (safeParse, check result.success, check error messages).

**teamAvatarSchema:** Already tested via sidekiqAvatarSchema (it's a re-export). Add 1-2 tests confirming parity.

**createTeamSchema:**
- Accept valid {name, avatar} with default avatar
- Accept name at boundary (1 char, 100 chars)
- Reject empty name -> error message "Team name is required"
- Reject name > 100 chars -> error message "Team name must be at most 100 characters"
- Verify default avatar applied when not provided: {type: "initials", color: "#6366f1"}

**updateTeamSchema:**
- Accept valid {id, name} partial update
- Accept {id} only (no other fields)
- Accept {id, avatar} update
- Reject missing id
- Reject empty id -> "Team ID is required"

**deleteTeamSchema:**
- Accept valid {id}
- Reject empty id -> "Team ID is required"
- Reject missing id

**inviteMemberSchema:**
- Accept valid {teamId, email, sendEmail}
- Reject invalid email -> "Invalid email address"
- Reject empty teamId -> "Team ID is required"
- Verify email transforms to lowercase (parse "TEST@EXAMPLE.COM" -> "test@example.com")
- Verify default sendEmail=true

**acceptInviteSchema:**
- Accept valid {token}
- Reject empty token -> "Invite token is required"
- Reject missing token

**revokeInviteSchema:**
- Accept valid {inviteId}
- Reject empty inviteId -> "Invite ID is required"

**resendInviteSchema:**
- Accept valid {inviteId}
- Reject empty inviteId -> "Invite ID is required"

**removeMemberSchema:**
- Accept valid {teamId, userId}
- Reject empty teamId -> "Team ID is required"
- Reject empty userId -> "User ID is required"

**changeRoleSchema:**
- Accept valid {teamId, userId, newRole: "admin"}
- Accept {teamId, userId, newRole: "member"}
- Reject newRole: "owner" (not in enum)
- Reject missing newRole

**transferOwnershipSchema:**
- Accept valid {teamId, newOwnerId}
- Reject empty teamId -> "Team ID is required"
- Reject empty newOwnerId -> "New owner ID is required"

**leaveTeamSchema:**
- Accept valid {teamId}
- Reject empty teamId -> "Team ID is required"

**getTeamByIdSchema:**
- Accept valid {id}
- Reject empty id -> "Team ID is required"
  </action>
  <verify>Run `cd sidekiq-webapp && npx vitest run tests/unit/validations/team.test.ts` - all tests pass</verify>
  <done>All 13 team validation schemas tested with valid/invalid inputs, boundary cases, and error messages verified</done>
</task>

<task type="auto">
  <name>Task 3: TeamAvatar component tests</name>
  <files>sidekiq-webapp/tests/unit/components/team/team-avatar.test.tsx</files>
  <action>
Create unit tests for the TeamAvatar component at `src/components/team/team-avatar.tsx`. Follow the pattern from `tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx` (render, screen, describe/it).

Tests to write:

**Rendering:**
- Renders initials from team name (pass name="Code Team", verify "CT" appears in document)
- Renders emoji when avatar type is emoji (pass avatar with type:"emoji", emoji:"🚀", verify emoji appears)
- Renders with custom background color (verify style includes backgroundColor)
- Uses rounded-lg class (not rounded-full) to distinguish from user avatars

**Sizes:**
- Renders with default md size (has "size-8" class)
- Renders with sm size (has "size-6" class)
- Renders with lg size (has "size-10" class)
- Renders with xl size (has "size-12" class)

**Edge cases:**
- Handles single-word team name (e.g., "Engineering" -> "EN")
- Handles single-character team name (e.g., "A" -> "A")
- Applies custom className prop

Use a helper function `renderTeamAvatar` with sensible defaults like the `renderDialog` helper pattern.
  </action>
  <verify>Run `cd sidekiq-webapp && npx vitest run tests/unit/components/team/team-avatar.test.tsx` - all tests pass</verify>
  <done>TeamAvatar tested for all sizes, avatar types, rounded-lg distinction, and edge cases</done>
</task>

</tasks>

<verification>
Run the full unit test suite to confirm no regressions:
```bash
cd sidekiq-webapp && npx vitest run tests/unit/
```
All existing tests plus 3 new test files pass.
</verification>

<success_criteria>
- 3 new test files created in correct directories
- Team permissions: ~35+ individual test cases covering all 10 functions
- Team validations: ~40+ individual test cases covering all 13 schemas
- TeamAvatar: ~10+ test cases covering rendering, sizes, edge cases
- All tests pass with zero failures
- Existing test suite unaffected (no regressions)
</success_criteria>

<output>
After completion, create `.planning/quick/013-update-unit-test-suite-with-phase-8-test/013-SUMMARY.md`
</output>
