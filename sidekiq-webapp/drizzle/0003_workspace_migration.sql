-- Workspace Schema Migration
-- Transforms team model to workspace model:
-- 1. Rename team_role enum -> workspace_role
-- 2. Create workspace_type enum
-- 3. Rename team -> workspace table + add new columns (type, description)
-- 4. Rename team_member -> workspace_member table + rename team_id -> workspace_id
-- 5. Rename team_invite -> workspace_invite table + rename team_id -> workspace_id
-- 6. Rename sidekiq.team_id -> sidekiq.workspace_id
-- 7. Add thread.workspace_id (NOT NULL FK to workspace)
-- 8. Rename/create all indexes

-- Step 1: Rename team_role enum to workspace_role
-- NOTE: ALTER TYPE ... RENAME cannot run inside a transaction
ALTER TYPE "team_role" RENAME TO "workspace_role";

--> statement-breakpoint

-- Step 2: Create workspace_type enum
CREATE TYPE "workspace_type" AS ENUM ('personal', 'team');

--> statement-breakpoint

-- Step 3: Rename team table to workspace
ALTER TABLE "team" RENAME TO "workspace";

--> statement-breakpoint

-- Step 4: Add type column to workspace (NOT NULL with default for migration safety)
ALTER TABLE "workspace" ADD COLUMN "type" "workspace_type" NOT NULL DEFAULT 'team';

--> statement-breakpoint

-- Step 5: Remove the default (schema.ts doesn't define one)
ALTER TABLE "workspace" ALTER COLUMN "type" DROP DEFAULT;

--> statement-breakpoint

-- Step 6: Add description column to workspace
ALTER TABLE "workspace" ADD COLUMN "description" varchar(500);

--> statement-breakpoint

-- Step 7: Rename team_member table to workspace_member
ALTER TABLE "team_member" RENAME TO "workspace_member";

--> statement-breakpoint

-- Step 8: Rename team_id column in workspace_member to workspace_id
ALTER TABLE "workspace_member" RENAME COLUMN "team_id" TO "workspace_id";

--> statement-breakpoint

-- Step 9: Rename team_invite table to workspace_invite
ALTER TABLE "team_invite" RENAME TO "workspace_invite";

--> statement-breakpoint

-- Step 10: Rename team_id column in workspace_invite to workspace_id
ALTER TABLE "workspace_invite" RENAME COLUMN "team_id" TO "workspace_id";

--> statement-breakpoint

-- Step 11: Rename team_id column in sidekiq to workspace_id
ALTER TABLE "sidekiq" RENAME COLUMN "team_id" TO "workspace_id";

--> statement-breakpoint

-- Step 12: Add workspace_id column to thread table
-- Since local dev databases are wiped and re-seeded, NOT NULL is safe.
-- Adding a temporary default to handle any existing rows during migration.
ALTER TABLE "thread" ADD COLUMN "workspace_id" text;

--> statement-breakpoint

-- Step 13: Add NOT NULL constraint after column creation
-- (In dev, tables will be empty; this is defensive for any edge case)
ALTER TABLE "thread" ALTER COLUMN "workspace_id" SET NOT NULL;

--> statement-breakpoint

-- Step 14: Add foreign key constraint for thread.workspace_id
ALTER TABLE "thread" ADD CONSTRAINT "thread_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- Step 15: Update foreign key constraints on renamed tables/columns
-- Drop old FK constraints that reference old table/column names
ALTER TABLE "workspace" DROP CONSTRAINT IF EXISTS "team_owner_id_user_id_fk";

--> statement-breakpoint

ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "workspace_member" DROP CONSTRAINT IF EXISTS "team_member_team_id_team_id_fk";

--> statement-breakpoint

ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "workspace_member" DROP CONSTRAINT IF EXISTS "team_member_user_id_user_id_fk";

--> statement-breakpoint

ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "workspace_invite" DROP CONSTRAINT IF EXISTS "team_invite_team_id_team_id_fk";

--> statement-breakpoint

ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "sidekiq" DROP CONSTRAINT IF EXISTS "sidekiq_team_id_team_id_fk";

--> statement-breakpoint

ALTER TABLE "sidekiq" ADD CONSTRAINT "sidekiq_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint

-- Step 16: Drop old indexes
DROP INDEX IF EXISTS "team_owner_idx";

--> statement-breakpoint

DROP INDEX IF EXISTS "team_member_team_idx";

--> statement-breakpoint

DROP INDEX IF EXISTS "team_member_user_idx";

--> statement-breakpoint

DROP INDEX IF EXISTS "team_member_unique";

--> statement-breakpoint

DROP INDEX IF EXISTS "team_invite_team_idx";

--> statement-breakpoint

DROP INDEX IF EXISTS "team_invite_email_idx";

--> statement-breakpoint

DROP INDEX IF EXISTS "team_invite_token_idx";

--> statement-breakpoint

DROP INDEX IF EXISTS "sidekiq_team_idx";

--> statement-breakpoint

-- Step 17: Create new indexes for workspace tables
CREATE INDEX "workspace_owner_idx" ON "workspace" USING btree ("owner_id");

--> statement-breakpoint

CREATE INDEX "workspace_type_idx" ON "workspace" USING btree ("type");

--> statement-breakpoint

CREATE UNIQUE INDEX "workspace_personal_unique" ON "workspace" USING btree ("owner_id") WHERE "type" = 'personal';

--> statement-breakpoint

CREATE INDEX "workspace_member_workspace_idx" ON "workspace_member" USING btree ("workspace_id");

--> statement-breakpoint

CREATE INDEX "workspace_member_user_idx" ON "workspace_member" USING btree ("user_id");

--> statement-breakpoint

CREATE UNIQUE INDEX "workspace_member_unique" ON "workspace_member" USING btree ("workspace_id", "user_id");

--> statement-breakpoint

CREATE INDEX "workspace_invite_workspace_idx" ON "workspace_invite" USING btree ("workspace_id");

--> statement-breakpoint

CREATE INDEX "workspace_invite_email_idx" ON "workspace_invite" USING btree ("email");

--> statement-breakpoint

CREATE INDEX "workspace_invite_token_idx" ON "workspace_invite" USING btree ("token");

--> statement-breakpoint

CREATE INDEX "sidekiq_workspace_idx" ON "sidekiq" USING btree ("workspace_id");

--> statement-breakpoint

CREATE INDEX "thread_workspace_idx" ON "thread" USING btree ("workspace_id");
